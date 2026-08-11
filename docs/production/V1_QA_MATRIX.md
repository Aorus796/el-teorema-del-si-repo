# Matriz de QA — `v1.0.0`

Matriz documental que reutiliza evidencia **ya existente** en el
repositorio (tests unitarios, tests E2E, documentos de validación
manual). No se ejecutó ninguna prueba nueva para construir este
documento. Fecha de compilación: 2026-08-11.

Columnas: **Unit/Integration** (`node --test` en `tests/`), **E2E**
(Playwright, `tests/e2e/game.spec.js`), **Manual** (prueba manual humana
registrada, jugando realmente el juego), **Windows** (validado sobre el
ejecutable empaquetado), **Offline** (validado sin conexión a Internet),
**Evidencia** (archivo concreto), **Resultado**.

Ninguna celda se marca PASS sin una evidencia citada. Una celda vacía
significa que esa capa concreta no se ejecutó para ese requisito — no
implica fallo si otras capas sí lo cubren. Dos filas (deducibilidad de
puzles, progresión de objetivos) se basan en **auditoría estática de
código/specs**, no en una prueba manual jugada — se marca explícitamente
así en su columna "Evidencia" y las cinco columnas de capa quedan vacías
("—"), para no confundir una revisión de código con una prueba manual
real.

| Requisito | Unit/Integration | E2E | Manual | Windows | Offline | Evidencia | Resultado |
|---|---|---|---|---|---|---|---|
| Mapas (Plaza, Puentes, Biblioteca, Archivo): estructura, colisiones, salidas | ✅ | ✅ (implícito en cada puzle) | ✅ | ✅ | ✅ | `tests/content/WorldMaps.test.js`; `tests/e2e/game.spec.js`; `WINDOWS_PORTABLE_FULL_QA.md` | PASS |
| P2 — "El paseo imposible" | ✅ | ✅ | ✅ | ✅ | ✅ | `tests/puzzles/P2*`; `game.spec.js:569`; `WINDOWS_PORTABLE_FULL_QA.md` | PASS |
| Biblioteca — "El catálogo perfecto" | ✅ | ✅ | ✅ | ✅ | ✅ | `tests/puzzles/LibraryCatalogue*.test.js`; `game.spec.js:386`; `WINDOWS_PORTABLE_FULL_QA.md` | PASS |
| Archivo — "La pregunta correcta" | ✅ | ✅ | ✅ | ✅ | ✅ | `tests/puzzles/ArchiveCriteria*.test.js`; `game.spec.js:192`; `WINDOWS_PORTABLE_FULL_QA.md` | PASS |
| Puzles deducibles con información/pistas disponibles en el juego | — | — | — | — | — | **Auditoría estática de código/specs** (no prueba manual jugada): Biblioteca: reglas siempre visibles en pantalla (`LibraryCatalogueScene.js`, `LIBRARY_CATALOGUE_SPEC.md`); Archivo: evidencias siempre visibles (`ArchiveCriteriaScene.js`); los tres puzles: sistema de pistas de 3 niveles, libre y sin coste, nivel 3 revela la solución (`P2Hints.js`, `LibraryCatalogueHints.js`, `ArchiveCriteriaHints.js`) | PASS (ver matiz sobre P2 en `V1_PRODUCTION_PLAN.md` §5) |
| Objetivos/progresión narrativa indican el siguiente paso sin revelar la solución | — | — | — | — | — | **Auditoría estática de código** (no prueba manual jugada): `OBJECTIVE_LABELS` en `src/scenes/WorldScene.js` — 10 objetivos reales auditados, ninguno revela una solución de puzle | PASS |
| Cuaderno y pistas (conexión, deduplicación) | ✅ | ✅ (implícito en cada puzle) | ✅ | ✅ | ✅ | `GameState.addNotebookEntry()`; `tests/state/GameState.test.js` | PASS |
| Guardar/cargar en cada localización obligatoria | ✅ | ✅ | ✅ | ✅ | ✅ | `game.spec.js` (guardado/carga por localización: líneas 777, 932, 1153, 1424, 1644, 1848); `WINDOWS_PORTABLE_FULL_QA.md` | PASS |
| Migración de guardados (formatos 1-4) | ✅ | ✅ (formato 1 en navegador real) | — | — | — | `tests/state/GameState.test.js` (formatos 1/2/3/4/999); `game.spec.js:1848` | PASS |
| Restauración de intento incompleto — catálogo (`failed`) | ✅ | ✅ | — | — | — | `tests/puzzles/LibraryCatalogueState.test.js`; `game.spec.js:932` | PASS |
| Restauración de intento incompleto — P2 (`traversing`) | ✅ | ✅ | — | — | — | `tests/puzzles/P2State.test.js` (o equivalente); `game.spec.js:1153` | PASS |
| Restauración de intento incompleto — Archivo (`classifying`) | ✅ | ✅ | — | — | — | `tests/puzzles/ArchiveCriteriaState.test.js`; `game.spec.js:1424` | PASS |
| Guardado inválido/incompatible falla de forma controlada | ✅ (~35 variantes) | ✅ (2 variantes en navegador real) | — | — | — | `tests/state/GameState.test.js` (`LIBRARY_CATALOGUE_INVALID_CASES`, `ARCHIVE_CRITERIA_INVALID_CASES`, `EPILOGUE_FLAG_INVARIANT_INVALID_CASES`, `invalidPositionCases`); `game.spec.js:2022` (`INVALID_SAVE_VARIANTS`) | PASS |
| Epílogo — mecánica completa (desbloqueo, invariantes, idempotencia) | ✅ | ✅ | ✅ | ✅ | ✅ | `GameState.js` (invariantes §13); `game.spec.js:2206`; `EPILOGUE_MANUAL_VALIDATION.md`; `WINDOWS_PORTABLE_FULL_QA.md` | PASS |
| Mecanismo del regalo — código incorrecto | ✅ | ✅ | ✅ | ✅ | ✅ | `EpilogueGiftCodeScene.js`; `game.spec.js:2206`; `WINDOWS_PORTABLE_FULL_QA.md` | PASS |
| Mecanismo del regalo — código correcto `7152` | ✅ | ✅ | ✅ | ✅ | ✅ | `epilogueConfig.js` (`GIFT_CODE_DIGITS`); `game.spec.js:2206`; `WINDOWS_PORTABLE_FULL_QA.md` | PASS |
| Diálogo final | — | ✅ | ✅ | ✅ | ✅ | `game.spec.js:2206`; `EPILOGUE_MANUAL_VALIDATION.md`; `WINDOWS_PORTABLE_FULL_QA.md` | PASS |
| Créditos y tarjetas finales | ✅ | ✅ | ✅ | ✅ | ✅ | `tests/scenes/CreditsScene.test.js`; `game.spec.js:2206`; `WINDOWS_PORTABLE_FULL_QA.md` | PASS |
| Audio (única pista, tema del epílogo) | ✅ | — | ✅ | ✅ | ✅ | `tests/content/epilogueAudioConfig.test.js`; `EPILOGUE_MANUAL_VALIDATION.md` (degradación segura sin archivo); `WINDOWS_PORTABLE_FULL_QA.md` (offline) | PASS (recurso provisional, aceptado para `v1.0.0`) |
| Autosave terminal / estado read-only | ✅ | ✅ | ✅ | ✅ | ✅ | `GameState.test.js:1429,1490`; `game.spec.js:2206` (no-op tras completar); `WINDOWS_PORTABLE_FULL_QA.md` | PASS |
| Build web estático | ✅ | ✅ (Playwright corre contra el build) | — | — | — | `npm run build`/`npm run check`, continuo | PASS |
| Portable Windows x64 (artifact) | ✅ | — | ✅ | ✅ | ✅ | `tests/electron/*`; `electron-builder.yml` + tests dedicados; `WINDOWS_PACKAGING_DECISION.md` tareas 3-4 | PASS |
| GitHub Actions Windows (generación reproducible) | ✅ | — | — | ✅ | — | `tests/workflows/windows-portable-workflow-policy.test.js`; dos ejecuciones reales (runs `31365955708`, `31369511579`) | PASS |
| Instalación limpia (segunda máquina física) | — | — | ✅ | ✅ | — | `WINDOWS_CLEAN_INSTALL_VALIDATION.md` | PASS |
| Funcionamiento offline (ejecutable Windows) | — | — | ✅ | ✅ | ✅ | `WINDOWS_PORTABLE_FULL_QA.md` | PASS |
| QA end-to-end sobre el ejecutable empaquetado | — | — | ✅ | ✅ | ✅ | `WINDOWS_PORTABLE_FULL_QA.md` | PASS |
| Reinicio real de Windows con persistencia | — | — | ✅ | ✅ | — | `WINDOWS_CLEAN_INSTALL_VALIDATION.md` | PASS |
| Compatibilidad/sustitución entre dos builds distintas (A→B→A) | — | — | — | — | — | `WINDOWS_PORTABLE_FULL_QA.md` (sección dedicada) | **NO EJECUTADO** — riesgo residual aceptado explícitamente por el responsable del producto, no bloqueante |
| Duración completa del recorrido | — | — | — | — | — | `WINDOWS_PORTABLE_FULL_QA.md` | **NO MEDIDA** — riesgo aceptado, no bloqueante |
| Rendimiento y escalado pixel-perfect (medición formal) | — | — | ✅ (parcial: solo epílogo) | — | — | `EPILOGUE_MANUAL_VALIDATION.md` (legibilidad 480×270, solo epílogo); sin medición de FPS/tiempos de carga en ningún punto del juego | **NO EJECUTADA (medición formal)** — riesgo aceptado, no bloqueante; se apoya en ausencia de fallos visibles en el recorrido real completo (`WINDOWS_PORTABLE_FULL_QA.md`), evidencia informal |
| Accesibilidad básica (operable 100% con teclado) | ✅ | ✅ (ningún test usa mouse/click) | — | ✅ | — | `src/core/InputManager.js` (solo `keydown`/`keyup`); los 15 tests de `game.spec.js` usan exclusivamente `page.keyboard`; `WINDOWS_PORTABLE_FULL_QA.md` | PASS (alcance básico; no es una certificación WCAG) |
| Defectos bloqueantes o graves conocidos | — | — | — | — | — | Issues de GitHub habilitados, 0 issues (abiertos o cerrados); sin `BUGS.md`/`ISSUES.md`; `CHANGELOG.md` solo registra correcciones ya aplicadas | **NINGUNO REGISTRADO** a fecha 2026-08-11 — no es una afirmación absoluta de "cero defectos", es la constatación de que ninguno está documentado |
| Defectos menores de nomenclatura (personaje/localización/UI) | — | — | — | — | — | **Auditoría estática de código** (no prueba manual): `worldMaps.js` ("La Investigadora"/"Padre de la Investigadora" vs. "la novia"/"el padre de la novia" en diálogos y objetivos; "Biblioteca" vs. "Biblioteca del Margen"); `LibraryCatalogueScene.js` (fase sin traducir en pantalla, a diferencia de `ArchiveCriteriaScene.js`) | **4 ENCONTRADOS, NO BLOQUEANTES** — ver `V1_PRODUCTION_PLAN.md` §5 "Defectos menores conocidos" |

## Notas sobre cobertura numérica (orientativa, no exhaustiva)

- Suite unitaria (`docker compose run --rm game npm run check`, 2026-08-11):
  **546/546 tests**, build estático generado sin errores.
- Suite E2E (`tests/e2e/game.spec.js`): **15 tests**, ninguno usa
  interacción de ratón; cobertura confirmada por última vez el
  2026-08-04 en `EPILOGUE_MANUAL_VALIDATION.md` (15/15). No se
  reejecutó Playwright para este documento — ver limitación más abajo.
- Variantes de guardado inválido probadas: ~35 a nivel unitario
  (`GameState.test.js`) + 2 a nivel E2E en navegador real.

## Limitaciones de esta matriz

- No se ejecutó `docker compose run --rm playwright` como parte de esta
  tarea (instrucción explícita de no repetir Playwright salvo cambio
  técnico accidental). El número de tests E2E (15) y su resultado se
  reutilizan de la última ejecución conocida y registrada
  (`EPILOGUE_MANUAL_VALIDATION.md`, 2026-08-04) más el recuento actual
  de `test(` en `game.spec.js`, no de una ejecución repetida hoy.
- La ausencia de registro de defectos no equivale a ausencia de
  defectos — los Issues de GitHub del repositorio están habilitados y
  muestran 0 issues (abiertos o cerrados) a fecha de este cierre; esto
  documenta que ninguno fue registrado, no que sea imposible que exista
  alguno no reportado.
- La accesibilidad básica cubre únicamente el alcance funcional del
  proyecto (operabilidad por teclado); no constituye una auditoría ni
  certificación WCAG.
- Esta matriz no sustituye ni repite la evidencia detallada de
  `docs/production/WINDOWS_CLEAN_INSTALL_VALIDATION.md` y
  `docs/production/WINDOWS_PORTABLE_FULL_QA.md` — las resume y las
  referencia.
