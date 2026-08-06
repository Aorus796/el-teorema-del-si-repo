import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const shellPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "electron",
  "shell.js"
);

test("electron/shell.js never references the electron module, static or dynamic", async () => {
  const source = await readFile(shellPath, "utf8");

  assert.doesNotMatch(source, /from\s+["']electron["']/);
  assert.doesNotMatch(source, /require\(\s*["']electron["']\s*\)/);
  assert.doesNotMatch(source, /import\(\s*["']electron["']\s*\)/);
});

test("electron/shell.js imports cleanly under node:test without electron installed", async () => {
  // Si este módulo importara "electron" en cualquier punto (estático o
  // dinámico), esta importación fallaría con "Cannot find module
  // 'electron'" en el contenedor `game`, que no ejecuta `npm ci` y por
  // tanto no tiene node_modules/electron.
  const shellModule = await import("../../electron/shell.js");

  assert.equal(typeof shellModule.buildSecureWindowOptions, "function");
});
