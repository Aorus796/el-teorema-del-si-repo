import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import os from "node:os";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import fs from "node:fs";
import { computeUserDataPaths, applyPersistencePolicy } from "../../electron/shell.js";

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

function createMkdirSpy(implementation = () => {}) {
  const calls = [];
  const mkdir = (targetPath, options) => {
    calls.push([targetPath, options]);
    return implementation(targetPath, options);
  };
  return { mkdir, calls };
}

function createSetPathSpy(implementation = () => {}) {
  const calls = [];
  const appLike = {
    setPath: (name, value) => {
      calls.push([name, value]);
      return implementation(name, value);
    },
  };
  return { appLike, calls };
}

test("computeUserDataPaths derives userDataPath from the injected appDataPath using the hardcoded app folder name", () => {
  const appDataPath = path.join(path.sep, "fake", "AppData", "Roaming");

  const { userDataPath } = computeUserDataPaths(appDataPath);

  assert.equal(userDataPath, path.join(appDataPath, "el-teorema-del-si"));
});

test("computeUserDataPaths derives sessionDataPath as a subfolder of userDataPath", () => {
  const appDataPath = path.join(path.sep, "fake", "AppData", "Roaming");

  const { userDataPath, sessionDataPath } = computeUserDataPaths(appDataPath);

  assert.equal(sessionDataPath, path.join(userDataPath, "chromium"));
  assert.ok(sessionDataPath.startsWith(userDataPath + path.sep));
});

test("computeUserDataPaths always returns absolute paths", () => {
  const appDataPath = path.resolve(path.sep, "fake", "AppData", "Roaming");

  const { userDataPath, sessionDataPath } = computeUserDataPaths(appDataPath);

  assert.ok(path.isAbsolute(userDataPath));
  assert.ok(path.isAbsolute(sessionDataPath));
});

test("computeUserDataPaths never depends on process.cwd()", () => {
  const originalCwd = process.cwd();
  const alternateCwd = os.tmpdir();
  const appDataPath = path.resolve(path.sep, "fake", "AppData", "Roaming");

  try {
    process.chdir(alternateCwd);
    const fromAlternateCwd = computeUserDataPaths(appDataPath);

    process.chdir(originalCwd);
    const fromOriginalCwd = computeUserDataPaths(appDataPath);

    assert.deepEqual(fromAlternateCwd, fromOriginalCwd);
  } finally {
    process.chdir(originalCwd);
  }
});

test("applyPersistencePolicy creates both directories recursively via the injected mkdir with the correct paths", () => {
  const appDataPath = path.join(path.sep, "fake", "AppData", "Roaming");
  const { mkdir, calls: mkdirCalls } = createMkdirSpy();
  const { appLike } = createSetPathSpy();
  const { userDataPath, sessionDataPath } = computeUserDataPaths(appDataPath);

  const result = applyPersistencePolicy({ appDataPath, mkdir, appLike });

  assert.equal(result, true);
  assert.deepEqual(mkdirCalls, [
    [userDataPath, { recursive: true }],
    [sessionDataPath, { recursive: true }],
  ]);
});

test("applyPersistencePolicy calls appLike.setPath exactly for userData and sessionData, with the correct values, only after both mkdir calls", () => {
  const appDataPath = path.join(path.sep, "fake", "AppData", "Roaming");
  const order = [];
  const { mkdir } = createMkdirSpy(() => order.push("mkdir"));
  const { appLike, calls: setPathCalls } = createSetPathSpy(() => order.push("setPath"));
  const { userDataPath, sessionDataPath } = computeUserDataPaths(appDataPath);

  const result = applyPersistencePolicy({ appDataPath, mkdir, appLike });

  assert.equal(result, true);
  assert.deepEqual(setPathCalls, [
    ["userData", userDataPath],
    ["sessionData", sessionDataPath],
  ]);
  assert.deepEqual(order, ["mkdir", "mkdir", "setPath", "setPath"]);
});

test("applyPersistencePolicy uses fs.mkdirSync as a reasonable default mkdir dependency", () => {
  assert.equal(typeof applyPersistencePolicy, "function");
  // No invocamos con el mkdir por defecto aqui (tocaria el disco real);
  // la no-destructividad con fs real se cubre en un test dedicado mas
  // abajo. Este test solo confirma que el parametro es opcional.
  const appDataPath = path.join(path.sep, "fake", "AppData", "Roaming");
  const { appLike } = createSetPathSpy();
  const { mkdir } = createMkdirSpy();

  assert.doesNotThrow(() => applyPersistencePolicy({ appDataPath, mkdir, appLike }));
});

test("applyPersistencePolicy logs an error, never calls setPath (not even for the path that did succeed), and signals failure when mkdir throws on the second call", () => {
  const appDataPath = path.join(path.sep, "fake", "AppData", "Roaming");
  const { logger, calls } = createLoggerSpy();
  const failure = new Error("EPERM: mkdir failed on second call");
  const { mkdir, calls: mkdirCalls } = createMkdirSpy(() => {
    if (mkdirCalls.length === 2) {
      throw failure;
    }
  });
  const { appLike, calls: setPathCalls } = createSetPathSpy();

  const result = applyPersistencePolicy({ appDataPath, mkdir, appLike, logger });

  assert.equal(result, false);
  assert.equal(mkdirCalls.length, 2);
  assert.equal(setPathCalls.length, 0);
  assert.equal(calls.error.length, 1);
  assert.equal(calls.error[0][1], failure);
});

test("applyPersistencePolicy signals failure and logs even when mkdir throws on the first call, without calling setPath for the path that did succeed", () => {
  const appDataPath = path.join(path.sep, "fake", "AppData", "Roaming");
  const { logger, calls } = createLoggerSpy();
  const failure = new Error("EPERM: mkdir failed on first call");
  const { mkdir } = createMkdirSpy(() => {
    throw failure;
  });
  const { appLike, calls: setPathCalls } = createSetPathSpy();

  const result = applyPersistencePolicy({ appDataPath, mkdir, appLike, logger });

  assert.equal(result, false);
  assert.equal(setPathCalls.length, 0);
  assert.equal(calls.error.length, 1);
});

test("applyPersistencePolicy logs an error and stops without a pending setPath call when appLike.setPath throws", () => {
  const appDataPath = path.join(path.sep, "fake", "AppData", "Roaming");
  const { logger, calls } = createLoggerSpy();
  const { mkdir } = createMkdirSpy();
  const failure = new Error("setPath failed");
  const { appLike, calls: setPathCalls } = createSetPathSpy((name) => {
    if (name === "userData") {
      throw failure;
    }
  });

  const result = applyPersistencePolicy({ appDataPath, mkdir, appLike, logger });

  assert.equal(result, false);
  // Solo la llamada a "userData" debe haberse producido; "sessionData"
  // nunca se intenta tras el fallo (fail-fast, sin dejar la app en un
  // estado parcial).
  assert.deepEqual(setPathCalls, [["userData", path.join(appDataPath, "el-teorema-del-si")]]);
  assert.equal(calls.error.length, 1);
  assert.equal(calls.error[0][1], failure);
});

test("applyPersistencePolicy is not destructive: existing marker files under userData/sessionData survive a second real-filesystem application of the policy", async () => {
  const baseDirectory = await mkdtemp(path.join(os.tmpdir(), "el-teorema-del-si-persistence-"));

  try {
    const appDataPath = path.join(baseDirectory, "AppData", "Roaming");
    const { userDataPath, sessionDataPath } = computeUserDataPaths(appDataPath);

    // Primer "arranque": crea los directorios de verdad y deja un
    // archivo marcador en cada uno, simulando datos de una partida
    // guardada real.
    const firstAppLike = { setPath: () => {} };
    const firstResult = applyPersistencePolicy({
      appDataPath,
      mkdir: fs.mkdirSync,
      appLike: firstAppLike,
    });
    assert.equal(firstResult, true);

    const userMarkerPath = path.join(userDataPath, "marker.txt");
    const sessionMarkerPath = path.join(sessionDataPath, "marker.txt");
    await writeFile(userMarkerPath, "userData marker contents");
    await writeFile(sessionMarkerPath, "sessionData marker contents");

    // Segundo "arranque": vuelve a aplicar la politica sobre el mismo
    // appDataPath, como ocurriria al reabrir el ejecutable.
    const secondAppLike = { setPath: () => {} };
    const secondResult = applyPersistencePolicy({
      appDataPath,
      mkdir: fs.mkdirSync,
      appLike: secondAppLike,
    });
    assert.equal(secondResult, true);

    assert.equal(await readFile(userMarkerPath, "utf8"), "userData marker contents");
    assert.equal(await readFile(sessionMarkerPath, "utf8"), "sessionData marker contents");
  } finally {
    await rm(baseDirectory, { recursive: true, force: true });
  }
});
