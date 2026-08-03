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
import {
  ARCHIVE_CRITERIA_INITIAL_VERDICTS,
  ARCHIVE_CRITERIA_SOLUTION,
  ARCHIVE_CRITERIA_VERDICT,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaData.js";
import {
  ARCHIVE_CRITERIA_FAILURE_CODE,
  ARCHIVE_CRITERIA_PHASE,
  ArchiveCriteriaState,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaState.js";
import {
  ARCHIVE_FINAL_EVIDENCE_ENTRY,
  EPILOGUE_COMBINATION_CLUE_ENTRY,
  START_EPILOGUE_OBJECTIVE_ID,
} from "../../src/progression/ArchiveCriteriaProgression.js";

const INITIAL_CATALOGUE_DATA = {
  order: ["C", "M", "A", "R", "D"],
  phase: LIBRARY_CATALOGUE_PHASE.READY,
  hintsRead: [],
  attemptCount: 0,
  failureCode: null,
};

const SOLVED_CATALOGUE_ORDER = ["A", "D", "R", "C", "M"];

function cloneInitialArchiveCriteriaData() {
  return {
    verdicts: { ...ARCHIVE_CRITERIA_INITIAL_VERDICTS },
    phase: ARCHIVE_CRITERIA_PHASE.READY,
    hintsRead: [],
    attemptCount: 0,
    failureCode: null,
  };
}

const LIBRARY_CATALOGUE_INVALID_CASES = [
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

const ARCHIVE_CRITERIA_INVALID_CASES = [
  (saved) => {
    delete saved.puzzles.archiveCriteria;
  },
  (saved) => {
    saved.puzzles.archiveCriteria = null;
  },
  (saved) => {
    saved.puzzles.archiveCriteria = [];
  },
  (saved) => {
    saved.puzzles.archiveCriteria = "invalid";
  },
  (saved) => {
    saved.puzzles.archiveCriteria = 42;
  },
  (saved) => {
    delete saved.puzzles.archiveCriteria.hintsRead;
  },
  (saved) => {
    saved.puzzles.archiveCriteria.focusedClaimIndex = 0;
  },
  (saved) => {
    saved.puzzles.archiveCriteria.verdicts = {
      "voluntary-entry": null,
    };
  },
  (saved) => {
    saved.puzzles.archiveCriteria.verdicts["voluntary-entry"] =
      "maybe";
  },
  (saved) => {
    saved.puzzles.archiveCriteria.phase = "unknown";
  },
  (saved) => {
    saved.puzzles.archiveCriteria.hintsRead = [1, 3];
  },
  (saved) => {
    saved.puzzles.archiveCriteria.attemptCount = -1;
  },
  (saved) => {
    saved.puzzles.archiveCriteria.attemptCount = 1.5;
  },
  (saved) => {
    saved.puzzles.archiveCriteria.attemptCount = "1";
  },
  (saved) => {
    saved.puzzles.archiveCriteria.failureCode = "unknown";
  },
  (saved) => {
    saved.puzzles.archiveCriteria.phase =
      ARCHIVE_CRITERIA_PHASE.FAILED;
    saved.puzzles.archiveCriteria.failureCode = null;
    saved.puzzles.archiveCriteria.attemptCount = 1;
  },
  (saved) => {
    saved.puzzles.archiveCriteria.phase =
      ARCHIVE_CRITERIA_PHASE.SOLVED;
    saved.puzzles.archiveCriteria.attemptCount = 1;
    // verdicts se quedan en el estado inicial (todo null): no es la solución.
  },
];

/*
 * Cada mutador viola exactamente una de las cuatro invariantes de
 * implicación entre banderas del epílogo (EPILOGUE_SPEC.md §13):
 * epilogueUnlocked ⟹ investigationComplete
 * epilogueStarted  ⟹ epilogueUnlocked
 * giftCodeSolved   ⟹ epilogueStarted
 * epilogueCompleted ⟹ giftCodeSolved
 */
const EPILOGUE_FLAG_INVARIANT_INVALID_CASES = [
  (saved) => {
    saved.flags.investigationComplete = false;
    saved.flags.epilogueUnlocked = true;
  },
  (saved) => {
    saved.flags.epilogueUnlocked = false;
    saved.flags.epilogueStarted = true;
  },
  (saved) => {
    saved.flags.epilogueStarted = false;
    saved.flags.giftCodeSolved = true;
  },
  (saved) => {
    saved.flags.giftCodeSolved = false;
    saved.flags.epilogueCompleted = true;
  },
];

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

/*
 * Un GameState con progreso real no trivial, construido mediante un
 * restore() válido previo: mapa distinto del inicial, banderas activas,
 * cuaderno con entradas y puzzles.p2 con progreso. Sirve para descartar
 * que la atomicidad de restore() solo funcione por coincidencia con los
 * valores por defecto de un GameState recién construido.
 */
function buildProgressedState() {
  const seed = new GameState();
  seed.puzzles.p2.selectClosedBridge("B1");
  seed.puzzles.p2.startTraversal();
  seed.puzzles.p2.registerStep({
    nodeId: "R",
    bridgeId: "B2",
  });

  const saved = seed.toSaveData();
  saved.scene = "world";
  saved.world.currentMapId = "library";
  saved.world.playerByMap.library = { x: 10, y: 20, facing: "left" };
  saved.flags.examinedPrototypeSign = true;
  saved.flags.preparationsBoardRead = true;
  saved.flags.brideNoteReceived = true;
  saved.flags.sevenBridgesUnlocked = true;
  saved.flags.p2EvidenceFound = true;
  saved.flags.libraryObjectiveUnlocked = true;
  saved.objectiveId = "go-to-library";
  saved.notebook = [
    {
      id: "bride-note",
      title: "Nota encontrada en la habitación",
      text: "Texto conservado.",
    },
    {
      id: "library-clue",
      title: "La marca de la biblioteca",
      text: "Texto conservado.",
    },
  ];

  const state = new GameState();
  state.restore(saved);
  return state;
}

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
      archiveCriteria: cloneInitialArchiveCriteriaData(),
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

test("GameState rechaza catálogos ausentes o inválidos en el formato vigente", () => {
  for (const makeInvalid of LIBRARY_CATALOGUE_INVALID_CASES) {
    const saved = new GameState().toSaveData();
    makeInvalid(saved);

    const state = new GameState();
    assert.throws(
      () => state.restore(saved),
      /catálogo/i,
    );
  }
});

test("GameState rechaza archiveCriteria ausente o inválido en el formato vigente", () => {
  for (const makeInvalid of ARCHIVE_CRITERIA_INVALID_CASES) {
    const saved = new GameState().toSaveData();
    makeInvalid(saved);

    const state = new GameState();
    assert.throws(() => state.restore(saved), /Archivo/i);
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
    assert.equal(restored.flags.archiveUnlocked, false);
    assert.equal(restored.flags.investigationComplete, false);
    assert.equal(restored.flags.epilogueUnlocked, false);
    assert.deepEqual(
      restored.puzzles.p2.toSaveData(),
      p2Data,
    );
    assert.deepEqual(
      restored.puzzles.libraryCatalogue.toSaveData(),
      INITIAL_CATALOGUE_DATA,
    );
    assert.equal(
      restored.puzzles.archiveCriteria instanceof ArchiveCriteriaState,
      true,
    );
    assert.deepEqual(
      restored.puzzles.archiveCriteria.toSaveData(),
      cloneInitialArchiveCriteriaData(),
    );
    assert.deepEqual(restored.getPlayerState("library"), {
      x: 240,
      y: 256,
      facing: "up",
    });
  }
});

test("GameState reconcilia un guardado v3 resuelto sin Archivo", () => {
  const saved = new GameState().toSaveData();
  saved.flags.archiveUnlocked = false;
  saved.objectiveId = "go-to-library";
  saved.puzzles.libraryCatalogue = {
    order: SOLVED_CATALOGUE_ORDER,
    phase: LIBRARY_CATALOGUE_PHASE.SOLVED,
    hintsRead: [],
    attemptCount: 1,
    failureCode: null,
  };

  const restored = new GameState();
  restored.restore(saved);

  assert.equal(restored.flags.archiveUnlocked, true);
  assert.equal(
    restored.objectiveId,
    "inspect-archive-criteria-table",
  );
  assert.equal(restored.notebook.length, 1);
  assert.match(restored.notebook[0].text, /A-D-R-C-M/);
  restored.restore(restored.toSaveData());
  assert.equal(restored.notebook.length, 1);
});

test("GameState no retrocede un objetivo posterior al restaurar", () => {
  const saved = new GameState().toSaveData();
  saved.flags.archiveUnlocked = true;
  saved.objectiveId = "start-epilogue";
  saved.notebook = [
    {
      id: "library-catalogue-solution",
      title: "El catálogo perfecto",
      text: "El orden A-D-R-C-M ha restaurado el catálogo.",
    },
  ];
  saved.puzzles.libraryCatalogue = {
    order: SOLVED_CATALOGUE_ORDER,
    phase: LIBRARY_CATALOGUE_PHASE.SOLVED,
    hintsRead: [],
    attemptCount: 1,
    failureCode: null,
  };

  const restored = new GameState();
  restored.restore(saved);

  assert.equal(restored.objectiveId, "start-epilogue");
  assert.equal(restored.notebook.length, 1);
});

test("SAVE_FORMAT_VERSION es 4", () => {
  assert.equal(SAVE_FORMAT_VERSION, 4);
});

test("GameState reset() incluye investigationComplete y epilogueUnlocked en false", () => {
  const state = new GameState();

  assert.equal(state.flags.investigationComplete, false);
  assert.equal(state.flags.epilogueUnlocked, false);
});

test("GameState reset() incluye un archiveCriteria inicial independiente", () => {
  const firstState = new GameState();
  const secondState = new GameState();

  assert.equal(
    firstState.puzzles.archiveCriteria instanceof ArchiveCriteriaState,
    true,
  );
  assert.deepEqual(
    firstState.puzzles.archiveCriteria.toSaveData(),
    cloneInitialArchiveCriteriaData(),
  );
  assert.notEqual(
    firstState.puzzles.archiveCriteria,
    secondState.puzzles.archiveCriteria,
  );
});

test("toSaveData() incluye archiveCriteria con los cinco campos exactos", () => {
  const state = new GameState();
  const saved = state.toSaveData();

  assert.equal(saved.formatVersion, 4);
  assert.deepEqual(
    Object.keys(saved.puzzles.archiveCriteria).sort(),
    ["attemptCount", "failureCode", "hintsRead", "phase", "verdicts"],
  );
  assert.deepEqual(
    saved.puzzles.archiveCriteria,
    cloneInitialArchiveCriteriaData(),
  );
});

test("GameState round-trip de formato 4 para las cuatro fases de archiveCriteria", () => {
  const archiveCriteriaCases = [
    cloneInitialArchiveCriteriaData(),
    {
      verdicts: {
        ...ARCHIVE_CRITERIA_INITIAL_VERDICTS,
        "voluntary-entry": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
      },
      phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
      hintsRead: [1],
      attemptCount: 2,
      failureCode: null,
    },
    {
      verdicts: { ...ARCHIVE_CRITERIA_INITIAL_VERDICTS },
      phase: ARCHIVE_CRITERIA_PHASE.FAILED,
      hintsRead: [1, 2],
      attemptCount: 3,
      failureCode:
        ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION,
    },
    {
      verdicts: { ...ARCHIVE_CRITERIA_SOLUTION },
      phase: ARCHIVE_CRITERIA_PHASE.SOLVED,
      hintsRead: [1, 2, 3],
      attemptCount: 4,
      failureCode: null,
    },
  ];

  for (const archiveCriteriaData of archiveCriteriaCases) {
    const saved = new GameState().toSaveData();
    saved.puzzles.archiveCriteria = {
      ...archiveCriteriaData,
      verdicts: { ...archiveCriteriaData.verdicts },
      hintsRead: [...archiveCriteriaData.hintsRead],
    };

    const restored = new GameState();
    restored.restore(saved);

    assert.equal(
      restored.puzzles.archiveCriteria instanceof ArchiveCriteriaState,
      true,
    );
    assert.deepEqual(
      restored.puzzles.archiveCriteria.toSaveData(),
      archiveCriteriaData,
    );

    saved.puzzles.archiveCriteria.hintsRead.push(9);
    assert.deepEqual(
      restored.puzzles.archiveCriteria.toSaveData(),
      archiveCriteriaData,
    );
  }
});

test("un guardado real de formato 3 conserva mapa, posición, objetivo, cuaderno, banderas y el catálogo real, e inicializa únicamente archiveCriteria", () => {
  const saved = new GameState().toSaveData();
  saved.formatVersion = 3;
  saved.scene = "world";
  saved.world = {
    currentMapId: "archive",
    playerByMap: {
      ...saved.world.playerByMap,
      archive: { x: 200, y: 150, facing: "down" },
    },
  };
  saved.objectiveId = "inspect-archive-criteria-table";
  saved.notebook = [
    {
      id: "library-clue",
      title: "La marca de la biblioteca",
      text: "Texto conservado.",
    },
    {
      id: "library-catalogue-solution",
      title: "El catálogo perfecto",
      text:
        "El orden A-D-R-C-M ha restaurado el catálogo y revelado el acceso al Archivo.",
    },
  ];
  saved.flags.archiveUnlocked = true;
  saved.flags.libraryObjectiveUnlocked = true;
  saved.puzzles.libraryCatalogue = {
    order: SOLVED_CATALOGUE_ORDER,
    phase: LIBRARY_CATALOGUE_PHASE.SOLVED,
    hintsRead: [1, 2, 3],
    attemptCount: 2,
    failureCode: null,
  };

  /*
   * Un guardado real de formato 3 nunca tuvo estas propiedades: se
   * eliminan explícitamente para simular el fixture real (no una
   * versión 4 con datos de más que formatVersion=3 dejaría pasar sin
   * ejercitar de verdad la rama de migración).
   */
  delete saved.flags.investigationComplete;
  delete saved.flags.epilogueUnlocked;
  delete saved.puzzles.archiveCriteria;

  assert.equal(
    Object.hasOwn(saved.flags, "investigationComplete"),
    false,
  );
  assert.equal(Object.hasOwn(saved.flags, "epilogueUnlocked"), false);
  assert.equal(Object.hasOwn(saved.puzzles, "archiveCriteria"), false);

  const expectedPreviousFlags = { ...saved.flags };
  const expectedNotebook = saved.notebook.map((entry) => ({ ...entry }));
  const expectedLibraryCatalogue = {
    ...saved.puzzles.libraryCatalogue,
    order: [...saved.puzzles.libraryCatalogue.order],
    hintsRead: [...saved.puzzles.libraryCatalogue.hintsRead],
  };
  const expectedP2 = structuredClone(saved.puzzles.p2);

  const restored = new GameState();
  restored.restore(saved);

  assert.equal(restored.world.currentMapId, "archive");
  assert.deepEqual(restored.getPlayerState("archive"), {
    x: 200,
    y: 150,
    facing: "down",
  });
  assert.equal(restored.objectiveId, "inspect-archive-criteria-table");

  assert.deepEqual(restored.notebook, expectedNotebook);

  assert.deepEqual(restored.flags, {
    ...expectedPreviousFlags,
    investigationComplete: false,
    epilogueUnlocked: false,
  });

  assert.deepEqual(
    restored.puzzles.libraryCatalogue.toSaveData(),
    expectedLibraryCatalogue,
  );
  assert.notDeepEqual(restored.puzzles.libraryCatalogue.order, [
    "C",
    "M",
    "A",
    "R",
    "D",
  ]);

  assert.deepEqual(restored.puzzles.p2.toSaveData(), expectedP2);

  assert.equal(
    restored.puzzles.archiveCriteria instanceof ArchiveCriteriaState,
    true,
  );
  assert.deepEqual(
    restored.puzzles.archiveCriteria.toSaveData(),
    cloneInitialArchiveCriteriaData(),
  );
  assert.notEqual(
    restored.puzzles.archiveCriteria.phase,
    ARCHIVE_CRITERIA_PHASE.SOLVED,
  );
});

test("restaurar un archiveCriteria solved parcialmente reconciliado repara banderas y cuaderno", () => {
  const saved = new GameState().toSaveData();
  saved.puzzles.archiveCriteria = {
    verdicts: { ...ARCHIVE_CRITERIA_SOLUTION },
    phase: ARCHIVE_CRITERIA_PHASE.SOLVED,
    hintsRead: [],
    attemptCount: 1,
    failureCode: null,
  };
  saved.flags.investigationComplete = false;
  saved.flags.epilogueUnlocked = false;

  const restored = new GameState();
  restored.restore(saved);

  assert.equal(restored.flags.investigationComplete, true);
  assert.equal(restored.flags.epilogueUnlocked, true);
  assert.equal(restored.objectiveId, START_EPILOGUE_OBJECTIVE_ID);
  assert.equal(restored.notebook.length, 2);
  assert.equal(restored.notebook[0].id, ARCHIVE_FINAL_EVIDENCE_ENTRY.id);
  assert.equal(restored.notebook[1].id, EPILOGUE_COMBINATION_CLUE_ENTRY.id);

  restored.restore(restored.toSaveData());
  assert.equal(restored.notebook.length, 2);
});

test("restaurar un archiveCriteria solved con epilogueUnlocked ya true conserva un objetivo posterior sin duplicar el cuaderno", () => {
  const saved = new GameState().toSaveData();
  saved.puzzles.archiveCriteria = {
    verdicts: { ...ARCHIVE_CRITERIA_SOLUTION },
    phase: ARCHIVE_CRITERIA_PHASE.SOLVED,
    hintsRead: [],
    attemptCount: 1,
    failureCode: null,
  };
  saved.flags.investigationComplete = true;
  saved.flags.epilogueUnlocked = true;
  saved.objectiveId = "some-later-objective";
  saved.notebook = [{ ...ARCHIVE_FINAL_EVIDENCE_ENTRY }];

  const restored = new GameState();
  restored.restore(saved);

  assert.equal(restored.objectiveId, "some-later-objective");
  assert.equal(restored.notebook.length, 2);
  assert.equal(
    restored.notebook.some(
      (entry) => entry.id === EPILOGUE_COMBINATION_CLUE_ENTRY.id,
    ),
    true,
  );
});

test("GameState.restore() no muta el receptor cuando el catálogo es inválido (estado por defecto)", () => {
  for (const makeInvalid of LIBRARY_CATALOGUE_INVALID_CASES) {
    const saved = new GameState().toSaveData();
    makeInvalid(saved);

    const state = new GameState();
    const before = captureObservableState(state);

    assert.throws(() => state.restore(saved), /catálogo/i);
    assert.deepEqual(captureObservableState(state), before);
  }
});

test("GameState.restore() no muta el receptor cuando el catálogo es inválido (progreso previo real)", () => {
  for (const makeInvalid of LIBRARY_CATALOGUE_INVALID_CASES) {
    const saved = new GameState().toSaveData();
    makeInvalid(saved);

    const state = buildProgressedState();
    const before = captureObservableState(state);

    assert.throws(() => state.restore(saved), /catálogo/i);
    assert.deepEqual(captureObservableState(state), before);
  }
});

test("GameState.restore() no muta el receptor cuando archiveCriteria es inválido (estado por defecto)", () => {
  for (const makeInvalid of ARCHIVE_CRITERIA_INVALID_CASES) {
    const saved = new GameState().toSaveData();
    makeInvalid(saved);

    const state = new GameState();
    const before = captureObservableState(state);

    assert.throws(() => state.restore(saved), /Archivo/i);
    assert.deepEqual(captureObservableState(state), before);
  }
});

test("GameState.restore() no muta el receptor cuando archiveCriteria es inválido (progreso previo real)", () => {
  for (const makeInvalid of ARCHIVE_CRITERIA_INVALID_CASES) {
    const saved = new GameState().toSaveData();
    makeInvalid(saved);

    const state = buildProgressedState();
    const before = captureObservableState(state);

    assert.throws(() => state.restore(saved), /Archivo/i);
    assert.deepEqual(captureObservableState(state), before);
  }
});

test("GameState.restore() no muta el receptor cuando formatVersion no es soportado (estado por defecto)", () => {
  const state = new GameState();
  const before = captureObservableState(state);

  assert.throws(
    () => state.restore({ formatVersion: 999 }),
    /no es compatible/,
  );
  assert.deepEqual(captureObservableState(state), before);
});

test("GameState.restore() no muta el receptor cuando formatVersion no es soportado (progreso previo real)", () => {
  const state = buildProgressedState();
  const before = captureObservableState(state);

  assert.throws(
    () => state.restore({ formatVersion: 999 }),
    /no es compatible/,
  );
  assert.deepEqual(captureObservableState(state), before);
});

test("GameState reset() incluye las tres nuevas banderas del epílogo en false sin alterar las nueve existentes", () => {
  const state = new GameState();

  assert.deepEqual(state.flags, {
    examinedPrototypeSign: false,
    preparationsBoardRead: false,
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
  });
});

test("toSaveData() incluye las tres nuevas banderas del epílogo con el mismo valor que state.flags", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = false;
  state.flags.epilogueCompleted = false;

  const saved = state.toSaveData();

  assert.equal(saved.flags.epilogueStarted, state.flags.epilogueStarted);
  assert.equal(saved.flags.giftCodeSolved, state.flags.giftCodeSolved);
  assert.equal(
    saved.flags.epilogueCompleted,
    state.flags.epilogueCompleted,
  );
  assert.deepEqual(saved.flags, state.flags);
});

test("un guardado sin las tres banderas nuevas del epílogo las restaura en false para los formatos 1, 2, 3 y 4", () => {
  for (const formatVersion of [1, 2, 3, 4]) {
    const saved = new GameState().toSaveData();
    saved.formatVersion = formatVersion;
    delete saved.flags.epilogueStarted;
    delete saved.flags.giftCodeSolved;
    delete saved.flags.epilogueCompleted;

    const state = new GameState();

    assert.doesNotThrow(() => state.restore(saved));
    assert.equal(state.flags.epilogueStarted, false);
    assert.equal(state.flags.giftCodeSolved, false);
    assert.equal(state.flags.epilogueCompleted, false);
  }
});

test("un guardado de formato 4 con la cadena completa de banderas del epílogo se restaura exactamente", () => {
  const saved = new GameState().toSaveData();
  saved.flags.investigationComplete = true;
  saved.flags.epilogueUnlocked = true;
  saved.flags.epilogueStarted = true;
  saved.flags.giftCodeSolved = true;
  saved.flags.epilogueCompleted = true;

  const state = new GameState();
  state.restore(saved);

  assert.equal(state.flags.investigationComplete, true);
  assert.equal(state.flags.epilogueUnlocked, true);
  assert.equal(state.flags.epilogueStarted, true);
  assert.equal(state.flags.giftCodeSolved, true);
  assert.equal(state.flags.epilogueCompleted, true);
});

test("GameState conserva combinaciones parciales válidas de las banderas del epílogo", () => {
  const partialCases = [
    {
      investigationComplete: true,
      epilogueUnlocked: true,
      epilogueStarted: false,
      giftCodeSolved: false,
      epilogueCompleted: false,
    },
    {
      investigationComplete: true,
      epilogueUnlocked: true,
      epilogueStarted: true,
      giftCodeSolved: false,
      epilogueCompleted: false,
    },
  ];

  for (const partialFlags of partialCases) {
    const saved = new GameState().toSaveData();
    Object.assign(saved.flags, partialFlags);

    const state = new GameState();
    state.restore(saved);

    assert.equal(
      state.flags.investigationComplete,
      partialFlags.investigationComplete,
    );
    assert.equal(
      state.flags.epilogueUnlocked,
      partialFlags.epilogueUnlocked,
    );
    assert.equal(
      state.flags.epilogueStarted,
      partialFlags.epilogueStarted,
    );
    assert.equal(
      state.flags.giftCodeSolved,
      partialFlags.giftCodeSolved,
    );
    assert.equal(
      state.flags.epilogueCompleted,
      partialFlags.epilogueCompleted,
    );
  }
});

test("GameState rechaza banderas del epílogo que violan las invariantes de implicación", () => {
  for (const makeInvalid of EPILOGUE_FLAG_INVARIANT_INVALID_CASES) {
    const saved = new GameState().toSaveData();
    makeInvalid(saved);

    const state = new GameState();
    assert.throws(() => state.restore(saved), /epílogo/i);
  }
});

test("GameState.restore() no muta el receptor cuando las banderas del epílogo violan las invariantes (estado por defecto)", () => {
  for (const makeInvalid of EPILOGUE_FLAG_INVARIANT_INVALID_CASES) {
    const saved = new GameState().toSaveData();
    makeInvalid(saved);

    const state = new GameState();
    const before = captureObservableState(state);

    assert.throws(() => state.restore(saved), /epílogo/i);
    assert.deepEqual(captureObservableState(state), before);
  }
});

test("GameState.restore() no muta el receptor cuando las banderas del epílogo violan las invariantes (progreso previo real)", () => {
  for (const makeInvalid of EPILOGUE_FLAG_INVARIANT_INVALID_CASES) {
    const saved = new GameState().toSaveData();
    makeInvalid(saved);

    const state = buildProgressedState();
    const before = captureObservableState(state);

    assert.throws(() => state.restore(saved), /epílogo/i);
    assert.deepEqual(captureObservableState(state), before);
  }
});

function buildGiftCodeSolvedSaveData() {
  const saved = new GameState().toSaveData();

  saved.flags.investigationComplete = true;
  saved.flags.epilogueUnlocked = true;
  saved.flags.epilogueStarted = true;
  saved.flags.giftCodeSolved = true;
  saved.flags.epilogueCompleted = false;
  saved.objectiveId = "epilogue-meet-bride";
  saved.scene = "world";
  saved.world.currentMapId = "axiom-plaza";
  saved.world.playerByMap["axiom-plaza"] = {
    x: 111,
    y: 222,
    facing: "left",
  };
  saved.player = { ...saved.world.playerByMap["axiom-plaza"] };

  return saved;
}

test("un guardado con giftCodeSolved=true hace un round-trip exacto", () => {
  const saved = buildGiftCodeSolvedSaveData();

  const state = new GameState();
  state.restore(saved);

  const firstSave = state.toSaveData();
  delete firstSave.savedAt;

  const secondState = new GameState();
  secondState.restore(firstSave);
  const secondSave = secondState.toSaveData();
  delete secondSave.savedAt;

  assert.deepEqual(secondSave, firstSave);
});

test("giftCodeSolved=true fuerza scene a world aunque el guardado traiga otra escena", () => {
  const saved = buildGiftCodeSolvedSaveData();
  saved.scene = "dev-world";

  const state = new GameState();
  state.restore(saved);

  assert.equal(state.scene, "world");
});

test("giftCodeSolved=true fuerza el mapa actual a axiom-plaza aunque el guardado traiga otro mapa", () => {
  const saved = buildGiftCodeSolvedSaveData();
  saved.world.currentMapId = "library";

  const state = new GameState();
  state.restore(saved);

  assert.equal(state.world.currentMapId, "axiom-plaza");
});

test("giftCodeSolved=true con currentMapId distinto conserva la posición guardada de axiom-plaza", () => {
  const saved = buildGiftCodeSolvedSaveData();
  saved.world.currentMapId = "library";
  saved.world.playerByMap["axiom-plaza"] = {
    x: 333,
    y: 444,
    facing: "right",
  };

  const state = new GameState();
  state.restore(saved);

  assert.deepEqual(state.world.playerByMap["axiom-plaza"], {
    x: 333,
    y: 444,
    facing: "right",
  });
});

test("giftCodeSolved=true sin una posición válida en axiom-plaza cae en el spawn por defecto", () => {
  /*
   * Cada caso invalida por completo la posición de axiom-plaza (los tres
   * ejes a la vez, y el alias legacy `player`) para que normalizePlayerState
   * no tenga ningún eje válido del que tirar como fallback parcial.
   */
  const invalidPositionCases = [
    (saved) => {
      delete saved.world.playerByMap["axiom-plaza"];
      delete saved.player;
    },
    (saved) => {
      saved.world.playerByMap["axiom-plaza"] = {
        x: Number.NaN,
        y: Number.NaN,
        facing: "diagonal",
      };
    },
    (saved) => {
      saved.world.playerByMap["axiom-plaza"] = {
        x: Number.POSITIVE_INFINITY,
        y: Number.NEGATIVE_INFINITY,
        facing: "diagonal",
      };
    },
    (saved) => {
      saved.world.playerByMap["axiom-plaza"] = {
        x: Number.NaN,
        y: Number.POSITIVE_INFINITY,
        facing: 123,
      };
    },
  ];

  for (const makeInvalid of invalidPositionCases) {
    const saved = buildGiftCodeSolvedSaveData();
    saved.world.currentMapId = "library";
    makeInvalid(saved);

    const state = new GameState();
    state.restore(saved);

    assert.deepEqual(state.world.playerByMap["axiom-plaza"], {
      x: 240,
      y: 192,
      facing: "up",
    });
  }
});

test("giftCodeSolved=true deja state.player idéntico a state.world.playerByMap['axiom-plaza']", () => {
  const cases = [
    (saved) => saved,
    (saved) => {
      saved.world.currentMapId = "library";
      return saved;
    },
    (saved) => {
      saved.world.currentMapId = "library";
      delete saved.world.playerByMap["axiom-plaza"];
      return saved;
    },
  ];

  for (const makeCase of cases) {
    const saved = makeCase(buildGiftCodeSolvedSaveData());

    const state = new GameState();
    state.restore(saved);

    assert.deepEqual(state.player, state.world.playerByMap["axiom-plaza"]);
  }
});

test("giftCodeSolved=true conserva objectiveId exactamente como venía en el guardado", () => {
  const saved = buildGiftCodeSolvedSaveData();
  saved.world.currentMapId = "library";

  const state = new GameState();
  state.restore(saved);

  assert.equal(state.objectiveId, "epilogue-meet-bride");
});

test("guardar y restaurar dos veces con giftCodeSolved=true produce el mismo resultado en ambas restauraciones", () => {
  const saved = buildGiftCodeSolvedSaveData();
  saved.world.currentMapId = "library";

  const firstState = new GameState();
  firstState.restore(saved);
  const firstResult = captureObservableState(firstState);

  const secondState = new GameState();
  secondState.restore(saved);
  const secondResult = captureObservableState(secondState);

  assert.deepEqual(secondResult, firstResult);
});

test("GameState.restore() no muta el receptor cuando giftCodeSolved=true coincide con un catálogo inválido", () => {
  for (const makeInvalid of LIBRARY_CATALOGUE_INVALID_CASES) {
    const saved = buildGiftCodeSolvedSaveData();
    makeInvalid(saved);

    const state = new GameState();
    const before = captureObservableState(state);

    assert.throws(() => state.restore(saved), /catálogo/i);
    assert.deepEqual(captureObservableState(state), before);
  }
});
