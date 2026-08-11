import {
  HINT_PROGRESS_CODE,
  revealNextHint,
} from "../core/HintProgress.js";
import {
  ARCHIVE_CRITERIA_CLAIMS,
  ARCHIVE_CRITERIA_INITIAL_VERDICTS,
  ARCHIVE_CRITERIA_VERDICT,
} from "./ArchiveCriteriaData.js";
import {
  getArchiveCriteriaHint,
} from "./ArchiveCriteriaHints.js";
import {
  ARCHIVE_CRITERIA_FAILURE_CODE,
  ARCHIVE_CRITERIA_PHASE,
  ArchiveCriteriaState,
} from "./ArchiveCriteriaState.js";
import {
  ARCHIVE_CRITERIA_VALIDATION_CODE,
  validateArchiveCriteriaVerdicts,
} from "./ArchiveCriteriaValidator.js";

export const ARCHIVE_CRITERIA_ACTION_CODE = Object.freeze({
  VERDICT_CHANGED: "verdict_changed",
  INVALID_CLAIM: "invalid_claim",
  CONFIRMATION_INCOMPLETE: "confirmation_incomplete",
  CONFIRMATION_INCORRECT: "confirmation_incorrect",
  PUZZLE_SOLVED: "puzzle_solved",
  PUZZLE_RESET: "puzzle_reset",
  HINT_REVEALED: HINT_PROGRESS_CODE.HINT_REVEALED,
  ALL_HINTS_READ: HINT_PROGRESS_CODE.ALL_HINTS_READ,
  ALREADY_SOLVED: "already_solved",
});

const CLAIM_IDS = Object.freeze(
  ARCHIVE_CRITERIA_CLAIMS.map((claim) => claim.id),
);

const VERDICT_CYCLE = Object.freeze([
  null,
  ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
  ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
  ARCHIVE_CRITERIA_VERDICT.UNDECIDABLE,
]);

export function advanceArchiveCriteriaVerdict({ state, claimId }) {
  return changeVerdict({ state, claimId, direction: 1 });
}

export function reverseArchiveCriteriaVerdict({ state, claimId }) {
  return changeVerdict({ state, claimId, direction: -1 });
}

export function confirmArchiveCriteriaClassification({ state }) {
  assertState(state);

  if (state.phase === ARCHIVE_CRITERIA_PHASE.SOLVED) {
    return createResult(ARCHIVE_CRITERIA_ACTION_CODE.ALREADY_SOLVED, state);
  }

  const validation = validateArchiveCriteriaVerdicts(state.verdicts);

  if (
    validation.code ===
    ARCHIVE_CRITERIA_VALIDATION_CODE.INCOMPLETE_CLASSIFICATION
  ) {
    const nextState = createNextState(state, {
      phase: ARCHIVE_CRITERIA_PHASE.FAILED,
      attemptCount: state.attemptCount + 1,
      failureCode: ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION,
    });

    return createResult(
      ARCHIVE_CRITERIA_ACTION_CODE.CONFIRMATION_INCOMPLETE,
      nextState,
    );
  }

  if (
    validation.code === ARCHIVE_CRITERIA_VALIDATION_CODE.INCORRECT_VERDICTS
  ) {
    const nextState = createNextState(state, {
      phase: ARCHIVE_CRITERIA_PHASE.FAILED,
      attemptCount: state.attemptCount + 1,
      failureCode: ARCHIVE_CRITERIA_FAILURE_CODE.INCORRECT_VERDICTS,
    });

    return {
      ...createResult(
        ARCHIVE_CRITERIA_ACTION_CODE.CONFIRMATION_INCORRECT,
        nextState,
      ),
      incorrectClaimIds: [...validation.incorrectClaimIds],
    };
  }

  if (validation.code !== ARCHIVE_CRITERIA_VALIDATION_CODE.VALID) {
    throw new Error(
      `Error estructural al confirmar la clasificación: ${validation.code}.`,
    );
  }

  const nextState = createNextState(state, {
    phase: ARCHIVE_CRITERIA_PHASE.SOLVED,
    attemptCount: state.attemptCount + 1,
    failureCode: null,
  });

  return createResult(ARCHIVE_CRITERIA_ACTION_CODE.PUZZLE_SOLVED, nextState);
}

export function resetArchiveCriteria({ state }) {
  assertState(state);

  if (state.phase === ARCHIVE_CRITERIA_PHASE.SOLVED) {
    return createResult(ARCHIVE_CRITERIA_ACTION_CODE.ALREADY_SOLVED, state);
  }

  const nextState = createNextState(state, {
    verdicts: ARCHIVE_CRITERIA_INITIAL_VERDICTS,
    phase: ARCHIVE_CRITERIA_PHASE.READY,
    failureCode: null,
  });

  return createResult(ARCHIVE_CRITERIA_ACTION_CODE.PUZZLE_RESET, nextState);
}

export function revealNextArchiveCriteriaHint({ state }) {
  assertState(state);

  if (state.phase === ARCHIVE_CRITERIA_PHASE.SOLVED) {
    const level = state.hintsRead.at(-1) ?? null;

    return {
      ...createResult(ARCHIVE_CRITERIA_ACTION_CODE.ALREADY_SOLVED, state),
      level,
      hint: getArchiveCriteriaHint(level),
    };
  }

  const hintResult = revealNextHint(state.hintsRead);
  const nextState =
    hintResult.code === HINT_PROGRESS_CODE.ALL_HINTS_READ
      ? state
      : createNextState(state, { hintsRead: hintResult.hintsRead });

  return {
    ...createResult(hintResult.code, nextState),
    level: hintResult.level,
    hint: getArchiveCriteriaHint(hintResult.level),
  };
}

function changeVerdict({ state, claimId, direction }) {
  assertState(state);

  if (state.phase === ARCHIVE_CRITERIA_PHASE.SOLVED) {
    return createResult(ARCHIVE_CRITERIA_ACTION_CODE.ALREADY_SOLVED, state);
  }

  if (!isKnownClaimId(claimId)) {
    return createResult(ARCHIVE_CRITERIA_ACTION_CODE.INVALID_CLAIM, state);
  }

  const nextVerdicts = {
    ...state.verdicts,
    [claimId]: cycleVerdict(state.verdicts[claimId], direction),
  };

  const nextState = createNextState(state, {
    verdicts: nextVerdicts,
    phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
    failureCode: null,
  });

  return createResult(ARCHIVE_CRITERIA_ACTION_CODE.VERDICT_CHANGED, nextState);
}

function cycleVerdict(current, direction) {
  const index = VERDICT_CYCLE.indexOf(current);
  const nextIndex =
    (index + direction + VERDICT_CYCLE.length) % VERDICT_CYCLE.length;

  return VERDICT_CYCLE[nextIndex];
}

function createNextState(state, changes) {
  return new ArchiveCriteriaState({
    ...state.toSaveData(),
    ...changes,
  });
}

function createResult(code, state) {
  return { code, state };
}

function isKnownClaimId(claimId) {
  return CLAIM_IDS.includes(claimId);
}

function assertState(state) {
  if (!(state instanceof ArchiveCriteriaState)) {
    throw new TypeError(
      "El controlador exige un ArchiveCriteriaState válido.",
    );
  }
}
