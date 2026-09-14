import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// tools/windows-runtime-smoke.ps1 es un script PowerShell puro, invocado
// solo desde .github/workflows/windows-portable.yml en un runner
// windows-latest real. No puede ejecutarse dentro de la suite unitaria
// estandar (que corre en Linux via node --test), asi que estas pruebas lo
// leen como texto plano y verifican propiedades estructurales, igual que
// tests/workflows/windows-portable-workflow-policy.test.js hace con el
// YAML del workflow.

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const scriptPath = path.join(repoRoot, "tools", "windows-runtime-smoke.ps1");

async function readScript() {
  return readFile(scriptPath, "utf8");
}

test("tools/windows-runtime-smoke.ps1 exists and is readable", async () => {
  const script = await readScript();
  assert.ok(script.length > 0);
});

test("Invoke-Expression never appears in the script", async () => {
  const script = await readScript();
  assert.ok(!script.includes("Invoke-Expression"));
});

test("the script declares all six expected parameters", async () => {
  const script = await readScript();

  for (const parameterName of [
    "LauncherPath",
    "RealProcessName",
    "SurvivalSeconds",
    "AppearanceTimeoutSeconds",
    "PollIntervalMilliseconds",
    "OutputPrefix",
  ]) {
    assert.match(
      script,
      new RegExp(`\\[string\\]\\$${parameterName}|\\[int\\]\\$${parameterName}`),
      `expected the script to declare a $${parameterName} parameter`
    );
  }
});

test("the script never hardcodes a release\\ path or the win-unpacked directory name", async () => {
  const script = await readScript();

  // El script debe ser reutilizable por ambos llamadores (win-unpacked y
  // portable), cada uno pasando su propio -LauncherPath. Ninguna ruta
  // interna debe atajar a un artefacto concreto.
  assert.ok(!script.includes("release\\"));
  assert.ok(!script.includes("win-unpacked"));
});

test("the script guards both GITHUB_OUTPUT and GITHUB_STEP_SUMMARY with conditional checks", async () => {
  const script = await readScript();

  assert.match(script, /if\s*\(\s*\$env:GITHUB_OUTPUT\s*\)|if\s*\(\s*-not\s*\$env:GITHUB_OUTPUT\s*\)/);
  assert.match(
    script,
    /if\s*\(\s*\$env:GITHUB_STEP_SUMMARY\s*\)|if\s*\(\s*-not\s*\$env:GITHUB_STEP_SUMMARY\s*\)/
  );
});

test("the script always exits 0, regardless of the PASS/FAIL verdict", async () => {
  const script = await readScript();

  assert.ok(
    !/exit\s+[1-9]/.test(script),
    "expected the script to never exit with a non-zero code; only the workflow's classify step may fail the job"
  );

  const exitMatches = script.match(/exit\s+\d+/g) ?? [];
  assert.ok(exitMatches.length > 0, "expected at least one exit statement in the script");
  for (const match of exitMatches) {
    assert.match(match, /exit\s+0/);
  }
});
