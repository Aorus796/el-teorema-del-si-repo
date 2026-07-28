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
      label: "Padre de la Investigadora",
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
  ],
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
      id: "banquet-tables-left",
      type: "tables",
      x: 112,
      y: 336,
      width: 128,
      height: 48,
    },
    {
      id: "banquet-tables-right",
      type: "tables",
      x: 496,
      y: 336,
      width: 128,
      height: 48,
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

export const WORLD_MAPS = {
  [AXIOM_PLAZA.id]: AXIOM_PLAZA,
  [SEVEN_BRIDGES_WALK.id]: SEVEN_BRIDGES_WALK,
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
