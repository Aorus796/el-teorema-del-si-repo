import { PARTNER_NAME } from "./personalizationConfig.js";

const TILE_SIZE = 16;

const AXIOM_PLAZA = createMap({
  id: "axiom-plaza",
  name: "Plaza del Axioma",
  width: 48,
  height: 32,
  palette: {
    groundA: "#b99b6b",
    groundB: "#c3a574",
    wall: "#6e655a",
    wallTop: "#91836d",
    water: "#4f9da6",
  },
  dawnPalette: {
    groundA: "#f0b878",
    groundB: "#f7d29a",
    wall: "#c98a63",
    wallTop: "#e8b07a",
    water: "#f3a583",
  },
  solidRegions: [
    { x: 19, y: 4, width: 10, height: 2 },
    { x: 21, y: 13, width: 6, height: 5 },
    { x: 7, y: 21, width: 8, height: 2 },
    { x: 31, y: 21, width: 8, height: 2 },
  ],
  objects: [
    {
      id: "preparations-board",
      type: "sign",
      x: 176,
      y: 144,
      width: 20,
      height: 24,
      interactionRadius: 30,
      label: "Tablón de preparativos",
    },
    {
      id: "mayor-corolaria",
      type: "npc",
      x: 256,
      y: 176,
      width: 14,
      height: 18,
      interactionRadius: 28,
      label: "Alcaldesa Corolaria",
    },
    {
      id: "bride-father",
      type: "npc",
      x: 304,
      y: 176,
      width: 14,
      height: 18,
      interactionRadius: 28,
      label: "Padre de la novia",
    },
    {
      id: "plaza-worker",
      type: "npc",
      x: 224,
      y: 240,
      width: 14,
      height: 18,
      interactionRadius: 28,
      label: "Ayudante de la ceremonia",
    },
    {
      id: "plaza-to-seven-bridges",
      type: "exit",
      x: 720,
      y: 224,
      width: 16,
      height: 64,
      interactionRadius: 30,
      label: "Paseo de los Siete Puentes",
      targetMapId: "seven-bridges-walk",
      targetPlayerState: {
        x: 48,
        y: 192,
        facing: "right",
      },
    },
    {
      id: "blocked-library",
      type: "blocked-exit",
      x: 352,
      y: 48,
      width: 48,
      height: 16,
      interactionRadius: 30,
      label: "Biblioteca del Margen",
    },
    {
      id: "blocked-garden",
      type: "blocked-exit",
      x: 48,
      y: 112,
      width: 16,
      height: 48,
      interactionRadius: 30,
      label: "Jardín de la Criba",
    },
    {
      id: "blocked-observatory",
      type: "blocked-exit",
      x: 48,
      y: 336,
      width: 16,
      height: 48,
      interactionRadius: 30,
      label: "Observatorio",
    },
    {
      id: "blocked-mill",
      type: "blocked-exit",
      x: 704,
      y: 336,
      width: 16,
      height: 48,
      interactionRadius: 30,
      label: "Molino",
    },
    {
      id: "epilogue-gift-mechanism",
      type: "table",
      x: 560,
      y: 296,
      width: 32,
      height: 24,
      interactionRadius: 30,
      label: "Mecanismo del regalo",
    },
    {
      id: "bride-epilogue",
      type: "npc",
      x: 650,
      y: 260,
      width: 14,
      height: 18,
      interactionRadius: 28,
      label: PARTNER_NAME,
      requiresFlag: "giftCodeSolved",
    },
    /*
     * NPCs ambientales de Plaza del Axioma (v1.1, sin nombre propio, sin
     * requiresFlag ni diálogo con estado): rellenan la plaza durante los
     * preparativos junto al altar, el puesto de montaje, las mesas de boda
     * y los bancos. Posiciones verificadas contra solidRegions, el resto de
     * objects, todas las decorations y el rectángulo de aparición del
     * jugador (ver tests/content/WorldMaps.test.js).
     */
    {
      id: "ambient-florist-altar",
      type: "npc",
      x: 260,
      y: 100,
      width: 14,
      height: 18,
      interactionRadius: 28,
      label: "Persona revisando las flores",
    },
    {
      id: "ambient-setup-helper",
      type: "npc",
      x: 506,
      y: 66,
      width: 14,
      height: 18,
      interactionRadius: 28,
      label: "Persona ayudando con el montaje",
    },
    {
      id: "ambient-waiter-tables",
      type: "npc",
      x: 188,
      y: 374,
      width: 14,
      height: 18,
      interactionRadius: 28,
      label: "Persona sirviendo en las mesas",
    },
    {
      id: "ambient-guest-bench",
      type: "npc",
      x: 634,
      y: 112,
      width: 14,
      height: 18,
      interactionRadius: 28,
      label: "Persona invitada esperando",
    },
  ],
  /*
   * Plaza Visual Polish -- Wedding Preparation Style Lock (v1.1, Plaza
   * únicamente): altar/fuente conservan id/x/y/width/height exactos (solo
   * cambia su función de dibujo en WorldScene.js) porque solidRegions ya
   * está alineado con su geometría; el resto son decoraciones puramente
   * visuales nuevas -- decorations nunca alimenta solidTiles (ver
   * createMap() más abajo), así que ninguna afecta colisión/navegación.
   * Posiciones verificadas a mano contra todos los objects de este mapa
   * (incluido bride-epilogue, solo visible con giftCodeSolved) para no
   * solapar ninguno, con margen alrededor del spawn por defecto (240,192)
   * y del corredor real hacia bride-epilogue en el recorrido del epílogo.
   */
  decorations: [
    {
      id: "altar",
      type: "altar",
      x: 304,
      y: 64,
      width: 160,
      height: 48,
    },
    {
      id: "fountain",
      type: "fountain",
      x: 336,
      y: 208,
      width: 96,
      height: 80,
    },
    {
      id: "wedding-table-north-left",
      type: "wedding-table",
      x: 130,
      y: 340,
      width: 48,
      height: 46,
    },
    {
      id: "wedding-table-south-left",
      type: "wedding-table",
      x: 210,
      y: 348,
      width: 48,
      height: 46,
    },
    {
      id: "wedding-table-north-right",
      type: "wedding-table",
      x: 494,
      y: 348,
      width: 48,
      height: 46,
    },
    {
      id: "wedding-table-south-right",
      type: "wedding-table",
      x: 574,
      y: 340,
      width: 48,
      height: 46,
    },
    {
      id: "arch-garland",
      type: "garland",
      x: 290,
      y: 118,
      width: 190,
      height: 4,
    },
    {
      id: "arch-lamp-left",
      type: "lamp-post",
      x: 290,
      y: 120,
      width: 9,
      height: 40,
    },
    {
      id: "arch-lamp-right",
      type: "lamp-post",
      x: 480,
      y: 120,
      width: 9,
      height: 40,
    },
    {
      id: "bridge-lamp-north",
      type: "lamp-post",
      x: 695,
      y: 190,
      width: 9,
      height: 40,
    },
    {
      id: "bridge-lamp-south",
      type: "lamp-post",
      x: 690,
      y: 300,
      width: 9,
      height: 40,
    },
    {
      id: "planter-northwest",
      type: "planter",
      x: 90,
      y: 60,
      width: 24,
      height: 24,
    },
    {
      id: "planter-west",
      type: "planter",
      x: 90,
      y: 260,
      width: 24,
      height: 24,
    },
    {
      id: "planter-southwest",
      type: "planter",
      x: 90,
      y: 420,
      width: 24,
      height: 24,
    },
    {
      id: "planter-northeast",
      type: "planter",
      x: 680,
      y: 60,
      width: 24,
      height: 24,
    },
    {
      id: "planter-southeast",
      type: "planter",
      x: 660,
      y: 420,
      width: 24,
      height: 24,
    },
    {
      id: "planter-arch-left",
      type: "planter",
      x: 270,
      y: 70,
      width: 24,
      height: 24,
    },
    {
      id: "planter-arch-right",
      type: "planter",
      x: 470,
      y: 70,
      width: 24,
      height: 24,
    },
    {
      id: "bench-northwest",
      type: "bench",
      x: 110,
      y: 90,
      width: 40,
      height: 16,
    },
    {
      id: "bench-northeast",
      type: "bench",
      x: 630,
      y: 90,
      width: 40,
      height: 16,
    },
    {
      id: "preparation-stall",
      type: "market-stall",
      x: 500,
      y: 16,
      width: 100,
      height: 40,
    },
    /*
     * Segunda pasada de densidad visual (Plaza Visual Polish, ronda 2):
     * únicamente decoración adicional -- ningún object ni solidRegion
     * nuevo -- para que los bordes y el entorno de fuente/altar/puesto/
     * bancos dejen de leerse vacíos, sin invadir el centro jugable ni las
     * rutas. Posiciones verificadas contra todos los objects de este mapa
     * (incluido bride-epilogue) igual que en la primera pasada.
     */
    {
      id: "pot-fountain-left",
      type: "flower-pot",
      x: 320,
      y: 220,
      width: 12,
      height: 16,
    },
    {
      id: "pot-fountain-right",
      type: "flower-pot",
      x: 440,
      y: 220,
      width: 12,
      height: 16,
    },
    {
      id: "bush-fountain-left",
      type: "bush",
      x: 312,
      y: 260,
      width: 20,
      height: 24,
    },
    {
      id: "bush-fountain-right",
      type: "bush",
      x: 440,
      y: 260,
      width: 20,
      height: 24,
    },
    {
      id: "petals-arch-left",
      type: "petals",
      x: 350,
      y: 145,
      width: 10,
      height: 9,
    },
    {
      id: "petals-arch-right",
      type: "petals",
      x: 410,
      y: 145,
      width: 10,
      height: 9,
    },
    {
      id: "crate-stall-left",
      type: "crate",
      x: 470,
      y: 30,
      width: 14,
      height: 15,
    },
    {
      id: "crate-stall-right",
      type: "crate",
      x: 615,
      y: 30,
      width: 14,
      height: 15,
    },
    {
      id: "pot-bench-northwest",
      type: "flower-pot",
      x: 155,
      y: 88,
      width: 12,
      height: 16,
    },
    {
      id: "pot-bench-northeast",
      type: "flower-pot",
      x: 675,
      y: 88,
      width: 12,
      height: 16,
    },
    {
      id: "bush-corner-northwest",
      type: "bush",
      x: 50,
      y: 80,
      width: 20,
      height: 20,
    },
    {
      id: "bush-corner-northeast",
      type: "bush",
      x: 710,
      y: 80,
      width: 20,
      height: 20,
    },
    {
      id: "bush-corner-southwest",
      type: "bush",
      x: 60,
      y: 440,
      width: 20,
      height: 20,
    },
    {
      id: "bush-corner-southeast",
      type: "bush",
      x: 720,
      y: 440,
      width: 20,
      height: 20,
    },
    {
      id: "petals-table-left",
      type: "petals",
      x: 185,
      y: 355,
      width: 10,
      height: 9,
    },
    {
      id: "petals-table-right",
      type: "petals",
      x: 555,
      y: 360,
      width: 10,
      height: 9,
    },
    {
      id: "crate-table-left",
      type: "crate",
      x: 220,
      y: 400,
      width: 14,
      height: 15,
    },
    {
      id: "crate-table-right",
      type: "crate",
      x: 590,
      y: 395,
      width: 14,
      height: 15,
    },
    {
      id: "market-garland",
      type: "garland",
      x: 600,
      y: 72,
      width: 74,
      height: 4,
    },
    /*
     * Tercera y última pasada de densidad visual (Plaza Visual Polish,
     * ronda 3): composiciones de 2-4 elementos junto a estructuras ya
     * existentes (nunca plantas aisladas sueltas), cipreses de borde, y
     * más pétalos flotantes de suelo lejos del centro jugable. Sigue sin
     * tocar ningún object ni solidRegion; posiciones verificadas contra
     * todos los objects y contra el resto de decorations (test dedicado
     * en tests/content/WorldMaps.test.js).
     */
    {
      id: "cypress-north-left",
      type: "bush",
      x: 150,
      y: 20,
      width: 14,
      height: 34,
    },
    {
      id: "cypress-north-right",
      type: "bush",
      x: 660,
      y: 20,
      width: 14,
      height: 34,
    },
    {
      id: "pot-corner-northwest",
      type: "flower-pot",
      x: 35,
      y: 85,
      width: 12,
      height: 16,
    },
    {
      id: "pot-corner-northeast",
      type: "flower-pot",
      x: 735,
      y: 85,
      width: 12,
      height: 16,
    },
    {
      id: "pot-corner-southwest",
      type: "flower-pot",
      x: 35,
      y: 445,
      width: 12,
      height: 16,
    },
    {
      id: "pot-corner-southeast",
      type: "flower-pot",
      x: 745,
      y: 445,
      width: 12,
      height: 16,
    },
    {
      id: "pot-stall-left",
      type: "flower-pot",
      x: 486,
      y: 33,
      width: 12,
      height: 16,
    },
    {
      id: "pot-stall-right",
      type: "flower-pot",
      x: 601,
      y: 33,
      width: 12,
      height: 16,
    },
    {
      id: "fabric-roll-arch",
      type: "fabric-roll",
      x: 450,
      y: 40,
      width: 16,
      height: 13,
    },
    {
      id: "fabric-roll-stall",
      type: "fabric-roll",
      x: 640,
      y: 40,
      width: 16,
      height: 13,
    },
    {
      id: "petals-open-northwest",
      type: "petals",
      x: 270,
      y: 220,
      width: 10,
      height: 9,
    },
    {
      id: "petals-open-northeast",
      type: "petals",
      x: 450,
      y: 180,
      width: 10,
      height: 9,
    },
    {
      id: "petals-open-southwest",
      type: "petals",
      x: 300,
      y: 300,
      width: 10,
      height: 9,
    },
    {
      id: "petals-open-southeast",
      type: "petals",
      x: 480,
      y: 300,
      width: 10,
      height: 9,
    },
  ],
});

/*
 * Seven Bridges Visual Polish -- inversión de semántica agua/paseo
 * (segunda ronda de esta tarea, sustituye por completo la primera): en la
 * ronda anterior "river" (decoración) parecía agua pero era transitable, y
 * "pier" (decoración que restylaba solidRegions ya existentes) parecía
 * piedra/paseo pero estaba bloqueado -- exactamente al revés de lo que
 * espera un jugador. Ahora solidRegions cubre el agua REAL (todo el cauce
 * del río salvo el corredor de piedra/puentes), y "pier"/"bridge"/"dock"
 * son transitables de verdad porque caen fuera de solidRegions.
 *
 * Geometría (en tiles, TILE_SIZE=16): "river" cubre columnas 9-35, filas
 * 2-25 (x144-576, y32-416). Dentro de esa franja, un corredor horizontal
 * de piedra en filas 10-12 (y160-208) conecta orilla oeste -> pier-west
 * (cols9-13) -> bridge-west (cols14-19) -> pier-center (cols20-24) ->
 * bridge-east (cols25-30) -> pier-east (cols31-35) -> orilla este (desde
 * col36, x576, ya fuera de "river"). pier-center además se extiende hacia
 * abajo (filas 8-19) formando la isla central de piedra donde se apoya el
 * tablero del puzle P2 y desde la que arranca bridge-east. El resto del
 * cauce (banda superior filas2-7, banda inferior filas21-25, y los huecos
 * de agua entre columnas de pilares que ningún puente cubre) permanece
 * sólido: agua de verdad, no transitable. Ver el test dedicado en
 * tests/content/WorldMaps.test.js que verifica punto a punto agua/piedra/
 * puentes contra CollisionMap, no solo la aritmética de solidRegions.
 */
const SEVEN_BRIDGES_WALK = createMap({
  id: "seven-bridges-walk",
  name: "Paseo de los Siete Puentes",
  width: 44,
  height: 28,
  palette: {
    groundA: "#78916d",
    groundB: "#829b75",
    wall: "#5d6257",
    wallTop: "#858a75",
    water: "#357a8a",
  },
  solidRegions: [
    // Banda de agua superior, ancho completo del cauce (por encima de
    // cualquier pilar/puente): filas 2-7, columnas 9-35.
    { x: 9, y: 2, width: 27, height: 6 },
    // Agua entre orilla oeste y bridge-west, y entre bridge-west y
    // pier-center, a la altura de pier-west/pier-center (filas 8-9, antes
    // de que arranque el corredor de puentes en la fila 10).
    { x: 14, y: 8, width: 6, height: 2 },
    { x: 25, y: 8, width: 6, height: 2 },
    // Mismo par de huecos de agua, ya por debajo del corredor de puentes
    // (filas 13-15), entre pier-west/pier-center y pier-center/pier-east.
    { x: 14, y: 13, width: 6, height: 3 },
    { x: 25, y: 13, width: 6, height: 3 },
    // Agua bajo pier-west y pier-east (que terminan en la fila 15) y a los
    // lados de pier-center (que sigue hasta la fila 19): filas 16-17.
    { x: 9, y: 16, width: 11, height: 2 },
    { x: 25, y: 16, width: 11, height: 2 },
    // Filas 18-19: agua a ambos lados de pier-center, salvo el hueco del
    // embarcadero (columnas 32-37) en el lado este, todavía transitable.
    { x: 9, y: 18, width: 11, height: 2 },
    { x: 25, y: 18, width: 7, height: 2 },
    // Fila 20: pier-center ya terminó (fila 19); el hueco del embarcadero
    // sigue libre en el lado este.
    { x: 9, y: 20, width: 23, height: 1 },
    // Banda de agua inferior, ancho completo del cauce (por debajo de
    // pier-center y del embarcadero): filas 21-25.
    { x: 9, y: 21, width: 27, height: 5 },
  ],
  objects: [
    {
      id: "seven-bridges-to-plaza",
      type: "exit",
      x: 16,
      y: 160,
      width: 16,
      height: 64,
      interactionRadius: 30,
      label: "Plaza del Axioma",
      targetMapId: "axiom-plaza",
      targetPlayerState: {
        x: 688,
        y: 256,
        facing: "left",
      },
    },
    {
      id: "p2-bridge-board",
      type: "puzzle",
      x: 336,
      y: 112,
      width: 24,
      height: 24,
      interactionRadius: 32,
      label: "Mapa de los siete puentes",
    },
    {
      id: "p2-evidence",
      type: "evidence",
      x: 544,
      y: 304,
      width: 20,
      height: 20,
      interactionRadius: 30,
      label: "Anotación junto al embarcadero",
    },
    {
      id: "seven-bridges-to-library",
      type: "exit",
      x: 656,
      y: 272,
      width: 16,
      height: 64,
      interactionRadius: 30,
      label: "Biblioteca del Margen",
      targetMapId: "library",
      targetPlayerState: {
        x: 240,
        y: 256,
        facing: "up",
      },
    },
    {
      id: "blocked-mill-path",
      type: "blocked-exit",
      x: 656,
      y: 160,
      width: 16,
      height: 64,
      interactionRadius: 30,
      label: "Camino del molino",
    },
    /*
     * NPCs ambientales de Seven Bridges Walk (v1.1, sin nombre propio, sin
     * requiresFlag ni diálogo con estado): reutilizan exactamente el
     * mecanismo ya cerrado en Plaza (renderNpc/drawGenericNpc* en
     * WorldScene.js, NAMED_NPC_PALETTES en characterPalettes.js). Posiciones
     * verificadas contra solidTiles reales (no solo solidRegions), el resto
     * de objects y todas las decorations (ver tests/content/WorldMaps.test.js).
     */
    {
      id: "ambient-fisher-dock",
      type: "npc",
      x: 516,
      y: 302,
      width: 14,
      height: 18,
      interactionRadius: 28,
      label: "Persona pescando",
    },
    {
      id: "ambient-riverside-stroller",
      type: "npc",
      x: 100,
      y: 220,
      width: 14,
      height: 18,
      interactionRadius: 28,
      label: "Persona paseando",
    },
    {
      id: "ambient-bench-watcher",
      type: "npc",
      x: 636,
      y: 320,
      width: 14,
      height: 18,
      interactionRadius: 28,
      label: "Persona contemplando el río",
    },
  ],
  decorations: [
    // "river": capa de fondo (renderBackgroundDecorations, se pinta antes
    // que solidTiles) que cubre el cauce completo (ver comentario de
    // solidRegions más arriba). Se acortó de 448 a 432px de ancho respecto
    // a la ronda anterior para que la orilla este empiece exactamente en
    // x576 (columna 36), fuera del cauce -- antes se extendía 16px de más
    // sobre lo que ahora es tierra firme transitable.
    {
      id: "river",
      type: "river",
      x: 144,
      y: 32,
      width: 432,
      height: 384,
    },
    /*
     * "pier": ahora representa la isla/plataforma de piedra REALMENTE
     * transitable (ya no un restyle de solidRegions bloqueados). Tres
     * piezas -- dos orillas de piedra intermedias (oeste/este) y la isla
     * central, más ancha -- cuyo footprint en px cae siempre FUERA de
     * solidRegions (ver arriba). drawPier() en WorldScene.js distingue la
     * variante por tamaño exacto: 80x128 (lateral) o 80x192 (central), así
     * que estas tres piezas deben conservar esos dos tamaños exactos.
     */
    {
      id: "pier-west",
      type: "pier",
      x: 144,
      y: 128,
      width: 80,
      height: 128,
    },
    {
      id: "pier-center",
      type: "pier",
      x: 320,
      y: 128,
      width: 80,
      height: 192,
    },
    {
      id: "pier-east",
      type: "pier",
      x: 496,
      y: 128,
      width: 80,
      height: 128,
    },
    // "embarcadero" (dock): plataforma de madera transitable de la orilla
    // este, apoyada en el hueco de agua libre que dejan solidRegions en
    // columnas 32-37 (ver arriba) -- ya no se apoya sobre ningún "pier"
    // (pier-east ahora termina en la fila 15, el embarcadero empieza en la
    // 18), así que el orden de capas frente a "pier" ya no importa como
    // importaba en la ronda anterior.
    {
      id: "embarcadero",
      type: "dock",
      x: 512,
      y: 288,
      width: 96,
      height: 48,
    },
    // "bridge": tablero de madera transitable sobre el corredor de piedra
    // (filas 10-12, y160-208), en los huecos reales entre columnas de
    // pilares -- da lectura de cruce real. bridge-west cubre exactamente
    // el canal entre pier-west (termina en x=224) y pier-center (empieza
    // en x=320); bridge-east cubre exactamente el canal entre pier-center
    // (termina en x=400) y pier-east (empieza en x=496) -- ambos canales
    // miden 96px, igual que BRIDGE_PIXEL_WIDTH, así que el tablero encaja
    // borde con borde sin solapar ningún pilar ni dejar agua sin cubrir.
    {
      id: "bridge-west",
      type: "bridge",
      x: 224,
      y: 160,
      width: 96,
      height: 48,
    },
    {
      id: "bridge-east",
      type: "bridge",
      x: 400,
      y: 160,
      width: 96,
      height: 48,
    },
    // "boat": decoración nueva, puramente cosmética, colocada dentro de
    // agua REALMENTE bloqueada (fila 21-22, banda inferior del cauce,
    // dentro del solidRegion x9,y21,w27,h5) cerca del embarcadero, para
    // reforzar la lectura de "esto es agua" -- nunca añade colisión ni
    // interacción (ver drawBoat() en WorldScene.js).
    {
      id: "boat-dock",
      type: "boat",
      x: 440,
      y: 344,
      width: 32,
      height: 18,
    },
    // "path-sign": señalética ambiental junto al tablero del puzle P2 y
    // junto al embarcadero/nota -- no solapa ningún interactuable ni
    // cambia su id/radio de interacción. sign-p2-board se reubicó (antes
    // y90, sobre lo que ahora es la banda de agua superior bloqueada) para
    // quedar apoyada sobre pier-center, tierra firme real, en vez de
    // flotar sobre agua.
    {
      id: "sign-p2-board",
      type: "path-sign",
      x: 366,
      y: 150,
      width: 16,
      height: 30,
    },
    {
      id: "sign-embarcadero",
      type: "path-sign",
      x: 612,
      y: 250,
      width: 16,
      height: 30,
    },
    // Mobiliario y vegetación reutilizados de axiom-plaza (tipos ya
    // soportados por WorldScene.js): puntos de descanso en las orillas
    // este/oeste, fuera de cualquier exit/objeto y de los dos spawn reales.
    {
      id: "lamp-post-west",
      type: "lamp-post",
      x: 50,
      y: 60,
      width: 13,
      height: 42,
    },
    {
      id: "lamp-post-east",
      type: "lamp-post",
      x: 600,
      y: 60,
      width: 13,
      height: 42,
    },
    {
      id: "bench-west",
      type: "bench",
      x: 40,
      y: 300,
      width: 40,
      height: 20,
    },
    {
      id: "bench-east",
      type: "bench",
      x: 636,
      y: 340,
      width: 40,
      height: 20,
    },
    {
      id: "bush-west-north",
      type: "bush",
      x: 16,
      y: 40,
      width: 20,
      height: 20,
    },
    {
      id: "bush-west-south",
      type: "bush",
      x: 16,
      y: 380,
      width: 20,
      height: 20,
    },
    {
      id: "bush-east-north",
      type: "bush",
      x: 660,
      y: 40,
      width: 20,
      height: 20,
    },
    {
      id: "bush-east-south",
      type: "bush",
      x: 660,
      y: 380,
      width: 20,
      height: 20,
    },
  ],
});

const LIBRARY = createMap({
  id: "library",
  name: "Biblioteca del Margen",
  width: 30,
  height: 20,
  palette: {
    groundA: "#8b765f",
    groundB: "#947f67",
    wall: "#51443f",
    wallTop: "#806b59",
    water: "#4f7b79",
  },
  solidRegions: [
    { x: 3, y: 3, width: 9, height: 2 },
    { x: 18, y: 3, width: 9, height: 2 },
    { x: 3, y: 8, width: 7, height: 2 },
    { x: 20, y: 8, width: 7, height: 2 },
    { x: 3, y: 13, width: 7, height: 2 },
    { x: 20, y: 13, width: 7, height: 2 },
  ],
  objects: [
    {
      id: "library-silogio",
      type: "npc",
      x: 233,
      y: 128,
      width: 14,
      height: 18,
      interactionRadius: 28,
      label: "Silogio",
    },
    {
      id: "library-to-seven-bridges",
      type: "exit",
      x: 224,
      y: 288,
      width: 32,
      height: 16,
      interactionRadius: 30,
      label: "Paseo de los Siete Puentes",
      targetMapId: "seven-bridges-walk",
      targetPlayerState: {
        x: 624,
        y: 304,
        facing: "left",
      },
    },
    {
      id: "library-to-archive",
      type: "exit",
      x: 448,
      y: 144,
      width: 16,
      height: 64,
      interactionRadius: 30,
      label: "Archivo",
      targetMapId: "archive",
      targetPlayerState: {
        x: 192,
        y: 192,
        facing: "up",
      },
    },
    /*
     * NPCs ambientales de Biblioteca del Margen (v1.1, sin nombre propio,
     * sin requiresFlag ni diálogo con estado): reutilizan exactamente el
     * mecanismo ya cerrado en Plaza/Seven Bridges (renderNpc/
     * drawGenericNpc* en WorldScene.js, NAMED_NPC_PALETTES en
     * characterPalettes.js). Posiciones verificadas contra solidTiles
     * reales (no solo solidRegions), el resto de objects (incluido
     * library-silogio) y todas las decorations, alcanzables a pie desde el
     * spawn por defecto (240,256) y desde el punto de entrada real llegando
     * desde Archivo (416,176) -- ver tests/content/WorldMaps.test.js.
     */
    {
      id: "ambient-library-reader",
      type: "npc",
      x: 136,
      y: 96,
      width: 14,
      height: 18,
      interactionRadius: 28,
      label: "Persona leyendo",
    },
    {
      id: "ambient-library-assistant",
      type: "npc",
      x: 170,
      y: 190,
      width: 14,
      height: 18,
      interactionRadius: 28,
      label: "Persona ordenando las estanterías",
    },
    {
      id: "ambient-library-researcher",
      type: "npc",
      x: 330,
      y: 254,
      width: 14,
      height: 18,
      interactionRadius: 28,
      label: "Persona consultando el catálogo",
    },
  ],
  /*
   * Cobertura de "Biblioteca del Margen -- Visual Polish" (v1.1, solo
   * library): pase puramente visual, sin NPCs y sin tocar colisión --
   * decorations nunca alimenta solidTiles (ver createMap() más arriba).
   * Las 6 estanterías originales migran de "tables" (rama compartida,
   * sigue sirviendo a ARCHIVE sin cambios) a "library-shelf" (tipo
   * exclusivo con lectura clara de libros/lomos, ver
   * libraryShelfPixelArt.js y drawLibraryShelf() en WorldScene.js);
   * conservan exactamente su id/x/y/width/height original. Se añade
   * mobiliario nuevo puramente decorativo: 4 mesas de lectura (una por
   * cada hueco entre estanterías, con banco a ambos lados del tablero --
   * ver libraryReadingTablePixelArt.js) y 1 escalera, más 1 emblema
   * central que ocupa el corredor caminable a propósito (es una
   * decoración de suelo, el jugador se dibuja siempre por encima, ver
   * render() en WorldScene.js -- no bloquea nada).
   *
   * Ronda de composición (misma PR): `library-ladder` se solapa a
   * propósito 8px (y152-y160) con `library-shelves-west-upper` para
   * leerse como apoyada SOBRE la estantería en vez de solo tocando su
   * borde -- se pinta después en `decorations`, así que el orden de
   * pintado ya la deja por delante sin cambios adicionales en
   * renderForegroundDecorations(). Es la única excepción de solape
   * intencional de todo el mapa (ver el test dedicado en
   * tests/content/WorldMaps.test.js).
   */
  decorations: [
    {
      id: "library-shelves-northwest",
      type: "library-shelf",
      x: 48,
      y: 48,
      width: 144,
      height: 32,
    },
    {
      id: "library-shelves-northeast",
      type: "library-shelf",
      x: 288,
      y: 48,
      width: 144,
      height: 32,
    },
    {
      id: "library-shelves-west-upper",
      type: "library-shelf",
      x: 48,
      y: 128,
      width: 112,
      height: 32,
    },
    {
      id: "library-shelves-east-upper",
      type: "library-shelf",
      x: 320,
      y: 128,
      width: 112,
      height: 32,
    },
    {
      id: "library-shelves-west-lower",
      type: "library-shelf",
      x: 48,
      y: 208,
      width: 112,
      height: 32,
    },
    {
      id: "library-shelves-east-lower",
      type: "library-shelf",
      x: 320,
      y: 208,
      width: 112,
      height: 32,
    },
    {
      id: "library-reading-table-northwest",
      type: "library-reading-table",
      x: 64,
      y: 84,
      width: 64,
      height: 40,
    },
    {
      id: "library-reading-table-northeast",
      type: "library-reading-table",
      x: 352,
      y: 84,
      width: 64,
      height: 40,
    },
    {
      id: "library-reading-table-south",
      type: "library-reading-table",
      x: 352,
      y: 248,
      width: 64,
      height: 40,
    },
    {
      id: "library-reading-table-southwest",
      type: "library-reading-table",
      x: 80,
      y: 248,
      width: 64,
      height: 40,
    },
    {
      id: "library-ladder",
      type: "library-ladder",
      x: 140,
      y: 152,
      width: 16,
      height: 36,
    },
    {
      id: "library-emblem",
      type: "library-emblem",
      x: 200,
      y: 176,
      width: 80,
      height: 40,
    },
  ],
});

const ARCHIVE = createMap({
  id: "archive",
  name: "Archivo",
  width: 24,
  height: 16,
  palette: {
    groundA: "#74685b",
    groundB: "#807365",
    wall: "#443d3c",
    wallTop: "#766b61",
    water: "#4f7b79",
  },
  solidRegions: [
    { x: 2, y: 3, width: 5, height: 2 },
    { x: 17, y: 3, width: 5, height: 2 },
    { x: 2, y: 8, width: 4, height: 2 },
    { x: 18, y: 8, width: 4, height: 2 },
    { x: 11, y: 7, width: 2, height: 2 },
  ],
  objects: [
    {
      id: "archive-criteria-table",
      type: "table",
      x: 176,
      y: 112,
      width: 32,
      height: 24,
      interactionRadius: 30,
      label: "Mesa de criterios",
    },
    {
      id: "archive-to-library",
      type: "exit",
      x: 176,
      y: 224,
      width: 32,
      height: 16,
      interactionRadius: 30,
      label: "Biblioteca del Margen",
      targetMapId: "library",
      targetPlayerState: {
        x: 416,
        y: 176,
        facing: "left",
      },
    },
    {
      id: "ambient-archive-clerk",
      type: "npc",
      x: 40,
      y: 180,
      width: 14,
      height: 18,
      interactionRadius: 28,
      label: "Persona ordenando expedientes",
    },
    {
      id: "ambient-archive-researcher",
      type: "npc",
      x: 245,
      y: 168,
      width: 14,
      height: 18,
      interactionRadius: 28,
      label: "Persona revisando documentos",
    },
  ],
  /*
   * Cobertura de "Archivo -- Visual Polish" (v1.1, solo archive): pase
   * puramente visual, sin tocar colisión -- decorations nunca alimenta
   * solidTiles (ver createMap() más arriba), cero solidRegions nuevas. Las
   * 4 estanterías/cajas existentes migran del tipo compartido
   * "tables" (rama genérica de decoraciones que hoy no usa ningún mapa)
   * a dos tipos exclusivos que se
   * distinguen entre sí: "archive-shelf" (estanterías de libros, ver
   * archiveShelfPixelArt.js) para las dos del norte, y "archive-crates"
   * (cajas/documentos apilados con etiqueta, ver archiveCratesPixelArt.js)
   * para las dos del centro -- conservan exactamente su id/x/y/
   * width/height original. Se añaden 2 mesas de consulta puramente
   * decorativas ("archive-consultation-table", ver
   * archiveConsultationTablePixelArt.js -- mismo patrón que
   * library-reading-table, con banco a ambos lados y documentos sobre el
   * tablero), una a cada lado del escritorio central
   * (archive-criteria-table, que conserva su geometría/interacción
   * exactas y recibe un tratamiento visual propio por-id en
   * renderObjects(), ver WorldScene.js y archiveDeskPixelArt.js).
   *
   * Geometría verificada sin solapes (ver tests/content/WorldMaps.test.js):
   * archive-table-west (x108-156,y124-164) deja 12px de margen frente a
   * archive-boxes-west (x32-96) y archive-table-east (x228-276,y124-164)
   * deja 12px de margen frente a archive-boxes-east (x288-352).
   *
   * IMPORTANTE -- el margen relevante frente al escritorio central NO se
   * mide contra el hitbox declarado de archive-criteria-table (x176-208):
   * su sprite visual (ver archiveDeskPixelArt.js, ARCHIVE_DESK_PIXEL_WIDTH
   * = 48) desborda 8px por lado ese hitbox de 32px de ancho
   * (offsetX = (48-32)/2 = 8, ver drawArchiveDesk() en WorldScene.js), así
   * que el escritorio ocupa visualmente x168-216, no x176-208. Razonar el
   * margen solo sobre el hitbox declarado (12px) escondía que el margen
   * visual real era de apenas 4px, y las mesas se veían encajonadas contra
   * el escritorio pese a que las coordenadas "cuadraban" sobre el papel.
   * Con las anchuras actuales (48px por mesa, antes 56px), archive-table-west
   * deja 12px frente al borde visual izquierdo del escritorio (168-156) y
   * archive-table-east deja 12px frente a su borde visual derecho
   * (228-216) -- margen real, no solo declarado, en los 4 puntos de
   * contacto. Ninguna de las dos toca el spawn por defecto (192,192), el
   * punto de interacción real del escritorio (192,145) ni la salida a
   * Biblioteca (x176-208,y224-240).
   *
   * "Archivo -- Environmental NPC Pass" (v1.1, tras el visual polish de
   * arriba): se añaden 2 NPC ambientales estáticos sin nombre propio
   * ("ambient-archive-clerk" junto a las cajas oeste, "ambient-archive-
   * researcher" junto a la mesa de consulta este), mismo mecanismo ya
   * cerrado en Plaza/Seven Bridges Walk/Biblioteca (renderNpc()/
   * drawGenericNpc* en WorldScene.js, NAMED_NPC_PALETTES en
   * characterPalettes.js). Ninguna de las dos toca solidRegions/
   * decorations/los 2 objects preexistentes -- ver
   * tests/content/WorldMaps.test.js para la verificación exhaustiva de
   * no-solape (incluido, de forma explícita, contra el footprint visual
   * real del escritorio central x168-216,y96-144, no solo su hitbox
   * declarado).
   */
  decorations: [
    {
      id: "archive-shelves-northwest",
      type: "archive-shelf",
      x: 32,
      y: 48,
      width: 80,
      height: 32,
    },
    {
      id: "archive-shelves-northeast",
      type: "archive-shelf",
      x: 272,
      y: 48,
      width: 80,
      height: 32,
    },
    {
      id: "archive-boxes-west",
      type: "archive-crates",
      x: 32,
      y: 128,
      width: 64,
      height: 32,
    },
    {
      id: "archive-boxes-east",
      type: "archive-crates",
      x: 288,
      y: 128,
      width: 64,
      height: 32,
    },
    {
      id: "archive-table-west",
      type: "archive-consultation-table",
      x: 108,
      y: 124,
      width: 48,
      height: 40,
    },
    {
      id: "archive-table-east",
      type: "archive-consultation-table",
      x: 228,
      y: 124,
      width: 48,
      height: 40,
    },
  ],
});

export const WORLD_MAPS = {
  [AXIOM_PLAZA.id]: AXIOM_PLAZA,
  [SEVEN_BRIDGES_WALK.id]: SEVEN_BRIDGES_WALK,
  [LIBRARY.id]: LIBRARY,
  [ARCHIVE.id]: ARCHIVE,
};

export function getWorldMap(mapId) {
  const map = WORLD_MAPS[mapId];

  if (!map) {
    throw new Error(`No existe el mapa "${mapId}".`);
  }

  return map;
}

function createMap({
  id,
  name,
  width,
  height,
  palette,
  dawnPalette = null,
  solidRegions = [],
  objects = [],
  decorations = [],
}) {
  const solidTiles = createBorderTiles(width, height);

  for (const region of solidRegions) {
    addSolidRegion(solidTiles, width, region);
  }

  return {
    id,
    name,
    tileSize: TILE_SIZE,
    width,
    height,
    worldWidth: width * TILE_SIZE,
    worldHeight: height * TILE_SIZE,
    solidTiles: [...solidTiles],
    palette,
    dawnPalette,
    objects,
    decorations,
  };
}

function createBorderTiles(width, height) {
  const tiles = new Set();

  for (let x = 0; x < width; x += 1) {
    tiles.add(toIndex(x, 0, width));
    tiles.add(toIndex(x, height - 1, width));
  }

  for (let y = 0; y < height; y += 1) {
    tiles.add(toIndex(0, y, width));
    tiles.add(toIndex(width - 1, y, width));
  }

  return tiles;
}

function addSolidRegion(tiles, mapWidth, region) {
  for (let y = region.y; y < region.y + region.height; y += 1) {
    for (let x = region.x; x < region.x + region.width; x += 1) {
      tiles.add(toIndex(x, y, mapWidth));
    }
  }
}

function toIndex(x, y, width) {
  return y * width + x;
}
