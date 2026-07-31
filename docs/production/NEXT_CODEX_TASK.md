# Next Codex Task — Archive Criteria: tercer puzle "La pregunta correcta"

**Estado: completado.** Implementado en los commits `e5e4752`, `ba1aa69`,
`f8de07f`. Se conserva como registro histórico de la especificación técnica
aplicada — no es una tarea activa. La selección de la siguiente tarea pasa
ahora por `CLAUDE.md` y la skill `autopilot`.

Implementa el bloque completo del tercer puzle principal: datos, validador,
estado, controlador, escena focal, integración con `archive-criteria-table`,
consecuencias narrativas idempotentes y migración de guardado a formato 4.

El epílogo, la personalización y Max quedan fuera de alcance.

No hagas commit ni push.

---

## Revisión previa obligatoria

Antes de editar, revisa completamente:

- `AGENTS.md`
- `docs/production/CODEX_HANDOFF.md`
- `docs/production/V1_PRODUCTION_PLAN.md`
- `docs/puzzles/ARCHIVE_CRITERIA_SPEC.md`
- `docs/puzzles/LIBRARY_CATALOGUE_SPEC.md`
- `src/puzzles/library-catalogue/` (todo el directorio, como patrón de referencia)
- `src/scenes/LibraryCatalogueScene.js`
- `src/scenes/WorldScene.js`
- `src/state/GameState.js`
- `src/progression/LibraryCatalogueProgression.js`
- `src/core/InputManager.js`
- `src/main.js`
- pruebas existentes de catálogo, mundo, estado y migraciones

Confirma primero:

1. que las teclas necesarias (`moveUp`, `moveDown`, `moveLeft`, `moveRight`,
   `startPuzzleAttempt`, `nextPuzzleHint`, `restartPuzzleAttempt`, `cancel`)
   ya existen en `InputManager.js` — no se necesita ninguna tecla nueva;
2. el patrón exacto de `LibraryCatalogueState`/`LibraryCataloguePuzzle` para
   replicarlo en `archive-criteria`;
3. el contrato exacto de `applyLibraryCatalogueProgression` para
   replicarlo en `applyArchiveCriteriaProgression`;
4. cómo `GameState.restore()` distingue hoy los formatos legacy del mundo
   de los formatos legacy del catálogo, para no repetir el error de
   compartir una sola lista entre conceptos distintos.

Si el estado Git o la arquitectura no coinciden con `CODEX_HANDOFF.md`,
detente antes de editar y explica la discrepancia.

---

## 1. Mecánica

Clasificar seis afirmaciones (`voluntary-entry`, `followed-trail`,
`never-disagreed`, `someone-refuses-now`, `present-choice`,
`universal-future`) en tres veredictos (`confirmed`, `contradicted`,
`undecidable`). IDs, textos, evidencias y solución exactos según
`ARCHIVE_CRITERIA_SPEC.md` §5 y §6 — no inventes ni alteres ninguno.

---

## 2. Fases persistentes

```js
"ready" | "classifying" | "failed" | "solved"
```

Máquina de estados exacta según `ARCHIVE_CRITERIA_SPEC.md` §12.

---

## 3. Campos persistentes

```js
{
  verdicts: {
    "voluntary-entry": null,
    "followed-trail": null,
    "never-disagreed": null,
    "someone-refuses-now": null,
    "present-choice": null,
    "universal-future": null,
  },
  phase: "ready",
  hintsRead: [],
  attemptCount: 0,
  failureCode: null,
}
```

`focusedClaimIndex` es exclusivamente transitorio (no se persiste).

---

## 4. Pistas

Tres reflexiones manuales, sin coste, en
`src/puzzles/archive-criteria/ArchiveCriteriaHints.js` (mismo patrón que
`LibraryCatalogueHints.js`: array de niveles + función
`getArchiveCriteriaHint(level)`). La tercera revela la clasificación
completa (texto exacto en `ARCHIVE_CRITERIA_SPEC.md` §20). Reutiliza
`src/puzzles/core/HintProgress.js` sin modificarlo.

---

## 5. Controles

Reutiliza las acciones ya existentes en `InputManager.js`, sin añadir ni
modificar bindings:

| Tecla | Acción |
|---|---|
| Izquierda/Derecha | `moveLeft` / `moveRight` — navegar entre afirmaciones (transitorio) |
| Arriba/Abajo | `moveUp` / `moveDown` — ciclo de veredicto (persistente) |
| Enter | `startPuzzleAttempt` — confirmar clasificación completa |
| Q | `nextPuzzleHint` — revelar siguiente pista |
| R | `restartPuzzleAttempt` — reiniciar mientras no esté `solved` |
| Escape | `cancel` — volver a `world` conservando el progreso |

Ciclo de veredicto (§11 del spec):

```text
abajo: null -> confirmed -> contradicted -> undecidable -> null
arriba: null -> undecidable -> contradicted -> confirmed -> null
```

---

## 6. `SAVE_FORMAT_VERSION` pasa a 4

```js
export const SAVE_FORMAT_VERSION = 4;
```

Es un cambio de formato aprobado explícitamente para este bloque.

---

## 7. Migración segura desde 1, 2 y 3

Todos los guardados de formato `1`, `2` y `3` deben seguir cargando. Los
tres crean `archiveCriteria` en su estado inicial (`new
ArchiveCriteriaState()`).

---

## 8. Separación obligatoria de listas de formato

**No reutilices una sola lista de "formatos legacy" para todo.** Usa tres
listas distintas y explícitas:

```js
// Versiones generales aceptadas por GameState.restore() además de la actual.
const SUPPORTED_LEGACY_FORMAT_VERSIONS = [1, 2, 3];

// Formatos en los que libraryCatalogue NO tiene datos persistidos.
// El formato 3 YA tiene datos reales del catálogo: no lo incluyas aquí.
const LIBRARY_CATALOGUE_LEGACY_FORMAT_VERSIONS = [1, 2];

// Formatos en los que archiveCriteria NO tiene datos persistidos.
const ARCHIVE_CRITERIA_LEGACY_FORMAT_VERSIONS = [1, 2, 3];
```

`restoreLibraryCatalogue` sigue usando su lista de `[1, 2]` sin cambios de
comportamiento. Solo la nueva `restoreArchiveCriteria` usa
`ARCHIVE_CRITERIA_LEGACY_FORMAT_VERSIONS`.

Cualquier comparación posicional existente como
`data.formatVersion === LEGACY_SAVE_FORMAT_VERSIONS[0]` (usada hoy en
`restoreWorldState` para detectar el formato 1) debe quedar como una
comparación explícita `=== 1`, para no depender del orden de un array que
ahora cambia de tamaño.

---

## 9. Test obligatorio anti-regresión de formato 3

Añade un test explícito en `tests/state/GameState.test.js` que:

1. construya un guardado de formato `3` con el catálogo `solved` (`order`
   = solución, `phase: "solved"`), `archiveUnlocked: true`, posición en
   `archive` o `library`, objetivo y cuaderno ya poblados;
2. lo restaure con `GameState.restore()`;
3. compruebe que `state.puzzles.libraryCatalogue.phase === "solved"` y que
   `state.puzzles.libraryCatalogue.order` sigue siendo la solución real
   (no se reinicializó a `C-M-A-R-D`);
4. compruebe que `state.puzzles.archiveCriteria` es un estado inicial
   nuevo (`phase: "ready"`, todos los veredictos `null`);
5. compruebe que mapa, posición, objetivo, banderas existentes y cuaderno
   se conservan intactos.

Este test es el que detecta si alguien reutiliza por error una sola lista
de formatos legacy compartida.

---

## 10. Progresión idempotente

Crea `src/progression/ArchiveCriteriaProgression.js`, exportando
`applyArchiveCriteriaProgression(state)`:

```js
export function applyArchiveCriteriaProgression(state) {
  if (state.puzzles.archiveCriteria.phase !== ARCHIVE_CRITERIA_PHASE.SOLVED) {
    return { applied: false };
  }

  let changed = false;

  // investigationComplete y epilogueUnlocked se reparan de forma
  // independiente entre sí.
  if (!state.flags.investigationComplete) {
    state.flags.investigationComplete = true;
    changed = true;
  }

  if (!state.flags.epilogueUnlocked) {
    // objectiveId SOLO se escribe aquí: en la transición real
    // false -> true de epilogueUnlocked.
    state.flags.epilogueUnlocked = true;
    state.objectiveId = "start-epilogue";
    changed = true;
  }

  const notebookAdded = state.addNotebookEntry(ARCHIVE_FINAL_EVIDENCE_ENTRY);

  if (!changed && !notebookAdded) {
    return { applied: false };
  }

  return { applied: true, notebookAdded };
}
```

Reglas:

- si `archiveCriteria` no está `solved`: `{ applied: false }`, sin tocar
  nada;
- `investigationComplete` y `epilogueUnlocked` se comprueban y reparan
  cada una por separado, nunca como una condición combinada;
- si `epilogueUnlocked` ya era `true`, no se sobrescribe `objectiveId`,
  aunque falte `investigationComplete` o la entrada de cuaderno;
- si solo falta la entrada de cuaderno, añadirla y devolver
  `{ applied: true, notebookAdded: true }`, conservando cualquier objetivo
  posterior;
- el criterio de "ya está reconciliado" se basa en
  `investigationComplete && epilogueUnlocked && entrada de cuaderno
  presente` — **nunca** en si `objectiveId` sigue siendo
  `"start-epilogue"`.

Sin Canvas, `UiController`, `SceneManager`, `StorageAdapter` ni
`localStorage`. No guarda ni muestra toasts.

Llamar desde dos puntos, sin duplicar lógica:

1. `ArchiveCriteriaScene`, justo después de que confirmar la clasificación
   devuelva `PUZZLE_SOLVED`;
2. `GameState.restore()`, después de restaurar `puzzles.archiveCriteria`,
   como punto canónico de reconciliación (mismo orden relativo que ya usa
   `applyLibraryCatalogueProgression`, aplicada justo antes que esta).

---

## 11. `objectiveId` exacto

```js
"start-epilogue"
```

Etiqueta exacta en `OBJECTIVE_LABELS` de `WorldScene.js`:

```js
"start-epilogue": "La investigación ha terminado."
```

Se asigna únicamente dentro de la rama `if (!state.flags.epilogueUnlocked)`
de `applyArchiveCriteriaProgression`. Si al cargar una partida
`epilogueUnlocked` ya es `true`, esa rama no se ejecuta y cualquier
objetivo posterior ya presente en el guardado se conserva exactamente.

---

## 12. Entrada de cuaderno exacta

```js
{
  id: "archive-final-evidence",
  title: "La pregunta correcta",
  text: "El Archivo conserva dos declaraciones presentes coincidentes y confirma que no dispone de observaciones futuras.",
}
```

No debe incluir la solución del puzle ni narrar el epílogo.

---

## 13. Toast

```text
La investigación ha terminado
```

Se muestra únicamente cuando `epilogueUnlocked` pasa de `false` a `true`
en esa llamada concreta. La escena captura el valor previo antes de
llamar a la función de progresión y compara después, igual que
`LibraryCatalogueScene` ya hace con `archiveUnlocked`:

```js
const wasEpilogueUnlocked = this.state.flags.epilogueUnlocked;
applyArchiveCriteriaProgression(this.state);

if (!wasEpilogueUnlocked && this.state.flags.epilogueUnlocked) {
  this.ui.showToast("La investigación ha terminado");
}
```

No debe mostrarse si solo se reparó `investigationComplete` o la entrada
de cuaderno con `epilogueUnlocked` ya en `true`.

---

## 14. Integración de `archive-criteria-table`

**No modifiques `src/content/worldMaps.js`.** El objeto ya existe con
`id`, posición e `interactionRadius` correctos desde `7a0c13c`. Añade en
`src/scenes/WorldScene.js`, dentro de `interact()`, una rama por `id`
(mismo patrón que `library-silogio` o `p2-bridge-board`):

```js
if (object.id === "archive-criteria-table") {
  this.interactWithArchiveCriteriaTable();
  return;
}
```

`interactWithArchiveCriteriaTable()` hace `syncPlayerState()` y
`this.scenes.change("archive-criteria")`, sin diálogo previo (la
explicación de los tres veredictos vive dentro de la propia escena, igual
que las seis reglas del catálogo viven dentro de `LibraryCatalogueScene`).

---

## 15. Registro de la escena

En `src/main.js`:

```js
scenes.register(
  "archive-criteria",
  new ArchiveCriteriaScene({ scenes, input, state, ui }),
);
```

---

## 16. Archivos permitidos

### Crear

- `src/puzzles/archive-criteria/ArchiveCriteriaData.js`
- `src/puzzles/archive-criteria/ArchiveCriteriaValidator.js`
- `src/puzzles/archive-criteria/ArchiveCriteriaHints.js`
- `src/puzzles/archive-criteria/ArchiveCriteriaState.js`
- `src/puzzles/archive-criteria/ArchiveCriteriaPuzzle.js`
- `src/scenes/ArchiveCriteriaScene.js`
- `src/progression/ArchiveCriteriaProgression.js`
- `tests/puzzles/ArchiveCriteriaData.test.js`
- `tests/puzzles/ArchiveCriteriaValidator.test.js`
- `tests/puzzles/ArchiveCriteriaState.test.js`
- `tests/puzzles/ArchiveCriteriaPuzzle.test.js`
- `tests/scenes/ArchiveCriteriaScene.test.js`
- `tests/progression/ArchiveCriteriaProgression.test.js`

### Modificar

- `src/main.js`
- `src/scenes/WorldScene.js`
- `src/state/GameState.js`
- `tests/state/GameState.test.js`
- `tests/scenes/WorldScene.test.js`
- `tests/e2e/game.spec.js`

### No modificar

- `src/content/worldMaps.js` y `tests/content/WorldMaps.test.js` (sin
  necesidad — ver punto 14);
- todo `src/puzzles/library-catalogue/` y
  `src/progression/LibraryCatalogueProgression.js`;
- todo `src/puzzles/p2-bridges/` (P2 completo);
- `src/core/InputManager.js` (las teclas ya existen);
- `src/ui/UiController.js`, `src/platform/StorageAdapter.js`;
- `package.json`, dependencias, configuración Docker.

Si aparece una necesidad real de tocar un archivo prohibido, detente y
explica el bloqueo.

---

## 17. Pruebas obligatorias

- datos: 6 evidencias y 6 afirmaciones exactas, IDs únicos, solución
  coincide con el spec;
- validador: rechazo estructural completo, distinción
  `incomplete_classification` vs `incorrect_verdicts`, cada afirmación
  rechaza sus otros dos veredictos, solución exacta válida;
- ciclo de veredictos en ambos sentidos, incluido el paso por `null`;
- confirmación incompleta: incrementa intentos, fase `failed`, veredictos
  conservados;
- confirmación incorrecta: incrementa intentos, fase `failed`, **el
  render/`statusMessage` de la escena nunca debe incluir
  `incorrectClaimIds`** (el validador sí puede devolverlos, para
  diagnóstico y tests, pero la UI no los muestra);
- resolución correcta con la clasificación exacta del spec;
- terminalidad tras `solved`: cambiar veredicto, confirmar, reiniciar o
  pedir pista no modifican nada;
- pistas 1, 2 y 3, la tercera revela la clasificación completa;
- reinicio conserva `hintsRead` y `attemptCount`, solo mientras no esté
  `solved`;
- Escape vuelve a `world` conservando todo el estado persistente;
- reentrada antes y después de resolver reconstruye el estado transitorio
  sin alterar lo persistente;
- integración de `archive-criteria-table` (WorldScene.test.js);
- persistencia y migraciones de las tres listas de formato (punto 8) y el
  test anti-regresión del punto 9;
- progresión idempotente: los casos parciales (falta solo
  `investigationComplete`, falta solo el cuaderno, falta solo
  `epilogueUnlocked`, todo reconciliado, primera resolución, fase no
  `solved`);
- toast solo en la transición real de `epilogueUnlocked`;
- regresión: los 149 tests actuales (incluidos todos los de P2 y de
  `LibraryCatalogue*`) siguen en verde sin modificar sus archivos.

---

## 18. Riesgo de desbordamiento de texto en 480×270

El layout es más ajustado que el del catálogo (`ARCHIVE_CRITERIA_SPEC.md`
§24: afirmación máx. 3 líneas, evidencias en ~72px, mensaje/pista máx. 3
líneas). Reutiliza la técnica de ajuste de línea ya usada en
`LibraryCatalogueScene.js` (`wrapText(text, maxChars)` + `slice(0, N)`).
Añade en `ArchiveCriteriaScene.test.js` un test directo sobre esa función
con los textos reales más largos de `ArchiveCriteriaData.js` (la
afirmación y la evidencia más largas), comprobando que el número de
líneas resultante no excede el presupuesto de cada bloque del spec §24.
No basta un test de "el render no lanza excepción".

---

## 19. Validación final

Ejecuta:

```bash
docker compose run --rm game npm run check
docker compose run --rm playwright
git diff --check
git status --short
```

No afirmes que una validación ha pasado sin ejecutar el comando
correspondiente.

Al terminar muestra:

- arquitectura encontrada;
- contrato exacto de `applyArchiveCriteriaProgression`;
- archivos creados y modificados;
- identificadores de bandera, objetivo y cuaderno;
- texto final de la entrada de cuaderno;
- estrategia de migración y las tres listas de formato usadas;
- resultado del test anti-regresión de formato 3;
- total de pruebas unitarias, resultado del build, resultado de
  Playwright, resultado de `git diff --check`, `git status --short`;
- limitaciones y comprobaciones manuales pendientes.

---

## 20. Prohibiciones de este bloque

- no implementar el epílogo (escena, `epilogueStarted`,
  `epilogueCompleted`);
- no implementar personalización (`personalization.js`, marcadores);
- no añadir a Max;
- no modificar P2;
- no ampliar mapas ni tocar `worldMaps.js`;
- no crear accesos temporales, teclas secretas ni menús de depuración;
- no añadir dependencias;
- no hacer refactors generales durante este bloque;
- no renombrar identificadores existentes;
- no modificar código no relacionado con este alcance;
- no acceder directamente a `localStorage` fuera de `StorageAdapter`;
- usar funciones pequeñas y puras cuando sea posible;
- no hacer commit ni push hasta validar el bloque completo.

---

## Comprobación manual preparada

Describe al terminar esta ruta, partiendo de una partida guardada en
formato `3` con el catálogo resuelto:

1. cargar la partida (migra a formato `4` en memoria);
2. entrar al Archivo, caminar hasta la mesa, pulsar E;
3. comprobar navegación izquierda/derecha entre las 6 afirmaciones;
4. comprobar el ciclo de veredicto arriba/abajo, incluido el paso por
   `null`;
5. provocar un fallo incompleto (Enter con algún veredicto en `null`);
6. provocar un fallo incorrecto (las 6 completas, alguna equivocada);
7. consultar las 3 pistas en orden;
8. guardar y cargar a mitad del puzle (fase `classifying` o `failed`);
9. clasificar correctamente las 6 y confirmar;
10. comprobar objetivo (`La investigación ha terminado.`) y cuaderno
    (`archive-final-evidence`);
11. guardar y cargar tras resolver, comprobando que no se repiten
    consecuencias ni el toast;
12. reentrar a la escena tras resolver;
13. salir con Escape en distintos momentos del puzle.

No añadas accesos temporales ni código de depuración.

---

## Contexto de personalización futura — no implementar

Datos aprobados:

- protagonista: Gonzalo;
- pareja: Elena;
- pareja completa: Gonzalo y Elena;
- fecha: 26 de septiembre de 2026;
- fecha ISO: 2026-09-26;
- ciudad real: Logroño;
- pueblo ficticio: Axioma;
- compañero: Max;
- especie: perro;
- raza: pastor belga malinois;
- tono del epílogo: emotivo y divertido.

Dedicatoria prevista:

> Gonzalo y Elena: que nunca os falten caminos por recorrer, preguntas que resolver juntos y razones para seguir diciendo sí. Que la vida os encuentre siempre del mismo lado del puente, con Max cerca, muchas risas y la certeza de que el mejor teorema es el que se demuestra cada día: elegiros una y otra vez.

Marcadores futuros:

```text
{{PROTAGONIST_NAME}}
{{PARTNER_NAME}}
{{COUPLE_NAMES}}
{{DOG_NAME}}
{{DOG_SPECIES}}
{{DOG_BREED}}
{{WEDDING_DATE}}
{{WEDDING_DATE_ISO}}
{{WEDDING_CITY}}
{{STORY_TOWN}}
{{FINAL_DEDICATION}}
```

Esta información solo evita decisiones incompatibles con la
personalización futura.

En este bloque:

- no crear `personalization.js`;
- no sustituir textos existentes;
- no implementar marcadores;
- no añadir a Max;
- no escribir el epílogo;
- no introducir nombres reales en objetivo, cuaderno o mapas;
- mantener Axioma como pueblo ficticio.

---

No hagas commit ni push.
