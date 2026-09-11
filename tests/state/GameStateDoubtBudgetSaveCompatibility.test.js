import assert from "node:assert/strict";
import test from "node:test";
import { GameState, SAVE_FORMAT_VERSION } from "../../src/state/GameState.js";
import {
  DOUBT_BUDGET_PHASE,
} from "../../src/puzzles/doubt-budget/DoubtBudgetState.js";
import {
  askDoubtBudgetQuestion,
  identifyDoubtBudgetDossier,
} from "../../src/puzzles/doubt-budget/DoubtBudgetPuzzle.js";
import {
  getCompatibleDossiers,
  getDoubtBudgetAnswers,
} from "../../src/puzzles/doubt-budget/DoubtBudgetValidator.js";
import {
  LIBRARY_CATALOGUE_NOTEBOOK_ENTRY,
} from "../../src/progression/LibraryCatalogueProgression.js";
import {
  ARCHIVE_FINAL_EVIDENCE_ENTRY,
  EPILOGUE_COMBINATION_CLUE_ENTRY,
  START_EPILOGUE_OBJECTIVE_ID,
} from "../../src/progression/ArchiveCriteriaProgression.js";
import {
  CONTAINMENT_CLOSURE_ENTRY,
  applyDoubtBudgetProgression,
} from "../../src/progression/DoubtBudgetProgression.js";

/*
 * Compatibilidad del formato de guardado 5, que añade la consulta de
 * contención (`puzzles.doubtBudget`) y la bandera `containmentUnlocked`.
 * Cubre el formato nuevo en tres puntos de la partida y, sobre todo, los
 * guardados de formato 4 -- los que produjo v1.2, donde la consulta no
 * existía todavía.
 */

const SETTLING_TRIPLE = ["P1", "P2", "P4"];

function buildLegacyFlags(overrides = {}) {
  return {
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
    ...overrides,
  };
}

/*
 * Forma exacta que producía GameState.toSaveData() en v1.2: formato 4, tres
 * puzles y ninguna bandera de contención.
 */
function buildLegacySaveData({ flags = {}, solvedArchiveCriteria = false }) {
  return {
    formatVersion: 4,
    savedAt: "2026-08-30T00:00:00.000Z",
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
    flags: buildLegacyFlags(flags),
    objectiveId: "investigate-seven-bridges",
    notebook: [
      {
        id: "bride-note",
        title: "Nota encontrada en la habitación",
        text: "Texto conservado.",
      },
    ],
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
      archiveCriteria: solvedArchiveCriteria
        ? {
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
          }
        : {
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
 * Guardado de formato 4 de una partida ya terminada de v1.2: los tres puzles
 * resueltos, el epílogo desbloqueado y, opcionalmente, completado.
 */
function buildFinishedLegacySaveData({ epilogueCompleted }) {
  const data = buildLegacySaveData({
    solvedArchiveCriteria: true,
    flags: {
      examinedPrototypeSign: true,
      p2EvidenceFound: true,
      libraryObjectiveUnlocked: true,
      archiveUnlocked: true,
      investigationComplete: true,
      epilogueUnlocked: true,
      epilogueStarted: epilogueCompleted,
      giftCodeSolved: epilogueCompleted,
      epilogueCompleted,
    },
  });

  data.objectiveId = epilogueCompleted
    ? "epilogue-completed"
    : "start-epilogue";
  data.puzzles.p2 = {
    lifecycle: { id: "p2-bridges", status: "solved", attemptCount: 1 },
    phase: "solved",
    closedBridgeId: "B1",
    currentNode: "L",
    route: ["E", "R", "N", "L", "R", "M", "L"],
    usedBridgeIds: ["B2", "B3", "B6", "B7", "B4", "B5"],
    hintsRead: [1],
    failureCode: null,
  };
  data.puzzles.libraryCatalogue = {
    order: ["A", "D", "R", "C", "M"],
    phase: "solved",
    hintsRead: [1],
    attemptCount: 1,
    failureCode: null,
  };
  data.notebook = [
    ...data.notebook,
    { ...LIBRARY_CATALOGUE_NOTEBOOK_ENTRY },
    { ...ARCHIVE_FINAL_EVIDENCE_ENTRY },
    { ...EPILOGUE_COMBINATION_CLUE_ENTRY },
  ];

  return data;
}

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
      doubtBudget: state.puzzles.doubtBudget.toSaveData(),
    },
  };
}

function buildStateWithConsultation(questionIds) {
  const state = new GameState();

  state.puzzles.doubtBudget = questionIds.reduce(
    (current, questionId) =>
      askDoubtBudgetQuestion({ state: current, questionId }).state,
    state.puzzles.doubtBudget,
  );

  return state;
}

test("el formato de guardado vigente es el 5", () => {
  assert.equal(SAVE_FORMAT_VERSION, 5);

  const saved = new GameState().toSaveData();

  assert.equal(saved.formatVersion, 5);
  assert.deepEqual(Object.keys(saved.puzzles).sort(), [
    "archiveCriteria",
    "doubtBudget",
    "libraryCatalogue",
    "p2",
  ]);
  assert.equal(saved.flags.containmentUnlocked, false);
});

test("el guardado de la consulta contiene exactamente los seis campos previstos, sin respuestas", () => {
  const saved = buildStateWithConsultation(["P1", "P2"]).toSaveData();

  assert.deepEqual(Object.keys(saved.puzzles.doubtBudget).sort(), [
    "askedQuestionIds",
    "attemptCount",
    "failureCode",
    "hintsRead",
    "identifiedDossierId",
    "phase",
  ]);
  assert.equal(
    JSON.stringify(saved.puzzles.doubtBudget).includes("answer"),
    false,
  );
});

test("v5 nuevo: una partida recién empezada sobrevive al viaje de ida y vuelta", () => {
  const state = new GameState();
  const before = captureObservableState(state);

  const restored = new GameState();
  assert.doesNotThrow(() => restored.restore(state.toSaveData()));

  assert.deepEqual(captureObservableState(restored), before);
  assert.equal(restored.puzzles.doubtBudget.phase, DOUBT_BUDGET_PHASE.READY);
  assert.deepEqual(restored.puzzles.doubtBudget.askedQuestionIds, []);
  assert.equal(restored.flags.containmentUnlocked, false);
});

test("v5 parcial: las preguntas ya formuladas se conservan y las respuestas se recalculan", () => {
  const state = buildStateWithConsultation(["P2", "P4"]);
  const before = captureObservableState(state);

  const restored = new GameState();
  assert.doesNotThrow(() => restored.restore(state.toSaveData()));

  assert.deepEqual(captureObservableState(restored), before);
  assert.deepEqual(restored.puzzles.doubtBudget.askedQuestionIds, [
    "P2",
    "P4",
  ]);
  assert.equal(
    restored.puzzles.doubtBudget.phase,
    DOUBT_BUDGET_PHASE.CONSULTING,
  );
  assert.equal(restored.puzzles.doubtBudget.remainingQuestionCount, 1);

  /*
   * Las respuestas no viajan en el guardado: se derivan de las preguntas
   * formuladas y del expediente real, así que siguen siendo las mismas.
   */
  assert.deepEqual(
    getDoubtBudgetAnswers(restored.puzzles.doubtBudget.askedQuestionIds),
    [
      { questionId: "P2", answer: true },
      { questionId: "P4", answer: false },
    ],
  );
  assert.deepEqual(
    getCompatibleDossiers({
      askedQuestionIds: restored.puzzles.doubtBudget.askedQuestionIds,
    }).map((dossier) => dossier.id),
    ["SPP", "PPP"],
  );
});

test("v5 resuelto: la consulta resuelta sobrevive al viaje de ida y vuelta", () => {
  const state = buildStateWithConsultation(SETTLING_TRIPLE);
  state.puzzles.doubtBudget = identifyDoubtBudgetDossier({
    state: state.puzzles.doubtBudget,
    dossierId: "SPP",
  }).state;
  state.flags.investigationComplete = true;
  state.flags.containmentUnlocked = true;

  /*
   * Desde v1.3 cerrar la consulta desbloquea el epílogo, así que un
   * guardado real de este punto de la partida ya trae la progresión
   * aplicada (bandera, objetivo y entrada de cuaderno). Se aplica también
   * aquí sobre el estado de origen para que el viaje de ida y vuelta
   * compare dos estados igualmente reconciliados: restore() vuelve a
   * ejecutar applyDoubtBudgetProgression() y debe resultar idempotente.
   */
  applyDoubtBudgetProgression(state);

  const before = captureObservableState(state);
  const restored = new GameState();
  assert.doesNotThrow(() => restored.restore(state.toSaveData()));

  assert.deepEqual(captureObservableState(restored), before);
  assert.equal(restored.puzzles.doubtBudget.phase, DOUBT_BUDGET_PHASE.SOLVED);
  assert.equal(restored.puzzles.doubtBudget.identifiedDossierId, "SPP");
  assert.equal(restored.flags.containmentUnlocked, true);
  assert.equal(restored.flags.epilogueUnlocked, true);
  assert.equal(restored.objectiveId, START_EPILOGUE_OBJECTIVE_ID);
  assert.ok(
    restored.notebook.some((entry) => entry.id === CONTAINMENT_CLOSURE_ENTRY.id),
  );
});

test("v4 sin doubtBudget: conserva el progreso real y estrena la consulta", () => {
  const data = buildLegacySaveData({});
  const state = new GameState();

  assert.doesNotThrow(() => state.restore(data));

  assert.deepEqual(state.puzzles.libraryCatalogue.toSaveData(), {
    ...data.puzzles.libraryCatalogue,
  });
  assert.deepEqual(state.puzzles.archiveCriteria.toSaveData(), {
    ...data.puzzles.archiveCriteria,
  });
  assert.equal(state.flags.sevenBridgesUnlocked, true);
  assert.equal(state.flags.brideNoteReceived, true);
  assert.deepEqual(state.notebook, data.notebook);

  assert.equal(state.puzzles.doubtBudget.phase, DOUBT_BUDGET_PHASE.READY);
  assert.deepEqual(state.puzzles.doubtBudget.askedQuestionIds, []);
  assert.equal(state.puzzles.doubtBudget.identifiedDossierId, null);
  assert.equal(state.puzzles.doubtBudget.attemptCount, 0);
  assert.equal(state.flags.containmentUnlocked, false);

  // Y el guardado que produce ya es del formato vigente.
  assert.equal(state.toSaveData().formatVersion, 5);
});

test("v4 con el epílogo desbloqueado: no se revierte ninguna bandera y la consulta queda resuelta", () => {
  const data = buildFinishedLegacySaveData({ epilogueCompleted: false });
  const state = new GameState();

  assert.doesNotThrow(() => state.restore(data));

  assert.equal(state.flags.investigationComplete, true);
  assert.equal(state.flags.epilogueUnlocked, true);
  assert.equal(state.flags.epilogueStarted, false);
  assert.equal(state.flags.giftCodeSolved, false);
  assert.equal(state.flags.epilogueCompleted, false);
  assert.equal(state.flags.containmentUnlocked, true);

  const doubtBudget = state.puzzles.doubtBudget;
  assert.equal(doubtBudget.phase, DOUBT_BUDGET_PHASE.SOLVED);
  assert.equal(doubtBudget.identifiedDossierId, "SPP");
  assert.equal(doubtBudget.attemptCount, 1);
  assert.equal(doubtBudget.failureCode, null);

  /*
   * El estado indultado no es un estado por defecto disfrazado: la consulta
   * que describe zanja de verdad el caso, igual que la de un jugador real.
   */
  assert.equal(
    getCompatibleDossiers({
      askedQuestionIds: doubtBudget.askedQuestionIds,
    }).length,
    1,
  );

  const roundTrip = new GameState();
  assert.doesNotThrow(() => roundTrip.restore(state.toSaveData()));
  assert.deepEqual(
    captureObservableState(roundTrip),
    captureObservableState(state),
  );
});

test("v4 de una partida terminada: epilogueCompleted sigue en pie y restore() no lanza", () => {
  const data = buildFinishedLegacySaveData({ epilogueCompleted: true });
  const state = new GameState();

  assert.doesNotThrow(() => state.restore(data));

  assert.equal(state.flags.epilogueUnlocked, true);
  assert.equal(state.flags.epilogueStarted, true);
  assert.equal(state.flags.giftCodeSolved, true);
  assert.equal(state.flags.epilogueCompleted, true);
  assert.equal(state.flags.containmentUnlocked, true);
  assert.equal(state.objectiveId, "epilogue-completed");
  assert.equal(
    state.puzzles.doubtBudget.phase,
    DOUBT_BUDGET_PHASE.SOLVED,
  );

  const roundTrip = new GameState();
  assert.doesNotThrow(() => roundTrip.restore(state.toSaveData()));
  assert.deepEqual(
    captureObservableState(roundTrip),
    captureObservableState(state),
  );
});

test("v4 con el criterio del Archivo resuelto pero sin la bandera del epílogo también se indulta", () => {
  /*
   * En v1.2 resolver el criterio del Archivo era lo que desbloqueaba el
   * epílogo, así que ambas señales describen la misma partida. Se cubren las
   * dos para que un guardado con las banderas incompletas no quede a medio
   * migrar.
   */
  const data = buildLegacySaveData({
    solvedArchiveCriteria: true,
    flags: { investigationComplete: true, archiveUnlocked: true },
  });
  const state = new GameState();

  assert.doesNotThrow(() => state.restore(data));

  assert.equal(state.flags.containmentUnlocked, true);
  assert.equal(
    state.puzzles.doubtBudget.phase,
    DOUBT_BUDGET_PHASE.SOLVED,
  );

  const roundTrip = new GameState();
  assert.doesNotThrow(() => roundTrip.restore(state.toSaveData()));
});

test("un doubtBudget malformado en v5 lanza sin dejar rastro en el estado", () => {
  const invalidDoubtBudgets = [
    undefined,
    null,
    [],
    "consulta",
    {},
    { askedQuestionIds: [], phase: "ready" },
    {
      askedQuestionIds: [],
      identifiedDossierId: null,
      phase: "ready",
      hintsRead: [],
      attemptCount: 0,
      failureCode: null,
      extra: true,
    },
    {
      askedQuestionIds: ["P1", "P1"],
      identifiedDossierId: null,
      phase: "consulting",
      hintsRead: [],
      attemptCount: 0,
      failureCode: null,
    },
    {
      askedQuestionIds: ["P1", "P2", "P4", "P5"],
      identifiedDossierId: null,
      phase: "consulting",
      hintsRead: [],
      attemptCount: 0,
      failureCode: null,
    },
    {
      askedQuestionIds: ["P1", "P2"],
      identifiedDossierId: "SPP",
      phase: "solved",
      hintsRead: [],
      attemptCount: 1,
      failureCode: null,
    },
  ];

  for (const doubtBudget of invalidDoubtBudgets) {
    const state = buildStateWithConsultation(["P1"]);
    const before = captureObservableState(state);

    const saved = state.toSaveData();
    if (doubtBudget === undefined) {
      delete saved.puzzles.doubtBudget;
    } else {
      saved.puzzles.doubtBudget = doubtBudget;
    }

    assert.throws(
      () => state.restore(saved),
      /consulta de contención/,
      `Debe rechazar ${JSON.stringify(doubtBudget) ?? "el campo ausente"}.`,
    );
    assert.deepEqual(captureObservableState(state), before);
  }
});

test("una partida de formato 5 con la consulta pendiente no desbloquea la contención sola", () => {
  const data = buildStateWithConsultation(["P1"]).toSaveData();
  const state = new GameState();

  state.restore(data);

  assert.equal(state.flags.containmentUnlocked, false);
  assert.equal(
    state.puzzles.doubtBudget.phase,
    DOUBT_BUDGET_PHASE.CONSULTING,
  );
});
