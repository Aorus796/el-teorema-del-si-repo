export const ARCHIVE_CRITERIA_EVIDENCE_IDS = Object.freeze({
  ACCESS_LOG: "E1",
  TRAIL_LOG: "E2",
  PREPARATIONS_RECORD: "E3",
  PROTAGONIST_STATEMENT: "E4",
  BRIDE_STATEMENT: "E5",
  ARCHIVE_LIMIT: "E6",
});

export const ARCHIVE_CRITERIA_EVIDENCE = Object.freeze([
  createEvidence(
    ARCHIVE_CRITERIA_EVIDENCE_IDS.ACCESS_LOG,
    "Registro de acceso",
    "La novia abrió el Archivo con su propia credencial y anotó que entraba para revisar el protocolo.",
  ),
  createEvidence(
    ARCHIVE_CRITERIA_EVIDENCE_IDS.TRAIL_LOG,
    "Registro del recorrido",
    "El protagonista siguió la anotación del embarcadero, el catálogo y el acceso al Archivo.",
  ),
  createEvidence(
    ARCHIVE_CRITERIA_EVIDENCE_IDS.PREPARATIONS_RECORD,
    "Acta de preparativos",
    "La pareja discrepó sobre una decisión de la ceremonia y acordó una corrección.",
  ),
  createEvidence(
    ARCHIVE_CRITERIA_EVIDENCE_IDS.PROTAGONIST_STATEMENT,
    "Declaración del protagonista",
    "«Con lo que sé ahora, elijo avanzar contigo».",
  ),
  createEvidence(
    ARCHIVE_CRITERIA_EVIDENCE_IDS.BRIDE_STATEMENT,
    "Declaración de la novia",
    "«Con lo que sé ahora, elijo avanzar contigo».",
  ),
  createEvidence(
    ARCHIVE_CRITERIA_EVIDENCE_IDS.ARCHIVE_LIMIT,
    "Límite del Archivo",
    "El sistema solo contiene observaciones realizadas hasta el presente y no puede observar hechos futuros.",
  ),
]);

export const ARCHIVE_CRITERIA_VERDICT = Object.freeze({
  CONFIRMED: "confirmed",
  CONTRADICTED: "contradicted",
  UNDECIDABLE: "undecidable",
});

export const ARCHIVE_CRITERIA_CLAIM_IDS = Object.freeze({
  VOLUNTARY_ENTRY: "voluntary-entry",
  FOLLOWED_TRAIL: "followed-trail",
  NEVER_DISAGREED: "never-disagreed",
  SOMEONE_REFUSES_NOW: "someone-refuses-now",
  PRESENT_CHOICE: "present-choice",
  UNIVERSAL_FUTURE: "universal-future",
});

/*
 * El orden de esta lista es el orden de presentación definido en
 * ARCHIVE_CRITERIA_SPEC.md §6/§8: contenido inmutable, no persiste en el
 * guardado.
 */
export const ARCHIVE_CRITERIA_CLAIMS = Object.freeze([
  createClaim(
    ARCHIVE_CRITERIA_CLAIM_IDS.VOLUNTARY_ENTRY,
    "La novia entró voluntariamente en el Archivo.",
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.ACCESS_LOG],
    ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
  ),
  createClaim(
    ARCHIVE_CRITERIA_CLAIM_IDS.FOLLOWED_TRAIL,
    "El protagonista llegó al Archivo siguiendo las pistas.",
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.TRAIL_LOG],
    ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
  ),
  createClaim(
    ARCHIVE_CRITERIA_CLAIM_IDS.NEVER_DISAGREED,
    "La pareja nunca ha discrepado.",
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.PREPARATIONS_RECORD],
    ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
  ),
  createClaim(
    ARCHIVE_CRITERIA_CLAIM_IDS.SOMEONE_REFUSES_NOW,
    "Al menos una de las dos personas no elige avanzar ahora.",
    [
      ARCHIVE_CRITERIA_EVIDENCE_IDS.PROTAGONIST_STATEMENT,
      ARCHIVE_CRITERIA_EVIDENCE_IDS.BRIDE_STATEMENT,
    ],
    ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
  ),
  createClaim(
    ARCHIVE_CRITERIA_CLAIM_IDS.PRESENT_CHOICE,
    "Con la información actual, ambas personas eligen avanzar juntas.",
    [
      ARCHIVE_CRITERIA_EVIDENCE_IDS.PROTAGONIST_STATEMENT,
      ARCHIVE_CRITERIA_EVIDENCE_IDS.BRIDE_STATEMENT,
    ],
    ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
  ),
  createClaim(
    ARCHIVE_CRITERIA_CLAIM_IDS.UNIVERSAL_FUTURE,
    "Permanecerán unidas bajo cualquier circunstancia futura.",
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.ARCHIVE_LIMIT],
    ARCHIVE_CRITERIA_VERDICT.UNDECIDABLE,
  ),
]);

export const ARCHIVE_CRITERIA_SOLUTION = Object.freeze(
  Object.fromEntries(
    ARCHIVE_CRITERIA_CLAIMS.map((claim) => [claim.id, claim.verdict]),
  ),
);

export const ARCHIVE_CRITERIA_INITIAL_VERDICTS = Object.freeze(
  Object.fromEntries(ARCHIVE_CRITERIA_CLAIMS.map((claim) => [claim.id, null])),
);

function createEvidence(id, name, text) {
  return Object.freeze({ id, name, text });
}

function createClaim(id, text, evidenceIds, verdict) {
  return Object.freeze({
    id,
    text,
    evidenceIds: Object.freeze([...evidenceIds]),
    verdict,
  });
}
