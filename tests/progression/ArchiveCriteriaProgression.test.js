import assert from "node:assert/strict";
import test from "node:test";
import {
  ARCHIVE_FINAL_EVIDENCE_ENTRY,
  START_EPILOGUE_OBJECTIVE_ID,
  applyArchiveCriteriaProgression,
} from "../../src/progression/ArchiveCriteriaProgression.js";
import {
  ARCHIVE_CRITERIA_SOLUTION,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaData.js";
import {
  ARCHIVE_CRITERIA_FAILURE_CODE,
  ARCHIVE_CRITERIA_PHASE,
  ArchiveCriteriaState,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaState.js";
import { GameState } from "../../src/state/GameState.js";

test("ready, classifying y failed no aplican consecuencias", () => {
  for (const phase of [
    ARCHIVE_CRITERIA_PHASE.READY,
    ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
    ARCHIVE_CRITERIA_PHASE.FAILED,
  ]) {
    const state = new GameState();
    state.puzzles.archiveCriteria = nonSolvedState(phase);

    assert.deepEqual(applyArchiveCriteriaProgression(state), {
      applied: false,
    });
    assert.equal(state.flags.investigationComplete, false);
    assert.equal(state.flags.epilogueUnlocked, false);
    assert.equal(state.notebook.length, 0);
    assert.equal(
      state.objectiveId,
      "review-preparations-board",
      "el objetivo por defecto no debe tocarse",
    );
  }
});

test("primera resolución establece ambas banderas, el objetivo y el cuaderno", () => {
  const state = new GameState();
  state.puzzles.archiveCriteria = solvedState();

  const result = applyArchiveCriteriaProgression(state);

  assert.deepEqual(result, { applied: true, notebookAdded: true });
  assert.equal(state.flags.investigationComplete, true);
  assert.equal(state.flags.epilogueUnlocked, true);
  assert.equal(state.objectiveId, START_EPILOGUE_OBJECTIVE_ID);
  assert.deepEqual(state.notebook, [ARCHIVE_FINAL_EVIDENCE_ENTRY]);
});

test("una segunda aplicación no repite consecuencias ni duplica el cuaderno", () => {
  const state = new GameState();
  state.puzzles.archiveCriteria = solvedState();

  const first = applyArchiveCriteriaProgression(state);
  const second = applyArchiveCriteriaProgression(state);

  assert.deepEqual(first, { applied: true, notebookAdded: true });
  assert.deepEqual(second, { applied: false });
  assert.equal(state.notebook.length, 1);
  assert.equal(state.flags.investigationComplete, true);
  assert.equal(state.flags.epilogueUnlocked, true);
});

test("repara investigationComplete de forma independiente sin retroceder el objetivo", () => {
  const state = new GameState();
  state.puzzles.archiveCriteria = solvedState();
  state.flags.epilogueUnlocked = true;
  state.objectiveId = "some-later-objective";
  state.addNotebookEntry(ARCHIVE_FINAL_EVIDENCE_ENTRY);

  const result = applyArchiveCriteriaProgression(state);

  assert.deepEqual(result, { applied: true, notebookAdded: false });
  assert.equal(state.flags.investigationComplete, true);
  assert.equal(state.flags.epilogueUnlocked, true);
  assert.equal(state.objectiveId, "some-later-objective");
  assert.equal(state.notebook.length, 1);
});

test("repara epilogueUnlocked y fija el objetivo del epílogo en la transición real", () => {
  const state = new GameState();
  state.puzzles.archiveCriteria = solvedState();
  state.flags.investigationComplete = true;
  state.addNotebookEntry(ARCHIVE_FINAL_EVIDENCE_ENTRY);

  const result = applyArchiveCriteriaProgression(state);

  assert.deepEqual(result, { applied: true, notebookAdded: false });
  assert.equal(state.flags.epilogueUnlocked, true);
  assert.equal(state.objectiveId, START_EPILOGUE_OBJECTIVE_ID);
});

test("repara solo el cuaderno cuando ambas banderas ya eran true, conservando el objetivo posterior", () => {
  const state = new GameState();
  state.puzzles.archiveCriteria = solvedState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.objectiveId = "some-later-objective";

  const result = applyArchiveCriteriaProgression(state);

  assert.deepEqual(result, { applied: true, notebookAdded: true });
  assert.deepEqual(state.notebook, [ARCHIVE_FINAL_EVIDENCE_ENTRY]);
  assert.equal(state.objectiveId, "some-later-objective");
});

test("un estado completamente reconciliado con objetivo posterior no vuelve a aplicar nada", () => {
  const state = new GameState();
  state.puzzles.archiveCriteria = solvedState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.objectiveId = "some-later-objective";
  state.addNotebookEntry(ARCHIVE_FINAL_EVIDENCE_ENTRY);

  const result = applyArchiveCriteriaProgression(state);

  assert.deepEqual(result, { applied: false });
  assert.equal(state.objectiveId, "some-later-objective");
  assert.equal(state.notebook.length, 1);
});

function solvedState(attemptCount = 1) {
  return new ArchiveCriteriaState({
    verdicts: ARCHIVE_CRITERIA_SOLUTION,
    phase: ARCHIVE_CRITERIA_PHASE.SOLVED,
    attemptCount,
  });
}

function nonSolvedState(phase) {
  if (phase === ARCHIVE_CRITERIA_PHASE.FAILED) {
    return new ArchiveCriteriaState({
      phase: ARCHIVE_CRITERIA_PHASE.FAILED,
      failureCode: ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION,
      attemptCount: 1,
    });
  }

  return new ArchiveCriteriaState({ phase });
}
