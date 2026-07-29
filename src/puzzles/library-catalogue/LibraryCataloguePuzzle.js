import {
  HINT_PROGRESS_CODE,
  revealNextHint,
} from "../core/HintProgress.js";
import {
  LIBRARY_CATALOGUE_INITIAL_ORDER,
} from "./LibraryCatalogueData.js";
import {
  getLibraryCatalogueHint,
} from "./LibraryCatalogueHints.js";
import {
  LIBRARY_CATALOGUE_FAILURE_CODE,
  LIBRARY_CATALOGUE_PHASE,
  LibraryCatalogueState,
} from "./LibraryCatalogueState.js";
import {
  LIBRARY_CATALOGUE_VALIDATION_CODE,
  validateLibraryCatalogueOrder,
} from "./LibraryCatalogueValidator.js";

export const LIBRARY_CATALOGUE_ACTION_CODE = Object.freeze({
  DOCUMENT_SELECTED: "document_selected",
  SELECTION_CANCELLED: "selection_cancelled",
  DOCUMENTS_SWAPPED: "documents_swapped",
  INVALID_INDEX: "invalid_index",
  INCOMPLETE_SWAP: "incomplete_swap",
  ATTEMPT_FAILED: "attempt_failed",
  PUZZLE_SOLVED: "puzzle_solved",
  PUZZLE_RESET: "puzzle_reset",
  HINT_REVEALED: HINT_PROGRESS_CODE.HINT_REVEALED,
  ALL_HINTS_READ: HINT_PROGRESS_CODE.ALL_HINTS_READ,
  ALREADY_SOLVED: "already_solved",
});

export function selectLibraryCatalogueDocument({
  state,
  selectedIndex = null,
  index,
}) {
  assertState(state);

  if (state.phase === LIBRARY_CATALOGUE_PHASE.SOLVED) {
    return createResult(
      LIBRARY_CATALOGUE_ACTION_CODE.ALREADY_SOLVED,
      state,
      selectedIndex,
    );
  }

  if (!isValidIndex(index) || !isValidSelectedIndex(selectedIndex)) {
    return createResult(
      LIBRARY_CATALOGUE_ACTION_CODE.INVALID_INDEX,
      state,
      selectedIndex,
    );
  }

  if (selectedIndex === null) {
    return createResult(
      LIBRARY_CATALOGUE_ACTION_CODE.DOCUMENT_SELECTED,
      state,
      index,
    );
  }

  if (selectedIndex === index) {
    return createResult(
      LIBRARY_CATALOGUE_ACTION_CODE.SELECTION_CANCELLED,
      state,
      null,
    );
  }

  const order = [...state.order];
  [order[selectedIndex], order[index]] = [
    order[index],
    order[selectedIndex],
  ];

  const nextState = createNextState(state, {
    order,
    phase: LIBRARY_CATALOGUE_PHASE.ARRANGING,
    failureCode: null,
  });

  return createResult(
    LIBRARY_CATALOGUE_ACTION_CODE.DOCUMENTS_SWAPPED,
    nextState,
    null,
  );
}

export function confirmLibraryCatalogueOrder({
  state,
  selectedIndex = null,
}) {
  assertState(state);

  if (state.phase === LIBRARY_CATALOGUE_PHASE.SOLVED) {
    return createResult(
      LIBRARY_CATALOGUE_ACTION_CODE.ALREADY_SOLVED,
      state,
      selectedIndex,
    );
  }

  if (selectedIndex !== null) {
    return createResult(
      LIBRARY_CATALOGUE_ACTION_CODE.INCOMPLETE_SWAP,
      state,
      selectedIndex,
    );
  }

  const validation = validateLibraryCatalogueOrder(state.order);

  if (
    validation.code ===
    LIBRARY_CATALOGUE_VALIDATION_CODE.CONSTRAINTS_NOT_SATISFIED
  ) {
    const nextState = createNextState(state, {
      phase: LIBRARY_CATALOGUE_PHASE.FAILED,
      attemptCount: state.attemptCount + 1,
      failureCode:
        LIBRARY_CATALOGUE_FAILURE_CODE.CONSTRAINTS_NOT_SATISFIED,
    });

    return {
      ...createResult(
        LIBRARY_CATALOGUE_ACTION_CODE.ATTEMPT_FAILED,
        nextState,
        null,
      ),
      violatedRuleCodes: [...validation.violatedRuleCodes],
    };
  }

  if (validation.code !== LIBRARY_CATALOGUE_VALIDATION_CODE.VALID) {
    throw new Error(
      `Error estructural al confirmar el catálogo: ${validation.code}.`,
    );
  }

  const nextState = createNextState(state, {
    phase: LIBRARY_CATALOGUE_PHASE.SOLVED,
    attemptCount: state.attemptCount + 1,
    failureCode: null,
  });

  return createResult(
    LIBRARY_CATALOGUE_ACTION_CODE.PUZZLE_SOLVED,
    nextState,
    null,
  );
}

export function resetLibraryCatalogue({ state }) {
  assertState(state);

  if (state.phase === LIBRARY_CATALOGUE_PHASE.SOLVED) {
    return createResult(
      LIBRARY_CATALOGUE_ACTION_CODE.ALREADY_SOLVED,
      state,
      null,
    );
  }

  const nextState = createNextState(state, {
    order: LIBRARY_CATALOGUE_INITIAL_ORDER,
    phase: LIBRARY_CATALOGUE_PHASE.READY,
    failureCode: null,
  });

  return createResult(
    LIBRARY_CATALOGUE_ACTION_CODE.PUZZLE_RESET,
    nextState,
    null,
  );
}

export function revealNextLibraryCatalogueHint({ state }) {
  assertState(state);

  if (state.phase === LIBRARY_CATALOGUE_PHASE.SOLVED) {
    const level = state.hintsRead.at(-1) ?? null;
    return {
      ...createResult(
        LIBRARY_CATALOGUE_ACTION_CODE.ALREADY_SOLVED,
        state,
        null,
      ),
      level,
      hint: getLibraryCatalogueHint(level),
    };
  }

  const hintResult = revealNextHint(state.hintsRead);
  const nextState =
    hintResult.code === HINT_PROGRESS_CODE.ALL_HINTS_READ
      ? state
      : createNextState(state, {
          hintsRead: hintResult.hintsRead,
        });

  return {
    ...createResult(hintResult.code, nextState, null),
    level: hintResult.level,
    hint: getLibraryCatalogueHint(hintResult.level),
  };
}

function createNextState(state, changes) {
  return new LibraryCatalogueState({
    ...state.toSaveData(),
    ...changes,
  });
}

function createResult(code, state, selectedIndex) {
  return {
    code,
    state,
    selectedIndex,
  };
}

function isValidIndex(index) {
  return (
    Number.isInteger(index) &&
    index >= 0 &&
    index < LIBRARY_CATALOGUE_INITIAL_ORDER.length
  );
}

function isValidSelectedIndex(selectedIndex) {
  return selectedIndex === null || isValidIndex(selectedIndex);
}

function assertState(state) {
  if (!(state instanceof LibraryCatalogueState)) {
    throw new TypeError(
      "El controlador exige un LibraryCatalogueState válido.",
    );
  }
}
