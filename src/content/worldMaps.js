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
  ],
});

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
    { x: 9, y: 3, width: 5, height: 8 },
    { x: 9, y: 17, width: 5, height: 8 },
    { x: 20, y: 8, width: 5, height: 12 },
    { x: 31, y: 3, width: 5, height: 8 },
    { x: 31, y: 17, width: 5, height: 8 },
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
      label: "Biblioteca",
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
  ],
  decorations: [
    {
      id: "river",
      type: "river",
      x: 144,
      y: 32,
      width: 448,
      height: 384,
    },
    {
      id: "embarcadero",
      type: "dock",
      x: 512,
      y: 288,
      width: 96,
      height: 48,
    },
  ],
});

const LIBRARY = createMap({
  id: "library",
  name: "Biblioteca",
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
  ],
  decorations: [
    {
      id: "library-shelves-northwest",
      type: "tables",
      x: 48,
      y: 48,
      width: 144,
      height: 32,
    },
    {
      id: "library-shelves-northeast",
      type: "tables",
      x: 288,
      y: 48,
      width: 144,
      height: 32,
    },
    {
      id: "library-shelves-west-upper",
      type: "tables",
      x: 48,
      y: 128,
      width: 112,
      height: 32,
    },
    {
      id: "library-shelves-east-upper",
      type: "tables",
      x: 320,
      y: 128,
      width: 112,
      height: 32,
    },
    {
      id: "library-shelves-west-lower",
      type: "tables",
      x: 48,
      y: 208,
      width: 112,
      height: 32,
    },
    {
      id: "library-shelves-east-lower",
      type: "tables",
      x: 320,
      y: 208,
      width: 112,
      height: 32,
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
      label: "Biblioteca",
      targetMapId: "library",
      targetPlayerState: {
        x: 416,
        y: 176,
        facing: "left",
      },
    },
  ],
  decorations: [
    {
      id: "archive-shelves-northwest",
      type: "tables",
      x: 32,
      y: 48,
      width: 80,
      height: 32,
    },
    {
      id: "archive-shelves-northeast",
      type: "tables",
      x: 272,
      y: 48,
      width: 80,
      height: 32,
    },
    {
      id: "archive-boxes-west",
      type: "tables",
      x: 32,
      y: 128,
      width: 64,
      height: 32,
    },
    {
      id: "archive-boxes-east",
      type: "tables",
      x: 288,
      y: 128,
      width: 64,
      height: 32,
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
