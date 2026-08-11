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
  registrado en el repositorio a esta fecha (sin `BUGS.md`/issue
  tracker activo; auditado `CHANGELOG.md` y `docs/production/`). No es
  una afirmación absoluta de ausencia total de bugs, solo de ausencia de
  ninguno documentado.
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

Todos aceptados explícitamente por el responsable del producto:

- **Compatibilidad/sustitución entre dos builds distintas (A→B→A)**: no
  ejecutada. Riesgo residual aceptado.
- **Duración completa del recorrido**: no cronometrada formalmente. No
  se inventa ninguna cifra; riesgo menor aceptado.
- **Arte/pulido visual**: no existe ningún asset gráfico concreto
  identificado como obligatorio antes de `v1.0.0`; el juego usa
  renderizado procedimental sin defectos visuales conocidos. La
  presentación visual actual se acepta para `v1.0.0`; el pulido gráfico
  adicional queda como trabajo futuro, no como bloqueo.

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
auditoría.

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

## Pendientes puramente de release

Ninguno de estos se ejecuta en esta tarea ni en esta PR:

- Fusión de `feat/v1-production-scope` en `main` (requiere decisión
  humana explícita, fuera del alcance de `autopilot`).
- Cambio de versión a `1.0.0` en `package.json`.
- Creación de cualquier tag.
- Creación de cualquier GitHub Release.
- Fases 6, 7 y 8 de `V1_PRODUCTION_PLAN.md` (congelación de contenido,
  margen de contingencia, entrega final del 10 de septiembre).
- Identificación y congelación formal de los artefactos finales
  (`V1_PRODUCTION_PLAN.md` §12 "Artefactos y entrega", deliberadamente
  sin tocar en este cierre).

## Conclusión

**READY FOR v1.0.0.**

El conjunto mínimo real de requisitos funcionales y de QA para integrar
`feat/v1-production-scope` en `main` está satisfecho: el recorrido
completo (Plaza → Puentes → Biblioteca → Archivo → epílogo) está
implementado, probado a nivel unitario, E2E y manual, y validado tanto
en la versión web como en el ejecutable Windows empaquetado, incluida
una segunda máquina física y un reinicio real del sistema operativo. No
existe ningún defecto bloqueante o grave conocido. Los únicos elementos
sin cerrar son riesgos explícitamente aceptados por el responsable del
producto (compatibilidad A→B→A, duración no cronometrada, pulido visual
opcional) o trabajo explícitamente diferido a después de `v1.0.0`
(personalización final).

**Esta conclusión NO implica**: que `feat/v1-production-scope` ya se
haya fusionado en `main` (no se ha hecho, y esa fusión requiere una
decisión humana explícita, no automatizada); que exista ya una versión
`1.0.0`, un tag o un GitHub Release (ninguno existe); ni que las Fases
6-8 del plan de producción (congelación de contenido, margen de
contingencia, entrega formal del 10 de septiembre de 2026) estén
completadas — siguen correspondiendo a pasos de integración y release
todavía no ejecutados.
