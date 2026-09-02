import test from "node:test";
import assert from "node:assert/strict";
import {
  ARCHIVE_CRITERIA_CLAIM_IDS,
  ARCHIVE_CRITERIA_CLAIMS,
  ARCHIVE_CRITERIA_EVIDENCE,
  ARCHIVE_CRITERIA_EVIDENCE_IDS,
  ARCHIVE_CRITERIA_EVIDENCE_RELEVANCE,
  ARCHIVE_CRITERIA_EVIDENCE_ROLE,
  ARCHIVE_CRITERIA_INITIAL_VERDICTS,
  ARCHIVE_CRITERIA_SOLUTION,
  ARCHIVE_CRITERIA_VERDICT,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaData.js";

const EXPECTED_EVIDENCE_IDS = [
  "E1",
  "E2",
  "E3",
  "E4",
  "E5",
  "E6",
  "E7",
  "E8",
  "E9",
  "E10",
];

test("existen exactamente diez evidencias con IDs únicos y en orden", () => {
  assert.equal(ARCHIVE_CRITERIA_EVIDENCE.length, 10);

  const ids = ARCHIVE_CRITERIA_EVIDENCE.map((evidence) => evidence.id);
  assert.deepEqual(ids, EXPECTED_EVIDENCE_IDS);
  assert.equal(new Set(ids).size, 10);

  const names = ARCHIVE_CRITERIA_EVIDENCE.map((evidence) => evidence.name);
  const texts = ARCHIVE_CRITERIA_EVIDENCE.map((evidence) => evidence.text);
  assert.equal(new Set(names).size, 10);
  assert.equal(new Set(texts).size, 10);

  for (const evidence of ARCHIVE_CRITERIA_EVIDENCE) {
    assert.equal(typeof evidence.name, "string");
    assert.ok(evidence.name.length > 0);
    assert.equal(typeof evidence.text, "string");
    assert.ok(evidence.text.length > 0);
  }
});

test("el contenido literal de las diez evidencias coincide con ARCHIVE_CRITERIA_SPEC.md §5", () => {
  assert.deepEqual(ARCHIVE_CRITERIA_EVIDENCE, [
    {
      id: "E1",
      name: "Registro de acceso",
      text: "La credencial de la novia abrió el Archivo; no consta ninguna otra.",
    },
    {
      id: "E2",
      name: "Registro del recorrido",
      text:
        "El protagonista siguió la anotación del embarcadero, el catálogo y el acceso al Archivo.",
    },
    {
      id: "E3",
      name: "Acta de preparativos",
      text:
        "El acta de preparativos registra la propuesta de la novia: la ceremonia en el patio.",
    },
    {
      id: "E4",
      name: "Declaración del protagonista",
      text: "«Con lo que sé hoy, vuelvo a elegir lo mismo que elegí contigo».",
    },
    {
      id: "E5",
      name: "Declaración de la novia",
      text: "«Nada de lo que he leído aquí me hace cambiar de decisión».",
    },
    {
      id: "E6",
      name: "Límite del Archivo",
      text:
        "Todo asiento del Archivo cita la fecha en que se observó; no admite asientos sin observación.",
    },
    {
      id: "E7",
      name: "Aviso de revisión",
      text:
        "El acceso quedó bajo revisión después de la entrada de la novia; el aviso no dice cómo se produjo.",
    },
    {
      id: "E8",
      name: "Anotación de propósito",
      text:
        "Nota de la novia junto al acceso: «Entro a revisar el protocolo. Vuelvo pronto».",
    },
    {
      id: "E9",
      name: "Enmienda de preparativos",
      text:
        "El protagonista propuso celebrar la ceremonia en el embarcadero; después ambos firmaron una sola versión.",
    },
    {
      id: "E10",
      name: "Expediente anterior",
      text:
        "El sistema conserva otro caso del mismo tipo de afirmación, todavía sin resolver.",
    },
  ]);
});

test("los IDs de evidencia expuestos coinciden con los datos", () => {
  assert.deepEqual(
    [...Object.values(ARCHIVE_CRITERIA_EVIDENCE_IDS)].sort(byEvidenceNumber),
    [...EXPECTED_EVIDENCE_IDS].sort(byEvidenceNumber),
  );
});

test("existen exactamente seis afirmaciones con IDs únicos y en el orden del spec", () => {
  assert.equal(ARCHIVE_CRITERIA_CLAIMS.length, 6);

  const ids = ARCHIVE_CRITERIA_CLAIMS.map((claim) => claim.id);
  assert.deepEqual(ids, [
    "voluntary-entry",
    "followed-trail",
    "never-disagreed",
    "someone-refuses-now",
    "present-choice",
    "universal-future",
  ]);
  assert.equal(new Set(ids).size, 6);
  assert.deepEqual(ids, Object.values(ARCHIVE_CRITERIA_CLAIM_IDS));
});

test("cada afirmación tiene texto y al menos una evidencia asociada válida", () => {
  const validEvidenceIds = new Set(
    ARCHIVE_CRITERIA_EVIDENCE.map((evidence) => evidence.id),
  );

  for (const claim of ARCHIVE_CRITERIA_CLAIMS) {
    assert.equal(typeof claim.text, "string");
    assert.ok(claim.text.length > 0);
    assert.ok(Array.isArray(claim.evidenceIds));
    assert.ok(claim.evidenceIds.length > 0);

    for (const evidenceId of claim.evidenceIds) {
      assert.ok(validEvidenceIds.has(evidenceId));
    }
  }
});

test("la matriz de relevancia coincide exactamente con la tabla aprobada", () => {
  assert.deepEqual(ARCHIVE_CRITERIA_EVIDENCE_RELEVANCE, {
    "voluntary-entry": {
      E1: "relevant-but-insufficient",
      E7: "irrelevant",
      E8: "relevant-but-insufficient",
    },
    "followed-trail": {
      E2: "supports",
    },
    "never-disagreed": {
      E3: "relevant-but-insufficient",
      E9: "contradicts",
    },
    "someone-refuses-now": {
      E3: "irrelevant",
      E4: "relevant-but-insufficient",
      E5: "relevant-but-insufficient",
    },
    "present-choice": {
      E4: "relevant-but-insufficient",
      E5: "relevant-but-insufficient",
      E9: "irrelevant",
    },
    "universal-future": {
      E6: "relevant-but-insufficient",
      E10: "relevant-but-insufficient",
    },
  });
});

test("cada papel de la matriz pertenece al enum de roles", () => {
  const allowedRoles = new Set(Object.values(ARCHIVE_CRITERIA_EVIDENCE_ROLE));
  const validEvidenceIds = new Set(EXPECTED_EVIDENCE_IDS);
  const claimIds = new Set(Object.values(ARCHIVE_CRITERIA_CLAIM_IDS));

  assert.deepEqual(
    Object.keys(ARCHIVE_CRITERIA_EVIDENCE_RELEVANCE).filter(
      (claimId) => !claimIds.has(claimId),
    ),
    [],
  );

  for (const roles of Object.values(ARCHIVE_CRITERIA_EVIDENCE_RELEVANCE)) {
    for (const [evidenceId, role] of Object.entries(roles)) {
      assert.ok(validEvidenceIds.has(evidenceId));
      assert.ok(allowedRoles.has(role), `rol desconocido: ${role}`);
    }
  }
});

test("las evidencias mostradas de cada afirmación se derivan de la matriz de relevancia", () => {
  for (const claim of ARCHIVE_CRITERIA_CLAIMS) {
    assert.deepEqual(
      [...claim.evidenceIds],
      Object.keys(ARCHIVE_CRITERIA_EVIDENCE_RELEVANCE[claim.id]),
      `las evidencias de ${claim.id} deben coincidir con la matriz`,
    );
  }
});

test("el mapa claimId -> evidenceIds coincide exactamente con lo aprobado", () => {
  const expectedEvidenceIds = {
    "voluntary-entry": ["E1", "E7", "E8"],
    "followed-trail": ["E2"],
    "never-disagreed": ["E3", "E9"],
    "someone-refuses-now": ["E3", "E4", "E5"],
    "present-choice": ["E4", "E5", "E9"],
    "universal-future": ["E6", "E10"],
  };

  const actualEvidenceIds = Object.fromEntries(
    ARCHIVE_CRITERIA_CLAIMS.map((claim) => [
      claim.id,
      [...claim.evidenceIds],
    ]),
  );

  assert.deepEqual(actualEvidenceIds, expectedEvidenceIds);
});

test("cinco de las seis afirmaciones exigen cruzar al menos dos evidencias", () => {
  const decisiveCounts = ARCHIVE_CRITERIA_CLAIMS.map((claim) => ({
    id: claim.id,
    count: decisiveEvidenceIds(claim.id).length,
  }));

  const singleEvidenceClaims = decisiveCounts
    .filter((entry) => entry.count < 2)
    .map((entry) => entry.id);

  assert.deepEqual(
    singleEvidenceClaims,
    ["followed-trail"],
    "followed-trail es el único ancla de aprendizaje con una sola evidencia",
  );

  assert.equal(
    decisiveCounts.filter((entry) => entry.count >= 2).length,
    5,
  );

  /*
   * Ninguna de esas cinco se decide con una sola evidencia: todas sus
   * evidencias no irrelevantes son insuficientes por separado, salvo la
   * contradicción de never-disagreed, que solo lo es junto a E3.
   */
  const decisiveRolesOfFollowedTrail = Object.values(
    ARCHIVE_CRITERIA_EVIDENCE_RELEVANCE["followed-trail"],
  );
  assert.deepEqual(decisiveRolesOfFollowedTrail, [
    ARCHIVE_CRITERIA_EVIDENCE_ROLE.SUPPORTS,
  ]);
});

/*
 * Distractor genuino: relación cuyo papel es `irrelevant`. Se muestra,
 * parece pertinente y no interviene en el veredicto de esa afirmación.
 *
 * No son distractores las evidencias `relevant-but-insufficient`: son
 * portantes, porque el veredicto final de su afirmación solo queda
 * fundamentado con ellas. Eso incluye a E6 y E10 en `universal-future`,
 * que son precisamente las que sostienen el `undecidable`, y a E3 en
 * `never-disagreed`, sin la cual E9 no contradice nada.
 */
const GENUINE_DISTRACTORS = [
  { claimId: "voluntary-entry", evidenceId: "E7" },
  { claimId: "someone-refuses-now", evidenceId: "E3" },
  { claimId: "present-choice", evidenceId: "E9" },
];

test("existen al menos tres distractores genuinos repartidos en dos evidencias o más", () => {
  const distractors = relationsWithRole(
    ARCHIVE_CRITERIA_EVIDENCE_ROLE.IRRELEVANT,
  );

  assert.deepEqual(
    distractors,
    GENUINE_DISTRACTORS,
    "solo el papel irrelevant cuenta como distractor genuino",
  );

  assert.ok(
    distractors.length >= 3,
    `se esperaban al menos tres distractores genuinos, hay ${distractors.length}`,
  );

  const distinctEvidence = new Set(
    distractors.map((entry) => entry.evidenceId),
  );
  assert.ok(distinctEvidence.size >= 2);

  for (const { claimId, evidenceId } of distractors) {
    const claim = ARCHIVE_CRITERIA_CLAIMS.find((item) => item.id === claimId);
    assert.ok(
      claim.evidenceIds.includes(evidenceId),
      `${evidenceId} debe mostrarse en ${claimId}`,
    );
  }
});

test("ninguna evidencia insuficiente se cuenta como distractor: todas son portantes", () => {
  const insufficient = relationsWithRole(
    ARCHIVE_CRITERIA_EVIDENCE_ROLE.INSUFFICIENT,
  );

  assert.deepEqual(insufficient, [
    { claimId: "voluntary-entry", evidenceId: "E1" },
    { claimId: "voluntary-entry", evidenceId: "E8" },
    { claimId: "never-disagreed", evidenceId: "E3" },
    { claimId: "someone-refuses-now", evidenceId: "E4" },
    { claimId: "someone-refuses-now", evidenceId: "E5" },
    { claimId: "present-choice", evidenceId: "E4" },
    { claimId: "present-choice", evidenceId: "E5" },
    { claimId: "universal-future", evidenceId: "E6" },
    { claimId: "universal-future", evidenceId: "E10" },
  ]);

  for (const relation of insufficient) {
    assert.equal(
      GENUINE_DISTRACTORS.some(
        (distractor) =>
          distractor.claimId === relation.claimId &&
          distractor.evidenceId === relation.evidenceId,
      ),
      false,
      `${relation.evidenceId} en ${relation.claimId} es portante, no distractor`,
    );
  }

  /*
   * Portante significa que el veredicto no se sostiene sin ella: cada
   * afirmación con evidencias insuficientes necesita al menos dos
   * registros no irrelevantes para quedar fundamentada.
   */
  for (const claimId of new Set(
    insufficient.map((relation) => relation.claimId),
  )) {
    assert.ok(
      decisiveEvidenceIds(claimId).length >= 2,
      `${claimId} debe fundamentarse cruzando al menos dos registros`,
    );
  }
});

test("la afirmación no decidible se fundamenta con evidencia portante, no con ruido", () => {
  const roles = ARCHIVE_CRITERIA_EVIDENCE_RELEVANCE["universal-future"];
  const undecidableClaim = ARCHIVE_CRITERIA_CLAIMS.find(
    (claim) => claim.id === "universal-future",
  );

  assert.equal(
    undecidableClaim.verdict,
    ARCHIVE_CRITERIA_VERDICT.UNDECIDABLE,
  );

  for (const [evidenceId, role] of Object.entries(roles)) {
    assert.equal(
      role,
      ARCHIVE_CRITERIA_EVIDENCE_ROLE.INSUFFICIENT,
      `${evidenceId} sostiene el undecidable y no puede ser un distractor`,
    );
  }
});

test("universal-future se apoya en dos evidencias insuficientes y en ninguna decisiva", () => {
  const roles = ARCHIVE_CRITERIA_EVIDENCE_RELEVANCE["universal-future"];
  const entries = Object.entries(roles);

  assert.ok(
    entries.some(
      ([evidenceId, role]) =>
        evidenceId !== "E6" &&
        role === ARCHIVE_CRITERIA_EVIDENCE_ROLE.INSUFFICIENT,
    ),
  );

  for (const [, role] of entries) {
    assert.notEqual(role, ARCHIVE_CRITERIA_EVIDENCE_ROLE.SUPPORTS);
    assert.notEqual(role, ARCHIVE_CRITERIA_EVIDENCE_ROLE.CONTRADICTS);
  }
});

test("ninguna evidencia repite literalmente el texto de una afirmación", () => {
  for (const evidence of ARCHIVE_CRITERIA_EVIDENCE) {
    for (const claim of ARCHIVE_CRITERIA_CLAIMS) {
      assert.equal(
        normalize(evidence.text).includes(normalize(claim.text)),
        false,
        `${evidence.id} no debe contener el texto de ${claim.id}`,
      );
    }
  }
});

/*
 * Cada lista incluye, además de la paráfrasis prohibida de la afirmación,
 * las subcadenas literales del texto anterior a v1.2 que hacían la
 * evidencia demasiado explícita. Revertir cualquiera de esos textos debe
 * hacer fallar esta prueba, no solo el snapshot literal de §5.
 */
test("ninguna evidencia parafrasea casi literalmente la afirmación que ayuda a resolver", () => {
  const forbiddenSubstrings = {
    E1: [
      "voluntaria",
      "por su voluntad",
      "con su propia credencial",
      "anotó que entraba",
    ],
    E2: ["llegó al archivo siguiendo las pistas"],
    E3: ["discrep", "nunca", "acordó una corrección"],
    E4: [
      "ambas personas",
      "eligen avanzar",
      "elijo avanzar",
      "no elige avanzar",
    ],
    E5: [
      "ambas personas",
      "eligen avanzar",
      "elijo avanzar",
      "no elige avanzar",
    ],
    E6: [
      "permanecerán",
      "cualquier circunstancia",
      "no puede decidirse",
      "hechos futuros",
    ],
    E7: ["voluntaria", "por su voluntad", "con su propia credencial"],
    E8: ["voluntaria", "por su voluntad"],
    E9: ["discrep", "nunca"],
    E10: [
      "permanecerán",
      "cualquier circunstancia",
      "no puede decidirse",
      "hechos futuros",
    ],
  };

  assert.deepEqual(
    Object.keys(forbiddenSubstrings).sort(byEvidenceNumber),
    [...EXPECTED_EVIDENCE_IDS].sort(byEvidenceNumber),
  );

  for (const evidence of ARCHIVE_CRITERIA_EVIDENCE) {
    for (const forbidden of forbiddenSubstrings[evidence.id]) {
      assert.equal(
        normalize(evidence.text).includes(forbidden),
        false,
        `${evidence.id} no debe contener "${forbidden}"`,
      );
    }
  }
});

/*
 * El expediente es un puzle de contenido, no una reescritura narrativa: no
 * puede estrenar personajes ni premisas que el juego publicado no muestra
 * en ningún texto jugable (el Custodio solo existe en documentación de
 * diseño, y el Archivo es transitable, sin cautiverio).
 */
test("ninguna evidencia introduce personajes ni premisas ajenas al juego publicado", () => {
  const forbiddenLore = [
    "custodio",
    "contención",
    "retiene",
    "encierra",
    "cautiv",
    "no permite salir",
  ];

  for (const evidence of ARCHIVE_CRITERIA_EVIDENCE) {
    for (const forbidden of forbiddenLore) {
      assert.equal(
        normalize(`${evidence.name} ${evidence.text}`).includes(forbidden),
        false,
        `${evidence.id} no debe mencionar "${forbidden}"`,
      );
    }
  }
});

test("la solución de cada afirmación coincide con ARCHIVE_CRITERIA_SPEC.md §6", () => {
  const expectedSolution = {
    "voluntary-entry": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
    "followed-trail": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
    "never-disagreed": ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
    "someone-refuses-now": ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
    "present-choice": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
    "universal-future": ARCHIVE_CRITERIA_VERDICT.UNDECIDABLE,
  };

  const actualSolution = Object.fromEntries(
    ARCHIVE_CRITERIA_CLAIMS.map((claim) => [claim.id, claim.verdict]),
  );

  assert.deepEqual(actualSolution, expectedSolution);
  assert.deepEqual(ARCHIVE_CRITERIA_SOLUTION, expectedSolution);
});

test("el aumento de dificultad no altera la solución de las seis afirmaciones", () => {
  assert.deepEqual(
    ARCHIVE_CRITERIA_CLAIMS.map((claim) => claim.verdict),
    [
      "confirmed",
      "confirmed",
      "contradicted",
      "contradicted",
      "confirmed",
      "undecidable",
    ],
  );
});

test("cada veredicto pertenece al conjunto de tres valores permitidos", () => {
  const allowed = new Set(Object.values(ARCHIVE_CRITERIA_VERDICT));

  assert.deepEqual([...allowed].sort(), [
    "confirmed",
    "contradicted",
    "undecidable",
  ]);

  for (const claim of ARCHIVE_CRITERIA_CLAIMS) {
    assert.ok(allowed.has(claim.verdict));
  }
});

test("ARCHIVE_CRITERIA_INITIAL_VERDICTS contiene las seis claves en null", () => {
  assert.deepEqual(ARCHIVE_CRITERIA_INITIAL_VERDICTS, {
    "voluntary-entry": null,
    "followed-trail": null,
    "never-disagreed": null,
    "someone-refuses-now": null,
    "present-choice": null,
    "universal-future": null,
  });
});

test("las constantes de datos son inmutables", () => {
  assert.throws(() => {
    ARCHIVE_CRITERIA_CLAIMS.push({});
  });
  assert.throws(() => {
    ARCHIVE_CRITERIA_EVIDENCE[0].text = "manipulado";
  });
  assert.throws(() => {
    ARCHIVE_CRITERIA_CLAIMS[0].evidenceIds.push("E1");
  });
  assert.throws(() => {
    ARCHIVE_CRITERIA_EVIDENCE_RELEVANCE["followed-trail"].E1 = "supports";
  });
  assert.throws(() => {
    ARCHIVE_CRITERIA_EVIDENCE_ROLE.SUPPORTS = "otro";
  });
});

function relationsWithRole(expectedRole) {
  const relations = [];

  for (const claim of ARCHIVE_CRITERIA_CLAIMS) {
    const roles = ARCHIVE_CRITERIA_EVIDENCE_RELEVANCE[claim.id];

    for (const [evidenceId, role] of Object.entries(roles)) {
      if (role === expectedRole) {
        relations.push({ claimId: claim.id, evidenceId });
      }
    }
  }

  return relations;
}

function decisiveEvidenceIds(claimId) {
  return Object.entries(ARCHIVE_CRITERIA_EVIDENCE_RELEVANCE[claimId])
    .filter(([, role]) => role !== ARCHIVE_CRITERIA_EVIDENCE_ROLE.IRRELEVANT)
    .map(([evidenceId]) => evidenceId);
}

function byEvidenceNumber(a, b) {
  return Number(a.slice(1)) - Number(b.slice(1));
}

function normalize(text) {
  return text.toLowerCase();
}
