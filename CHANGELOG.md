# Historial de cambios

Todos los cambios relevantes se registrarán siguiendo una adaptación de Keep a Changelog.

## [No publicado]

### Añadido

- Diseño visual personalizado de Gonzalo y Elena (pelo, silueta y paleta
  propias aprobados en el Visual Style Lock) en `src/world/Player.js`,
  `src/scenes/WorldScene.js` y `src/scenes/CreditsScene.js`, y preparación
  del render procedural independiente de Max en `src/render/MaxRenderer.js`
  (sin integrarlo todavía en ningún mapa jugable), manteniendo el render
  procedural existente en `src/content/characterPalettes.js`. Tras la
  revisión visual humana, una segunda iteración añade separación
  torso/piernas, brazos y una segunda zona cromática de ropa (`bodyAccent`)
  a Gonzalo y Elena, y patas, cola y separación cabeza-cuerpo a Max. Dos
  correcciones focalizadas posteriores reconstruyen el contorno oscuro de
  fondo de Gonzalo y Elena, que pasa de uno o dos rectángulos grandes a
  varias piezas estrechas ajustadas al ancho real de cada franja del
  cuerpo, para que se lea como borde estructural en vez de como un bloque
  de fondo detrás del personaje; Max no lo necesitaba, al no usar nunca
  una silueta de fondo equivalente. Un último retoque exclusivo de Max
  (`src/render/MaxRenderer.js`) refina su silueta canina: la pata
  delantera deja de leerse como una prolongación vertical de la cabeza,
  se añade una pieza de pecho/cuello que conecta cabeza y cuerpo con una
  transición escalonada, y la cola pasa de un rectángulo horizontal a
  una forma en dos escalones que asciende hacia arriba y a la derecha;
  Gonzalo y Elena no se tocan en este retoque.
- Ambientación sonora inicial: `WorldScene.enter()` es la única
  autoridad de qué música principal suena, con un contrato de tres
  estados excluyentes basados en los flags narrativos ya existentes
  (`syncMusicToFlags()`, compartido con `reconcileAudioAfterLoad()`):
  epílogo ya completado detiene toda la música; diálogo con el padre de
  la novia ya completado (`brideNoteReceived`) reproduce el ambiental en
  loop; en cualquier otro caso (partida nueva o muy temprana) reproduce
  el opening en loop. El opening suena en loop desde la primera
  interacción del usuario en la pantalla de título hasta completar el
  diálogo del padre de la novia, momento en el que el ambiental lo
  sustituye (`WorldScene.interactWithBrideFather()`). `TitleScene`
  dispara el opening de forma optimista al empezar o cargar una partida
  (salvo que un peek del save indique que ya corresponde saltárselo --
  ver `TitleScene.savedGameSkipsOpening()`), y `WorldScene.enter()` sigue
  siendo la autoridad final que corrige o confirma en el mismo tick
  síncrono, sin producir un segundo `play()` real gracias al no-op de
  `AudioService.playMusic()` cuando la pista ya está activa. La
  transición de ambient a tema de epílogo ocurre de la misma forma.
  Cancelar desde el mundo (tecla `cancel`) detiene la música activa antes
  de volver a la pantalla de título, en vez de dejarla sonando
  indefinidamente allí; y cargar una partida guardada dentro del propio
  mundo (tecla `load`) reconcilia el audio con el estado restaurado a
  través de la misma lógica de tres estados. Dos rediseños posteriores,
  tras el rechazo humano de las dos versiones anteriores de ambas pistas
  por motivos de carácter musical (una primera versión sin pulso rítmico
  regular, y una segunda con un ambiental de carácter percibido como
  fúnebre), regeneran por completo `intro-theme.wav` (ahora un loop de
  apertura con pulso regular en 128 BPM: arpegio, melodía corta y un
  click de refuerzo del pulso, en registro agudo y modo mayor/lidio, todo
  staccato) y `ambient-theme.wav` (pulso regular en 96 BPM: raíz en
  negras y una figura melódica corta en corcheas, en registro grave y
  modo mayor/mixolidio, sin ninguna nota menor de color) — ver
  `src/assets/audio/README.md` para el detalle musical completo.
- Tres efectos de sonido (SFX) cortos, generados por síntesis aditiva
  local (`tools/generate-sfx-interact.mjs`,
  `tools/generate-sfx-activate.mjs`,
  `tools/generate-sfx-puzzle-success.mjs`, ver
  `src/content/sfxAudioConfig.js` y `src/assets/audio/README.md`),
  reproducidos con `AudioService.playSfx()` (independiente de la música
  principal, sin sustituirla): `sfx-interact.wav` (un tono breve a 880 Hz)
  suena en cada interacción válida dentro del mundo, disparado como
  primera sentencia de `WorldScene.interact()` -- el único punto de
  despacho de todas las interacciones del jugador, así que nunca se repite
  al avanzar un diálogo ya abierto; `sfx-activate.wav` (dos tonos
  secuenciales, raíz y quinta) suena una sola vez al confirmar la
  combinación correcta del mecanismo del regalo del epílogo
  (`EpilogueGiftCodeScene.confirmAttempt()`), nunca en un intento fallido
  ni al reentrar o reconfirmar tras haberlo resuelto ya; y
  `sfx-puzzle-success.wav` (arpegio ascendente C5-E5-G5) suena una sola
  vez por cada resolución real de uno de los tres puzles principales
  (`ArchiveCriteriaScene.applyResult()`,
  `LibraryCatalogueScene.applyResult()`,
  `P2BridgesScene.handleMoveResult()`), guardado por el código de
  transición propio de cada escena y nunca desde las funciones de
  progresión compartidas que también se invocan al restaurar una partida
  guardada, así que cargar un puzle ya resuelto no lo repite.
- Max como compañero visual de Gonzalo durante toda la partida
  (`src/world/MaxCompanion.js`), con seguimiento simple por distancia --
  sin pathfinding ni IA propia --, autorizado explícitamente por el
  responsable humano del producto como ampliación del alcance congelado
  (ver `docs/production/V1_1_PERSONALIZATION_SPEC.md`, bloque
  "Human-approved scope expansion -- Max companion"). Zona muerta de 31px
  (calculada, con margen, a partir de las cajas reales de Gonzalo y Max
  para que sus sprites nunca se solapen durante el seguimiento normal) y
  velocidad de alcance por encima de ese umbral cuando Max queda muy
  atrás. `WorldScene` reconstruye a Max en cada `setupCurrentMap()`
  (partida nueva, carga, cambio de mapa o regreso de un puzle), con una
  recolocación de spawn consciente de colisiones
  (`resolveMaxSpawnPosition()`/`computeMaxSpawnCandidates()`) que prueba
  una lista corta y fija de posiciones candidatas contra el
  `CollisionMap` real del mapa; no se persiste en el guardado
  (`SAVE_FORMAT_VERSION` sigue en 4). Reacciona con un ligero rebote a
  interacciones normales, cambios de mapa y a la resolución real (no
  reentrada) de cada uno de los tres puzles principales, y aparece junto
  a Gonzalo y Elena en el plano de cierre de `CreditsScene`. Reutiliza el
  render procedural de Max ya aprobado en `src/render/MaxRenderer.js` sin
  modificarlo.
- Pasada de personalización narrativa (cambios puramente textuales,
  autorizada explícitamente en `docs/production/V1_1_PERSONALIZATION_SPEC.md`,
  bloque "Human-approved narrative decision -- protagonist name reveals"):
  Corolaria se dirige a Gonzalo por su nombre en su primer diálogo
  (`WorldScene.interactWithCorolaria()`), y el nombre de Elena se revela
  por primera vez en el punto narrativo exacto en que su padre confirma
  su desaparición (`WorldScene.interactWithBrideFather()`, rama que arma
  `brideNoteReceived = true`), reutilizándose después en el resto de
  diálogos y objetivos que ya se referían a ella ("la novia" ->
  "Elena") en `WorldScene.js` y `src/content/worldMaps.js` (label del NPC
  `bride-epilogue`). El label estable `"Padre de la novia"` no cambia, ni
  tampoco el diálogo cerrado del epílogo. Limpieza de textos de
  diagnóstico ajenos a la narrativa: "Fin del vertical slice narrativo."
  desaparece del diálogo de `blocked-library`, el subtítulo de
  `TitleScene` deja de anunciar un "Vertical slice narrativo" y pasa a
  "Un regalo de boda" (sin nombres propios, según lo exigido por el
  spec), y la cabecera de `LibraryCatalogueScene` deja de mostrar el
  valor crudo del enum de fase (por ejemplo "arranging") y lo traduce con
  una función `phaseLabel()` análoga a la ya existente en
  `ArchiveCriteriaScene.js`.
- Plaza Visual Polish -- Wedding Preparation Style Lock (solo la Plaza del
  Axioma, `src/content/worldMaps.js`/`src/scenes/WorldScene.js`): la Plaza
  gana lectura visual de boda en preparación sin tocar geometría de
  colisión, progresión, guardado, audio ni diseño de personajes. El altar
  y la fuente conservan exactamente su posición/tamaño (y por tanto su
  `solidRegion` ya alineado) pero se redibujan con más detalle
  (`drawWeddingArch()`, `drawFountain()`: tela drapeada, flores, alfombra
  corta; boquilla y chorro de agua visibles en la fuente). Las dos mesas
  de banquete rectangulares se sustituyen por 4 mesas redondas de boda
  (`drawWeddingTable()`, tipo `wedding-table`, exclusivo de esta Plaza --
  la rama `tables` compartida con la Biblioteca y el Archivo no se toca).
  Se añaden 7 jardineras/macetas, 2 bancos, 4 faroles, una guirnalda entre
  los faroles que flanquean el arco, y un puesto/mostrador de preparativos
  sobre la zona superior antes vacía, todo mediante nuevas funciones de
  dibujo puras (`drawFlowerPlanter()`, `drawBench()`, `drawLampPost()`,
  `drawGarland()`, `drawMarketStall()`). El tablón de preparativos gana un
  marco de madera para leerse mejor como cartel, separando su rama de
  render de la que comparte con el tablero de P2 (que queda intacta).
  `renderGround()` gana una variación tonal adicional exclusiva de
  `axiom-plaza`, derivada del propio `palette`/`dawnPalette` del mapa (sin
  clave nueva de paleta). Ninguna decoración nueva alimenta `solidTiles`
  (son puramente visuales, como todo `decoration` en `createMap()`): cero
  NPCs ambientales nuevos en esta tarea (decisión explícita, documentada,
  para no confundir con la "frase corta" ya prevista para los NPCs
  ambientales de un ciclo posterior), cero cambios a `solidRegions`,
  `objects`, o al recorrido/alcanzabilidad real de cualquier interactuable
  existente, incluido `bride-epilogue` desde su punto de entrada real
  post-epílogo. Segunda pasada de densidad y riqueza visual, tras
  rechazo de la primera revisión visual humana por sentirse "demasiado
  vacía, geométrica y esquemática": los ocho helpers anteriores ganan más
  capas, sombras y detalle (bouquets en la base del arco, plataforma
  ceremonial más ancha, mesas con lazo y sillas diferenciadas, fuente con
  dos tonos de agua y reflejos, faroles con base y marco propios, puesto
  con toldo en dos paños y objetos sobre el mostrador); se añaden cuatro
  helpers pequeños nuevos (`drawFlowerPot()`, `drawDecorativeBush()`,
  `drawPetals()`, `drawWeddingCrate()`) y 19 decoraciones nuevas
  alrededor de la fuente, el altar, el puesto, los bancos, las mesas y
  las cuatro esquinas, sin mover ni una sola decoración, objeto o
  `solidRegion` ya existente. `renderGround()` corrige su lógica de
  variación tonal para formar parejas de baldosas contiguas reales (el
  primer intento nunca lo lograba: tiles adyacentes tienen siempre
  paridad opuesta en `tileX+tileY`, así que la comprobación de acento
  quedaba atrapada detrás del `continue` del propio patrón de tablero de
  ajedrez -- corregido evaluando el acento antes y sustituyendo el
  patrón normal cuando aplica). Un test nuevo compara todas las
  decoraciones de la Plaza entre sí (no solo contra objetos), cerrando
  el hueco que permitió que una guirnalda nueva solapara brevemente una
  jardinera ya existente durante esta misma ronda.

## [1.0.0] - 2026-08-11

Primera versión estable: recorrido narrativo completo de principio a fin
(Plaza del Axioma, Paseo de los Siete Puentes, Biblioteca del Margen,
Archivo compacto), los tres puzles principales, cuaderno de pistas,
guardado y carga con migración entre formatos, epílogo completo (código
de regalo, diálogo final, créditos, autosave terminal), versión web
estática y ejecutable portable para Windows, con QA de cierre y
documentación de release-readiness. Ver
[`docs/production/V1_RELEASE_READINESS.md`](docs/production/V1_RELEASE_READINESS.md)
para el detalle completo de evidencia y riesgos residuales aceptados
(compatibilidad A→B→A entre builds no ejecutada, duración no
cronometrada, pase visual dedicado no ejecutado, medición formal de
rendimiento/escalado no ejecutada, cuatro defectos menores de
nomenclatura/presentación conocidos y no corregidos — ninguno
bloqueante). La personalización final (nombres reales, fecha, mascota,
dedicatoria) queda fuera de esta versión, como trabajo posterior.
Publicada como GitHub Release el 2026-08-11 — ver
[`docs/production/V1_RELEASE_CLOSURE.md`](docs/production/V1_RELEASE_CLOSURE.md)
para el registro completo de la publicación (tag, artifact, checksum).

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
- Validación manual del portable en una instalación Windows limpia
  (`docs/production/WINDOWS_CLEAN_INSTALL_VALIDATION.md`), sexta tarea de
  implementación de `docs/production/WINDOWS_PACKAGING_DECISION.md`:
  prueba real en una **segunda máquina física**, distinta del entorno de
  desarrollo (Windows 11 Pro 25H2, build 26200.8875, x64 — confirmado con
  `Win32_OperatingSystem`/`winver`, no con el `ProductName` heredado del
  registro, obsoleto en Windows 11). Reutilizó, sin generar ningún
  ejecutable nuevo, el artifact ya validado en la tarea 4 (GitHub Actions
  run `31369511579`): `El-Teorema-del-Si-0.5.0-win-x64-portable.exe`,
  99.600.399 bytes, SHA-256
  `3B9B8308DBF278088681DE142C384A99DF90267C6CD6EA202C502F182003C577`,
  Authenticode `NotSigned` — ambos coincidieron exactamente con lo
  registrado en la tarea 4. Validado: arranque sin Node.js ni npm
  instalados en la máquina, con Docker Desktop instalado pero
  deliberadamente detenido durante la prueba (sin procesos en ejecución,
  sin dependencia en tiempo de ejecución hacia él); SmartScreen no
  apareció en esta ejecución concreta; sin consola adicional; DevTools
  bloqueadas (`F12`, `Ctrl+Shift+I`); creación del perfil persistente bajo
  `%APPDATA%\el-teorema-del-si` y `%APPDATA%\el-teorema-del-si\chromium`;
  nueva partida, guardado, cierre sin procesos huérfanos, y carga tras
  reabrir; y un **reinicio real** del sistema operativo, tras el cual el
  perfil persistente y el guardado siguieron disponibles y la partida
  cargó correctamente. Dos matices quedan documentados explícitamente en
  el propio documento de evidencia: no se registró `Test-Path` de
  `userData`/`sessionData` antes del primer arranque (la ausencia previa
  del juego en esa máquina está confirmada por el operador, no por una
  comprobación técnica registrada); y Docker estaba instalado en la
  máquina, no ausente. La prueba de compatibilidad entre dos builds
  portables distintas, el recorrido completo del juego, el QA exhaustivo
  de audio/offline y el cierre documental de la Fase 5 siguen pendientes
  de las tareas 7 y 8.
- QA funcional completo del artefacto Windows
  (`docs/production/WINDOWS_PORTABLE_FULL_QA.md`), séptima tarea de
  implementación de `docs/production/WINDOWS_PACKAGING_DECISION.md`:
  recorrido real del juego jugado de principio a fin sobre el mismo
  artifact ya validado en las tareas 4 y 6 (run de GitHub Actions
  `31369511579`, `El-Teorema-del-Si-0.5.0-win-x64-portable.exe`, SHA-256
  `3B9B8308DBF278088681DE142C384A99DF90267C6CD6EA202C502F182003C577`),
  en la misma segunda máquina física de la tarea 6, íntegramente offline
  (Wi-Fi/Ethernet desconectados durante todo el recorrido). Validado:
  los tres puzles principales (Paseo de los Siete Puentes, Biblioteca del
  Margen, Archivo compacto); el mecanismo del regalo con un código
  incorrecto y con el código correcto `7152`; el diálogo final, los
  créditos y las tarjetas; el audio del epílogo (única pista existente en
  el proyecto), incluido su funcionamiento offline; ausencia de fallos
  visibles de assets/renderizado; el autosave terminal, el cierre, la
  reapertura y la carga del estado completado; y el comportamiento
  read-only del estado terminal (el mecanismo del regalo y el diálogo
  final ya resueltos no vuelven a dispararse ni a mutar el guardado, sin
  impedir seguir jugando/guardando con normalidad), según
  `docs/production/EPILOGUE_SPEC.md`. `SAVE_FORMAT_VERSION` se verificó
  en `4` (`src/state/GameState.js:15`) y no se modificó. Los checkpoints
  representativos de guardado/carga (`K`/`L`) en fase inicial, progreso
  intermedio y pre-epílogo no se repitieron en esta tarea: esa
  persistencia básica, junto con el cierre/reapertura, la independencia
  de Node.js/npm/Docker en ejecución, DevTools bloqueadas, y el reinicio
  real de Windows y su persistencia, ya se registraron en la tarea 6 y
  esta tarea se apoya en esa evidencia sin repetirla. No se cronometró la
  duración exacta del recorrido.

  **Riesgo residual aceptado explícitamente por el responsable del
  producto para `v1.0.0`**: la prueba controlada de
  compatibilidad/sustitución entre dos builds portables distintas
  (candidata manual de la tarea 3 — SHA-256
  `9AEBB4A0787416C6B41FE203AB42DC231D9D3A3C78ECCAC48A7794332C098463` — y
  artifact de CI de la tarea 4) **no se ejecutó**. Que ambas candidatas
  se hayan probado individualmente en sus propias tareas no equivale a
  haber probado la secuencia de sustitución conservando el mismo perfil
  de usuario; este documento no lo presenta como tal. El cierre
  documental de la Fase 5 sigue pendiente de la tarea 8.
- Cierre documental y auditoría final de la Fase 5 de empaquetado Windows
  (`docs/production/WINDOWS_PACKAGING_PHASE5_CLOSURE.md`, nuevo), octava
  y última tarea de implementación de
  `docs/production/WINDOWS_PACKAGING_DECISION.md`: tarea exclusivamente
  documental, sin pruebas nuevas ni cambios de código. Audita la
  evidencia ya registrada en las tareas 1-7 y marca las tareas 1-8 como
  completadas. El artifact portable Windows (run de GitHub Actions
  `31369511579`, SHA-256
  `3B9B8308DBF278088681DE142C384A99DF90267C6CD6EA202C502F182003C577`)
  queda funcionalmente validado en una segunda máquina física, con QA
  end-to-end offline (recorrido completo, los tres puzles, epílogo,
  audio, autosave terminal, reapertura y estado read-only). La prueba
  controlada de compatibilidad/sustitución entre dos builds distintas
  (A→B→A) sigue registrada como no ejecutada, con el riesgo residual
  aceptado explícitamente por el responsable del producto para `v1.0.0`.
  Este cierre cubre exclusivamente el empaquetado Windows dentro de la
  Fase 5 de `docs/production/V1_PRODUCTION_PLAN.md` §6 — no cierra esa
  Fase 5 completa (que incluye QA general y accesibilidad, todavía
  pendientes), ni publica `v1.0.0`, ni fusiona `feat/v1-production-scope`
  en `main`. Una segunda auditoría, cruzando código, tests y
  documentación reales (no solo las casillas del plan), encontró que
  `V1_PRODUCTION_PLAN.md` §2, §3 y §5 seguían marcando como pendientes
  la Biblioteca del Margen, el epílogo (pese a que sus 16 tareas de
  `EPILOGUE_SPEC.md` §18 ya estaban completas), la conexión de
  pistas/cuaderno y la integración de audio — todo ya implementado y
  probado, incluido un recorrido real sobre el propio ejecutable Windows
  (tarea 7). Se corrigieron esas casillas con su evidencia
  correspondiente. Una tercera revisión completó la auditoría contra
  código/tests reales para las Fases 2-5, las Puertas de calidad, las
  decisiones de facto de §11 y el checklist de §12 de
  `V1_PRODUCTION_PLAN.md`, marcando como completados los entregables,
  criterios y pruebas con evidencia directa (mapas, validadores, tests
  unitarios y E2E, `npm run check` en verde), y reclasificó la
  personalización final: `EPILOGUE_SPEC.md` la documenta explícitamente
  como trabajo futuro fuera del alcance del epílogo aprobado, y el
  responsable del producto confirmó que `v1.0.0` se entrega sin ella —
  deja de ser un requisito bloqueante (sin marcarse como implementada).
  El arte y la duración medida del recorrido completo siguen
  genuinamente pendientes, sin decisión de exclusión ni cifra inventada.
- Cierre de release-readiness para `v1.0.0`: auditoría exclusivamente
  documental, sin funcionalidad nueva, sin pruebas nuevas, sin
  ejecutable nuevo. Nuevo
  [`docs/production/V1_QA_MATRIX.md`](docs/production/V1_QA_MATRIX.md),
  una matriz que reutiliza evidencia ya existente (unitaria, E2E, manual,
  Windows, offline) por requisito, sin marcar ninguna celda PASS sin
  cita concreta. Nuevo
  [`docs/production/V1_RELEASE_READINESS.md`](docs/production/V1_RELEASE_READINESS.md)
  con conclusión **READY FOR v1.0.0**: el recorrido completo está
  implementado y probado (546/546 tests unitarios, 15 tests E2E sin
  interacción de ratón, QA end-to-end real en el ejecutable Windows), no
  existe ningún defecto bloqueante o grave registrado, la accesibilidad
  básica del alcance v1 está validada (100% operable con teclado, sin
  requisitos exclusivamente auditivos), y las migraciones/fixtures de
  guardado están cubiertas materialmente por la suite existente
  (formatos 1-4, ~35 variantes de guardado inválido). `V1_PRODUCTION_PLAN.md`
  §6 Fase 5 se declara completada; las Fases 6-8 (congelación de
  contenido, contingencia, entrega) siguen pendientes por depender de
  fechas futuras y de la propia integración/release. `README.md` se
  actualizó para reflejar el estado real del proyecto (eliminando
  afirmaciones obsoletas como "desarrollo todavía no iniciado" o
  Electron como "opción provisional"), con comandos npm reales,
  controles del juego, y enlaces a la documentación de producción
  vigente. Esta conclusión READY no publica `v1.0.0`, no fusiona
  `feat/v1-production-scope` en `main`, no cambia la versión declarada
  en `package.json`, y no crea ningún tag ni GitHub Release — esas
  acciones siguen pendientes y requieren decisión humana explícita.
  Una revisión independiente encontró afirmaciones de "Fase 5 todavía
  pendiente"/"QA general pendiente" que ya no reflejaban el cierre
  posterior de release-readiness — corregidas para distinguir la
  cronología (pendiente en el momento del cierre de empaquetado Windows,
  cerrada después) sin perder el historial. Auditó además, con evidencia
  real de código/specs, dos criterios de "definición de terminado" que
  seguían sin marcar: la deducibilidad de los tres puzles (reglas y
  evidencias siempre visibles en pantalla para Biblioteca y Archivo; un
  sistema de pistas de 3 niveles libre y sin coste, documentado como
  diseño de accesibilidad intencional, compartido por los tres) y la
  progresión de los 10 objetivos reales del juego (ninguno revela una
  solución). Unificó la semántica de "defectos conocidos" en todo el
  plan verificando directamente los Issues de GitHub del repositorio
  (0 issues, abiertos o cerrados) en vez de solo inferir la ausencia de
  un registro local. Reconcilió Fase 4 (arte, audio, textos) contra
  evidencia ya existente, dejando como riesgo aceptado no bloqueante
  únicamente el pulido visual/rendimiento sin medir.
- Auditoría estática completa de textos, nombres, objetivos y pistas
  (§11 "Estrategia de arte y audio" y Fase 4 de `V1_PRODUCTION_PLAN.md`,
  parte del mismo cierre de release-readiness): revisó nombres de
  personajes/localizaciones, diálogos de `WorldScene.js`, títulos y
  mensajes de fallo de los tres puzles, créditos del epílogo, los 10
  objetivos y las 4 entradas de cuaderno, sin jugar de nuevo. Encontró y
  documentó **4 defectos menores, no bloqueantes** (nomenclatura, no
  lógica ni datos): "La Investigadora"/"Padre de la Investigadora" en
  los `label` de NPC de `worldMaps.js` frente a "la novia"/"el padre de
  la novia" en el resto del juego; "Biblioteca" (nombre oficial del
  mapa) frente a "Biblioteca del Margen" (narrativa); y un valor de fase
  de puzle sin traducir visible en pantalla en `LibraryCatalogueScene.js`.
  Registrados en `V1_PRODUCTION_PLAN.md` §5 "Defectos menores conocidos"
  y en `V1_QA_MATRIX.md`, sin modificar código — su corrección queda
  como trabajo de pulido menor futuro. Cierra también §11 "Estrategia de
  arte y audio" (antes solo el audio tenía decisión de facto) y registra
  la medición formal de rendimiento/escalado pixel-perfect como riesgo
  aceptado no bloqueante, no ejecutada.
- Registrada la aceptación explícita del responsable del producto
  (2026-08-11) sobre los dos riesgos residuales que la auditoría de
  release-readiness había clasificado sin una aceptación previa
  separada: la ausencia de medición formal de rendimiento/escalado
  pixel-perfect y los cuatro defectos menores de nomenclatura. Ambos
  quedan documentados como conocidos, no corregidos y no bloqueantes
  para `v1.0.0` en `V1_PRODUCTION_PLAN.md`, `V1_QA_MATRIX.md` y
  `V1_RELEASE_READINESS.md` — ninguno se convierte en PASS técnico, no
  se corrigió ningún código ni se repitió ninguna prueba.

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
