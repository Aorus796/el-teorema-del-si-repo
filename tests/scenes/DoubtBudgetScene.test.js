import test from "node:test";
import assert from "node:assert/strict";
import {
  DoubtBudgetScene,
  wrapText,
} from "../../src/scenes/DoubtBudgetScene.js";
import {
  DOUBT_BUDGET_DOSSIERS,
  DOUBT_BUDGET_QUESTIONS,
  DOUBT_BUDGET_QUESTION_LIMIT,
  DOUBT_BUDGET_TRUE_DOSSIER_ID,
} from "../../src/puzzles/doubt-budget/DoubtBudgetData.js";
import {
  DOUBT_BUDGET_HINTS,
} from "../../src/puzzles/doubt-budget/DoubtBudgetHints.js";
import {
  DOUBT_BUDGET_FAILURE_CODE,
  DOUBT_BUDGET_PHASE,
  DoubtBudgetState,
} from "../../src/puzzles/doubt-budget/DoubtBudgetState.js";
import {
  getCompatibleDossiers,
} from "../../src/puzzles/doubt-budget/DoubtBudgetValidator.js";
import {
  START_EPILOGUE_OBJECTIVE_ID,
} from "../../src/progression/ArchiveCriteriaProgression.js";
import {
  CONTAINMENT_CLOSURE_ENTRY,
} from "../../src/progression/DoubtBudgetProgression.js";
import { PUZZLE_SUCCESS_SFX_PATH } from "../../src/content/sfxAudioConfig.js";
import { GameState } from "../../src/state/GameState.js";

// Terna que zanja el caso: tras ella queda un único expediente compatible.
const SETTLING_TRIPLE = ["P1", "P2", "P4"];

class FakeInput {
  constructor() {
    this.pressedActions = new Set();
  }

  press(action) {
    this.pressedActions.add(action);
  }

  wasPressed(action) {
    if (!this.pressedActions.has(action)) {
      return false;
    }

    this.pressedActions.delete(action);
    return true;
  }
}

class FakeScenes {
  constructor() {
    this.changes = [];
  }

  change(name, payload = {}) {
    this.changes.push({ name, payload });
  }
}

class FakeUi {
  constructor() {
    this.closeAllCount = 0;
    this.toasts = [];
  }

  closeAll() {
    this.closeAllCount += 1;
  }

  showToast(text) {
    this.toasts.push(text);
  }
}

class FakeCanvasContext {
  constructor() {
    this.texts = [];
  }

  fillRect() {}

  strokeRect() {}

  fillText(text) {
    this.texts.push(String(text));
  }
}

class FakeAudioService {
  constructor() {
    this.playSfxCalls = [];
  }

  playSfx(src) {
    this.playSfxCalls.push(src);
  }
}

test("enter en ready reconstruye el estado transitorio sin modificar el persistente", () => {
  const { scene, state } = createScene();
  const before = state.puzzles.doubtBudget.toSaveData();

  scene.focusedQuestionIndex = 4;
  scene.focusedDossierIndex = 6;
  scene.focusedPanel = "dossiers";
  scene.visibleHintLevel = 2;
  scene.enter();

  assert.equal(scene.focusedQuestionIndex, 0);
  assert.equal(scene.focusedDossierIndex, 0);
  assert.equal(scene.focusedPanel, "questions");
  assert.equal(scene.visibleHintLevel, null);
  assert.equal(
    scene.statusMessage,
    "Elige una pregunta con arriba y abajo. Cada una se cobra al formularla.",
  );
  assert.deepEqual(state.puzzles.doubtBudget.toSaveData(), before);
});

test("arriba/abajo recorre circularmente el panel activo, sin tocar el estado", () => {
  const { scene, input, state } = createScene();
  scene.enter();
  const before = state.puzzles.doubtBudget;

  press(scene, input, "moveUp");
  assert.equal(scene.focusedQuestionIndex, DOUBT_BUDGET_QUESTIONS.length - 1);

  press(scene, input, "moveDown");
  assert.equal(scene.focusedQuestionIndex, 0);

  press(scene, input, "moveRight");
  assert.equal(scene.focusedPanel, "dossiers");

  press(scene, input, "moveUp");
  assert.equal(scene.focusedDossierIndex, DOUBT_BUDGET_DOSSIERS.length - 1);

  press(scene, input, "moveLeft");
  assert.equal(scene.focusedPanel, "questions");
  assert.equal(
    scene.focusedQuestionIndex,
    0,
    "cambiar de panel no debe mover la selección del otro",
  );

  assert.equal(state.puzzles.doubtBudget, before);
});

test("Enter en el panel de preguntas formula la pregunta enfocada y gasta presupuesto", () => {
  const { scene, input, state } = createScene();
  scene.enter();

  press(scene, input, "startPuzzleAttempt");

  assert.deepEqual(state.puzzles.doubtBudget.askedQuestionIds, [
    DOUBT_BUDGET_QUESTIONS[0].id,
  ]);
  assert.equal(state.puzzles.doubtBudget.phase, DOUBT_BUDGET_PHASE.CONSULTING);
  assert.equal(
    state.puzzles.doubtBudget.remainingQuestionCount,
    DOUBT_BUDGET_QUESTION_LIMIT - 1,
  );
  assert.equal(scene.statusMessage, "El Custodio responde.");
});

test("repetir una pregunta ya formulada no gasta presupuesto", () => {
  const { scene, input, state } = createScene();
  scene.enter();

  press(scene, input, "startPuzzleAttempt");
  const afterFirst = state.puzzles.doubtBudget;

  press(scene, input, "startPuzzleAttempt");

  assert.deepEqual(state.puzzles.doubtBudget.askedQuestionIds, [
    DOUBT_BUDGET_QUESTIONS[0].id,
  ]);
  assert.equal(
    state.puzzles.doubtBudget.remainingQuestionCount,
    afterFirst.remainingQuestionCount,
  );
  assert.equal(
    scene.statusMessage,
    "Esa pregunta ya consta en el expediente de consulta.",
  );
});

/*
 * Regresión del límite duro del puzle: con el presupuesto agotado, pedir
 * una cuarta pregunta no cuesta nada porque no llega a formularse.
 */
test("con el presupuesto agotado, una cuarta pregunta se rechaza sin cambiar el estado", () => {
  const { scene, input, state } = createScene(
    new DoubtBudgetState({
      askedQuestionIds: SETTLING_TRIPLE,
      phase: DOUBT_BUDGET_PHASE.CONSULTING,
    }),
  );
  scene.enter();

  const before = state.puzzles.doubtBudget.toSaveData();

  // P6 no está en la terna ya formulada: es una pregunta nueva y legítima.
  scene.focusedQuestionIndex = DOUBT_BUDGET_QUESTIONS.findIndex(
    (question) => question.id === "P6",
  );
  press(scene, input, "startPuzzleAttempt");

  assert.deepEqual(state.puzzles.doubtBudget.toSaveData(), before);
  assert.equal(
    scene.statusMessage,
    "El presupuesto está agotado. El Custodio no concede una cuarta entrada.",
  );
});

test("identificar antes de zanjar el caso se rechaza por no forzada, incluso con el expediente real", () => {
  const { scene, input, state } = createScene();
  scene.enter();

  focusDossier(scene, DOUBT_BUDGET_TRUE_DOSSIER_ID);
  press(scene, input, "startPuzzleAttempt");

  assert.equal(state.puzzles.doubtBudget.phase, DOUBT_BUDGET_PHASE.FAILED);
  assert.equal(
    state.puzzles.doubtBudget.failureCode,
    DOUBT_BUDGET_FAILURE_CODE.UNFORCED_IDENTIFICATION,
  );
  assert.equal(state.puzzles.doubtBudget.attemptCount, 1);
  assert.equal(state.flags.epilogueUnlocked, false);
  assert.deepEqual(state.notebook, []);
});

test("identificar con el caso zanjado resuelve, aplica la progresión y muestra el toast una sola vez", () => {
  const { scene, input, state, ui } = createScene(
    new DoubtBudgetState({
      askedQuestionIds: SETTLING_TRIPLE,
      phase: DOUBT_BUDGET_PHASE.CONSULTING,
    }),
  );
  scene.enter();

  focusDossier(scene, DOUBT_BUDGET_TRUE_DOSSIER_ID);
  press(scene, input, "startPuzzleAttempt");

  assert.equal(state.puzzles.doubtBudget.phase, DOUBT_BUDGET_PHASE.SOLVED);
  assert.equal(
    state.puzzles.doubtBudget.identifiedDossierId,
    DOUBT_BUDGET_TRUE_DOSSIER_ID,
  );
  assert.equal(state.flags.epilogueUnlocked, true);
  assert.equal(state.objectiveId, START_EPILOGUE_OBJECTIVE_ID);
  assert.deepEqual(
    state.notebook.map((entry) => entry.id),
    [CONTAINMENT_CLOSURE_ENTRY.id],
  );
  assert.equal(scene.statusMessage, "Identificación aceptada.");
  assert.deepEqual(ui.toasts, ["El expediente de contención se ha cerrado"]);

  press(scene, input, "startPuzzleAttempt");
  assert.deepEqual(ui.toasts, ["El expediente de contención se ha cerrado"]);
});

test("resolver dispara playSfx(PUZZLE_SUCCESS_SFX_PATH) exactamente una vez", () => {
  const { scene, input, audio } = createScene(
    new DoubtBudgetState({
      askedQuestionIds: SETTLING_TRIPLE,
      phase: DOUBT_BUDGET_PHASE.CONSULTING,
    }),
  );
  scene.enter();

  focusDossier(scene, DOUBT_BUDGET_TRUE_DOSSIER_ID);
  press(scene, input, "startPuzzleAttempt");
  assert.deepEqual(audio.playSfxCalls, [PUZZLE_SUCCESS_SFX_PATH]);

  press(scene, input, "startPuzzleAttempt");
  assert.deepEqual(audio.playSfxCalls, [PUZZLE_SUCCESS_SFX_PATH]);
});

test("una identificación rechazada no dispara ningún SFX", () => {
  const { scene, input, audio } = createScene();
  scene.enter();

  focusDossier(scene, DOUBT_BUDGET_TRUE_DOSSIER_ID);
  press(scene, input, "startPuzzleAttempt");

  assert.deepEqual(audio.playSfxCalls, []);
});

test("entrar en una consulta ya resuelta no dispara ningún SFX ni repite el toast", () => {
  const { scene, input, ui, audio } = createScene(solvedState());
  scene.enter();

  press(scene, input, "startPuzzleAttempt");

  assert.deepEqual(audio.playSfxCalls, []);
  assert.deepEqual(ui.toasts, []);
  assert.equal(
    scene.statusMessage,
    "El expediente de contención ya está cerrado.",
  );
});

test("R reinicia la consulta conservando pistas e intentos", () => {
  const { scene, input, state } = createScene(
    new DoubtBudgetState({
      askedQuestionIds: ["P1"],
      identifiedDossierId: DOUBT_BUDGET_TRUE_DOSSIER_ID,
      phase: DOUBT_BUDGET_PHASE.FAILED,
      failureCode: DOUBT_BUDGET_FAILURE_CODE.UNFORCED_IDENTIFICATION,
      hintsRead: [1],
      attemptCount: 2,
    }),
  );
  scene.enter();
  scene.focusedPanel = "dossiers";
  scene.focusedDossierIndex = 5;

  press(scene, input, "restartPuzzleAttempt");

  assert.equal(state.puzzles.doubtBudget.phase, DOUBT_BUDGET_PHASE.READY);
  assert.deepEqual(state.puzzles.doubtBudget.askedQuestionIds, []);
  assert.equal(state.puzzles.doubtBudget.identifiedDossierId, null);
  assert.deepEqual(state.puzzles.doubtBudget.hintsRead, [1]);
  assert.equal(state.puzzles.doubtBudget.attemptCount, 2);
  assert.equal(scene.focusedPanel, "questions");
  assert.equal(scene.focusedDossierIndex, 0);
});

test("R sobre una consulta ya resuelta no la reabre", () => {
  const solved = solvedState();
  const { scene, input, state } = createScene(solved);
  scene.enter();

  press(scene, input, "restartPuzzleAttempt");

  assert.equal(state.puzzles.doubtBudget, solved);
});

test("Q revela las tres reflexiones en orden y luego avisa de que no quedan más", () => {
  const { scene, input, state, ui } = createScene();
  scene.enter();

  for (const hint of DOUBT_BUDGET_HINTS) {
    press(scene, input, "nextPuzzleHint");
    assert.equal(scene.visibleHintLevel, hint.level);
    assert.equal(scene.statusMessage, hint.text);
  }

  assert.deepEqual(state.puzzles.doubtBudget.hintsRead, [1, 2, 3]);
  assert.deepEqual(ui.toasts, [
    "Reflexión 1/3",
    "Reflexión 2/3",
    "Reflexión 3/3",
  ]);

  press(scene, input, "nextPuzzleHint");
  assert.equal(scene.visibleHintLevel, 3);
  assert.deepEqual(state.puzzles.doubtBudget.hintsRead, [1, 2, 3]);
  assert.equal(ui.toasts.at(-1), "No quedan más reflexiones");
});

test("ninguna reflexión nombra el expediente real", () => {
  for (const hint of DOUBT_BUDGET_HINTS) {
    assert.equal(hint.text.includes(DOUBT_BUDGET_TRUE_DOSSIER_ID), false);
  }
});

test("Esc devuelve al mundo sin tocar el estado de la consulta", () => {
  const { scene, input, scenes, state } = createScene();
  scene.enter();
  const before = state.puzzles.doubtBudget;

  press(scene, input, "cancel");

  assert.deepEqual(scenes.changes, [{ name: "world", payload: {} }]);
  assert.equal(state.puzzles.doubtBudget, before);
});

/*
 * El feedback en tiempo real es la manera en que el jugador ve la condición
 * de victoria: tras cada respuesta debe leer cuántos expedientes siguen
 * siendo compatibles, no solo cuánto presupuesto le queda.
 */
test("el render muestra presupuesto restante y expedientes compatibles, y ambos se actualizan al responder", () => {
  const { scene, input } = createScene();
  scene.enter();

  const before = renderScene(scene).texts;
  assert.ok(before.includes("Presupuesto: 3/3 preguntas"));
  assert.ok(before.includes("Expedientes compatibles: 8/8"));

  press(scene, input, "startPuzzleAttempt");

  const after = renderScene(scene).texts;
  assert.ok(after.includes("Presupuesto: 2/3 preguntas"));
  assert.ok(
    after.includes("Expedientes compatibles: 4/8"),
    "la primera pregunta parte el conjunto por la mitad",
  );
});

test("el render muestra la respuesta de cada pregunta ya formulada, y solo de ésas", () => {
  const { scene } = createScene(
    new DoubtBudgetState({
      askedQuestionIds: ["P1"],
      phase: DOUBT_BUDGET_PHASE.CONSULTING,
    }),
  );
  scene.enter();

  const texts = renderScene(scene).texts;

  assert.ok(texts.some((text) => text.includes("P1 — ")));
  assert.equal(
    texts.some((text) => text.includes("P2 — ")),
    false,
    "una pregunta sin formular no debe mostrar respuesta",
  );
});

test("el render marca como descartados los expedientes ya incompatibles", () => {
  const { scene } = createScene(
    new DoubtBudgetState({
      askedQuestionIds: SETTLING_TRIPLE,
      phase: DOUBT_BUDGET_PHASE.CONSULTING,
    }),
  );
  scene.enter();

  const texts = renderScene(scene).texts;
  const compatibleIds = getCompatibleDossiers({
    askedQuestionIds: SETTLING_TRIPLE,
  }).map((dossier) => dossier.id);

  assert.deepEqual(compatibleIds, [DOUBT_BUDGET_TRUE_DOSSIER_ID]);

  for (const dossier of DOUBT_BUDGET_DOSSIERS) {
    const expected = compatibleIds.includes(dossier.id)
      ? "compatible"
      : "descartado";

    assert.ok(
      texts.some(
        (text) => text.includes(dossier.id) && text.includes(expected),
      ),
      `${dossier.id} debería aparecer como ${expected}`,
    );
  }
});

test("el pie muestra los controles mientras la consulta sigue abierta y el cierre cuando ya está resuelta", () => {
  const open = createScene();
  open.scene.enter();
  assert.ok(
    renderScene(open.scene).texts.some((text) =>
      text.includes("Enter formular/concluir"),
    ),
  );

  const solved = createScene(solvedState());
  solved.scene.enter();
  assert.ok(
    renderScene(solved.scene).texts.some((text) =>
      text.includes("EXPEDIENTE CERRADO"),
    ),
  );
});

test("el render nunca revela el identificador del expediente real como respuesta", () => {
  const { scene } = createScene();
  scene.enter();

  assert.equal(
    scene.statusMessage.includes(DOUBT_BUDGET_TRUE_DOSSIER_ID),
    false,
  );
});

test("la escena exige un DoubtBudgetState válido en el estado global", () => {
  const { scene, state } = createScene();
  state.puzzles.doubtBudget = { phase: "solved" };

  assert.throws(() => scene.enter(), /consulta de contención/);
});

test("wrapText no rompe palabras y respeta el ancho máximo cuando puede", () => {
  const lines = wrapText("una frase razonablemente larga de prueba", 12);

  for (const line of lines) {
    assert.ok(line.length <= 12 || !line.includes(" "));
  }

  assert.equal(lines.join(" "), "una frase razonablemente larga de prueba");
});

function createScene(doubtBudgetState = new DoubtBudgetState()) {
  const input = new FakeInput();
  const scenes = new FakeScenes();
  const state = new GameState();
  const ui = new FakeUi();
  const audio = new FakeAudioService();

  state.flags.investigationComplete = true;
  state.flags.containmentUnlocked = true;
  state.puzzles.doubtBudget = doubtBudgetState;

  return {
    input,
    scenes,
    state,
    ui,
    audio,
    scene: new DoubtBudgetScene({ scenes, input, state, ui, audio }),
  };
}

function press(scene, input, action) {
  input.press(action);
  scene.update();
}

function renderScene(scene) {
  const context = new FakeCanvasContext();
  scene.render(context);
  return context;
}

function focusDossier(scene, dossierId) {
  scene.focusedPanel = "dossiers";
  scene.focusedDossierIndex = DOUBT_BUDGET_DOSSIERS.findIndex(
    (dossier) => dossier.id === dossierId,
  );
}

function solvedState(attemptCount = 1) {
  return new DoubtBudgetState({
    askedQuestionIds: SETTLING_TRIPLE,
    identifiedDossierId: DOUBT_BUDGET_TRUE_DOSSIER_ID,
    phase: DOUBT_BUDGET_PHASE.SOLVED,
    attemptCount,
  });
}
