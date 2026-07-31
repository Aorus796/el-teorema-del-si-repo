import {
  ARCHIVE_CRITERIA_PHASE,
} from "../puzzles/archive-criteria/ArchiveCriteriaState.js";

export const START_EPILOGUE_OBJECTIVE_ID = "start-epilogue";

export const ARCHIVE_FINAL_EVIDENCE_ENTRY = Object.freeze({
  id: "archive-final-evidence",
  title: "La pregunta correcta",
  text:
    "El Archivo conserva dos declaraciones presentes coincidentes y confirma que no dispone de observaciones futuras.",
});

export function applyArchiveCriteriaProgression(state) {
  if (
    state.puzzles.archiveCriteria.phase !== ARCHIVE_CRITERIA_PHASE.SOLVED
  ) {
    return { applied: false };
  }

  let changed = false;

  if (!state.flags.investigationComplete) {
    state.flags.investigationComplete = true;
    changed = true;
  }

  if (!state.flags.epilogueUnlocked) {
    state.flags.epilogueUnlocked = true;
    state.objectiveId = START_EPILOGUE_OBJECTIVE_ID;
    changed = true;
  }

  const notebookAdded = state.addNotebookEntry(
    ARCHIVE_FINAL_EVIDENCE_ENTRY,
  );

  if (!changed && !notebookAdded) {
    return { applied: false };
  }

  return { applied: true, notebookAdded };
}
