import {
  LIBRARY_CATALOGUE_PHASE,
} from "../puzzles/library-catalogue/LibraryCatalogueState.js";

export const ARCHIVE_OBJECTIVE_ID = "inspect-archive-criteria-table";

export const LIBRARY_CATALOGUE_NOTEBOOK_ENTRY = Object.freeze({
  id: "library-catalogue-solution",
  title: "El catálogo perfecto",
  text:
    "El orden A-D-R-C-M ha restaurado el catálogo y revelado el acceso al Archivo.",
});

export function applyLibraryCatalogueProgression(state) {
  if (
    state.puzzles.libraryCatalogue.phase !==
    LIBRARY_CATALOGUE_PHASE.SOLVED
  ) {
    return { applied: false };
  }

  const hasNotebookEntry = state.notebook.some(
    (entry) => entry.id === LIBRARY_CATALOGUE_NOTEBOOK_ENTRY.id,
  );
  const isComplete =
    state.flags.archiveUnlocked && hasNotebookEntry;

  if (isComplete) {
    return { applied: false };
  }

  if (!state.flags.archiveUnlocked) {
    state.flags.archiveUnlocked = true;
    state.objectiveId = ARCHIVE_OBJECTIVE_ID;
  }
  const notebookAdded = state.addNotebookEntry(
    LIBRARY_CATALOGUE_NOTEBOOK_ENTRY,
  );

  return { applied: true, notebookAdded };
}
