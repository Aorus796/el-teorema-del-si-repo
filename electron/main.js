// Proceso principal de Electron: composición mínima. Sin lógica de
// negocio propia, sin IPC, sin preload, sin exponer APIs Node al
// renderer. Toda la lógica testeable vive en ./shell.js (que no importa
// "electron").

import { app, BrowserWindow } from "electron";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import {
  buildSecureWindowOptions,
  shouldOpenDevTools,
  resolveIndexHtmlPath,
  applyPersistencePolicy,
  createWindowOpenHandler,
  createWillNavigateHandler,
  createWillAttachWebviewHandler,
  handlePrimaryInstanceLock,
  handleSecondInstance,
  handleActivate,
  handleWindowAllClosed,
  loadIndexHtmlSafely,
} from "./shell.js";

const logger = console;

// Primera accion sincrona del modulo, antes de app.requestSingleInstanceLock()
// y de app.whenReady(): fija userData/sessionData en una ruta estable bajo
// el directorio de datos del usuario de Windows (ver "Estrategia de
// persistencia" en docs/production/WINDOWS_PACKAGING_DECISION.md). Si falla,
// cerramos con app.exit(1) (no app.quit(), cuyo efecto no esta garantizado
// antes de "ready") y no continuamos ejecutando el resto del archivo: no se
// solicita el lock de instancia unica, no se registra ningun handler de
// ciclo de vida, no se crea ninguna ventana.
const persistencePolicyApplied = applyPersistencePolicy({
  appDataPath: app.getPath("appData"),
  mkdir: fs.mkdirSync,
  appLike: app,
  logger,
});

if (!persistencePolicyApplied) {
  app.exit(1);
} else {
  const indexHtmlPath = resolveIndexHtmlPath({ moduleUrl: import.meta.url });
  const indexHtmlUrl = pathToFileURL(indexHtmlPath).href;

  let mainWindow = null;

  function createMainWindow() {
    const win = new BrowserWindow(buildSecureWindowOptions({ isPackaged: app.isPackaged }));

    win.webContents.setWindowOpenHandler(createWindowOpenHandler(logger));
    win.webContents.on("will-navigate", createWillNavigateHandler(indexHtmlUrl, logger));
    win.webContents.on("will-attach-webview", createWillAttachWebviewHandler(logger));

    loadIndexHtmlSafely(() => win.loadFile(indexHtmlPath), logger, app);

    if (shouldOpenDevTools(app.isPackaged)) {
      win.webContents.openDevTools();
    }

    win.on("closed", () => {
      if (mainWindow === win) {
        mainWindow = null;
      }
    });

    mainWindow = win;
    return win;
  }

  const gotLock = app.requestSingleInstanceLock();
  const shouldContinue = handlePrimaryInstanceLock(gotLock, app);

  if (shouldContinue) {
    app.on("second-instance", () => {
      handleSecondInstance(mainWindow);
    });

    app.whenReady().then(() => {
      createMainWindow();
    });

    app.on("activate", () => {
      handleActivate(BrowserWindow.getAllWindows(), createMainWindow);
    });

    app.on("window-all-closed", () => {
      handleWindowAllClosed(process.platform, app);
    });
  }
}
