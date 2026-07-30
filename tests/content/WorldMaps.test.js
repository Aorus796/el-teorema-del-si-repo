import assert from "node:assert/strict";
import test from "node:test";
import {
  WORLD_MAPS,
  getWorldMap,
} from "../../src/content/worldMaps.js";
import { GameState } from "../../src/state/GameState.js";
import { CollisionMap } from "../../src/world/CollisionMap.js";

test("el registro contiene las cuatro localizaciones obligatorias", () => {
  assert.deepEqual(
    Object.keys(WORLD_MAPS).sort(),
    ["archive", "axiom-plaza", "library", "seven-bridges-walk"],
  );
});

test("archive es compacto, tiene mesa inerte y salida a la Biblioteca", () => {
  const map = getWorldMap("archive");
  const table = map.objects.find(
    (object) => object.id === "archive-criteria-table",
  );
  const exit = map.objects.find(
    (object) => object.id === "archive-to-library",
  );

  assert.equal(map.name, "Archivo");
  assert.ok(map.width <= 30);
  assert.ok(map.height <= 20);
  assert.ok(map.solidTiles.length > 0);
  assert.equal(table?.type, "table");
  assert.equal(exit?.targetMapId, "library");
});

test("la aparición inicial de archive es transitable y no solapa objetos", () => {
  assertSpawnIsClear("archive");
});

test("getWorldMap devuelve un mapa completo por identificador", () => {
  const map = getWorldMap("axiom-plaza");

  assert.equal(map.id, "axiom-plaza");
  assert.equal(map.tileSize, 16);
  assert.equal(map.worldWidth, map.width * map.tileSize);
  assert.equal(map.worldHeight, map.height * map.tileSize);
  assert.ok(Array.isArray(map.solidTiles));
  assert.ok(Array.isArray(map.objects));
});

test("getWorldMap rechaza identificadores desconocidos", () => {
  assert.throws(
    () => getWorldMap("unknown-map"),
    /No existe el mapa/,
  );
});

test("los objetos tienen identificadores únicos dentro de cada mapa", () => {
  for (const map of Object.values(WORLD_MAPS)) {
    const objectIds = map.objects.map((object) => object.id);

    assert.equal(
      new Set(objectIds).size,
      objectIds.length,
      `Objetos duplicados en ${map.id}`,
    );
  }
});

test("las salidas apuntan a mapas registrados", () => {
  for (const map of Object.values(WORLD_MAPS)) {
    const exits = map.objects.filter(
      (object) => object.type === "exit",
    );

    for (const exit of exits) {
      assert.ok(
        WORLD_MAPS[exit.targetMapId],
        `${map.id}:${exit.id} apunta a ${exit.targetMapId}`,
      );
      assert.ok(exit.targetPlayerState);
    }
  }
});

test("library es un mapa compacto con salida y Silogio", () => {
  const map = getWorldMap("library");

  assert.equal(map.name, "Biblioteca");
  assert.equal(map.width, 30);
  assert.equal(map.height, 20);
  assert.ok(map.solidTiles.length > 0);

  const exit = map.objects.find(
    (object) => object.id === "library-to-seven-bridges",
  );
  const silogio = map.objects.find(
    (object) => object.id === "library-silogio",
  );

  assert.equal(exit?.type, "exit");
  assert.equal(exit?.targetMapId, "seven-bridges-walk");
  assert.equal(silogio?.type, "npc");
  assert.equal(silogio?.label, "Silogio");
});

test("la posición inicial de library es transitable y no solapa objetos", () => {
  assertSpawnIsClear("library");
});

function assertSpawnIsClear(mapId) {
  const map = getWorldMap(mapId);
  const playerState = new GameState().getPlayerState(mapId);
  const collisionMap = new CollisionMap({
    width: map.width,
    height: map.height,
    tileSize: map.tileSize,
    solidTiles: map.solidTiles,
  });
  const playerBounds = {
    x: playerState.x - 5,
    y: playerState.y - 7,
    width: 10,
    height: 14,
  };

  assert.equal(collisionMap.collides(playerBounds), false);

  for (const object of map.objects) {
    assert.equal(
      rectanglesOverlap(playerBounds, object),
      false,
      `La aparición solapa ${object.id}`,
    );
  }
}

function rectanglesOverlap(first, second) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}
