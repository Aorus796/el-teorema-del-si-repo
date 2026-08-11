import test from "node:test";
import assert from "node:assert/strict";
import {
  LIBRARY_CATALOGUE_DOCUMENT_IDS,
  LIBRARY_CATALOGUE_DOCUMENTS,
  LIBRARY_CATALOGUE_INITIAL_ORDER,
  LIBRARY_CATALOGUE_RULE_IDS,
  LIBRARY_CATALOGUE_RULES,
  LIBRARY_CATALOGUE_SOLUTION,
} from "../../src/puzzles/library-catalogue/LibraryCatalogueData.js";

const EXPECTED_DOCUMENT_IDS = ["A", "D", "R", "C", "M"];

test("define exactamente cinco documentos con identificadores únicos", () => {
  const documentIds = LIBRARY_CATALOGUE_DOCUMENTS.map(
    (document) => document.id,
  );

  assert.equal(LIBRARY_CATALOGUE_DOCUMENTS.length, 5);
  assert.equal(new Set(documentIds).size, 5);
  assert.deepEqual(documentIds, EXPECTED_DOCUMENT_IDS);
});

test("el orden inicial contiene una vez cada documento", () => {
  assert.deepEqual(
    [...LIBRARY_CATALOGUE_INITIAL_ORDER].sort(),
    [...EXPECTED_DOCUMENT_IDS].sort(),
  );
  assert.equal(new Set(LIBRARY_CATALOGUE_INITIAL_ORDER).size, 5);
  assert.deepEqual(LIBRARY_CATALOGUE_INITIAL_ORDER, [
    "C",
    "M",
    "A",
    "R",
    "D",
  ]);
});

test("la solución documentada contiene una vez cada documento", () => {
  assert.deepEqual(
    [...LIBRARY_CATALOGUE_SOLUTION].sort(),
    [...EXPECTED_DOCUMENT_IDS].sort(),
  );
  assert.equal(new Set(LIBRARY_CATALOGUE_SOLUTION).size, 5);
  assert.deepEqual(LIBRARY_CATALOGUE_SOLUTION, [
    "A",
    "D",
    "R",
    "C",
    "M",
  ]);
});

test("define exactamente seis reglas con identificadores únicos", () => {
  const ruleIds = LIBRARY_CATALOGUE_RULES.map((rule) => rule.id);

  assert.equal(LIBRARY_CATALOGUE_RULES.length, 6);
  assert.equal(new Set(ruleIds).size, 6);
  assert.equal(Object.keys(LIBRARY_CATALOGUE_RULE_IDS).length, 6);
});

test("los datos exportados son inmutables en el uso normal", () => {
  assert.equal(Object.isFrozen(LIBRARY_CATALOGUE_DOCUMENT_IDS), true);
  assert.equal(Object.isFrozen(LIBRARY_CATALOGUE_DOCUMENTS), true);
  assert.equal(
    LIBRARY_CATALOGUE_DOCUMENTS.every((document) =>
      Object.isFrozen(document),
    ),
    true,
  );
  assert.equal(Object.isFrozen(LIBRARY_CATALOGUE_INITIAL_ORDER), true);
  assert.equal(Object.isFrozen(LIBRARY_CATALOGUE_SOLUTION), true);
  assert.equal(Object.isFrozen(LIBRARY_CATALOGUE_RULE_IDS), true);
  assert.equal(Object.isFrozen(LIBRARY_CATALOGUE_RULES), true);
  assert.equal(
    LIBRARY_CATALOGUE_RULES.every((rule) => Object.isFrozen(rule)),
    true,
  );

  assert.throws(() => {
    LIBRARY_CATALOGUE_INITIAL_ORDER[0] = "A";
  }, TypeError);
  assert.throws(() => {
    LIBRARY_CATALOGUE_DOCUMENTS[0].name = "Modificado";
  }, TypeError);
});
