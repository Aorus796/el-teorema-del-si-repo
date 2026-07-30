import assert from "node:assert/strict";
import test from "node:test";
import { GameState, SAVE_FORMAT_VERSION } from "../../src/state/GameState.js";
import {
  P2_PHASE,
  P2State,
} from "../../src/puzzles/p2-bridges/P2State.js";
import {
  LIBRARY_CATALOGUE_FAILURE_CODE,
  LIBRARY_CATALOGUE_PHASE,
  LibraryCatalogueState,
} from "../../src/puzzles/library-catalogue/LibraryCatalogueState.js";

const INITIAL_CATALOGUE_DATA = {
  order: ["C", "M", "A", "R", "D"],
  phase: LIBRARY_CATALOGUE_PHASE.READY,
  hintsRead: [],
  attemptCount: 0,
  failureCode: null,
};

const SOLVED_CATALOGUE_ORDER = ["A", "D", "R", "C", "M"];

test("GameState no duplica entradas del cuaderno", () => {
  const state = new GameState();

  assert.equal(state.unlockPrototypeEntry(), true);
  assert.equal(state.unlockPrototypeEntry(), false);
  assert.equal(state.notebook.length, 1);
});

test("GameState restaura una partida valida", () => {
  const state = new GameState();

  state.restore({
    formatVersion: SAVE_FORMAT_VERSION,
    scene: "dev-world",
    player: {
      x: 112,
      y: 96,
      facing: "left",
    },
    flags: {
      examinedPrototypeSign: true,
    },
    puzzles: {
      libraryCatalogue: { ...INITIAL_CATALOGUE_DATA },
    },
    notebook: [
      {
        id: "entry",
        title: "Titulo",
        text: "Texto",
      },
    ],
  });

  assert.deepEqual(state.player, {
    x: 112,
    y: 96,
    facing: "left",
  });
  assert.equal(state.flags.examinedPrototypeSign, true);
  assert.equal(state.notebook.length, 1);
});

test("GameState rechaza versiones incompatibles", () => {
  const state = new GameState();

  assert.throws(
    () =>
      state.restore({
        formatVersion: 999,
      }),
    /no es compatible/,
  );
});

test("GameState guarda y restaura el progreso de P2", () => {
  const originalState = new GameState();

  originalState.puzzles.p2.selectClosedBridge("B1");
  originalState.puzzles.p2.startTraversal();
  originalState.puzzles.p2.registerStep({
    nodeId: "R",
    bridgeId: "B2",
  });

  const restoredState = new GameState();
  restoredState.restore(originalState.toSaveData());

  assert.equal(
    restoredState.puzzles.p2.phase,
    P2_PHASE.TRAVERSING,
  );
  assert.equal(restoredState.puzzles.p2.closedBridgeId, "B1");
  assert.equal(restoredState.puzzles.p2.currentNode, "R");
  assert.deepEqual(restoredState.puzzles.p2.route, ["E", "R"]);
  assert.deepEqual(restoredState.puzzles.p2.usedBridgeIds, ["B2"]);
});

test("GameState no duplica la entrada de cuaderno de P2", () => {
  const state = new GameState();

  assert.equal(state.unlockP2Entry(), true);
  assert.equal(state.unlockP2Entry(), false);
  assert.equal(state.notebook.length, 1);
  assert.equal(state.notebook[0].id, "p2-bridges-solution");
});

test("GameState crea y reinicia un catálogo independiente", () => {
  const firstState = new GameState();
  const secondState = new GameState();

  assert.equal(
    firstState.puzzles.libraryCatalogue instanceof
      LibraryCatalogueState,
    true,
  );
  assert.deepEqual(
    firstState.puzzles.libraryCatalogue.toSaveData(),
    INITIAL_CATALOGUE_DATA,
  );
  assert.notEqual(
    firstState.puzzles.libraryCatalogue,
    secondState.puzzles.libraryCatalogue,
  );
  assert.notEqual(
    firstState.puzzles.libraryCatalogue.order,
    secondState.puzzles.libraryCatalogue.order,
  );
  assert.notEqual(
    firstState.puzzles.libraryCatalogue.hintsRead,
    secondState.puzzles.libraryCatalogue.hintsRead,
  );

  firstState.puzzles.libraryCatalogue =
    new LibraryCatalogueState({
      order: ["M", "C", "A", "R", "D"],
      phase: LIBRARY_CATALOGUE_PHASE.ARRANGING,
      hintsRead: [1],
      attemptCount: 2,
    });

  firstState.reset();

  assert.deepEqual(
    firstState.puzzles.libraryCatalogue.toSaveData(),
    INITIAL_CATALOGUE_DATA,
  );
});

test("GameState serializa el catálogo con copias defensivas", () => {
  const state = new GameState();
  state.player = {
    x: 321,
    y: 123,
    facing: "left",
  };
  state.puzzles.libraryCatalogue =
    new LibraryCatalogueState({
      order: ["M", "C", "A", "R", "D"],
      phase: LIBRARY_CATALOGUE_PHASE.ARRANGING,
      hintsRead: [1, 2],
      attemptCount: 3,
    });

  const catalogueBefore =
    state.puzzles.libraryCatalogue.toSaveData();
  const catalogueInstance = state.puzzles.libraryCatalogue;
  const playerBefore = { ...state.player };
  const worldBefore = structuredClone(state.world);
  const saved = state.toSaveData();
  const serializedCatalogue = saved.puzzles.libraryCatalogue;

  assert.equal(saved.formatVersion, SAVE_FORMAT_VERSION);
  assert.deepEqual(
    Object.keys(serializedCatalogue).sort(),
    [
      "attemptCount",
      "failureCode",
      "hintsRead",
      "order",
      "phase",
    ],
  );
  assert.equal(
    Object.hasOwn(serializedCatalogue, "selectedIndex"),
    false,
  );
  assert.equal(
    Object.hasOwn(serializedCatalogue, "focusedIndex"),
    false,
  );
  assert.equal(
    state.puzzles.libraryCatalogue,
    catalogueInstance,
  );
  assert.deepEqual(state.player, playerBefore);
  assert.deepEqual(state.world, worldBefore);
  assert.deepEqual(saved.player, playerBefore);
  assert.deepEqual(
    saved.world.playerByMap[state.world.currentMapId],
    playerBefore,
  );
  assert.deepEqual(
    state.puzzles.libraryCatalogue.toSaveData(),
    catalogueBefore,
  );

  serializedCatalogue.order[0] = "A";
  serializedCatalogue.hintsRead.push(3);

  assert.deepEqual(
    state.puzzles.libraryCatalogue.toSaveData(),
    catalogueBefore,
  );
});

test("GameState restaura las cuatro fases válidas del catálogo", () => {
  const catalogueCases = [
    { ...INITIAL_CATALOGUE_DATA },
    {
      order: ["M", "C", "A", "R", "D"],
      phase: LIBRARY_CATALOGUE_PHASE.ARRANGING,
      hintsRead: [1],
      attemptCount: 2,
      failureCode: null,
    },
    {
      order: ["C", "M", "A", "R", "D"],
      phase: LIBRARY_CATALOGUE_PHASE.FAILED,
      hintsRead: [1, 2],
      attemptCount: 3,
      failureCode:
        LIBRARY_CATALOGUE_FAILURE_CODE.CONSTRAINTS_NOT_SATISFIED,
    },
    {
      order: SOLVED_CATALOGUE_ORDER,
      phase: LIBRARY_CATALOGUE_PHASE.SOLVED,
      hintsRead: [1, 2, 3],
      attemptCount: 4,
      failureCode: null,
    },
  ];

  for (const catalogueData of catalogueCases) {
    const saved = new GameState().toSaveData();
    saved.puzzles.libraryCatalogue = {
      ...catalogueData,
      order: [...catalogueData.order],
      hintsRead: [...catalogueData.hintsRead],
    };

    const restored = new GameState();
    restored.restore(saved);

    assert.equal(
      restored.puzzles.libraryCatalogue instanceof
        LibraryCatalogueState,
      true,
    );
    assert.deepEqual(
      restored.puzzles.libraryCatalogue.toSaveData(),
      catalogueData,
    );
    assert.notEqual(
      restored.puzzles.libraryCatalogue.order,
      saved.puzzles.libraryCatalogue.order,
    );
    assert.notEqual(
      restored.puzzles.libraryCatalogue.hintsRead,
      saved.puzzles.libraryCatalogue.hintsRead,
    );

    saved.puzzles.libraryCatalogue.order[0] = "X";
    saved.puzzles.libraryCatalogue.hintsRead.push(3);
    assert.deepEqual(
      restored.puzzles.libraryCatalogue.toSaveData(),
      catalogueData,
    );
  }
});

test("GameState rechaza catálogos ausentes o inválidos en formato 3", () => {
  const invalidCases = [
    (saved) => {
      delete saved.puzzles.libraryCatalogue;
    },
    (saved) => {
      saved.puzzles.libraryCatalogue = null;
    },
    (saved) => {
      saved.puzzles.libraryCatalogue = [];
    },
    (saved) => {
      saved.puzzles.libraryCatalogue = "invalid";
    },
    (saved) => {
      saved.puzzles.libraryCatalogue = 42;
    },
    (saved) => {
      delete saved.puzzles.libraryCatalogue.hintsRead;
    },
    (saved) => {
      saved.puzzles.libraryCatalogue.selectedIndex = 0;
    },
    (saved) => {
      saved.puzzles.libraryCatalogue.order = ["C", "M"];
    },
    (saved) => {
      saved.puzzles.libraryCatalogue.phase = "unknown";
    },
    (saved) => {
      saved.puzzles.libraryCatalogue.hintsRead = [1, 3];
    },
    (saved) => {
      saved.puzzles.libraryCatalogue.attemptCount = -1;
    },
    (saved) => {
      saved.puzzles.libraryCatalogue.attemptCount = 1.5;
    },
    (saved) => {
      saved.puzzles.libraryCatalogue.attemptCount = "1";
    },
    (saved) => {
      saved.puzzles.libraryCatalogue.failureCode = "unknown";
    },
    (saved) => {
      saved.puzzles.libraryCatalogue.phase =
        LIBRARY_CATALOGUE_PHASE.FAILED;
      saved.puzzles.libraryCatalogue.failureCode = null;
    },
    (saved) => {
      saved.puzzles.libraryCatalogue.phase =
        LIBRARY_CATALOGUE_PHASE.SOLVED;
      saved.puzzles.libraryCatalogue.order = [
        "C",
        "M",
        "A",
        "R",
        "D",
      ];
    },
  ];

  for (const makeInvalid of invalidCases) {
    const saved = new GameState().toSaveData();
    makeInvalid(saved);

    const state = new GameState();
    assert.throws(
      () => state.restore(saved),
      /catálogo/i,
    );
  }
});

test("GameState migra explícitamente los formatos 1 y 2", () => {
  const p2 = new P2State();
  p2.selectClosedBridge("B1");
  p2.revealNextHint();
  p2.startTraversal();
  p2.registerStep({
    nodeId: "R",
    bridgeId: "B2",
  });
  const p2Data = p2.toSaveData();

  const legacyCases = [
    {
      formatVersion: 1,
      expectedPlayer: {
        x: 91,
        y: 92,
        facing: "left",
      },
      player: {
        x: 91,
        y: 92,
        facing: "left",
      },
      world: {
        currentMapId: "seven-bridges-walk",
      },
    },
    {
      formatVersion: 2,
      expectedPlayer: {
        x: 71,
        y: 72,
        facing: "up",
      },
      player: {
        x: 1,
        y: 2,
        facing: "down",
      },
      world: {
        currentMapId: "seven-bridges-walk",
        playerByMap: {
          "seven-bridges-walk": {
            x: 71,
            y: 72,
            facing: "up",
          },
        },
      },
    },
  ];

  for (const legacyCase of legacyCases) {
    const saved = {
      formatVersion: legacyCase.formatVersion,
      scene: "world",
      player: legacyCase.player,
      world: legacyCase.world,
      flags: {
        examinedPrototypeSign: true,
        preparationsBoardRead: true,
        brideNoteReceived: true,
        sevenBridgesUnlocked: true,
        p2EvidenceFound: true,
        libraryObjectiveUnlocked: true,
      },
      objectiveId: "legacy-objective",
      notebook: [
        {
          id: "legacy-entry",
          title: "Entrada histórica",
          text: "Contenido conservado",
        },
      ],
      puzzles: {
        p2: p2Data,
        libraryCatalogue: {
          invalid: "Los formatos anteriores no leen este campo.",
        },
      },
    };

    const restored = new GameState();
    restored.restore(saved);

    assert.deepEqual(
      restored.getPlayerState(),
      legacyCase.expectedPlayer,
    );
    assert.equal(restored.objectiveId, "legacy-objective");
    assert.equal(restored.notebook.length, 1);
    assert.equal(restored.notebook[0].id, "legacy-entry");
    assert.equal(restored.flags.p2EvidenceFound, true);
    assert.equal(
      restored.flags.libraryObjectiveUnlocked,
      true,
    );
    assert.equal(
      Object.hasOwn(restored.flags, "archiveUnlocked"),
      false,
    );
    assert.deepEqual(
      restored.puzzles.p2.toSaveData(),
      p2Data,
    );
    assert.deepEqual(
      restored.puzzles.libraryCatalogue.toSaveData(),
      INITIAL_CATALOGUE_DATA,
    );
  }
});
