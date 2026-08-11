import test from "node:test";
import assert from "node:assert/strict";
import {
  ARCHIVE_CRITERIA_CLAIM_IDS,
  ARCHIVE_CRITERIA_CLAIMS,
  ARCHIVE_CRITERIA_EVIDENCE,
  ARCHIVE_CRITERIA_EVIDENCE_IDS,
  ARCHIVE_CRITERIA_INITIAL_VERDICTS,
  ARCHIVE_CRITERIA_SOLUTION,
  ARCHIVE_CRITERIA_VERDICT,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaData.js";

test("existen exactamente seis evidencias con IDs únicos", () => {
  assert.equal(ARCHIVE_CRITERIA_EVIDENCE.length, 6);

  const ids = ARCHIVE_CRITERIA_EVIDENCE.map((evidence) => evidence.id);
  assert.deepEqual(ids, ["E1", "E2", "E3", "E4", "E5", "E6"]);
  assert.equal(new Set(ids).size, 6);

  for (const evidence of ARCHIVE_CRITERIA_EVIDENCE) {
    assert.equal(typeof evidence.name, "string");
    assert.ok(evidence.name.length > 0);
    assert.equal(typeof evidence.text, "string");
    assert.ok(evidence.text.length > 0);
  }
});

test("el contenido literal de las seis evidencias coincide con ARCHIVE_CRITERIA_SPEC.md §5", () => {
  assert.deepEqual(ARCHIVE_CRITERIA_EVIDENCE, [
    {
      id: "E1",
      name: "Registro de acceso",
      text:
        "La novia abrió el Archivo con su propia credencial y anotó que entraba para revisar el protocolo.",
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
        "La pareja discrepó sobre una decisión de la ceremonia y acordó una corrección.",
    },
    {
      id: "E4",
      name: "Declaración del protagonista",
      text: "«Con lo que sé ahora, elijo avanzar contigo».",
    },
    {
      id: "E5",
      name: "Declaración de la novia",
      text: "«Con lo que sé ahora, elijo avanzar contigo».",
    },
    {
      id: "E6",
      name: "Límite del Archivo",
      text:
        "El sistema solo contiene observaciones realizadas hasta el presente y no puede observar hechos futuros.",
    },
  ]);
});

test("los IDs de evidencia expuestos coinciden con los datos", () => {
  assert.deepEqual(Object.values(ARCHIVE_CRITERIA_EVIDENCE_IDS).sort(), [
    "E1",
    "E2",
    "E3",
    "E4",
    "E5",
    "E6",
  ]);
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

test("el mapa claimId -> evidenceIds coincide exactamente con lo aprobado", () => {
  const expectedEvidenceIds = {
    "voluntary-entry": ["E1"],
    "followed-trail": ["E2"],
    "never-disagreed": ["E3"],
    "someone-refuses-now": ["E4", "E5"],
    "present-choice": ["E4", "E5"],
    "universal-future": ["E6"],
  };

  const actualEvidenceIds = Object.fromEntries(
    ARCHIVE_CRITERIA_CLAIMS.map((claim) => [
      claim.id,
      [...claim.evidenceIds],
    ]),
  );

  assert.deepEqual(actualEvidenceIds, expectedEvidenceIds);
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
});
