import test from "node:test";
import assert from "node:assert/strict";
import {
  DOUBT_BUDGET_FAILURE_CODE,
  DOUBT_BUDGET_PHASE,
  DoubtBudgetState,
} from "../../src/puzzles/doubt-budget/DoubtBudgetState.js";
import {
  DOUBT_BUDGET_QUESTION_LIMIT,
  DOUBT_BUDGET_TRUE_DOSSIER,
} from "../../src/puzzles/doubt-budget/DoubtBudgetData.js";

const SETTLING_TRIPLE = ["P1", "P2", "P4"];

function buildSolvedState() {
  return new DoubtBudgetState({
    askedQuestionIds: SETTLING_TRIPLE,
    identifiedDossierId: DOUBT_BUDGET_TRUE_DOSSIER.id,
    phase: DOUBT_BUDGET_PHASE.SOLVED,
    attemptCount: 1,
  });
}

test("el estado inicial es una consulta lista, sin preguntas ni conclusión", () => {
  const state = new DoubtBudgetState();

  assert.deepEqual(state.askedQuestionIds, []);
  assert.equal(state.identifiedDossierId, null);
  assert.equal(state.phase, DOUBT_BUDGET_PHASE.READY);
  assert.deepEqual(state.hintsRead, []);
  assert.equal(state.attemptCount, 0);
  assert.equal(state.failureCode, null);
  assert.equal(state.remainingQuestionCount, DOUBT_BUDGET_QUESTION_LIMIT);
});

test("el estado y sus colecciones son inmutables", () => {
  const state = new DoubtBudgetState({
    askedQuestionIds: ["P1"],
    phase: DOUBT_BUDGET_PHASE.CONSULTING,
  });

  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(state.askedQuestionIds), true);
  assert.equal(Object.isFrozen(state.hintsRead), true);

  assert.throws(() => {
    state.phase = DOUBT_BUDGET_PHASE.SOLVED;
  });
  assert.throws(() => {
    state.askedQuestionIds.push("P2");
  });
});

test("toSaveData() expone exactamente los seis campos persistidos, sin respuestas", () => {
  const state = buildSolvedState();
  const saved = state.toSaveData();

  assert.deepEqual(Object.keys(saved).sort(), [
    "askedQuestionIds",
    "attemptCount",
    "failureCode",
    "hintsRead",
    "identifiedDossierId",
    "phase",
  ]);
  assert.deepEqual(saved, {
    askedQuestionIds: SETTLING_TRIPLE,
    identifiedDossierId: "SPP",
    phase: DOUBT_BUDGET_PHASE.SOLVED,
    hintsRead: [],
    attemptCount: 1,
    failureCode: null,
  });

  saved.askedQuestionIds.push("P5");
  assert.deepEqual(state.askedQuestionIds, SETTLING_TRIPLE);
});

test("toSaveData() y el constructor son inversos", () => {
  const state = buildSolvedState();
  const restored = new DoubtBudgetState(state.toSaveData());

  assert.deepEqual(restored.toSaveData(), state.toSaveData());
});

test("no admite un array de preguntas mal formado", () => {
  assert.throws(
    () => new DoubtBudgetState({ askedQuestionIds: "P1" }),
    TypeError,
  );
  assert.throws(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: ["P1", "P2", "P4", "P5"],
        phase: DOUBT_BUDGET_PHASE.CONSULTING,
      }),
    RangeError,
  );
  assert.throws(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: ["P1", "P9"],
        phase: DOUBT_BUDGET_PHASE.CONSULTING,
      }),
    /desconocida/,
  );
  assert.throws(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: ["P1", "P1"],
        phase: DOUBT_BUDGET_PHASE.CONSULTING,
      }),
    /repetir/,
  );
});

test("no admite un expediente concluido desconocido", () => {
  assert.throws(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: SETTLING_TRIPLE,
        identifiedDossierId: "XXX",
        phase: DOUBT_BUDGET_PHASE.SOLVED,
        attemptCount: 1,
      }),
    /Expediente de contención desconocido/,
  );
});

test("no admite una fase, un attemptCount ni un failureCode desconocidos", () => {
  assert.throws(
    () => new DoubtBudgetState({ phase: "pensando" }),
    /Fase de la consulta/,
  );
  assert.throws(
    () => new DoubtBudgetState({ attemptCount: -1 }),
    /attemptCount/,
  );
  assert.throws(
    () => new DoubtBudgetState({ attemptCount: 1.5 }),
    /attemptCount/,
  );
  assert.throws(
    () => new DoubtBudgetState({ attemptCount: "1" }),
    /attemptCount/,
  );
  assert.throws(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: SETTLING_TRIPLE,
        identifiedDossierId: "SPP",
        phase: DOUBT_BUDGET_PHASE.FAILED,
        attemptCount: 1,
        failureCode: "aburrimiento",
      }),
    /Código de fallo/,
  );
});

test("la fase ready exige cero preguntas y ninguna conclusión", () => {
  assert.throws(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: ["P1"],
        phase: DOUBT_BUDGET_PHASE.READY,
      }),
    /La fase ready exige una consulta sin preguntas formuladas/,
  );
  assert.throws(
    () =>
      new DoubtBudgetState({
        identifiedDossierId: "SPP",
        phase: DOUBT_BUDGET_PHASE.READY,
      }),
    /La fase ready exige que no haya expediente concluido/,
  );
});

test("la fase consulting exige al menos una pregunta y ninguna conclusión", () => {
  assert.throws(
    () => new DoubtBudgetState({ phase: DOUBT_BUDGET_PHASE.CONSULTING }),
    /La fase consulting exige al menos una pregunta formulada/,
  );
  assert.throws(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: ["P1"],
        identifiedDossierId: "SPP",
        phase: DOUBT_BUDGET_PHASE.CONSULTING,
      }),
    /La fase consulting exige que no haya expediente concluido/,
  );

  assert.doesNotThrow(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: ["P1"],
        phase: DOUBT_BUDGET_PHASE.CONSULTING,
      }),
  );
});

test("la fase failed exige attemptCount, failureCode y una conclusión rechazada", () => {
  assert.throws(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: ["P1"],
        identifiedDossierId: "SPP",
        phase: DOUBT_BUDGET_PHASE.FAILED,
        attemptCount: 0,
        failureCode: DOUBT_BUDGET_FAILURE_CODE.UNFORCED_IDENTIFICATION,
      }),
    /attemptCount mayor o igual que uno/,
  );
  assert.throws(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: ["P1"],
        identifiedDossierId: "SPP",
        phase: DOUBT_BUDGET_PHASE.FAILED,
        attemptCount: 1,
        failureCode: null,
      }),
    /La fase failed exige un failureCode conocido/,
  );
  assert.throws(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: ["P1"],
        phase: DOUBT_BUDGET_PHASE.FAILED,
        attemptCount: 1,
        failureCode: DOUBT_BUDGET_FAILURE_CODE.UNFORCED_IDENTIFICATION,
      }),
    /La fase failed exige un expediente concluido/,
  );
});

test("failed con unforced_identification exige que la consulta no estuviera zanjada", () => {
  assert.doesNotThrow(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: ["P1", "P2"],
        identifiedDossierId: "SPP",
        phase: DOUBT_BUDGET_PHASE.FAILED,
        attemptCount: 1,
        failureCode: DOUBT_BUDGET_FAILURE_CODE.UNFORCED_IDENTIFICATION,
      }),
  );

  // Con la terna que zanja el caso, nombrar el expediente real no puede ser
  // una identificación no forzada: sería un estado guardado imposible.
  assert.throws(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: SETTLING_TRIPLE,
        identifiedDossierId: "SPP",
        phase: DOUBT_BUDGET_PHASE.FAILED,
        attemptCount: 1,
        failureCode: DOUBT_BUDGET_FAILURE_CODE.UNFORCED_IDENTIFICATION,
      }),
    /unforced_identification/,
  );
});

test("failed con incorrect_identification exige la consulta zanjada y otro expediente", () => {
  assert.doesNotThrow(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: SETTLING_TRIPLE,
        identifiedDossierId: "PPP",
        phase: DOUBT_BUDGET_PHASE.FAILED,
        attemptCount: 1,
        failureCode: DOUBT_BUDGET_FAILURE_CODE.INCORRECT_IDENTIFICATION,
      }),
  );

  assert.throws(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: ["P1", "P2"],
        identifiedDossierId: "PPP",
        phase: DOUBT_BUDGET_PHASE.FAILED,
        attemptCount: 1,
        failureCode: DOUBT_BUDGET_FAILURE_CODE.INCORRECT_IDENTIFICATION,
      }),
    /incorrect_identification/,
  );
});

test("cualquier fase distinta de failed exige failureCode nulo", () => {
  const coherentCasesByPhase = {
    [DOUBT_BUDGET_PHASE.READY]: {
      askedQuestionIds: [],
      identifiedDossierId: null,
    },
    [DOUBT_BUDGET_PHASE.CONSULTING]: {
      askedQuestionIds: ["P1"],
      identifiedDossierId: null,
    },
    [DOUBT_BUDGET_PHASE.SOLVED]: {
      askedQuestionIds: SETTLING_TRIPLE,
      identifiedDossierId: "SPP",
    },
  };

  for (const [phase, fields] of Object.entries(coherentCasesByPhase)) {
    assert.throws(
      () =>
        new DoubtBudgetState({
          ...fields,
          phase,
          attemptCount: 1,
          failureCode: DOUBT_BUDGET_FAILURE_CODE.INCORRECT_IDENTIFICATION,
        }),
      new RegExp(`La fase ${phase} exige failureCode=null`),
    );
  }
});

test("la fase solved exige una identificación realmente forzada por las respuestas", () => {
  assert.throws(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: ["P1", "P2"],
        identifiedDossierId: "SPP",
        phase: DOUBT_BUDGET_PHASE.SOLVED,
        attemptCount: 1,
      }),
    /identificación forzada/,
  );
  assert.throws(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: SETTLING_TRIPLE,
        identifiedDossierId: "PPP",
        phase: DOUBT_BUDGET_PHASE.SOLVED,
        attemptCount: 1,
      }),
    /identificación forzada/,
  );
  assert.throws(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: SETTLING_TRIPLE,
        identifiedDossierId: null,
        phase: DOUBT_BUDGET_PHASE.SOLVED,
        attemptCount: 1,
      }),
    /La fase solved exige un expediente concluido/,
  );
  assert.throws(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: SETTLING_TRIPLE,
        identifiedDossierId: "SPP",
        phase: DOUBT_BUDGET_PHASE.SOLVED,
        attemptCount: 0,
      }),
    /attemptCount mayor o igual que uno/,
  );
});

test("una terna que zanja el caso sin ser universalmente válida también admite solved", () => {
  assert.doesNotThrow(
    () =>
      new DoubtBudgetState({
        askedQuestionIds: ["P2", "P4", "P5"],
        identifiedDossierId: DOUBT_BUDGET_TRUE_DOSSIER.id,
        phase: DOUBT_BUDGET_PHASE.SOLVED,
        attemptCount: 1,
      }),
  );
});

test("remainingQuestionCount refleja el presupuesto restante", () => {
  assert.equal(
    new DoubtBudgetState({
      askedQuestionIds: ["P1"],
      phase: DOUBT_BUDGET_PHASE.CONSULTING,
    }).remainingQuestionCount,
    2,
  );
  assert.equal(buildSolvedState().remainingQuestionCount, 0);
});

test("el progreso de pistas se valida con la utilidad común", () => {
  assert.throws(() => new DoubtBudgetState({ hintsRead: [2] }), RangeError);
  assert.throws(
    () => new DoubtBudgetState({ hintsRead: [1, 2, 3, 4] }),
    RangeError,
  );
  assert.throws(() => new DoubtBudgetState({ hintsRead: "1" }), TypeError);
  assert.deepEqual(
    new DoubtBudgetState({ hintsRead: [1, 2] }).hintsRead,
    [1, 2],
  );
});

test("el estado no comparte referencias con los datos de entrada", () => {
  const askedQuestionIds = ["P1"];
  const hintsRead = [1];
  const state = new DoubtBudgetState({
    askedQuestionIds,
    hintsRead,
    phase: DOUBT_BUDGET_PHASE.CONSULTING,
  });

  askedQuestionIds.push("P2");
  hintsRead.push(2);

  assert.deepEqual(state.askedQuestionIds, ["P1"]);
  assert.deepEqual(state.hintsRead, [1]);
});
