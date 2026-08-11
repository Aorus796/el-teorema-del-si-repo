export const LIBRARY_CATALOGUE_DOCUMENT_IDS = Object.freeze({
  ATLAS: "A",
  FIELD_DIARY: "D",
  GATE_RECORD: "R",
  SIEVE_CATALOGUE: "C",
  MILL_MANUAL: "M",
});

export const LIBRARY_CATALOGUE_DOCUMENTS = Object.freeze([
  createDocument(LIBRARY_CATALOGUE_DOCUMENT_IDS.ATLAS, "Atlas de Órbitas"),
  createDocument(
    LIBRARY_CATALOGUE_DOCUMENT_IDS.FIELD_DIARY,
    "Diario de Campo",
  ),
  createDocument(
    LIBRARY_CATALOGUE_DOCUMENT_IDS.GATE_RECORD,
    "Registro de Compuertas",
  ),
  createDocument(
    LIBRARY_CATALOGUE_DOCUMENT_IDS.SIEVE_CATALOGUE,
    "Catálogo de la Criba",
  ),
  createDocument(
    LIBRARY_CATALOGUE_DOCUMENT_IDS.MILL_MANUAL,
    "Manual del Molino",
  ),
]);

export const LIBRARY_CATALOGUE_INITIAL_ORDER = Object.freeze([
  "C",
  "M",
  "A",
  "R",
  "D",
]);

export const LIBRARY_CATALOGUE_SOLUTION = Object.freeze([
  "A",
  "D",
  "R",
  "C",
  "M",
]);

export const LIBRARY_CATALOGUE_RULE_IDS = Object.freeze({
  A_IMMEDIATELY_LEFT_OF_D: "a-immediately-left-of-d",
  C_NOT_AT_EDGE: "c-not-at-edge",
  M_RIGHT_OF_R: "m-right-of-r",
  D_NOT_ADJACENT_TO_M: "d-not-adjacent-to-m",
  R_LEFT_OF_C: "r-left-of-c",
  R_NOT_AT_EDGE: "r-not-at-edge",
});

export const LIBRARY_CATALOGUE_RULES = Object.freeze([
  createRule(
    LIBRARY_CATALOGUE_RULE_IDS.A_IMMEDIATELY_LEFT_OF_D,
    "A está inmediatamente a la izquierda de D.",
  ),
  createRule(
    LIBRARY_CATALOGUE_RULE_IDS.C_NOT_AT_EDGE,
    "C no ocupa ningún extremo.",
  ),
  createRule(
    LIBRARY_CATALOGUE_RULE_IDS.M_RIGHT_OF_R,
    "M está a la derecha de R.",
  ),
  createRule(
    LIBRARY_CATALOGUE_RULE_IDS.D_NOT_ADJACENT_TO_M,
    "D no está junto a M.",
  ),
  createRule(
    LIBRARY_CATALOGUE_RULE_IDS.R_LEFT_OF_C,
    "R está a la izquierda de C.",
  ),
  createRule(
    LIBRARY_CATALOGUE_RULE_IDS.R_NOT_AT_EDGE,
    "R no ocupa ningún extremo.",
  ),
]);

function createDocument(id, name) {
  return Object.freeze({ id, name });
}

function createRule(id, text) {
  return Object.freeze({ id, text });
}
