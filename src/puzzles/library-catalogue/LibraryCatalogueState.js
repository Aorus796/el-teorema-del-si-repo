import { validateHintsRead } from "../core/HintProgress.js";
import {
  LIBRARY_CATALOGUE_INITIAL_ORDER,
} from "./LibraryCatalogueData.js";
import {
  LIBRARY_CATALOGUE_VALIDATION_CODE,
  validateLibraryCatalogueOrder,
} from "./LibraryCatalogueValidator.js";

export const LIBRARY_CATALOGUE_PHASE = Object.freeze({
  READY: "ready",
  ARRANGING: "arranging",
  FAILED: "failed",
  SOLVED: "solved",
});

export const LIBRARY_CATALOGUE_FAILURE_CODE = Object.freeze({
  CONSTRAINTS_NOT_SATISFIED: "constraints_not_satisfied",
});

export class LibraryCatalogueState {
  constructor({
    order = LIBRARY_CATALOGUE_INITIAL_ORDER,
    phase = LIBRARY_CATALOGUE_PHASE.READY,
    hintsRead = [],
    attemptCount = 0,
    failureCode = null,
  } = {}) {
    const validOrder = validateOrderStructure(order);
    const validHintsRead = validateHintsRead(hintsRead);

    validatePhase(phase);
    validateAttemptCount(attemptCount);
    validateFailureCode(failureCode);
    validateCoherence({
      orderValidation: validOrder.validation,
      phase,
      failureCode,
    });

    this.order = Object.freeze(validOrder.order);
    this.phase = phase;
    this.hintsRead = Object.freeze(validHintsRead);
    this.attemptCount = attemptCount;
    this.failureCode = failureCode;

    Object.freeze(this);
  }

  toSaveData() {
    return {
      order: [...this.order],
      phase: this.phase,
      hintsRead: [...this.hintsRead],
      attemptCount: this.attemptCount,
      failureCode: this.failureCode,
    };
  }
}

function validateOrderStructure(order) {
  const validation = validateLibraryCatalogueOrder(order);
  const isStructurallyValid =
    validation.code === LIBRARY_CATALOGUE_VALIDATION_CODE.VALID ||
    validation.code ===
      LIBRARY_CATALOGUE_VALIDATION_CODE.CONSTRAINTS_NOT_SATISFIED;

  if (!isStructurallyValid) {
    throw new Error(`Orden del catálogo no válido: ${validation.code}.`);
  }

  return {
    order: [...order],
    validation,
  };
}

function validatePhase(phase) {
  if (!Object.values(LIBRARY_CATALOGUE_PHASE).includes(phase)) {
    throw new Error(`Fase del catálogo no válida: ${phase}.`);
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
    failureCode ===
      LIBRARY_CATALOGUE_FAILURE_CODE.CONSTRAINTS_NOT_SATISFIED;

  if (!isKnown) {
    throw new Error(`Código de fallo del catálogo desconocido: ${failureCode}.`);
  }
}

function validateCoherence({
  orderValidation,
  phase,
  failureCode,
}) {
  if (
    phase === LIBRARY_CATALOGUE_PHASE.FAILED &&
    failureCode !==
      LIBRARY_CATALOGUE_FAILURE_CODE.CONSTRAINTS_NOT_SATISFIED
  ) {
    throw new Error(
      "La fase failed exige constraints_not_satisfied.",
    );
  }

  if (
    phase !== LIBRARY_CATALOGUE_PHASE.FAILED &&
    failureCode !== null
  ) {
    throw new Error(
      `La fase ${phase} exige failureCode=null.`,
    );
  }

  if (
    phase === LIBRARY_CATALOGUE_PHASE.SOLVED &&
    !orderValidation.valid
  ) {
    throw new Error(
      "La fase solved exige un orden que satisfaga las seis reglas.",
    );
  }
}
