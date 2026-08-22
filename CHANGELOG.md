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
  jardinera ya existente durante esta misma ronda. Tercera y última
  pasada de polish tras una segunda ronda de rechazo en revisión visual
  humana ("al 70-75% del objetivo"): el arco gana sombra de plataforma,
  borde de piedra más marcado y flores laterales a media altura de cada
  poste (además de las ya existentes arriba); la fuente gana un anillo
  de piedra intermedio y sombra de contacto con el suelo; las mesas
  ganan una pequeña vela junto al centro floral; el puesto gana un
  ribete de lazo en el toldo. Nuevo helper `drawFabricRoll()` (rollo de
  tela) y 14 decoraciones nuevas -- dos "cipreses" de borde
  (reutilizando el tipo `bush` con proporciones altas y estrechas, sin
  tipo nuevo), macetas emparejadas junto a los arbustos de las cuatro
  esquinas y junto al puesto (para formar composiciones de 2-4
  elementos en vez de plantas sueltas), dos rollos de tela, y cuatro
  grupos de pétalos adicionales en zonas abiertas alejadas del centro
  jugable exacto. Cuarta pasada, de fidelidad pixel-art, tras una tercera
  ronda de rechazo en revisión visual humana ("el problema ya no es
  densidad, es fidelidad gráfica": los props se seguían leyendo como
  bloques grandes de `fillRect`): los 13 helpers de dibujo se dividen en
  una función `drawXSprite()` de pixel-art (más tonos por material,
  siluetas escalonadas/irregulares en vez de rectángulos puros, vetas de
  madera, pliegues de tela, pétalos y hojas individuales, sombreado de
  volumen en postes y columnas) y un wrapper fino `drawX()` que la invoca
  a través de un cache pequeño y acotado (`propSpriteCache`,
  `getCachedPropSprite()`, `drawCachedProp()`): cada combinación
  tipo+tamaño se rasteriza una única vez en un `<canvas>` descartable
  (nunca el canvas principal del juego) con `imageSmoothingEnabled =
  false`, y se reutiliza con `drawImage()` en cada frame posterior --
  cero sistema de tiles genérico, asset manager o motor de sprites,
  cero PNG/asset externo, todo el pixel-art sigue siendo código puro del
  proyecto. `getCachedPropSprite()` devuelve `null` cuando `document` no
  existe (el caso de `node --test`, sin DOM), así que en el entorno de
  test cada helper cae exactamente en la misma lógica de dibujo directa
  ya cubierta por la suite existente -- ningún test unitario tuvo que
  cambiar por este motivo. Verificado por cálculo explícito del área real
  dibujada por cada `drawXSprite()` contra el tamaño de canvas reservado:
  cinco props (`wedding-table`, `wedding-arch`, `fountain`, `crate`,
  `lamp-post`) sobresalían por uno o varios lados de su bounding box
  nominal (sillas, follaje, remates y sombras de contacto quedaban 1-4px
  fuera) y se recortaban silenciosamente contra el borde del sprite
  cacheado sin que ningún test lo detectara (el entorno de test nunca
  ejercita la rama de cache); corregido anclando cada sprite al bounding
  box real y desplazando el dibujo en el wrapper correspondiente. Dos
  bucles de banderines/franjas (`market-stall`, `garland`) podían
  sobresalir hasta 10px de su ancho nominal en la última iteración
  cuando el ancho no es múltiplo del paso del bucle; el sprite cacheado
  gana ese margen extra para no perder esa franja. El agente `qa`
  encontró de forma independiente un séptimo caso del mismo patrón, más
  sutil (1px, 16% de opacidad): la sombra de contacto de
  `drawWeddingTableSprite()` llegaba una fila más abajo que la silla
  inferior, y el canvas cacheado de la mesa medía 46px de alto cuando
  necesitaba 47; corregido antes de pasar a `reviewer`. Nuevo archivo de test
  dedicado, `tests/scenes/WorldScenePixelArtCache.test.js` (en un
  archivo aparte porque `propSpriteCache` es un `Map` a nivel de módulo
  compartido entre los `test()` de un mismo archivo bajo `node --test`,
  y no debe contaminar la suite existente, que depende de que `document`
  sea `undefined`), que simula un `document` mínimo para cubrir: que los
  sprites se rasterizan con `imageSmoothingEnabled = false`; que un
  segundo render no crea ningún canvas de sprite adicional (misma
  instancia reutilizada vía `drawImage()`); y que props del mismo tipo
  con distinto tamaño no comparten sprite cacheado. El agente `reviewer`
  señaló que esta última prueba solo contaba "más de un canvas distinto"
  en todo el render de axiom-plaza, lo que no aislaba de verdad la
  variante de tamaño que decía cubrir (los dos tamaños de `bush`, 20x20
  en las esquinas y 20x24 junto a la fuente); corregida para comprobar
  explícitamente que existen canvases de sprite de ancho 20 con ambas
  alturas cacheadas (23 y 27) antes de comitear. Ningún cambio a
  `worldMaps.js`, a la composición, a personajes o a gameplay: la
  densidad y posición de las 54 decoraciones existentes se mantiene
  intacta, solo cambia cómo se rasteriza cada una. Quinta pasada, un
  spike de estrategia de representación tras un cuarto rechazo en
  revisión visual humana ("la técnica es correcta pero los props siguen
  leyéndose geométricos"): en vez de seguir componiendo cada prop con
  fillRect en tiempo de ejecución, `wedding-table` migra a pixel-art
  indexado -- una matriz de caracteres de 40x40 (`src/content/
  weddingTablePixelArt.js`) más una paleta compacta, diseñada a mano y
  rasterizada pixel a pixel una única vez mediante el nuevo helper
  genérico `createIndexedPixelSprite()`, reutilizando sin cambios la
  cache existente (`propSpriteCache`/`drawCachedProp`). `drawWeddingTableSprite()`
  (la implementación geométrica anterior) se elimina por completo, no
  solo se desconecta. Durante la implementación y dos rondas de
  verificación independiente (`qa` y `reviewer`) se encuentran y corrigen
  7 casos del mismo patrón de recorte silencioso contra el borde del
  sprite cacheado que motivó las correcciones de la ronda anterior --
  incluida una asimetría real entre la silla oeste y este de la mesa (un
  error de mapeo en el reflejo horizontal, corregido con coordenadas
  explícitas en vez de una fórmula parametrizada) y una asimetría más
  sutil por el redondeo del círculo del mantel contra una rejilla de 40
  sin eje de simetría entero, resuelta redibujando las sillas oeste/este
  encima del mantel ya pintado sin tocar el mantel ni el comportamiento
  norte/sur ya aceptado. El lazo rosa de un solo lado, heredado de la
  versión geométrica anterior, se documenta explícitamente en el propio
  archivo de datos para no confundirlo con un bug de simetría en
  revisiones futuras. Nuevos tests: `tests/content/
  WeddingTablePixelArt.test.js` (datos puros, sin DOM) y dos tests
  añadidos a `WorldScenePixelArtCache.test.js` (dimensiones del canvas
  cacheado; que los pixeles transparentes de la matriz no generan
  `fillRect`). Sexta pasada, la migración del resto de props principales
  de la Plaza a la misma estrategia (pixel-art indexado) tras la
  aprobación humana explícita de esa técnica validada en `wedding-table`:
  `wedding-arch` (decoración tipo `altar`), `fountain`, `flower-planter`,
  `flower-pot`, `bush` (sus tres tamaños reales -- 20x24 junto a la
  fuente, 20x20 en las cuatro esquinas, y los "cipreses" de 14x34 --
  migran cada uno a su propia matriz, compartiendo una única paleta en
  `src/content/bushPixelArt.js`), `bench`, `lamp-post`, `market-stall`,
  `crate` y `fabric-roll`. Los 9 pares `drawX`/`drawXSprite` geométricos
  correspondientes se eliminan por completo. `garland` y `petals` se
  dejan deliberadamente sin migrar: siguen siendo composición geométrica
  simple (pocos `fillRect`) y ya legible, tal como autorizaba
  explícitamente esta tarea si migrarlos no aportaba mejora visual real.
  La fuente necesita una paleta dinámica -- el agua no tiene un color
  fijo, cada mapa define su propio `palette.water`/`dawnPalette.water` --
  así que `buildFountainPalette(waterColor)` construye la parte variable
  y la clave de cache de `drawFountain()` incluye el color de agua exacto
  para no compartir el sprite rasterizado entre mapas con tonos
  distintos; memoizada por color para evitar asignar un objeto de paleta
  y un closure nuevos en cada frame en que la fuente esté visible
  (hallazgo del agente `reviewer`, corregido antes de comitear).
  `drawDecorativeBush()` selecciona entre las tres variantes comparando
  `width`/`height` reales contra las dimensiones de cada matriz -- una
  decisión de diseño más frágil que la versión geométrica anterior (que
  generaba el arbusto proporcionalmente a cualquier tamaño): documentado
  explícitamente en el código que cualquier tamaño de decoración `bush`
  futuro que no sea una de estas tres combinaciones exactas necesitará su
  propia matriz y su propia rama, no un tamaño por defecto. Nuevos tests:
  `tests/content/PropPixelArt.test.js` (datos puros de los 10 módulos
  nuevos, dimensiones y cobertura bidireccional de paleta) y dos tests
  más en `WorldScenePixelArtCache.test.js` (dimensiones del canvas del
  altar; que la fuente cachea sprites distintos para `palette.water`
  normal frente a `dawnPalette.water`). Ningún cambio a `worldMaps.js`,
  composición, personajes, colisión, guardado ni audio en ninguna de las
  dos rondas.
- Seven Bridges Visual Polish -- aplica al Paseo de los Siete Puentes
  (`seven-bridges-walk`) el mismo lenguaje de pixel-art indexado aprobado
  en Plaza Visual Polish (sprites indexados como matriz de caracteres,
  rasterización única, `propSpriteCache`), sin copiar la decoración de
  boda de la Plaza y sin tocar puzzles, colisión, personajes, NPCs, audio
  ni ningún otro mapa. Tres datasets nuevos: `pierPixelArt.js` (pilar de
  piedra, dos variantes de tamaño que restylan visualmente -- sin alterar
  su footprint ni su colisión -- los 5 `solidRegions` ya existentes del
  mapa), `bridgePixelArt.js` (tablero de puente de madera con barandilla,
  un único dataset reutilizado en los dos cruces reales del paseo) y
  `pathSignPixelArt.js` (cartel de señalética junto al tablero del puzle
  P2 y junto al embarcadero, sin tocar su interacción/id). La decoración
  de fondo `river` gana variación tonal de agua, reflejos y un borde de
  piedra con sombra de contacto (`renderBackgroundDecorations`, exclusivo
  de este mapa). Se añaden 17 decoraciones nuevas a `worldMaps.js` (5
  `pier`, 2 `bridge`, 2 `path-sign`, y banco/farol/arbustos reutilizados
  de Plaza en ambas orillas), sin ningún cambio a `solidRegions`, `objects`
  ni composición de ningún otro mapa. Nuevos tests: `tests/content/
  SevenBridgesPropPixelArt.test.js` (datos puros de los 3 datasets),
  `tests/scenes/SevenBridgesPixelArtCache.test.js` (cache de sprites) y
  una sección nueva en `tests/content/WorldMaps.test.js` que protege
  `solidTiles`/`objects` intactos, ausencia de solapes entre la
  decoración nueva y los interactuables/entre sí, y que ambos puntos de
  entrada reales del mapa siguen transitables. Tras dos hallazgos reales
  de una primera revisión independiente (`reviewer`) -- los `bridge` no
  cubrían el canal de agua real entre columnas de pilares (quedaban
  desplazados, uno con un borde sobre tierra firme) y una banda de agua
  oscura desbordaba 4px, de forma opaca, sobre césped transitable al sur
  del río -- se recolocan `bridge-west`/`bridge-east` exactamente borde
  con borde entre sus dos columnas de pilares y se acota la altura de la
  última banda/línea de agua a los límites reales de la decoración
  (`renderBackgroundDecorations`). Dos tests de regresión nuevos cubren
  ambos hallazgos sin comparar contra una imagen de referencia: uno en
  `WorldMaps.test.js` que verifica que cada `bridge` encaja exactamente
  entre sus dos pilares (no solo "no se solapan"), y otro en
  `tests/scenes/WorldScene.test.js` que verifica que ninguna banda/línea
  de agua se dibuja fuera de los límites verticales reales de `river`.
  Una segunda ronda de revisión independiente encuentra un tercer defecto
  real: `pier` es una decoración totalmente opaca, y `embarcadero` (que ya
  se apoyaba intencionadamente sobre el solidRegion de `pier-right-bottom`
  antes de esta tarea) quedaba dibujada ANTES que los `pier` en el array
  de `decorations` -- como `renderForegroundDecorations()` pinta cada
  decoración en el orden del array, el pilar tapaba el 67% del muelle de
  madera. Se reordena `embarcadero` para que se dibuje después de los 5
  `pier` (el muelle queda apoyado visualmente sobre el pilar, no al
  revés), y se añade un tercer test de regresión en `WorldMaps.test.js`
  que protege el ORDEN de capas entre `pier` y cualquier decoración con la
  que solape a propósito, no solo la ausencia de solape. Requiere
  aprobación visual humana del acabado final
  (`HUMAN MAP STYLE APPROVAL REQUIRED`), igual que Plaza Visual Polish.
- Gonzalo Character Pixel-Art Spike -- prueba si el style lock de pixel-art
  indexado ya aprobado para props (Plaza Visual Polish) generaliza también
  a personajes. Migra el render de Gonzalo (`src/world/Player.js`) del
  renderer procedural anterior (rectángulos geométricos grandes, sin
  variación por dirección salvo un pequeño marcador de orientación
  separado) a tres sprites indexados nuevos -- `GONZALO_FRONT_PIXELS`,
  `GONZALO_BACK_PIXELS` y `GONZALO_SIDE_PIXELS` (`src/content/
  gonzaloPixelArt.js`, 14x22, mismo bounding box visual que el render
  anterior) -- rasterizados y cacheados por `src/render/
  GonzaloRenderer.js`, un módulo de render independiente (mismo patrón
  que `src/render/MaxRenderer.js`) con su propia cache mínima local (no
  reutiliza `propSpriteCache` de `WorldScene.js` a propósito, para no
  crear una dependencia circular entre `src/world/` y `src/scenes/`).
  Ojos simples añadidos con autorización humana explícita: 1 pixel lógico
  por ojo, color oscuro, sin blanco ni pupila, sin sistema facial ni
  animación -- 2 ojos de frente, 1 en lateral, ninguno de espalda. Las
  tres variantes comparten el mismo cuerpo base (silueta, pelo en dos
  tonos, ropa con sombra/highlight, calzado diferenciado del pantalón) --
  no se inventan cuatro poses distintas donde el contrato de facing
  anterior no las necesitaba. (En el pixel-art original las tres solo
  diferían en la fila de ojos; dos microiteraciones posteriores, más
  abajo en esta misma entrada, hacen que `back` también diverja en la
  coronilla -- compartida -- y en la nuca -- exclusiva de `back` --, ver
  `gonzaloPixelArt.js` para el contrato exacto vigente.)
  El lateral ("side") se reutiliza también para el facing "left",
  reflejado horizontalmente con una transformación de canvas en tiempo de
  dibujo (`context.scale(-1,1)`), no con un cuarto dataset. Preserva
  exactamente los cuatro colores ya existentes de `PROTAGONIST_PALETTE`
  (silueta, pelo, cuerpo, acento) y añade cinco tonos derivados para el
  sombreado. Cambio puramente visual: hitbox (10x14), velocidad,
  colisión, input, lógica de facing, cámara, GameState, save, audio y el
  resto de personajes (Elena, Corolaria, Padre de la novia, Silogio, Max)
  quedan completamente intactos. Nuevos tests: `tests/content/
  GonzaloPixelArt.test.js` (datos puros: dimensiones, paleta, ausencia de
  boca, que front/side solo difieren en la fila de ojos con el recuento
  exacto de ojos esperado por variante) y `tests/render/
  GonzaloRenderer.test.js` (cache: un canvas por variante, reutilización
  sin reconstrucción entre frames, mismo canvas cacheado compartido entre
  "left" y "right"). `tests/world/Player.test.js` se reescribe para
  comparar contra los datos reales del sprite en vez de coordenadas de
  rectángulos grandes hardcodeadas de la versión geométrica anterior.
  Requiere aprobación visual humana del acabado final
  (`HUMAN CHARACTER STYLE APPROVAL REQUIRED`), igual que las rondas de
  Plaza Visual Polish: la diferencia visual es sutil al zoom de juego por
  defecto (el sprite mide 14x22 dentro de un canvas mostrado a 960x540),
  así que se recomienda inspeccionar las capturas comparativas ampliadas
  para valorar el acabado final. Microiteración tras revisión visual
  humana (PR #59 "NOT APPROVED YET": Gonzalo se percibía calvo o con la
  línea de pelo demasiado retrasada, no por los ojos sino por poca masa
  de pelo en la coronilla): se ajustan únicamente las filas 2 y 3 de las
  tres matrices (`GONZALO_FRONT/BACK/SIDE_PIXELS`, idénticas entre sí en
  esas filas) para bajar la línea de pelo y dar cobertura real sobre la
  coronilla, con un borde ligeramente irregular en vez de un corte recto
  -- ningún otro pixel (ojos, piel del resto de la cara, ropa, piernas,
  calzado) ni `Player.js`/`GonzaloRenderer.js` se tocan. Dos tests nuevos
  por variante en `GonzaloPixelArt.test.js` protegen que la fila de la
  coronilla sea pelo puro y que el pelo domine sobre la piel visible en
  la mitad superior de la cabeza -- ambos habrían fallado contra el
  pixel-art anterior, confirmando que detectan el defecto real señalado
  en la revisión humana. Tercera microiteración tras una nueva revisión
  visual humana (el frontal ya se leía bien, pero "la variante BACK
  todavía hace que Gonzalo parezca calvo en la nuca"): a diferencia del
  ajuste de la coronilla, este es exclusivo de `GONZALO_BACK_PIXELS` --
  las filas 7-8 (mandíbula/nuca) pasan de sombra de piel a pelo, dejando
  a propósito la fila 9 (cuello) como la pequeña zona de piel que la
  propia revisión permitía. `GONZALO_FRONT_PIXELS`/`GONZALO_SIDE_PIXELS`
  no se tocan. El test que antes afirmaba que las tres variantes eran
  idénticas salvo la fila de ojos se divide en dos: uno que seguimos
  exigiendo estricto para front/side, y uno nuevo que acota exactamente
  qué filas puede divergir `back` (`BACK_ONLY_HAIR_ROWS`), más dos tests
  que protegen la cobertura real de la nuca y que la fila del cuello
  conserva su pequeña zona de piel. Cuarta microiteración: la corrección
  anterior dejaba una banda de piel gruesa (filas 4-6) justo debajo de la
  coronilla, efecto "tonsura" -- la propia revisión humana daba el
  contrato exacto esperado ("PELO/PELO/PELO/PELO/NUCA de 1 fila/
  CAMISETA"). Se extiende el pelo de `GONZALO_BACK_PIXELS` a las filas
  3-8 (antes solo 7-8), dejando la fila 9 como única fila de piel de
  cabeza (cuello), y se actualiza `BACK_ONLY_HAIR_ROWS` y la detección de
  la fila de ojos (que dejó de poder localizarse comparando front contra
  back, al diferir ahora en más de una fila por motivos ajenos a los
  ojos; se localiza comparando front contra side, que nunca se toca) en
  consecuencia. Nuevo test que exige que la piel de la cabeza de `back`
  quede reducida a exactamente esa única fila.
- Elena Character Pixel-Art -- aplica a Elena (la novia, NPC
  `bride-epilogue` en `axiom-plaza`, solo visible con `giftCodeSolved`)
  el mismo lenguaje visual ya aprobado con Gonzalo. Migra
  `WorldScene.renderElena()` del render geométrico anterior a tres
  sprites indexados nuevos -- `ELENA_FRONT_PIXELS`, `ELENA_BACK_PIXELS` y
  `ELENA_SIDE_PIXELS` (`src/content/elenaPixelArt.js`, 14x22, misma
  escala que Gonzalo) -- rasterizados y cacheados por un nuevo
  `src/render/ElenaRenderer.js` (mismo patrón exacto que
  `GonzaloRenderer.js`: cache local propia, `renderElena(context,x,y,
  facing)`, "left" reutiliza el sprite de "side" reflejado en tiempo de
  dibujo). Mismo criterio de ojos ya aprobado (2 de frente, 1 en lateral,
  ninguno de espalda) y, aprendiendo directamente de las cuatro
  microiteraciones que hicieron falta en Gonzalo, el contrato final de
  pelo trasero completo (BACK sin ninguna banda de piel bajo el pelo) se
  aplica desde el primer diseño, no como corrección posterior.
  Identidad propia de Elena, deliberadamente distinta de Gonzalo pese a
  compartir escala/técnica/outline/criterio de ojos: pelo largo que baja
  por los laterales del torso (en vez de mangas cortas) y falda/vestido
  de una sola pieza sin dividir en dos perneras (en vez de pantalón) --
  preserva la silueta y paleta ya aprobadas de `BRIDE_PALETTE`
  (`characterPalettes.js`), con la piel compartida con Gonzalo
  (`SKIN_TONE`) y el resto de tonos propios. `gonzaloPixelArt.js` y
  `GonzaloRenderer.js` no se tocan en absoluto. Cambio puramente visual:
  hitbox, colisión, movimiento, `GameState`, save y audio quedan
  intactos; ningún otro personaje (Corolaria, Padre de la novia, Silogio,
  Max) se toca. Nuevos tests: `tests/content/ElenaPixelArt.test.js` y
  `tests/render/ElenaRenderer.test.js` (mismo patrón que los de Gonzalo,
  más dos pruebas específicas de la identidad propia de Elena: pelo largo
  visible en los laterales del torso, y falda de una sola pieza sin hueco
  central). Cinco tests de `WorldScene.test.js` que asumían el render
  geométrico anterior de `bride-epilogue` se reescriben para comparar
  contra los datos reales del nuevo sprite, mismo patrón que se usó para
  los tests de `Player.test.js` cuando Gonzalo migró. Requiere aprobación
  visual humana del acabado final
  (`HUMAN CHARACTER STYLE APPROVAL REQUIRED`). Una corrección focalizada
  posterior, ya con Elena aprobada visualmente, alcanza también a
  `CreditsScene.js`: su función interna `drawElena()` seguía dibujando a
  Elena con el renderer geométrico antiguo (`BRIDE_PALETTE` en bloques),
  produciendo una inconsistencia visual frente al epílogo (que ya usaba
  `ElenaRenderer`). `drawElena()` pasa a delegar en
  `renderElena(context, x, y, "down")` de `ElenaRenderer.js`, sin ningún
  ajuste de posición o escala (mismo anclaje esquina-superior-izquierda
  que ya usaba el render geométrico anterior). `Gonzalo` (`drawGonzalo()`,
  en el mismo archivo) y `Max` no se tocan. `tests/scenes/CreditsScene.test.js`
  se actualiza con el mismo patrón de conteo derivado de los datos ya
  usado para `Player.test.js`/`WorldScene.test.js`, más una prueba nueva
  que exige explícitamente que el contorno de Elena se dibuje píxel a
  píxel (1x1) con la cantidad exacta de símbolos "O" de
  `ELENA_FRONT_PIXELS`, como prueba de que el renderer geométrico antiguo
  ya no se usa para ella.
- Corolaria Character Pixel-Art -- aplica a la Alcaldesa Corolaria (NPC
  `mayor-corolaria` en `axiom-plaza`) el mismo lenguaje visual ya aprobado
  para Gonzalo y Elena. Migra `WorldScene.renderCorolaria()` del render
  geométrico anterior a tres sprites indexados nuevos --
  `COROLARIA_FRONT_PIXELS`, `COROLARIA_BACK_PIXELS` y
  `COROLARIA_SIDE_PIXELS` (`src/content/corolariaPixelArt.js`, 14x22,
  misma escala que Gonzalo y Elena) -- rasterizados y cacheados por un
  nuevo `src/render/CorolariaRenderer.js` (mismo patrón exacto que
  `ElenaRenderer.js`/`GonzaloRenderer.js`: cache local propia,
  `renderCorolaria(context, x, y, facing)`, "left" reutiliza el sprite de
  "side" reflejado en tiempo de dibujo). Mismo criterio de ojos ya
  aprobado (2 de frente, 1 en lateral, ninguno de espalda) y, aplicando
  desde el primer diseño la lección de las microiteraciones de Gonzalo,
  la cabeza de BACK es pelo puro salvo una única fila de nuca/cuello que
  conserva piel incluso de espaldas. Identidad propia de Corolaria,
  deliberadamente distinta de Elena pese a compartir escala/técnica/
  outline/criterio de ojos: peinado recogido sin mechones largos cayendo
  por los laterales del torso, y parte inferior recta de ancho constante
  desde los hombros hasta el bajo (sin la silueta de falda que se
  ensancha de Elena), con acento dorado en tres puntos estructurales
  (hombros, cinturón, bajo) para reforzar la lectura de autoridad formal.
  Preserva los cinco colores ya aprobados de `MAYOR_PALETTE`
  (`characterPalettes.js`) -- burdeos, dorado y la piel compartida con
  Gonzalo/Elena (`SKIN_TONE`) -- con cinco tonos derivados propios para
  volumen y sombreado. `gonzaloPixelArt.js`, `GonzaloRenderer.js`,
  `elenaPixelArt.js` y `ElenaRenderer.js` no se tocan en absoluto.
  Cambio puramente visual: hitbox, radio de interacción, colisión,
  diálogos, flags, `GameState`, save y audio quedan intactos; el Padre de
  la novia, Silogio y Max no se tocan. Nuevos tests:
  `tests/content/CorolariaPixelArt.test.js` y
  `tests/render/CorolariaRenderer.test.js` (mismo patrón que los de
  Gonzalo/Elena, más pruebas específicas de la identidad propia de
  Corolaria: ausencia de pelo por debajo de la cabeza, base tan ancha
  como los hombros, y acento dorado presente en varias filas
  estructurales). Los dos tests de `WorldScene.test.js` que asumían el
  render geométrico anterior de `mayor-corolaria` se reescriben para
  comparar contra los datos reales del nuevo sprite, mismo patrón que se
  usó para Elena. Requiere aprobación visual humana del acabado final
  (`HUMAN CHARACTER STYLE APPROVAL REQUIRED`).
- Bride Father Character Pixel-Art -- aplica al Padre de la novia (NPC
  `bride-father` en `axiom-plaza`) el mismo lenguaje visual ya aprobado
  para Gonzalo, Elena y Corolaria. Migra `WorldScene.renderBrideFather()`
  del render geométrico anterior a tres sprites indexados nuevos --
  `BRIDE_FATHER_FRONT_PIXELS`, `BRIDE_FATHER_BACK_PIXELS` y
  `BRIDE_FATHER_SIDE_PIXELS` (`src/content/brideFatherPixelArt.js`, 14x22,
  misma escala que Gonzalo/Elena/Corolaria -- el bounding box geométrico
  anterior ya era 14x22, así que no cambia) -- rasterizados y cacheados
  por un nuevo `src/render/BrideFatherRenderer.js` (mismo patrón exacto
  que `CorolariaRenderer.js`/`ElenaRenderer.js`/`GonzaloRenderer.js`:
  cache local propia, `renderBrideFather(context, x, y, facing)`, "left"
  reutiliza el sprite de "side" reflejado en tiempo de dibujo). Mismo
  criterio de ojos ya aprobado (2 de frente, 1 en lateral, ninguno de
  espalda) y, aplicando desde el primer diseño la lección de las
  microiteraciones de Gonzalo, la cabeza de BACK es pelo/canas puro salvo
  una única fila de nuca/cuello que conserva piel incluso de espaldas.
  Identidad propia del Padre, deliberadamente distinta de Gonzalo pese a
  compartir escala/técnica/outline/criterio de ojos: pelo canoso en dos
  tonos de gris (en vez del pelo castaño de Gonzalo) con canas visibles
  en las sienes, y sobre todo un torso mucho más ancho -- ocupa las 14
  columnas completas del sprite sin margen transparente a los lados,
  frente a las 12 columnas del torso de Gonzalo/Corolaria -- que se
  estrecha de forma marcada hacia dos piernas separadas por un hueco
  central visible, leyéndose como una presencia adulta más sólida y
  madura. Preserva los cinco colores ya aprobados de
  `BRIDE_FATHER_PALETTE` (`characterPalettes.js`) -- azul, crema y la
  piel compartida con Gonzalo/Elena/Corolaria (`SKIN_TONE`) -- con cinco
  tonos derivados propios para volumen y sombreado.
  `gonzaloPixelArt.js`, `GonzaloRenderer.js`, `elenaPixelArt.js`,
  `ElenaRenderer.js`, `corolariaPixelArt.js` y `CorolariaRenderer.js` no
  se tocan en absoluto. Cambio puramente visual: hitbox, radio de
  interacción, colisión, diálogos, flags, `brideNoteReceived`,
  `GameState`, save y audio quedan intactos; Silogio y Max no se tocan.
  Nuevos tests: `tests/content/BrideFatherPixelArt.test.js` y
  `tests/render/BrideFatherRenderer.test.js` (mismo patrón que los de
  Gonzalo/Elena/Corolaria, más pruebas específicas de la identidad propia
  del Padre: torso más ancho que la cabeza y que las piernas, torso a
  ancho completo del sprite frente al de Gonzalo, piernas separadas por
  un hueco central, y presencia de azul/crema). Los tests de
  `WorldScene.test.js` que asumían el render geométrico anterior de
  `bride-father` se reescriben para comparar contra los datos reales del
  nuevo sprite, mismo patrón que se usó para Elena/Corolaria -- ajuste
  incluido en el propio test equivalente de Corolaria, que filtraba por
  color e Y sin acotar por X: al compartir el Padre algunos tonos de piel
  y calzado con Corolaria y ambos NPC estar a la misma altura en
  `axiom-plaza`, el filtro podía capturar píxeles ajenos en la misma fila
  absoluta de pantalla; ahora ambos tests acotan también por el rango de
  X propio de cada personaje. Requiere aprobación visual humana del
  acabado final (`HUMAN CHARACTER STYLE APPROVAL REQUIRED`).
- Silogio Character Pixel-Art -- aplica a Silogio (NPC `library-silogio`
  en la Biblioteca) el mismo lenguaje visual ya aprobado para Gonzalo,
  Elena, Corolaria y el Padre de la novia. Migra
  `WorldScene.renderSilogio()` del render geométrico anterior a tres
  sprites indexados nuevos -- `SILOGIO_FRONT_PIXELS`,
  `SILOGIO_BACK_PIXELS` y `SILOGIO_SIDE_PIXELS`
  (`src/content/silogioPixelArt.js`, 14x22, misma escala que los cuatro
  personajes anteriores) -- rasterizados y cacheados por un nuevo
  `src/render/SilogioRenderer.js` (mismo patrón exacto que
  `BrideFatherRenderer.js`/`CorolariaRenderer.js`/`ElenaRenderer.js`/
  `GonzaloRenderer.js`: cache local propia,
  `renderSilogio(context, x, y, facing)`, "left" reutiliza el sprite de
  "side" reflejado en tiempo de dibujo). Mismo criterio de ojos ya
  aprobado (2 de frente, 1 en lateral, ninguno de espalda) y, aplicando
  desde el primer diseño la lección de las microiteraciones de Gonzalo,
  la cabeza de BACK es pelo puro salvo una única fila de nuca/cuello que
  conserva piel incluso de espaldas. Añade gafas simples como parte de su
  identidad ya aprobada (dos clústeres del color de contorno con un hueco
  de piel central a modo de puente, en la fila justo encima de los ojos;
  no aparecen en BACK, al no ser visibles de espaldas), que no existían
  en el render geométrico anterior. Identidad propia de Silogio,
  deliberadamente distinta de los cuatro personajes anteriores: pelo gris
  en dos tonos mezclados de forma asimétrica en la coronilla ("algo
  desordenado"), y sobre todo la silueta más estrecha y vertical de los
  cinco personajes migrados -- el abrigo/túnica nunca ensancha más allá
  del ancho de la cabeza en ninguna fila, hombros y dobladillo incluidos
  (a diferencia de Gonzalo/Corolaria/Padre, que siempre tienen hombros o
  torso más anchos que la cabeza en algún tramo), y más estrecho que la
  base recta constante de Corolaria (10 columnas frente a 12). Preserva
  los cinco colores ya aprobados de `SILOGIO_PALETTE`
  (`characterPalettes.js`) -- teal, mostaza y la piel compartida con los
  cuatro personajes anteriores (`SKIN_TONE`) -- con cinco tonos derivados
  propios para volumen y sombreado. `gonzaloPixelArt.js`,
  `GonzaloRenderer.js`, `elenaPixelArt.js`, `ElenaRenderer.js`,
  `corolariaPixelArt.js`, `CorolariaRenderer.js`,
  `brideFatherPixelArt.js` y `BrideFatherRenderer.js` no se tocan en
  absoluto. Cambio puramente visual: hitbox, radio de interacción,
  colisión, flujo hacia el puzle del catálogo, `GameState`, save y audio
  quedan intactos; Max no se toca. Nuevos tests:
  `tests/content/SilogioPixelArt.test.js` y
  `tests/render/SilogioRenderer.test.js` (mismo patrón que los de los
  cuatro personajes anteriores, más pruebas específicas de la identidad
  propia de Silogio: gafas presentes y acotadas sin dominar la cabeza,
  ausentes en BACK, abrigo nunca más ancho que la cabeza en ninguna fila
  del torso o el dobladillo, y notablemente más estrecho que el torso de
  Gonzalo en toda su longitud). Los tests de
  `WorldScene.test.js` que asumían el render geométrico anterior de
  `library-silogio` se reescriben para comparar contra los datos reales
  del nuevo sprite, mismo patrón que se usó para Elena/Corolaria/Padre;
  de paso se elimina `assertDedicatedNpcRender()`, el último helper de
  test que comparaba primitivas `fillRect` geométricas exactas para NPC
  dedicados, ya sin ningún consumidor tras esta migración (Corolaria,
  el Padre y ahora Silogio migraron los tres a render indexado). Requiere
  aprobación visual humana del acabado final
  (`HUMAN CHARACTER STYLE APPROVAL REQUIRED`).
- Max Character Pixel-Art -- aplica a Max (perro, pastor belga malinois,
  compañero de seguimiento en `MaxCompanion.js`) el mismo NIVEL DE
  CALIDAD ya aprobado para los cinco personajes humanos (Gonzalo, Elena,
  Corolaria, el Padre de la novia y Silogio), sin copiar su arquitectura
  visual: Max es un cuadrúpedo con una única pose fija (lateral, cabeza
  a la izquierda), no un bípedo con variantes de facing -- ni
  `MaxCompanion.render()` ni `CreditsScene.js` piden nunca una
  orientación distinta, así que `renderMax(context, x, y)` conserva
  exactamente la misma firma que el render geométrico anterior y ninguno
  de los dos consumidores necesitó ningún cambio. Migra `MaxRenderer.js`
  del render geométrico anterior a un único sprite indexado nuevo,
  `MAX_SIDE_PIXELS` (`src/content/maxPixelArt.js`, 22x18, mismo bounding
  box que antes -- `MAX_DIMENSIONS` no cambia), rasterizado y cacheado
  con el mismo patrón que los renderers humanos (cache local propia,
  `drawImage` estable, `imageSmoothingEnabled = false`). Mejora
  sustancialmente la cabeza (hocico, máscara facial oscura alrededor de
  ojo y nariz sin cubrir todo el cráneo, dos orejas erguidas y separadas
  por un hueco real), el cuerpo (lomo con highlight, vientre con sombra,
  silueta más compacta y atlética en vez del bloque alargado del primer
  intento de esta misma migración), las cuatro patas (delanteras y
  traseras, con sombra de almohadilla) y la cola (levantada, con raíz,
  curva y punta diferenciadas del cuerpo). Un solo ojo simple (criterio
  de vista lateral ya aprobado para los personajes humanos), sin
  sistema facial, sin collar (el campo `MAX_PALETTE.collar` de
  `characterPalettes.js` sigue sin pintarse, igual que en el render
  geométrico anterior). Paleta nueva `MAX_PIXEL_PALETTE`
  (`src/content/maxPixelArt.js`, nombrada así para no colisionar con
  `MAX_PALETTE` ya existente) deliberadamente más compacta que la de los
  personajes humanos (7 colores, no 10) -- preserva exactamente los dos
  colores ya aprobados que sí se usaban (`MAX_PALETTE.mask`/`.body`) más
  cinco tonos derivados nuevos. `gonzaloPixelArt.js`,
  `GonzaloRenderer.js`, `elenaPixelArt.js`, `ElenaRenderer.js`,
  `corolariaPixelArt.js`, `CorolariaRenderer.js`,
  `brideFatherPixelArt.js`, `BrideFatherRenderer.js`,
  `silogioPixelArt.js`, `SilogioRenderer.js`, `Player.js` y
  `MaxCompanion.js` no se tocan en absoluto -- cambio puramente visual:
  follow, catch-up, spawn/recolocación, reacción/bounce, transiciones de
  mapa, presencia en el epílogo, `GameState` y save quedan intactos.
  Nuevos tests: `tests/content/MaxPixelArt.test.js` (dimensiones, filas,
  símbolos, cobertura de paleta, ojo/nariz en su posición exacta,
  máscara presente sin dominar la cabeza, dos orejas separadas por un
  hueco transparente real, cola que sobresale del torso, cuatro patas en
  dos grupos separados cerca del suelo, conectividad completa de la
  silueta sin piezas flotantes, ausencia de collar) y
  `tests/render/MaxRenderer.test.js`, reescrito por completo (cache,
  reutilización entre frames, desplazamiento correcto con el origen
  `(x, y)`, y la comprobación ya existente de que ningún mapa incluye
  todavía a Max como objeto jugable). `tests/scenes/CreditsScene.test.js`
  se actualiza para anclar la verificación de Max a un píxel concreto de
  la nariz en vez de a un rect grande de posición fija, mismo patrón que
  los personajes humanos. Una microiteración visual posterior, tras la
  revisión humana ("cuerpo aprobado provisionalmente, cabeza no: no se
  lee suficientemente como Belgian Malinois"), rediseña únicamente la
  cabeza (filas 0-7 de `MAX_SIDE_PIXELS`): el hocico y el cráneo medían
  exactamente el mismo ancho (4 columnas cada uno, solapados entre sí),
  así que no existía ninguna transición real entre ambos pese al
  comentario que afirmaba lo contrario. El hocico pasa a ocupar 3
  columnas propias, sin solapar las 4 columnas del cráneo, dándole una
  proporción más fina y una transición de ancho visible en la unión --
  el resto de la identidad de la cabeza (dos orejas separadas por un
  hueco real, máscara facial continua sin cubrir todo el cráneo, un
  único ojo, ausencia de collar) se conserva. El ojo se reposiciona a la
  unión cráneo/hocico del nuevo diseño (antes fila 6 columna 5, ahora
  fila 5 columna 3); la nariz no cambia de posición. Las filas 8-17
  (torso, highlight de lomo, vientre, patas, almohadillas, cola)
  permanecen byte a byte idénticas -- no se tocan en esta
  microiteración, tal como pedía la revisión humana. Tests actualizados
  en consecuencia (posición del ojo; el test de separación de orejas se
  corrige de paso, ya que su umbral original de conteo de transiciones
  era demasiado estricto para un tramo que toca el borde del sprite,
  aunque el hueco real sí existía -- se sustituye por un conteo directo
  de segmentos rellenos). Tras esa microiteración, una segunda revisión
  humana la rechaza igualmente ("Max ha perdido claramente la esencia
  visual de un Belgian Malinois... el problema ya no está limitado a la
  cabeza... silueta de cánido genérico y en algunos ángulos incluso
  recuerda a caballo/ciervo"), con la instrucción explícita de no seguir
  ajustando solo la cabeza. Se rediseñan entonces las 18 filas completas
  de `MAX_SIDE_PIXELS`. Cambio de proporción principal, identificado como
  la causa estructural de la lectura equina: la cabeza pasa de ocupar 8
  de las 18 filas (44%) a solo 5 (filas 0-4, 28%), y las patas pasan de
  6-7 filas a 8 (filas 10-17, 44%) -- cabeza compacta y patas largas en
  vez de cabeza grande y patas cortas. Cráneo en cuña (más ancho junto a
  las orejas que junto al hocico) con hocico claramente más estrecho,
  máscara facial continua sobre hocico/nariz/ojo sin cubrir coronilla ni
  mejilla posterior, dos orejas triangulares separadas por un hueco
  transparente real; cuello corto integrado con un pecho alto y
  redondeado; lomo con highlight y vientre recogido con sombra, en vez
  del bloque rectangular del intento anterior; grupa donde nace la cola;
  cuatro patas largas y claramente separadas entre sí, cada una con una
  ruptura de tono a media altura sugiriendo una articulación; cola con
  grosor decreciente, curva natural y punta ligeramente elevada (no
  vertical). Sigue sin haber collar. Paleta (`MAX_PIXEL_PALETTE`,
  7 colores) y dimensiones (`MAX_DIMENSIONS`, 22x18) no cambian.
  `MaxRenderer.js`, `MaxCompanion.js`, `WorldScene.js` y los archivos de
  los cinco personajes humanos no se tocan -- cambio puramente visual
  sobre `src/content/maxPixelArt.js`. Tests actualizados en
  `tests/content/MaxPixelArt.test.js` (nueva posición de ojo y nariz;
  hocico más estrecho que el cráneo, medido por ancho de fila en vez de
  columnas fijas; torso no degenerado, con variación de ancho entre
  filas y sombra de vientre presente; patas con dos tonos por
  articulación) y en el test de anclaje de
  `tests/scenes/CreditsScene.test.js` (nueva posición de la nariz).
  Evidencia visual (sprite aislado, cabeza y cuerpo con zoom alto, junto
  a Gonzalo, y en la Plaza del Axioma en juego) confirma una silueta
  notablemente más atlética que las dos versiones anteriores -- pecho y
  hombro visibles, vientre recogido, cuatro patas diferenciadas, orejas
  triangulares separadas -- aunque, como en la ronda anterior, sigue
  requiriendo aprobación visual humana explícita del acabado final
  (`HUMAN CHARACTER STYLE APPROVAL REQUIRED`): esta ronda no declara
  aprobación artística por sí misma. Tercera revisión humana: rechazada
  de nuevo, esta vez por "camello" -- patas demasiado largas, cuerpo
  demasiado alto sobre las patas, cabeza demasiado pequeña para el
  conjunto. Un primer intento de corrección (cabeza de 5 a 7 filas y más
  ancha, torso con una fila extra de pecho, patas de 8 a 5 filas) cumplía
  los tres ajustes pedidos por separado, pero la revisión independiente
  del agente `qa` señaló que el conjunto seguía leyéndose como camello:
  la cabeza se elevaba 7 filas por encima de la línea del lomo, sobre un
  lomo de 11 filas hasta el suelo -- un 64% de la altura del propio
  lomo, el patrón exacto de "dos extremos alzados sobre un lomo plano"
  que define a un camélido, con independencia del tamaño de cabeza y
  patas por separado. Se corrige comprimiendo el cráneo de 2 filas a 1
  (sin tocar el resto de la cabeza) y cediendo esa fila al torso: la
  cabeza final ocupa 6 filas (filas 0-5, span de hasta 11 columnas y 52
  píxeles de relleno en cols 0-10, frente a 39 en la versión rechazada
  por "cabeza pequeña"); el torso pasa a 7 filas (filas 6-12, tres filas
  de pecho sólido); las patas se mantienen en 5 filas (filas 13-17). La
  elevación de la cabeza sobre el lomo baja a 6 filas sobre un lomo de
  12 -- 50%, frente al 64% del intento anterior. Ojo en fila 2 columna 4;
  nariz en fila 5 columna 0. La cola se mantiene corta: su píxel de
  contorno más alto queda en la fila 2 (columna 20) y la punta clara en
  la fila 3, sin alcanzar las filas 0-1 donde están las orejas. Solo se
  modifica `src/content/maxPixelArt.js`; `MaxRenderer.js`,
  `MaxCompanion.js`, `WorldScene.js`, `characterPalettes.js` y los cinco
  personajes humanos no se tocan. La revisión independiente del agente
  `reviewer` sobre el primer intento encontró varias imprecisiones
  cuantitativas en el comentario de cabecera y el CHANGELOG (una fila
  citada incorrectamente para la franja de contorno recoloreada, una
  posición previa de la nariz que no coincidía con los datos reales de
  `e63dc1f`, una justificación de diseño sobre la columna de
  mejilla/nuca que no se sostenía al verificar la conectividad sin ella,
  y la altura de la cola descrita de forma inexacta) -- se corrigen
  todas en esta versión final, verificando cada cifra directamente
  contra `MAX_SIDE_PIXELS` antes de escribirla. Tests actualizados en
  `tests/content/MaxPixelArt.test.js` (nueva posición de ojo/nariz;
  rangos de fila de cabeza/torso/patas recalculados; la comparación de
  ancho cabeza-vs-torso se restringe a columnas 4-21 en el torso para no
  incluir un resto de contorno del hocico que la inflaba trivialmente,
  hallazgo también de `reviewer`; dos comparaciones contra un snapshot
  literal de la versión rechazada por "cabeza pequeña" -- más píxeles de
  superficie, menos filas de pata -- en vez de límites arbitrarios) y en
  el test de anclaje de `tests/scenes/CreditsScene.test.js` (nueva
  posición de la nariz). Evidencia visual generada y revisada en cada
  iteración (aislado y junto a Gonzalo, comparada paso a paso contra la
  iteración anterior) confirma que la brecha visual entre cabeza y lomo
  se reduce notablemente frente al intento anterior. Una segunda revisión
  de `reviewer` sobre esta corrección encontró dos imprecisiones más en
  el mismo comentario/CHANGELOG (el ojo se describía como reposicionado
  desde la fila 3 cuando en realidad nunca se movió respecto a
  `e63dc1f` -- siempre estuvo en fila 2 columna 4 -- y el torso se
  describía con dos filas de pecho sólido cuando los datos reales tienen
  tres filas idénticas consecutivas); corregidas ambas. El propio
  `reviewer` señaló, como observación de diseño no bloqueante, que esas
  tres filas idénticas reintroducen parcialmente el "bloque rectangular"
  que la ronda anterior decía evitar mediante variación de tono. En la
  misma línea, el agente `qa` -- tras confirmar que el defecto técnico
  concreto de esta ronda (la columna de mejilla/nuca leída como cuello
  vertical) queda resuelto -- reporta que la silueta general, evaluada
  de forma aislada, sigue sin leerse de forma inequívoca como Belgian
  Malinois: ahora se acerca más a una lectura de llama/alpaca que de
  camello, por la combinación de cabeza todavía perceptiblemente elevada
  sobre el lomo, orejas pequeñas en proporción al conjunto, y el lomo de
  techo plano ya mencionado. Estas son observaciones de diseño/estilo,
  no defectos técnicos -- se documentan aquí en vez de seguir iterando
  el pixel-art dentro de esta misma ronda, tal como pide la propia tarea
  ("no declarar aprobación artística"; la decisión de si esta lectura es
  aceptable, o si necesita otra ronda centrada en orejas/lomo/elevación
  de cabeza, corresponde a la revisión visual humana). No se declara
  aprobación artística: sigue pendiente revisión visual humana explícita
  (`HUMAN CHARACTER STYLE APPROVAL REQUIRED`). Cuarta revisión humana:
  rechazada de nuevo, esta vez centrada exclusivamente en la cabeza --
  "el cuerpo está muy bien, la cabeza sigue siendo fea": hace falta más
  masa, más separación visual entre hocico y orejas, y un giro deliberado
  hacia un estilo cartoon en vez de anatómico-realista. Esta ronda toca
  solo `src/content/maxPixelArt.js` y solo la cabeza; el torso pierde
  una única fila de pecho sólido (de tres filas idénticas a dos -- la
  propia observación de `reviewer` en la ronda anterior) para cedérsela
  a la cabeza, y las patas quedan byte a byte idénticas a la versión
  anterior (nueva prueba de regresión así lo protege). Cabeza: de 6 a 7
  filas (filas 0-6), con 60 píxeles de relleno en cols 0-10 (frente a 52
  antes de esta ronda, y frente a 39 en la versión rechazada por "cabeza
  pequeña" dos rondas atrás). El hueco entre orejas pasa a proteger dos
  filas en vez de una (fila 0 Y fila 1), dejando una fila completa de
  "solo orejas" antes de que empiece cualquier masa de cráneo -- ese aire
  es la separación hocico/orejas pedida explícitamente. Un primer intento
  de esto (proteger solo la fila 0, dejando que el propio paso de
  contorno rellenara la fila 1 de un lado a otro) produjo un defecto real
  detectado antes de commitear: las dos orejas quedaban unidas por una
  franja horizontal oscura que se leía como una rama o un cuerno único en
  vez de dos orejas separadas -- corregido protegiendo explícitamente el
  hueco en ambas filas. El cráneo gana una fila de highlight ancho (parche
  claro en 4 columnas) antes de que el hocico se desprenda de él, dando
  sensación de frente/coronilla redondeada. Ojo en fila 4 columna 4 (antes
  fila 2 columna 4); nariz en fila 6 columna 0 (antes fila 5 columna 0).
  `MaxRenderer.js`, `MaxCompanion.js`, `WorldScene.js`,
  `characterPalettes.js` y los cinco personajes humanos no se tocan.
  Tests actualizados en `tests/content/MaxPixelArt.test.js` (nueva
  posición de ojo/nariz; rangos de fila de cabeza/torso recalculados,
  patas sin cambiar; nueva comparación de superficie de cabeza contra un
  snapshot literal de la versión inmediatamente anterior, además de la ya
  existente contra la versión de "cabeza pequeña"; nuevo test que protege
  la fila de aire hocico/orejas verificando que existe al menos una fila,
  aparte de la de las puntas, con tejido de oreja pero sin tejido de
  cráneo -- `reviewer` encontró que la primera versión de este test
  incluía la fila de las puntas en la búsqueda, por lo que pasaba igual
  de bien contra la cabeza rechazada de `444ee1f` sin verificar realmente
  el colchón nuevo; corregido excluyendo esa fila; nuevo test de igualdad
  byte a byte de las patas contra la versión anterior) y en el test de
  anclaje de `tests/scenes/CreditsScene.test.js` (nueva posición de la
  nariz). Evidencia visual generada a varias escalas de zoom (incluida
  una captura de solo las orejas a 80px/celda) para verificar con
  precisión, tras el defecto detectado y corregido, que las dos orejas se
  leen realmente como separadas y no como un apéndice único. El agente
  `qa` confirma visualmente más masa, mejor segmentación oreja/cráneo/
  hocico, ausencia del defecto de orejas unidas, y cuerpo esencialmente
  igual a `444ee1f`; señala como observación no bloqueante -- ya presente
  en `444ee1f`, no introducida por esta ronda -- que el color de la oreja
  cercana ("k") tiene poco contraste contra el contorno ("O"), leyéndose
  casi como un bloque negro sin volumen propio, y que el resultado global
  sigue pareciendo más "anatómico miniaturizado" que un giro deliberado
  de estilo cartoon, aunque masa y separación sí mejoran de forma medible
  y visible. No se declara aprobación artística: sigue pendiente revisión
  visual humana explícita (`HUMAN CHARACTER STYLE APPROVAL REQUIRED`).
  Quinta revisión humana: "se acerca, pero todavía no". El cuerpo queda
  aceptado ("suficientemente bien") -- esta ronda se acota estrictamente
  a las filas 0-6 (cabeza); las filas 7-17 (torso, pecho, abdomen, patas,
  cola) son byte a byte idénticas a `84fe78d`, protegido ahora con un
  test dedicado además del ya existente solo para patas. Los problemas
  señalados: oreja cercana leída como "apéndice rígido" por bajo
  contraste contra el contorno, coronilla plana (antes un rectángulo
  uniforme de 5 columnas), poco volumen craneal, orejas más parecidas a
  cuernos que a triángulos de perro. Oreja cercana: cambia de relleno
  "k" (máscara oscura, casi indistinguible del contorno "O") a "h" (tan
  claro, ya usado como highlight de lomo/frente) -- un salto grande de
  contraste (no el máximo absoluto de la paleta: "m" tiene más, pero
  queda reservado a la punta de la cola); nuevo test compara luminosidad
  relativa y confirma que el contraste actual contra el contorno es muy
  superior al del tono anterior. Base ensanchada de 3 a 4 columnas.
  Oreja lejana: se desplaza una fila hacia abajo respecto a la cercana
  (antes ambas puntas compartían la fila 0), dando una pista de
  profundidad; su tono
  "d" pasa a usarse por primera vez de forma consistente con lo que la
  paleta ya documentaba ("sombra de orejas... traseras"). Coronilla: el
  antiguo rectángulo plano de 5 columnas se sustituye por un bulto
  estrecho de 3 columnas que se ensancha hacia la masa craneal principal
  (9 columnas) en la fila siguiente -- ese estrechamiento hacia arriba
  produce una silueta más redondeada en vez de la meseta horizontal.
  Ojo, nariz, máscara, hocico y transición cráneo-hocico: sin cambios de
  posición ni de forma. Superficie de cabeza prácticamente igual (59
  píxeles frente a 60 antes) -- esta ronda no perseguía más masa total,
  sino mejor contraste/lectura de las orejas y una coronilla menos
  plana. `MaxRenderer.js`, `MaxCompanion.js`, `WorldScene.js`,
  `characterPalettes.js` y los cinco personajes humanos no se tocan.
  Tests actualizados en `tests/content/MaxPixelArt.test.js` (tono de la
  oreja cercana "k"→"h" en el test de distinción tonal; nuevo test de
  contraste de luminosidad; la señal de "tejido de cráneo" del test de
  separación hocico/orejas pasa de "b/h" a solo "b", porque "h" ahora
  también es un tono de oreja y comprobarlo daba un falso negativo en la
  propia fila de la oreja cercana; nuevo test byte a byte que cubre todo
  el cuerpo, filas 7-17, contra `84fe78d`, además del ya existente solo
  para patas). No hace falta tocar `tests/scenes/CreditsScene.test.js`
  -- ojo y nariz no cambian de posición esta ronda. No se declara
  aprobación artística: sigue pendiente revisión visual humana explícita
  (`HUMAN CHARACTER STYLE APPROVAL REQUIRED`). Sexta revisión humana:
  adjunta una mockup visual de referencia (cabeza grande y redondeada,
  máscara amplia cubriendo hocico y zona del ojo, orejas triangulares
  prominentes, lectura cartoon) y pide converger con ella en vez de
  seguir defendiendo el diseño de la ronda anterior. Ronda acotada de
  nuevo a las filas 0-6; las filas 7-17 quedan, otra vez, byte a byte
  idénticas a `3353f43` (que a su vez ya eran idénticas a `84fe78d`),
  protegido por el test de cuerpo completo existente.
  Dos magnitudes de ancho distintas, que no deben confundirse (un
  intento anterior de esta misma entrada sí las confundió, señalado por
  `reviewer`): (A) el ancho físico real del sprite -- desde la columna 0
  hasta la última columna con algún píxel de cabeza -- pasa de 12
  columnas en la versión anterior (cols 0-11: el contorno de la base de
  la oreja lejana de esa versión ya llegaba a la columna 11, no a la
  10) a 14 columnas en esta versión (cols 0-13). (B) las ventanas fijas
  de conteo que usan los tests de regresión, que no representan ese
  ancho físico: cols 0-10 (61 píxeles de relleno, frente a 59 en la
  versión anterior en la misma ventana) y cols 0-12 (71 píxeles),
  ambas ventanas ya usadas en rondas previas para comparar contra
  versiones más antiguas y estrechas.
  La máscara pasa de una franja de 3-4 columnas bajo el hocico a cubrir
  hasta 7 columnas en la fila 4, incluyendo la zona del ojo -- ahora
  marca con claridad dónde termina el cráneo (tan) y empieza el hocico
  (máscara), en vez de una transición de un solo píxel. El ojo se
  desplaza a fila 4 columna 3 (antes columna 4), quedando embebido en la
  máscara en vez de en su borde. Coronilla y cráneo se comprimen de dos
  filas (bulto estrecho + masa ancha) a una sola fila de masa craneal
  ancha, cediendo la fila liberada a las orejas. Nariz sin cambios de
  posición.
  Orejas: un primer intento de esta ronda se limitó a recolocar el
  mecanismo de tono y desfase de profundidad de la ronda anterior sin
  cambiar su forma -- la revisión de `qa` sobre ese intento encontró que
  el salto de solo dos niveles de ancho (punta de 1 columna directamente
  a una base de 4-5) trazaba, una vez con contorno, una cruz o una T, no
  un triángulo, precisamente el rasgo más explícito que pedía la mockup.
  Se rediseñan por completo con tres niveles de ancho estrictamente
  crecientes por oreja (punta de 1 columna, tramo medio de 3, base de 5,
  cada uno centrado sobre el anterior), lo que sí traza un contorno
  triangular reconocible; se pierde a cambio el desfase de una fila
  entre oreja cercana y lejana de la ronda anterior (ambas puntas
  vuelven a compartir la fila 0) -- no había presupuesto de filas para
  mantener el desfase y el triángulo de tres niveles a la vez sin invadir
  la fila de la máscara. Mismo tono por oreja que siempre ("h" cercana,
  "d" lejana).
  Deliberadamente NO se añade un reflejo blanco al ojo pese a que la
  mockup lo muestra -- los cinco personajes humanos y todas las rondas
  previas de Max usan un único píxel de contorno oscuro como ojo, sin
  excepción; se documenta esta decisión en el comentario de cabecera de
  `maxPixelArt.js` en vez de romper esa convención compartida por un
  detalle que la tarea no exige de forma explícita. `MaxRenderer.js`,
  `MaxCompanion.js`, `WorldScene.js`, `characterPalettes.js`,
  `tests/scenes/CreditsScene.test.js` y los cinco personajes humanos no
  se tocan -- ojo y nariz cambian de columna pero no de fila, y la nariz
  (usada para el anclaje del test de créditos) no cambia en absoluto.
  Tests actualizados en `tests/content/MaxPixelArt.test.js` (posición
  del ojo; ventanas de columna ensanchadas de 10-11 a 12-13 en los tests
  de ancho de cabeza y separación de orejas, para no cortar la punta de
  la oreja lejana; nueva comparación de superficie de cabeza contra un
  snapshot literal de la versión inmediatamente anterior, además de las
  dos ya existentes; nuevo test que protege directamente la forma
  triangular -- exige tres niveles de ancho estrictamente crecientes por
  oreja en sus primeras tres filas, en vez de solo comprobar que existe
  algún hueco entre ellas, que no habría detectado el defecto de
  cruz/T). Evidencia visual generada a varias escalas (cabeza aislada a
  80px/celda, cuerpo completo, junto a Gonzalo), revisada tras el
  hallazgo de `qa` y otra vez tras el rediseño de las orejas, confirma
  que el defecto puntual de cruz/T queda resuelto: ambas orejas trazan
  ahora una progresión estrictamente creciente de ancho (verificada por
  `qa` de forma independiente, midiendo `[2, 4, 6]` en ambas). Pero la
  revisión visual de `qa` sobre el resultado final, con la cabeza
  ensanchada a 14 columnas, señala un problema distinto y no resuelto:
  las dos orejas quedan muy separadas horizontalmente, unidas por una
  franja horizontal plana (el highlight de la fila 3, de cráneo a
  cráneo) que, junto con el hocico alargado, se lee más como un cuello
  con una protuberancia en cada extremo que como una cabeza compacta y
  redonda con las orejas juntas -- a juicio de `qa`, sigue evocando un
  perfil de llama/alpaca/ciervo más que el de un pastor belga, aunque ya
  no por el defecto de cruz/T original. Esta observación se documenta
  aquí, sin abrir una octava ronda de rediseño dentro de esta misma
  tarea (que estaba acotada a corregir la imprecisión de ancho físico
  encontrada por `reviewer` y el defecto de forma de orejas encontrado
  por `qa` en su primera pasada, ambos ya resueltos y confirmados) --
  queda como información explícita para la revisión visual humana, que
  puede pedir una ronda adicional centrada en acercar las dos orejas o
  romper la franja horizontal del cráneo si lo considera necesario. No
  se declara aprobación artística: sigue pendiente revisión visual
  humana explícita (`HUMAN CHARACTER STYLE APPROVAL REQUIRED`). Séptima
  revisión humana: confirma exactamente el hallazgo que `qa` ya había
  señalado (orejas demasiado separadas, cráneo plano entre ellas) y
  pide la ronda adicional que el CHANGELOG anterior dejaba prevista.
  Ronda acotada de nuevo a las filas 0-6; las filas 7-17 siguen siendo,
  byte a byte, las mismas de la versión anterior. Revierte el
  ensanchamiento de la ronda anterior en vez de partir de él: el ancho
  físico real baja de 14 columnas (cols 0-13) a 11 columnas (cols 0-10)
  -- más compacto incluso que la versión de dos rondas atrás (12
  columnas). Las orejas se acercan de 7 columnas de separación entre
  puntas (columnas 3 y 10) a 4 columnas (columnas 3 y 7), manteniendo el
  mismo taper triangular de tres niveles de la ronda anterior -- solo
  recolocado, no rediseñado, para no reabrir el defecto de cruz/T ya
  resuelto. El hueco real entre orejas se estrecha de 2-6 columnas
  (según la fila) a 1-3 columnas, siempre transparente en las tres
  filas. El cráneo (fila 3) se estrecha de 11 a 9 columnas de relleno, y
  el highlight deja de ser una franja plana de 7 columnas para ser un
  parche centrado de 3 columnas. Máscara y hocico mantienen la misma
  forma relativa, con las columnas de mejilla trasera recortadas (de
  5/3/3 a 3/2/2 en las filas 4-6) para no sobresalir de la cabeza ya más
  estrecha. Ojo (fila 4, columna 3) y nariz (fila 6, columna 0): sin
  cambios de posición. Superficie de relleno en la ventana histórica
  cols 0-10: 60 píxeles (frente a 61 en la versión anterior -- una
  reducción pequeña y esperada, ya que esta ronda persigue compacidad,
  no más masa total; sigue por encima de las tres versiones previas a
  la mockup: 59, 52 y 39). `MaxRenderer.js`, `MaxCompanion.js`,
  `WorldScene.js`, `characterPalettes.js`, `tests/scenes/CreditsScene.test.js`
  y los cinco personajes humanos no se tocan. Tests actualizados en
  `tests/content/MaxPixelArt.test.js`: las ventanas de columna del test
  de forma triangular se ajustan de la separación ancha de la ronda
  anterior a la nueva, más estrecha, para no truncar la oreja lejana;
  nuevo test que mide directamente el hueco entre orejas en las tres
  filas y exige que sea más estrecho que en la versión anterior
  (snapshot literal de `2390783`); nuevo test que exige un tramo
  contiguo de cráneo de al menos 5 columnas entre orejas y hocico,
  protegiendo la "masa central" pedida explícitamente; nuevo test que
  compara el ancho del hocico (relleno de máscara) contra el ancho del
  cráneo -- un test que el comentario del archivo llevaba varias rondas
  describiendo sin que existiera realmente, detectado al auditar la
  cobertura existente. Evidencia visual generada a varias escalas
  (cabeza aislada a 80px/celda, cuerpo completo, junto a Gonzalo)
  confirma que las orejas ahora nacen visiblemente más juntas del mismo
  bloque de cráneo, con un hueco real pero estrecho entre ellas en vez
  de una meseta ancha con un bulto en cada extremo. `qa` matiza, sin
  embargo, que llamar a esto "la franja plana desaparece" es más fuerte
  de lo que el pixel-art realmente muestra: la fila 3 sigue siendo una
  única fila de relleno uniforme (9 columnas, con un parche de highlight
  de 3 columnas encima), técnicamente tan plana como antes -- lo que
  cambia es que ahora es más corta y queda pegada directamente bajo la
  base de las orejas, por lo que se lee menos como "cuello con dos
  bultos" y algo más como "donde las orejas se juntan", sin ser una
  progresión que sugiera redondez real. `qa` también observa que, de
  cerca, la máscara oscura del hocico (ya aprobada en una ronda
  anterior, fuera de alcance de esta) sigue evocando más a un mapache o
  zorro que a un perro cartoon inequívoco, y que a la escala real de
  juego (sprite de 22x18 px dentro de un canvas de 480x270) ni el
  defecto de separación de orejas ni esta corrección son perceptibles a
  simple vista -- toda la evaluación visual de esta tarea, en todas sus
  rondas, se ha hecho sobre la cabeza ampliada, nunca a la escala en la
  que el jugador realmente la ve. Esta ronda sí resuelve, de forma
  verificable, el defecto concreto señalado por el rechazo humano (la
  separación horizontal de las orejas); no se declara resuelta la
  redondez del cráneo más allá de eso, ni aprobación artística general:
  sigue pendiente revisión visual humana explícita (`HUMAN CHARACTER
  STYLE APPROVAL REQUIRED`). Octava revisión humana: rechaza de nuevo,
  pero por un motivo distinto al de las rondas anteriores -- ya no la
  separación horizontal de las orejas, sino la falta de ALTURA de la
  cabeza ("apenas existe frente... hocico y orejas están demasiado cerca
  verticalmente... parece que le hubieran aplastado la cabeza"), pidiendo
  explícitamente no volver a tocar la anchura. La cabeza sigue acotada al
  mismo presupuesto de 7 filas (filas 0-6; las filas 7-17 del cuerpo
  siguen intocadas, protegidas por el test de igualdad byte a byte), así
  que la altura adicional sale de redistribuir esas 7 filas, no de sumar
  filas nuevas: el hocico (relleno de máscara "k") se comprime de 3 filas
  a 2 -- se elimina la fila intermedia de la ronda anterior, manteniendo
  el mismo contenido relativo en la fila del ojo y la misma posición de
  nariz en la fila inferior (aunque esa fila gana un píxel de contorno en
  la columna 8, no es completamente byte-idéntica a la anterior) -- y la
  fila liberada se cede a una fila de frente nueva, entre el cráneo (sin
  cambios: 9 columnas de relleno, highlight centrado de 3) y la
  máscara/ojo. Antes la máscara arrancaba justo debajo del cráneo sin
  transición; ahora hay una fila de tejido craneal (b/h) sin mezcla de
  máscara entre ambos, y la distancia vertical entre el final de las
  orejas y el inicio del hocico crece de 2 a 3 filas de diferencia. Orejas
  (filas 0-2): verbatim de la ronda anterior, sin ningún cambio -- la
  separación horizontal ya estaba resuelta y esta ronda es explícitamente
  sobre altura, no sobre anchura. Ojo: se desplaza de fila 4 a fila 5
  (empujado por la nueva fila de frente), misma columna 3. Nariz: sin
  cambios de posición (fila 6, columna 0), por lo que el test de anclaje
  de `tests/scenes/CreditsScene.test.js` no necesitó tocarse. `MaxRenderer.js`
  y `MaxCompanion.js` tampoco se tocan -- el cambio es enteramente de
  datos en `maxPixelArt.js`. Tests nuevos en
  `tests/content/MaxPixelArt.test.js`: comparación de filas de
  cráneo/frente (tejido b/h sin máscara) contra un snapshot literal de la
  versión anterior (commit 3ae4209), exigiendo más filas que antes;
  comprobación de que existe una fila de frente inmediatamente encima de
  la fila del ojo, en vez de que la máscara empiece pegada al cráneo;
  comparación de la distancia vertical entre orejas y hocico contra el
  mismo snapshot anterior, exigiendo que sea mayor. El test de "hocico
  más estrecho que cráneo" y el propio test del ojo se actualizan a las
  nuevas filas (5-6 para el hocico, fila 5 para el ojo) sin cambiar lo
  que protegen. Evidencia visual generada a varias escalas (cabeza
  ampliada, cuerpo completo aislado, junto a Gonzalo) muestra una
  progresión vertical real en la cabeza ampliada -- orejas, luego una
  masa de cráneo/frente, luego la máscara oscura, con una fila más de
  separación entre ambas que antes. `qa` matiza, sin embargo, algo
  importante que no se puede omitir: el bounding box total de la cabeza
  NO creció -- sigue ocupando exactamente las mismas 7 filas (0-6) que
  la versión rechazada; lo que cambió es la redistribución interna, no
  el tamaño del sprite. Comparando el sprite completo a la escala real
  de render del juego (no ampliado), `qa` encuentra que la nueva fila de
  frente se funde visualmente con el cráneo de arriba, al compartir los
  mismos tonos "b"/"h" -- la diferencia es sutil, casi imperceptible sin
  zoom o una cuadrícula de referencia, y no puede afirmar con confianza
  que esto vaya a leerse como "menos aplastado" para un ojo humano no
  entrenado en el detalle de píxel a esa escala, aunque tampoco reabre
  ningún defecto de rondas anteriores (orejas y cuerpo verificados
  intactos). Esta ronda resuelve, de forma verificable en el dato y en
  la cabeza ampliada, la redistribución vertical pedida (más distancia
  entre orejas y hocico, una fila de frente propia); no se garantiza que
  ese cambio sea suficientemente perceptible a tamaño real de juego para
  satisfacer el rechazo humano por "cabeza aplastada" -- eso queda,
  explícitamente, para la revisión visual humana. No se declara
  aprobación artística: sigue pendiente revisión visual humana explícita
  (`HUMAN CHARACTER STYLE APPROVAL REQUIRED`). Décima revisión humana:
  autoriza explícitamente romper el límite visual de 22x18 -- "tras
  múltiples iteraciones queda demostrado visualmente que 22x18 no ofrece
  resolución suficiente" -- y pide converger con la mockup aprobada
  redibujando la cabeza desde cero a una resolución mayor, sin escalar
  el sprite anterior. Nuevo tamaño: 22x20 (ancho sin cambios, alto +2
  filas). No se adoptó el rango sugerido (26x20/28x20): una auditoría
  previa a cualquier cambio de arte (sección "audita primero el
  renderer y el anclaje real" del propio encargo) encontró que
  `MAX_DIMENSIONS` (MaxRenderer.js) se usaba a la vez para centrar el
  render visual y como caja de colisión/spawn de Max en
  `getMaxCollisionBox()` (WorldScene.js) -- el mismo valor gobernando
  tanto lo visual como lo lógico. `tests/world/MaxCompanion.test.js`
  protege matemáticamente que `MAX_FOLLOW_MIN_DISTANCE` (31, congelada
  por instrucción explícita de la tarea: "NO modificar... follow
  distance") deja margen suficiente para que la caja visual de Max
  nunca se solape con la de Gonzalo en el peor caso diagonal; recalculado
  contra cada tamaño candidato, 26x20 y 28x20 ya rompían esa garantía
  (margen negativo) sin tocar la propia distancia, y 22x18 ampliado a
  cualquier tamaño con height >= 21 también, salvo compensando con un
  ancho más recortado. Se optó por 22x20 -- el mayor que conserva un
  margen positivo (~1.00px) manteniendo el ancho sin cambios -- y,
  crucialmente, se DESACOPLÓ la caja de colisión/spawn del tamaño
  visual: nueva constante `MAX_HITBOX_DIMENSIONS` (22x18, el tamaño
  lógico congelado) en `MaxCompanion.js`, usada exclusivamente por
  `getMaxCollisionBox()` en `WorldScene.js`; `MAX_DIMENSIONS` de
  MaxRenderer.js sigue reflejando el tamaño real del sprite (ahora
  22x20) y se usa exclusivamente para centrar el render en
  `MaxCompanion.render()`. Resultado: hitbox, colisión de spawn, radio
  de seguimiento, velocidad de alcance y reacción quedan bit a bit
  iguales a antes (verificado por la suite completa sin cambios en
  `tests/world/MaxCompanion.test.js` más allá de heredar
  automáticamente el nuevo `MAX_DIMENSIONS` en el cálculo de margen, que
  sigue siendo positivo). `MaxRenderer.js` no necesitó ningún cambio de
  código -- ya era completamente genérico sobre `MAX_PIXEL_WIDTH`/
  `MAX_PIXEL_HEIGHT`, así que ampliar el canvas fue solo cuestión de
  cambiar esas dos constantes y redibujar `MAX_SIDE_PIXELS`.
  `CreditsScene.js` no se tocó (sigue llamando a `renderMax()` sin
  ningún parámetro nuevo); su test de anclaje a la nariz se actualizó
  porque la nariz cambió de fila (6 -> 8) al redibujar la cabeza.
  Cabeza redibujada por completo (filas 0-8, 9 filas, frente a 7 en el
  presupuesto anterior) aplicando la lección de un primer intento
  fallido dentro de esta misma ronda: un cráneo cuyo borde frontal
  recede progresivamente fila a fila, combinado con el salto hacia
  delante del hocico, traza una única diagonal continua de punta de
  oreja a punta de nariz -- confirmado visualmente como lectura de
  llama/ciervo, no de perro, el mismo defecto que once rondas de esta
  tarea llevaban intentando eliminar. La corrección: el borde frontal
  del cráneo (columna 3) es CONSTANTE en las cuatro filas 3-6 -- una
  pared vertical, no una rampa -- y la redondez viene del borde trasero
  abultándose hacia atrás (9, 8, 7 y 6 columnas de ancho en las filas
  3, 4, 5 y 6 respectivamente), nunca del frontal moviéndose. El hocico
  (filas 7-8) salta hacia delante hasta la columna 0 en un único paso
  repentino, protegido de que el contorno automático lo rellene (misma
  técnica ya usada para el hueco entre orejas, aplicada aquí a un
  escalón vertical). Un segundo defecto, encontrado durante la propia
  verificación de esta ronda: la coronilla (fila 2) era más estrecha
  que la base de las orejas que la coronaban, creando un "pinzamiento"
  visual en la unión -- el mismo problema de fondo (lectura de cuello
  delgado) causado de otra forma. Se corrigió ensanchando la coronilla
  (de 8 a 10 columnas, cols 1-10) para respaldar por completo ambas
  bases sin que sobresalgan. Orejas: se acortan de 3 filas a 2 (punta
  + base, sin fila intermedia) con base ensanchada -- un primer intento
  con 3 filas seguía leyéndose como astas incluso tras resolver el
  pinzamiento; acortar su alcance vertical relativo a su base ancha se
  lee más como un triángulo de perro corto y menos como un asta de
  ciervo. Pequeño highlight interior ("m") en la base de la oreja
  cercana (autorización explícita de esta ronda: "interior opcional").
  Ojo: fila 6, columna 4 (con tan a ambos lados -- una posición inicial
  en columna 3, pegada al escalón del hocico, hacía que se fundiera con
  el fondo transparente en la evidencia generada, y se corrigió antes
  de darla por buena). Nariz: fila 8, columna 0. Máscara deliberadamente
  amplia (8 columnas en la fila 7, la mayor de cualquier ronda de esta
  tarea), sin alcanzar la coronilla. Cuerpo: se reutiliza, byte a byte,
  el cuerpo ya aprobado de `2fda024` (filas 7-17), desplazado a las
  filas 9-19 -- la tarea no obligaba a conservarlo byte a byte al
  cambiar de resolución, pero no había motivo para tocar un cuerpo ya
  aceptado.
  Tests reescritos por completo: se eliminan los tests que protegían
  geometría de cabeza ya descartada (comparaciones de superficie/altura
  contra commits concretos como `e63dc1f`/`444ee1f`/`3353f43`/
  `3ae4209`/`2390783`) -- instrucción explícita de la tarea, "NO crear
  tests contra commits visualmente rechazados" -- y se sustituyen por
  contratos absolutos: borde frontal del cráneo constante en sus filas
  inferiores; hocico proyectando delante de ese borde; coronilla al
  menos tan ancha como la base de las orejas; al menos 4 filas de
  cráneo puro; máscara sin alcanzar la coronilla; además de los
  contratos ya establecidos (dos orejas separadas con ensanchamiento
  punta-a-base, ojo único, ausencia de collar, conectividad, paleta,
  torso no degenerado, patas con articulación, cola separada y más
  baja que las orejas). El test de cuerpo protege ahora la igualdad
  byte a byte contra `2fda024` en las nuevas filas 9-19.
  Evidencia visual generada a varias escalas (cabeza aislada, cuerpo
  completo, junto a Gonzalo, y a escala real de juego dentro del canvas
  nativo de 480x270) confirma un avance real y verificable frente a
  todas las rondas anteriores: la cabeza tiene volumen genuino, el
  hocico se lee como un bloque que sobresale (no como continuación del
  mismo trazo), las orejas ya no se leen como astas, y el ojo es
  visible. A escala real de juego el conjunto se lee de forma más
  reconocible como un pequeño cánido que en cualquier ronda anterior
  dentro de 22x18. `qa` confirma lo anterior de forma independiente,
  generando su propia comparación directa entre la versión anterior
  (22x18) y esta, pero matiza dos cosas con honestidad: la mejora de
  reconocibilidad a escala real de juego es incremental, no un salto
  transformador (ambas versiones eran ya razonablemente legibles como
  perro a esa escala); y las dos orejas se perciben ligeramente menos
  separadas/más fusionadas en la comparación ampliada que en la versión
  22x18, pese a que el hueco transparente entre ellas mide exactamente
  lo mismo en columnas -- un efecto secundario probable de la coronilla
  más ancha, no documentado antes de que `qa` lo señalara. `reviewer`
  encontró y corrigió, antes de este commit, un error real de datos en
  este mismo párrafo del CHANGELOG y en el comentario de cabecera de
  `maxPixelArt.js` (los anchos de cráneo de las filas 3-6 estaban
  citados en el orden equivocado: 6,9,8,7 en vez de 9,8,7,6), además de
  confirmar de forma independiente el punto más crítico de esta ronda
  -- que el aumento de tamaño visual no afecta a la hitbox de
  colisión/spawn, verificado leyendo el diff real de `WorldScene.js` y
  ejecutando `tests/world/MaxCompanion.test.js`. No se declara
  aprobación artística definitiva ni se da por resuelta la convergencia
  completa con la mockup: sigue pendiente revisión visual humana
  explícita (`HUMAN CHARACTER STYLE APPROVAL REQUIRED`). Duodécima
  revisión humana: mantiene el tamaño 22x20 y la masa craneal ganada
  (explícitamente: "no volver a cambiar tamaño... cuerpo... patas...
  cola... hitbox... MaxCompanion"), pero señala tres problemas
  concretos sobre la cabeza -- las orejas no se distinguen
  suficientemente, el hocico se ve como una masa oscura/cuadrada poco
  natural, y falta separación visual entre orejas, frente, ojo/máscara
  y hocico. Microiteración acotada estrictamente a la cabeza (filas
  0-8); el cuerpo (filas 9-19) no se toca, verificado byte a byte
  idéntico a `2fda024`. Redistribución del presupuesto fijo de 9 filas:
  orejas de 2 a 3 (recupera el taper de tres niveles -- punta 1
  columna, cuerpo 3, base 4 -- ya validado visualmente en rondas
  anteriores a la ampliación de tamaño, con highlight interior "m" en
  ambas orejas en vez de solo en la cercana); cráneo de 4 pasos de
  estrechamiento a 3 (coronilla 10 columnas cols 1-10 sin cambios,
  mejilla 9 columnas sin cambios, frente y fila del ojo se fusionan en
  una sola fila de 6 columnas -- se cede el paso intermedio que existía
  entre ambas); hocico de 2 filas a 3, con la máscara ganando terreno en
  tres pasos en vez de un salto de 2 niveles con anchos similares que se
  leía como bloque (3, 6 y 3 columnas de máscara "k" en las filas 6, 7 y
  8) -- la fila superior del hocico empieza con máscara pequeña y
  mejilla tan todavía dominante a los lados (6 columnas de "b"), la
  fila siguiente pasa a máscara dominante, y la última se estrecha de
  nuevo hacia la nariz, en vez de que la máscara aparezca de golpe como
  un rectángulo oscuro completo. Ojo: se desplaza de fila 6 a fila 5 (al
  fusionarse la fila de frente con la del ojo), misma columna 4, con
  tan a ambos lados. Nariz: fila 8, columna 0, sin cambios de posición.
  La pared frontal constante del cráneo (la corrección de la ronda
  anterior contra la lectura diagonal de llama/ciervo) se conserva,
  ahora en las filas 4-5 en vez de 3-6 -- dos filas en vez de cuatro,
  pero sigue siendo una pared real, no una rampa. Tests actualizados:
  los índices de fila de todos los tests de cabeza se desplazan según
  la nueva estructura (ojo, pared frontal, cráneo-vs-base-de-orejas,
  máscara-no-alcanza-coronilla, hocico-más-estrecho-que-cráneo, hueco
  entre orejas); el test de "cráneo ocupa al menos 4 filas puras" baja
  a 3 (cesión explícita de una fila a orejas y otra a hocico, sin
  perder coronilla ni mejilla); el test de taper de orejas se actualiza
  de 2 niveles a 3, coherente con el nuevo diseño. `qa` revisó un primer
  intento de esta ronda (antes de cualquier commit) y encontró que la
  base de cada oreja se fundía sin transición visual con la coronilla
  -- comparten tonos y no hay contorno entre ellas, porque el contorno
  automático solo actúa sobre el borde exterior de la silueta, no entre
  dos regiones internas contiguas -- de forma que a escala real de
  juego las dos orejas y la coronilla volvían a leerse como un único
  bulto, deshaciendo buena parte de la separación buscada. Se corrigió
  añadiendo un único píxel de contorno en el centro de la base de cada
  oreja, justo donde toca la coronilla -- un pliegue puntual, no una
  línea completa que las desconectaría del cráneo del que nacen.
  `reviewer` encontró y corrigió, antes de este commit, una cifra
  incorrecta en este mismo párrafo y en el comentario de cabecera de
  `maxPixelArt.js`: el taper de máscara del hocico se había citado como
  "8, 6 y 3" columnas en las filas 6, 7 y 8, cuando el dato real es "3,
  6 y 3" (la fila 6 empieza con máscara pequeña y mejilla tan todavía
  dominante, no con 8 columnas de máscara) -- el mismo patrón de error
  (cifras citadas sin recalcular contra el array real) que ya había
  corregido en la ronda anterior, ahora señalado explícitamente como
  recurrente para vigilar en rondas futuras. `qa` matiza con honestidad
  que, tras su primera revisión (previa al pliegue de orejas), la
  mejora de esta ronda fue parcial en los tres puntos que señaló el
  humano -- clara en la separación frente/ojo-máscara, modesta en
  orejas y hocico, sin alcanzar una transformación cualitativa -- y que
  el hocico, aunque ya no es un bloque macizo de una sola pared, sigue
  leyéndose angular más que como una curva orgánica de morro canino,
  dentro de las limitaciones de la resolución. No se declara aprobación
  artística definitiva ni se da por resuelta la convergencia completa
  con la mockup: sigue pendiente revisión visual humana explícita
  (`HUMAN CHARACTER STYLE APPROVAL REQUIRED`). Decimotercera revisión
  humana: acepta la mejora de la microiteración anterior pero mantiene
  el rechazo, con los mismos tres problemas ahora más precisos --
  orejas todavía poco distinguibles ("el mayor fallo actual"), cráneo
  con poca masa visual, hocico demasiado irregular (el taper de 3
  niveles de la ronda anterior, 3/6/3 columnas, se leía como un zigzag
  de "demasiados quiebros") -- y pide explícitamente dejar de hacer
  microajustes de uno o dos píxeles y construir una cabeza cartoon
  deliberada, con un presupuesto de píxeles orientativo (no un
  contrato de test): orejas 3-4 filas de altura, cráneo 7-9 columnas de
  ancho y 4-5 filas de masa, hocico 3-4 columnas de largo y 2-3 filas
  de alto. Redistribución del presupuesto fijo de 9 filas: cráneo de 3
  filas a 4 (coronilla 10 columnas cols 1-10 sin cambios, mejilla 9
  columnas sin cambios, frente y fila del ojo vuelven a separarse en
  dos filas -- 7 y 6 columnas respectivamente -- en vez de la fila
  fusionada de la ronda anterior), a costa de simplificar el hocico de
  3 filas a 2 (un único escalón limpio de la pared del cráneo hasta la
  columna 0, con 6 columnas de máscara en la fila 7 y 3 en la fila 8
  para la nariz, en vez del taper de tres niveles 3/6/3 que se leía
  como zigzag) -- "cráneo grande + morro corto que sobresale" en dos
  filas, no tres. Orejas: sin cambios de fila (siguen siendo 3, dentro
  del rango 3-4 sugerido) pero con el pliegue de separación reubicado:
  un primer intento de esta ronda probó ensanchar el pliegue de la base
  de la oreja (introducido en la ronda anterior) de 1 a 2 columnas
  dentro de la propia oreja, y acabó partiendo la base en dos mitades
  separadas por un hueco oscuro -- un defecto peor que el "modesto"
  que corregía. Se movió el pliegue de dentro de la oreja a la fila de
  la coronilla justo debajo (un único píxel de contorno en la columna
  bajo cada oreja, columna 2 cercana y columna 7 lejana): marca el
  límite entre oreja y cráneo sin restar ningún píxel a la propia
  oreja. Ojo: fila 6, columna 4 (baja una fila al separarse de nuevo
  frente y fila del ojo). Nariz: fila 8, columna 0, sin cambios de
  posición en ninguna ronda desde su introducción. Tests: los tests de
  cabeza se actualizan a los nuevos índices de fila (ojo, hocico-vs-
  cráneo, pared frontal -- ahora en las tres filas 4-6 en vez de solo
  4-5, ya que la fila del ojo vuelve a ser una fila propia de la pared);
  el test de "cráneo ocupa al menos N filas puras" sube de 3 a 4,
  reflejando la ganancia real de masa craneal de esta ronda. Evidencia
  visual generada antes de tocar tests o CHANGELOG, siguiendo la
  instrucción explícita de la tarea de no avanzar sobre una captura que
  siga viéndose mal: cabeza ampliada, Max completo, junto a Gonzalo, y
  a escala real de juego. `qa` revisó un primer intento de esta ronda
  (antes de cualquier commit) y confirmó de forma independiente que el
  cráneo y el hocico sí cumplían lo pedido, pero encontró que las
  orejas -- "el mayor fallo actual" según el propio encargo humano --
  apenas habían cambiado: las filas 0-1 seguían siendo idénticas a la
  versión ya rechazada, y el pliegue de la coronilla (de la ronda
  anterior) es un ajuste cosmético de la costura oreja-cráneo, no un
  cambio a la separación entre ambas orejas, que seguía siendo de solo
  1 columna en la base -- demasiado estrecha para leerse a escala real
  de juego según su propia evidencia visual. Se corrigió desplazando la
  punta lejana de la columna 7 a la 9 (separación entre puntas de 4 a 6
  columnas) sin estrechar ninguna base (ambas se mantienen en 4
  columnas): el hueco crece a 2 columnas en la base y 3 en el nivel
  medio, ganando separación sin sacrificar volumen. La coronilla (10
  columnas, sin cambios) sigue respaldando por completo la base lejana,
  que ahora llega hasta la columna 10. No se declara aprobación
  artística definitiva ni se da por resuelta la convergencia completa
  con la mockup: sigue pendiente revisión de `qa` y `reviewer`, y
  revisión visual humana explícita (`HUMAN CHARACTER STYLE APPROVAL
  REQUIRED`).
- Plaza del Axioma -- NPCs ambientales: 4 NPC nuevos, estáticos y sin
  nombre propio (`ambient-florist-altar`, `ambient-setup-helper`,
  `ambient-waiter-tables`, `ambient-guest-bench`) junto al altar, el
  puesto de montaje, las mesas de boda y los bancos de la Plaza, cada uno
  con un diálogo ambiental de un único turno sin flags ni efectos de
  estado. Reutilizan el render genérico `WorldScene.renderNpc()` con su
  propia entrada en `NAMED_NPC_PALETTES`
  (`src/content/characterPalettes.js`), que ahora admite rasgos
  opcionales -- ojos, pelo y delantal -- dibujados solo cuando la paleta
  los declara. En una corrección de alcance posterior sobre esta misma
  entrada, `renderNpc()` se extendió con pelo, hombros, brazos y una
  hendidura de piernas para los 5 NPC que usan este render genérico
  (los 4 ambientales y también `plaza-worker`, que hasta entonces se
  había quedado sin el tratamiento visual nuevo pese a compartir la misma
  función), sin tocar posición, colisión, diálogo ni lógica de
  interacción de ninguno de los cinco. Tras revisión visual humana
  explícita de esa ronda ("todavía se leen demasiado como BLOQUES" --
  `HUMAN NPC STYLE APPROVAL: NOT APPROVED YET`), una segunda corrección de
  alcance, también puramente visual, reestructuró `renderNpc()` en seis
  sub-rutinas privadas compartidas (`drawGenericNpcOutline/Hair/Head/
  Body/Legs/Apron()`, todavía `fillRect` directo, sin migrar al pipeline
  de pixel-art indexado/cacheado): silueta en dos bloques (hombros->
  cintura y piernas->zapato), pelo trasero+frontal+detalle según
  `palette.hairStyle` (`short|medium|side|bun|fringe`, uno distinto por
  NPC), cabeza con mandíbula y cuello diferenciados de la silueta,
  hombros más anchos que la cintura con brazos cortos integrados (en vez
  de bloques pegados a toda la altura del torso) y piernas separadas por
  un hueco real, con variantes de silueta (`palette.silhouetteVariant`:
  `practical`/`light`/`formal`) para hombros/torso/piernas y un
  delantal/peto/corbata distinto por `object.id` (banda práctica para
  `ambient-setup-helper`, peto integrado con tira vertical + banda para
  `ambient-waiter-tables`, corbata vertical en vez de delantal para
  `ambient-guest-bench`, detalle floral para `ambient-florist-altar`,
  ninguno para `plaza-worker`, que nunca lo tuvo). `NAMED_NPC_PALETTES`
  gana `hairStyle`, `hairShadow` y `bodyShadow` (~20% más oscuros que
  `hair`/`body`, para dar volumen sin colisionar con ningún otro color ya
  usado en el archivo) por cada una de las 5 entradas. Sigue sin tocar
  posición, colisión, diálogo, lógica de interacción, guardado ni audio
  de ninguno de los cinco NPC. No se declara aprobación artística
  definitiva: sigue pendiente revisión de `qa`/`reviewer` y una nueva
  revisión visual humana explícita.

  Una tercera corrección, también puramente visual, responde a hallazgos
  independientes de `qa` y `reviewer` sobre esa segunda ronda: el
  "detalle floral" de `ambient-florist-altar` (2px sueltos en
  `palette.accent`, el mismo color ya reutilizado en la banda de pecho y
  en las piernas de todos los NPC genéricos) no se leía como una flor.
  Ahora usa un color propio, `palette.flowerAccent` (nuevo campo, solo en
  `ambient-florist-altar`), y dibuja un rosetón de 5px sobre el hombro
  derecho -- una cruz de 4 pétalos en `flowerAccent` con un centro en
  `palette.hairShadow` a modo de estambre oscuro -- verificado con una
  captura visual real. De paso, se elimina el campo `apron: true`, ya
  huérfano en `ambient-setup-helper`/`ambient-waiter-tables` desde que la
  segunda ronda movió la decisión del delantal/peto/corbata a
  `object.id`, y se corrige un comentario impreciso sobre la corbata de
  `ambient-guest-bench` (la corbata de 2px de ancho no cubre por completo
  al collar de 4px pintado antes; ambos se funden visualmente porque
  comparten `palette.accent`, no porque uno contenga al otro).

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
