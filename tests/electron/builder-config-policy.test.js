import assert from "node:assert/strict";
import test from "node:test";
import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// electron-builder.yml esta escrito con sintaxis JSON valida (YAML es un
// superconjunto de JSON, y electron-builder lo carga igual mediante
// js_yaml.load). Por eso estas pruebas lo leen con JSON.parse nativo, sin
// depender de ninguna libreria YAML nueva ni siquiera transitiva.
//
// Estas pruebas inspeccionan la configuracion de empaquetado como datos
// puros; nunca invocan el binario de electron-builder ni generan artefactos
// reales (eso requiere Windows y se valida manualmente fuera de este flujo).

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const builderConfigPath = path.join(repoRoot, "electron-builder.yml");
const packageJsonPath = path.join(repoRoot, "package.json");

async function readBuilderConfig() {
  const raw = await readFile(builderConfigPath, "utf8");
  return JSON.parse(raw);
}

async function readPackageJson() {
  const raw = await readFile(packageJsonPath, "utf8");
  return JSON.parse(raw);
}

function containsKeyDeep(value, key) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsKeyDeep(item, key));
  }
  if (Object.prototype.hasOwnProperty.call(value, key)) {
    return true;
  }
  return Object.values(value).some((item) => containsKeyDeep(item, key));
}

test("electron-builder.yml is valid, parseable JSON", async () => {
  const raw = await readFile(builderConfigPath, "utf8");
  assert.doesNotThrow(() => JSON.parse(raw));
});

test("electron-builder.yml has no counterpart 'build' key in package.json (they are mutually exclusive)", async () => {
  const pkg = await readPackageJson();

  assert.equal(
    Object.prototype.hasOwnProperty.call(pkg, "build"),
    false,
    "package.json must not define a 'build' key: if it did, electron-builder would silently ignore electron-builder.yml entirely, without merging or warning"
  );
});

test("package.json pins electron-builder to exactly 26.15.7", async () => {
  const pkg = await readPackageJson();

  assert.equal(pkg.devDependencies["electron-builder"], "26.15.7");
});

test("electron-builder.yml sets appId, productName and asar", async () => {
  const config = await readBuilderConfig();

  assert.equal(config.appId, "com.elteoremadelsi.game");
  assert.equal(config.productName, "El Teorema del Si");
  assert.equal(config.asar, true);
});

test("electron-builder.yml outputs to the release/ directory", async () => {
  const config = await readBuilderConfig();

  assert.equal(config.directories?.output, "release");
});

test("electron-builder.yml sets win.executableName to ElTeoremaDelSi", async () => {
  const config = await readBuilderConfig();

  assert.equal(config.win?.executableName, "ElTeoremaDelSi");
});

test("electron-builder.yml win.target is exactly one portable target pinned to x64", async () => {
  const config = await readBuilderConfig();

  assert.deepEqual(config.win?.target, [{ target: "portable", arch: ["x64"] }]);
});

test("electron-builder.yml artifactName matches the exact required pattern", async () => {
  const config = await readBuilderConfig();

  assert.equal(config.artifactName, "El-Teorema-del-Si-${version}-win-x64-portable.exe");
});

test("electron-builder.yml never defines a publish block, at any level", async () => {
  const config = await readBuilderConfig();

  assert.equal(containsKeyDeep(config, "publish"), false);
});

test("electron-builder.yml never defines auto-updater related keys", async () => {
  const config = await readBuilderConfig();
  const raw = JSON.stringify(config).toLowerCase();

  assert.equal(raw.includes("autoupdate"), false);
  assert.equal(raw.includes("electron-updater"), false);
  assert.equal(containsKeyDeep(config, "nsisWeb"), false);
});

test("electron-builder.yml never defines asarUnpack, at any level", async () => {
  const config = await readBuilderConfig();

  assert.equal(containsKeyDeep(config, "asarUnpack"), false);
});

test("electron-builder.yml never defines other Windows installer targets (nsis, msi, msiWrapped, appx, squirrelWindows)", async () => {
  const config = await readBuilderConfig();

  for (const forbiddenKey of ["nsis", "msi", "msiWrapped", "appx", "squirrelWindows"]) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(config, forbiddenKey),
      false,
      `expected electron-builder.yml to not define '${forbiddenKey}'`
    );
  }
});

test("electron-builder.yml never defines code signing related keys", async () => {
  const config = await readBuilderConfig();

  for (const forbiddenKey of [
    "signtoolOptions",
    "azureSignOptions",
    "certificateFile",
    "certificatePassword",
    "certificateSubjectName",
    "certificateSha1",
    "forceCodeSigning",
  ]) {
    assert.equal(containsKeyDeep(config, forbiddenKey), false);
  }
});

test("electron-builder.yml never defines extraResources or extraFiles", async () => {
  const config = await readBuilderConfig();

  assert.equal(containsKeyDeep(config, "extraResources"), false);
  assert.equal(containsKeyDeep(config, "extraFiles"), false);
});

test("electron-builder.yml files list covers electron/**, builds/browser/** and package.json", async () => {
  const config = await readBuilderConfig();

  assert.ok(Array.isArray(config.files));
  assert.ok(config.files.includes("electron/**"));
  assert.ok(config.files.includes("builds/browser/**"));
  assert.ok(config.files.includes("package.json"));
});

test("electron-builder.yml files list never references source, docs or tooling directories", async () => {
  const config = await readBuilderConfig();
  const forbiddenSubstrings = [
    "tests/",
    "tools/",
    "docs/",
    ".git",
    ".github",
    ".claude",
    "test-results/",
    "playwright-report/",
  ];

  for (const pattern of config.files) {
    for (const forbidden of forbiddenSubstrings) {
      assert.ok(
        !pattern.includes(forbidden),
        `files pattern "${pattern}" must not reference "${forbidden}"`
      );
    }
    assert.notEqual(
      pattern,
      "**/*",
      "an unrestricted wildcard would defeat the restrictive files list"
    );
  }
});

test("package.json defines desktop:package:win with the exact expected command", async () => {
  const pkg = await readPackageJson();

  assert.equal(
    pkg.scripts["desktop:package:win"],
    "npm run build && electron-builder --win portable --x64 --publish never"
  );
});

test("package.json desktop:dev remains unchanged", async () => {
  const pkg = await readPackageJson();

  assert.equal(pkg.scripts["desktop:dev"], "npm run build && electron .");
});

// No hay un test dedicado aqui a que "npm run build deja builds/browser/
// index.html listo antes de empaquetar": tools/build.mjs (ejecutado por
// npm run build dentro de npm run check) ya termina con
// assertContentSecurityPolicyShipped y verifyBuildOutput sobre el
// builds/browser real, fallando el propio pipeline si no es asi, y
// build-output-policy.test.js/csp-policy.test.js ya cubren esa logica de
// validacion contra fixtures sinteticos. Un test adicional aqui solo
// repetiria esa cobertura sin poder tocar builds/browser real (npm run
// check ejecuta test && build, en ese orden).

test("electron-builder.yml exists at the repository root and is readable", async () => {
  await assert.doesNotReject(() => access(builderConfigPath));
});
