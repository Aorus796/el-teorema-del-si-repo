# Historial de cambios

Todos los cambios relevantes se registrarán siguiendo una adaptación de Keep a Changelog.

## [No publicado]

### Añadido

- Game Design Document consolidado.
- Documento técnico y plan de producción.
- Catálogo de once puzles principales.
- Estructura inicial del repositorio.
- Plantillas de incidencias y pull requests.
- Capa de automatización con Claude Code: `CLAUDE.md`, agentes
  especializados (`planner`, `developer`, `qa`, `reviewer`), skill
  `autopilot`, quality gate único `npm run verify`, workflow de CI en
  GitHub Actions y hooks de protección en `.claude/settings.json`. Ver
  [`docs/development/AUTOMATION.md`](docs/development/AUTOMATION.md).
- Prueba Playwright que resuelve realmente el tercer puzle del Archivo
  ("La pregunta correcta") con la secuencia de teclado completa, en vez
  de solo abrir y cerrar la escena: clasifica las seis afirmaciones,
  confirma, y comprueba el avance narrativo resultante (banderas
  `investigationComplete`/`epilogueUnlocked`, objetivo `start-epilogue`,
  entrada de cuaderno `archive-final-evidence` y el guardado persistido
  en `localStorage`).
- Prueba Playwright que resuelve realmente el segundo puzle de la
  Biblioteca ("El catálogo perfecto") con la secuencia de teclado
  completa: intercambia los documentos hasta el orden `A-D-R-C-M`,
  confirma, y comprueba el avance narrativo resultante (bandera
  `archiveUnlocked`, objetivo `inspect-archive-criteria-table`, entrada
  de cuaderno `library-catalogue-solution` y el guardado persistido en
  `localStorage`).
- Prueba Playwright que resuelve realmente el primer puzle de los Siete
  Puentes ("El paseo imposible") con la secuencia de teclado completa:
  avanza el diálogo de apertura verificando cada línea en el DOM, cierra
  el puente B1, y recorre los seis puentes restantes (`B2-B3-B6-B7-B4-B5`)
  desde la entrada hasta el molino, y comprueba el avance narrativo
  resultante (objetivo `inspect-p2-evidence`, entrada de cuaderno
  `p2-bridges-solution` y el guardado persistido en `localStorage`).
- Prueba Playwright que guarda y carga la partida en la Plaza del Axioma,
  la cuarta y última de las localizaciones obligatorias sin esta
  cobertura: siembra un guardado, lo carga, guarda de nuevo con "K", hace
  el primer `page.reload()` real del repositorio, vuelve a cargar con "L"
  y guarda una segunda vez, comprobando en el guardado resultante que
  mapa, posición, orientación, banderas relevantes y objetivo coinciden
  con lo esperado — demostrando que `GameState` se restauró de verdad en
  memoria tras el ciclo completo de guardar → recargar la página →
  cargar, no solo que el `localStorage` quedó intacto.
- Prueba Playwright que restaura un intento incompleto y fallido del
  catálogo de la Biblioteca (fase `failed`, orden inválido, una pista
  leída, un intento consumido) tras un `page.reload()` real: siembra el
  guardado, entra al catálogo, intercambia dos documentos y confirma un
  orden que incumple las reglas, guarda con "K", recarga la página, carga
  de nuevo con "L", reentra en el catálogo para confirmar que reconstruir
  un intento `failed` no lanza excepciones, y guarda una segunda vez,
  comprobando que `phase`, `order`, `hintsRead`, `attemptCount` y
  `failureCode` del guardado resultante coinciden con el intento original —
  demostrando que `GameState` restauró de verdad el intento incompleto en
  memoria, no solo que sobrevivió en `localStorage`.
- Reconsulta en modo de solo lectura del mecanismo del regalo del
  epílogo: interactuar con `epilogue-gift-mechanism` después de
  `giftCodeSolved=true` (incluido con `epilogueCompleted=true`) sincroniza
  al jugador y reabre `EpilogueGiftCodeScene` con un payload
  `{readOnly:true}` que activa un campo transitorio de instancia
  `readOnly` — sin selector editable, sin comparación, sin modificar
  ninguna bandera. El diálogo neutro temporal ("Los anillos ya no giran")
  queda eliminado.
- Prueba Playwright que restaura un intento a medias del primer puzle de
  los Siete Puentes (fase `traversing`, recorrido `E-R` con un puente ya
  cruzado) tras un `page.reload()` real: siembra el guardado, entra al
  puzle, cruza un segundo puente (`B3`, `R`→`N`), guarda con "K", recarga
  la página, carga de nuevo con "L", reabre el diálogo del mapa (sigue
  disponible porque el recorrido no está resuelto), cruza un tercer puente
  (`B6`, `N`→`L`) — movimiento que solo produce el resultado correcto si el
  recorrido se reanudó de verdad en el nodo `N` — y guarda una segunda vez,
  comprobando que `phase`, `currentNode`, `route`, `usedBridgeIds` y
  `lifecycle` del guardado resultante reflejan el recorrido acumulado en
  ambas rondas — demostrando que `GameState` restauró de verdad un intento
  de P2 a medio camino en memoria, no solo que sobrevivió en `localStorage`.
- Prueba Playwright que restaura una clasificación incompleta del Archivo
  (fase `classifying`, dos de las seis afirmaciones ya clasificadas, una
  pista leída, sin confirmar nunca) tras un `page.reload()` real: siembra
  el guardado, entra a "La pregunta correcta", clasifica dos afirmaciones
  (`voluntary-entry` y `followed-trail`, ambas `confirmed`), guarda con
  "K", recarga la página, carga de nuevo con "L", reentra en el Archivo
  para confirmar que reconstruir un intento `classifying` no lanza
  excepciones, clasifica una tercera afirmación (`never-disagreed`) —
  movimiento que solo produce el resultado correcto si las dos anteriores
  se restauraron de verdad en memoria — y guarda una segunda vez,
  comprobando que `phase`, `verdicts`, `hintsRead`, `attemptCount` y
  `failureCode` del guardado resultante contienen las tres clasificaciones
  juntas — demostrando que `GameState` restauró de verdad la clasificación
  incompleta en memoria, no solo que sobrevivió en `localStorage`. Con esta
  cobertura queda completo el criterio de "intento incompleto restaurable"
  para los tres puzles del juego (catálogo de la Biblioteca en `failed`,
  primer puzle de los Siete Puentes en `traversing`, y el Archivo en
  `classifying`).
- Tres banderas nuevas del epílogo en el estado persistente de
  `GameState` (`epilogueStarted`, `giftCodeSolved`, `epilogueCompleted`),
  con validación atómica en `restore()` de las cuatro invariantes de
  implicación entre banderas del epílogo (`EPILOGUE_SPEC.md` §13):
  `epilogueUnlocked ⟹ investigationComplete`,
  `epilogueStarted ⟹ epilogueUnlocked`,
  `giftCodeSolved ⟹ epilogueStarted` y
  `epilogueCompleted ⟹ giftCodeSolved` — un guardado que viole cualquiera
  de las cuatro hace que `restore()` lance sin mutar el estado receptor.
- Prueba Playwright que migra en un navegador real un guardado del formato
  legado más antiguo soportado (`formatVersion: 1`, sin `world.playerByMap`
  ni `puzzles.archiveCriteria`, con un `puzzles.libraryCatalogue` inválido
  para el formato vigente) al cargarlo con "L": comprueba que el progreso
  de P2 migrado (fase `traversing`, recorrido `E-R` a mitad de camino) es
  funcionalmente continuable cruzando un tercer puente (`B3`, `R`→`N`) con
  teclado, y que el guardado resultante reescribe siempre `formatVersion: 4`
  con `libraryCatalogue` y `archiveCriteria` reiniciados a su estado por
  defecto — ya que el formato 1 no los contenía —, conservando a la vez el
  `objectiveId` y la entrada de cuaderno heredados del formato legado. Sin
  errores de consola ni excepciones sin capturar durante la migración.
- Prueba Playwright que combina en un único guardado avanzado las seis
  dimensiones de estado a la vez (mapa, posición, las nueve banderas, el
  objetivo, un cuaderno de cuatro entradas, y los tres puzles: P2 y el
  catálogo de la Biblioteca resueltos, y el Archivo a medio clasificar) y
  demuestra que sobreviven juntas a un `page.reload()` real: siembra el
  guardado, carga con "L", guarda con "K" y comprueba campo a campo el
  resultado, recarga la página sin sembrar nada de nuevo, carga de nuevo
  con "L", guarda una segunda vez con "K" y repite la misma comprobación
  completa sobre el nuevo guardado mediante una función auxiliar
  reutilizable — demostrando que `GameState` restauró de verdad las seis
  dimensiones combinadas en memoria, no solo que sobrevivieron por
  separado en `localStorage`. Con esta cobertura queda cerrado el
  criterio de "Estado y guardado" del plan de producción.
- Pruebas unitarias que verifican que la posición inicial de aparición en
  la Plaza del Axioma y el Paseo de los Siete Puentes es transitable y no
  solapa ningún objeto del mapa, replicando en `tests/content/WorldMaps.test.js`
  el mismo patrón ya usado para la Biblioteca y el Archivo — las cuatro
  localizaciones obligatorias quedan así cubiertas por igual frente a
  bloqueos accidentales en el punto de aparición.
- Módulo `src/content/epilogueConfig.js` que centraliza la combinación del
  candado del epílogo (`GIFT_CODE_DIGITS`) y el texto de su pista
  (`GIFT_CODE_CLUE_LINES`), siguiendo `EPILOGUE_SPEC.md` §5 y §18.4 — de
  momento un módulo huérfano sin conectar todavía a ninguna escena, al
  cuaderno ni a `GameState`; solo evita que futuras tareas dupliquen estos
  valores.
- Al resolver el tercer puzle del Archivo ("La pregunta correcta"), además
  de las cuatro consecuencias ya existentes, la etiqueta del objetivo HUD
  `start-epilogue` cambia a "Regresa al lugar donde comenzó la
  demostración." y se añade una nueva entrada al cuaderno,
  `epilogue-combination-clue` ("La combinación del candado"), con el texto
  de la pista de la combinación construido a partir de
  `GIFT_CODE_CLUE_LINES` (`EPILOGUE_SPEC.md` §18.2).
- Objeto interactivo `epilogue-gift-mechanism` en la Plaza del Axioma
  (`EPILOGUE_SPEC.md` §18.3): siempre presente, responde con un diálogo
  neutro distinto según `state.flags.epilogueUnlocked` sea `false` o
  `true`, sin cambiar de mapa ni mutar ningún estado en ninguno de los dos
  casos.
- Nueva escena `epilogue-gift-code` (`EPILOGUE_SPEC.md` §18.5): un
  selector de cuatro cifras navegable con las flechas (foco circular
  izquierda/derecha, cada cifra ajustable circularmente arriba/abajo) y
  confirmable con Enter. Interactuar con `epilogue-gift-mechanism` ahora
  cambia a esta escena cuando el epílogo está desbloqueado y el mecanismo
  aún no se ha resuelto (`state.flags.giftCodeSolved` en `false`), en vez
  de mostrar el diálogo neutro anterior; si ya está resuelto, muestra un
  diálogo distinto que no repite el proceso ni revela la combinación.
- La escena `epilogue-gift-code` ahora compara de verdad la combinación
  introducida contra `GIFT_CODE_DIGITS` (`EPILOGUE_SPEC.md` §18.6): si no
  coincide, muestra el mensaje "Esta combinación no es la correcta. Repasa
  el cuaderno." sin alterar ningún estado y la escena permanece abierta y
  editable; si coincide, marca `state.flags.giftCodeSolved` en `true`,
  actualiza el objetivo HUD a `epilogue-meet-bride` ("Acércate a ella en
  la Plaza.") y muestra una pantalla de éxito con la combinación real
  (derivada de `GIFT_CODE_DIGITS`), bloqueando la edición de cifras hasta
  una segunda confirmación explícita con Enter que regresa al mundo.
- `GameState.restore()` normaliza escena, mapa y posición cuando el
  guardado trae `state.flags.giftCodeSolved` en `true`
  (`EPILOGUE_SPEC.md` §18.7): fuerza `scene` a `"world"` y
  `world.currentMapId` a `"axiom-plaza"` sin importar lo que traiga el
  guardado en esos campos, conservando la posición guardada del jugador
  en `axiom-plaza` si es válida o cayendo en su punto de aparición por
  defecto en caso contrario.
- Paleta visual de amanecer en la Plaza del Axioma (`EPILOGUE_SPEC.md`
  §18.8): cuando `state.flags.giftCodeSolved` es `true`, `WorldScene`
  renderiza `axiom-plaza` con una nueva paleta `dawnPalette` (suelo, muros
  y agua de la fuente en tonos ámbar/dorado/rosado, más cálidos y
  luminosos que la paleta diurna habitual), sin alterar la geometría, los
  objetos ni las decoraciones del mapa; el resto de localizaciones
  conserva siempre su paleta normal.
- Objeto `bride-epilogue` en la Plaza del Axioma (`EPILOGUE_SPEC.md`
  §18.9): un nuevo NPC que solo aparece — y solo es alcanzable por
  proximidad — cuando `state.flags.giftCodeSolved` es `true`, mediante un
  mecanismo declarativo genérico `requiresFlag` en `WorldScene`
  (`findNearbyObject` y `renderObjects`) reutilizable por cualquier objeto
  futuro del mapa; todavía sin ningún manejador de interacción propio, esa
  lógica queda para la siguiente tarea.
- Manejador de interacción para `bride-epilogue` en `WorldScene`
  (`EPILOGUE_SPEC.md` §18.10): reproduce el diálogo final aprobado (§10)
  alternando "Novia" y "Protagonista" mediante una cadena secuencial de
  cinco llamadas a `UiController.beginDialogue()`, cada una con el
  `onComplete` de la anterior abriendo la siguiente. Con
  `state.flags.epilogueCompleted` en `true` (`EPILOGUE_SPEC.md` §15) la
  interacción es un no-op defensivo que ni siquiera sincroniza la posición
  del jugador. Al completar el quinto turno se invoca
  `completeBrideDialogue()`, un punto de extensión intencionalmente vacío
  reservado para la música (tarea 12) y los créditos (tarea 13): esta
  tarea no cambia de escena ni muta ninguna bandera, objetivo, cuaderno o
  guardado.
- Infraestructura mínima de audio para el epílogo (`EPILOGUE_SPEC.md`
  §18.12): `AudioService` (`src/platform/AudioService.js`), basado en
  `HTMLAudioElement` nativo e inyectado una única vez desde `main.js` en
  `WorldScene`. `completeBrideDialogue()` invoca ahora
  `audio.playEpilogueTheme()` tras el quinto y último turno del diálogo
  final. La ruta del recurso queda centralizada en
  `src/content/epilogueAudioConfig.js` (`EPILOGUE_THEME_PATH`), que apunta
  a `src/assets/audio/epilogue-theme-provisional.wav`: un tema
  instrumental cálido y contenido, original y generado localmente por
  síntesis aditiva (`tools/generate-epilogue-theme.mjs`, sin muestras ni
  material de terceros, ver `src/assets/audio/README.md`), marcado como
  provisional y sustituible sin tocar `WorldScene` ni `AudioService`. El
  build (`tools/build.mjs`) verifica que el recurso llegue a la salida
  servida, y la degradación segura del servicio sigue cubriendo cualquier
  fallo real de reproducción sin lanzar ni dejar promesas sin capturar.
- Nueva escena `CreditsScene` (`"credits"`, `EPILOGUE_SPEC.md` §18.13):
  presenta los cinco pasos exactos del cierre narrativo (`EPILOGUE_SPEC.md`
  §12) — plano final con los dos personajes sobre el amanecer de
  `axiom-plaza`, título, dedicatoria, créditos y tarjeta final —
  avanzando solo por confirmación explícita del jugador, sin Escape ni
  temporizadores. `WorldScene.completeBrideDialogue()` ahora cambia a
  `"credits"` tras iniciar la música del epílogo. La tarjeta final expone
  `confirmFinalCard()`, un punto de extensión intencionalmente vacío
  reservado para la tarea 14 (transición terminal y guardado bloqueante,
  `EPILOGUE_SPEC.md` §15).
- `CreditsScene.confirmFinalCard()` ahora ejecuta la transición atómica de
  cierre (`EPILOGUE_SPEC.md` §15): prepara en memoria
  `epilogueCompleted=true`, `objectiveId="epilogue-completed"`,
  `scene="world"`, `world.currentMapId="axiom-plaza"` y la sincronización
  de `player`/`playerByMap`, intenta guardar con `StorageAdapter` y solo
  tras un guardado exitoso cambia a `"title"`; un fallo mantiene la
  tarjeta final visible con el mensaje "No se pudo guardar el final.
  Vuelve a intentarlo." y permite reintentar sin repetir la preparación en
  memoria; `GameState.restore()` ahora fuerza
  `objectiveId="epilogue-completed"` cuando `epilogueCompleted=true`, con
  independencia de lo que contuviera el guardado. Un campo transitorio
  `transitionCompleted` en `CreditsScene` convierte confirmaciones
  adicionales tras un guardado ya exitoso en un no-op absoluto, sin
  reintentar el guardado ni repetir el cambio de escena. La preparación
  del mapa/posición terminal usa el nuevo `GameState.changeToSafeMap()`
  en vez de forzar `world.currentMapId`/`player` a mano, evitando que la
  posición de otro mapa activo se filtre a `axiom-plaza`.
- Prueba Playwright única que recorre el epílogo completo con teclado real,
  desde un guardado con el Archivo resuelto hasta volver al título tras los
  créditos: abre el mecanismo del regalo, falla una combinación, introduce
  la combinación correcta (`GIFT_CODE_DIGITS`) y confirma la pantalla del
  candado real, camina hasta la novia y recorre sus cinco turnos de
  diálogo exactos, atraviesa los cinco pasos de `CreditsScene` verificando
  el texto exacto de cada uno, confirma la tarjeta final y comprueba el
  guardado terminal real en `localStorage` (banderas del epílogo,
  `objectiveId="epilogue-completed"`, `player` sincronizado con
  `world.playerByMap`), y finalmente recarga la partida completada
  comprobando que no se reproduce nada automáticamente (sin diálogo, sin
  créditos), que interactuar con la novia ya completada es un no-op, y que
  el mecanismo del regalo conserva su consulta de solo lectura sin mutar
  el guardado. Introduce, solo del lado de test, la técnica de interceptar
  `CanvasRenderingContext2D.prototype.fillText` vía `page.addInitScript()`
  para verificar texto exacto en `EpilogueGiftCodeScene` y `CreditsScene`,
  que no usan el DOM — mismo patrón conceptual que `FakeCanvasContext` ya
  usa a nivel unitario en `tests/scenes/CreditsScene.test.js`, sin tocar
  ningún archivo de `src/`.
- Documento de validación manual del epílogo
  (`docs/production/EPILOGUE_MANUAL_VALIDATION.md`), cerrando la tarea 16
  (`EPILOGUE_SPEC.md` §18.16) sobre el commit `e51810e`: recorrido
  funcional, selector inicial, combinación incorrecta/correcta, amanecer,
  diálogo final, créditos, legibilidad a 480×270, audio real, guardado
  final, carga de partida completada, consulta de solo lectura, build de
  producción, degradación segura sin el archivo de audio (sin música, sin
  excepciones sin capturar) y funcionamiento sin conexión quedan
  aprobados; se documenta como excepción explícita que la duración no se
  verificó a ritmo normal (la sesión de revisión tomó ~30 segundos porque
  quien la realizó ya conocía la solución), aceptada por el responsable
  del producto. El "empaquetado" validado en esta tarea es el build web
  estático; el ejecutable para Windows sigue pendiente en una fase
  posterior del plan de producción y no queda validado ni generado por
  este documento. Con esto, `docs/production/V1_PRODUCTION_PLAN.md` marca
  la tarea 16 como completada.
- Decisión aprobada de empaquetado Windows para `v1.0.0`
  (`docs/production/WINDOWS_PACKAGING_DECISION.md`): Electron como runtime
  de escritorio y `electron-builder` como herramienta de empaquetado,
  primer artefacto obligatorio portable Windows x64 sin instalador ni
  firma digital en la primera candidata privada. El documento es
  exclusivamente una decisión aprobada, no una implementación: no se
  instala ninguna dependencia de Electron ni se genera ningún ejecutable
  en este cambio. Cierra la decisión pendiente de
  `docs/production/V1_PRODUCTION_PLAN.md` §11 sobre la herramienta de
  empaquetado; la implementación, el artefacto Windows, la prueba en
  instalación limpia y la entrega de la Fase 5 siguen pendientes.
- Shell mínimo de Electron (`electron/main.js`, `electron/shell.js`) con
  pruebas unitarias en `tests/electron/`, primera tarea de implementación
  de `docs/production/WINDOWS_PACKAGING_DECISION.md`: opciones seguras de
  `BrowserWindow` (`nodeIntegration: false`, `contextIsolation: true`,
  `sandbox: true`, sin `preload`), bloqueo de `window.open`,
  `will-navigate` y `will-attach-webview`, DevTools solo fuera de
  `isPackaged`, resolución de `builds/browser/index.html`, instancia
  única y cierre limpio si falla la carga del build local. No genera
  ningún ejecutable, no se ha probado en Windows, y no incluye todavía
  `electron-builder`, IPC ni la política definitiva de persistencia de
  `userData`.
- Integración real con `builds/browser` y persistencia del guardado
  (`electron/shell.js`, `electron/main.js`), segunda tarea de
  implementación de `docs/production/WINDOWS_PACKAGING_DECISION.md`:
  `userData`/`sessionData` se fijan bajo
  `<app.getPath("appData")>/el-teorema-del-si` (nombre hardcodeado, no
  derivado de `appId`/`name`/`productName`) antes de
  `app.requestSingleInstanceLock()`/`app.whenReady()`, creando ambos
  directorios de forma recursiva y no destructiva antes de `app.setPath`,
  con cierre controlado (`app.exit(1)`) si falla cualquier paso.
  `tools/verifyBuildOutput.mjs` falla el build si detecta referencias
  HTTP/HTTPS obligatorias, `file://`, rutas absolutas de sistema, recursos
  inexistentes o fugas fuera de `builds/browser` en atributos/
  declaraciones reales de carga. A raíz de un aviso real de Electron
  detectado en la primera prueba manual, se añadió además una
  Content-Security-Policy estricta en `index.html`
  (`default-src`/`script-src`/`style-src`/`media-src`/`font-src`
  limitados a `'self'`, `img-src` a `'self' data:`,
  `connect-src`/`object-src`/`base-uri`/`form-action`/`frame-src`/`worker-src`/`manifest-src`
  en `'none'`, sin `unsafe-eval` ni `unsafe-inline`), validada tanto en el
  HTML fuente como en el build generado (`tools/contentSecurityPolicy.mjs`).
  Validado con dos pruebas gráficas manuales reales en Windows (Node
  portable, sin Docker): la ventana abre, el juego carga sin errores, el
  guardado sobrevive a cerrar/reabrir Electron y a mover el repositorio a
  otra ruta (confirmado que reside bajo `%APPDATA%\el-teorema-del-si`, no
  junto al ejecutable), y la advertencia de CSP de Electron desapareció
  sin bloquear ningún recurso. Sigue sin existir ningún ejecutable
  empaquetado; `electron-builder`, el artefacto portable y la prueba en
  una instalación Windows limpia siguen pendientes.
- Configuración de `electron-builder@26.15.7` (exacta) y primera
  candidata portable Windows x64, tercera tarea de implementación de
  `docs/production/WINDOWS_PACKAGING_DECISION.md`: `electron-builder.yml`
  fija `appId: com.elteoremadelsi.game`, `productName: El Teorema del Si`,
  `win.executableName: ElTeoremaDelSi`, `asar: true` sin `asarUnpack`,
  `directories.output: release`, target Windows único `portable` con
  arquitectura única `x64` (sin `ia32`/`arm64`, sin `nsis`/`msi`/`appx`),
  `artifactName: El-Teorema-del-Si-${version}-win-x64-portable.exe`, sin
  `publish`, sin actualizador automático, sin firma configurada, y una
  lista `files` restrictiva (`electron/**`, `builds/browser/**`,
  `package.json`). Script nuevo `desktop:package:win`; `desktop:dev` sin
  cambios. Validado generando y ejecutando manualmente el artefacto real
  en Windows: `El-Teorema-del-Si-0.5.0-win-x64-portable.exe`
  (99.600.401 bytes, ~94,99 MiB, SHA-256
  `9AEBB4A0787416C6B41FE203AB42DC231D9D3A3C78ECCAC48A7794332C098463`)
  arranca sin depender de Node/Docker, sin consola adicional, con DevTools
  bloqueadas, guarda y carga correctamente, sobrevive a cerrar/reabrir y a
  copiar únicamente el `.exe` a otra ubicación fuera del repositorio
  (confirmando persistencia bajo `%APPDATA%\el-teorema-del-si`), y
  funciona sin conexión a Internet. Sin firma digital (`NotSigned`), sin
  aviso de SmartScreen en esta prueba. El wrapper portable exterior es un
  binario PE x86/IA32 (comportamiento estándar del mecanismo
  autoextraíble de `electron-builder`/NSIS); el payload Electron real que
  contiene es x64/AMD64. El artefacto no se versiona en el repositorio;
  GitHub Actions Windows, la documentación de entrega, la prueba en una
  instalación limpia distinta de esta máquina y el QA completo del
  artefacto siguen pendientes.
- Workflow de GitHub Actions Windows para el portable
  (`.github/workflows/windows-portable.yml`), cuarta tarea de
  implementación de `docs/production/WINDOWS_PACKAGING_DECISION.md`:
  separado de `ci.yml` (sin tocarlo); `runs-on: windows-latest`;
  triggers `pull_request` (con `paths:` cubriendo `tools/**` completo,
  no solo `build.mjs`, para no perder el disparo ante cambios en sus
  módulos importados) y `workflow_dispatch`; `permissions: contents:
  read` únicamente; `actions/checkout@v7`, `actions/setup-node@v7` y
  `actions/upload-artifact@v7` (no `@v4`, verificado contra la API real
  de GitHub antes de fijarlas, para no depender del runtime Node 20 ya
  deprecado); `npm ci` → `npm run test` → `npm run desktop:package:win`
  → validación fail-closed en PowerShell del `.exe` real generado
  (nombre, tamaño, ausencia de instaladores adicionales, `Get-ChildItem`
  deliberadamente sin `-Recurse` para no confundir el payload intermedio
  `release/win-unpacked/` con un segundo portable) → subida del `.exe`
  resuelto, únicamente él, como artifact `el-teorema-del-si-windows-x64-portable`.
  `tests/workflows/windows-portable-workflow-policy.test.js` (19
  pruebas) protege cada invariante leyendo el workflow como texto plano,
  sin depender de ninguna librería YAML nueva. Validado con dos
  ejecuciones reales en GitHub Actions Windows: la primera (job
  `package`: `SUCCESS`) reveló, por revisión humana de sus logs, el
  filtro de `paths` incompleto y las `actions@v4` con el aviso real de
  Node.js 20 deprecado; corregidos ambos, la segunda ejecución confirmó
  que esa advertencia ya no aparece, y que `ci.yml` siguió en verde. El
  artifact de esa segunda ejecución
  (`El-Teorema-del-Si-0.5.0-win-x64-portable.exe`, 99.600.399 bytes,
  ~94,99 MiB, SHA-256
  `3B9B8308DBF278088681DE142C384A99DF90267C6CD6EA202C502F182003C577`) fue
  descargado y su SHA-256 local coincidió exactamente con el registrado
  por el runner, confirmando integridad byte a byte; contenía un único
  archivo. Ejecutando ese `.exe` descargado (no el de la tarea 3):
  arranca, DevTools bloqueadas, y carga correctamente el guardado
  persistente existente, más una comprobación acotada adicional sin
  conexión a Internet — no sustituye el recorrido offline completo ni el
  QA exhaustivo de la tarea 7. La prueba en una instalación limpia
  distinta de esta máquina, la prueba entre dos builds compatibles, el
  QA completo del artefacto y el cierre documental de la Fase 5 siguen
  pendientes.
- Guía operativa del portable Windows
  (`docs/production/WINDOWS_PORTABLE_GUIDE.md`), quinta tarea de
  implementación de `docs/production/WINDOWS_PACKAGING_DECISION.md`:
  documento distinto de la decisión de arquitectura, dirigido a dos
  audiencias (usuario final que solo ejecuta el `.exe`, y mantenedor que
  puede necesitar construirlo). Cubre obtener el portable desde la
  ejecución del workflow `Windows portable` en GitHub Actions
  (distinguiendo el artifact `el-teorema-del-si-windows-x64-portable` del
  `.exe` que contiene), verificar nombre/tamaño/SHA-256 con
  `Get-FileHash` sin fijar ningún hash como "esperado" universal, la
  ejecución del portable sin requerir Node/Docker/el repositorio, las
  rutas reales de guardado (`%APPDATA%\el-teorema-del-si`,
  `%APPDATA%\el-teorema-del-si\chromium`), el estado `NotSigned` y el
  comportamiento de SmartScreen descritos con precisión, DevTools/
  seguridad esperadas, construcción local para mantenedores (`npm ci` +
  `npm run desktop:package:win`, nunca `npm install`), qué contenido de
  `release/` nunca debe distribuirse, un procedimiento de entrega de una
  candidata privada, un smoke test mínimo, y troubleshooting acotado.
  `tests/docs/windows-portable-guide-policy.test.js` (8 pruebas) protege
  las invariantes mecánicas del documento. Exclusivamente documental: no
  se tocó ningún código, configuración de `electron-builder` ni el
  workflow de GitHub Actions. No afirma que el portable ya se probó en
  una instalación Windows limpia ni que superó el QA completo del
  artefacto — ambas cosas siguen pendientes de las tareas 6 y 7.

### Corregido

- El manejo de guardados inválidos o incompatibles al cargar ("L" en el
  título y en el mundo) es ahora atómico y no propaga excepciones sin
  capturar: `GameState.restore()` construye escena, mundo, jugador,
  banderas, objetivo, cuaderno y los tres puzles en variables locales
  antes de mutar el estado, de modo que un guardado con JSON corrupto,
  `formatVersion` incompatible o datos de catálogo/Archivo inválidos deja
  el progreso previo intacto; `WorldScene.load()` captura cualquier error
  de `storage.load()` o `state.restore()` y muestra un aviso claro en
  lugar de romper el juego.
- El shell mínimo de Electron ahora desactiva realmente
  `webPreferences.devTools` en `buildSecureWindowOptions()` cuando
  `isPackaged` es `true` (o no se indica), no solo evita abrirlas
  automáticamente: antes quedaban accesibles por atajo de teclado incluso
  en una build empaquetada, porque `main.js` no propagaba
  `app.isPackaged` al construir las opciones de `BrowserWindow`. El
  toolchain de desarrollo requiere ahora Node `>=22.12.0` (antes `>=20`),
  coherente con lo que exige instalar `electron@43.3.0`.

### Pendiente

- Prototipos de papel de P2, P6 y P10.
- Prototipo técnico mínimo.
- Vertical slice del prólogo.
- Selección del candado y parametrización de P11.
