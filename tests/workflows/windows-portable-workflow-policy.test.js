import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// .github/workflows/windows-portable.yml es YAML real (a diferencia de
// electron-builder.yml, que es JSON valido dentro de un .yml). Por eso estas
// pruebas NO lo parsean como YAML/JSON: lo leen como texto plano y aplican
// regex/escaneo por lineas dirigido a marcadores estructurales conocidos
// (nombres de step, claves de nivel superior), sin depender de ninguna
// libreria de YAML nueva, ni siquiera transitiva no declarada.
//
// Estas pruebas nunca invocan el workflow real ni ninguna herramienta de
// GitHub Actions (como "act"): solo inspeccionan el archivo como texto.

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const workflowPath = path.join(repoRoot, ".github", "workflows", "windows-portable.yml");

async function readWorkflow() {
  return readFile(workflowPath, "utf8");
}

/**
 * Extrae el bloque de texto de un step por su nombre exacto, desde su linea
 * `- name: <stepName>` (con o sin comillas) hasta la siguiente linea
 * `- name:` o el fin del archivo. Sirve como ancla estable para aplicar
 * aserciones dirigidas a un unico step sin necesidad de un parser YAML real.
 */
function extractStepBlock(workflowText, stepName) {
  const lines = workflowText.split(/\r?\n/);
  const nameLinePattern = new RegExp(`^\\s*-\\s*name:\\s*"?${stepName}"?\\s*$`);
  const anyNameLinePattern = /^\s*-\s*name:/;

  const startIndex = lines.findIndex((line) => nameLinePattern.test(line));
  assert.notEqual(startIndex, -1, `expected to find a step named "${stepName}"`);

  let endIndex = lines.length;
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    if (anyNameLinePattern.test(lines[i])) {
      endIndex = i;
      break;
    }
  }

  return lines.slice(startIndex, endIndex).join("\n");
}

/** Extrae el bloque de texto de una clave de nivel superior (por ejemplo
 * "on:" o "permissions:"), desde su linea hasta la siguiente linea que
 * empieza en la misma columna 0 (otra clave de nivel superior) o fin de
 * archivo. */
function extractTopLevelBlock(workflowText, key) {
  const lines = workflowText.split(/\r?\n/);
  const keyLinePattern = new RegExp(`^${key}:`);
  const anyTopLevelKeyPattern = /^[A-Za-z_-]+:/;

  const startIndex = lines.findIndex((line) => keyLinePattern.test(line));
  assert.notEqual(startIndex, -1, `expected to find a top-level key "${key}:"`);

  let endIndex = lines.length;
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    if (anyTopLevelKeyPattern.test(lines[i])) {
      endIndex = i;
      break;
    }
  }

  return lines.slice(startIndex, endIndex).join("\n");
}

/** Devuelve todas las lineas `run:` en bloque (`run: |`) o de una linea
 * (`run: comando`) concatenadas, para aplicar aserciones sobre "cualquier
 * paso run:" sin depender de indentacion exacta. */
function extractAllRunBlocks(workflowText) {
  const lines = workflowText.split(/\r?\n/);
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const singleLineMatch = line.match(/^\s*run:\s*(.+)$/);
    const blockMatch = line.match(/^(\s*)run:\s*\|\s*$/);
    if (blockMatch) {
      const indent = blockMatch[1].length;
      const blockLines = [];
      let j = i + 1;
      while (j < lines.length) {
        const currentLine = lines[j];
        if (currentLine.trim() === "") {
          blockLines.push(currentLine);
          j += 1;
          continue;
        }
        const currentIndent = currentLine.match(/^\s*/)[0].length;
        if (currentIndent <= indent) {
          break;
        }
        blockLines.push(currentLine);
        j += 1;
      }
      blocks.push(blockLines.join("\n"));
      i = j;
      continue;
    }
    if (singleLineMatch) {
      blocks.push(singleLineMatch[1]);
    }
    i += 1;
  }
  return blocks;
}

test("windows-portable.yml exists and is readable", async () => {
  const workflow = await readWorkflow();
  assert.ok(workflow.length > 0);
});

test("the job runs on a Windows runner, never ubuntu-*/macos-*", async () => {
  const workflow = await readWorkflow();
  const runsOnMatch = workflow.match(/^\s*runs-on:\s*(\S+)\s*$/m);

  assert.notEqual(runsOnMatch, null, "expected to find a runs-on: line");
  const runsOnValue = runsOnMatch[1];

  assert.match(runsOnValue, /^windows-/, `expected a Windows runner, found "${runsOnValue}"`);
  assert.doesNotMatch(runsOnValue, /^ubuntu-/);
  assert.doesNotMatch(runsOnValue, /^macos-/);
});

test("workflow_dispatch is present among the triggers", async () => {
  const workflow = await readWorkflow();
  const triggersBlock = extractTopLevelBlock(workflow, "on");

  assert.match(triggersBlock, /^\s*workflow_dispatch:/m);
});

test("pull_request is present among the triggers", async () => {
  const workflow = await readWorkflow();
  const triggersBlock = extractTopLevelBlock(workflow, "on");

  assert.match(triggersBlock, /^\s*pull_request:/m);
});

test("no release trigger, no push with tags, no schedule trigger anywhere in the file", async () => {
  const workflow = await readWorkflow();

  assert.doesNotMatch(workflow, /^\s*release:\s*$/m);
  assert.doesNotMatch(workflow, /^\s*push:/m);
  assert.doesNotMatch(workflow, /^\s*tags:/m);
  assert.doesNotMatch(workflow, /^\s*schedule:/m);
});

test("permissions block grants only contents: read, and no write scope appears anywhere", async () => {
  const workflow = await readWorkflow();
  const permissionsBlock = extractTopLevelBlock(workflow, "permissions");

  assert.match(permissionsBlock, /contents:\s*read/);

  for (const forbidden of [
    "contents: write",
    "packages: write",
    "id-token: write",
    "pull-requests: write",
    "write-all",
  ]) {
    assert.ok(
      !workflow.includes(forbidden),
      `expected the workflow to never contain "${forbidden}"`
    );
  }
});

test("concurrency is configured with cancel-in-progress: true", async () => {
  const workflow = await readWorkflow();
  const concurrencyBlock = extractTopLevelBlock(workflow, "concurrency");

  assert.match(concurrencyBlock, /cancel-in-progress:\s*true/);
});

test('"Install dependencies" step runs npm ci, and no run: step anywhere uses npm install', async () => {
  const workflow = await readWorkflow();
  const installStep = extractStepBlock(workflow, "Install dependencies");

  assert.match(installStep, /run:\s*npm ci/);

  const runBlocks = extractAllRunBlocks(workflow);
  for (const block of runBlocks) {
    assert.doesNotMatch(
      block,
      /(^|\s)npm install(\s|$)/,
      `expected no run: step to use "npm install", found in: ${block}`
    );
  }
});

test('"Package Windows portable" step runs exactly "npm run desktop:package:win"', async () => {
  const workflow = await readWorkflow();
  const packageStep = extractStepBlock(workflow, "Package Windows portable");

  assert.match(packageStep, /run:\s*npm run desktop:package:win\s*$/m);
});

test("no run: step invokes electron-builder directly with flags other than through desktop:package:win", async () => {
  const workflow = await readWorkflow();
  const runBlocks = extractAllRunBlocks(workflow);

  for (const block of runBlocks) {
    // "npm run desktop:package:win" es la unica forma permitida de invocar
    // el empaquetado; cualquier otra aparicion literal de "electron-builder"
    // en un run: (por ejemplo "electron-builder --win nsis") es una
    // regresion de alcance.
    if (block.includes("desktop:package:win")) {
      continue;
    }
    assert.doesNotMatch(
      block,
      /electron-builder/,
      `expected no run: step to invoke electron-builder directly, found in: ${block}`
    );
  }
});

test('"Upload portable artifact" step never uploads the whole release/ directory', async () => {
  const workflow = await readWorkflow();
  const uploadStep = extractStepBlock(workflow, "Upload portable artifact");
  const pathMatch = uploadStep.match(/path:\s*(.+)\s*$/m);

  assert.notEqual(pathMatch, null, "expected to find a path: line in the upload step");
  const pathValue = pathMatch[1].trim();

  assert.notEqual(pathValue, "release/");
  assert.notEqual(pathValue, "release");
  assert.ok(!pathValue.includes("release/**"));
  assert.ok(!pathValue.includes("release/win-unpacked"));
});

test('"Upload portable artifact" step uploads an artifact named el-teorema-del-si-windows-x64-portable', async () => {
  const workflow = await readWorkflow();
  const uploadStep = extractStepBlock(workflow, "Upload portable artifact");

  assert.match(uploadStep, /name:\s*el-teorema-del-si-windows-x64-portable\s*$/m);
});

test("neither ia32 nor arm64 appear anywhere in the file", async () => {
  const workflow = await readWorkflow();

  assert.ok(!workflow.includes("ia32"));
  assert.ok(!workflow.includes("arm64"));
});

test("no GitHub Release creation/publishing action or command appears anywhere", async () => {
  const workflow = await readWorkflow();

  assert.ok(!workflow.includes("softprops/action-gh-release"));
  assert.ok(!workflow.includes("actions/create-release"));
  assert.ok(!workflow.includes("gh release create"));
});

test("no run: step passes --publish with a value other than never", async () => {
  const workflow = await readWorkflow();
  const runBlocks = extractAllRunBlocks(workflow);

  for (const block of runBlocks) {
    const publishMatches = block.matchAll(/--publish[\s=]+(\S+)/g);
    for (const match of publishMatches) {
      assert.equal(
        match[1],
        "never",
        `expected --publish to always be "never", found "${match[1]}" in: ${block}`
      );
    }
  }
});

test("the PowerShell validation script lists release/ with Get-ChildItem without -Recurse", async () => {
  const workflow = await readWorkflow();
  const validateStep = extractStepBlock(workflow, "Validate packaged artifact");

  assert.match(validateStep, /Get-ChildItem/);

  // Ninguna linea que enumera "release" (el directorio de salida de
  // electron-builder) debe usar -Recurse: con -Recurse tambien encontraria
  // release/win-unpacked/ElTeoremaDelSi.exe, el payload intermedio de
  // staging documentado como esperado en WINDOWS_PACKAGING_DECISION.md, lo
  // que produciria un falso positivo de "hay dos portables".
  const releaseEnumerationLines = validateStep
    .split(/\r?\n/)
    .filter((line) => line.includes("release") && line.includes("Get-ChildItem"));

  assert.ok(releaseEnumerationLines.length > 0, "expected at least one Get-ChildItem over release");
  for (const line of releaseEnumerationLines) {
    assert.ok(
      !line.includes("-Recurse"),
      `expected Get-ChildItem over release to never use -Recurse, found: ${line}`
    );
  }
});

test("Invoke-Expression never appears anywhere in the file", async () => {
  const workflow = await readWorkflow();

  assert.ok(!workflow.includes("Invoke-Expression"));
});
