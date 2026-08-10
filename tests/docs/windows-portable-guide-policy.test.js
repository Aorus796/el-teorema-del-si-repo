import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// docs/production/WINDOWS_PORTABLE_GUIDE.md es la guia operativa del
// portable Windows (tarea 5 de WINDOWS_PACKAGING_DECISION.md). Estas
// pruebas no reemplazan la revision humana de la prosa (fragil de testear
// de forma robusta), solo protegen invariantes mecanicas concretas que
// importan si alguien edita el documento mas adelante: los comandos
// documentados, las rutas de persistencia, el nombre logico del artifact,
// y que no se documente ninguna publicacion de GitHub Release (que no
// existe en el flujo actual).

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const guidePath = path.join(repoRoot, "docs", "production", "WINDOWS_PORTABLE_GUIDE.md");

async function readGuide() {
  return readFile(guidePath, "utf8");
}

/** Extrae el contenido de todos los bloques de codigo ```powershell ... ``` */
function extractPowershellBlocks(guideText) {
  const blocks = [];
  const pattern = /```powershell\n([\s\S]*?)```/g;
  let match;
  while ((match = pattern.exec(guideText)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

test("the guide exists and is readable", async () => {
  const guide = await readGuide();
  assert.ok(guide.length > 0);
});

test("no PowerShell code block ever recommends npm install to build the portable", async () => {
  const guide = await readGuide();
  const blocks = extractPowershellBlocks(guide);

  assert.ok(blocks.length > 0, "expected at least one powershell code block");
  for (const block of blocks) {
    assert.doesNotMatch(
      block,
      /(^|\s)npm install(\s|$)/,
      `expected no code block to recommend "npm install", found in: ${block}`
    );
  }
});

test("the local build instructions use npm ci and npm run desktop:package:win", async () => {
  const guide = await readGuide();
  const blocks = extractPowershellBlocks(guide);
  const buildBlock = blocks.find((block) => block.includes("desktop:package:win"));

  assert.notEqual(buildBlock, undefined, "expected a code block invoking desktop:package:win");
  assert.match(buildBlock, /(^|\s)npm ci(\s|$)/m);
});

test("references the correct GitHub Actions artifact logical name", async () => {
  const guide = await readGuide();
  assert.match(guide, /el-teorema-del-si-windows-x64-portable/);
});

test("references the real userData and sessionData persistence paths", async () => {
  const guide = await readGuide();
  assert.match(guide, /%APPDATA%\\el-teorema-del-si\\chromium/);
  assert.match(guide, /%APPDATA%\\el-teorema-del-si(?!\\chromium)/);
});

test("does not document any GitHub Release publishing step", async () => {
  const guide = await readGuide();
  assert.ok(!guide.includes("gh release create"));
  assert.ok(!guide.includes("actions/create-release"));
  assert.ok(!guide.includes("softprops/action-gh-release"));
});

test("documents the candidate as unsigned, never as code-signed", async () => {
  const guide = await readGuide();

  assert.match(guide, /NotSigned/);
  // "firmad[oa]" siempre debe aparecer precedido de una negacion ("no")
  // dentro de la misma frase corta: comprueba cada aparicion literal en
  // vez de un patron unico, para no dar un falso positivo sobre la propia
  // negacion correcta ("no esta firmada digitalmente" SI debe aparecer).
  const matches = [...guide.matchAll(/[^.]{0,40}firmad[oa][^.]{0,10}/g)];
  assert.ok(matches.length > 0, "expected at least one mention of 'firmado/firmada'");
  for (const [snippet] of matches) {
    assert.match(
      snippet,
      /\bno\b/i,
      `expected every mention of "firmado/firmada" to be negated with "no", found: "${snippet}"`
    );
  }
});

test("lists task 8 as still pending", async () => {
  const guide = await readGuide();
  const pendingSection = guide.slice(guide.indexOf("## 9. Qué falta todavía"));

  assert.match(pendingSection, /Tarea 8/);
});
