import {
  LIBRARY_CATALOGUE_DOCUMENTS,
} from "./LibraryCatalogueData.js";

export const LIBRARY_CATALOGUE_VALIDATION_CODE = Object.freeze({
  VALID: "valid",
  INVALID_ORDER: "invalid_order",
  INVALID_DOCUMENT_COUNT: "invalid_document_count",
  UNKNOWN_DOCUMENT: "unknown_document",
  DUPLICATE_DOCUMENT: "duplicate_document",
  MISSING_DOCUMENT: "missing_document",
  CONSTRAINTS_NOT_SATISFIED: "constraints_not_satisfied",
});

export const LIBRARY_CATALOGUE_RULE_VIOLATION_CODE = Object.freeze({
  A_NOT_IMMEDIATELY_LEFT_OF_D: "a_not_immediately_left_of_d",
  C_AT_EDGE: "c_at_edge",
  M_NOT_RIGHT_OF_R: "m_not_right_of_r",
  D_ADJACENT_TO_M: "d_adjacent_to_m",
  R_NOT_LEFT_OF_C: "r_not_left_of_c",
  R_AT_EDGE: "r_at_edge",
});

const DOCUMENT_IDS = Object.freeze(
  LIBRARY_CATALOGUE_DOCUMENTS.map((document) => document.id),
);

export function validateLibraryCatalogueOrder(order) {
  if (!Array.isArray(order)) {
    return createResult(
      LIBRARY_CATALOGUE_VALIDATION_CODE.INVALID_ORDER,
    );
  }

  if (order.length !== DOCUMENT_IDS.length) {
    return createResult(
      LIBRARY_CATALOGUE_VALIDATION_CODE.INVALID_DOCUMENT_COUNT,
    );
  }

  if (!order.every((documentId) => typeof documentId === "string")) {
    return createResult(
      LIBRARY_CATALOGUE_VALIDATION_CODE.INVALID_ORDER,
    );
  }

  if (order.some((documentId) => !DOCUMENT_IDS.includes(documentId))) {
    return createResult(
      LIBRARY_CATALOGUE_VALIDATION_CODE.UNKNOWN_DOCUMENT,
    );
  }

  if (new Set(order).size !== order.length) {
    return createResult(
      LIBRARY_CATALOGUE_VALIDATION_CODE.DUPLICATE_DOCUMENT,
    );
  }

  if (DOCUMENT_IDS.some((documentId) => !order.includes(documentId))) {
    return createResult(
      LIBRARY_CATALOGUE_VALIDATION_CODE.MISSING_DOCUMENT,
    );
  }

  const violatedRuleCodes = findViolatedRuleCodes(order);

  if (violatedRuleCodes.length > 0) {
    return createResult(
      LIBRARY_CATALOGUE_VALIDATION_CODE.CONSTRAINTS_NOT_SATISFIED,
      violatedRuleCodes,
    );
  }

  return createResult(LIBRARY_CATALOGUE_VALIDATION_CODE.VALID);
}

function findViolatedRuleCodes(order) {
  const index = Object.fromEntries(
    order.map((documentId, position) => [documentId, position]),
  );
  const lastPosition = order.length - 1;
  const violatedRuleCodes = [];

  if (index.D !== index.A + 1) {
    violatedRuleCodes.push(
      LIBRARY_CATALOGUE_RULE_VIOLATION_CODE
        .A_NOT_IMMEDIATELY_LEFT_OF_D,
    );
  }

  if (index.C === 0 || index.C === lastPosition) {
    violatedRuleCodes.push(
      LIBRARY_CATALOGUE_RULE_VIOLATION_CODE.C_AT_EDGE,
    );
  }

  if (index.M < index.R) {
    violatedRuleCodes.push(
      LIBRARY_CATALOGUE_RULE_VIOLATION_CODE.M_NOT_RIGHT_OF_R,
    );
  }

  if (Math.abs(index.D - index.M) === 1) {
    violatedRuleCodes.push(
      LIBRARY_CATALOGUE_RULE_VIOLATION_CODE.D_ADJACENT_TO_M,
    );
  }

  if (index.R > index.C) {
    violatedRuleCodes.push(
      LIBRARY_CATALOGUE_RULE_VIOLATION_CODE.R_NOT_LEFT_OF_C,
    );
  }

  if (index.R === 0 || index.R === lastPosition) {
    violatedRuleCodes.push(
      LIBRARY_CATALOGUE_RULE_VIOLATION_CODE.R_AT_EDGE,
    );
  }

  return violatedRuleCodes;
}

function createResult(code, violatedRuleCodes = []) {
  return {
    valid: code === LIBRARY_CATALOGUE_VALIDATION_CODE.VALID,
    code,
    violatedRuleCodes: [...violatedRuleCodes],
  };
}
