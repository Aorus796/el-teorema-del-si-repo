import {
  DOUBT_BUDGET_PHASE,
} from "../puzzles/doubt-budget/DoubtBudgetState.js";
import {
  START_EPILOGUE_OBJECTIVE_ID,
} from "./ArchiveCriteriaProgression.js";

/*
 * Consecuencias narrativas de cerrar el expediente de contención, calcadas
 * de applyArchiveCriteriaProgression(): idempotente, sin efectos si la
 * consulta no está resuelta, y capaz de reparar por separado cada
 * consecuencia que faltara (bandera, objetivo, cuaderno) sin retroceder un
 * objetivo posterior ya alcanzado.
 *
 * Desde v1.3 éste es el único punto del juego que pone `epilogueUnlocked`
 * en true: resolver el criterio del Archivo abre la Cámara de Contención
 * (ver ArchiveCriteriaProgression.js), y es la consulta del Custodio la que
 * abre el epílogo. Al hacerlo asegura además los dos eslabones previos de
 * la cadena de banderas, por la misma razón por la que
 * applyArchiveCriteriaProgression() asegura `investigationComplete` junto a
 * `containmentUnlocked`. START_EPILOGUE_OBJECTIVE_ID se importa de ese
 * módulo en vez de redeclararse aquí, para que siga habiendo un único
 * identificador real del objetivo de inicio del epílogo.
 */
export const CONTAINMENT_CLOSURE_ENTRY = Object.freeze({
  id: "containment-closure",
  title: "El expediente que se cerró solo",
  text:
    "Tres preguntas bastaron para dejar el expediente de contención en una única lectura posible: de los tres asientos que sostenían la retención, sólo uno estaba respaldado por una observación registrada. Los otros dos eran presupuestos, y el propio protocolo del Custodio obliga a cerrar sin conclusión todo expediente fundado en un presupuesto.",
});

export function applyDoubtBudgetProgression(state) {
  if (state.puzzles.doubtBudget.phase !== DOUBT_BUDGET_PHASE.SOLVED) {
    return { applied: false };
  }

  let changed = false;

  /*
   * La cadena entera, no solo el último eslabón: las invariantes del
   * guardado exigen `epilogueUnlocked ⟹ containmentUnlocked ⟹
   * investigationComplete` (ver assertEpilogueFlagInvariants() en
   * GameState.js), así que esta función no puede dejar por sí sola un
   * estado que la siguiente carga rechazaría. Jugando no se llega aquí sin
   * las dos banderas previas -- applyArchiveCriteriaProgression() ya las
   * fija y la Cámara está gateada por ellas --, pero la garantía se
   * mantiene en el punto de escritura, igual que allí, y no auto-curando en
   * restore(): un formato 5 mal formado debe seguir fallando su invariante.
   */
  if (!state.flags.investigationComplete) {
    state.flags.investigationComplete = true;
    changed = true;
  }

  if (!state.flags.containmentUnlocked) {
    state.flags.containmentUnlocked = true;
    changed = true;
  }

  if (!state.flags.epilogueUnlocked) {
    state.flags.epilogueUnlocked = true;
    state.objectiveId = START_EPILOGUE_OBJECTIVE_ID;
    changed = true;
  }

  const notebookAdded = state.addNotebookEntry(CONTAINMENT_CLOSURE_ENTRY);

  if (!changed && !notebookAdded) {
    return { applied: false };
  }

  return { applied: true, notebookAdded };
}
