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
import fs from "node:fs";

const noopLogger = {
  info() {},
  warn() {},
  error() {},
};

// Nombre tecnico de la carpeta de datos de usuario. Literal hardcodeado a
// proposito: NUNCA debe derivarse de app.getName(), app.name ni
// productName, para que la ruta de userData/sessionData permanezca
// estable entre builds aunque esos metadatos cambien (ver "Estrategia de
// persistencia" en docs/production/WINDOWS_PACKAGING_DECISION.md).
const USER_DATA_FOLDER_NAME = "el-teorema-del-si";
const SESSION_DATA_FOLDER_NAME = "chromium";

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
 * Calcula, de forma pura, las rutas absolutas de `userData` y
 * `sessionData` a partir de un `appDataPath` inyectado (nunca
 * `process.cwd()`, siempre `app.getPath("appData")` en el llamador real).
 * `sessionData` es siempre una subcarpeta de `userData`.
 *
 * @param {string} appDataPath
 * @returns {{ userDataPath: string, sessionDataPath: string }}
 */
export function computeUserDataPaths(appDataPath) {
  const userDataPath = path.join(appDataPath, USER_DATA_FOLDER_NAME);
  const sessionDataPath = path.join(userDataPath, SESSION_DATA_FOLDER_NAME);
  return { userDataPath, sessionDataPath };
}

/**
 * Aplica la politica de persistencia de `userData`/`sessionData`: crea
 * ambos directorios de forma recursiva (con la funcion `mkdir` sincrona
 * inyectada) y luego fija ambas rutas en el `appLike` inyectado
 * mediante `setPath`, en ese orden exacto (ambos `mkdir` antes que
 * cualquier `setPath`).
 *
 * Fail-closed y no destructiva: si `mkdir` lanza para cualquiera de las
 * dos rutas, se registra un error con el logger inyectado y la funcion
 * se detiene sin llamar a `setPath` en absoluto (ni para la ruta que si
 * se creo). Si `appLike.setPath` lanza para cualquiera de las dos
 * llamadas, se registra un error y no se continua con la siguiente
 * llamada a `setPath` pendiente. `mkdir` con `{ recursive: true }` sobre
 * un directorio ya existente no toca su contenido (comportamiento nativo
 * de Node), por lo que esta funcion nunca borra ni sobrescribe datos de
 * una instalacion previa.
 *
 * Devuelve `true` si la politica se aplico por completo, `false` si
 * fallo en cualquier punto, para que el llamador (`electron/main.js`)
 * pueda cerrar la aplicacion de forma controlada con `app.exit(1)` antes
 * de `app.requestSingleInstanceLock()`/`app.whenReady()`.
 *
 * @param {{
 *   appDataPath: string,
 *   mkdir?: (path: string, options: { recursive: boolean }) => unknown,
 *   appLike: { setPath: (name: string, path: string) => void },
 *   logger?: { error: Function },
 * }} options
 * @returns {boolean}
 */
export function applyPersistencePolicy({
  appDataPath,
  mkdir = fs.mkdirSync,
  appLike,
  logger = noopLogger,
}) {
  const { userDataPath, sessionDataPath } = computeUserDataPaths(appDataPath);

  try {
    mkdir(userDataPath, { recursive: true });
    mkdir(sessionDataPath, { recursive: true });
  } catch (error) {
    logger.error(
      "No se pudieron crear los directorios de persistencia (userData/sessionData):",
      error
    );
    return false;
  }

  try {
    appLike.setPath("userData", userDataPath);
    appLike.setPath("sessionData", sessionDataPath);
  } catch (error) {
    logger.error(
      "No se pudo fijar la ruta de persistencia (userData/sessionData) en la aplicacion:",
      error
    );
    return false;
  }

  return true;
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
