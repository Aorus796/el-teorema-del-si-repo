import {
  ARCHIVE_CRITERIA_CLAIMS,
  ARCHIVE_CRITERIA_SOLUTION,
  ARCHIVE_CRITERIA_VERDICT,
} from "./ArchiveCriteriaData.js";

export const ARCHIVE_CRITERIA_VALIDATION_CODE = Object.freeze({
  VALID: "valid",
  INVALID_VERDICTS: "invalid_verdicts",
  INVALID_CLAIM_COUNT: "invalid_claim_count",
  MISSING_CLAIM: "missing_claim",
  UNKNOWN_CLAIM: "unknown_claim",
  INVALID_VERDICT: "invalid_verdict",
  INCOMPLETE_CLASSIFICATION: "incomplete_classification",
  INCORRECT_VERDICTS: "incorrect_verdicts",
});

const CLAIM_IDS = Object.freeze(
  ARCHIVE_CRITERIA_CLAIMS.map((claim) => claim.id),
);
const ALLOWED_VERDICTS = Object.freeze(Object.values(ARCHIVE_CRITERIA_VERDICT));

export function validateArchiveCriteriaVerdicts(verdicts) {
  if (
    typeof verdicts !== "object" ||
    verdicts === null ||
    Array.isArray(verdicts)
  ) {
    return createResult(ARCHIVE_CRITERIA_VALIDATION_CODE.INVALID_VERDICTS);
  }

  const keys = Object.keys(verdicts);

  if (keys.length !== CLAIM_IDS.length) {
    return createResult(
      ARCHIVE_CRITERIA_VALIDATION_CODE.INVALID_CLAIM_COUNT,
    );
  }

  if (CLAIM_IDS.some((claimId) => !Object.hasOwn(verdicts, claimId))) {
    return createResult(ARCHIVE_CRITERIA_VALIDATION_CODE.MISSING_CLAIM);
  }

  /*
   * Con exactamente seis claves (comprobado arriba) y las seis
   * obligatorias presentes (comprobado arriba), no puede quedar ninguna
   * clave desconocida: ARCHIVE_CRITERIA_VALIDATION_CODE.UNKNOWN_CLAIM se
   * conserva por fidelidad al contrato documental de
   * ARCHIVE_CRITERIA_SPEC.md §16-§17, pero ninguna entrada llega hasta
   * aquí con una clave que no sea una de las seis obligatorias.
   */

  if (
    CLAIM_IDS.some((claimId) => {
      const value = verdicts[claimId];
      return value !== null && !ALLOWED_VERDICTS.includes(value);
    })
  ) {
    return createResult(ARCHIVE_CRITERIA_VALIDATION_CODE.INVALID_VERDICT);
  }

  if (CLAIM_IDS.some((claimId) => verdicts[claimId] === null)) {
    return createResult(
      ARCHIVE_CRITERIA_VALIDATION_CODE.INCOMPLETE_CLASSIFICATION,
    );
  }

  const incorrectClaimIds = CLAIM_IDS.filter(
    (claimId) => verdicts[claimId] !== ARCHIVE_CRITERIA_SOLUTION[claimId],
  );

  if (incorrectClaimIds.length > 0) {
    return createResult(
      ARCHIVE_CRITERIA_VALIDATION_CODE.INCORRECT_VERDICTS,
      incorrectClaimIds,
    );
  }

  return createResult(ARCHIVE_CRITERIA_VALIDATION_CODE.VALID);
}

function createResult(code, incorrectClaimIds = []) {
  return {
    valid: code === ARCHIVE_CRITERIA_VALIDATION_CODE.VALID,
    code,
    incorrectClaimIds: [...incorrectClaimIds],
  };
}
