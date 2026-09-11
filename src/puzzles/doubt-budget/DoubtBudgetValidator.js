import {
  DOUBT_BUDGET_DOSSIERS,
  DOUBT_BUDGET_QUESTION_LIMIT,
  DOUBT_BUDGET_QUESTIONS,
  DOUBT_BUDGET_TRUE_DOSSIER,
} from "./DoubtBudgetData.js";

export const DOUBT_BUDGET_VALIDATION_CODE = Object.freeze({
  VALID: "valid",
  UNFORCED_IDENTIFICATION: "unforced_identification",
  INCORRECT_IDENTIFICATION: "incorrect_identification",
  BUDGET_EXHAUSTED: "budget_exhausted",
  QUESTION_ALREADY_ASKED: "question_already_asked",
  INVALID_QUESTION: "invalid_question",
  INVALID_DOSSIER: "invalid_dossier",
});

const QUESTION_IDS = Object.freeze(
  DOUBT_BUDGET_QUESTIONS.map((question) => question.id),
);
const DOSSIER_IDS = Object.freeze(
  DOUBT_BUDGET_DOSSIERS.map((dossier) => dossier.id),
);

export function isKnownDoubtBudgetQuestionId(questionId) {
  return QUESTION_IDS.includes(questionId);
}

export function isKnownDoubtBudgetDossierId(dossierId) {
  return DOSSIER_IDS.includes(dossierId);
}

export function findDoubtBudgetQuestion(questionId) {
  return (
    DOUBT_BUDGET_QUESTIONS.find((question) => question.id === questionId) ??
    null
  );
}

export function findDoubtBudgetDossier(dossierId) {
  return (
    DOUBT_BUDGET_DOSSIERS.find((dossier) => dossier.id === dossierId) ?? null
  );
}

/*
 * La respuesta del Custodio nunca se almacena: se calcula aplicando el
 * predicado real de la pregunta al expediente real. Guardarla sería tener
 * dos fuentes de verdad para el mismo hecho.
 */
export function getDoubtBudgetAnswer(questionId) {
  const question = findDoubtBudgetQuestion(questionId);

  if (question === null) {
    throw new Error(`Pregunta de la consulta desconocida: ${questionId}.`);
  }

  return question.predicate(DOUBT_BUDGET_TRUE_DOSSIER.seats) === true;
}

export function getDoubtBudgetAnswers(askedQuestionIds = []) {
  return normalizeAskedQuestionIds(askedQuestionIds).map((questionId) => ({
    questionId,
    answer: getDoubtBudgetAnswer(questionId),
  }));
}

/*
 * Condición de victoria del puzle, calculada siempre, nunca tabulada.
 *
 * Recorre los ocho expedientes posibles y conserva los que responderían
 * exactamente lo mismo que el expediente real a las preguntas ya
 * formuladas. Si queda uno solo, esa identificación está forzada por las
 * respuestas obtenidas y el Custodio puede aceptarla. Si quedan dos o más,
 * ninguna identificación queda forzada -- ni siquiera la correcta -- porque
 * la consulta no zanjaría el caso.
 *
 * No existe ninguna lista de ternas "ganadoras" en paralelo, y no debe
 * existir: hay ternas que no distinguen los ocho expedientes en el peor caso
 * y que, sin embargo, identifican el expediente real de forma única por las
 * respuestas concretas que éste da. Una tabla estática rechazaría esas
 * partidas legítimas.
 */
export function getCompatibleDossiers({ askedQuestionIds = [] } = {}) {
  const questions = normalizeAskedQuestionIds(askedQuestionIds).map(
    (questionId) => {
      const question = findDoubtBudgetQuestion(questionId);

      if (question === null) {
        throw new Error(`Pregunta de la consulta desconocida: ${questionId}.`);
      }

      return question;
    },
  );

  return DOUBT_BUDGET_DOSSIERS.filter((dossier) =>
    questions.every(
      (question) =>
        question.predicate(dossier.seats) ===
        question.predicate(DOUBT_BUDGET_TRUE_DOSSIER.seats),
    ),
  );
}

export function validateDoubtBudgetQuestion({
  askedQuestionIds = [],
  questionId,
} = {}) {
  const asked = normalizeAskedQuestionIds(askedQuestionIds);

  if (!isKnownDoubtBudgetQuestionId(questionId)) {
    return createResult(DOUBT_BUDGET_VALIDATION_CODE.INVALID_QUESTION);
  }

  /*
   * El presupuesto se comprueba antes que la repetición: agotado el
   * presupuesto, el Custodio no puede conceder ninguna entrada más, sea
   * nueva o repetida.
   */
  if (asked.length >= DOUBT_BUDGET_QUESTION_LIMIT) {
    return createResult(DOUBT_BUDGET_VALIDATION_CODE.BUDGET_EXHAUSTED);
  }

  if (asked.includes(questionId)) {
    return createResult(DOUBT_BUDGET_VALIDATION_CODE.QUESTION_ALREADY_ASKED);
  }

  return createResult(DOUBT_BUDGET_VALIDATION_CODE.VALID);
}

/*
 * Orden de comprobación deliberado: un expediente inexistente es un error
 * estructural; después, la falta de forzamiento manda sobre el acierto o el
 * error, porque el Custodio rechaza por igual cualquier identificación que
 * su propio expediente de consulta no obligue a sostener.
 *
 * Cuando queda un único expediente compatible, ese expediente es siempre el
 * real (el expediente real responde por definición igual que sí mismo), así
 * que INCORRECT_IDENTIFICATION solo puede darse con la consulta ya zanjada.
 */
export function validateDoubtBudgetIdentification({
  askedQuestionIds = [],
  dossierId,
} = {}) {
  if (!isKnownDoubtBudgetDossierId(dossierId)) {
    return createResult(DOUBT_BUDGET_VALIDATION_CODE.INVALID_DOSSIER);
  }

  const compatibleDossiers = getCompatibleDossiers({ askedQuestionIds });

  if (compatibleDossiers.length > 1) {
    return createResult(
      DOUBT_BUDGET_VALIDATION_CODE.UNFORCED_IDENTIFICATION,
      compatibleDossiers,
    );
  }

  if (dossierId !== DOUBT_BUDGET_TRUE_DOSSIER.id) {
    return createResult(
      DOUBT_BUDGET_VALIDATION_CODE.INCORRECT_IDENTIFICATION,
      compatibleDossiers,
    );
  }

  return createResult(DOUBT_BUDGET_VALIDATION_CODE.VALID, compatibleDossiers);
}

function normalizeAskedQuestionIds(askedQuestionIds) {
  if (!Array.isArray(askedQuestionIds)) {
    throw new TypeError(
      "Las preguntas formuladas deben venir en un array de identificadores.",
    );
  }

  return [...askedQuestionIds];
}

function createResult(code, compatibleDossiers = []) {
  return {
    valid: code === DOUBT_BUDGET_VALIDATION_CODE.VALID,
    code,
    compatibleDossierIds: compatibleDossiers.map((dossier) => dossier.id),
  };
}
