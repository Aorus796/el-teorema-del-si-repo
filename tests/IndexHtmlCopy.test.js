import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// El index.html fuente del repositorio es el shell de un producto
// entregable (v1.0.0 ya publicada), no un prototipo tecnico: este test
// confirma que su copy visible (title, meta description, textos) no
// arrastra el framing de "prototipo" ni tildes faltantes en el titulo
// canonico "El Teorema del Si".

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

test("el index.html fuente no contiene el framing de 'prototipo' en su copy visible", async () => {
  const html = await readFile(path.join(repoRoot, "index.html"), "utf8");

  assert.ok(
    !html.includes("prototipo") && !html.includes("Prototipo"),
    "index.html no debe mencionar 'prototipo' en su copy visible",
  );
});

test("el index.html fuente usa el titulo canonico 'El Teorema del Si' con tilde", async () => {
  const html = await readFile(path.join(repoRoot, "index.html"), "utf8");

  assert.match(html, /<title>El Teorema del Sí<\/title>/);
  assert.ok(!html.includes("El Teorema del Si -"));
});
