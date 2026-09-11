import { validateHintsRead } from "../core/HintProgress.js";
import { DOUBT_BUDGET_QUESTION_LIMIT } from "./DoubtBudgetData.js";
import {
  DOUBT_BUDGET_VALIDATION_CODE,
  isKnownDoubtBudgetDossierId,
  isKnownDoubtBudgetQuestionId,
  validateDoubtBudgetIdentification,
} from "./DoubtBudgetValidator.js";

export const DOUBT_BUDGET_PHASE = Object.freeze({
  READY: "ready",
  CONSULTING: "consulting",
  FAILED: "failed",
  SOLVED: "solved",
});

/*
 * Los dos motivos por los que el Custodio rechaza una identificación.
 * Comparten valor literal con los códigos homónimos de
 * DOUBT_BUDGET_VALIDATION_CODE a propósito: son el mismo hecho visto desde
 * el estado guardado y desde la validación, y validateCoherence() los
 * compara directamente.
 */
export const DOUBT_BUDGET_FAILURE_CODE = Object.freeze({
  UNFORCED_IDENTIFICATION: DOUBT_BUDGET_VALIDATION_CODE.UNFORCED_IDENTIFICATION,
  INCORRECT_IDENTIFICATION:
    DOUBT_BUDGET_VALIDATION_CODE.INCORRECT_IDENTIFICATION,
});

/*
 * Estado persistente de la consulta de contención. Guarda las preguntas
 * formuladas (en orden) y el expediente identificado, nunca las respuestas:
 * éstas se derivan siempre del contenido inmutable, igual que las evidencias
 * del criterio del Archivo tampoco se guardan.
 */
export class DoubtBudgetState {
  constructor({
    askedQuestionIds = [],
    identifiedDossierId = null,
    phase = DOUBT_BUDGET_PHASE.READY,
    hintsRead = [],
    attemptCount = 0,
    failureCode = null,
  } = {}) {
    const validAskedQuestionIds = validateAskedQuestionIds(askedQuestionIds);
    const validHintsRead = validateHintsRead(hintsRead);

    validateIdentifiedDossierId(identifiedDossierId);
    validatePhase(phase);
    validateAttemptCount(attemptCount);
    validateFailureCode(failureCode);
    validateCoherence({
      askedQuestionIds: validAskedQuestionIds,
      identifiedDossierId,
      phase,
      failureCode,
      attemptCount,
    });

    this.askedQuestionIds = Object.freeze(validAskedQuestionIds);
    this.identifiedDossierId = identifiedDossierId;
    this.phase = phase;
    this.hintsRead = Object.freeze(validHintsRead);
    this.attemptCount = attemptCount;
    this.failureCode = failureCode;

    Object.freeze(this);
  }

  get remainingQuestionCount() {
    return DOUBT_BUDGET_QUESTION_LIMIT - this.askedQuestionIds.length;
  }

  toSaveData() {
    return {
      askedQuestionIds: [...this.askedQuestionIds],
      identifiedDossierId: this.identifiedDossierId,
      phase: this.phase,
      hintsRead: [...this.hintsRead],
      attemptCount: this.attemptCount,
      failureCode: this.failureCode,
    };
  }
}

function validateAskedQuestionIds(askedQuestionIds) {
  if (!Array.isArray(askedQuestionIds)) {
    throw new TypeError(
      "Las preguntas formuladas deben venir en un array de identificadores.",
    );
  }

  if (askedQuestionIds.length > DOUBT_BUDGET_QUESTION_LIMIT) {
    throw new RangeError(
      `La consulta no puede superar ${DOUBT_BUDGET_QUESTION_LIMIT} preguntas.`,
    );
  }

  for (const questionId of askedQuestionIds) {
    if (!isKnownDoubtBudgetQuestionId(questionId)) {
      throw new Error(`Pregunta de la consulta desconocida: ${questionId}.`);
    }
  }

  if (new Set(askedQuestionIds).size !== askedQuestionIds.length) {
    throw new Error("La consulta no puede repetir una pregunta ya formulada.");
  }

  return [...askedQuestionIds];
}

function validateIdentifiedDossierId(identifiedDossierId) {
  if (
    identifiedDossierId !== null &&
    !isKnownDoubtBudgetDossierId(identifiedDossierId)
  ) {
    throw new Error(
      `Expediente de contención desconocido: ${identifiedDossierId}.`,
    );
  }
}

function validatePhase(phase) {
  if (!Object.values(DOUBT_BUDGET_PHASE).includes(phase)) {
    throw new Error(`Fase de la consulta de contención no válida: ${phase}.`);
  }
}

function validateAttemptCount(attemptCount) {
  if (!Number.isInteger(attemptCount) || attemptCount < 0) {
    throw new Error("attemptCount debe ser un entero mayor o igual que cero.");
  }
}

function validateFailureCode(failureCode) {
  const isKnown =
    failureCode === null ||
    Object.values(DOUBT_BUDGET_FAILURE_CODE).includes(failureCode);

  if (!isKnown) {
    throw new Error(
      `Código de fallo de la consulta desconocido: ${failureCode}.`,
    );
  }
}

function validateCoherence({
  askedQuestionIds,
  identifiedDossierId,
  phase,
  failureCode,
  attemptCount,
}) {
  if (phase === DOUBT_BUDGET_PHASE.READY) {
    if (askedQuestionIds.length !== 0) {
      throw new Error(
        "La fase ready exige una consulta sin preguntas formuladas.",
      );
    }

    if (identifiedDossierId !== null) {
      throw new Error("La fase ready exige que no haya expediente concluido.");
    }
  }

  if (phase === DOUBT_BUDGET_PHASE.CONSULTING) {
    if (askedQuestionIds.length === 0) {
      throw new Error(
        "La fase consulting exige al menos una pregunta formulada.",
      );
    }

    if (identifiedDossierId !== null) {
      throw new Error(
        "La fase consulting exige que no haya expediente concluido.",
      );
    }
  }

  if (phase === DOUBT_BUDGET_PHASE.FAILED) {
    if (attemptCount < 1) {
      throw new Error(
        "La fase failed exige attemptCount mayor o igual que uno.",
      );
    }

    if (failureCode === null) {
      throw new Error("La fase failed exige un failureCode conocido.");
    }

    if (identifiedDossierId === null) {
      throw new Error("La fase failed exige un expediente concluido.");
    }

    assertIdentificationMatches({
      askedQuestionIds,
      identifiedDossierId,
      expectedCode: failureCode,
      message: `${failureCode} exige una identificación que el Custodio rechace por ese mismo motivo.`,
    });
  } else if (failureCode !== null) {
    throw new Error(`La fase ${phase} exige failureCode=null.`);
  }

  if (phase === DOUBT_BUDGET_PHASE.SOLVED) {
    if (attemptCount < 1) {
      throw new Error(
        "La fase solved exige attemptCount mayor o igual que uno.",
      );
    }

    if (identifiedDossierId === null) {
      throw new Error("La fase solved exige un expediente concluido.");
    }

    assertIdentificationMatches({
      askedQuestionIds,
      identifiedDossierId,
      expectedCode: DOUBT_BUDGET_VALIDATION_CODE.VALID,
      message:
        "La fase solved exige una identificación forzada por las respuestas obtenidas.",
    });
  }
}

function assertIdentificationMatches({
  askedQuestionIds,
  identifiedDossierId,
  expectedCode,
  message,
}) {
  const validation = validateDoubtBudgetIdentification({
    askedQuestionIds,
    dossierId: identifiedDossierId,
  });

  if (validation.code !== expectedCode) {
    throw new Error(message);
  }
}
