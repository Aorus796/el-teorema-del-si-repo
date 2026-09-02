export const ARCHIVE_CRITERIA_EVIDENCE_IDS = Object.freeze({
  ACCESS_LOG: "E1",
  TRAIL_LOG: "E2",
  PREPARATIONS_RECORD: "E3",
  PROTAGONIST_STATEMENT: "E4",
  BRIDE_STATEMENT: "E5",
  ARCHIVE_LIMIT: "E6",
  ACCESS_REVIEW_NOTICE: "E7",
  PURPOSE_NOTE: "E8",
  PREPARATIONS_AMENDMENT: "E9",
  PRIOR_CASE: "E10",
});

export const ARCHIVE_CRITERIA_EVIDENCE = Object.freeze([
  createEvidence(
    ARCHIVE_CRITERIA_EVIDENCE_IDS.ACCESS_LOG,
    "Registro de acceso",
    "La credencial de la novia abrió el Archivo; no consta ninguna otra.",
  ),
  createEvidence(
    ARCHIVE_CRITERIA_EVIDENCE_IDS.TRAIL_LOG,
    "Registro del recorrido",
    "El protagonista siguió la anotación del embarcadero, el catálogo y el acceso al Archivo.",
  ),
  createEvidence(
    ARCHIVE_CRITERIA_EVIDENCE_IDS.PREPARATIONS_RECORD,
    "Acta de preparativos",
    "El acta de preparativos registra la propuesta de la novia: la ceremonia en el patio.",
  ),
  createEvidence(
    ARCHIVE_CRITERIA_EVIDENCE_IDS.PROTAGONIST_STATEMENT,
    "Declaración del protagonista",
    "«Con lo que sé hoy, vuelvo a elegir lo mismo que elegí contigo».",
  ),
  createEvidence(
    ARCHIVE_CRITERIA_EVIDENCE_IDS.BRIDE_STATEMENT,
    "Declaración de la novia",
    "«Nada de lo que he leído aquí me hace cambiar de decisión».",
  ),
  createEvidence(
    ARCHIVE_CRITERIA_EVIDENCE_IDS.ARCHIVE_LIMIT,
    "Límite del Archivo",
    "Todo asiento del Archivo cita la fecha en que se observó; no admite asientos sin observación.",
  ),
  createEvidence(
    ARCHIVE_CRITERIA_EVIDENCE_IDS.ACCESS_REVIEW_NOTICE,
    "Aviso de revisión",
    "El acceso quedó bajo revisión después de la entrada de la novia; el aviso no dice cómo se produjo.",
  ),
  createEvidence(
    ARCHIVE_CRITERIA_EVIDENCE_IDS.PURPOSE_NOTE,
    "Anotación de propósito",
    "Nota de la novia junto al acceso: «Entro a revisar el protocolo. Vuelvo pronto».",
  ),
  createEvidence(
    ARCHIVE_CRITERIA_EVIDENCE_IDS.PREPARATIONS_AMENDMENT,
    "Enmienda de preparativos",
    "El protagonista propuso celebrar la ceremonia en el embarcadero; después ambos firmaron una sola versión.",
  ),
  createEvidence(
    ARCHIVE_CRITERIA_EVIDENCE_IDS.PRIOR_CASE,
    "Expediente anterior",
    "El sistema conserva otro caso del mismo tipo de afirmación, todavía sin resolver.",
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
 * Papel que juega una evidencia dentro de una afirmación concreta.
 *
 * - `supports` aporta el apoyo decisivo de la afirmación.
 * - `contradicts` aporta la incompatibilidad decisiva con la afirmación.
 * - `relevant-but-insufficient` aporta información real, pero no alcanza a
 *   decidir nada sin cruzarla con otra evidencia de la misma afirmación.
 *   Es portante: sin ella el veredicto de su afirmación no queda
 *   fundamentado, así que no es un distractor.
 * - `irrelevant` es el único papel distractor: se muestra, parece pertinente
 *   y no interviene en el veredicto.
 *
 * «Decisivo» no significa «aislado»: E9 solo contradice `never-disagreed`
 * leído junto a E3, que es lo que documenta a E3 como insuficiente en vez
 * de irrelevante. La única evidencia que decide su afirmación en solitario
 * es E2 en `followed-trail`, conservada como ancla de aprendizaje.
 */
export const ARCHIVE_CRITERIA_EVIDENCE_ROLE = Object.freeze({
  SUPPORTS: "supports",
  CONTRADICTS: "contradicts",
  INSUFFICIENT: "relevant-but-insufficient",
  IRRELEVANT: "irrelevant",
});

/*
 * Matriz de relevancia: contenido inmutable que declara, para cada
 * afirmación, exactamente qué evidencias se muestran y qué papel juega cada
 * una. Las combinaciones que no aparecen aquí no existen y no se muestran.
 *
 * El orden de cada bloque es el orden de presentación en la escena, y
 * `claim.evidenceIds` se deriva de esta matriz para que ambas no puedan
 * divergir. Nada de esto persiste en el guardado.
 */
export const ARCHIVE_CRITERIA_EVIDENCE_RELEVANCE = Object.freeze({
  [ARCHIVE_CRITERIA_CLAIM_IDS.VOLUNTARY_ENTRY]: Object.freeze({
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.ACCESS_LOG]:
      ARCHIVE_CRITERIA_EVIDENCE_ROLE.INSUFFICIENT,
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.ACCESS_REVIEW_NOTICE]:
      ARCHIVE_CRITERIA_EVIDENCE_ROLE.IRRELEVANT,
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.PURPOSE_NOTE]:
      ARCHIVE_CRITERIA_EVIDENCE_ROLE.INSUFFICIENT,
  }),
  [ARCHIVE_CRITERIA_CLAIM_IDS.FOLLOWED_TRAIL]: Object.freeze({
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.TRAIL_LOG]:
      ARCHIVE_CRITERIA_EVIDENCE_ROLE.SUPPORTS,
  }),
  [ARCHIVE_CRITERIA_CLAIM_IDS.NEVER_DISAGREED]: Object.freeze({
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.PREPARATIONS_RECORD]:
      ARCHIVE_CRITERIA_EVIDENCE_ROLE.INSUFFICIENT,
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.PREPARATIONS_AMENDMENT]:
      ARCHIVE_CRITERIA_EVIDENCE_ROLE.CONTRADICTS,
  }),
  [ARCHIVE_CRITERIA_CLAIM_IDS.SOMEONE_REFUSES_NOW]: Object.freeze({
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.PREPARATIONS_RECORD]:
      ARCHIVE_CRITERIA_EVIDENCE_ROLE.IRRELEVANT,
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.PROTAGONIST_STATEMENT]:
      ARCHIVE_CRITERIA_EVIDENCE_ROLE.INSUFFICIENT,
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.BRIDE_STATEMENT]:
      ARCHIVE_CRITERIA_EVIDENCE_ROLE.INSUFFICIENT,
  }),
  [ARCHIVE_CRITERIA_CLAIM_IDS.PRESENT_CHOICE]: Object.freeze({
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.PROTAGONIST_STATEMENT]:
      ARCHIVE_CRITERIA_EVIDENCE_ROLE.INSUFFICIENT,
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.BRIDE_STATEMENT]:
      ARCHIVE_CRITERIA_EVIDENCE_ROLE.INSUFFICIENT,
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.PREPARATIONS_AMENDMENT]:
      ARCHIVE_CRITERIA_EVIDENCE_ROLE.IRRELEVANT,
  }),
  [ARCHIVE_CRITERIA_CLAIM_IDS.UNIVERSAL_FUTURE]: Object.freeze({
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.ARCHIVE_LIMIT]:
      ARCHIVE_CRITERIA_EVIDENCE_ROLE.INSUFFICIENT,
    [ARCHIVE_CRITERIA_EVIDENCE_IDS.PRIOR_CASE]:
      ARCHIVE_CRITERIA_EVIDENCE_ROLE.INSUFFICIENT,
  }),
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
    ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
  ),
  createClaim(
    ARCHIVE_CRITERIA_CLAIM_IDS.FOLLOWED_TRAIL,
    "El protagonista llegó al Archivo siguiendo las pistas.",
    ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
  ),
  createClaim(
    ARCHIVE_CRITERIA_CLAIM_IDS.NEVER_DISAGREED,
    "La pareja nunca ha discrepado.",
    ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
  ),
  createClaim(
    ARCHIVE_CRITERIA_CLAIM_IDS.SOMEONE_REFUSES_NOW,
    "Al menos una de las dos personas no elige avanzar ahora.",
    ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
  ),
  createClaim(
    ARCHIVE_CRITERIA_CLAIM_IDS.PRESENT_CHOICE,
    "Con la información actual, ambas personas eligen avanzar juntas.",
    ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
  ),
  createClaim(
    ARCHIVE_CRITERIA_CLAIM_IDS.UNIVERSAL_FUTURE,
    "Permanecerán unidas bajo cualquier circunstancia futura.",
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

function createClaim(id, text, verdict) {
  return Object.freeze({
    id,
    text,
    evidenceIds: Object.freeze(
      Object.keys(ARCHIVE_CRITERIA_EVIDENCE_RELEVANCE[id]),
    ),
    verdict,
  });
}
