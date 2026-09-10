import { HINT_PROGRESS_CODE, revealNextHint } from "../core/HintProgress.js";
import { getDoubtBudgetHint } from "./DoubtBudgetHints.js";
import {
  DOUBT_BUDGET_FAILURE_CODE,
  DOUBT_BUDGET_PHASE,
  DoubtBudgetState,
} from "./DoubtBudgetState.js";
import {
  DOUBT_BUDGET_VALIDATION_CODE,
  getCompatibleDossiers,
  getDoubtBudgetAnswer,
  validateDoubtBudgetIdentification,
  validateDoubtBudgetQuestion,
} from "./DoubtBudgetValidator.js";

export const DOUBT_BUDGET_ACTION_CODE = Object.freeze({
  QUESTION_ASKED: "question_asked",
  INVALID_QUESTION: DOUBT_BUDGET_VALIDATION_CODE.INVALID_QUESTION,
  QUESTION_ALREADY_ASKED: DOUBT_BUDGET_VALIDATION_CODE.QUESTION_ALREADY_ASKED,
  BUDGET_EXHAUSTED: DOUBT_BUDGET_VALIDATION_CODE.BUDGET_EXHAUSTED,
  INVALID_DOSSIER: DOUBT_BUDGET_VALIDATION_CODE.INVALID_DOSSIER,
  IDENTIFICATION_UNFORCED:
    DOUBT_BUDGET_VALIDATION_CODE.UNFORCED_IDENTIFICATION,
  IDENTIFICATION_INCORRECT:
    DOUBT_BUDGET_VALIDATION_CODE.INCORRECT_IDENTIFICATION,
  PUZZLE_SOLVED: "puzzle_solved",
  PUZZLE_RESET: "puzzle_reset",
  HINT_REVEALED: HINT_PROGRESS_CODE.HINT_REVEALED,
  ALL_HINTS_READ: HINT_PROGRESS_CODE.ALL_HINTS_READ,
  ALREADY_SOLVED: "already_solved",
});

/*
 * Formula una pregunta al Custodio. Toda acción rechazada devuelve el mismo
 * estado de entrada sin modificar: pedir una cuarta pregunta con el
 * presupuesto agotado no cuesta nada porque, sencillamente, no llega a
 * formularse.
 */
export function askDoubtBudgetQuestion({ state, questionId }) {
  assertState(state);

  if (state.phase === DOUBT_BUDGET_PHASE.SOLVED) {
    return createResult(DOUBT_BUDGET_ACTION_CODE.ALREADY_SOLVED, state);
  }

  const validation = validateDoubtBudgetQuestion({
    askedQuestionIds: state.askedQuestionIds,
    questionId,
  });

  if (validation.code !== DOUBT_BUDGET_VALIDATION_CODE.VALID) {
    return createResult(validation.code, state);
  }

  const askedQuestionIds = [...state.askedQuestionIds, questionId];
  const nextState = createNextState(state, {
    askedQuestionIds,
    /*
     * Retomar la consulta tras una identificación rechazada descarta esa
     * identificación: el expediente de consulta vuelve a estar abierto.
     */
    identifiedDossierId: null,
    phase: DOUBT_BUDGET_PHASE.CONSULTING,
    failureCode: null,
  });

  return {
    ...createResult(DOUBT_BUDGET_ACTION_CODE.QUESTION_ASKED, nextState),
    questionId,
    answer: getDoubtBudgetAnswer(questionId),
    compatibleDossierIds: getCompatibleDossiers({ askedQuestionIds }).map(
      (dossier) => dossier.id,
    ),
  };
}

/*
 * Identifica un expediente. El Custodio solo acepta la identificación que
 * las respuestas ya obtenidas obligan a sostener: mientras siga habiendo más
 * de un expediente compatible, incluso nombrar el expediente real es una
 * identificación no forzada.
 */
export function identifyDoubtBudgetDossier({ state, dossierId }) {
  assertState(state);

  if (state.phase === DOUBT_BUDGET_PHASE.SOLVED) {
    return createResult(DOUBT_BUDGET_ACTION_CODE.ALREADY_SOLVED, state);
  }

  const validation = validateDoubtBudgetIdentification({
    askedQuestionIds: state.askedQuestionIds,
    dossierId,
  });

  if (validation.code === DOUBT_BUDGET_VALIDATION_CODE.INVALID_DOSSIER) {
    return createResult(DOUBT_BUDGET_ACTION_CODE.INVALID_DOSSIER, state);
  }

  if (validation.code === DOUBT_BUDGET_VALIDATION_CODE.VALID) {
    const nextState = createNextState(state, {
      identifiedDossierId: dossierId,
      phase: DOUBT_BUDGET_PHASE.SOLVED,
      attemptCount: state.attemptCount + 1,
      failureCode: null,
    });

    return {
      ...createResult(DOUBT_BUDGET_ACTION_CODE.PUZZLE_SOLVED, nextState),
      compatibleDossierIds: [...validation.compatibleDossierIds],
    };
  }

  const failureCode =
    validation.code === DOUBT_BUDGET_VALIDATION_CODE.UNFORCED_IDENTIFICATION
      ? DOUBT_BUDGET_FAILURE_CODE.UNFORCED_IDENTIFICATION
      : DOUBT_BUDGET_FAILURE_CODE.INCORRECT_IDENTIFICATION;

  const nextState = createNextState(state, {
    identifiedDossierId: dossierId,
    phase: DOUBT_BUDGET_PHASE.FAILED,
    attemptCount: state.attemptCount + 1,
    failureCode,
  });

  return {
    ...createResult(validation.code, nextState),
    compatibleDossierIds: [...validation.compatibleDossierIds],
  };
}

/*
 * Abre una consulta nueva. Conserva las pistas leídas y el número de
 * intentos ya realizados, exactamente igual que resetArchiveCriteria().
 */
export function resetDoubtBudgetConsultation({ state }) {
  assertState(state);

  if (state.phase === DOUBT_BUDGET_PHASE.SOLVED) {
    return createResult(DOUBT_BUDGET_ACTION_CODE.ALREADY_SOLVED, state);
  }

  const nextState = createNextState(state, {
    askedQuestionIds: [],
    identifiedDossierId: null,
    phase: DOUBT_BUDGET_PHASE.READY,
    failureCode: null,
  });

  return createResult(DOUBT_BUDGET_ACTION_CODE.PUZZLE_RESET, nextState);
}

export function revealNextDoubtBudgetHint({ state }) {
  assertState(state);

  if (state.phase === DOUBT_BUDGET_PHASE.SOLVED) {
    const level = state.hintsRead.at(-1) ?? null;

    return {
      ...createResult(DOUBT_BUDGET_ACTION_CODE.ALREADY_SOLVED, state),
      level,
      hint: getDoubtBudgetHint(level),
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
    hint: getDoubtBudgetHint(hintResult.level),
  };
}

function createNextState(state, changes) {
  return new DoubtBudgetState({
    ...state.toSaveData(),
    ...changes,
  });
}

function createResult(code, state) {
  return { code, state };
}

function assertState(state) {
  if (!(state instanceof DoubtBudgetState)) {
    throw new TypeError("El controlador exige un DoubtBudgetState válido.");
  }
}
