const TILE_SIZE = 16;
const WIDTH = 40;
const HEIGHT = 24;

const solidTiles = [];

for (let x = 0; x < WIDTH; x += 1) {
  solidTiles.push(toIndex(x, 0));
  solidTiles.push(toIndex(x, HEIGHT - 1));
}

for (let y = 0; y < HEIGHT; y += 1) {
  solidTiles.push(toIndex(0, y));
  solidTiles.push(toIndex(WIDTH - 1, y));
}

for (let x = 5; x <= 14; x += 1) {
  solidTiles.push(toIndex(x, 6));
}

for (let y = 10; y <= 18; y += 1) {
  solidTiles.push(toIndex(20, y));
}

for (let x = 24; x <= 34; x += 1) {
  if (x !== 29) {
    solidTiles.push(toIndex(x, 15));
  }
}

export const DEV_MAP = {
  id: "dev-room",
  tileSize: TILE_SIZE,
  width: WIDTH,
  height: HEIGHT,
  worldWidth: WIDTH * TILE_SIZE,
  worldHeight: HEIGHT * TILE_SIZE,
  solidTiles,
  objects: [
    {
      id: "prototype-sign",
      type: "sign",
      x: 176,
      y: 144,
      width: 18,
      height: 18,
      interactionRadius: 28,
    },
  ],
};

function toIndex(x, y) {
  return y * WIDTH + x;
}
