import test from "node:test";
import assert from "node:assert/strict";
import {
  ARCHIVE_CRITERIA_CLAIMS,
  ARCHIVE_CRITERIA_INITIAL_VERDICTS,
  ARCHIVE_CRITERIA_SOLUTION,
  ARCHIVE_CRITERIA_VERDICT,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaData.js";
import {
  ARCHIVE_CRITERIA_VALIDATION_CODE,
  validateArchiveCriteriaVerdicts,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaValidator.js";

const CLAIM_IDS = ARCHIVE_CRITERIA_CLAIMS.map((claim) => claim.id);
const ALL_VERDICTS = Object.values(ARCHIVE_CRITERIA_VERDICT);

test("acepta la solución exacta como válida", () => {
  const result = validateArchiveCriteriaVerdicts(ARCHIVE_CRITERIA_SOLUTION);

  assert.deepEqual(result, {
    valid: true,
    code: ARCHIVE_CRITERIA_VALIDATION_CODE.VALID,
    incorrectClaimIds: [],
  });
});

test("rechaza entradas que no son un objeto plano", () => {
  for (const invalid of [null, undefined, "verdicts", 42, true, []]) {
    const result = validateArchiveCriteriaVerdicts(invalid);
    assert.equal(
      result.code,
      ARCHIVE_CRITERIA_VALIDATION_CODE.INVALID_VERDICTS,
    );
    assert.equal(result.valid, false);
  }
});

test("rechaza un objeto con menos de seis claves", () => {
  const { "universal-future": _omitted, ...missingOne } =
    ARCHIVE_CRITERIA_INITIAL_VERDICTS;

  const result = validateArchiveCriteriaVerdicts(missingOne);

  assert.equal(
    result.code,
    ARCHIVE_CRITERIA_VALIDATION_CODE.INVALID_CLAIM_COUNT,
  );
});

test("rechaza un objeto con más de seis claves", () => {
  const tooMany = {
    ...ARCHIVE_CRITERIA_INITIAL_VERDICTS,
    "extra-claim": null,
  };

  const result = validateArchiveCriteriaVerdicts(tooMany);

  assert.equal(
    result.code,
    ARCHIVE_CRITERIA_VALIDATION_CODE.INVALID_CLAIM_COUNT,
  );
});

test("rechaza seis claves cuando falta un ID obligatorio, aunque el conteo sea seis", () => {
  const { "universal-future": _omitted, ...rest } =
    ARCHIVE_CRITERIA_INITIAL_VERDICTS;
  const swapped = { ...rest, "unknown-claim": null };

  assert.equal(Object.keys(swapped).length, 6);

  const result = validateArchiveCriteriaVerdicts(swapped);

  assert.equal(result.code, ARCHIVE_CRITERIA_VALIDATION_CODE.MISSING_CLAIM);
});

test("unknown_claim es un código reservado del contrato, sin entrada pública que lo alcance", () => {
  /*
   * ARCHIVE_CRITERIA_VALIDATION_CODE.UNKNOWN_CLAIM se conserva por
   * fidelidad al contrato documental de ARCHIVE_CRITERIA_SPEC.md §16-§17.
   * No se afirma que exista una entrada pública de
   * validateArchiveCriteriaVerdicts capaz de devolverlo: tras superar la
   * comprobación de conteo (exactamente seis claves) y la de ausencia
   * (las seis obligatorias presentes), un objeto de JavaScript con claves
   * únicas no puede contener ya ninguna clave desconocida, así que esa
   * rama no existe en el validador (ver ArchiveCriteriaValidator.js).
   */
  assert.equal(
    ARCHIVE_CRITERIA_VALIDATION_CODE.UNKNOWN_CLAIM,
    "unknown_claim",
  );
});

test("rechaza un veredicto fuera del conjunto permitido", () => {
  const invalid = {
    ...ARCHIVE_CRITERIA_INITIAL_VERDICTS,
    "voluntary-entry": "maybe",
  };

  const result = validateArchiveCriteriaVerdicts(invalid);

  assert.equal(result.code, ARCHIVE_CRITERIA_VALIDATION_CODE.INVALID_VERDICT);
});

test("clasificación incompleta cuando algún veredicto sigue en null", () => {
  const incomplete = {
    ...ARCHIVE_CRITERIA_SOLUTION,
    "universal-future": null,
  };

  const result = validateArchiveCriteriaVerdicts(incomplete);

  assert.equal(
    result.code,
    ARCHIVE_CRITERIA_VALIDATION_CODE.INCOMPLETE_CLASSIFICATION,
  );
  assert.equal(result.valid, false);
});

test("clasificación completa pero incorrecta", () => {
  const incorrect = {
    ...ARCHIVE_CRITERIA_SOLUTION,
    "universal-future": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
  };

  const result = validateArchiveCriteriaVerdicts(incorrect);

  assert.equal(
    result.code,
    ARCHIVE_CRITERIA_VALIDATION_CODE.INCORRECT_VERDICTS,
  );
  assert.deepEqual(result.incorrectClaimIds, ["universal-future"]);
});

test("incorrectClaimIds identifica exactamente cada afirmación equivocada", () => {
  const twoWrong = {
    ...ARCHIVE_CRITERIA_SOLUTION,
    "voluntary-entry": ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
    "never-disagreed": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
  };

  const result = validateArchiveCriteriaVerdicts(twoWrong);

  assert.equal(
    result.code,
    ARCHIVE_CRITERIA_VALIDATION_CODE.INCORRECT_VERDICTS,
  );
  assert.deepEqual(
    [...result.incorrectClaimIds].sort(),
    ["never-disagreed", "voluntary-entry"].sort(),
  );
});

test("cada afirmación rechaza individualmente sus dos veredictos incorrectos", () => {
  for (const claimId of CLAIM_IDS) {
    const correctVerdict = ARCHIVE_CRITERIA_SOLUTION[claimId];
    const wrongVerdicts = ALL_VERDICTS.filter(
      (verdict) => verdict !== correctVerdict,
    );

    assert.equal(wrongVerdicts.length, 2);

    for (const wrongVerdict of wrongVerdicts) {
      const attempt = {
        ...ARCHIVE_CRITERIA_SOLUTION,
        [claimId]: wrongVerdict,
      };

      const result = validateArchiveCriteriaVerdicts(attempt);

      assert.equal(
        result.code,
        ARCHIVE_CRITERIA_VALIDATION_CODE.INCORRECT_VERDICTS,
        `${claimId} debería rechazar el veredicto ${wrongVerdict}`,
      );
      assert.deepEqual(result.incorrectClaimIds, [claimId]);
    }
  }
});

test("no importa Canvas, DOM ni almacenamiento", () => {
  assert.equal(typeof globalThis.document, "undefined");
  assert.equal(typeof globalThis.localStorage, "undefined");
});
