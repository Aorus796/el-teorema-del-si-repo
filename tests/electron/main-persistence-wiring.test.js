import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// electron/main.js importa "electron" directamente (es el proceso
// principal real), por lo que no puede importarse en `node --test` dentro
// del contenedor `game` (sin `npm ci`, sin node_modules/electron). Para
// verificar que main.js aplica la politica de persistencia antes que
// cualquier otra cosa del ciclo de vida, inspeccionamos su codigo fuente
// en vez de ejecutarlo (mismo patron que main-devtools-wiring.test.js).

const mainPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "electron",
  "main.js"
);

// Elimina los comentarios de linea (`//...`) antes de buscar el orden de
// las llamadas reales: el propio codigo fuente documenta esta secuencia
// en prosa (mencionando ambos nombres) antes de la llamada real, lo que
// haria que una busqueda ingenua sobre el texto crudo diera un orden
// incorrecto.
function stripLineComments(source) {
  return source
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, ""))
    .join("\n");
}

test("electron/main.js calls applyPersistencePolicy before requestSingleInstanceLock and before whenReady", async () => {
  const rawSource = await readFile(mainPath, "utf8");
  const source = stripLineComments(rawSource);

  const applyPolicyIndex = source.indexOf("applyPersistencePolicy(");
  const requestLockIndex = source.indexOf("requestSingleInstanceLock(");
  const whenReadyIndex = source.indexOf("whenReady(");

  assert.notEqual(applyPolicyIndex, -1, "applyPersistencePolicy should be called in main.js");
  assert.notEqual(requestLockIndex, -1, "requestSingleInstanceLock should be called in main.js");
  assert.notEqual(whenReadyIndex, -1, "whenReady should be called in main.js");

  assert.ok(
    applyPolicyIndex < requestLockIndex,
    "applyPersistencePolicy must run before requestSingleInstanceLock"
  );
  assert.ok(applyPolicyIndex < whenReadyIndex, "applyPersistencePolicy must run before whenReady");
});

test("electron/main.js passes app.getPath('appData'), fs.mkdirSync, the real app object, and console into applyPersistencePolicy", async () => {
  const source = await readFile(mainPath, "utf8");

  assert.match(source, /appDataPath:\s*app\.getPath\(\s*["']appData["']\s*\)/);
  assert.match(source, /mkdir:\s*fs\.mkdirSync/);
  assert.match(source, /appLike:\s*app\b/);
  assert.match(source, /applyPersistencePolicy\(\{[\s\S]*?logger,?[\s\S]*?\}\)/);
});

test("electron/main.js closes the app with app.exit(1) when the persistence policy fails, without continuing the rest of the module", async () => {
  const source = await readFile(mainPath, "utf8");

  assert.match(
    source,
    /if\s*\(\s*!persistencePolicyApplied\s*\)\s*\{\s*app\.exit\(1\)\s*;\s*\}\s*else\s*\{/
  );

  // No debe usarse app.quit() para este cierre especifico: el resto del
  // archivo (requestSingleInstanceLock, whenReady, creacion de ventana)
  // vive dentro de la rama "else", nunca ejecutandose tras un fallo de
  // persistencia.
  const elseBranchStart = source.indexOf("} else {");
  const requestLockIndexAfterElse = source.indexOf("requestSingleInstanceLock(", elseBranchStart);
  assert.ok(elseBranchStart !== -1 && requestLockIndexAfterElse > elseBranchStart);
});
