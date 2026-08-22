import assert from "node:assert/strict";
import test from "node:test";
import {
  WORLD_MAPS,
  getWorldMap,
} from "../../src/content/worldMaps.js";
import { PARTNER_NAME } from "../../src/content/personalizationConfig.js";
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
  assert.equal(bride.label, PARTNER_NAME);
  assert.ok(bride.interactionRadius > 0);
});

test("bride-epilogue ya no usa el label heredado \"La Investigadora\"", () => {
  const map = getWorldMap("axiom-plaza");
  const bride = map.objects.find((object) => object.id === "bride-epilogue");

  assert.notEqual(bride?.label, "La Investigadora");
});

test("bride-father tiene el label coherente con su hablante real en los diálogos", () => {
  const map = getWorldMap("axiom-plaza");
  const father = map.objects.find((object) => object.id === "bride-father");

  assert.equal(father?.type, "npc");
  assert.equal(father?.label, "Padre de la novia");
  assert.notEqual(father?.label, "Padre de la Investigadora");
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

/*
 * Cobertura de "Plaza Visual Polish" (v1.1, solo axiom-plaza): la
 * decoración nueva es puramente visual -- decorations nunca alimenta
 * solidTiles (ver createMap() más abajo) -- así que estos tests protegen
 * justo lo que un cambio meramente visual podría romper por accidente:
 * geometría de colisión, objetos/NPCs existentes, y solapes nuevos.
 */
test("axiom-plaza conserva los mismos solidTiles que antes de la decoración y suma los 4 NPCs ambientales nuevos", () => {
  const map = getWorldMap("axiom-plaza");

  assert.equal(map.solidTiles.length, 238);
  assert.equal(map.objects.length, 15);
  assert.equal(
    map.objects.filter((object) => object.type === "npc").length,
    8,
    "Plaza del Axioma -- NPCs ambientales suma 4 NPC sin nombre propio a los 4 ya existentes",
  );
});

test("los 4 NPCs ambientales nuevos de axiom-plaza no tienen requiresFlag y no solapan nada", () => {
  const map = getWorldMap("axiom-plaza");
  const ambientIds = [
    "ambient-florist-altar",
    "ambient-setup-helper",
    "ambient-waiter-tables",
    "ambient-guest-bench",
  ];

  const ambientObjects = ambientIds.map((id) =>
    map.objects.find((object) => object.id === id),
  );

  for (const object of ambientObjects) {
    assert.ok(object, "falta uno de los NPCs ambientales nuevos");
    assert.equal(object.type, "npc");
    assert.equal(object.requiresFlag, undefined);
  }

  const ids = ambientObjects.map((object) => object.id);
  assert.equal(new Set(ids).size, ids.length);

  for (const objectId of ambientIds) {
    assertObjectIsClear("axiom-plaza", objectId);
  }
});

test("ninguno de los 4 NPCs ambientales nuevos de axiom-plaza solapa el rectángulo de aparición del jugador", () => {
  const map = getWorldMap("axiom-plaza");
  const playerState = new GameState().getPlayerState("axiom-plaza");
  const spawnBounds = {
    x: playerState.x - 5,
    y: playerState.y - 7,
    width: 10,
    height: 14,
  };
  const ambientIds = [
    "ambient-florist-altar",
    "ambient-setup-helper",
    "ambient-waiter-tables",
    "ambient-guest-bench",
  ];

  for (const objectId of ambientIds) {
    const object = map.objects.find((entry) => entry.id === objectId);

    assert.equal(
      rectanglesOverlap(spawnBounds, object),
      false,
      `${objectId} solapa la aparición del jugador`,
    );
  }
});

test("axiom-plaza tiene entre 3 y 5 mesas de boda redondas ('wedding-table')", () => {
  const map = getWorldMap("axiom-plaza");
  const weddingTables = map.decorations.filter(
    (decoration) => decoration.type === "wedding-table",
  );

  assert.ok(
    weddingTables.length >= 3 && weddingTables.length <= 5,
    `se esperaban entre 3 y 5 mesas, hay ${weddingTables.length}`,
  );
});

test("library y archive conservan su decoración 'tables' original (rama compartida, no tocada por Plaza Visual Polish)", () => {
  for (const mapId of ["library", "archive"]) {
    const map = getWorldMap(mapId);
    const tables = map.decorations.filter(
      (decoration) => decoration.type === "tables",
    );

    assert.ok(
      tables.length > 0,
      `${mapId} debería seguir teniendo decoraciones "tables"`,
    );
  }
});

test("ninguna decoración de axiom-plaza solapa ningún objeto interactuable, con o sin giftCodeSolved", () => {
  const map = getWorldMap("axiom-plaza");
  // Se comprueban TODAS las decoraciones del mapa (no solo las de esta
  // tarea): más robusto frente a futuras rondas de densidad visual, que no
  // tendrán que acordarse de ampliar una lista de tipos aquí.
  const newDecorations = map.decorations;

  assert.ok(
    newDecorations.length > 20,
    "se esperaba una Plaza con densidad visual (más de 20 decoraciones)",
  );

  for (const decoration of newDecorations) {
    for (const object of map.objects) {
      assert.equal(
        rectanglesOverlap(decoration, object),
        false,
        `la decoración nueva ${decoration.id} solapa el objeto ${object.id}`,
      );
    }
  }
});

/*
 * Ninguno de los tests anteriores compara decoraciones ENTRE SÍ (solo
 * decoración-contra-objeto y decoración-contra-spawn) -- este test cierra
 * ese hueco, encontrado en la segunda ronda de densidad visual (una
 * guirnalda nueva solapaba una jardinera ya existente sin que ningún test
 * lo detectara). Única excepción intencional: una guirnalda ("garland")
 * puede solapar un farol ("lamp-post") -- están diseñados para tocarse,
 * la bunting se cuelga literalmente del farol.
 */
test("ninguna decoración de axiom-plaza solapa otra decoración, salvo guirnaldas apoyadas en faroles", () => {
  const map = getWorldMap("axiom-plaza");
  const isAllowedPair = (a, b) =>
    (a.type === "garland" && b.type === "lamp-post") ||
    (a.type === "lamp-post" && b.type === "garland");

  for (let i = 0; i < map.decorations.length; i += 1) {
    for (let j = i + 1; j < map.decorations.length; j += 1) {
      const first = map.decorations[i];
      const second = map.decorations[j];

      if (isAllowedPair(first, second)) {
        continue;
      }

      assert.equal(
        rectanglesOverlap(first, second),
        false,
        `la decoración ${first.id} solapa la decoración ${second.id}`,
      );
    }
  }
});

test("ninguna decoración nueva de axiom-plaza solapa el rectángulo de aparición del jugador", () => {
  const map = getWorldMap("axiom-plaza");
  const playerState = new GameState().getPlayerState("axiom-plaza");
  const spawnBounds = {
    x: playerState.x - 5,
    y: playerState.y - 7,
    width: 10,
    height: 14,
  };

  for (const decoration of map.decorations) {
    assert.equal(
      rectanglesOverlap(spawnBounds, decoration),
      false,
      `la decoración ${decoration.id} solapa la aparición del jugador`,
    );
  }
});

test("bride-epilogue sigue siendo alcanzable a pie desde el punto de entrada real del recorrido del epílogo, no solo desde el spawn por defecto", () => {
  // (576, 325): punto de entrada real usado por tests/e2e/game.spec.js tras
  // resolver el mecanismo del regalo, cerca de epilogue-gift-mechanism
  // (560,296) -- no el spawn por defecto (240,192). La zona de faroles/
  // mesas nuevas de la derecha queda deliberadamente lejos de este
  // corredor (ver el comentario de las decorations en worldMaps.js).
  assertObjectIsReachable("axiom-plaza", "bride-epilogue", {
    x: 576,
    y: 325,
  });
});

/*
 * Cobertura de "Seven Bridges Visual Polish" (v1.1, solo
 * seven-bridges-walk). Segunda ronda de esta tarea, que sustituye por
 * completo la primera: la ronda anterior dejaba "river" (decoración, zona
 * AZUL) transitable de verdad y "pier" (restyle visual de solidRegions ya
 * existentes, zona GRIS) bloqueado de verdad -- exactamente al revés de lo
 * que un jugador espera de agua/piedra. Esta ronda invierte la relación:
 * solidRegions ahora cubre el cauce de agua real, y "pier"/"bridge"/"dock"
 * son transitables de verdad porque su footprint cae fuera de
 * solidRegions (ver el comentario de geometría en worldMaps.js). Estos
 * tests protegen tanto la geometría de colisión real (agua bloqueada,
 * paseo/puentes libres) como lo que un cambio meramente visual podría
 * romper por accidente: objetos existentes, solapes nuevos y accesibilidad
 * real desde los dos puntos de entrada reales del mapa (desde Plaza y
 * desde Biblioteca, ver GameState.js y el exit de library hacia este
 * mapa).
 */
test("seven-bridges-walk conserva exactamente los mismos objetos y tiene los solidTiles reales del cauce invertido", () => {
  const map = getWorldMap("seven-bridges-walk");

  // 600 = 140 tiles de borde + la unión (sin duplicados) de los 11
  // solidRegions reales de worldMaps.js, que cubren el cauce del río salvo
  // el corredor de piedra/puentes -- ver el comentario de geometría junto
  // a SEVEN_BRIDGES_WALK. Verificado por separado con un script de
  // referencia fuera de este repositorio; este test es la fuente de
  // verdad automatizada. No cambia con los 3 NPC ambientales de esta
  // ronda: decorations/objects nunca alimentan solidTiles (ver createMap()
  // en worldMaps.js).
  assert.equal(map.solidTiles.length, 600);
  assert.deepEqual(
    map.objects.map((object) => ({ id: object.id, type: object.type })),
    [
      { id: "seven-bridges-to-plaza", type: "exit" },
      { id: "p2-bridge-board", type: "puzzle" },
      { id: "p2-evidence", type: "evidence" },
      { id: "seven-bridges-to-library", type: "exit" },
      { id: "blocked-mill-path", type: "blocked-exit" },
      { id: "ambient-fisher-dock", type: "npc" },
      { id: "ambient-riverside-stroller", type: "npc" },
      { id: "ambient-bench-watcher", type: "npc" },
    ],
  );
});

/*
 * Regresión directa del contrato de #58 (Seven Bridges Visual Polish): los
 * 5 objects originales conservan id/type/x/y/width/height/label exactos --
 * y, para los exits, también targetMapId/targetPlayerState -- tras añadir
 * los 3 NPC ambientales nuevos al final de la lista.
 */
test("los 5 objetos originales de seven-bridges-walk (#58) conservan su geometría, label y destino exactos", () => {
  const map = getWorldMap("seven-bridges-walk");

  assert.deepEqual(
    map.objects.find((object) => object.id === "seven-bridges-to-plaza"),
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
      targetPlayerState: { x: 688, y: 256, facing: "left" },
    },
  );
  assert.deepEqual(map.objects.find((object) => object.id === "p2-bridge-board"), {
    id: "p2-bridge-board",
    type: "puzzle",
    x: 336,
    y: 112,
    width: 24,
    height: 24,
    interactionRadius: 32,
    label: "Mapa de los siete puentes",
  });
  assert.deepEqual(map.objects.find((object) => object.id === "p2-evidence"), {
    id: "p2-evidence",
    type: "evidence",
    x: 544,
    y: 304,
    width: 20,
    height: 20,
    interactionRadius: 30,
    label: "Anotación junto al embarcadero",
  });
  assert.deepEqual(
    map.objects.find((object) => object.id === "seven-bridges-to-library"),
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
      targetPlayerState: { x: 240, y: 256, facing: "up" },
    },
  );
  assert.deepEqual(map.objects.find((object) => object.id === "blocked-mill-path"), {
    id: "blocked-mill-path",
    type: "blocked-exit",
    x: 656,
    y: 160,
    width: 16,
    height: 64,
    interactionRadius: 30,
    label: "Camino del molino",
  });
});

/*
 * Cobertura de los 3 NPC ambientales de Seven Bridges Walk (v1.1), mismo
 * mecanismo que los 4 de Plaza del Axioma: sin requiresFlag, sin colisión
 * contra solidTiles reales, sin solape con ningún otro object (incluidos
 * los otros dos NPC nuevos entre sí).
 *
 * ambient-fisher-dock queda deliberadamente sobre "embarcadero" (dock) --
 * no se reutiliza assertObjectIsClear() para él porque ese helper comprueba
 * solape contra TODAS las decorations sin excepción, y "dock" está
 * explícitamente excluido de las comprobaciones de solape en el resto de
 * este archivo (mismo criterio que ya usa p2-evidence, ver
 * EXCLUDED_FROM_OVERLAP_CHECKS más abajo).
 */
const SEVEN_BRIDGES_AMBIENT_NPC_IDS = [
  "ambient-fisher-dock",
  "ambient-riverside-stroller",
  "ambient-bench-watcher",
];

test("los 3 NPC ambientales nuevos de seven-bridges-walk no tienen requiresFlag, son ids únicos de tipo npc y no colisionan con solidTiles reales", () => {
  const map = getWorldMap("seven-bridges-walk");
  const collisionMap = new CollisionMap({
    width: map.width,
    height: map.height,
    tileSize: map.tileSize,
    solidTiles: map.solidTiles,
  });

  const ambientObjects = SEVEN_BRIDGES_AMBIENT_NPC_IDS.map((id) =>
    map.objects.find((object) => object.id === id),
  );

  for (const object of ambientObjects) {
    assert.ok(object, "falta uno de los NPCs ambientales nuevos");
    assert.equal(object.type, "npc");
    assert.equal(object.requiresFlag, undefined);
    assert.equal(
      collisionMap.collides({
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
      }),
      false,
      `${object.id} colisiona con solidTiles reales`,
    );
  }

  const ids = ambientObjects.map((object) => object.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("los 3 NPC ambientales nuevos de seven-bridges-walk no solapan ningún otro object del mapa, entre sí incluidos", () => {
  const map = getWorldMap("seven-bridges-walk");

  for (const objectId of SEVEN_BRIDGES_AMBIENT_NPC_IDS) {
    const object = map.objects.find((entry) => entry.id === objectId);

    for (const other of map.objects) {
      if (other.id === objectId) {
        continue;
      }

      assert.equal(
        rectanglesOverlap(object, other),
        false,
        `${objectId} solapa el objeto ${other.id}`,
      );
    }
  }
});

test("ambient-riverside-stroller y ambient-bench-watcher no solapan ninguna decoración del mapa", () => {
  const map = getWorldMap("seven-bridges-walk");
  const ids = ["ambient-riverside-stroller", "ambient-bench-watcher"];

  for (const objectId of ids) {
    const object = map.objects.find((entry) => entry.id === objectId);

    for (const decoration of map.decorations) {
      assert.equal(
        rectanglesOverlap(object, decoration),
        false,
        `${objectId} solapa la decoración ${decoration.id}`,
      );
    }
  }
});

test("ambient-fisher-dock no solapa ninguna decoración de primer plano del mapa (excluye 'river'/'dock', capas de fondo con solapes intencionados en todo este mapa)", () => {
  const map = getWorldMap("seven-bridges-walk");
  const object = map.objects.find(
    (entry) => entry.id === "ambient-fisher-dock",
  );

  // "river" (capa de fondo que cubre casi todo el cauce) y "dock"
  // (embarcadero, sobre el que se apoya a propósito, igual que la nota
  // "p2-evidence" original) ya están excluidos del resto de comprobaciones
  // de solape de este archivo -- ver EXCLUDED_FROM_OVERLAP_CHECKS más abajo.
  for (const decoration of map.decorations) {
    if (EXCLUDED_FROM_OVERLAP_CHECKS.has(decoration.type)) {
      continue;
    }

    assert.equal(
      rectanglesOverlap(object, decoration),
      false,
      `ambient-fisher-dock solapa la decoración ${decoration.id}`,
    );
  }
});

for (const objectId of SEVEN_BRIDGES_AMBIENT_NPC_IDS) {
  test(`${objectId} es alcanzable a pie desde el spawn por defecto de seven-bridges-walk`, () => {
    assertObjectIsReachable("seven-bridges-walk", objectId);
  });

  test(`${objectId} es alcanzable a pie desde la entrada real llegando desde Biblioteca`, () => {
    assertObjectIsReachable("seven-bridges-walk", objectId, {
      x: 624,
      y: 304,
    });
  });
}

test("cada decoración 'pier' de seven-bridges-walk es realmente transitable (ya no un restyle de bloques sólidos) y hay exactamente 3", () => {
  const map = getWorldMap("seven-bridges-walk");
  const solidTileSet = new Set(map.solidTiles);
  const piers = map.decorations.filter(
    (decoration) => decoration.type === "pier",
  );

  assert.equal(
    piers.length,
    3,
    "seven-bridges-walk debe tener 3 piezas de piedra: orilla oeste, isla central, orilla este",
  );

  for (const pier of piers) {
    const tileX0 = pier.x / map.tileSize;
    const tileY0 = pier.y / map.tileSize;
    const tileX1 = (pier.x + pier.width) / map.tileSize - 1;
    const tileY1 = (pier.y + pier.height) / map.tileSize - 1;

    for (let tileY = tileY0; tileY <= tileY1; tileY += 1) {
      for (let tileX = tileX0; tileX <= tileX1; tileX += 1) {
        const index = tileY * map.width + tileX;

        assert.equal(
          solidTileSet.has(index),
          false,
          `${pier.id}: el tile (${tileX},${tileY}) es sólido -- el pilar dibujado debería ser piedra transitable, no agua bloqueada`,
        );
      }
    }
  }
});

/*
 * La ronda anterior tenía un test de orden de capas entre "pier" y "dock"
 * (embarcadero se apoyaba, a propósito, sobre "pier-right-bottom" -- mismo
 * solidRegion real que compartían antes de que "pier" existiera como
 * decoración -- así que el pilar opaco necesitaba dibujarse ANTES para no
 * taparlo). Con la geometría nueva, pier-east termina en la fila 15
 * (y=256) y "embarcadero" empieza en la fila 18 (y=288): ya no se solapan
 * en absoluto (ver worldMaps.js), así que ese test dejó de tener nada que
 * comprobar -- un bucle vacío que nunca se ejecuta no es cobertura real.
 * Se elimina en vez de mantenerlo como falso positivo silencioso.
 */

/*
 * Regresión de un hallazgo real de `reviewer`: los dos "bridge" no cubrían
 * el canal de agua real entre columnas de pilares (bridge-west empezaba
 * 16px dentro de la orilla oeste, bridge-east dejaba el 83% del canal real
 * sin decorar) -- un defecto puramente aritmético que ningún test de
 * solape (AABB) detectaba, porque las muescas verticales entre pilares no
 * son sólidas y por tanto no hay overlap con nada. Este test no comprueba
 * "no solapa" (insuficiente, ver arriba): comprueba que cada "bridge"
 * encaja borde con borde, exactamente, entre las dos columnas de pilares
 * que dice conectar -- ni corto (dejando agua sin cubrir) ni desplazado
 * (invadiendo tierra o el pilar).
 */
test("cada 'bridge' de seven-bridges-walk cubre EXACTAMENTE el canal de agua real entre sus dos columnas de pilares, borde con borde", () => {
  const map = getWorldMap("seven-bridges-walk");
  const pierById = Object.fromEntries(
    map.decorations
      .filter((decoration) => decoration.type === "pier")
      .map((pier) => [pier.id, pier]),
  );
  const bridgeById = Object.fromEntries(
    map.decorations
      .filter((decoration) => decoration.type === "bridge")
      .map((bridge) => [bridge.id, bridge]),
  );

  assert.equal(Object.keys(bridgeById).length, 2);

  const pierLeft = pierById["pier-west"];
  const pierCenter = pierById["pier-center"];
  const pierRight = pierById["pier-east"];
  const bridgeWest = bridgeById["bridge-west"];
  const bridgeEast = bridgeById["bridge-east"];

  assert.ok(pierLeft && pierCenter && pierRight && bridgeWest && bridgeEast);

  assert.equal(
    bridgeWest.x,
    pierLeft.x + pierLeft.width,
    "bridge-west debe empezar exactamente donde termina la columna de pilares izquierda",
  );
  assert.equal(
    bridgeWest.x + bridgeWest.width,
    pierCenter.x,
    "bridge-west debe terminar exactamente donde empieza el pilar central",
  );

  assert.equal(
    bridgeEast.x,
    pierCenter.x + pierCenter.width,
    "bridge-east debe empezar exactamente donde termina el pilar central",
  );
  assert.equal(
    bridgeEast.x + bridgeEast.width,
    pierRight.x,
    "bridge-east debe terminar exactamente donde empieza la columna de pilares derecha",
  );
});

/*
 * Contrato visual-colisión explícito (obligatorio para esta ronda): puntos
 * representativos, comprobados directamente contra CollisionMap (no contra
 * la aritmética de solidRegions), de que el agua bloquea de verdad y la
 * piedra/los puentes son transitables de verdad. Cada punto de agua es el
 * centro exacto de uno de los 11 solidRegions reales de worldMaps.js (ver
 * el comentario de geometría junto a SEVEN_BRIDGES_WALK); los puntos de
 * piedra/puente son los centros de sus decoraciones reales.
 */
test("cada centro de un tramo de agua real (solidRegion) colisiona -- el agua bloquea de verdad", () => {
  const map = getWorldMap("seven-bridges-walk");
  const collisionMap = new CollisionMap({
    width: map.width,
    height: map.height,
    tileSize: map.tileSize,
    solidTiles: map.solidTiles,
  });
  const waterRegionCenters = [
    [360, 80], // banda de agua superior (filas 2-7)
    [272, 144], // agua entre orilla oeste y bridge-west (filas 8-9)
    [448, 144], // agua entre bridge-east y orilla este (filas 8-9)
    [272, 232], // agua entre pier-west y pier-center (filas 13-15)
    [448, 232], // agua entre pier-center y pier-east (filas 13-15)
    [232, 272], // agua bajo pier-west, junto a pier-center (filas 16-17)
    [488, 272], // agua bajo pier-east, junto a pier-center (filas 16-17)
    [232, 304], // agua al oeste de pier-center (filas 18-19)
    [456, 304], // agua al este de pier-center, antes del embarcadero (filas 18-19)
    [328, 328], // agua fila 20, tras terminar pier-center
    [360, 376], // banda de agua inferior (filas 21-25)
  ];

  for (const [x, y] of waterRegionCenters) {
    assert.equal(
      collisionMap.collides({ x, y, width: 1, height: 1 }),
      true,
      `el punto (${x},${y}), centro de un tramo de agua real, no colisiona`,
    );
  }
});

test("los centros de pier-west/pier-center/pier-east son transitables -- la piedra no bloquea", () => {
  const map = getWorldMap("seven-bridges-walk");
  const collisionMap = new CollisionMap({
    width: map.width,
    height: map.height,
    tileSize: map.tileSize,
    solidTiles: map.solidTiles,
  });
  const piers = map.decorations.filter(
    (decoration) => decoration.type === "pier",
  );

  assert.equal(piers.length, 3);

  for (const pier of piers) {
    const centerX = pier.x + pier.width / 2;
    const centerY = pier.y + pier.height / 2;

    assert.equal(
      collisionMap.collides({ x: centerX, y: centerY, width: 1, height: 1 }),
      false,
      `${pier.id}: su centro (${centerX},${centerY}) colisiona -- debería ser piedra transitable`,
    );
  }
});

test("el centro de cada 'bridge' y los 4 extremos donde toca su pilar son transitables", () => {
  const map = getWorldMap("seven-bridges-walk");
  const collisionMap = new CollisionMap({
    width: map.width,
    height: map.height,
    tileSize: map.tileSize,
    solidTiles: map.solidTiles,
  });
  const bridges = map.decorations.filter(
    (decoration) => decoration.type === "bridge",
  );

  assert.equal(bridges.length, 2);

  for (const bridge of bridges) {
    const centerY = bridge.y + bridge.height / 2;
    const points = [
      [bridge.x + bridge.width / 2, centerY], // centro del tablero
      [bridge.x + 2, centerY], // extremo que toca el pilar izquierdo
      [bridge.x + bridge.width - 2, centerY], // extremo que toca el pilar derecho
    ];

    for (const [x, y] of points) {
      assert.equal(
        collisionMap.collides({ x, y, width: 1, height: 1 }),
        false,
        `${bridge.id}: el punto (${x},${y}) colisiona -- el tablero debería ser transitable de punta a punta`,
      );
    }
  }
});

/*
 * "river" y "dock" son las dos decoraciones originales del mapa (previas a
 * esta tarea), con solapes intencionados que no son un solape real de
 * primer plano:
 *  - "river" es la capa de fondo (renderBackgroundDecorations, se pinta
 *    antes que solidTiles/objetos/decoración de primer plano, ver
 *    WorldScene.js) y cubre a propósito casi todo el interior navegable,
 *    así que todo lo demás "flota" sobre ella por diseño (p2-bridge-board
 *    y embarcadero ya la solapaban en el mapa original).
 *  - "dock" (embarcadero) es un muelle de madera bajo el cual está la nota
 *    "p2-evidence" ("junto al embarcadero"), a propósito.
 * "pier" se añade a esta misma exclusión desde esta ronda: ya no es un
 * restyle de un bloque sólido (ver más arriba), sino la superficie de
 * piedra/tierra REAL del paseo -- igual que "river" o el suelo de
 * cualquier mapa, otras decoraciones legítimamente "se apoyan" encima de
 * ella (sign-p2-board queda sobre pier-center porque ahí es donde hay
 * tierra firme real, y p2-bridge-board -- objeto, comprobado más abajo --
 * también se apoya en pier-center). No es un solape nuevo de colocación
 * errónea: es la relación esperada entre una superficie base transitable y
 * lo que se coloca sobre ella.
 */
const EXCLUDED_FROM_OVERLAP_CHECKS = new Set(["river", "dock", "pier"]);
const EXCLUDED_FROM_OBJECT_OVERLAP_CHECK = EXCLUDED_FROM_OVERLAP_CHECKS;

test("ninguna decoración de primer plano de seven-bridges-walk solapa ningún objeto interactuable", () => {
  const map = getWorldMap("seven-bridges-walk");
  const foregroundDecorations = map.decorations.filter(
    (decoration) => !EXCLUDED_FROM_OBJECT_OVERLAP_CHECK.has(decoration.type),
  );

  assert.equal(
    map.decorations.length,
    18,
    "2 decoraciones originales (river, embarcadero) + 16 nuevas (3 pier + 2 bridge + 1 boat + 2 path-sign + 2 lamp-post + 2 bench + 4 bush)",
  );

  for (const decoration of foregroundDecorations) {
    for (const object of map.objects) {
      assert.equal(
        rectanglesOverlap(decoration, object),
        false,
        `la decoración ${decoration.id} solapa el objeto ${object.id}`,
      );
    }
  }
});

test("ninguna decoración de primer plano de seven-bridges-walk solapa otra decoración de primer plano", () => {
  const map = getWorldMap("seven-bridges-walk");
  const foregroundDecorations = map.decorations.filter(
    (decoration) => !EXCLUDED_FROM_OVERLAP_CHECKS.has(decoration.type),
  );

  for (let i = 0; i < foregroundDecorations.length; i += 1) {
    for (let j = i + 1; j < foregroundDecorations.length; j += 1) {
      const first = foregroundDecorations[i];
      const second = foregroundDecorations[j];

      assert.equal(
        rectanglesOverlap(first, second),
        false,
        `la decoración ${first.id} solapa la decoración ${second.id}`,
      );
    }
  }
});

test("la aparición por defecto de seven-bridges-walk (llegando desde Plaza) es transitable y no solapa objetos ni decoración nueva", () => {
  assertSpawnIsClear("seven-bridges-walk");

  const map = getWorldMap("seven-bridges-walk");
  const playerState = new GameState().getPlayerState("seven-bridges-walk");
  const spawnBounds = {
    x: playerState.x - 5,
    y: playerState.y - 7,
    width: 10,
    height: 14,
  };

  for (const decoration of map.decorations) {
    assert.equal(
      rectanglesOverlap(spawnBounds, decoration),
      false,
      `la decoración ${decoration.id} solapa la aparición por defecto`,
    );
  }
});

test("el punto de entrada real llegando desde Biblioteca (624,304) es transitable y no solapa objetos ni decoración nueva", () => {
  // Ver el exit de library hacia seven-bridges-walk en worldMaps.js
  // (targetPlayerState: {x:624,y:304}) -- punto de entrada real distinto
  // del spawn por defecto (48,192, llegando desde Plaza).
  const map = getWorldMap("seven-bridges-walk");
  const collisionMap = new CollisionMap({
    width: map.width,
    height: map.height,
    tileSize: map.tileSize,
    solidTiles: map.solidTiles,
  });
  const entryBounds = { x: 624 - 5, y: 304 - 7, width: 10, height: 14 };

  assert.equal(collisionMap.collides(entryBounds), false);

  for (const object of map.objects) {
    assert.equal(rectanglesOverlap(entryBounds, object), false);
  }

  for (const decoration of map.decorations) {
    assert.equal(
      rectanglesOverlap(entryBounds, decoration),
      false,
      `la decoración ${decoration.id} solapa la entrada real desde Biblioteca`,
    );
  }
});

test("el tablero del puzle P2 sigue siendo alcanzable a pie desde el spawn por defecto de seven-bridges-walk", () => {
  assertObjectIsReachable("seven-bridges-walk", "p2-bridge-board");
});

test("el tablero del puzle P2 sigue siendo alcanzable a pie desde la entrada real llegando desde Biblioteca", () => {
  assertObjectIsReachable("seven-bridges-walk", "p2-bridge-board", {
    x: 624,
    y: 304,
  });
});

/*
 * p2-evidence queda cubierta con el mismo helper que el resto de objetos
 * (assertObjectIsReachable()), sin exclusión ni comentario especial -- ver
 * el refinamiento por raymarch del propio helper más abajo, que resuelve
 * el artefacto real de discretización del BFS de paso fijo (8px) sin tener
 * que renunciar a la cobertura de este objeto.
 */
test("p2-evidence es alcanzable a pie desde el spawn por defecto de seven-bridges-walk", () => {
  assertObjectIsReachable("seven-bridges-walk", "p2-evidence");
});

test("p2-evidence es alcanzable a pie desde la entrada real llegando desde Biblioteca", () => {
  assertObjectIsReachable("seven-bridges-walk", "p2-evidence", {
    x: 624,
    y: 304,
  });
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

// Paso del raymarch de refinamiento, en píxeles -- ver el comentario de
// assertObjectIsReachable() más abajo.
const RAYMARCH_STEP_PX = 1;

/*
 * Recorre por flood-fill, en incrementos de medio tile, todas las
 * posiciones a las que el jugador podría llegar caminando desde el punto
 * de aparición, usando la misma caja de colisión (Player.getCollisionBox)
 * y las mismas reglas de colisión (CollisionMap.collides) que WorldScene
 * en tiempo real. Falla si ninguna posición alcanzable cae dentro del
 * radio de interacción real del objeto — no basta con que el objeto esté
 * libre de solapes: el camino hasta él debe existir de verdad.
 *
 * El flood-fill de paso fijo (8px, medio tile) es válido para descartar
 * regiones realmente inalcanzables, pero tiene un artefacto real de
 * discretización: un objeto puede quedar a una fracción de píxel del radio
 * de interacción real desde el nodo libre más cercano de la rejilla (visto
 * con p2-evidence en la ronda anterior de esta misma tarea, ~30.07px desde
 * un radio real de 30), aunque el movimiento continuo real del jugador sí
 * podría alcanzarlo. Por eso, cuando un nodo visitado del BFS queda a
 * menos de `interactionRadius + step*sqrt(2)` del objeto (suficientemente
 * cerca de que un paso diagonal del propio BFS podría, en teoría, cruzar
 * el radio), se complementa con un raymarch en pasos de 1px en línea recta
 * desde ese nodo hacia el centro del objeto, comprobando
 * `collisionMap.collides(player.getCollisionBox())` en cada paso -- si el
 * trayecto entra en el radio de interacción antes de chocar con algo, el
 * objeto es alcanzable de verdad, aunque el BFS de rejilla no lo hubiera
 * detectado por sí solo.
 */
function assertObjectIsReachable(mapId, objectId, fromPosition = null) {
  const map = getWorldMap(mapId);
  const object = map.objects.find((entry) => entry.id === objectId);

  assert.ok(object, `No existe ${mapId}:${objectId}`);

  const collisionMap = new CollisionMap({
    width: map.width,
    height: map.height,
    tileSize: map.tileSize,
    solidTiles: map.solidTiles,
  });

  // Por defecto, desde el punto de aparición del jugador; opcionalmente
  // desde cualquier otro punto real de entrada al mapa (por ejemplo, el
  // punto donde el jugador entra a axiom-plaza tras resolver el mecanismo
  // del regalo, distinto del spawn por defecto).
  const spawn = fromPosition ?? new GameState().getPlayerState(mapId);
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
    `El punto de partida (${spawn.x},${spawn.y}) en ${mapId} no es transitable`,
  );

  const objectCenterX = object.x + object.width / 2;
  const objectCenterY = object.y + object.height / 2;
  const isWithinInteractionRange = (x, y) =>
    Math.hypot(x - objectCenterX, y - objectCenterY) <=
    object.interactionRadius;
  const raymarchThreshold =
    object.interactionRadius + step * Math.SQRT2;

  const canReachByRaymarch = (fromX, fromY) => {
    const totalDistance = Math.hypot(
      objectCenterX - fromX,
      objectCenterY - fromY,
    );

    if (totalDistance === 0) {
      return true;
    }

    const directionX = (objectCenterX - fromX) / totalDistance;
    const directionY = (objectCenterY - fromY) / totalDistance;

    for (
      let travelled = 0;
      travelled <= totalDistance;
      travelled += RAYMARCH_STEP_PX
    ) {
      const x = fromX + directionX * travelled;
      const y = fromY + directionY * travelled;

      if (isWithinInteractionRange(x, y)) {
        return true;
      }

      if (!isFree(x, y)) {
        return false;
      }
    }

    return isWithinInteractionRange(objectCenterX, objectCenterY);
  };

  const queue = [[spawn.x, spawn.y]];
  const visited = new Set([`${spawn.x},${spawn.y}`]);

  for (let head = 0; head < queue.length; head += 1) {
    const [x, y] = queue[head];

    if (isWithinInteractionRange(x, y)) {
      return;
    }

    if (
      Math.hypot(x - objectCenterX, y - objectCenterY) < raymarchThreshold &&
      canReachByRaymarch(x, y)
    ) {
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
