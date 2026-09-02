import assert from "node:assert/strict";
import test from "node:test";
import { GameState, SAVE_FORMAT_VERSION } from "../../src/state/GameState.js";
import {
  ARCHIVE_CRITERIA_CLAIM_IDS,
  ARCHIVE_CRITERIA_EVIDENCE,
  ARCHIVE_CRITERIA_SOLUTION,
  ARCHIVE_CRITERIA_VERDICT,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaData.js";
import {
  ARCHIVE_CRITERIA_FAILURE_CODE,
  ARCHIVE_CRITERIA_PHASE,
  ArchiveCriteriaState,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaState.js";

/*
 * El aumento de dificultad de La pregunta correcta solo toca contenido
 * (evidencias, matriz de relevancia y pistas). Estas pruebas fijan que el
 * guardado sigue siendo el formato 4 con las mismas seis claves de
 * `verdicts`, y que ningún identificador de evidencia se cuela en el
 * guardado ahora que hay diez en vez de seis.
 */

const PARTIAL_CLASSIFICATION = {
  [ARCHIVE_CRITERIA_CLAIM_IDS.VOLUNTARY_ENTRY]:
    ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
  [ARCHIVE_CRITERIA_CLAIM_IDS.FOLLOWED_TRAIL]:
    ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
  [ARCHIVE_CRITERIA_CLAIM_IDS.NEVER_DISAGREED]:
    ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
  [ARCHIVE_CRITERIA_CLAIM_IDS.SOMEONE_REFUSES_NOW]: null,
  [ARCHIVE_CRITERIA_CLAIM_IDS.PRESENT_CHOICE]: null,
  [ARCHIVE_CRITERIA_CLAIM_IDS.UNIVERSAL_FUTURE]: null,
};

const WRONG_CLASSIFICATION = {
  ...ARCHIVE_CRITERIA_SOLUTION,
  [ARCHIVE_CRITERIA_CLAIM_IDS.UNIVERSAL_FUTURE]:
    ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
};

const CASES = [
  {
    label: "clasificación parcial",
    saveData: {
      verdicts: { ...PARTIAL_CLASSIFICATION },
      phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
      hintsRead: [1, 2],
      attemptCount: 1,
      failureCode: null,
    },
  },
  {
    label: "intento fallido",
    saveData: {
      verdicts: { ...WRONG_CLASSIFICATION },
      phase: ARCHIVE_CRITERIA_PHASE.FAILED,
      hintsRead: [1],
      attemptCount: 3,
      failureCode: ARCHIVE_CRITERIA_FAILURE_CODE.INCORRECT_VERDICTS,
    },
  },
  {
    label: "criterio resuelto",
    saveData: {
      verdicts: { ...ARCHIVE_CRITERIA_SOLUTION },
      phase: ARCHIVE_CRITERIA_PHASE.SOLVED,
      hintsRead: [1, 2, 3],
      attemptCount: 4,
      failureCode: null,
    },
  },
];

test("un guardado de formato 4 restaura cada fase del Archivo campo a campo", () => {
  for (const { label, saveData } of CASES) {
    const saved = new GameState().toSaveData();
    assert.equal(saved.formatVersion, SAVE_FORMAT_VERSION);
    assert.equal(SAVE_FORMAT_VERSION, 4);

    saved.puzzles.archiveCriteria = structuredClone(saveData);

    const state = new GameState();
    state.restore(saved);

    const restored = state.puzzles.archiveCriteria;

    assert.ok(
      restored instanceof ArchiveCriteriaState,
      `${label}: debe restaurarse como ArchiveCriteriaState`,
    );
    assert.deepEqual(
      restored.toSaveData(),
      saveData,
      `${label}: la restauración debe conservar los cinco campos`,
    );
    assert.deepEqual(
      state.toSaveData().puzzles.archiveCriteria,
      saveData,
      `${label}: volver a serializar debe producir el mismo guardado`,
    );
  }
});

test("el guardado del Archivo solo persiste las seis claves de afirmación", () => {
  for (const { label, saveData } of CASES) {
    const persisted = new ArchiveCriteriaState(saveData).toSaveData();

    assert.deepEqual(
      Object.keys(persisted).sort(),
      ["attemptCount", "failureCode", "hintsRead", "phase", "verdicts"],
      `${label}: no deben aparecer campos nuevos en el guardado`,
    );
    assert.deepEqual(
      Object.keys(persisted.verdicts),
      Object.values(ARCHIVE_CRITERIA_CLAIM_IDS),
      `${label}: las claves de verdicts son las seis afirmaciones`,
    );
  }
});

test("ningún identificador de evidencia llega al guardado", () => {
  const evidenceIds = ARCHIVE_CRITERIA_EVIDENCE.map(
    (evidence) => evidence.id,
  );

  for (const { label, saveData } of CASES) {
    const saved = new GameState().toSaveData();
    saved.puzzles.archiveCriteria = structuredClone(saveData);

    const state = new GameState();
    state.restore(saved);

    const serialized = JSON.stringify(
      state.toSaveData().puzzles.archiveCriteria,
    );

    for (const evidenceId of evidenceIds) {
      assert.equal(
        serialized.includes(`"${evidenceId}"`),
        false,
        `${label}: ${evidenceId} no debe persistirse`,
      );
    }
  }
});
