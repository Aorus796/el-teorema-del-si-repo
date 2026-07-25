import assert from "node:assert/strict";
import test from "node:test";
import { CollisionMap } from "../../src/world/CollisionMap.js";

const map = new CollisionMap({
  width: 4,
  height: 3,
  tileSize: 16,
  solidTiles: [5],
});

test("CollisionMap detecta un rectangulo sobre un tile solido", () => {
  assert.equal(
    map.collides({
      x: 17,
      y: 17,
      width: 8,
      height: 8,
    }),
    true,
  );
});

test("CollisionMap permite un rectangulo sobre suelo libre", () => {
  assert.equal(
    map.collides({
      x: 33,
      y: 17,
      width: 8,
      height: 8,
    }),
    false,
  );
});

test("CollisionMap considera solido el exterior del mapa", () => {
  assert.equal(
    map.collides({
      x: -1,
      y: 8,
      width: 4,
      height: 4,
    }),
    true,
  );
});
