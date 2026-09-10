import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTAINMENT_CLOSURE_ENTRY,
  applyDoubtBudgetProgression,
} from "../../src/progression/DoubtBudgetProgression.js";
import {
  START_EPILOGUE_OBJECTIVE_ID,
} from "../../src/progression/ArchiveCriteriaProgression.js";
import {
  DOUBT_BUDGET_TRUE_DOSSIER_ID,
} from "../../src/puzzles/doubt-budget/DoubtBudgetData.js";
import {
  DOUBT_BUDGET_FAILURE_CODE,
  DOUBT_BUDGET_PHASE,
  DoubtBudgetState,
} from "../../src/puzzles/doubt-budget/DoubtBudgetState.js";
import { GameState } from "../../src/state/GameState.js";

// Terna que zanja el caso: deja un único expediente compatible, así que la
// identificación del expediente real queda forzada y DoubtBudgetState la
// acepta como fase "solved".
const SETTLING_TRIPLE = ["P1", "P2", "P4"];

function solvedState(attemptCount = 1) {
  return new DoubtBudgetState({
    askedQuestionIds: SETTLING_TRIPLE,
    identifiedDossierId: DOUBT_BUDGET_TRUE_DOSSIER_ID,
    phase: DOUBT_BUDGET_PHASE.SOLVED,
    attemptCount,
  });
}

function nonSolvedState(phase) {
  if (phase === DOUBT_BUDGET_PHASE.FAILED) {
    return new DoubtBudgetState({
      askedQuestionIds: ["P1"],
      identifiedDossierId: DOUBT_BUDGET_TRUE_DOSSIER_ID,
      phase: DOUBT_BUDGET_PHASE.FAILED,
      failureCode: DOUBT_BUDGET_FAILURE_CODE.UNFORCED_IDENTIFICATION,
      attemptCount: 1,
    });
  }

  if (phase === DOUBT_BUDGET_PHASE.CONSULTING) {
    return new DoubtBudgetState({
      askedQuestionIds: ["P1"],
      phase: DOUBT_BUDGET_PHASE.CONSULTING,
    });
  }

  return new DoubtBudgetState();
}

function containmentReadyState() {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.containmentUnlocked = true;
  return state;
}

test("ready, consulting y failed no aplican consecuencias", () => {
  for (const phase of [
    DOUBT_BUDGET_PHASE.READY,
    DOUBT_BUDGET_PHASE.CONSULTING,
    DOUBT_BUDGET_PHASE.FAILED,
  ]) {
    const state = containmentReadyState();
    state.puzzles.doubtBudget = nonSolvedState(phase);

    assert.deepEqual(applyDoubtBudgetProgression(state), { applied: false });
    assert.equal(state.flags.epilogueUnlocked, false);
    assert.equal(state.notebook.length, 0);
    assert.equal(
      state.objectiveId,
      "review-preparations-board",
      "el objetivo por defecto no debe tocarse",
    );
  }
});

test("primera resolución desbloquea el epílogo, fija su objetivo y anota el cuaderno", () => {
  const state = containmentReadyState();
  state.puzzles.doubtBudget = solvedState();

  const result = applyDoubtBudgetProgression(state);

  assert.deepEqual(result, { applied: true, notebookAdded: true });
  assert.equal(state.flags.epilogueUnlocked, true);
  assert.equal(state.objectiveId, START_EPILOGUE_OBJECTIVE_ID);
  assert.deepEqual(state.notebook, [CONTAINMENT_CLOSURE_ENTRY]);
});

test("una segunda aplicación no repite consecuencias ni duplica el cuaderno", () => {
  const state = containmentReadyState();
  state.puzzles.doubtBudget = solvedState();

  const first = applyDoubtBudgetProgression(state);
  const second = applyDoubtBudgetProgression(state);

  assert.deepEqual(first, { applied: true, notebookAdded: true });
  assert.deepEqual(second, { applied: false });
  assert.equal(state.notebook.length, 1);
  assert.equal(state.flags.epilogueUnlocked, true);
});

test("repara solo el cuaderno cuando el epílogo ya estaba desbloqueado, conservando el objetivo posterior", () => {
  const state = containmentReadyState();
  state.puzzles.doubtBudget = solvedState();
  state.flags.epilogueUnlocked = true;
  state.objectiveId = "some-later-objective";

  const result = applyDoubtBudgetProgression(state);

  assert.deepEqual(result, { applied: true, notebookAdded: true });
  assert.deepEqual(state.notebook, [CONTAINMENT_CLOSURE_ENTRY]);
  assert.equal(state.objectiveId, "some-later-objective");
});

test("un estado completamente reconciliado con objetivo posterior no vuelve a aplicar nada", () => {
  const state = containmentReadyState();
  state.puzzles.doubtBudget = solvedState();
  state.flags.epilogueUnlocked = true;
  state.objectiveId = "some-later-objective";
  state.addNotebookEntry(CONTAINMENT_CLOSURE_ENTRY);

  const result = applyDoubtBudgetProgression(state);

  assert.deepEqual(result, { applied: false });
  assert.equal(state.objectiveId, "some-later-objective");
  assert.equal(state.notebook.length, 1);
});

test("las banderas posteriores del epílogo no se crean como efecto colateral", () => {
  const state = containmentReadyState();
  state.puzzles.doubtBudget = solvedState();

  applyDoubtBudgetProgression(state);

  assert.equal(state.flags.epilogueStarted, false);
  assert.equal(state.flags.giftCodeSolved, false);
  assert.equal(state.flags.epilogueCompleted, false);
});

test("no retrocede ninguna bandera ya alcanzada al reaplicar sobre una partida avanzada", () => {
  const state = containmentReadyState();
  state.puzzles.doubtBudget = solvedState();
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;
  state.flags.epilogueCompleted = true;
  state.objectiveId = "epilogue-completed";
  state.addNotebookEntry(CONTAINMENT_CLOSURE_ENTRY);

  assert.deepEqual(applyDoubtBudgetProgression(state), { applied: false });
  assert.equal(state.flags.epilogueUnlocked, true);
  assert.equal(state.flags.epilogueStarted, true);
  assert.equal(state.flags.giftCodeSolved, true);
  assert.equal(state.flags.epilogueCompleted, true);
  assert.equal(state.objectiveId, "epilogue-completed");
});

/*
 * Invariante de guardado, no solo de memoria: `epilogueUnlocked` implica
 * `containmentUnlocked`, que a su vez implica `investigationComplete` (ver
 * assertEpilogueFlagInvariants() en GameState.js). Esta función es el único
 * punto que pone `epilogueUnlocked`, así que por sí sola no puede producir
 * un estado que la carga siguiente rechace -- aunque jugando nunca se llegue
 * aquí sin las dos banderas previas ya puestas por el Archivo.
 *
 * El round-trip completo (guardar -> cargar -> guardar -> cargar) es
 * deliberado: comprobar solo el estado en memoria tras una pasada no habría
 * detectado el agujero, porque el guardado mal formado únicamente estalla al
 * volver a leerse.
 */
test("resolver la consulta sin la cadena previa deja un guardado que sobrevive dos cargas seguidas", () => {
  const state = new GameState();
  state.puzzles.doubtBudget = solvedState();

  assert.equal(state.flags.investigationComplete, false);
  assert.equal(state.flags.containmentUnlocked, false);

  assert.deepEqual(applyDoubtBudgetProgression(state), {
    applied: true,
    notebookAdded: true,
  });
  assert.equal(state.flags.investigationComplete, true);
  assert.equal(state.flags.containmentUnlocked, true);
  assert.equal(state.flags.epilogueUnlocked, true);

  const firstSave = state.toSaveData();
  const reloaded = new GameState();

  assert.doesNotThrow(() => reloaded.restore(firstSave));

  const secondSave = reloaded.toSaveData();
  const reloadedTwice = new GameState();

  assert.doesNotThrow(() => reloadedTwice.restore(secondSave));

  for (const loaded of [reloaded, reloadedTwice]) {
    assert.equal(loaded.flags.investigationComplete, true);
    assert.equal(loaded.flags.containmentUnlocked, true);
    assert.equal(loaded.flags.epilogueUnlocked, true);
    assert.equal(
      loaded.puzzles.doubtBudget.phase,
      DOUBT_BUDGET_PHASE.SOLVED,
    );
  }

  assert.deepEqual(secondSave.flags, firstSave.flags);
});

/*
 * La entrada de cuaderno resume la revelación sin reproducir literalmente
 * ninguna réplica del diálogo de victoria (WorldScene.js). Se comprueba con
 * las dos frases más reconocibles del Custodio: si alguien copiara el
 * diálogo aquí, el cuaderno pasaría a ser una transcripción.
 */
test("la entrada de cuaderno no copia literalmente las réplicas del Custodio", () => {
  for (const line of [
    "Tres preguntas. Ocho expedientes.",
    "Nunca había tenido que aplicármelo.",
    "Tardaré ciento doce segundos.",
  ]) {
    assert.equal(
      CONTAINMENT_CLOSURE_ENTRY.text.includes(line),
      false,
      `la entrada de cuaderno no debe reproducir «${line}»`,
    );
  }

  assert.ok(CONTAINMENT_CLOSURE_ENTRY.text.length > 0);
  assert.ok(CONTAINMENT_CLOSURE_ENTRY.title.length > 0);
});
