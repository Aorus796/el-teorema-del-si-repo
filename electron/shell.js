// Lógica pura del proceso principal de Electron.
//
// Invariante dura: este módulo NUNCA debe importar "electron" (ni estática
// ni dinámicamente). El servicio Docker `game` (usado por `npm run check`)
// no ejecuta `npm ci` y no tiene `node_modules`; si este archivo importara
// "electron", el quality gate se rompería con "Cannot find module
// 'electron'" incluso con la dependencia instalada en otros entornos.
//
// Todas las funciones reciben sus dependencias por parámetro (constructor
// de ventana, objeto `app`-like, logger, `isPackaged`, plataforma, etc.) en
// vez de leer globals de Electron directamente, para poder probarlas con
// `node:test` sin GUI ni proceso Electron real.

import { fileURLToPath } from "node:url";
import path from "node:path";

const noopLogger = {
  info() {},
  warn() {},
  error() {},
};

/**
 * Decide si deben abrirse las DevTools según el estado de empaquetado
 * inyectado. Solo se abren cuando `isPackaged` es explícitamente `false`
 * (build de desarrollo local de Electron); cualquier otro valor (incluido
 * `true` o `undefined`) resulta en no abrirlas, por seguridad.
 *
 * @param {boolean} isPackaged
 * @returns {boolean}
 */
export function shouldOpenDevTools(isPackaged) {
  return isPackaged === false;
}

/**
 * Construye las opciones seguras del `BrowserWindow` que renderiza el
 * juego. No acepta overrides de `webPreferences` para evitar que una
 * llamada externa debilite silenciosamente la configuración de seguridad
 * (sin `nodeIntegration`, `contextIsolation` siempre activo, `sandbox`
 * siempre activo, sin `webSecurity: false`, sin `preload`).
 *
 * `webPreferences.devTools` se fija de forma fail-closed reutilizando
 * `shouldOpenDevTools`: solo queda habilitado (`true`) cuando `isPackaged`
 * es explícitamente `false`; cualquier otro valor (incluido `true`,
 * `undefined` o un valor no booleano) lo deja en `false`, para que las
 * DevTools no queden accesibles (ni por apertura automática ni por atajo
 * de teclado) en una build empaquetada.
 *
 * @param {{ width?: number, height?: number, title?: string, isPackaged?: boolean }} [options]
 * @returns {object} Opciones listas para pasar a `new BrowserWindow(...)`.
 */
export function buildSecureWindowOptions({
  width = 1280,
  height = 800,
  title,
  isPackaged,
} = {}) {
  const options = {
    width,
    height,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: shouldOpenDevTools(isPackaged),
    },
  };

  if (title !== undefined) {
    options.title = title;
  }

  return options;
}

/**
 * Resuelve la ruta absoluta a `builds/browser/index.html`.
 *
 * Puede resolverse a partir de la ubicación del propio módulo (pasando
 * `moduleUrl`, típicamente `import.meta.url` del módulo que compone la
 * app, por ejemplo `electron/main.js`) o de una raíz de proyecto explícita
 * (`projectRoot`). Nunca depende de `process.cwd()` sin resolver.
 *
 * @param {{ moduleUrl?: string, projectRoot?: string }} options
 * @returns {string}
 */
export function resolveIndexHtmlPath({ moduleUrl, projectRoot } = {}) {
  let root = projectRoot;

  if (root === undefined) {
    if (moduleUrl === undefined) {
      throw new TypeError(
        "resolveIndexHtmlPath requiere moduleUrl o projectRoot."
      );
    }
    // moduleUrl se asume situado en <projectRoot>/electron/<archivo>.js
    root = path.dirname(path.dirname(fileURLToPath(moduleUrl)));
  }

  return path.join(root, "builds", "browser", "index.html");
}

/**
 * Crea un handler de `setWindowOpenHandler` que siempre deniega la
 * apertura de nuevas ventanas, sin llamar nunca a `shell.openExternal`
 * (el módulo `electron`).
 *
 * @param {{ warn: Function }} [logger]
 * @returns {(details: { url: string }) => { action: "deny" }}
 */
export function createWindowOpenHandler(logger = noopLogger) {
  return (details) => {
    logger.warn(`Blocked window.open request to: ${details?.url}`);
    return { action: "deny" };
  };
}

/**
 * Crea un handler de `will-navigate` que previene cualquier navegación
 * fuera de la URL local cargada (`allowedUrl`).
 *
 * @param {string} allowedUrl
 * @param {{ warn: Function }} [logger]
 * @returns {(event: { preventDefault: Function }, url: string) => void}
 */
export function createWillNavigateHandler(allowedUrl, logger = noopLogger) {
  return (event, url) => {
    if (url !== allowedUrl) {
      logger.warn(`Blocked navigation attempt to: ${url}`);
      event.preventDefault();
    }
  };
}

/**
 * Crea un handler de `will-attach-webview` que previene incondicionalmente
 * la creación de webviews embebidos.
 *
 * @param {{ warn: Function }} [logger]
 * @returns {(event: { preventDefault: Function }) => void}
 */
export function createWillAttachWebviewHandler(logger = noopLogger) {
  return (event) => {
    logger.warn("Blocked will-attach-webview attempt.");
    event.preventDefault();
  };
}

/**
 * Decide qué hacer con el resultado de
 * `app.requestSingleInstanceLock()`: si no se obtuvo el lock (ya hay otra
 * instancia corriendo), cierra la app sin crear ventana y devuelve
 * `false`. Si se obtuvo, devuelve `true` para que el llamador continúe
 * creando la ventana principal.
 *
 * @param {boolean} gotLock
 * @param {{ quit: Function }} appLike
 * @returns {boolean} `true` si debe continuar creando la ventana.
 */
export function handlePrimaryInstanceLock(gotLock, appLike) {
  if (!gotLock) {
    appLike.quit();
    return false;
  }
  return true;
}

/**
 * Handler para el evento `second-instance`: restaura (si está minimizada)
 * y enfoca la ventana existente dada, en vez de crear una nueva.
 *
 * @param {{ isMinimized: () => boolean, restore: Function, focus: Function } | null | undefined} existingWindow
 */
export function handleSecondInstance(existingWindow) {
  if (!existingWindow) return;

  if (existingWindow.isMinimized()) {
    existingWindow.restore();
  }
  existingWindow.focus();
}

/**
 * Handler para el evento `activate`: crea una ventana nueva únicamente si
 * la lista de ventanas dada está vacía.
 *
 * @param {Array<unknown>} windows
 * @param {Function} createWindow
 */
export function handleActivate(windows, createWindow) {
  if (windows.length === 0) {
    createWindow();
  }
}

/**
 * Handler para el evento `window-all-closed`: cierra la aplicación salvo
 * en `darwin`, donde las apps de macOS permanecen activas por convención
 * hasta que el usuario las cierra explícitamente con Cmd+Q.
 *
 * @param {string} platform
 * @param {{ quit: Function }} appLike
 */
export function handleWindowAllClosed(platform, appLike) {
  if (platform !== "darwin") {
    appLike.quit();
  }
}

/**
 * Carga el build local mediante la función `loadFile` inyectada. Si la
 * promesa resultante se rechaza, registra un error claro con el logger
 * inyectado y cierra la app mediante `appLike.quit()` — nunca carga una
 * URL remota como alternativa.
 *
 * @param {() => Promise<unknown>} loadFile
 * @param {{ error: Function }} logger
 * @param {{ quit: Function }} appLike
 * @returns {Promise<void>}
 */
export async function loadIndexHtmlSafely(loadFile, logger, appLike) {
  try {
    await loadFile();
  } catch (error) {
    logger.error("No se pudo cargar builds/browser/index.html:", error);
    appLike.quit();
  }
}
