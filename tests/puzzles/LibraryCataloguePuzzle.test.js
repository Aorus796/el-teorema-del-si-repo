import test from "node:test";
import assert from "node:assert/strict";
import { HINT_PROGRESS_CODE } from "../../src/puzzles/core/HintProgress.js";
import {
  LIBRARY_CATALOGUE_HINTS,
} from "../../src/puzzles/library-catalogue/LibraryCatalogueHints.js";
import {
  LIBRARY_CATALOGUE_ACTION_CODE,
  confirmLibraryCatalogueOrder,
  resetLibraryCatalogue,
  revealNextLibraryCatalogueHint,
  selectLibraryCatalogueDocument,
} from "../../src/puzzles/library-catalogue/LibraryCataloguePuzzle.js";
import {
  LIBRARY_CATALOGUE_FAILURE_CODE,
  LIBRARY_CATALOGUE_PHASE,
  LibraryCatalogueState,
} from "../../src/puzzles/library-catalogue/LibraryCatalogueState.js";

const INITIAL_ORDER = ["C", "M", "A", "R", "D"];
const SOLVED_ORDER = ["A", "D", "R", "C", "M"];

test("selecciona, cancela e intercambia documentos", () => {
  const initialState = new LibraryCatalogueState();
  const selected = selectLibraryCatalogueDocument({
    state: initialState,
    index: 0,
  });

  assert.equal(
    selected.code,
    LIBRARY_CATALOGUE_ACTION_CODE.DOCUMENT_SELECTED,
  );
  assert.equal(selected.state, initialState);
  assert.equal(selected.selectedIndex, 0);

  const cancelled = selectLibraryCatalogueDocument({
    state: selected.state,
    selectedIndex: selected.selectedIndex,
    index: 0,
  });

  assert.equal(
    cancelled.code,
    LIBRARY_CATALOGUE_ACTION_CODE.SELECTION_CANCELLED,
  );
  assert.equal(cancelled.state, initialState);
  assert.equal(cancelled.selectedIndex, null);

  const swapped = selectLibraryCatalogueDocument({
    state: selected.state,
    selectedIndex: selected.selectedIndex,
    index: 1,
  });

  assert.equal(
    swapped.code,
    LIBRARY_CATALOGUE_ACTION_CODE.DOCUMENTS_SWAPPED,
  );
  assert.deepEqual(swapped.state.order, ["M", "C", "A", "R", "D"]);
  assert.equal(swapped.state.phase, LIBRARY_CATALOGUE_PHASE.ARRANGING);
  assert.equal(swapped.state.attemptCount, 0);
  assert.equal(swapped.state.failureCode, null);
  assert.equal(swapped.selectedIndex, null);
  assert.deepEqual(initialState.order, INITIAL_ORDER);
});

test("un intercambio limpia un fallo anterior", () => {
  const failedState = new LibraryCatalogueState({
    phase: LIBRARY_CATALOGUE_PHASE.FAILED,
    attemptCount: 2,
    failureCode:
      LIBRARY_CATALOGUE_FAILURE_CODE.CONSTRAINTS_NOT_SATISFIED,
  });

  const result = selectLibraryCatalogueDocument({
    state: failedState,
    selectedIndex: 0,
    index: 1,
  });

  assert.equal(result.state.phase, LIBRARY_CATALOGUE_PHASE.ARRANGING);
  assert.equal(result.state.failureCode, null);
  assert.equal(result.state.attemptCount, 2);
});

test("rechaza índices inválidos sin modificar el estado", () => {
  const state = new LibraryCatalogueState();

  for (const index of [-1, 5, 1.5, "1"]) {
    const result = selectLibraryCatalogueDocument({ state, index });
    assert.equal(
      result.code,
      LIBRARY_CATALOGUE_ACTION_CODE.INVALID_INDEX,
    );
    assert.equal(result.state, state);
    assert.equal(result.selectedIndex, null);
  }
});

test("bloquea selección e intercambio en solved", () => {
  const state = solvedState();
  const result = selectLibraryCatalogueDocument({
    state,
    selectedIndex: 0,
    index: 1,
  });

  assert.equal(
    result.code,
    LIBRARY_CATALOGUE_ACTION_CODE.ALREADY_SOLVED,
  );
  assert.equal(result.state, state);
  assert.deepEqual(result.state.order, SOLVED_ORDER);
});

test("una selección incompleta no confirma ni cuenta intento", () => {
  const state = new LibraryCatalogueState();
  const result = confirmLibraryCatalogueOrder({
    state,
    selectedIndex: 2,
  });

  assert.equal(
    result.code,
    LIBRARY_CATALOGUE_ACTION_CODE.INCOMPLETE_SWAP,
  );
  assert.equal(result.state, state);
  assert.equal(result.state.attemptCount, 0);
});

test("un intento incorrecto funciona desde ready, arranging y failed", () => {
  const states = [
    new LibraryCatalogueState(),
    new LibraryCatalogueState({
      phase: LIBRARY_CATALOGUE_PHASE.ARRANGING,
      attemptCount: 1,
    }),
    new LibraryCatalogueState({
      phase: LIBRARY_CATALOGUE_PHASE.FAILED,
      attemptCount: 2,
      failureCode:
        LIBRARY_CATALOGUE_FAILURE_CODE.CONSTRAINTS_NOT_SATISFIED,
    }),
  ];

  for (const state of states) {
    const result = confirmLibraryCatalogueOrder({ state });

    assert.equal(
      result.code,
      LIBRARY_CATALOGUE_ACTION_CODE.ATTEMPT_FAILED,
    );
    assert.deepEqual(result.state.order, state.order);
    assert.equal(result.state.phase, LIBRARY_CATALOGUE_PHASE.FAILED);
    assert.equal(
      result.state.failureCode,
      LIBRARY_CATALOGUE_FAILURE_CODE.CONSTRAINTS_NOT_SATISFIED,
    );
    assert.equal(result.state.attemptCount, state.attemptCount + 1);
    assert.equal(result.violatedRuleCodes.length > 0, true);
    assert.equal(state.attemptCount, result.state.attemptCount - 1);
  }
});

test("resuelve desde ready, arranging y failed", () => {
  const states = [
    new LibraryCatalogueState({ order: SOLVED_ORDER }),
    new LibraryCatalogueState({
      order: SOLVED_ORDER,
      phase: LIBRARY_CATALOGUE_PHASE.ARRANGING,
      attemptCount: 1,
    }),
    new LibraryCatalogueState({
      order: SOLVED_ORDER,
      phase: LIBRARY_CATALOGUE_PHASE.FAILED,
      attemptCount: 2,
      failureCode:
        LIBRARY_CATALOGUE_FAILURE_CODE.CONSTRAINTS_NOT_SATISFIED,
    }),
  ];

  for (const state of states) {
    const result = confirmLibraryCatalogueOrder({ state });

    assert.equal(
      result.code,
      LIBRARY_CATALOGUE_ACTION_CODE.PUZZLE_SOLVED,
    );
    assert.equal(result.state.phase, LIBRARY_CATALOGUE_PHASE.SOLVED);
    assert.equal(result.state.failureCode, null);
    assert.equal(result.state.attemptCount, state.attemptCount + 1);
    assert.deepEqual(result.state.order, SOLVED_ORDER);
  }
});

test("solved no vuelve a resolver ni contar intentos", () => {
  const state = solvedState(3);
  const result = confirmLibraryCatalogueOrder({ state });

  assert.equal(
    result.code,
    LIBRARY_CATALOGUE_ACTION_CODE.ALREADY_SOLVED,
  );
  assert.equal(result.state, state);
  assert.equal(result.state.attemptCount, 3);
});

test("un estado estructuralmente inválido produce un error técnico", () => {
  assert.throws(
    () =>
      confirmLibraryCatalogueOrder({
        state: {
          order: ["A", "D"],
          phase: LIBRARY_CATALOGUE_PHASE.READY,
        },
      }),
    /LibraryCatalogueState válido/,
  );
});

test("reinicia sin perder pistas ni intentos y no reinicia solved", () => {
  const failedState = new LibraryCatalogueState({
    order: ["M", "C", "A", "R", "D"],
    phase: LIBRARY_CATALOGUE_PHASE.FAILED,
    hintsRead: [1, 2],
    attemptCount: 4,
    failureCode:
      LIBRARY_CATALOGUE_FAILURE_CODE.CONSTRAINTS_NOT_SATISFIED,
  });

  const reset = resetLibraryCatalogue({ state: failedState });

  assert.equal(
    reset.code,
    LIBRARY_CATALOGUE_ACTION_CODE.PUZZLE_RESET,
  );
  assert.deepEqual(reset.state.order, INITIAL_ORDER);
  assert.equal(reset.state.phase, LIBRARY_CATALOGUE_PHASE.READY);
  assert.equal(reset.state.failureCode, null);
  assert.deepEqual(reset.state.hintsRead, [1, 2]);
  assert.equal(reset.state.attemptCount, 4);
  assert.deepEqual(failedState.order, ["M", "C", "A", "R", "D"]);

  const solved = solvedState(4);
  const blocked = resetLibraryCatalogue({ state: solved });
  assert.equal(
    blocked.code,
    LIBRARY_CATALOGUE_ACTION_CODE.ALREADY_SOLVED,
  );
  assert.equal(blocked.state, solved);
});

test("define tres pistas inmutables y las revela en orden", () => {
  assert.equal(LIBRARY_CATALOGUE_HINTS.length, 3);
  assert.equal(Object.isFrozen(LIBRARY_CATALOGUE_HINTS), true);
  assert.equal(
    LIBRARY_CATALOGUE_HINTS.every((hint) => Object.isFrozen(hint)),
    true,
  );

  const initialState = new LibraryCatalogueState();
  let currentState = initialState;

  for (const level of [1, 2, 3]) {
    const result = revealNextLibraryCatalogueHint({
      state: currentState,
    });

    assert.equal(result.code, HINT_PROGRESS_CODE.HINT_REVEALED);
    assert.equal(result.level, level);
    assert.equal(result.hint, LIBRARY_CATALOGUE_HINTS[level - 1]);
    assert.deepEqual(result.state.hintsRead, [
      ...Array(level).keys(),
    ].map((index) => index + 1));
    assert.notEqual(result.state, currentState);
    currentState = result.state;
  }

  const fourth = revealNextLibraryCatalogueHint({
    state: currentState,
  });
  assert.equal(fourth.code, HINT_PROGRESS_CODE.ALL_HINTS_READ);
  assert.equal(fourth.state, currentState);
  assert.equal(fourth.level, 3);
  assert.equal(fourth.hint, LIBRARY_CATALOGUE_HINTS[2]);
  assert.deepEqual(initialState.hintsRead, []);
});

test("conserva pistas al reiniciar y no revela después de solved", () => {
  const hinted = revealNextLibraryCatalogueHint({
    state: new LibraryCatalogueState(),
  }).state;
  const reset = resetLibraryCatalogue({ state: hinted });

  assert.deepEqual(reset.state.hintsRead, [1]);

  const solved = new LibraryCatalogueState({
    order: SOLVED_ORDER,
    phase: LIBRARY_CATALOGUE_PHASE.SOLVED,
    hintsRead: [1],
    attemptCount: 1,
  });
  const blocked = revealNextLibraryCatalogueHint({ state: solved });

  assert.equal(
    blocked.code,
    LIBRARY_CATALOGUE_ACTION_CODE.ALREADY_SOLVED,
  );
  assert.equal(blocked.state, solved);
  assert.deepEqual(blocked.state.hintsRead, [1]);
  assert.equal(blocked.hint, LIBRARY_CATALOGUE_HINTS[0]);
});

function solvedState(attemptCount = 1) {
  return new LibraryCatalogueState({
    order: SOLVED_ORDER,
    phase: LIBRARY_CATALOGUE_PHASE.SOLVED,
    attemptCount,
  });
}
