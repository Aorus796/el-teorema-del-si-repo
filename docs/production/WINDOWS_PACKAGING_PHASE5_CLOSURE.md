# Cierre de la Fase 5 de empaquetado Windows — tarea 8

Auditoría final y cierre documental de las tareas 1-8 de
`docs/production/WINDOWS_PACKAGING_DECISION.md` → "Tareas de
implementación". Esta tarea es exclusivamente documental: no ejecutó
ninguna prueba nueva, no generó ningún ejecutable, y no modificó código,
`electron-builder.yml`, workflows, `package.json`, `package-lock.json` ni
`SAVE_FORMAT_VERSION`. Toda la evidencia citada aquí ya estaba registrada
en las tareas 1-7 y en los documentos de evidencia correspondientes.

**Fecha de cierre**: 2026-08-11.

## Alcance de este cierre

Este documento cierra **exclusivamente el empaquetado Windows** —
las tareas 1-8 de `WINDOWS_PACKAGING_DECISION.md`. No cierra:

- la Fase 5 completa de
  [`V1_PRODUCTION_PLAN.md`](V1_PRODUCTION_PLAN.md) §6 ("Fase 5 — QA,
  accesibilidad básica, guardados y empaquetado"), que incluye también la
  matriz de pruebas del recorrido completo, la corrección de defectos, y
  la revisión de accesibilidad básica — ninguna de las cuales es objeto
  de este documento;
- `v1.0.0` en su conjunto, que sigue dependiendo del resto del contenido
  del juego (ver "Pendiente real para v1.0.0" más abajo);
- ninguna fusión de `feat/v1-production-scope` en `main`, tag, versión ni
  GitHub Release — nada de eso se ha creado.

## Evidencia por tarea

| Tarea | Contenido | Evidencia |
|---|---|---|
| 1 | Shell Electron mínimo (`electron/main.js`, `electron/shell.js`), opciones seguras de `BrowserWindow`, DevTools solo fuera de `isPackaged`, bloqueo de `window.open`/`will-navigate`, instancia única. | `tests/electron/`; detalle en `WINDOWS_PACKAGING_DECISION.md` tarea 1. |
| 2 | Integración con `builds/browser`, persistencia explícita (`userData`/`sessionData` bajo `%APPDATA%\el-teorema-del-si`), Content-Security-Policy estricta. | Dos pruebas gráficas manuales reales en Windows; detalle en tarea 2. |
| 3 | `electron-builder@26.15.7`, target `portable` x64 único, sin instalador/updater/firma obligatoria, candidata manual real generada y probada. | `El-Teorema-del-Si-0.5.0-win-x64-portable.exe`, 99.600.401 bytes, SHA-256 `9AEBB4A0787416C6B41FE203AB42DC231D9D3A3C78ECCAC48A7794332C098463`. |
| 4 | Workflow `.github/workflows/windows-portable.yml`, artifact reproducible vía GitHub Actions. | Run `31369511579`, job `package`: `SUCCESS`; artifact lógico `el-teorema-del-si-windows-x64-portable`. |
| 5 | Guía operativa `WINDOWS_PORTABLE_GUIDE.md`, dirigida a usuario final y mantenedor. | `tests/docs/windows-portable-guide-policy.test.js`. |
| 6 | Prueba manual en una segunda máquina física, Windows 11 Pro 25H2 build 26200.8875 x64, incluido reinicio real con persistencia. | `WINDOWS_CLEAN_INSTALL_VALIDATION.md`. |
| 7 | QA funcional end-to-end sobre el packaged executable: recorrido completo, offline, los tres puzles, epílogo, audio, autosave terminal, reapertura, read-only. | `WINDOWS_PORTABLE_FULL_QA.md`. |
| 8 | Este cierre documental y auditoría final. | Este documento. |

## Artifact de referencia

- **Origen**: run de GitHub Actions `31369511579`.
- **Archivo**: `El-Teorema-del-Si-0.5.0-win-x64-portable.exe`.
- **Bytes**: `99600399`.
- **SHA-256**: `3B9B8308DBF278088681DE142C384A99DF90267C6CD6EA202C502F182003C577`.
- **Authenticode**: `NotSigned`.

Este es el mismo artifact validado en la tarea 4, reutilizado sin cambios
en las tareas 6 y 7. No se ha generado ningún ejecutable adicional para
cerrar la tarea 8.

## Máquina de prueba (tareas 6 y 7)

Segunda máquina física, distinta del entorno de desarrollo: Windows 11
Pro, versión 25H2, build 26200.8875, x64 (confirmado con
`Win32_OperatingSystem`/`winver`, no con el `ProductName` heredado del
registro).

## Criterios de salida de Fase 5 de empaquetado Windows

Auditados uno por uno contra la evidencia real ya registrada. Solo se
marcan cumplidos los que tienen evidencia directa:

| Criterio | Estado | Evidencia |
|---|---|---|
| Electron integrado | Cumplido | `electron@43.3.0`, tarea 1 |
| Build web preservado | Cumplido | `WINDOWS_PACKAGING_DECISION.md` → "Relación entre `npm run build` y el empaquetado" |
| Portable Windows real | Cumplido | Tareas 3 y 4 |
| Arquitectura x64 del payload | Cumplido | Tarea 3 (wrapper PE x86/IA32 es comportamiento estándar del lanzador NSIS; el payload Electron es x64/AMD64) |
| App identity estable (`appId`/`name`/`productName`) | Cumplido | `electron-builder.yml`, tarea 3 |
| Persistencia explícita (`userData`/`sessionData`) | Cumplido | Tarea 2, verificada de nuevo en tareas 6 y 7 |
| Content-Security-Policy estricta | Cumplido | Tarea 2 |
| DevTools bloqueadas en packaged | Cumplido | Tareas 1, 3, 6, 7 |
| `nodeIntegration: false` | Cumplido | Tarea 1 |
| `sandbox: true` | Cumplido | Tarea 1 |
| GitHub Actions Windows | Cumplido | Tarea 4, run `31369511579` |
| Artifact real descargado y verificado | Cumplido | Tarea 4 (`HashMatches: True`) |
| Guía de entrega | Cumplido | Tarea 5, `WINDOWS_PORTABLE_GUIDE.md` |
| Prueba en segunda máquina física | Cumplido | Tarea 6 |
| Reinicio real de Windows con persistencia | Cumplido | Tarea 6 |
| QA end-to-end (recorrido completo) | Cumplido | Tarea 7 |
| Funcionamiento offline | Cumplido | Tareas 3, 6 y 7 |
| Audio | Cumplido | Tarea 7 (única pista, tema del epílogo) |
| Epílogo completo en el ejecutable | Cumplido | Tarea 7 |
| Autosave terminal | Cumplido | Tarea 7 |
| Reapertura / estado read-only | Cumplido | Tarea 7 |
| **Compatibilidad/sustitución entre dos builds (A→B→A)** | **NO EJECUTADO** | Ver "Riesgo residual" abajo |

## Riesgo residual: compatibilidad entre builds (A→B→A)

**NO EJECUTADA.** La secuencia controlada de guardar con una build,
sustituir el ejecutable por otro compatible conservando el mismo perfil
(`%APPDATA%\el-teorema-del-si`), y confirmar que la segunda build carga
el guardado de la primera, nunca se realizó — ni en la tarea 7 ni en
ninguna tarea anterior.

Existen dos outputs históricos distintos, cada uno probado
**individualmente** en su propia tarea:

- **Build A** (tarea 3, manual): `99600401` bytes, SHA-256
  `9AEBB4A0787416C6B41FE203AB42DC231D9D3A3C78ECCAC48A7794332C098463`.
- **Build B** (tarea 4, CI): `99600399` bytes, SHA-256
  `3B9B8308DBF278088681DE142C384A99DF90267C6CD6EA202C502F182003C577`.

Que ambas hayan sido probadas por separado **no equivale** a haber
probado la sustitución entre ellas. Tampoco equivale a esa prueba el
hecho de que ambas compartan `SAVE_FORMAT_VERSION = 4`
(`src/state/GameState.js:15`) — es una inferencia a partir del código, no
una comprobación funcional realizada.

**Decisión final de producto**: el responsable del producto acepta
explícitamente este riesgo residual para `v1.0.0`. Este criterio deja de
ser bloqueante para el cierre de la Fase 5 de empaquetado Windows, sin
que eso signifique que quedó validado, en PASS, ni cubierto
implícitamente por otra evidencia. Puede reevaluarse en una versión
posterior si se considera necesario; no existe todavía ninguna decisión
aprobada de asignarlo formalmente a una `v1.1.0` ni a ninguna otra
versión concreta.

## Qué NO significa este cierre

- **No** significa que `v1.0.0` esté publicada.
- **No** significa que `feat/v1-production-scope` se haya fusionado en
  `main`.
- **No** significa que exista ningún tag, versión `1.0.0` en
  `package.json`, ni GitHub Release.
- **No** significa que la compatibilidad A→B→A esté validada.
- **No** significa que la Fase 5 completa de `V1_PRODUCTION_PLAN.md` §6
  (QA general del recorrido, accesibilidad básica, corrección de
  defectos) esté cerrada.
- **No** certifica que el portable funcione en todas las versiones y
  ediciones posibles de Windows — solo en la instalación concreta
  probada en las tareas 6 y 7.

## Pendiente real para `v1.0.0`

**Revisión posterior (2026-08-11, misma tarea)**: una primera versión de
esta sección se derivó demasiado directamente de casillas de
`V1_PRODUCTION_PLAN.md` sin contrastarlas contra el código, los tests y
la documentación real. Una segunda auditoría, cruzando `src/`, `tests/`
(unitarios y `tests/e2e/game.spec.js`), `EPILOGUE_SPEC.md`,
`EPILOGUE_MANUAL_VALIDATION.md`, `CODEX_HANDOFF.md` y `CHANGELOG.md`,
encontró que varias de esas casillas estaban desactualizadas — el
contenido correspondiente ya estaba implementado y probado, incluida su
validación real dentro del propio ejecutable Windows (tarea 7). Esas
casillas ya se corrigieron en `V1_PRODUCTION_PLAN.md` (§2, §3, §5). Esta
lista refleja el resultado de esa auditoría, no la primera versión.

### 1. Requisitos funcionales/QA todavía realmente abiertos

- **Personalización final** (nombres reales, fecha, mascota, dedicatoria
  del cierre). Genuinamente pendiente: los datos y marcadores ya están
  aprobados y documentados en `CODEX_HANDOFF.md` → "Personalización
  futura", pero la implementación (Fase 4 de `V1_PRODUCTION_PLAN.md`)
  todavía no se ha ejecutado. No es una casilla obsoleta ni existe
  ninguna decisión de excluirla del alcance de `v1.0.0`.
- **Arte**: no se encontró ningún asset gráfico concreto identificado
  como pendiente de sustitución (el juego renderiza todo
  procedimentalmente sobre `<canvas>`, sin sprites ni imágenes en
  `src/assets`), pero tampoco existe una decisión documentada que acepte
  el estilo procedimental actual como definitivo — el "pase visual
  coherente" previsto en la Fase 4 de `V1_PRODUCTION_PLAN.md` no se ha
  ejecutado todavía. Se mantiene como pendiente sin bloqueo identificado
  concreto.
- **Duración medida**: la duración real de un recorrido completo (45-90
  minutos objetivo) sigue sin cronometrarse — confirmado explícitamente
  en la tarea 7 (`WINDOWS_PORTABLE_FULL_QA.md`).
- **Matriz de pruebas del recorrido completo, corrección de defectos
  bloqueantes/graves, y revisión de accesibilidad básica** (§6 Fase 5 de
  `V1_PRODUCTION_PLAN.md`, más allá del empaquetado Windows) — sin
  evidencia de haberse ejecutado como tales; la accesibilidad básica en
  particular no tiene ninguna revisión dedicada registrada.
- **Migraciones y fixtures definitivos de guardado, y build web
  "candidato"** identificado y congelado formalmente para entrega — el
  build web funciona y pasa CI de forma continua, pero no se ha
  designado ningún build concreto como "candidato" a entregar.

### 2. Decisiones/riesgos aceptados, no bloqueantes

- **Compatibilidad/sustitución entre dos builds distintas (A→B→A)**: no
  ejecutada, riesgo residual aceptado explícitamente por el responsable
  del producto para `v1.0.0` (ver arriba). Puede reevaluarse en el
  futuro; no bloquea el cierre de la Fase 5 de empaquetado Windows ni
  de `v1.0.0`.

### 3. Acciones de release todavía no realizadas (fuera de alcance de esta tarea y de esta PR)

- Fusión de `feat/v1-production-scope` en `main`.
- Cambio de versión a `1.0.0` en `package.json`.
- Creación de cualquier tag.
- Creación de cualquier GitHub Release.
- Congelación de contenido (Fase 6), margen de contingencia (Fase 7) y
  entrega final (Fase 8) de `V1_PRODUCTION_PLAN.md`.

### Contenido/mecánica que la auditoría confirmó como YA COMPLETADO (no listado como pendiente — corrección respecto a la primera versión de esta sección)

- **Biblioteca del Margen**: mapa completo, segundo puzle resuelto de
  principio a fin en `tests/e2e/game.spec.js`, y recorrido real sobre el
  ejecutable Windows (tarea 7). Sin funcionalidad pendiente detectada.
- **Epílogo**: las 16 tareas de `EPILOGUE_SPEC.md` §18 están
  implementadas (código real, test E2E completo,
  `EPILOGUE_MANUAL_VALIDATION.md`, y recorrido real en el ejecutable
  Windows). Solo la dedicatoria/textos con datos reales de la pareja
  siguen pendientes — eso se rastrea en "Personalización final", no como
  parte del epílogo en sí.
- **Cuaderno y conexión de pistas**: las cuatro entradas de cuaderno del
  recorrido obligatorio existen en el código real, se disparan al
  resolver cada puzle/el epílogo, y se deduplican por `id` — verificado
  en `tests/state/GameState.test.js`.
- **Audio del epílogo**: integrado, validado en funcionamiento y offline
  (tarea 7). El recurso actual está etiquetado como "provisional y
  sustituible" en su propio nombre/README, pero no existe ninguna
  decisión que exija reemplazarlo antes de `v1.0.0`.

Nada de lo anterior se implementó ni se modificó en esta tarea — es
exclusivamente el resultado de auditar evidencia ya existente en el
repositorio.
