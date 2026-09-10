import test from "node:test";
import assert from "node:assert/strict";
import {
  DOUBT_BUDGET_ACTION_CODE,
  askDoubtBudgetQuestion,
  identifyDoubtBudgetDossier,
  resetDoubtBudgetConsultation,
  revealNextDoubtBudgetHint,
} from "../../src/puzzles/doubt-budget/DoubtBudgetPuzzle.js";
import {
  DOUBT_BUDGET_FAILURE_CODE,
  DOUBT_BUDGET_PHASE,
  DoubtBudgetState,
} from "../../src/puzzles/doubt-budget/DoubtBudgetState.js";
import {
  DOUBT_BUDGET_TRUE_DOSSIER,
} from "../../src/puzzles/doubt-budget/DoubtBudgetData.js";
import {
  getCompatibleDossiers,
} from "../../src/puzzles/doubt-budget/DoubtBudgetValidator.js";
import {
  getDoubtBudgetHint,
} from "../../src/puzzles/doubt-budget/DoubtBudgetHints.js";

function askAll(state, questionIds) {
  return questionIds.reduce(
    (current, questionId) =>
      askDoubtBudgetQuestion({ state: current, questionId }).state,
    state,
  );
}

test("formular la primera pregunta abre la consulta y devuelve la respuesta derivada", () => {
  const state = new DoubtBudgetState();
  const result = askDoubtBudgetQuestion({ state, questionId: "P4" });

  assert.equal(result.code, DOUBT_BUDGET_ACTION_CODE.QUESTION_ASKED);
  assert.equal(result.questionId, "P4");
  assert.equal(result.answer, false);
  assert.deepEqual(result.state.askedQuestionIds, ["P4"]);
  assert.equal(result.state.phase, DOUBT_BUDGET_PHASE.CONSULTING);
  assert.equal(result.state.identifiedDossierId, null);
  assert.equal(result.state.remainingQuestionCount, 2);
  assert.deepEqual(result.compatibleDossierIds, ["SPS", "SPP", "PPS", "PPP"]);

  // El estado de entrada nunca se modifica.
  assert.equal(state.phase, DOUBT_BUDGET_PHASE.READY);
  assert.deepEqual(state.askedQuestionIds, []);
});

test("pedir una cuarta pregunta tras tres devuelve budget_exhausted sin mutar el estado", () => {
  const state = askAll(new DoubtBudgetState(), ["P1", "P2", "P4"]);
  const before = state.toSaveData();

  const result = askDoubtBudgetQuestion({ state, questionId: "P5" });

  assert.equal(result.code, DOUBT_BUDGET_ACTION_CODE.BUDGET_EXHAUSTED);
  assert.equal(result.state, state);
  assert.deepEqual(result.state.toSaveData(), before);
  assert.deepEqual(state.askedQuestionIds, ["P1", "P2", "P4"]);
  assert.equal(state.remainingQuestionCount, 0);
});

test("repetir una pregunta ya formulada no gasta presupuesto", () => {
  const state = askAll(new DoubtBudgetState(), ["P1"]);
  const result = askDoubtBudgetQuestion({ state, questionId: "P1" });

  assert.equal(result.code, DOUBT_BUDGET_ACTION_CODE.QUESTION_ALREADY_ASKED);
  assert.equal(result.state, state);
  assert.deepEqual(state.askedQuestionIds, ["P1"]);
});

test("una pregunta desconocida devuelve invalid_question sin tocar el estado", () => {
  const state = new DoubtBudgetState();
  const result = askDoubtBudgetQuestion({ state, questionId: "P9" });

  assert.equal(result.code, DOUBT_BUDGET_ACTION_CODE.INVALID_QUESTION);
  assert.equal(result.state, state);
  assert.equal(state.phase, DOUBT_BUDGET_PHASE.READY);
});

test("concluir con el expediente correcto sin haber zanjado la consulta no es un éxito", () => {
  const state = askAll(new DoubtBudgetState(), ["P1", "P2"]);

  assert.equal(
    getCompatibleDossiers({ askedQuestionIds: state.askedQuestionIds }).length >
      1,
    true,
  );

  const result = identifyDoubtBudgetDossier({
    state,
    dossierId: DOUBT_BUDGET_TRUE_DOSSIER.id,
  });

  assert.equal(
    result.code,
    DOUBT_BUDGET_ACTION_CODE.IDENTIFICATION_UNFORCED,
  );
  assert.notEqual(result.state.phase, DOUBT_BUDGET_PHASE.SOLVED);
  assert.equal(result.state.phase, DOUBT_BUDGET_PHASE.FAILED);
  assert.equal(
    result.state.failureCode,
    DOUBT_BUDGET_FAILURE_CODE.UNFORCED_IDENTIFICATION,
  );
  assert.equal(result.state.identifiedDossierId, "SPP");
  assert.equal(result.state.attemptCount, 1);
  assert.deepEqual(result.compatibleDossierIds, ["SPP", "PSS"]);
});

test("concluir con la consulta zanjada y el expediente real resuelve el puzle", () => {
  const state = askAll(new DoubtBudgetState(), ["P1", "P2", "P4"]);
  const result = identifyDoubtBudgetDossier({
    state,
    dossierId: DOUBT_BUDGET_TRUE_DOSSIER.id,
  });

  assert.equal(result.code, DOUBT_BUDGET_ACTION_CODE.PUZZLE_SOLVED);
  assert.equal(result.state.phase, DOUBT_BUDGET_PHASE.SOLVED);
  assert.equal(result.state.identifiedDossierId, "SPP");
  assert.equal(result.state.failureCode, null);
  assert.equal(result.state.attemptCount, 1);
  assert.deepEqual(result.compatibleDossierIds, ["SPP"]);
});

test("una terna que zanja el caso sin ser universalmente válida también resuelve el puzle", () => {
  const state = askAll(new DoubtBudgetState(), ["P2", "P4", "P5"]);
  const result = identifyDoubtBudgetDossier({
    state,
    dossierId: DOUBT_BUDGET_TRUE_DOSSIER.id,
  });

  assert.equal(result.code, DOUBT_BUDGET_ACTION_CODE.PUZZLE_SOLVED);
  assert.equal(result.state.phase, DOUBT_BUDGET_PHASE.SOLVED);
});

test("concluir con otro expediente tras zanjar la consulta es una identificación incorrecta", () => {
  const state = askAll(new DoubtBudgetState(), ["P1", "P2", "P4"]);
  const result = identifyDoubtBudgetDossier({ state, dossierId: "PPP" });

  assert.equal(
    result.code,
    DOUBT_BUDGET_ACTION_CODE.IDENTIFICATION_INCORRECT,
  );
  assert.equal(result.state.phase, DOUBT_BUDGET_PHASE.FAILED);
  assert.equal(
    result.state.failureCode,
    DOUBT_BUDGET_FAILURE_CODE.INCORRECT_IDENTIFICATION,
  );
  assert.equal(result.state.identifiedDossierId, "PPP");
});

test("un expediente desconocido devuelve invalid_dossier sin gastar un intento", () => {
  const state = askAll(new DoubtBudgetState(), ["P1", "P2", "P4"]);
  const result = identifyDoubtBudgetDossier({ state, dossierId: "XXX" });

  assert.equal(result.code, DOUBT_BUDGET_ACTION_CODE.INVALID_DOSSIER);
  assert.equal(result.state, state);
  assert.equal(state.attemptCount, 0);
});

test("retomar la consulta tras un rechazo descarta la identificación", () => {
  const failed = identifyDoubtBudgetDossier({
    state: askAll(new DoubtBudgetState(), ["P1"]),
    dossierId: "SPP",
  }).state;

  assert.equal(failed.phase, DOUBT_BUDGET_PHASE.FAILED);

  const result = askDoubtBudgetQuestion({ state: failed, questionId: "P2" });

  assert.equal(result.code, DOUBT_BUDGET_ACTION_CODE.QUESTION_ASKED);
  assert.equal(result.state.phase, DOUBT_BUDGET_PHASE.CONSULTING);
  assert.equal(result.state.identifiedDossierId, null);
  assert.equal(result.state.failureCode, null);
  assert.equal(result.state.attemptCount, 1);
  assert.deepEqual(result.state.askedQuestionIds, ["P1", "P2"]);
});

test("reiniciar abre una consulta nueva conservando pistas e intentos", () => {
  const revealed = revealNextDoubtBudgetHint({
    state: new DoubtBudgetState(),
  }).state;
  const failed = identifyDoubtBudgetDossier({
    state: askAll(revealed, ["P1", "P2", "P4"]),
    dossierId: "PPP",
  }).state;

  const result = resetDoubtBudgetConsultation({ state: failed });

  assert.equal(result.code, DOUBT_BUDGET_ACTION_CODE.PUZZLE_RESET);
  assert.deepEqual(result.state.askedQuestionIds, []);
  assert.equal(result.state.identifiedDossierId, null);
  assert.equal(result.state.phase, DOUBT_BUDGET_PHASE.READY);
  assert.equal(result.state.failureCode, null);
  assert.deepEqual(result.state.hintsRead, [1]);
  assert.equal(result.state.attemptCount, 1);
});

test("un puzle resuelto ignora preguntas, conclusiones y reinicios", () => {
  const solved = identifyDoubtBudgetDossier({
    state: askAll(new DoubtBudgetState(), ["P1", "P2", "P4"]),
    dossierId: "SPP",
  }).state;

  for (const result of [
    askDoubtBudgetQuestion({ state: solved, questionId: "P5" }),
    identifyDoubtBudgetDossier({ state: solved, dossierId: "PPP" }),
    resetDoubtBudgetConsultation({ state: solved }),
  ]) {
    assert.equal(result.code, DOUBT_BUDGET_ACTION_CODE.ALREADY_SOLVED);
    assert.equal(result.state, solved);
  }
});

test("las pistas se revelan en orden y se agotan en el nivel tres", () => {
  let state = new DoubtBudgetState();

  for (const level of [1, 2, 3]) {
    const result = revealNextDoubtBudgetHint({ state });

    assert.equal(result.code, DOUBT_BUDGET_ACTION_CODE.HINT_REVEALED);
    assert.equal(result.level, level);
    assert.deepEqual(result.hint, getDoubtBudgetHint(level));
    state = result.state;
  }

  const exhausted = revealNextDoubtBudgetHint({ state });

  assert.equal(exhausted.code, DOUBT_BUDGET_ACTION_CODE.ALL_HINTS_READ);
  assert.equal(exhausted.level, 3);
  assert.equal(exhausted.state, state);
  assert.deepEqual(state.hintsRead, [1, 2, 3]);
});

test("un puzle resuelto devuelve la última pista leída sin revelar ninguna nueva", () => {
  const withHint = revealNextDoubtBudgetHint({
    state: new DoubtBudgetState(),
  }).state;
  const solved = identifyDoubtBudgetDossier({
    state: askAll(withHint, ["P1", "P2", "P4"]),
    dossierId: "SPP",
  }).state;

  const result = revealNextDoubtBudgetHint({ state: solved });

  assert.equal(result.code, DOUBT_BUDGET_ACTION_CODE.ALREADY_SOLVED);
  assert.equal(result.level, 1);
  assert.deepEqual(result.hint, getDoubtBudgetHint(1));
  assert.equal(result.state, solved);
});

test("el controlador exige un DoubtBudgetState", () => {
  for (const action of [
    () => askDoubtBudgetQuestion({ state: {}, questionId: "P1" }),
    () => identifyDoubtBudgetDossier({ state: null, dossierId: "SPP" }),
    () => resetDoubtBudgetConsultation({ state: "consulta" }),
    () => revealNextDoubtBudgetHint({ state: undefined }),
  ]) {
    assert.throws(action, TypeError);
  }
});

test("una consulta completa encadena estados nuevos sin mutar los anteriores", () => {
  const initial = new DoubtBudgetState();
  const first = askDoubtBudgetQuestion({
    state: initial,
    questionId: "P1",
  }).state;
  const second = askDoubtBudgetQuestion({
    state: first,
    questionId: "P2",
  }).state;
  const third = askDoubtBudgetQuestion({
    state: second,
    questionId: "P4",
  }).state;

  assert.deepEqual(initial.askedQuestionIds, []);
  assert.deepEqual(first.askedQuestionIds, ["P1"]);
  assert.deepEqual(second.askedQuestionIds, ["P1", "P2"]);
  assert.deepEqual(third.askedQuestionIds, ["P1", "P2", "P4"]);
  assert.notEqual(first, second);
  assert.notEqual(second, third);
});
