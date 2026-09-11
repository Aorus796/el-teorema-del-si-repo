import {
  ARCHIVE_CRITERIA_PHASE,
} from "../puzzles/archive-criteria/ArchiveCriteriaState.js";
import { GIFT_CODE_CLUE_LINES } from "../content/epilogueConfig.js";

/*
 * Objetivo que deja resolver el criterio del Archivo desde v1.3. Antes de
 * esa versión, resolverlo desbloqueaba el epílogo directamente y fijaba
 * START_EPILOGUE_OBJECTIVE_ID; ahora abre la Cámara de Contención y es la
 * consulta del Custodio la que desbloquea el epílogo (ver
 * DoubtBudgetProgression.js). START_EPILOGUE_OBJECTIVE_ID sigue exportado
 * desde aquí porque es donde ya vivía y varios consumidores lo importan de
 * este módulo; su única escritura real está ahora en la progresión de la
 * consulta de contención.
 */
export const START_EPILOGUE_OBJECTIVE_ID = "start-epilogue";

export const ENTER_CONTAINMENT_OBJECTIVE_ID = "enter-containment-chamber";

export const ARCHIVE_FINAL_EVIDENCE_ENTRY = Object.freeze({
  id: "archive-final-evidence",
  title: "La pregunta correcta",
  text:
    "El Archivo conserva dos declaraciones presentes coincidentes y confirma que no dispone de observaciones futuras.",
});

export const EPILOGUE_COMBINATION_CLUE_ENTRY = Object.freeze({
  id: "epilogue-combination-clue",
  title: "La combinación del candado",
  text: GIFT_CODE_CLUE_LINES.join("\n"),
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

  if (!state.flags.containmentUnlocked) {
    state.flags.containmentUnlocked = true;
    state.objectiveId = ENTER_CONTAINMENT_OBJECTIVE_ID;
    changed = true;
  }

  const finalEvidenceAdded = state.addNotebookEntry(
    ARCHIVE_FINAL_EVIDENCE_ENTRY,
  );

  const combinationClueAdded = state.addNotebookEntry(
    EPILOGUE_COMBINATION_CLUE_ENTRY,
  );

  const notebookAdded = finalEvidenceAdded || combinationClueAdded;

  if (!changed && !notebookAdded) {
    return { applied: false };
  }

  return { applied: true, notebookAdded };
}
