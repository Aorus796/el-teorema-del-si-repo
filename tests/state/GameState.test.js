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

test("GameState rechaza archiveCriteria ausente o inválido en el formato vigente", () => {
  const invalidCases = [
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

  for (const makeInvalid of invalidCases) {
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
  assert.equal(restored.notebook.length, 1);
  assert.equal(restored.notebook[0].id, ARCHIVE_FINAL_EVIDENCE_ENTRY.id);

  restored.restore(restored.toSaveData());
  assert.equal(restored.notebook.length, 1);
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
  assert.equal(restored.notebook.length, 1);
});
