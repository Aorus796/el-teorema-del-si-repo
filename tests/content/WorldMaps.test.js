import assert from "node:assert/strict";
import test from "node:test";
import {
  WORLD_MAPS,
  getWorldMap,
} from "../../src/content/worldMaps.js";
import { GameState } from "../../src/state/GameState.js";
import { CollisionMap } from "../../src/world/CollisionMap.js";
import { Player } from "../../src/world/Player.js";

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

test("la posición inicial de axiom-plaza es transitable y no solapa objetos", () => {
  assertSpawnIsClear("axiom-plaza");
});

test("la posición inicial de seven-bridges-walk es transitable y no solapa objetos", () => {
  assertSpawnIsClear("seven-bridges-walk");
});

test("axiom-plaza tiene exactamente un mecanismo del regalo del epílogo como mesa inerte", () => {
  const map = getWorldMap("axiom-plaza");
  const mechanisms = map.objects.filter(
    (object) => object.id === "epilogue-gift-mechanism",
  );

  assert.equal(mechanisms.length, 1);

  const [mechanism] = mechanisms;

  assert.equal(mechanism.type, "table");
  assert.equal(typeof mechanism.label, "string");
  assert.ok(mechanism.label.length > 0);
});

test("el mecanismo del regalo del epílogo no colisiona ni solapa nada en axiom-plaza", () => {
  assertObjectIsClear("axiom-plaza", "epilogue-gift-mechanism");
});

test("el mecanismo del regalo del epílogo es alcanzable a pie desde el punto de aparición de axiom-plaza", () => {
  assertObjectIsReachable("axiom-plaza", "epilogue-gift-mechanism");
});

test("axiom-plaza tiene exactamente un bride-epilogue como npc con requiresFlag giftCodeSolved", () => {
  const map = getWorldMap("axiom-plaza");
  const brides = map.objects.filter(
    (object) => object.id === "bride-epilogue",
  );

  assert.equal(brides.length, 1);

  const [bride] = brides;

  assert.equal(bride.type, "npc");
  assert.equal(bride.requiresFlag, "giftCodeSolved");
  assert.equal(typeof bride.label, "string");
  assert.ok(bride.label.length > 0);
  assert.ok(bride.interactionRadius > 0);
});

test("bride-epilogue no colisiona ni solapa nada en axiom-plaza", () => {
  assertObjectIsClear("axiom-plaza", "bride-epilogue");
});

test("bride-epilogue es alcanzable a pie desde el punto de aparición de axiom-plaza", () => {
  assertObjectIsReachable("axiom-plaza", "bride-epilogue");
});

test("ningún mapa distinto de axiom-plaza contiene bride-epilogue", () => {
  for (const mapId of ["library", "archive", "seven-bridges-walk"]) {
    const map = getWorldMap(mapId);

    assert.equal(
      map.objects.some((object) => object.id === "bride-epilogue"),
      false,
      `${mapId} no debería contener bride-epilogue`,
    );
  }
});

test("axiom-plaza tiene un dawnPalette distinto de su palette normal en las cinco claves", () => {
  const map = getWorldMap("axiom-plaza");

  assert.ok(map.dawnPalette);
  assert.deepEqual(
    Object.keys(map.dawnPalette).sort(),
    ["groundA", "groundB", "wall", "wallTop", "water"].sort(),
  );

  for (const key of Object.keys(map.palette)) {
    assert.notEqual(
      map.dawnPalette[key],
      map.palette[key],
      `dawnPalette.${key} coincide con palette.${key}`,
    );
  }
});

test("library, archive y seven-bridges-walk no tienen dawnPalette", () => {
  for (const mapId of ["library", "archive", "seven-bridges-walk"]) {
    const map = getWorldMap(mapId);

    assert.equal(map.dawnPalette, null);
  }
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

function assertObjectIsClear(mapId, objectId) {
  const map = getWorldMap(mapId);
  const object = map.objects.find((entry) => entry.id === objectId);

  assert.ok(object, `No existe ${mapId}:${objectId}`);

  const collisionMap = new CollisionMap({
    width: map.width,
    height: map.height,
    tileSize: map.tileSize,
    solidTiles: map.solidTiles,
  });
  const objectBounds = {
    x: object.x,
    y: object.y,
    width: object.width,
    height: object.height,
  };

  assert.equal(collisionMap.collides(objectBounds), false);

  for (const other of map.objects) {
    if (other.id === objectId) {
      continue;
    }

    assert.equal(
      rectanglesOverlap(objectBounds, other),
      false,
      `${objectId} solapa el objeto ${other.id}`,
    );
  }

  for (const decoration of map.decorations) {
    assert.equal(
      rectanglesOverlap(objectBounds, decoration),
      false,
      `${objectId} solapa la decoración ${decoration.id}`,
    );
  }
}

/*
 * Recorre por flood-fill, en incrementos de medio tile, todas las
 * posiciones a las que el jugador podría llegar caminando desde el punto
 * de aparición, usando la misma caja de colisión (Player.getCollisionBox)
 * y las mismas reglas de colisión (CollisionMap.collides) que WorldScene
 * en tiempo real. Falla si ninguna posición alcanzable cae dentro del
 * radio de interacción real del objeto — no basta con que el objeto esté
 * libre de solapes: el camino hasta él debe existir de verdad.
 */
function assertObjectIsReachable(mapId, objectId) {
  const map = getWorldMap(mapId);
  const object = map.objects.find((entry) => entry.id === objectId);

  assert.ok(object, `No existe ${mapId}:${objectId}`);

  const collisionMap = new CollisionMap({
    width: map.width,
    height: map.height,
    tileSize: map.tileSize,
    solidTiles: map.solidTiles,
  });

  const spawn = new GameState().getPlayerState(mapId);
  const player = new Player(spawn);
  const step = map.tileSize / 2;

  const isFree = (x, y) => {
    player.x = x;
    player.y = y;
    return !collisionMap.collides(player.getCollisionBox());
  };

  assert.equal(
    isFree(spawn.x, spawn.y),
    true,
    `El punto de aparición de ${mapId} no es transitable`,
  );

  const objectCenterX = object.x + object.width / 2;
  const objectCenterY = object.y + object.height / 2;
  const isWithinInteractionRange = (x, y) =>
    Math.hypot(x - objectCenterX, y - objectCenterY) <=
    object.interactionRadius;

  const queue = [[spawn.x, spawn.y]];
  const visited = new Set([`${spawn.x},${spawn.y}`]);

  for (let head = 0; head < queue.length; head += 1) {
    const [x, y] = queue[head];

    if (isWithinInteractionRange(x, y)) {
      return;
    }

    for (const [deltaX, deltaY] of [
      [step, 0],
      [-step, 0],
      [0, step],
      [0, -step],
    ]) {
      const nextX = x + deltaX;
      const nextY = y + deltaY;
      const key = `${nextX},${nextY}`;

      if (visited.has(key) || !isFree(nextX, nextY)) {
        continue;
      }

      visited.add(key);
      queue.push([nextX, nextY]);
    }
  }

  assert.fail(
    `No existe un recorrido transitable desde el punto de aparición de ${mapId} hasta el radio de interacción de ${objectId}`,
  );
}

function rectanglesOverlap(first, second) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}
