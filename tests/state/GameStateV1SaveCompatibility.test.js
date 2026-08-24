import assert from "node:assert/strict";
import test from "node:test";
import { GameState } from "../../src/state/GameState.js";
import {
  LIBRARY_CATALOGUE_NOTEBOOK_ENTRY,
} from "../../src/progression/LibraryCatalogueProgression.js";
import {
  ARCHIVE_FINAL_EVIDENCE_ENTRY,
  EPILOGUE_COMBINATION_CLUE_ENTRY,
} from "../../src/progression/ArchiveCriteriaProgression.js";

/*
 * Cobertura de compatibilidad con guardados reales de v1.0.0 (tag
 * `v1.0.0`, commit ff0c72b9cba30ec98cbccb7a5c32b70b5dfdd733) -- no una
 * prueba de migración. src/state/GameState.js no ha cambiado ni un byte
 * desde ese tag (confirmado con `git diff v1.0.0 HEAD --
 * src/state/GameState.js`, sin salida) y SAVE_FORMAT_VERSION ya era 4 en
 * el tag: v1.0.0 nunca llegó a producir guardados de los formatos legacy
 * 1/2/3, ya obsoletos en el momento del lanzamiento.
 *
 * Estos tres fixtures reproducen, campo a campo, la forma exacta que
 * `GameState.toSaveData()` producía en la build publicada de v1.0.0 en
 * tres puntos distintos de una partida real (justo tras leer el tablón
 * de preparativos, a mitad del primer puzle, y con los tres puzles y el
 * código del regalo resueltos pero el epílogo sin completar). El riesgo
 * que cubren no es de serialización -- el formato de guardado no cambió
 * -- sino de integración: que algo del pulido visual, los NPCs
 * ambientales o los mapas rediseñados de v1.1 rompiera silenciosamente
 * la restauración de una posición, bandera o progreso histórico real.
 */

function buildCaseAFixture() {
  return {
    formatVersion: 4,
    savedAt: "2026-08-11T00:00:00.000Z",
    scene: "world",
    player: { x: 240, y: 192, facing: "up" },
    world: {
      currentMapId: "axiom-plaza",
      playerByMap: {
        "axiom-plaza": { x: 240, y: 192, facing: "up" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 192, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: false,
      preparationsBoardRead: true,
      brideNoteReceived: false,
      sevenBridgesUnlocked: false,
      p2EvidenceFound: false,
      libraryObjectiveUnlocked: false,
      archiveUnlocked: false,
      investigationComplete: false,
      epilogueUnlocked: false,
      epilogueStarted: false,
      giftCodeSolved: false,
      epilogueCompleted: false,
    },
    objectiveId: "speak-to-corolaria",
    notebook: [],
    puzzles: {
      p2: {
        lifecycle: { id: "p2-bridges", status: "ready", attemptCount: 0 },
        phase: "planning",
        closedBridgeId: null,
        currentNode: "E",
        route: ["E"],
        usedBridgeIds: [],
        hintsRead: [],
        failureCode: null,
      },
      libraryCatalogue: {
        order: ["C", "M", "A", "R", "D"],
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": null,
          "followed-trail": null,
          "never-disagreed": null,
          "someone-refuses-now": null,
          "present-choice": null,
          "universal-future": null,
        },
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
    },
  };
}

/*
 * A diferencia de Case A, el `lifecycle.id` de P2 se incluye
 * explícitamente aquí (a diferencia del fixture sintético usado en
 * tests/e2e/game.spec.js:1522-1585, que lo omite a propósito para
 * ejercitar la tolerancia de restore() a un campo ausente): un guardado
 * real de v1.0.0 siempre lo contiene, porque P2State.toSaveData() ->
 * PuzzleLifecycle.toSaveData() lo serializa siempre. Igualmente,
 * `hintsRead` se deja en `[]` (no en `[1]`): así es exactamente como
 * aparece hoy en tests/e2e/game.spec.js para ese mismo punto de
 * progreso -- verificado leyendo el archivo, no citado de memoria.
 *
 * `playerByMap["seven-bridges-walk"]` (y `player`, que refleja la misma
 * posición porque el jugador está físicamente en ese mapa en este punto
 * de la partida) usan (256,176): verificado con CollisionMap real
 * (hitbox de Player 10x14 centrado) que esa coordenada da
 * `collides()===false` tanto contra el mapa v1.1 actual como contra el
 * mapa real de v1.0.0 (`git show v1.0.0:src/content/worldMaps.js`,
 * `solidRegions` de `seven-bridges-walk`). (348,145), usada aquí en una
 * ronda anterior, colisiona con la `solidRegion` `{x:20,y:8,width:5,
 * height:12}` de v1.0.0 -- esa zona solo se volvió transitable tras el
 * rediseño del río en v1.1 (hoy es la isla "pier-center"), así que un
 * guardado real de v1.0.0 nunca pudo contener esa posición.
 * `playerByMap.archive` usa el valor por defecto exacto de
 * `DEFAULT_PLAYER_BY_MAP.archive` en src/state/GameState.js
 * (`{x:192,y:192,facing:"up"}`) en vez de una posición custom, porque
 * `flags.archiveUnlocked` es `false` en este punto de la partida: el
 * jugador nunca visitó el Archivo.
 */
function buildCaseBFixture() {
  return {
    formatVersion: 4,
    savedAt: "2026-08-11T00:00:00.000Z",
    scene: "world",
    player: { x: 256, y: 176, facing: "down" },
    world: {
      currentMapId: "seven-bridges-walk",
      playerByMap: {
        "axiom-plaza": { x: 240, y: 192, facing: "up" },
        "seven-bridges-walk": { x: 256, y: 176, facing: "down" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 192, y: 192, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: false,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: false,
      libraryObjectiveUnlocked: false,
      archiveUnlocked: false,
      investigationComplete: false,
      epilogueUnlocked: false,
      epilogueStarted: false,
      giftCodeSolved: false,
      epilogueCompleted: false,
    },
    objectiveId: "investigate-seven-bridges",
    notebook: [
      {
        id: "bride-note",
        title: "Nota encontrada en la habitación",
        text:
          "Antes de mañana tengo que comprobar una cosa. Si no he vuelto al anochecer, sigue el camino de los siete puentes. No confíes en el mapa completo: uno de ellos nunca estuvo abierto.",
      },
    ],
    puzzles: {
      p2: {
        lifecycle: { id: "p2-bridges", status: "active", attemptCount: 1 },
        phase: "traversing",
        closedBridgeId: "B1",
        currentNode: "R",
        route: ["E", "R"],
        usedBridgeIds: ["B2"],
        hintsRead: [],
        failureCode: null,
      },
      libraryCatalogue: {
        order: ["C", "M", "A", "R", "D"],
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": null,
          "followed-trail": null,
          "never-disagreed": null,
          "someone-refuses-now": null,
          "present-choice": null,
          "universal-future": null,
        },
        phase: "ready",
        hintsRead: [],
        attemptCount: 0,
        failureCode: null,
      },
    },
  };
}

/*
 * Puzles resueltos con la misma ruta P2/catálogo/archiveCriteria que ya
 * valida buildEpilogueReadySaveData() en tests/e2e/game.spec.js (~línea
 * 2449), pero con las banderas y el objectiveId de un punto posterior de
 * la partida: código del regalo ya resuelto (giftCodeSolved=true),
 * epílogo iniciado pero no completado. `lifecycle.id` se añade por el
 * mismo motivo que en Case B.
 *
 * A diferencia de Case B, aquí `flags.archiveUnlocked` es `true` (el
 * jugador sí visitó el Archivo), así que `playerByMap.archive` sí debe
 * ser una posición custom: (224,176), cerca de la mesa de criterios
 * (`archive-criteria-table`, x176-208/y112-136) pero fuera de su
 * `solidRegion` (`{x:11,y:7,width:2,height:2}`, tiles x176-208/y112-144).
 * Verificado con CollisionMap real (hitbox de Player 10x14 centrado)
 * que da `collides()===false`. La geometría de `archive` no cambió entre
 * v1.0.0 y v1.1 (solo se retocó visualmente, ver comentario en
 * src/content/worldMaps.js junto a `ARCHIVE`), así que basta con
 * verificar contra el mapa actual.
 */
function buildCaseCFixture() {
  return {
    formatVersion: 4,
    savedAt: "2026-08-11T00:00:00.000Z",
    scene: "world",
    player: { x: 576, y: 325, facing: "up" },
    world: {
      currentMapId: "axiom-plaza",
      playerByMap: {
        "axiom-plaza": { x: 576, y: 325, facing: "up" },
        "seven-bridges-walk": { x: 48, y: 192, facing: "right" },
        library: { x: 240, y: 256, facing: "up" },
        archive: { x: 224, y: 176, facing: "up" },
      },
    },
    flags: {
      examinedPrototypeSign: true,
      preparationsBoardRead: true,
      brideNoteReceived: true,
      sevenBridgesUnlocked: true,
      p2EvidenceFound: true,
      libraryObjectiveUnlocked: true,
      archiveUnlocked: true,
      investigationComplete: true,
      epilogueUnlocked: true,
      epilogueStarted: true,
      giftCodeSolved: true,
      epilogueCompleted: false,
    },
    objectiveId: "epilogue-meet-bride",
    notebook: [
      {
        id: "bride-note",
        title: "Nota encontrada en la habitación",
        text:
          "Antes de mañana tengo que comprobar una cosa. Si no he vuelto al anochecer, sigue el camino de los siete puentes. No confíes en el mapa completo: uno de ellos nunca estuvo abierto.",
      },
      {
        id: "library-clue",
        title: "La marca de la biblioteca",
        text:
          "La anotación encontrada junto al embarcadero contiene dos arcos entrelazados y una referencia al archivo de mapas de la Biblioteca del Margen.",
      },
      {
        id: "p2-bridges-solution",
        title: "El paseo imposible",
        text:
          "No era necesario cruzar los siete puentes. Al reconocer cuál estaba cerrado, los seis restantes formaban un recorrido posible desde la entrada hasta el molino.",
      },
      { ...LIBRARY_CATALOGUE_NOTEBOOK_ENTRY },
      { ...ARCHIVE_FINAL_EVIDENCE_ENTRY },
      { ...EPILOGUE_COMBINATION_CLUE_ENTRY },
    ],
    puzzles: {
      p2: {
        lifecycle: { id: "p2-bridges", status: "solved", attemptCount: 1 },
        phase: "solved",
        closedBridgeId: "B1",
        currentNode: "L",
        route: ["E", "R", "N", "L", "R", "M", "L"],
        usedBridgeIds: ["B2", "B3", "B6", "B7", "B4", "B5"],
        hintsRead: [1],
        failureCode: null,
      },
      libraryCatalogue: {
        order: ["A", "D", "R", "C", "M"],
        phase: "solved",
        hintsRead: [1],
        attemptCount: 1,
        failureCode: null,
      },
      archiveCriteria: {
        verdicts: {
          "voluntary-entry": "confirmed",
          "followed-trail": "confirmed",
          "never-disagreed": "contradicted",
          "someone-refuses-now": "contradicted",
          "present-choice": "confirmed",
          "universal-future": "undecidable",
        },
        phase: "solved",
        hintsRead: [1],
        attemptCount: 1,
        failureCode: null,
      },
    },
  };
}

const KNOWN_TOP_LEVEL_FIELDS = [
  "formatVersion",
  "savedAt",
  "scene",
  "player",
  "world",
  "flags",
  "objectiveId",
  "notebook",
  "puzzles",
].sort();

const KNOWN_PUZZLE_FIELDS = [
  "p2",
  "libraryCatalogue",
  "archiveCriteria",
].sort();

function captureObservableState(state) {
  return {
    scene: state.scene,
    world: structuredClone(state.world),
    player: structuredClone(state.player),
    flags: structuredClone(state.flags),
    objectiveId: state.objectiveId,
    notebook: structuredClone(state.notebook),
    puzzles: {
      p2: state.puzzles.p2.toSaveData(),
      libraryCatalogue: state.puzzles.libraryCatalogue.toSaveData(),
      archiveCriteria: state.puzzles.archiveCriteria.toSaveData(),
    },
  };
}

test("Caso A: un guardado real de v1.0.0 justo tras leer el tablón de preparativos carga correctamente en el runtime v1.1", () => {
  const fixture = buildCaseAFixture();

  assert.deepEqual(Object.keys(fixture).sort(), KNOWN_TOP_LEVEL_FIELDS);
  assert.deepEqual(
    Object.keys(fixture.puzzles).sort(),
    KNOWN_PUZZLE_FIELDS,
  );

  const state = new GameState();
  assert.doesNotThrow(() => state.restore(fixture));

  assert.equal(state.world.currentMapId, "axiom-plaza");
  assert.deepEqual(
    state.getPlayerState(),
    fixture.world.playerByMap["axiom-plaza"],
  );
  assert.deepEqual(
    state.getPlayerState("library"),
    fixture.world.playerByMap.library,
  );

  assert.deepEqual(state.flags, fixture.flags);
  assert.equal(state.objectiveId, fixture.objectiveId);
  assert.deepEqual(state.notebook, fixture.notebook);

  assert.deepEqual(state.puzzles.p2.toSaveData(), fixture.puzzles.p2);
  assert.deepEqual(
    state.puzzles.libraryCatalogue.toSaveData(),
    fixture.puzzles.libraryCatalogue,
  );
  assert.deepEqual(
    state.puzzles.archiveCriteria.toSaveData(),
    fixture.puzzles.archiveCriteria,
  );

  const firstSave = captureObservableState(state);
  const roundTripState = new GameState();
  assert.doesNotThrow(() => roundTripState.restore(state.toSaveData()));
  assert.deepEqual(captureObservableState(roundTripState), firstSave);
});

test("Caso B: un guardado real de v1.0.0 a mitad del primer puzle de los Siete Puentes carga correctamente en el runtime v1.1", () => {
  const fixture = buildCaseBFixture();

  assert.deepEqual(Object.keys(fixture).sort(), KNOWN_TOP_LEVEL_FIELDS);
  assert.deepEqual(
    Object.keys(fixture.puzzles).sort(),
    KNOWN_PUZZLE_FIELDS,
  );

  const state = new GameState();
  assert.doesNotThrow(() => state.restore(fixture));

  assert.equal(state.world.currentMapId, "seven-bridges-walk");
  assert.deepEqual(
    state.getPlayerState(),
    fixture.world.playerByMap["seven-bridges-walk"],
  );
  assert.deepEqual(
    state.getPlayerState("axiom-plaza"),
    fixture.world.playerByMap["axiom-plaza"],
  );

  assert.deepEqual(state.flags, fixture.flags);
  assert.equal(state.objectiveId, fixture.objectiveId);
  assert.deepEqual(state.notebook, fixture.notebook);

  assert.deepEqual(state.puzzles.p2.toSaveData(), fixture.puzzles.p2);
  assert.deepEqual(
    state.puzzles.libraryCatalogue.toSaveData(),
    fixture.puzzles.libraryCatalogue,
  );
  assert.deepEqual(
    state.puzzles.archiveCriteria.toSaveData(),
    fixture.puzzles.archiveCriteria,
  );

  const firstSave = captureObservableState(state);
  const roundTripState = new GameState();
  assert.doesNotThrow(() => roundTripState.restore(state.toSaveData()));
  assert.deepEqual(captureObservableState(roundTripState), firstSave);

  /*
   * Anti-aliasing: mutar el fixture original tras restaurar no debe
   * alterar el estado ya restaurado (mismo patrón que
   * tests/state/GameState.test.js:514-519,817).
   */
  const before = captureObservableState(state);
  fixture.flags.brideNoteReceived = false;
  fixture.notebook[0].text = "mutado";
  fixture.puzzles.p2.route.push("X");
  fixture.puzzles.p2.usedBridgeIds.push("X");
  fixture.world.playerByMap["seven-bridges-walk"].x = 999;
  assert.deepEqual(captureObservableState(state), before);
});

test("Caso C: un guardado real de v1.0.0 con los tres puzles y el código del regalo resueltos (epílogo no completado) carga correctamente en el runtime v1.1", () => {
  const fixture = buildCaseCFixture();

  assert.deepEqual(Object.keys(fixture).sort(), KNOWN_TOP_LEVEL_FIELDS);
  assert.deepEqual(
    Object.keys(fixture.puzzles).sort(),
    KNOWN_PUZZLE_FIELDS,
  );

  const state = new GameState();
  assert.doesNotThrow(() => state.restore(fixture));

  /*
   * giftCodeSolved=true fuerza currentMapId a axiom-plaza (comportamiento
   * de producción existente, no cambia con este fixture): el fixture ya
   * declara axiom-plaza como currentMapId, así que esto confirma que no
   * hubo ningún cambio de mapa inesperado, no que el forzado no ocurriera.
   */
  assert.equal(state.world.currentMapId, "axiom-plaza");
  assert.deepEqual(
    state.getPlayerState(),
    fixture.world.playerByMap["axiom-plaza"],
  );
  assert.deepEqual(
    state.getPlayerState("library"),
    fixture.world.playerByMap.library,
  );

  assert.deepEqual(state.flags, fixture.flags);
  assert.equal(state.objectiveId, fixture.objectiveId);
  assert.deepEqual(state.notebook, fixture.notebook);

  assert.deepEqual(state.puzzles.p2.toSaveData(), fixture.puzzles.p2);
  assert.deepEqual(
    state.puzzles.libraryCatalogue.toSaveData(),
    fixture.puzzles.libraryCatalogue,
  );
  assert.deepEqual(
    state.puzzles.archiveCriteria.toSaveData(),
    fixture.puzzles.archiveCriteria,
  );

  const firstSave = captureObservableState(state);
  const roundTripState = new GameState();
  assert.doesNotThrow(() => roundTripState.restore(state.toSaveData()));
  assert.deepEqual(captureObservableState(roundTripState), firstSave);

  /*
   * Anti-aliasing: mutar el fixture original tras restaurar no debe
   * alterar el estado ya restaurado (mismo patrón que
   * tests/state/GameState.test.js:514-519,817).
   */
  const before = captureObservableState(state);
  fixture.flags.epilogueStarted = false;
  fixture.notebook[0].text = "mutado";
  fixture.puzzles.libraryCatalogue.order[0] = "X";
  fixture.puzzles.archiveCriteria.hintsRead.push(9);
  fixture.world.playerByMap["axiom-plaza"].x = 1;
  assert.deepEqual(captureObservableState(state), before);
});
