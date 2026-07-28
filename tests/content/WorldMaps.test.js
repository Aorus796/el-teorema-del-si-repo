import assert from "node:assert/strict";
import test from "node:test";
import {
  WORLD_MAPS,
  getWorldMap,
} from "../../src/content/worldMaps.js";

test("el registro contiene la Plaza y el Paseo de los Siete Puentes", () => {
  assert.deepEqual(
    Object.keys(WORLD_MAPS).sort(),
    ["axiom-plaza", "seven-bridges-walk"],
  );
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
