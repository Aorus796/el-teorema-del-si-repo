import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// electron/main.js importa "electron" directamente (es el proceso
// principal real), por lo que no puede importarse en `node --test` dentro
// del contenedor `game` (sin `npm ci`, sin node_modules/electron). Para
// verificar que main.js efectivamente propaga `app.isPackaged` a
// `buildSecureWindowOptions` sin depender de tener Electron instalado,
// inspeccionamos su código fuente en vez de ejecutarlo.

const mainPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "electron",
  "main.js"
);

test("electron/main.js passes app.isPackaged into buildSecureWindowOptions", async () => {
  const source = await readFile(mainPath, "utf8");

  assert.match(
    source,
    /buildSecureWindowOptions\(\s*\{\s*isPackaged:\s*app\.isPackaged\s*\}\s*\)/
  );
});
