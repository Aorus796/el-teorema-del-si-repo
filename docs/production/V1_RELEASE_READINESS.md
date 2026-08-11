# Release readiness para `v1.0.0`

Auditoría de cierre del conjunto mínimo real de requisitos antes de
integrar `feat/v1-production-scope` en `main`. Tarea exclusivamente
documental: no se implementó ninguna funcionalidad nueva, no se ejecutó
ninguna prueba nueva, no se generó ningún ejecutable nuevo, no se
modificó código funcional.

**Fecha**: 2026-08-11.
**Commit base auditado**: `2cf28ce3ab9ee21cbee8cd06a2f49244f7f0d586`
(`feat/v1-production-scope`, tras la fusión de PR #42, cierre de la Fase
5 de empaquetado Windows).

## Preparación de release (2026-08-11)

Con esta conclusión ya establecida (**READY FOR v1.0.0**), se preparó una
candidata técnica de release: rama `release/v1.0.0` creada desde
`feat/v1-production-scope` (HEAD `5e2ee716bcc359302620fb49b21e5c1e89012f79`,
que incluye el cierre de release-readiness de PR #43), con la versión
fijada a `1.0.0` en `package.json`/`package-lock.json`, `CHANGELOG.md`
cerrado para `1.0.0`, y una Pull Request abierta contra `main`. Esta
preparación **no cambió ninguna conclusión de este documento** — fue la
ejecución técnica de una candidata ya declarada lista, no una nueva
auditoría. Esa PR (#44) ya se fusionó desde entonces — ver "Resultado de
publicación" al final de este documento para el estado real y
[`V1_RELEASE_CLOSURE.md`](V1_RELEASE_CLOSURE.md) para el registro
completo.

## Alcance de `v1.0.0`

Según [`V1_PRODUCTION_PLAN.md`](V1_PRODUCTION_PLAN.md) §3, con las
reconciliaciones ya aplicadas: Plaza del Axioma, Paseo de los Siete
Puentes, Biblioteca del Margen, Archivo compacto, tres puzles
principales, cuaderno y sistema de pistas, guardado y carga, epílogo,
ejecutable para Windows, versión web funcional. La personalización final
(nombres reales, fecha, mascota, dedicatoria) queda **fuera del alcance
bloqueante**, documentada como trabajo posterior.

## Evidencia funcional

Ver el detalle completo, requisito por requisito, en
[`V1_QA_MATRIX.md`](V1_QA_MATRIX.md). Resumen:

- Las cuatro localizaciones, los tres puzles (P2, "El catálogo
  perfecto", "La pregunta correcta"), el cuaderno con deduplicación de
  pistas, y el guardado/carga con migración entre formatos (1-4) están
  implementados y probados a nivel unitario y E2E.
- El epílogo completo (mecanismo del regalo, código `7152`, diálogo
  final, créditos, autosave terminal, estado read-only) está
  implementado, con las 16 tareas de
  [`EPILOGUE_SPEC.md`](EPILOGUE_SPEC.md) §18 cerradas, un test E2E que
  recorre el epílogo íntegro, y un documento de validación manual
  dedicado (`EPILOGUE_MANUAL_VALIDATION.md`).
- El audio (única pista, tema del epílogo) está integrado y se degrada
  de forma segura si falta.

## Evidencia QA

- **Suite unitaria**: 546/546 tests en verde
  (`docker compose run --rm game npm run check`, 2026-08-11).
- **Suite E2E**: 15 tests en `tests/e2e/game.spec.js`, ninguno usa
  interacción de ratón; última ejecución conocida registrada 15/15
  (`EPILOGUE_MANUAL_VALIDATION.md`, 2026-08-04). No se reejecutó
  Playwright para este cierre (instrucción explícita de no repetir
  pruebas).
- **Matriz formal**: [`V1_QA_MATRIX.md`](V1_QA_MATRIX.md), construida
  reutilizando evidencia existente, sin marcar ninguna celda PASS sin
  cita concreta.
- **Defectos conocidos**: no existe ningún defecto bloqueante o grave
  conocido/registrado a esta fecha. Los Issues de GitHub del
  repositorio están habilitados y muestran 0 issues (abiertos o
  cerrados); no existe `BUGS.md`/`ISSUES.md`; `CHANGELOG.md` solo
  registra correcciones ya aplicadas. No es una afirmación absoluta de
  ausencia total de bugs, solo de ausencia de ninguno documentado.
- **Deducibilidad de los puzles y progresión de objetivos**: auditadas
  con evidencia real de código/specs. Las reglas de la Biblioteca y las
  evidencias del Archivo están siempre visibles en pantalla del puzle,
  sin depender de pistas; los tres puzles comparten además un sistema de
  pistas de 3 niveles, libre y sin coste, cuyo nivel 3 revela la
  solución — diseño de accesibilidad documentado explícitamente en las
  especificaciones de la Biblioteca y el Archivo. Los 10 objetivos
  reales del juego (`OBJECTIVE_LABELS` en `WorldScene.js`) indican una
  acción, lugar o persona concretos sin revelar ninguna solución. Ver el
  detalle completo en `V1_PRODUCTION_PLAN.md` §5 y en
  [`V1_QA_MATRIX.md`](V1_QA_MATRIX.md).
- **Accesibilidad básica**: validada para el alcance de `v1` — el juego
  es 100% operable con teclado (`src/core/InputManager.js` solo escucha
  `keydown`/`keyup`; ningún test E2E usa ratón), sin requisitos
  exclusivamente auditivos para resolver puzles, con legibilidad
  revisada manualmente para las escenas del epílogo a 480×270. **No
  constituye una certificación WCAG.**
- **Migraciones/fixtures de guardado**: cobertura material suficiente —
  formatos 1-4 y ~35 variantes de guardado inválido probadas en
  `tests/state/GameState.test.js`, más una migración real de formato 1
  en navegador en `tests/e2e/game.spec.js`.

## Web

Build estático (`npm run build`) validado continuamente por
`npm run check`. El candidato web de `v1.0.0` será el mismo commit que
se integre en `main` — no existe una arquitectura de "candidatos"
separada más allá de eso.

## Windows

Empaquetado Windows: **8/8 tareas completadas**
([`WINDOWS_PACKAGING_DECISION.md`](WINDOWS_PACKAGING_DECISION.md),
cierre documental en
[`WINDOWS_PACKAGING_PHASE5_CLOSURE.md`](WINDOWS_PACKAGING_PHASE5_CLOSURE.md)).
Artifact de referencia: run de GitHub Actions `31369511579`,
`El-Teorema-del-Si-0.5.0-win-x64-portable.exe`, `99600399` bytes,
SHA-256 `3B9B8308DBF278088681DE142C384A99DF90267C6CD6EA202C502F182003C577`,
`NotSigned`. Validado en una segunda máquina física
([`WINDOWS_CLEAN_INSTALL_VALIDATION.md`](WINDOWS_CLEAN_INSTALL_VALIDATION.md)),
incluido un reinicio real de Windows con persistencia, y con QA
end-to-end offline completo
([`WINDOWS_PORTABLE_FULL_QA.md`](WINDOWS_PORTABLE_FULL_QA.md)).

## Riesgos aceptados (no bloqueantes)

### Aceptados explícitamente por el responsable del producto

- **Compatibilidad/sustitución entre dos builds distintas (A→B→A)**: no
  ejecutada. Riesgo residual aceptado.
- **Duración completa del recorrido**: no cronometrada formalmente. No
  se inventa ninguna cifra; riesgo menor aceptado.
- **Arte/pulido visual**: no existe ningún asset gráfico concreto
  identificado como obligatorio antes de `v1.0.0`; el juego usa
  renderizado procedimental sin defectos visuales conocidos. La
  presentación visual actual se acepta para `v1.0.0`; el pulido gráfico
  adicional queda como trabajo futuro, no como bloqueo.
- **Rendimiento y escalado pixel-perfect (medición formal)**: **no
  ejecutada** — no hay medición de FPS ni de tiempos de carga
  registrada. La revisión dedicada de legibilidad a 480×270 solo cubre
  las escenas del epílogo (`EPILOGUE_MANUAL_VALIDATION.md`), no el resto
  del juego con el mismo nivel de detalle formal. No se presenta como
  PASS: se apoya en la ausencia de defectos funcionales visibles durante
  el recorrido real completo (`WINDOWS_PORTABLE_FULL_QA.md`), evidencia
  informal pero real. **Aceptado explícitamente por el responsable del
  producto el 2026-08-11** como riesgo residual no bloqueante para
  `v1.0.0`; la medición sigue sin ejecutarse y no se corrige dentro de
  este cierre.
- **Defectos menores de nomenclatura** (4, encontrados en la auditoría
  estática de textos de este mismo cierre): dos inconsistencias de
  nombre de personaje ("La Investigadora"/"la novia" y "Padre de la
  Investigadora"/"el padre de la novia"), una de nombre de localización
  ("Biblioteca"/"Biblioteca del Margen"), y un valor de fase de puzle sin
  traducir visible en pantalla. Ninguno afecta jugabilidad, lógica ni
  guardado. **Aceptados explícitamente por el responsable del producto
  el 2026-08-11** como riesgos residuales no bloqueantes para `v1.0.0`:
  quedan **conocidos, no corregidos, aceptados** — no se presentan como
  PASS técnico ni como resueltos, y su corrección queda como trabajo de
  pulido menor futuro, sin fecha asignada. Ver el detalle completo en
  `V1_PRODUCTION_PLAN.md` §5 "Calidad y entrega" → "Defectos menores
  conocidos".

Los cinco riesgos anteriores comparten el mismo tratamiento: ninguno se
corrigió, ninguno se mide o prueba de nuevo, ninguno se convierte en
PASS — todos quedan documentados como aceptados y no bloqueantes para
`v1.0.0` por decisión explícita del responsable del producto.

## Trabajo explícitamente post-`v1.0.0`

- **Personalización final** (nombres reales, fecha, mascota, dedicatoria
  con datos privados de la pareja) — documentada en
  [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md) → "Personalización futura",
  fuera del alcance de `v1.0.0` por decisión del responsable del
  producto.
- Cualquier otro elemento de "Orden de trabajo posterior" de
  `CODEX_HANDOFF.md` (Max, etc.).

## Defectos bloqueantes o graves conocidos

**Ninguno.** Ver "Evidencia QA" más arriba para el detalle de la
auditoría. (Sí existen 4 defectos **menores** de nomenclatura,
registrados en "Riesgos aceptados" más arriba — ninguno bloqueante ni
grave.)

## Estado de las Fases (`V1_PRODUCTION_PLAN.md` §6)

| Fase | Estado |
|---|---|
| Fase 1 — Infraestructura, diseño cerrado y herramientas | No auditada en este cierre (decisiones de diseño previas al código, ver nota al inicio de §6) |
| Fase 2 — Biblioteca del Margen y segundo puzle | Reconciliada y satisfecha con evidencia directa |
| Fase 3 — Archivo compacto, tercer puzle y epílogo | Reconciliada y satisfecha con evidencia directa (duración de recorrido no cronometrada, riesgo aceptado) |
| Fase 4 — Arte, audio, textos y personalización | Parcial: audio satisfecho; arte sin pase visual dedicado (riesgo aceptado); personalización fuera de alcance de `v1.0.0` |
| **Fase 5 — QA, accesibilidad básica, guardados y empaquetado** | **COMPLETADA** (2026-08-11) — ver declaración en `V1_PRODUCTION_PLAN.md` §6 |
| Fase 6 — Congelación de contenido y versión candidata | Pendiente — corresponde a integración/release, fecha futura (4-7 de septiembre) |
| Fase 7 — Margen de contingencia | Pendiente — fecha futura (8-9 de septiembre) |
| Fase 8 — Entrega | Pendiente — fecha futura (10 de septiembre) |

## Estado de las Puertas de calidad (§9)

- **Puerta A** (cambio local) y **Puerta B** (integración de fase): son
  checklists reutilizables por cambio individual, no un estado global —
  no se reconcilian como "cerradas" de una vez.
- **Puerta C** (candidata estable): satisfecha en todos sus criterios
  salvo "duración medida entre 45 y 90 minutos", que permanece sin medir
  como riesgo aceptado no bloqueante.
- **Puerta D** (entrega): pendiente — depende de artefactos finales
  congelados que todavía no existen.

## Pendientes puramente de release (estado histórico, ver "Resultado de
publicación" más abajo para el estado real)

Esta sección describía, el 2026-08-11 (antes de la publicación), lo que
faltaba para completar el release. Se conserva sin reescribir como
registro histórico de en qué momento se escribió cada cosa; **todos los
puntos listados a continuación ya se ejecutaron** — ver "Resultado de
publicación" más abajo y [`V1_RELEASE_CLOSURE.md`](V1_RELEASE_CLOSURE.md)
para el registro completo y factual.

**Ya ejecutado** en la preparación de release del 2026-08-11 (ver
"Preparación de release" al inicio de este documento): rama
`release/v1.0.0` creada, versión fijada a `1.0.0` en
`package.json`/`package-lock.json`, `CHANGELOG.md` cerrado para `1.0.0`,
PR abierta contra `main`.

**En el momento de escribir esta sección, sin ejecutar todavía** (ya
ejecutado desde entonces, ver "Resultado de publicación"):

- Fusión de `release/v1.0.0` en `main`.
- Creación del tag `v1.0.0`.
- Creación del GitHub Release.
- Generación del ejecutable Windows final
  (`El-Teorema-del-Si-1.0.0-win-x64-portable.exe`) desde el commit/tag
  definitivo de `main` — el workflow `windows-portable.yml` ya soporta
  esto vía `workflow_dispatch`, sin necesitar cambios. Procedimiento
  completo paso a paso en
  [`RELEASE_PROCEDURE_v1.0.0.md`](RELEASE_PROCEDURE_v1.0.0.md).
- Identificación y congelación formal de los artefactos finales
  (`V1_PRODUCTION_PLAN.md` §12 "Artefactos y entrega" — ya reconciliado).

Las Fases 6, 7 y 8 de `V1_PRODUCTION_PLAN.md` (congelación de contenido,
margen de contingencia, entrega formal del 10 de septiembre) **no** se
ejecutaron como procesos ligados a esas fechas de calendario, que
todavía no han llegado — `v1.0.0` se publicó antes, por una vía
distinta. Ver la nota de reconciliación en `V1_PRODUCTION_PLAN.md` §6.

## Conclusión

**READY FOR v1.0.0.**

El conjunto mínimo real de requisitos funcionales y de QA para integrar
`feat/v1-production-scope` en `main` está satisfecho: el recorrido
completo (Plaza → Puentes → Biblioteca → Archivo → epílogo) está
implementado, probado a nivel unitario, E2E y manual, y validado tanto
en la versión web como en el ejecutable Windows empaquetado, incluida
una segunda máquina física y un reinicio real del sistema operativo. No
existe ningún defecto bloqueante o grave conocido — sí existen 4 defectos
**menores** de nomenclatura, encontrados y documentados en esta misma
auditoría, ninguno bloqueante. Los únicos elementos sin cerrar son
riesgos explícitamente aceptados por el responsable del producto
(compatibilidad A→B→A, duración no cronometrada, pulido visual opcional,
medición formal de rendimiento/escalado, los 4 defectos menores de
nomenclatura) o trabajo explícitamente diferido a después de `v1.0.0`
(personalización final).

**Esta conclusión NO implica** (párrafo histórico, escrito el 2026-08-11
antes de la publicación real — ver "Resultado de publicación" más abajo
para el estado actual): que `release/v1.0.0` (ni el
`feat/v1-production-scope` del que parte) ya se haya fusionado en `main`
(no se ha hecho, y esa fusión requiere una decisión humana explícita, no
automatizada); que exista ya un tag `v1.0.0` o un GitHub Release
(ninguno de los dos existe, aunque la versión `1.0.0` ya está fijada en
`package.json`/`package-lock.json` de la rama `release/v1.0.0`, todavía
sin fusionar); ni que las Fases 6-8 del plan de producción (congelación
de contenido, margen de contingencia, entrega formal del 10 de
septiembre de 2026) estén completadas — siguen correspondiendo a pasos
de integración y release todavía no ejecutados.

## Resultado de publicación (2026-08-11)

`READY FOR v1.0.0` (más arriba) fue el estado **previo** a la
publicación. El estado **posterior**, real y verificado, es:

**`v1.0.0` PUBLISHED / RELEASED.**

- Readiness aprobado (conclusión de este documento, sin cambios).
- `release/v1.0.0` fusionada en `main`: commit
  `ff0c72b9cba30ec98cbccb7a5c32b70b5dfdd733` (PR #44).
- Tag `v1.0.0` creado sobre ese mismo commit.
- Ejecutable Windows final generado desde el tag (`windows-portable.yml`,
  `workflow_dispatch`, run `31517093742`, `success`):
  `El-Teorema-del-Si-1.0.0-win-x64-portable.exe`, `99604577` bytes,
  SHA-256 `5F7CB4D0085E4ADE5C2BCCFCE2DC8AD5FF31DD1D5225334949AAB688C6373669`,
  `NotSigned`.
- GitHub Release "El Teorema del Sí v1.0.0" publicada (no draft, no
  prerelease), con ese ejecutable y `SHA256SUMS.txt` como assets.
- Checksum verificado dos veces: por el propio workflow al generarlo, y
  de nuevo por redescarga desde la Release ya publicada
  (`HashMatch=True`, `LengthMatch=True`).
- Ciclo cerrado — ver la declaración de cierre en
  [`V1_RELEASE_CLOSURE.md`](V1_RELEASE_CLOSURE.md).

Ninguno de los riesgos residuales aceptados (ver "Riesgos aceptados" más
arriba) se reinterpreta como resuelto por el hecho de haberse publicado
la versión. Siguen exactamente en el mismo estado.
