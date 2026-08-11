# Plan de producción de `v1.0.0`

## Fechas y reglas de calendario

- Inicio del plan: **29 de julio de 2026**.
- Primera versión candidata estable: **antes del 4 de septiembre de 2026**;
  debe quedar disponible como máximo al cerrar el **3 de septiembre**.
- Congelación de contenido: **4 de septiembre de 2026**.
- Del **4 al 9 de septiembre** solo se permiten correcciones, pruebas,
  empaquetado y ajustes menores. No se añaden localizaciones, mecánicas,
  puzles, dependencias ni contenido narrativo nuevo.
- Entrega: **10 de septiembre de 2026**.

La estabilidad y la finalización del recorrido principal tienen prioridad
sobre cualquier mejora opcional.

## 1. Objetivo de `v1.0.0`

Entregar una aventura narrativa completa y estable que pueda recorrerse
de principio a fin en 45 a 90 minutos. La experiencia debe comenzar en la
Plaza del Axioma, continuar por el Paseo de los Siete Puentes, la
Biblioteca del Margen y un Archivo compacto, resolver tres puzles
principales y concluir con un epílogo. La personalización final (nombres
reales, fecha, mascota, dedicatoria con datos privados de la pareja)
queda fuera del alcance bloqueante de `v1.0.0` por decisión vigente del
responsable del producto — ver §2 y §4.

La entrega debe conservar una versión web funcional y proporcionar un
ejecutable para Windows probado en una instalación limpia. La tecnología de
empaquetado ya está decidida y aprobada: Electron como runtime de
escritorio y `electron-builder` como herramienta de empaquetado (ver
[`WINDOWS_PACKAGING_DECISION.md`](WINDOWS_PACKAGING_DECISION.md)). Electron
ya está instalado, el shell mínimo ya está implementado, la integración
real con `builds/browser` y la persistencia del guardado ya están
implementadas y validadas, `electron-builder` ya está configurado con una
primera candidata portable Windows x64, ya existe generación reproducible
de ese portable mediante GitHub Actions en Windows (validada con dos
ejecuciones reales y un artifact de CI descargado y ejecutado), ya existe
una guía operativa completa para obtenerlo, verificarlo, ejecutarlo y
construirlo localmente, ya se validó manualmente ese mismo artifact en
una instalación Windows limpia concreta, distinta de las máquinas de
desarrollo, incluida la persistencia tras un reinicio real de Windows, y
ya se completó el QA funcional completo del artefacto — recorrido de
principio a fin, todos los puzles, el epílogo, audio y funcionamiento
offline —, y ya se cerró documentalmente la Fase 5 de empaquetado Windows
(ver la nota de avance justo debajo y
[`WINDOWS_PACKAGING_PHASE5_CLOSURE.md`](WINDOWS_PACKAGING_PHASE5_CLOSURE.md)).
La prueba de compatibilidad entre al menos dos builds portables distintas
no se ejecutó — riesgo residual aceptado explícitamente por el
responsable del producto para `v1.0.0`. **Que el empaquetado Windows esté
cerrado no cierra la Fase 5 completa de este plan** (§6 más abajo incluye
también QA general del recorrido, accesibilidad básica y corrección de
defectos, todavía pendientes) **ni significa que `v1.0.0` esté lista o
publicada** — eso depende del resto del contenido y del QA general
descritos en este documento.

> Nota de avance (tareas de implementación 1 a 8 de
> `WINDOWS_PACKAGING_DECISION.md` → "Tareas de implementación"):
> ya existe un shell mínimo de Electron (`electron/main.js`,
> `electron/shell.js`) con pruebas unitarias en `tests/electron/`, sin
> `preload`, sin IPC. `userData`/`sessionData` ya se fijan bajo
> `%APPDATA%\el-teorema-del-si` antes de `app.whenReady()`, de forma
> fail-closed, y `index.html` ya incluye una Content-Security-Policy
> estricta. `electron-builder@26.15.7` ya está configurado
> (`electron-builder.yml`: target único `portable`, arquitectura única
> `x64`, ASAR activado sin `asarUnpack`, sin instalador, sin
> actualizador, sin firma configurada) y ya generó una primera candidata
> real: `El-Teorema-del-Si-0.5.0-win-x64-portable.exe` (~94,99 MiB,
> SHA-256 `9AEBB4A0787416C6B41FE203AB42DC231D9D3A3C78ECCAC48A7794332C098463`).
> Validado con pruebas gráficas manuales reales en Windows (Node
> portable, sin Docker): la ventana abre sin depender de Node/Docker,
> DevTools bloqueadas, guarda y carga correctamente, el guardado
> sobrevive a cerrar/reabrir y a copiar únicamente el `.exe` (sin el
> repositorio) a otra ubicación, y la aplicación funciona sin conexión a
> Internet. El wrapper portable exterior es un binario PE x86/IA32
> (comportamiento estándar del mecanismo autoextraíble de
> `electron-builder`/NSIS); el payload Electron real que contiene sí es
> x64/AMD64, coherente con la configuración. Sin firma digital
> (`NotSigned`), sin aviso de SmartScreen observado en esta prueba
> concreta. La prueba en una instalación Windows limpia distinta de esta
> máquina de desarrollo ya se completó (tarea 6): en una segunda máquina
> física, con el mismo artifact validado por CI, incluyendo persistencia
> del perfil (`userData`/`sessionData`) y del guardado tras un reinicio
> real de Windows (ver el detalle completo en
> [`WINDOWS_CLEAN_INSTALL_VALIDATION.md`](WINDOWS_CLEAN_INSTALL_VALIDATION.md)).
> Esa validación cubre una única instalación concreta, no todas las
> versiones y ediciones posibles de Windows. El QA funcional completo del
> artefacto ya se completó (tarea 7): recorrido real de principio a fin,
> íntegramente offline, con los tres puzles, el mecanismo del regalo
> (código incorrecto y código correcto `7152`), el diálogo final, los
> créditos, el audio del epílogo, y el estado terminal/read-only tras
> completar el juego (ver el detalle completo en
> [`WINDOWS_PORTABLE_FULL_QA.md`](WINDOWS_PORTABLE_FULL_QA.md)). La
> prueba controlada de compatibilidad/sustitución entre dos builds
> distintas **no se ejecutó** dentro de esa tarea — el responsable del
> producto acepta explícitamente ese riesgo residual para `v1.0.0`. La
> generación reproducible del
> portable vía GitHub Actions ya existe: un workflow Windows separado
> (`.github/workflows/windows-portable.yml`) genera el mismo portable de
> forma automatizada en cada ejecución. Validado con dos ejecuciones
> reales en GitHub Actions Windows (no simuladas): la
> primera detectó, por revisión humana de sus logs, un filtro de rutas
> incompleto y el uso de `actions@v4` (runtime Node 20 deprecado por
> GitHub); ambos se corrigieron y la segunda ejecución (job `package`:
> `SUCCESS`) confirmó que la advertencia de Node.js 20 ya no aparece. El
> CI Linux existente (`ci.yml`) siguió en verde. El artifact de esa
> segunda ejecución (`El-Teorema-del-Si-0.5.0-win-x64-portable.exe`,
> ~94,99 MiB, SHA-256
> `3B9B8308DBF278088681DE142C384A99DF90267C6CD6EA202C502F182003C577`) fue
> descargado por el responsable del producto; su SHA-256 calculado
> localmente coincidió exactamente con el registrado por el runner antes
> de subirlo, confirmando integridad byte a byte; contenía un único
> archivo, sin instaladores adicionales. Ejecutando ese `.exe` descargado
> (no el generado manualmente en la tarea 3): arranca, DevTools
> bloqueadas, y carga correctamente el guardado persistente ya existente
> — más una comprobación acotada adicional de que funciona sin conexión a
> Internet, que **no** sustituye el recorrido offline completo ni el QA
> exhaustivo que se completó después en la tarea 7. Ningún criterio de
> aceptación, checklist ni casilla de este documento relacionado con la
> entrega final se considera cumplido únicamente por esta comprobación
> acotada de la tarea 4 — el QA completo real se registra en la tarea 7
> (ver más arriba). El artefacto no se versiona en el repositorio
> (`release/` está en `.gitignore`). También ya existe
> [`WINDOWS_PORTABLE_GUIDE.md`](WINDOWS_PORTABLE_GUIDE.md), la guía
> operativa para obtener, verificar, ejecutar y construir el portable
> (tarea 5), y el cierre documental y auditoría final de la Fase 5 de
> empaquetado Windows (tarea 8) ya se completó — ver
> [`WINDOWS_PACKAGING_PHASE5_CLOSURE.md`](WINDOWS_PACKAGING_PHASE5_CLOSURE.md).
> **Esta nota cierra únicamente el subconjunto de empaquetado Windows —
> no declara completada la Fase 5 en su conjunto** (§6 más abajo incluye
> QA general y accesibilidad, todavía pendientes), **ni que `v1.0.0` esté
> publicada**.

## 2. Estado de partida desde `v0.5.0`

`v0.5.0` es la base de este plan, no una descripción automática de la versión
vigente. La versión actual debe comprobarse en `package.json` y en las
etiquetas Git al comenzar cada fase.

### Base funcional disponible

- [x] Aplicación web en módulos ES, sin framework ni dependencias externas.
- [x] Canvas 2D para el mundo e interfaz HTML/CSS para diálogos y cuaderno.
- [x] Bucle principal, entrada, escenas, cámara y colisiones.
- [x] Escena de título con nueva partida y carga.
- [x] Plaza del Axioma y Paseo de los Siete Puentes navegables.
- [x] Tutorial diegético, diálogos y progresión inicial del misterio.
- [x] P2 integrado en el mundo, con lógica, validación y persistencia.
- [x] Cuaderno mínimo, objetivos, guardado y carga mediante `localStorage`.
- [x] Posición persistente por mapa.
- [x] Compatibilidad de guardados de formato 1 y 2 en la base existente.
- [x] Pruebas automatizadas con el runner nativo de Node.
- [x] Build web estático en `builds/browser`.

### Trabajo pendiente para `v1.0.0`

- [x] Abrir y completar la Biblioteca del Margen — mapa `library` completo
  en `src/content/worldMaps.js` (NPC, salidas hacia el Paseo y el
  Archivo), segundo puzle "El catálogo perfecto" resuelto de principio a
  fin en `tests/e2e/game.spec.js`, y recorrido real por la Biblioteca ya
  ejecutado sobre el ejecutable Windows empaquetado (tarea 7, ver
  `WINDOWS_PORTABLE_FULL_QA.md`). No se ha detectado ninguna
  funcionalidad de la Biblioteca pendiente en código, tests o
  documentación.
- [x] Diseñar e integrar el segundo puzle.
- [x] Crear el Archivo compacto.
- [x] Diseñar e integrar el tercer puzle.
- [x] Conectar las pistas y el cuaderno a lo largo del recorrido completo
  — las cuatro entradas de cuaderno del recorrido obligatorio
  (`p2-bridges-solution`, `library-catalogue-solution`,
  `archive-final-evidence`, `epilogue-combination-clue`) existen en el
  código real (`src/state/GameState.js`,
  `src/progression/LibraryCatalogueProgression.js`,
  `src/progression/ArchiveCriteriaProgression.js`) y se disparan al
  resolver cada puzle/el epílogo; `GameState.addNotebookEntry()` deduplica
  por `id`, verificado en múltiples pruebas de `tests/state/GameState.test.js`.
  No se ha encontrado ninguna pista o conexión narrativa pendiente
  documentada.
- [x] Escribir e integrar el epílogo — las 16 tareas de
  [`EPILOGUE_SPEC.md`](EPILOGUE_SPEC.md) §18 están completadas (ver la
  lista en Fase 3 más abajo), con implementación real
  (`EpilogueGiftCodeScene.js`, `CreditsScene.js`, banderas e invariantes
  en `GameState.js`), un test E2E que recorre el epílogo completo
  (`tests/e2e/game.spec.js`), un documento de validación manual dedicado
  (`EPILOGUE_MANUAL_VALIDATION.md`), y un recorrido real adicional sobre
  el ejecutable Windows (tarea 7). La dedicatoria/textos siguen siendo
  genéricos, sin nombres ni fechas reales — eso se rastrea por separado
  en "Aplicar la personalización final", más abajo: no implementada, y ya
  no bloqueante de `v1.0.0` (ver esa entrada para el detalle).
- [ ] Sustituir o pulir el arte provisional necesario.
- [x] Integrar el audio aprobado sin comprometer la estabilidad — la
  pista del epílogo (`epilogue-theme-provisional.wav`) está integrada,
  se reproduce en el momento esperado, y su funcionamiento (incluido
  offline) ya se validó en la tarea 7. El nombre y el README del propio
  asset la describen como "provisional y sustituible", pero no existe
  ninguna decisión documentada que exija reemplazarla antes de `v1.0.0`
  — si en el futuro se aprueba un recurso definitivo, esta casilla podría
  reabrirse explícitamente.
- [ ] Aplicar la personalización final — **fuera del alcance bloqueante
  de `v1.0.0`, trabajo para una versión posterior.** `EPILOGUE_SPEC.md`
  establece explícitamente que la personalización de nombres, fechas y
  mensajes privados es "trabajo futuro explícitamente fuera de alcance"
  del epílogo aprobado, y que la tarjeta/dedicatoria genérica actual está
  aprobada para `v1.0.0` sin personalizar. `CODEX_HANDOFF.md` →
  "Personalización futura" ya documenta los datos aprobados (nombres,
  fecha, mascota) y los marcadores previstos para cuando se implemente,
  pero decisión vigente del responsable del producto: `v1.0.0` se cierra
  primero como candidata estable sin esta personalización; no se
  introduce antes. **No marcada como implementada** — sigue sin código
  que la aplique — pero **ya no bloquea el cierre de `v1.0.0`**.
- [x] Validar el empaquetado para Windows (herramienta ya aprobada:
  Electron + `electron-builder`, ver
  [`WINDOWS_PACKAGING_DECISION.md`](WINDOWS_PACKAGING_DECISION.md)). La
  implementación del shell, la persistencia, la CSP, la configuración de
  `electron-builder`, la primera candidata portable real, su generación
  reproducible vía GitHub Actions, la guía operativa de uso/entrega
  (`WINDOWS_PORTABLE_GUIDE.md`), la prueba manual en una instalación
  Windows limpia concreta —distinta de la máquina de desarrollo, con
  persistencia del perfil y del guardado demostrada tras un reinicio real
  de Windows— (ver
  [`WINDOWS_CLEAN_INSTALL_VALIDATION.md`](WINDOWS_CLEAN_INSTALL_VALIDATION.md)),
  y el QA funcional completo del artefacto empaquetado —recorrido de
  principio a fin, todos los puzles, el epílogo, audio y funcionamiento
  offline— (ver
  [`WINDOWS_PORTABLE_FULL_QA.md`](WINDOWS_PORTABLE_FULL_QA.md)), y el
  cierre documental/auditoría final (ver
  [`WINDOWS_PACKAGING_PHASE5_CLOSURE.md`](WINDOWS_PACKAGING_PHASE5_CLOSURE.md))
  ya están completos y validados, correspondiendo íntegramente a las
  tareas 1-8 de `WINDOWS_PACKAGING_DECISION.md`. La prueba controlada de
  compatibilidad/sustitución entre dos builds portables distintas **no se
  ejecutó**: es un riesgo residual que el responsable del producto acepta
  explícitamente para `v1.0.0`, no un bloqueo de esta casilla. Esta
  casilla marca satisfecha la validación funcional completa del
  empaquetado Windows (tareas 1-8, Fase 5 de empaquetado Windows
  cerrada); no marca cerrada la Fase 5 completa de este plan (§6 más
  abajo), que incluye QA general y accesibilidad todavía pendientes, ni
  que `v1.0.0` esté publicada.
- [ ] Ejecutar QA completo sobre web, guardados y ejecutable.

El `README.md` conserva información histórica desactualizada y no debe usarse
como prueba del estado funcional. Para planificar cada tarea se debe
contrastar código, pruebas, `package.json`, etiquetas Git y este documento.

## 3. Alcance obligatorio

`v1.0.0` debe incluir exactamente:

- [x] Plaza del Axioma — base funcional ya implementada (§2 "Base
  funcional disponible").
- [x] Paseo de los Siete Puentes — base funcional ya implementada, con P2
  integrado.
- [x] Biblioteca del Margen — ver evidencia en §2 más arriba.
- [x] Archivo compacto — tercer puzle implementado e integrado.
- [x] Tres puzles principales en total — P2, "El catálogo perfecto" y "La
  pregunta correcta", los tres implementados, probados y recorridos
  realmente (incluido en el ejecutable Windows, tarea 7).
- [x] Cuaderno y sistema de pistas suficiente para resolver el recorrido
  — ver evidencia en §2 más arriba.
- [x] Guardado y carga de todo el progreso obligatorio — ver §5 "Estado y
  guardado" más abajo, ya `[x]` en su totalidad.
- [x] Epílogo — ver evidencia en §2 más arriba.
- ~~Personalización final aprobada~~ — **retirada como requisito
  bloqueante de `v1.0.0`** por decisión vigente del responsable del
  producto (ver §2 y §4). No implementada; pasa a trabajo posterior.
- [x] Ejecutable para Windows — tareas 1-8 de
  `WINDOWS_PACKAGING_DECISION.md` completadas, Fase 5 de empaquetado
  Windows cerrada, recorrido completo del contenido actual (incluida la
  Biblioteca y el epílogo) validado sobre el propio ejecutable (tarea 7).
- [x] Versión web funcional — validada de forma continua por
  `docker compose run --rm game npm run check` (build + suite completa).
- [ ] Duración objetivo de 45 a 90 minutos en una partida normal —
  todavía sin medir; la tarea 7 registró explícitamente que la duración
  del recorrido en el ejecutable Windows no se cronometró.

Los tres puzles son:

1. P2 existente en el Paseo de los Siete Puentes.
2. Segundo puzle en la Biblioteca del Margen: **El catálogo perfecto**,
   decisión definitiva documentada en
   [`../puzzles/LIBRARY_CATALOGUE_SPEC.md`](../puzzles/LIBRARY_CATALOGUE_SPEC.md).
3. Tercer puzle en el Archivo: **La pregunta correcta**, decisión definitiva
   documentada en
   [`../puzzles/ARCHIVE_CRITERIA_SPEC.md`](../puzzles/ARCHIVE_CRITERIA_SPEC.md).

Las mecánicas definitivas del segundo y tercer puzle están cerradas y
documentadas.

El epílogo (narrativa, combinación del candado real, estado persistente y
descomposición en tareas pequeñas para `autopilot`) tiene su propia
especificación aprobada y cerrada en
[`EPILOGUE_SPEC.md`](EPILOGUE_SPEC.md). **Sus 16 tareas ya están
implementadas** (ver la lista completa en §6, Fase 3, "Epílogo — tareas
desglosadas para `autopilot`", todas `[x]`); `EPILOGUE_SPEC.md` remite
explícitamente a este documento como fuente de verdad sobre qué tarea
está implementada en cada momento. La dedicatoria y los textos del cierre
siguen siendo genéricos, sin nombres ni fechas reales — eso corresponde a
"Aplicar la personalización final" (§2), no a estas 16 tareas.

## 4. Elementos expresamente fuera de alcance

No forman parte de `v1.0.0`:

- Jardín completo.
- Molino completo.
- Observatorio completo.
- Interiores secundarios.
- Metapuzle largo.
- Más de tres puzles principales.
- Migración a otro motor.
- Rehacer la arquitectura.
- Sistemas generales que no sean necesarios para el recorrido congelado.
- Contenido secundario que ponga en riesgo la fecha de entrega.
- Instalar o ejecutar una herramienta de empaquetado distinta de la ya
  aprobada (Electron + `electron-builder`, ver
  [`WINDOWS_PACKAGING_DECISION.md`](WINDOWS_PACKAGING_DECISION.md)) sin
  una nueva aprobación explícita.
- **Personalización final** (nombres reales, fecha, mascota, dedicatoria
  con datos privados de la pareja) — decisión vigente del responsable del
  producto (2026-08-11): `v1.0.0` se entrega con la dedicatoria/textos del
  epílogo genéricos, sin esos datos. Los datos aprobados y los marcadores
  previstos siguen documentados en `CODEX_HANDOFF.md` → "Personalización
  futura" para una versión posterior; no se implementan antes de
  `v1.0.0`.

Las salidas hacia zonas no incluidas pueden permanecer bloqueadas mediante
una respuesta narrativa breve. No deben convertirse en nuevas áreas
jugables.

## 5. Definición de «terminado» para `v1.0.0`

### Recorrido y contenido

- [x] Una partida nueva permite llegar desde la Plaza hasta el epílogo sin
  comandos de desarrollo ni accesos directos — recorrido real ejecutado
  sobre el ejecutable Windows sin saltar estado por consola/`localStorage`
  (tarea 7, ver `WINDOWS_PORTABLE_FULL_QA.md`).
- [x] Plaza, Paseo, Biblioteca y Archivo compacto son navegables y no
  contienen bloqueos involuntarios — confirmado en el mismo recorrido.
- [x] Los tres puzles se abren desde el mundo, se pueden resolver y producen
  el avance narrativo previsto — confirmado en el mismo recorrido y en
  `tests/e2e/game.spec.js`.
- [ ] Cada puzle obligatorio es deducible con información disponible dentro
  del juego.
- [x] El cuaderno registra sin duplicados las pistas y conclusiones
  obligatorias — `GameState.addNotebookEntry()` deduplica por `id`,
  verificado en `tests/state/GameState.test.js`.
- [ ] Los objetivos indican el siguiente paso sin revelar directamente las
  soluciones.
- [x] El epílogo se activa una sola vez tras completar el tercer puzle —
  invariantes de banderas (`epilogueUnlocked ⟹ investigationComplete`,
  etc.) validadas atómicamente en `GameState.restore()`, y flujo idempotente
  confirmado en el test E2E del epílogo completo.
- ~~La personalización aprobada está aplicada y revisada~~ — fuera del
  alcance bloqueante de `v1.0.0` (ver §2, §4). No implementada; no exigida
  para esta versión.
- [ ] Una prueba cronometrada completa dura entre 45 y 90 minutos —
  todavía sin medir (ver "Duración" en `WINDOWS_PACKAGING_PHASE5_CLOSURE.md`).

### Estado y guardado

- [x] Se puede guardar y cargar en cada localización obligatoria.
- [x] Se conservan mapa, posición, banderas, objetivo, cuaderno, pistas y
  estado completo de los tres puzles.
- [x] Un intento incompleto de cada puzle puede restaurarse o reiniciarse de
  forma segura según su diseño aprobado.
- [x] Los guardados compatibles de `v0.5.0` se restauran mediante migración
  explícita y probada si cambia el formato.
- [x] Un guardado inválido o incompatible falla de forma controlada y no
  corrompe otro progreso.

### Calidad y entrega

- [x] `docker compose run --rm game npm run check` termina con código 0 —
  cierto en el momento de esta auditoría (546/546 tests, build OK); es una
  comprobación puntual, no un estado permanentemente garantizado hacia el
  futuro.
- [x] El recorrido completo se supera manualmente solo con los controles
  publicados — recorrido real con teclado, sin comandos de desarrollo
  (tarea 7, `WINDOWS_PORTABLE_FULL_QA.md`).
- [x] La consola permanece sin errores durante una partida completa — no
  como observación visual únicamente: `tests/e2e/game.spec.js` usa
  `collectJavaScriptErrors()` (captura `pageerror`/`console` tipo error)
  con aserción real `expect(errors).toEqual([])` en 13 tests, cubriendo
  los tres puzles, el epílogo completo y el guardado/carga en cada
  localización. El recorrido manual íntegro en un único proceso (tarea 7)
  no pudo verificar la consola porque las DevTools están deliberadamente
  bloqueadas en el ejecutable empaquetado — la cobertura real proviene de
  los tests E2E segmentados, no de una única sesión continua.
- [x] La versión web funciona desde el build estático — validado de forma
  continua por `npm run check`.
- [x] El ejecutable funciona en una instalación limpia de Windows — tareas
  6 y 7.
- [x] La versión web sigue funcionando después de introducir el
  empaquetado — ver `WINDOWS_PACKAGING_DECISION.md` → "Relación entre
  `npm run build` y el empaquetado".
- [ ] No quedan defectos bloqueantes ni defectos graves conocidos — no
  existe ningún registro de defectos en el repositorio (ni una lista, ni
  un issue tracker), por lo que esta casilla no puede confirmarse
  positivamente: ausencia de registro no equivale a ausencia de defectos.
- [ ] Los defectos menores aceptados están registrados con una solución
  alternativa clara o una justificación de entrega — mismo motivo:
  no existe ese registro todavía.
- [ ] La versión candidata estable existe al cerrar el 3 de septiembre —
  fecha futura, todavía no alcanzada.
- [ ] Del 4 al 9 de septiembre no se incorpora contenido nuevo — fecha
  futura, todavía no alcanzada.

## 6. Plan por fases

> Las casillas de esta sección reflejan el estado auditado contra
> código/tests reales el 2026-08-11 (Fases 2, 3, 4 y 5 en particular; ver
> `WINDOWS_PACKAGING_PHASE5_CLOSURE.md` para el detalle de esa auditoría).
> Los textos de riesgos, fechas de calendario y reglas de recorte
> conservan el plan histórico tal como se aprobó, y no se han
> reinterpretado retroactivamente. La Fase 1 no se auditó en esta ronda —
> sus casillas describen decisiones de diseño/planificación previas al
> código, no estado de implementación.

### Fase 1 — Infraestructura, diseño cerrado y herramientas

**Fechas:** 29 de julio al 2 de agosto.

#### Entregables

- [ ] Flujo narrativo cerrado desde el final de P2 hasta el epílogo.
- [ ] Especificación breve y comprobable del segundo puzle.
- [ ] Especificación breve y comprobable del tercer puzle.
- [ ] Arquitectura mínima del sistema de pistas y su relación con el
  cuaderno.
- [ ] Decisión documentada sobre el formato de mapas de Biblioteca y Archivo.
- [x] Decisión aprobada sobre la herramienta de empaquetado para Windows, sin
  instalarla todavía: Electron + `electron-builder`, ver
  [`WINDOWS_PACKAGING_DECISION.md`](WINDOWS_PACKAGING_DECISION.md).
- [ ] Pipeline mínimo de pruebas de interfaz definido.
- [ ] Estrategia de arte y audio con inventario, formato, responsables y
  fecha de integración.
- [ ] Esquema de progreso de `v1.0.0`: mapas, banderas, objetivos, entradas de
  cuaderno y estados de los tres puzles.
- [ ] Plan de migración del guardado desde los formatos ya compatibles.
- [ ] Backlog de producción ordenado por dependencia y criticidad.

#### Criterios de aceptación

- [ ] Cada decisión pendiente de la sección 11 tiene responsable, resultado
  y criterio de validación antes de finalizar el 2 de agosto.
- [ ] Los dos nuevos puzles caben en una pantalla o interacción acotada y
  pueden prototiparse sin ampliar la arquitectura.
- [ ] Existe al menos una solución válida documentada para cada puzle nuevo y
  una forma objetiva de validarla.
- [ ] El recorrido completo cabe razonablemente en 45 a 90 minutos.
- [ ] El formato de mapas elegido puede integrarse con cámara, colisiones y
  objetos existentes sin migrar de motor.
- [ ] La propuesta de empaquetado preserva el build web.
- [ ] `npm run check` sigue pasando mediante Docker al cerrar la fase.

#### Pruebas necesarias

- [ ] Ejecutar la suite y el build de referencia con
  `docker compose run --rm game npm run check`.
- [ ] Registrar una prueba manual del vertical slice existente.
- [ ] Crear casos de papel para solución, fallo, reinicio y pista de los dos
  puzles pendientes.
- [ ] Definir fixtures de guardado de la versión base que deberán mantenerse.

#### Riesgos

- El diseño de los puzles no converge antes del 2 de agosto.
- Se intenta introducir una herramienta antes de aprobarla.
- El formato de mapas obliga a una refactorización extensa.
- La planificación supera la duración objetivo.

#### Qué recortar primero si aparece retraso

1. Variantes opcionales de diálogo y ambientación.
2. Pistas escalonadas adicionales, conservando al menos las necesarias para
   que cada solución sea deducible.
3. Automatización de interfaz no esencial, manteniendo pruebas manuales y
   pruebas unitarias de lógica.
4. Pulido visual previsto para localizaciones ya funcionales.

No se recortan las cuatro localizaciones, los tres puzles, el guardado, el
epílogo, la web ni la entrega para Windows.

### Fase 2 — Biblioteca del Margen y segundo puzle

**Fechas:** 3 al 10 de agosto.

#### Entregables

- [x] Mapa funcional de la Biblioteca del Margen — `src/content/worldMaps.js`.
- [x] Entrada desde la Plaza y retorno controlado — matiz: la entrada real
  es desde el Paseo de los Siete Puentes (`seven-bridges-to-library` /
  `library-to-seven-bridges`, ambas con `targetPlayerState`); la Plaza
  mantiene únicamente un `blocked-exit` marcador hacia la Biblioteca, no
  una salida activa directa.
- [x] Colisiones, objetos e interacciones obligatorias de la Biblioteca —
  `solidRegions` y el NPC `library-silogio`, disparador del puzle
  (`WorldScene.js`).
- [x] Secuencia narrativa que conduce desde la pista de P2 al segundo
  puzle — interacción con `library-silogio` abre `LibraryCatalogueScene`.
- [x] Segundo puzle implementado según la decisión cerrada en la fase 1.
- [x] Validador y estado del segundo puzle separados de su renderizado —
  `LibraryCatalogueValidator.js`, `LibraryCatalogueState.js`,
  `LibraryCatalogueData.js`, `LibraryCatalogueHints.js`, independientes
  de `LibraryCatalogueScene.js`.
- [x] Pistas y entradas de cuaderno asociadas — entrada
  `library-catalogue-solution`, pistas vía `LibraryCatalogueHints.js`.
- [x] Progreso y guardado ampliados con migración y pruebas —
  `tests/state/GameState.test.js` cubre `libraryCatalogue` en formatos
  1-4.
- [x] Salida narrativa hacia el Archivo compacto — `library-to-archive`.

#### Criterios de aceptación

- [x] Un guardado de la base puede abrirse y continuar hasta la Biblioteca
  — migraciones de formato probadas en `GameState.test.js`.
- [x] El jugador puede entrar, explorar, resolver el segundo puzle, recibir
  la siguiente pista y salir sin bloqueo — `tests/e2e/game.spec.js`.
- [x] La solución correcta, los errores y el reinicio producen estados
  definidos — `tests/puzzles/LibraryCatalogueState.test.js` cubre la fase
  `failed` con `failureCode`.
- [ ] Las pistas necesarias están disponibles antes de exigir la solución
  — sin evidencia específica localizada para la Biblioteca (a diferencia
  del Archivo, donde sí se confirmó explícitamente; ver Fase 3).
- [x] Cargar antes, durante y después del puzle restaura un estado
  coherente — múltiples tests de restauración en `GameState.test.js`.
- [x] El segundo puzle puede completarse con teclado — `game.spec.js`
  resuelve el puzle exclusivamente con teclado.
- [ ] La Biblioteca no habilita ninguna zona fuera de alcance — sin
  evidencia específica auditada de esta comprobación en particular.

#### Pruebas necesarias

- [x] Pruebas unitarias de reglas, validador y estados del segundo puzle —
  `tests/puzzles/LibraryCatalogueData.test.js`,
  `LibraryCatalogueValidator.test.js`, `LibraryCatalogueState.test.js`,
  `LibraryCataloguePuzzle.test.js`, `tests/scenes/LibraryCatalogueScene.test.js`.
- [x] Pruebas de mapa: identificadores únicos, colisiones y salidas válidas
  — `tests/content/WorldMaps.test.js` (genérico para todos los mapas,
  incluida la Biblioteca).
- [x] Pruebas de progresión desde `libraryObjectiveUnlocked` hasta la pista
  del Archivo — `tests/progression/LibraryCatalogueProgression.test.js`.
- [x] Pruebas de serialización, migración y restauración del nuevo estado
  — `GameState.test.js`.
- [x] Prueba manual completa Plaza → Paseo → Biblioteca — cubierta dentro
  del recorrido real de la tarea 7 (`WINDOWS_PORTABLE_FULL_QA.md`).
- [x] `docker compose run --rm game npm run check` — verde en el momento
  de esta auditoría.

#### Riesgos

- Mecánica del segundo puzle demasiado compleja o difícil de explicar.
- Acoplamiento de la Biblioteca a condiciones específicas de `WorldScene`.
- Migración de guardado incompleta.
- Contenido narrativo mayor que el tiempo disponible.

#### Qué recortar primero si aparece retraso

1. NPCs y conversaciones ambientales no obligatorias.
2. Decoración y animaciones secundarias de la Biblioteca.
3. Variantes visuales y pistas opcionales del segundo puzle.
4. Transiciones elaboradas; conservar un cambio de mapa claro y estable.

### Fase 3 — Archivo compacto, tercer puzle y epílogo

**Fechas:** 11 al 18 de agosto.

#### Entregables

- [x] Mapa compacto y funcional del Archivo — `worldMaps.js`, validado
  como compacto (`tests/content/WorldMaps.test.js`, límites de tamaño).
- [x] Acceso desde la Biblioteca y retorno si lo requiere el flujo
  aprobado — `library-to-archive` / `archive-to-library`.
- [x] Secuencia de investigación final — clasificación de seis
  afirmaciones con pistas consultables (`ArchiveCriteriaScene.js`).
- [x] Tercer puzle implementado según la decisión cerrada en la fase 1.
- [x] Validador y estado del tercer puzle separados del renderizado —
  `ArchiveCriteriaValidator.js`, `ArchiveCriteriaState.js`,
  `ArchiveCriteriaData.js`, `ArchiveCriteriaHints.js`.
- [x] Integración completa de pistas y cuaderno — entrada
  `archive-final-evidence`, 3 niveles de pista consultables libremente
  durante la fase `classifying` (`ArchiveCriteriaScene.js`).
- [x] Epílogo funcional activado por la resolución del tercer puzle —
  `epilogueUnlocked` se activa al resolver el Archivo.
- [x] Guardado y carga antes, durante y después del final —
  `GameState.test.js` cubre `archiveCriteria` en sus cuatro fases y el
  estado terminal del epílogo (`giftCodeSolved`/`epilogueCompleted`
  restaurados de forma estable).
- [x] Primer recorrido funcional completo de inicio a epílogo —
  ejecutado realmente en la tarea 7 (`WINDOWS_PORTABLE_FULL_QA.md`); no
  existe un único test E2E automatizado que recorra los tres puzles
  seguidos desde una partida nueva real (cada test E2E siembra el estado
  de la etapa que prueba), pero el recorrido manual real sí cubrió la
  secuencia completa sin atajos.

#### Criterios de aceptación

- [x] El recorrido completo no necesita accesos de desarrollo — confirmado
  en el mismo recorrido de la tarea 7 (sin consola ni `localStorage`).
- [x] El Archivo es deliberadamente compacto y solo contiene elementos
  necesarios para la conclusión — límites de tamaño verificados en tests.
- [x] El tercer puzle es deducible, reiniciable y resoluble con teclado —
  `tests/e2e/game.spec.js` lo resuelve íntegramente con teclado; pistas
  consultables libremente antes de confirmar (`ArchiveCriteriaScene.js`).
- [x] Resolverlo actualiza una sola vez el progreso y abre el epílogo —
  `tests/progression/ArchiveCriteriaProgression.test.js` cubre
  idempotencia.
- [x] Cargar una partida terminada conserva el estado final —
  `GameState.test.js` verifica que restaurar dos veces con
  `giftCodeSolved=true` produce el mismo resultado.
- [x] El epílogo cierra la historia sin introducir nuevas localizaciones ni
  un metapuzle largo — hecho de diseño confirmado por el alcance
  implementado (sin nuevas localizaciones).
- [ ] Una medición preliminar del recorrido queda dentro o cerca del
  intervalo de 45 a 90 minutos — **no medida**. La tarea 7 registró
  explícitamente que la duración no se cronometró; no se inventa ninguna
  cifra.

#### Pruebas necesarias

- [x] Pruebas unitarias de reglas, validador y estados del tercer puzle —
  suite dedicada bajo `src/puzzles/archive-criteria/` con sus tests.
- [x] Pruebas de mapa y transiciones de Biblioteca a Archivo —
  `WorldMaps.test.js`.
- [x] Pruebas de progresión desde el segundo puzle hasta el epílogo —
  `ArchiveCriteriaProgression.test.js`.
- [x] Pruebas de idempotencia del final y de entradas de cuaderno —
  `ArchiveCriteriaProgression.test.js` (varios tests dedicados),
  reforzado por el test E2E del epílogo completo.
- [x] Pruebas de guardado en todos los estados nuevos —
  `GameState.test.js`.
- [ ] Prueba manual completa cronometrada — el recorrido manual completo
  sí se ejecutó (tarea 7), pero **sin cronometrar**; esta casilla exige
  específicamente la medición de tiempo, que no existe. No se marca `[x]`
  para no confundir "recorrido realizado" con "recorrido medido".
- [x] `docker compose run --rm game npm run check` — verde en el momento
  de esta auditoría.

#### Riesgos

- El tercer puzle retrasa la integración del final.
- El Archivo crece más allá de su función narrativa.
- El epílogo depende de demasiadas banderas frágiles.
- La duración total supera los 90 minutos.

#### Qué recortar primero si aparece retraso

1. Exploración opcional y objetos ambientales del Archivo.
2. Variaciones del epílogo; conservar un final único y completo.
3. Animaciones y transiciones no esenciales.
4. Capas de pistas opcionales, nunca la información mínima deducible.

#### Epílogo — tareas desglosadas para `autopilot`

Especificación aprobada y cerrada:
[`EPILOGUE_SPEC.md`](EPILOGUE_SPEC.md). Cada tarea se selecciona,
implementa y valida de forma independiente con el flujo completo de
`CLAUDE.md` (`planner` → `developer` → `qa` → quality gate → `reviewer`
→ commit → PR), respetando las dependencias indicadas entre paréntesis.

- [x] 1. Estado persistente y migración de las nuevas banderas
  (`EPILOGUE_SPEC.md` §18.1; sin dependencias).
- [x] 2. Desbloqueo del epílogo y actualización del objetivo/cuaderno al
  resolver el Archivo (§18.2; depende de las tareas 1 y 4).
- [x] 3. Punto interactivo del mecanismo en la Plaza (§18.3; depende de
  la tarea 1).
- [x] 4. Configuración centralizada de la combinación (§18.4; sin
  dependencias).
- [x] 5. Interfaz y lógica del selector de cuatro cifras (§18.5; depende
  de las tareas 1, 3 y 4).
- [x] 6. Comportamiento de combinación incorrecta y correcta (§18.6;
  depende de la tarea 5).
- [x] 7. Persistencia y restauración de `giftCodeSolved` (§18.7; depende
  de las tareas 1 y 6).
- [x] 8. Estado visual de amanecer en la Plaza (§18.8; depende de la
  tarea 6).
- [x] 9. Aparición de la novia en la Plaza (§18.9; depende de las
  tareas 6 y 8).
- [x] 10. Interacción con la novia y diálogo final aprobado (§18.10;
  depende de la tarea 9).
- [x] 11. Pantalla inequívoca con la combinación del candado real
  (§18.11; depende de la tarea 6; puede fusionarse con ella).
- [x] 12. Música del epílogo con recurso sustituible (§18.12; depende de
  la tarea 10, o puede adelantarse).
- [x] 13. Tarjetas finales y créditos (§18.13; depende de la tarea 10).
- [x] 14. Transición atómica de cierre y retorno seguro al menú (§18.14;
  depende de las tareas 1 y 13).
- [x] 15. Pruebas unitarias, de contenido y E2E del recorrido completo
  (§18.15; depende de las tareas 1–14).
- [x] 16. Revisión manual de duración, legibilidad, audio y empaquetado
  (§18.16; depende de la tarea 15; no automatizable).

### Fase 4 — Arte, audio, textos y personalización

**Fechas:** 19 al 27 de agosto.

#### Entregables

- [ ] Pase visual coherente de las cuatro localizaciones — sin ejecutar
  todavía; no hay evidencia de una revisión visual dedicada (el estilo
  actual es 100% procedimental, sin assets de imagen).
- [ ] Recursos definitivos o provisionales aceptables para personajes,
  objetos y puzles obligatorios — sin decisión documentada que acepte el
  estilo procedimental actual como definitivo ni identifique un asset
  concreto pendiente (ver `WINDOWS_PACKAGING_PHASE5_CLOSURE.md`).
- [x] Audio aprobado integrado de forma acotada — pista del epílogo
  integrada y validada, incluido su funcionamiento offline (tarea 7).
- [ ] Revisión completa de textos, nombres, objetivos y pistas.
- ~~Personalización aprobada aplicada sin incluir datos privados en
  lugares no previstos~~ — fuera del alcance bloqueante de `v1.0.0` (ver
  §2, §4); no implementada, no exigida para esta versión.
- [ ] Recursos fuente editables conservados y exportaciones optimizadas —
  no aplica de la misma forma al no existir assets de imagen fuente;
  sin auditar formalmente.
- [ ] Recorrido completo con presentación cercana a entrega.

#### Criterios de aceptación

- [ ] Paleta, escala y resolución son coherentes entre localizaciones.
- [ ] Ningún recurso tiene licencia o procedencia dudosa.
- [ ] No se han añadido binarios grandes sin autorización.
- [ ] Textos y pistas no se contradicen y caben en la interfaz.
- No aplica para `v1.0.0`: la personalización queda fuera de alcance (ver
  §2, §4) — no hay personalización que revise por tono ni por datos.
- [ ] La ausencia o fallo de audio no bloquea el recorrido.
- [ ] El rendimiento y el escalado pixel-perfect se mantienen.

#### Pruebas necesarias

- [ ] Revisión visual a la resolución lógica de 480 × 270.
- [ ] Revisión de todos los diálogos, objetivos y entradas de cuaderno.
- [ ] Prueba con audio y prueba con audio no disponible.
- [ ] Prueba manual completa cronometrada.
- [ ] Comprobación de consola durante cambios de mapa y puzle.
- [ ] `docker compose run --rm game npm run check`.

#### Riesgos

- Arte definitivo incompleto.
- Recursos generados o externos sin trazabilidad suficiente.
- Audio integrado demasiado tarde o con fallos de carga.
- Cambios de texto invalidan pistas o pruebas.
- La personalización llega tarde.

#### Qué recortar primero si aparece retraso

1. Animaciones, efectos y variaciones decorativas.
2. Capas musicales o ambientales adicionales.
3. Retratos o ilustraciones no necesarias para comprender la historia.
4. Personalización secundaria; conservar solo la aprobada como esencial.

Se permite entregar arte provisional coherente antes que retrasar un recorrido
estable. No se recortan pistas necesarias ni legibilidad.

### Fase 5 — QA, accesibilidad básica, guardados y empaquetado

**Fechas:** 28 de agosto al 3 de septiembre.

#### Entregables

- [ ] Matriz de pruebas del recorrido completo — no existe un documento
  formal de matriz de pruebas; la cobertura real está distribuida en
  `tests/e2e/game.spec.js` y las evidencias de tareas 6-7.
- [ ] Corrección de defectos bloqueantes y graves — no existe ningún
  registro de defectos que auditar (ni lista ni issue tracker); no se
  puede confirmar ni negar mediante evidencia documental.
- [ ] Revisión de accesibilidad básica y navegación por teclado — matiz:
  la navegación/interacción completa por teclado, sin mouse, está
  ampliamente confirmada (todos los puzles y el epílogo se resuelven solo
  con teclado en `tests/e2e/game.spec.js`); la revisión de accesibilidad
  básica en sentido más amplio (foco visible, legibilidad, lectores de
  pantalla) no tiene ninguna revisión dedicada registrada.
- [ ] Migraciones y fixtures definitivos de guardado — las migraciones
  están implementadas y probadas (formatos 1-4), pero no existe un
  conjunto de fixtures formalmente "definitivo" y congelado.
- [ ] Build web candidato — el build web funciona y pasa CI de forma
  continua, pero no se ha designado ningún build concreto como
  "candidato" a entregar.
- [x] Empaquetado candidato para Windows con la herramienta aprobada —
  ver [`WINDOWS_PACKAGING_DECISION.md`](WINDOWS_PACKAGING_DECISION.md)
  (tareas 1-8, Fase 5 de empaquetado Windows cerrada).
- [ ] Instrucciones mínimas de ejecución y controles — existen para el
  portable Windows (`WINDOWS_PORTABLE_GUIDE.md`); no se ha auditado un
  documento equivalente general de controles para la versión web.
- [x] Informe de prueba en instalación limpia — ver
  [`WINDOWS_CLEAN_INSTALL_VALIDATION.md`](WINDOWS_CLEAN_INSTALL_VALIDATION.md).
- [ ] Versión candidata estable disponible al cerrar el 3 de septiembre —
  fecha futura, todavía no alcanzada.

#### Criterios de aceptación

- [ ] Cero defectos bloqueantes o graves conocidos — sin registro que
  auditar (ver más arriba).
- [x] Todos los controles obligatorios funcionan con teclado — los tres
  puzles y el epílogo se resuelven íntegramente con teclado en
  `tests/e2e/game.spec.js`.
- [ ] Texto, prompts y estados de foco son legibles — sin revisión
  dedicada registrada.
- [x] Los guardados de referencia se restauran correctamente —
  `tests/state/GameState.test.js` cubre formatos 1-4 con múltiples
  fixtures.
- [x] Guardar y cargar funciona en las cuatro localizaciones y tres
  puzles — `tests/e2e/game.spec.js` guarda/carga en cada localización.
- [x] El build web y el ejecutable recorren el juego completo — cobertura
  E2E segmentada para la web, recorrido real completo para el ejecutable
  (tarea 7).
- [x] El ejecutable inicia en una instalación limpia de Windows — ver
  [`WINDOWS_CLEAN_INSTALL_VALIDATION.md`](WINDOWS_CLEAN_INSTALL_VALIDATION.md).
- [x] El empaquetado no rompe ni sustituye la versión web — `builds/browser`
  servido sin Electron sigue siendo idéntico y funcional (ver
  [`WINDOWS_PACKAGING_DECISION.md`](WINDOWS_PACKAGING_DECISION.md) →
  "Relación entre `npm run build` y el empaquetado").
- [x] La consola no muestra errores durante la prueba completa — mismo
  matiz que en §5 "Calidad y entrega": evidencia real vía
  `collectJavaScriptErrors()` en 13 tests E2E, no una única sesión
  continua (las DevTools están bloqueadas en el ejecutable empaquetado).
- [x] `npm run check` pasa mediante Docker — verde en el momento de esta
  auditoría.

#### Pruebas necesarias

- [x] Suite automatizada completa y build con
  `docker compose run --rm game npm run check` — verde en el momento de
  esta auditoría.
- [x] Prueba manual de nueva partida a epílogo — tarea 7.
- [x] Prueba de carga desde fixtures y desde partidas creadas en la
  candidata — `GameState.test.js` (fixtures de formato) y
  `tests/e2e/game.spec.js` (ciclo real guardar con K → recargar → cargar
  con L).
- [x] Prueba de interrupción y reanudación en cada puzle — tests
  dedicados de restauración de intento incompleto para los tres puzles
  (`failed` en el catálogo, `traversing` en P2, `classifying` en el
  Archivo).
- [x] Prueba de rutas de error y reinicio — `GameState.test.js` cubre
  guardados inválidos/incompatibles con una tabla de variantes, sin
  excepciones sin capturar.
- [x] Prueba web desde `builds/browser` — validada de forma continua por
  `npm run check`.
- [x] Prueba del ejecutable en Windows — ver
  [`WINDOWS_PORTABLE_FULL_QA.md`](WINDOWS_PORTABLE_FULL_QA.md) (recorrido
  completo, offline, audio, assets) y
  [`WINDOWS_CLEAN_INSTALL_VALIDATION.md`](WINDOWS_CLEAN_INSTALL_VALIDATION.md).
- [x] Prueba desde una instalación limpia sin herramientas de desarrollo —
  ver [`WINDOWS_CLEAN_INSTALL_VALIDATION.md`](WINDOWS_CLEAN_INSTALL_VALIDATION.md).
- [ ] Medición final de duración (la duración del recorrido en el
  ejecutable Windows quedó explícitamente sin cronometrar — ver
  [`WINDOWS_PORTABLE_FULL_QA.md`](WINDOWS_PORTABLE_FULL_QA.md)).

#### Riesgos

- La herramienta de empaquetado falla en Windows.
- Aparecen regresiones de guardado al final del calendario.
- El recorrido completo descubre bloqueos narrativos tardíos.
- No hay tiempo suficiente para repetir QA.

#### Qué recortar primero si aparece retraso

1. Pulido visual adicional aún no integrado.
2. Audio no esencial que cause inestabilidad.
3. Ajustes menores de ambientación y texto sin impacto narrativo.
4. Automatizaciones de entrega no imprescindibles, conservando las pruebas
   manuales y automatizadas obligatorias.

No se aplaza la candidata estable más allá del 3 de septiembre.

### Fase 6 — Congelación de contenido y versión candidata

**Fechas:** 4 al 7 de septiembre.

La candidata estable ya debe existir al iniciar esta fase. La congelación
prohíbe contenido y mecánicas nuevas.

#### Entregables

- [ ] Lista cerrada y priorizada de defectos de la candidata.
- [ ] Correcciones mínimas para defectos bloqueantes, graves y regresiones.
- [ ] Candidatas de reemplazo solo cuando una corrección lo requiera.
- [ ] Registro de resultados de pruebas por cada candidata.
- [ ] Builds web y Windows reproducidos y verificados.

#### Criterios de aceptación

- [ ] Cada cambio corrige un defecto registrado o un problema de entrega.
- [ ] No se añaden contenido, puzles, dependencias ni refactorizaciones.
- [ ] Cada corrección tiene prueba de regresión cuando sea viable.
- [ ] La prueba manual completa sigue pasando.
- [ ] Web, ejecutable y guardados permanecen compatibles.
- [ ] Cero defectos bloqueantes o graves abiertos al terminar el 7 de
  septiembre.

#### Pruebas necesarias

- [ ] `docker compose run --rm game npm run check` tras cada lote.
- [ ] Reproducción del defecto antes de corregirlo.
- [ ] Prueba enfocada de la corrección.
- [ ] Prueba manual completa de la candidata final de la fase.
- [ ] Prueba del ejecutable en Windows y de la versión web.

#### Riesgos

- Una corrección introduce una regresión.
- Se intenta aprovechar la fase para añadir contenido.
- Demasiadas candidatas reducen el tiempo efectivo de prueba.

#### Qué recortar primero si aparece retraso

1. Ajustes cosméticos menores no iniciados.
2. Correcciones de defectos puramente visuales con alternativa aceptable.
3. Cambios de texto no necesarios para comprensión o corrección.

No se recortan correcciones bloqueantes, compatibilidad de guardado ni pruebas
de entrega.

### Fase 7 — Margen de contingencia

**Fechas:** 8 y 9 de septiembre.

#### Entregables

- [ ] Resolución de incidencias críticas restantes, si existen.
- [ ] Repetición de pruebas afectadas.
- [ ] Builds finales web y Windows.
- [ ] Paquete de entrega preparado.
- [ ] Checklist final cumplimentada.

#### Criterios de aceptación

- [ ] Solo se realizan correcciones, pruebas, empaquetado o ajustes menores.
- [ ] No quedan defectos bloqueantes o graves conocidos.
- [ ] Los artefactos finales coinciden con la candidata validada.
- [ ] La instalación limpia y el recorrido de humo pasan.
- [ ] Si no hay incidencias, el margen se usa para repetir pruebas, no para
  añadir contenido.

#### Pruebas necesarias

- [ ] `docker compose run --rm game npm run check`.
- [ ] Prueba de humo desde nueva partida hasta cada cambio de localización.
- [ ] Carga de un guardado representativo.
- [ ] Resolución de los tres puzles.
- [ ] Activación del epílogo.
- [ ] Inicio y cierre correcto del ejecutable en Windows.

#### Riesgos

- Incidencia crítica descubierta a menos de 48 horas.
- Diferencia entre el build validado y el paquete final.
- Falta de tiempo para una repetición completa.

#### Qué recortar primero si aparece retraso

1. Todo ajuste cosmético pendiente.
2. Toda corrección menor sin impacto en recorrido, datos o entrega.
3. Material auxiliar no imprescindible.

Si aparece un bloqueo sin corrección segura, se vuelve a la última candidata
estable y se documenta la limitación.

### Fase 8 — Entrega

**Fecha:** 10 de septiembre.

#### Entregables

- [ ] Versión web final.
- [ ] Ejecutable final para Windows.
- [ ] Instrucciones breves de ejecución y controles.
- [ ] Resultado de pruebas finales.
- [ ] Copia segura de los recursos fuente editables y artefactos entregados.

#### Criterios de aceptación

- [ ] Los archivos entregados son exactamente los artefactos probados.
- [ ] La versión indicada coincide con `package.json` y con la identificación
  de entrega autorizada.
- [ ] Web y Windows arrancan sin herramientas de desarrollo.
- [ ] El recorrido obligatorio y el epílogo siguen accesibles.

#### Pruebas necesarias

- [ ] Verificación de integridad de los artefactos.
- [ ] Prueba de humo final en web.
- [ ] Prueba de humo final en Windows.
- [ ] Comprobación final de nueva partida y carga.

#### Riesgos

- Copia o paquete equivocado.
- Dependencia ausente en el equipo de destino.
- Diferencia entre versión declarada y artefacto.

#### Qué recortar primero si aparece retraso

No se añade ni se retira contenido el día de entrega. Ante un problema se usa
la última candidata estable verificada y se documenta cualquier limitación
menor.

## 7. Regla común de recorte

Cuando una fase se retrase, el orden general de recorte es:

1. Variaciones cosméticas, animaciones y decoración secundaria.
2. Diálogos, NPCs e interacciones ambientales no obligatorias.
3. Capas de audio y pistas opcionales.
4. Automatización no imprescindible que pueda sustituirse temporalmente por
   una prueba manual registrada.

Nunca se recortan:

- las cuatro localizaciones obligatorias en su forma mínima;
- ninguno de los tres puzles principales;
- las pistas mínimas para que sean deducibles;
- guardado y carga;
- epílogo;
- versión web;
- ejecutable para Windows;
- compatibilidad de guardados acordada;
- pruebas de recorrido y entrega.

## 8. Orden propuesto de los tres puzles

| Orden | Localización | Estado | Función de producción |
|---|---|---|---|
| 1 | Paseo de los Siete Puentes | P2 existente e integrado | Validar el bucle exploración → puzle → evidencia. |
| 2 | Biblioteca del Margen | **El catálogo perfecto**, implementado e integrado (decisión cerrada) ([especificación](../puzzles/LIBRARY_CATALOGUE_SPEC.md)) | Ampliar investigación, cuaderno y pistas sin elevar en exceso la dificultad. |
| 3 | Archivo compacto | **La pregunta correcta**, implementado e integrado (decisión cerrada) ([especificación](../puzzles/ARCHIVE_CRITERIA_SPEC.md)) | Resolver la investigación y activar el epílogo. |

Antes del 2 de agosto, cada puzle nuevo debe fijar:

- [ ] objetivo para el jugador;
- [ ] información disponible antes de resolverlo;
- [ ] representación mínima en pantalla;
- [ ] estado inicial, intento, fallo, reinicio y resolución;
- [ ] al menos una solución válida;
- [ ] validador independiente de la interfaz;
- [ ] pistas mínimas y momento de desbloqueo;
- [ ] datos que deben guardarse;
- [ ] presupuesto estimado de implementación y prueba.

No se elige una mecánica por similitud con P2 ni por aparecer en documentos
históricos. La selección requiere una decisión explícita basada en tiempo,
claridad, dificultad y coste de integración.

## 9. Puertas de calidad

Ninguna fase se considera cerrada sin las puertas que le correspondan.
Las puertas A y B son checklists reutilizables que se aplican a cada
cambio/integración individual, no un estado global de una sola vez — sus
casillas se mantienen sin marcar como plantilla. La puerta C sí describe
un estado agregado del proyecto hasta ahora, auditado más abajo.

### Puerta A — Cambio local

- [ ] Pruebas automatizadas nuevas o actualizadas.
- [ ] Pruebas existentes sin regresiones.
- [ ] `git diff --check` sin errores.
- [ ] Sin errores nuevos de consola en el flujo afectado.

### Puerta B — Integración de fase

- [ ] `docker compose run --rm game npm run check` termina con código 0.
- [ ] Build web generado correctamente.
- [ ] Prueba manual del recorrido añadido.
- [ ] Guardar y cargar funciona antes, durante y después del cambio.
- [ ] Controles obligatorios disponibles con teclado.

### Puerta C — Candidata estable

- [x] Suite automatizada completa superada — 546/546 tests en el momento
  de esta auditoría.
- [x] Prueba manual completa de nueva partida a epílogo — tarea 7.
- [x] Consola sin errores durante el recorrido completo — vía
  `collectJavaScriptErrors()` en 13 tests E2E (ver matiz en §5 y §6 Fase
  5 más arriba: no es una única sesión continua, porque las DevTools
  están bloqueadas en el ejecutable empaquetado).
- [x] Compatibilidad de guardados verificada con fixtures —
  `GameState.test.js` usa fixtures de formato 1-4 (como objetos
  literales, no archivos de fixture en disco separados).
- [ ] Duración medida entre 45 y 90 minutos — **no medida**. No se
  inventa ninguna cifra.
- [x] Versión web probada desde el build estático — validada de forma
  continua por `npm run check`.
- [x] Ejecutable probado en Windows — tareas 6 y 7.
- [x] Instalación limpia probada —
  [`WINDOWS_CLEAN_INSTALL_VALIDATION.md`](WINDOWS_CLEAN_INSTALL_VALIDATION.md).
- [ ] Cero defectos bloqueantes o graves conocidos.

### Puerta D — Entrega

- [ ] Artefactos finales iguales a los probados.
- [ ] Prueba de humo final en web y Windows.
- [ ] Checklist final completa.
- [ ] Versión y documentación de entrega coherentes.

## 10. Registro de riesgos prioritarios

| Riesgo | Señal temprana | Prevención | Respuesta |
|---|---|---|---|
| Exceso de alcance | Aparecen nuevas zonas, sistemas o más de tres puzles. | Revisar cada tarea contra el alcance congelado. | Rechazar la ampliación y aplicar la regla común de recorte. |
| Arte pendiente | Faltan recursos obligatorios el 19 de agosto. | Inventario y estrategia cerrados antes del 2 de agosto. | Usar arte provisional coherente y cortar variaciones opcionales. |
| Empaquetado de Windows | No hay herramienta aprobada el 2 de agosto o no arranca el 28. | Probar temprano una decisión aprobada y conservar la web. | Priorizar un paquete mínimo; no introducir otra herramienta sin aprobación. |
| Regresiones de guardado | Un fixture deja de cargar o pierde progreso. | Formato versionado, migraciones y fixtures por fase. | Bloquear la candidata hasta restaurar compatibilidad o una migración probada. |
| Puzles demasiado complejos | No existe prototipo resoluble o excede el tiempo asignado. | Cerrar mecánicas acotadas antes del 2 de agosto y probarlas en papel. | Simplificar presentación, estados y pistas sin eliminar el puzle. |
| Integración tardía de audio | El audio llega después del 27 de agosto o genera errores. | Definir estrategia y formatos en fase 1; integrar antes de QA. | Retirar capas no esenciales y conservar un juego funcional sin audio. |
| Falta de tiempo para QA | El primer recorrido completo llega después del 18 de agosto. | Integrar verticalmente por fase y probar continuamente. | Congelar antes el pulido, cortar opcionales y proteger del 28 de agosto al 9 de septiembre. |

Los riesgos se revisan al cerrar cada fase. Cualquier riesgo que amenace la
candidata del 3 de septiembre debe convertirse ese mismo día en una tarea de
mitigación o en un recorte permitido.

## 11. Decisiones pendientes antes del 2 de agosto

Todas estas decisiones deben quedar cerradas y registradas antes de finalizar
el 2 de agosto:

- [x] **Concepto del segundo puzle:** **El catálogo perfecto**; mecánica,
  solución, dificultad, estados, pistas, coste y criterios definidos en
  [`LIBRARY_CATALOGUE_SPEC.md`](../puzzles/LIBRARY_CATALOGUE_SPEC.md).
- [x] **Concepto del tercer puzle:** **La pregunta correcta**; mecánica,
  solución, dificultad, estados, pistas, coste y criterios definidos en
  [`ARCHIVE_CRITERIA_SPEC.md`](../puzzles/ARCHIVE_CRITERIA_SPEC.md).
- [x] **Arquitectura de pistas:** decisión de facto ya consolidada por la
  implementación real: fuente de datos por puzle (`LibraryCatalogueHints.js`,
  `ArchiveCriteriaHints.js`, más P2 y las pistas del epílogo), desbloqueo
  progresivo consultable durante el intento, presentación vía el cuaderno,
  no-duplicación garantizada por `GameState.addNotebookEntry()`
  (deduplica por `id`), y persistencia probada en `tests/state/GameState.test.js`
  (incluida migración entre formatos). No existe un documento de decisión
  independiente redactado antes de implementar, pero el patrón es
  consistente entre los tres puzles y está en producción.
- [x] **Formato de mapas de Biblioteca y Archivo:** decisión de facto
  consolidada — continuar con datos JavaScript planos (`createMap({...})`
  en `src/content/worldMaps.js`), sin Tiled ni ningún otro formato
  externo. El patrón es 100% consistente entre las cuatro localizaciones
  (`axiom-plaza`, `seven-bridges-walk`, `library`, `archive`).
- [x] **Herramienta de empaquetado Windows:** Electron como runtime de
  escritorio y `electron-builder` como herramienta de empaquetado,
  aprobados el 2026-08-04 por el responsable del producto. Primer
  artefacto obligatorio: portable Windows x64, sin instalador ni firma
  digital en la primera candidata privada. Decisión completa, razones y
  criterios de validación en
  [`WINDOWS_PACKAGING_DECISION.md`](WINDOWS_PACKAGING_DECISION.md). Las
  dependencias ya están incorporadas y el shell, la persistencia, la CSP,
  la configuración de `electron-builder` y una primera candidata portable
  real ya están implementados y validados, incluida su generación
  reproducible vía GitHub Actions, la prueba manual en una instalación
  Windows limpia concreta con persistencia demostrada tras un reinicio
  real (tarea 6), y el QA funcional completo del artefacto —recorrido de
  principio a fin, todos los puzles, el epílogo, audio y funcionamiento
  offline— (tarea 7). La persistencia/compatibilidad entre dos builds
  distintas **no se ejecutó** dentro de esa tarea — riesgo residual
  aceptado explícitamente por el responsable del producto para
  `v1.0.0`, no un bloqueo pendiente. El cierre documental y auditoría
  final de la Fase 5 de empaquetado Windows (tarea 8) también se
  completó — ver
  [`WINDOWS_PACKAGING_PHASE5_CLOSURE.md`](WINDOWS_PACKAGING_PHASE5_CLOSURE.md).
  Esta casilla marca la decisión de herramienta y su implementación
  completa de empaquetado Windows como cerradas — no marca cerrada la
  Fase 5 completa de este plan (§6, que incluye QA general y
  accesibilidad todavía pendientes), ni que `v1.0.0` esté publicada.
- [x] **Pipeline mínimo de pruebas de interfaz:** patrón de facto en
  producción y documentado en `CLAUDE.md` → "Estrategia de pruebas":
  lógica/estado/validadores con pruebas unitarias (`node --test`),
  flujos completos jugables (los tres puzles, guardado/carga por
  localización, el epílogo íntegro) con Playwright en
  `tests/e2e/game.spec.js`, y comprobación manual adicional para cambios
  visuales/pixel-perfect (`AGENTS.md`). No existe un documento de
  decisión aparte redactado antes de empezar, pero el mapeo
  flujo-por-flujo (qué se automatiza vs. qué es manual) es observable y
  consistente en el código y las pruebas reales.
- [ ] **Estrategia de arte y audio:** decisión parcial. El audio tiene una
  decisión de facto documentada (pista provisional/sustituible del
  epílogo, aceptada para `v1.0.0` sin sustitución obligatoria — ver §2).
  El arte **no** tiene ninguna decisión equivalente registrada, ni
  siquiera provisional: no hay paleta/resolución/formato de recursos
  fuente definidos porque el juego no usa assets de imagen (renderizado
  procedimental). Esta casilla combinada sigue sin cerrar por la mitad
  correspondiente al arte.

Una decisión no está cerrada si solo enumera opciones. Debe indicar la opción
elegida, la razón, su impacto en calendario y el criterio que permitirá
validarla.

## 12. Checklist final de entrega

### Producto

Esta subsección refleja existencia y funcionamiento real en el código
actual (auditado 2026-08-11), no necesariamente el pulido narrativo/visual
final que se revisará en las Fases 4-7 antes de la entrega del 10 de
septiembre.

- [x] Plaza del Axioma terminada.
- [x] Paseo de los Siete Puentes terminado.
- [x] Biblioteca del Margen terminada.
- [x] Archivo compacto terminado.
- [x] P2 terminado e integrado.
- [x] Segundo puzle terminado e integrado.
- [x] Tercer puzle terminado e integrado.
- [x] Cuaderno y pistas completos.
- [x] Guardado y carga completos.
- [x] Epílogo completo (mecánica/implementación; ver matiz de
  personalización más abajo).
- Personalización aprobada aplicada: **retirada como requisito de
  `v1.0.0`** (ver §2, §4) — no implementada, fuera de alcance de esta
  versión, no bloqueante.
- [ ] Duración final entre 45 y 90 minutos — **no medida**.

### Validación

- [x] Tests automatizados superados — 546/546 en el momento de esta
  auditoría.
- [x] `docker compose run --rm game npm run check` superado.
- [x] `git diff --check` sin errores.
- [x] Prueba manual completa superada — tarea 7.
- [ ] Consola sin errores — sin marcar aquí deliberadamente: aunque existe
  evidencia real vía `collectJavaScriptErrors()` en tests E2E segmentados
  (ver §5, §6 Fase 5, Puerta C), esta casilla de entrega final exige una
  verificación específica sobre el candidato final concreto, que todavía
  no existe.
- [ ] Compatibilidad de guardados verificada — mismo motivo: la
  verificación existe a nivel de desarrollo (fixtures en
  `GameState.test.js`), no como comprobación formal sobre un candidato
  final.
- [x] Nueva partida, guardado, carga y partida terminada verificados —
  `tests/e2e/game.spec.js` y tarea 7.
- [x] Instalación limpia verificada —
  [`WINDOWS_CLEAN_INSTALL_VALIDATION.md`](WINDOWS_CLEAN_INSTALL_VALIDATION.md).
- [x] Ejecutable probado en Windows — tareas 6 y 7.
- [x] Versión web probada desde su build.
- [ ] Cero defectos bloqueantes o graves abiertos — sin registro de
  defectos que auditar; no se puede confirmar positivamente sin ese
  registro.

### Artefactos y entrega

- [ ] Build web final identificado.
- [ ] Ejecutable Windows final identificado.
- [ ] Ambos artefactos corresponden a la misma versión probada.
- [ ] Controles e instrucciones de ejecución incluidos.
- [ ] Recursos fuente editables conservados.
- [ ] No hay secretos, credenciales ni material de licencia dudosa.
- [ ] No hay binarios grandes no autorizados en el repositorio.
- [ ] La versión declarada coincide con `package.json`.
- [ ] Cualquier tag o publicación ha sido realizada solo con autorización
  explícita.
- [ ] Copia final entregada el 10 de septiembre de 2026.
