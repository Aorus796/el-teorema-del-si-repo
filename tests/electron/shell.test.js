import assert from "node:assert/strict";
import test from "node:test";
import { pathToFileURL } from "node:url";
import path from "node:path";
import {
  buildSecureWindowOptions,
  shouldOpenDevTools,
  resolveIndexHtmlPath,
  createWindowOpenHandler,
  createWillNavigateHandler,
  createWillAttachWebviewHandler,
  handlePrimaryInstanceLock,
  handleSecondInstance,
  handleActivate,
  handleWindowAllClosed,
  loadIndexHtmlSafely,
} from "../../electron/shell.js";

function createLoggerSpy() {
  const calls = { info: [], warn: [], error: [] };
  return {
    logger: {
      info: (...args) => calls.info.push(args),
      warn: (...args) => calls.warn.push(args),
      error: (...args) => calls.error.push(args),
    },
    calls,
  };
}

test("buildSecureWindowOptions produces a hardened BrowserWindow configuration", () => {
  const options = buildSecureWindowOptions();

  assert.equal(options.webPreferences.nodeIntegration, false);
  assert.equal(options.webPreferences.contextIsolation, true);
  assert.equal(options.webPreferences.sandbox, true);
  assert.equal(options.webPreferences.webSecurity, undefined);
  assert.equal(options.webPreferences.preload, undefined);
});

test("buildSecureWindowOptions honours width/height/title overrides without touching webPreferences", () => {
  const options = buildSecureWindowOptions({ width: 640, height: 480, title: "Test" });

  assert.equal(options.width, 640);
  assert.equal(options.height, 480);
  assert.equal(options.title, "Test");
  assert.equal(options.webPreferences.sandbox, true);
});

test("buildSecureWindowOptions applies sane defaults when called without arguments", () => {
  const options = buildSecureWindowOptions();

  assert.equal(typeof options.width, "number");
  assert.equal(typeof options.height, "number");
  assert.equal(options.title, undefined);
});

test("buildSecureWindowOptions enables webPreferences.devTools only when isPackaged is explicitly false", () => {
  const devOptions = buildSecureWindowOptions({ isPackaged: false });

  assert.equal(devOptions.webPreferences.devTools, true);
  assert.equal(devOptions.webPreferences.nodeIntegration, false);
  assert.equal(devOptions.webPreferences.contextIsolation, true);
  assert.equal(devOptions.webPreferences.sandbox, true);
  assert.equal(devOptions.webPreferences.webSecurity, undefined);
  assert.equal(devOptions.webPreferences.preload, undefined);
});

test("buildSecureWindowOptions disables webPreferences.devTools when isPackaged is true", () => {
  const packagedOptions = buildSecureWindowOptions({ isPackaged: true });

  assert.equal(packagedOptions.webPreferences.devTools, false);
  assert.equal(packagedOptions.webPreferences.nodeIntegration, false);
  assert.equal(packagedOptions.webPreferences.contextIsolation, true);
  assert.equal(packagedOptions.webPreferences.sandbox, true);
  assert.equal(packagedOptions.webPreferences.webSecurity, undefined);
  assert.equal(packagedOptions.webPreferences.preload, undefined);
});

test("buildSecureWindowOptions disables webPreferences.devTools fail-closed when isPackaged is omitted or not boolean", () => {
  const omittedOptions = buildSecureWindowOptions();
  const undefinedOptions = buildSecureWindowOptions({ isPackaged: undefined });
  const nonBooleanOptions = buildSecureWindowOptions({ isPackaged: "true" });

  assert.equal(omittedOptions.webPreferences.devTools, false);
  assert.equal(undefinedOptions.webPreferences.devTools, false);
  assert.equal(nonBooleanOptions.webPreferences.devTools, false);

  for (const options of [omittedOptions, undefinedOptions, nonBooleanOptions]) {
    assert.equal(options.webPreferences.nodeIntegration, false);
    assert.equal(options.webPreferences.contextIsolation, true);
    assert.equal(options.webPreferences.sandbox, true);
    assert.equal(options.webPreferences.webSecurity, undefined);
    assert.equal(options.webPreferences.preload, undefined);
  }
});

test("shouldOpenDevTools only opens DevTools when isPackaged is explicitly false", () => {
  assert.equal(shouldOpenDevTools(false), true);
  assert.equal(shouldOpenDevTools(true), false);
  assert.equal(shouldOpenDevTools(undefined), false);
});

test("buildSecureWindowOptions never sets webPreferences.partition, so the renderer uses the default (persistent) session", () => {
  const options = buildSecureWindowOptions();

  assert.equal(options.webPreferences.partition, undefined);
  assert.ok(!("partition" in options.webPreferences));
});

test("resolveIndexHtmlPath resolves from a module URL located under <root>/electron/", () => {
  const fakeProjectRoot = path.resolve(path.sep, "fake-project");
  const fakeModuleUrl = pathToFileURL(
    path.join(fakeProjectRoot, "electron", "main.js")
  ).href;

  const resolved = resolveIndexHtmlPath({ moduleUrl: fakeModuleUrl });

  assert.equal(
    resolved,
    path.join(fakeProjectRoot, "builds", "browser", "index.html")
  );
});

test("resolveIndexHtmlPath resolves from an explicit projectRoot, ignoring cwd", () => {
  const fakeProjectRoot = path.resolve(path.sep, "elsewhere");

  const resolved = resolveIndexHtmlPath({ projectRoot: fakeProjectRoot });

  assert.equal(
    resolved,
    path.join(fakeProjectRoot, "builds", "browser", "index.html")
  );
});

test("resolveIndexHtmlPath prefers projectRoot over moduleUrl when both are given", () => {
  const ignoredRoot = path.resolve(path.sep, "ignored");
  const winningRoot = path.resolve(path.sep, "wins");
  const fakeModuleUrl = pathToFileURL(
    path.join(ignoredRoot, "electron", "main.js")
  ).href;

  const resolved = resolveIndexHtmlPath({
    moduleUrl: fakeModuleUrl,
    projectRoot: winningRoot,
  });

  assert.equal(resolved, path.join(winningRoot, "builds", "browser", "index.html"));
});

test("resolveIndexHtmlPath throws when neither moduleUrl nor projectRoot are given", () => {
  assert.throws(() => resolveIndexHtmlPath(), TypeError);
  assert.throws(() => resolveIndexHtmlPath({}), TypeError);
});

test("createWindowOpenHandler always denies and never returns an allow action", () => {
  const { logger, calls } = createLoggerSpy();
  const handler = createWindowOpenHandler(logger);

  const result = handler({ url: "https://example.com" });

  assert.deepEqual(result, { action: "deny" });
  assert.equal(calls.warn.length, 1);
});

test("createWindowOpenHandler works with its default no-op logger", () => {
  const handler = createWindowOpenHandler();

  const result = handler({ url: "https://example.com" });

  assert.deepEqual(result, { action: "deny" });
});

test("createWillNavigateHandler blocks navigation away from the allowed URL", () => {
  const allowedUrl = "file:///fake/builds/browser/index.html";
  const { logger, calls } = createLoggerSpy();
  const handler = createWillNavigateHandler(allowedUrl, logger);

  let prevented = false;
  const event = { preventDefault: () => (prevented = true) };

  handler(event, "https://example.com");

  assert.equal(prevented, true);
  assert.equal(calls.warn.length, 1);
});

test("createWillNavigateHandler allows navigation to the exact allowed URL", () => {
  const allowedUrl = "file:///fake/builds/browser/index.html";
  const handler = createWillNavigateHandler(allowedUrl);

  let prevented = false;
  const event = { preventDefault: () => (prevented = true) };

  handler(event, allowedUrl);

  assert.equal(prevented, false);
});

test("createWillAttachWebviewHandler unconditionally prevents webview attachment", () => {
  const { logger, calls } = createLoggerSpy();
  const handler = createWillAttachWebviewHandler(logger);

  let prevented = false;
  const event = { preventDefault: () => (prevented = true) };

  handler(event);

  assert.equal(prevented, true);
  assert.equal(calls.warn.length, 1);
});

test("handlePrimaryInstanceLock quits without creating a window when the lock was not obtained", () => {
  let quitCalled = false;
  const appLike = { quit: () => (quitCalled = true) };

  const shouldContinue = handlePrimaryInstanceLock(false, appLike);

  assert.equal(shouldContinue, false);
  assert.equal(quitCalled, true);
});

test("handlePrimaryInstanceLock does not quit and signals continuation when the lock was obtained", () => {
  let quitCalled = false;
  const appLike = { quit: () => (quitCalled = true) };

  const shouldContinue = handlePrimaryInstanceLock(true, appLike);

  assert.equal(shouldContinue, true);
  assert.equal(quitCalled, false);
});

test("handleSecondInstance restores a minimized window and focuses it", () => {
  let restored = false;
  let focused = false;
  const existingWindow = {
    isMinimized: () => true,
    restore: () => (restored = true),
    focus: () => (focused = true),
  };

  handleSecondInstance(existingWindow);

  assert.equal(restored, true);
  assert.equal(focused, true);
});

test("handleSecondInstance focuses without restoring a non-minimized window", () => {
  let restored = false;
  let focused = false;
  const existingWindow = {
    isMinimized: () => false,
    restore: () => (restored = true),
    focus: () => (focused = true),
  };

  handleSecondInstance(existingWindow);

  assert.equal(restored, false);
  assert.equal(focused, true);
});

test("handleSecondInstance does nothing when there is no existing window", () => {
  assert.doesNotThrow(() => handleSecondInstance(null));
  assert.doesNotThrow(() => handleSecondInstance(undefined));
});

test("handleActivate creates a window only when the window list is empty", () => {
  let created = false;
  const createWindow = () => (created = true);

  handleActivate([], createWindow);
  assert.equal(created, true);
});

test("handleActivate does not create a new window when one already exists", () => {
  let created = false;
  const createWindow = () => (created = true);

  handleActivate([{ id: "existing" }], createWindow);
  assert.equal(created, false);
});

test("handleWindowAllClosed quits on non-darwin platforms", () => {
  let quitCalled = false;
  const appLike = { quit: () => (quitCalled = true) };

  handleWindowAllClosed("win32", appLike);

  assert.equal(quitCalled, true);
});

test("handleWindowAllClosed does not quit on darwin", () => {
  let quitCalled = false;
  const appLike = { quit: () => (quitCalled = true) };

  handleWindowAllClosed("darwin", appLike);

  assert.equal(quitCalled, false);
});

test("loadIndexHtmlSafely resolves quietly when loadFile succeeds", async () => {
  let quitCalled = false;
  const { logger, calls } = createLoggerSpy();
  const appLike = { quit: () => (quitCalled = true) };

  await loadIndexHtmlSafely(() => Promise.resolve(), logger, appLike);

  assert.equal(quitCalled, false);
  assert.equal(calls.error.length, 0);
});

test("loadIndexHtmlSafely logs an error and quits the app when loadFile rejects, without loading a remote fallback", async () => {
  let quitCalled = false;
  const { logger, calls } = createLoggerSpy();
  const appLike = { quit: () => (quitCalled = true) };
  const failure = new Error("file:// load failed");

  await loadIndexHtmlSafely(() => Promise.reject(failure), logger, appLike);

  assert.equal(quitCalled, true);
  assert.equal(calls.error.length, 1);
  assert.equal(calls.error[0][1], failure);
});
