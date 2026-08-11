import { validateHintsRead } from "../core/HintProgress.js";
import { ARCHIVE_CRITERIA_INITIAL_VERDICTS } from "./ArchiveCriteriaData.js";
import {
  ARCHIVE_CRITERIA_VALIDATION_CODE,
  validateArchiveCriteriaVerdicts,
} from "./ArchiveCriteriaValidator.js";

export const ARCHIVE_CRITERIA_PHASE = Object.freeze({
  READY: "ready",
  CLASSIFYING: "classifying",
  FAILED: "failed",
  SOLVED: "solved",
});

export const ARCHIVE_CRITERIA_FAILURE_CODE = Object.freeze({
  INCOMPLETE_CLASSIFICATION: "incomplete_classification",
  INCORRECT_VERDICTS: "incorrect_verdicts",
});

export class ArchiveCriteriaState {
  constructor({
    verdicts = ARCHIVE_CRITERIA_INITIAL_VERDICTS,
    phase = ARCHIVE_CRITERIA_PHASE.READY,
    hintsRead = [],
    attemptCount = 0,
    failureCode = null,
  } = {}) {
    const validVerdicts = validateVerdictsStructure(verdicts);
    const validHintsRead = validateHintsRead(hintsRead);

    validatePhase(phase);
    validateAttemptCount(attemptCount);
    validateFailureCode(failureCode);
    validateCoherence({
      verdicts: validVerdicts.verdicts,
      verdictsValidation: validVerdicts.validation,
      phase,
      failureCode,
      attemptCount,
    });

    this.verdicts = Object.freeze({ ...validVerdicts.verdicts });
    this.phase = phase;
    this.hintsRead = Object.freeze(validHintsRead);
    this.attemptCount = attemptCount;
    this.failureCode = failureCode;

    Object.freeze(this);
  }

  toSaveData() {
    return {
      verdicts: { ...this.verdicts },
      phase: this.phase,
      hintsRead: [...this.hintsRead],
      attemptCount: this.attemptCount,
      failureCode: this.failureCode,
    };
  }
}

function validateVerdictsStructure(verdicts) {
  const validation = validateArchiveCriteriaVerdicts(verdicts);
  const isStructurallyValid =
    validation.code === ARCHIVE_CRITERIA_VALIDATION_CODE.VALID ||
    validation.code ===
      ARCHIVE_CRITERIA_VALIDATION_CODE.INCOMPLETE_CLASSIFICATION ||
    validation.code === ARCHIVE_CRITERIA_VALIDATION_CODE.INCORRECT_VERDICTS;

  if (!isStructurallyValid) {
    throw new Error(`Veredictos del Archivo no válidos: ${validation.code}.`);
  }

  return {
    verdicts: { ...verdicts },
    validation,
  };
}

function validatePhase(phase) {
  if (!Object.values(ARCHIVE_CRITERIA_PHASE).includes(phase)) {
    throw new Error(`Fase del criterio del Archivo no válida: ${phase}.`);
  }
}

function validateAttemptCount(attemptCount) {
  if (!Number.isInteger(attemptCount) || attemptCount < 0) {
    throw new Error(
      "attemptCount debe ser un entero mayor o igual que cero.",
    );
  }
}

function validateFailureCode(failureCode) {
  const isKnown =
    failureCode === null ||
    failureCode === ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION ||
    failureCode === ARCHIVE_CRITERIA_FAILURE_CODE.INCORRECT_VERDICTS;

  if (!isKnown) {
    throw new Error(
      `Código de fallo del Archivo desconocido: ${failureCode}.`,
    );
  }
}

function validateCoherence({
  verdicts,
  verdictsValidation,
  phase,
  failureCode,
  attemptCount,
}) {
  if (
    phase === ARCHIVE_CRITERIA_PHASE.READY &&
    !isEveryVerdictNull(verdicts)
  ) {
    throw new Error(
      "La fase ready exige que los seis veredictos sean null.",
    );
  }

  if (phase === ARCHIVE_CRITERIA_PHASE.FAILED) {
    if (attemptCount < 1) {
      throw new Error(
        "La fase failed exige attemptCount mayor o igual que uno.",
      );
    }

    if (failureCode === null) {
      throw new Error("La fase failed exige un failureCode conocido.");
    }

    if (
      failureCode ===
        ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION &&
      verdictsValidation.code !==
        ARCHIVE_CRITERIA_VALIDATION_CODE.INCOMPLETE_CLASSIFICATION
    ) {
      throw new Error(
        "incomplete_classification exige al menos un veredicto en null.",
      );
    }

    if (
      failureCode === ARCHIVE_CRITERIA_FAILURE_CODE.INCORRECT_VERDICTS &&
      verdictsValidation.code !==
        ARCHIVE_CRITERIA_VALIDATION_CODE.INCORRECT_VERDICTS
    ) {
      throw new Error(
        "incorrect_verdicts exige una clasificación completa pero incorrecta.",
      );
    }
  } else if (failureCode !== null) {
    throw new Error(`La fase ${phase} exige failureCode=null.`);
  }

  if (phase === ARCHIVE_CRITERIA_PHASE.SOLVED) {
    if (attemptCount < 1) {
      throw new Error(
        "La fase solved exige attemptCount mayor o igual que uno.",
      );
    }

    if (verdictsValidation.code !== ARCHIVE_CRITERIA_VALIDATION_CODE.VALID) {
      throw new Error(
        "La fase solved exige una clasificación que coincida con la solución.",
      );
    }
  }
}

function isEveryVerdictNull(verdicts) {
  return Object.values(verdicts).every((verdict) => verdict === null);
}
