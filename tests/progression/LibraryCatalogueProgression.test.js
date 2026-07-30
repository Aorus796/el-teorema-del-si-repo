import assert from "node:assert/strict";
import test from "node:test";
import {
  ARCHIVE_OBJECTIVE_ID,
  applyLibraryCatalogueProgression,
  LIBRARY_CATALOGUE_NOTEBOOK_ENTRY,
} from "../../src/progression/LibraryCatalogueProgression.js";
import {
  LIBRARY_CATALOGUE_PHASE,
  LibraryCatalogueState,
} from "../../src/puzzles/library-catalogue/LibraryCatalogueState.js";
import { GameState } from "../../src/state/GameState.js";

test("la progresión del catálogo se aplica una sola vez", () => {
  const state = new GameState();
  state.puzzles.libraryCatalogue = new LibraryCatalogueState({
    order: ["A", "D", "R", "C", "M"],
    phase: LIBRARY_CATALOGUE_PHASE.SOLVED,
  });

  assert.deepEqual(applyLibraryCatalogueProgression(state), {
    applied: true,
    notebookAdded: true,
  });
  assert.equal(state.flags.archiveUnlocked, true);
  assert.equal(state.objectiveId, ARCHIVE_OBJECTIVE_ID);
  assert.deepEqual(state.notebook, [LIBRARY_CATALOGUE_NOTEBOOK_ENTRY]);
  assert.deepEqual(applyLibraryCatalogueProgression(state), {
    applied: false,
  });
});

test("la progresión conserva un objetivo posterior ya reconciliado", () => {
  const state = solvedState();
  state.flags.archiveUnlocked = true;
  state.objectiveId = "solve-archive-criteria";
  state.addNotebookEntry(LIBRARY_CATALOGUE_NOTEBOOK_ENTRY);

  assert.deepEqual(applyLibraryCatalogueProgression(state), {
    applied: false,
  });
  assert.equal(state.objectiveId, "solve-archive-criteria");
});

test("la progresión recupera la entrada sin retroceder un objetivo", () => {
  const state = solvedState();
  state.flags.archiveUnlocked = true;
  state.objectiveId = "start-epilogue";

  assert.deepEqual(applyLibraryCatalogueProgression(state), {
    applied: true,
    notebookAdded: true,
  });
  assert.equal(state.objectiveId, "start-epilogue");
  assert.deepEqual(state.notebook, [LIBRARY_CATALOGUE_NOTEBOOK_ENTRY]);
});

test("la progresión no modifica catálogos sin resolver", () => {
  for (const phase of [
    LIBRARY_CATALOGUE_PHASE.READY,
    LIBRARY_CATALOGUE_PHASE.ARRANGING,
    LIBRARY_CATALOGUE_PHASE.FAILED,
  ]) {
    const state = new GameState();
    state.puzzles.libraryCatalogue = new LibraryCatalogueState({
      phase,
      attemptCount:
        phase === LIBRARY_CATALOGUE_PHASE.FAILED ? 1 : 0,
      failureCode:
        phase === LIBRARY_CATALOGUE_PHASE.FAILED
          ? "constraints_not_satisfied"
          : null,
    });

    assert.deepEqual(applyLibraryCatalogueProgression(state), {
      applied: false,
    });
    assert.equal(state.flags.archiveUnlocked, false);
    assert.equal(state.notebook.length, 0);
  }
});

function solvedState() {
  const state = new GameState();
  state.puzzles.libraryCatalogue = new LibraryCatalogueState({
    order: ["A", "D", "R", "C", "M"],
    phase: LIBRARY_CATALOGUE_PHASE.SOLVED,
  });
  return state;
}
