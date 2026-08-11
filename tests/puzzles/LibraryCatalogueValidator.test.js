import test from "node:test";
import assert from "node:assert/strict";
import {
  LIBRARY_CATALOGUE_DOCUMENTS,
  LIBRARY_CATALOGUE_INITIAL_ORDER,
  LIBRARY_CATALOGUE_SOLUTION,
} from "../../src/puzzles/library-catalogue/LibraryCatalogueData.js";
import {
  LIBRARY_CATALOGUE_RULE_VIOLATION_CODE,
  LIBRARY_CATALOGUE_VALIDATION_CODE,
  validateLibraryCatalogueOrder,
} from "../../src/puzzles/library-catalogue/LibraryCatalogueValidator.js";

test("acepta A-D-R-C-M", () => {
  assert.deepEqual(
    validateLibraryCatalogueOrder(LIBRARY_CATALOGUE_SOLUTION),
    {
      valid: true,
      code: LIBRARY_CATALOGUE_VALIDATION_CODE.VALID,
      violatedRuleCodes: [],
    },
  );
});

test("rechaza el orden inicial C-M-A-R-D", () => {
  const result = validateLibraryCatalogueOrder(
    LIBRARY_CATALOGUE_INITIAL_ORDER,
  );

  assert.equal(result.valid, false);
  assert.equal(
    result.code,
    LIBRARY_CATALOGUE_VALIDATION_CODE.CONSTRAINTS_NOT_SATISFIED,
  );
});

test("devuelve el código de cada regla que puede incumplirse", () => {
  const cases = [
    {
      order: ["C", "M", "A", "R", "D"],
      code:
        LIBRARY_CATALOGUE_RULE_VIOLATION_CODE
          .A_NOT_IMMEDIATELY_LEFT_OF_D,
    },
    {
      order: ["C", "A", "D", "R", "M"],
      code: LIBRARY_CATALOGUE_RULE_VIOLATION_CODE.C_AT_EDGE,
    },
    {
      order: ["A", "D", "M", "C", "R"],
      code: LIBRARY_CATALOGUE_RULE_VIOLATION_CODE.M_NOT_RIGHT_OF_R,
    },
    {
      order: ["A", "D", "M", "R", "C"],
      code: LIBRARY_CATALOGUE_RULE_VIOLATION_CODE.D_ADJACENT_TO_M,
    },
    {
      order: ["A", "D", "C", "M", "R"],
      code: LIBRARY_CATALOGUE_RULE_VIOLATION_CODE.R_NOT_LEFT_OF_C,
    },
    {
      order: ["R", "A", "D", "C", "M"],
      code: LIBRARY_CATALOGUE_RULE_VIOLATION_CODE.R_AT_EDGE,
    },
  ];

  for (const { order, code } of cases) {
    const result = validateLibraryCatalogueOrder(order);
    assert.equal(result.violatedRuleCodes.includes(code), true);
  }
});

test("devuelve varios códigos cuando fallan varias reglas", () => {
  const result = validateLibraryCatalogueOrder(
    LIBRARY_CATALOGUE_INITIAL_ORDER,
  );

  assert.deepEqual(result.violatedRuleCodes, [
    LIBRARY_CATALOGUE_RULE_VIOLATION_CODE
      .A_NOT_IMMEDIATELY_LEFT_OF_D,
    LIBRARY_CATALOGUE_RULE_VIOLATION_CODE.C_AT_EDGE,
    LIBRARY_CATALOGUE_RULE_VIOLATION_CODE.M_NOT_RIGHT_OF_R,
    LIBRARY_CATALOGUE_RULE_VIOLATION_CODE.R_NOT_LEFT_OF_C,
  ]);
});

test("rechaza entradas que no son arrays o contienen valores no string", () => {
  assert.equal(
    validateLibraryCatalogueOrder("A-D-R-C-M").code,
    LIBRARY_CATALOGUE_VALIDATION_CODE.INVALID_ORDER,
  );
  assert.equal(
    validateLibraryCatalogueOrder(["A", "D", "R", "C", 1]).code,
    LIBRARY_CATALOGUE_VALIDATION_CODE.INVALID_ORDER,
  );
});

test("rechaza una cantidad distinta de cinco antes de otras reglas", () => {
  assert.equal(
    validateLibraryCatalogueOrder(["A", "D", "R", "C"]).code,
    LIBRARY_CATALOGUE_VALIDATION_CODE.INVALID_DOCUMENT_COUNT,
  );
});

test("rechaza identificadores desconocidos", () => {
  assert.equal(
    validateLibraryCatalogueOrder(["A", "D", "R", "C", "X"]).code,
    LIBRARY_CATALOGUE_VALIDATION_CODE.UNKNOWN_DOCUMENT,
  );
});

test("rechaza duplicados antes de informar el documento ausente", () => {
  assert.equal(
    validateLibraryCatalogueOrder(["A", "D", "R", "C", "C"]).code,
    LIBRARY_CATALOGUE_VALIDATION_CODE.DUPLICATE_DOCUMENT,
  );
  assert.equal(
    LIBRARY_CATALOGUE_VALIDATION_CODE.MISSING_DOCUMENT,
    "missing_document",
  );
});

test("no muta el orden recibido", () => {
  const order = ["C", "M", "A", "R", "D"];
  const original = [...order];

  validateLibraryCatalogueOrder(order);

  assert.deepEqual(order, original);
});

test("las seis reglas tienen una única solución entre 120 permutaciones", () => {
  const documentIds = LIBRARY_CATALOGUE_DOCUMENTS.map(
    (document) => document.id,
  );
  const permutations = createPermutations(documentIds);
  const uniquePermutations = new Set(
    permutations.map((order) => order.join("-")),
  );
  let evaluatedCount = 0;

  const validOrders = permutations.filter((order) => {
    evaluatedCount += 1;
    return validateLibraryCatalogueOrder(order).valid;
  });

  assert.equal(permutations.length, 120);
  assert.equal(uniquePermutations.size, 120);
  assert.equal(evaluatedCount, 120);
  assert.deepEqual(validOrders, [["A", "D", "R", "C", "M"]]);
});

function createPermutations(items, prefix = []) {
  if (items.length === 0) {
    return [prefix];
  }

  return items.flatMap((item, index) => {
    const remainingItems = [
      ...items.slice(0, index),
      ...items.slice(index + 1),
    ];

    return createPermutations(remainingItems, [...prefix, item]);
  });
}
