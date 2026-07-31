import test from "node:test";
import assert from "node:assert/strict";
import {
  ArchiveCriteriaScene,
  wrapText,
} from "../../src/scenes/ArchiveCriteriaScene.js";
import {
  ARCHIVE_CRITERIA_CLAIMS,
  ARCHIVE_CRITERIA_EVIDENCE,
  ARCHIVE_CRITERIA_INITIAL_VERDICTS,
  ARCHIVE_CRITERIA_SOLUTION,
  ARCHIVE_CRITERIA_VERDICT,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaData.js";
import {
  ARCHIVE_CRITERIA_HINTS,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaHints.js";
import {
  ARCHIVE_CRITERIA_FAILURE_CODE,
  ARCHIVE_CRITERIA_PHASE,
  ArchiveCriteriaState,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaState.js";
import {
  ARCHIVE_FINAL_EVIDENCE_ENTRY,
  START_EPILOGUE_OBJECTIVE_ID,
} from "../../src/progression/ArchiveCriteriaProgression.js";
import { GameState } from "../../src/state/GameState.js";

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

test("enter en ready reconstruye el estado transitorio sin modificar el persistente", () => {
  const { scene, state } = createScene();
  const before = state.puzzles.archiveCriteria.toSaveData();

  scene.focusedClaimIndex = 4;
  scene.visibleHintLevel = 2;
  scene.enter();

  assert.equal(scene.focusedClaimIndex, 0);
  assert.equal(scene.visibleHintLevel, null);
  assert.equal(
    scene.statusMessage,
    "Clasifica cada afirmación con arriba y abajo.",
  );
  assert.deepEqual(state.puzzles.archiveCriteria.toSaveData(), before);
});

test("la navegación izquierda/derecha es circular y no altera el estado", () => {
  const { scene, input, state } = createScene();
  scene.enter();
  const before = state.puzzles.archiveCriteria;

  press(scene, input, "moveLeft");
  assert.equal(scene.focusedClaimIndex, 5);

  press(scene, input, "moveRight");
  assert.equal(scene.focusedClaimIndex, 0);

  press(scene, input, "moveRight");
  assert.equal(scene.focusedClaimIndex, 1);

  assert.equal(state.puzzles.archiveCriteria, before);
});

test("moveDown recorre el ciclo directo de veredictos", () => {
  const { scene, input, state } = createScene();
  scene.enter();
  const claimId = ARCHIVE_CRITERIA_CLAIMS[0].id;
  const expected = [
    ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
    ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
    ARCHIVE_CRITERIA_VERDICT.UNDECIDABLE,
    null,
  ];

  for (const verdict of expected) {
    press(scene, input, "moveDown");
    assert.equal(
      state.puzzles.archiveCriteria.verdicts[claimId],
      verdict,
    );
  }
});

test("moveUp recorre el ciclo inverso de veredictos", () => {
  const { scene, input, state } = createScene();
  scene.enter();
  const claimId = ARCHIVE_CRITERIA_CLAIMS[0].id;
  const expected = [
    ARCHIVE_CRITERIA_VERDICT.UNDECIDABLE,
    ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
    ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
    null,
  ];

  for (const verdict of expected) {
    press(scene, input, "moveUp");
    assert.equal(
      state.puzzles.archiveCriteria.verdicts[claimId],
      verdict,
    );
  }
});

test("el foco se conserva al cambiar un veredicto", () => {
  const { scene, input } = createScene();
  scene.enter();
  press(scene, input, "moveRight");
  press(scene, input, "moveRight");
  assert.equal(scene.focusedClaimIndex, 2);

  press(scene, input, "moveDown");
  assert.equal(scene.focusedClaimIndex, 2);
});

test("la confirmación incompleta usa el mensaje exacto", () => {
  const fixture = new ArchiveCriteriaState({
    verdicts: { ...ARCHIVE_CRITERIA_SOLUTION, "universal-future": null },
    phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
  });
  const { scene, input, state } = createScene(fixture);
  scene.enter();

  press(scene, input, "startPuzzleAttempt");

  assert.equal(
    scene.statusMessage,
    "El expediente todavía contiene afirmaciones sin revisar.",
  );
  assert.equal(
    state.puzzles.archiveCriteria.phase,
    ARCHIVE_CRITERIA_PHASE.FAILED,
  );
  assert.equal(
    state.puzzles.archiveCriteria.failureCode,
    ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION,
  );
});

test("la confirmación incorrecta usa el mensaje exacto", () => {
  const wrong = {
    ...ARCHIVE_CRITERIA_SOLUTION,
    "universal-future": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
  };
  const fixture = new ArchiveCriteriaState({
    verdicts: wrong,
    phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
  });
  const { scene, input, state } = createScene(fixture);
  scene.enter();

  press(scene, input, "startPuzzleAttempt");

  assert.equal(
    scene.statusMessage,
    "Al menos un veredicto exige más —o menos— evidencia de la que contienen los registros.",
  );
  assert.equal(
    state.puzzles.archiveCriteria.phase,
    ARCHIVE_CRITERIA_PHASE.FAILED,
  );
  assert.equal(
    state.puzzles.archiveCriteria.failureCode,
    ARCHIVE_CRITERIA_FAILURE_CODE.INCORRECT_VERDICTS,
  );
});

test("la UI no filtra incorrectClaimIds ni identifica afirmaciones concretas", () => {
  const wrong = {
    ...ARCHIVE_CRITERIA_SOLUTION,
    "universal-future": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
    "voluntary-entry": ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
  };
  const fixture = new ArchiveCriteriaState({
    verdicts: wrong,
    phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
  });
  const { scene, input } = createScene(fixture);
  scene.enter();

  press(scene, input, "startPuzzleAttempt");

  const rendered = renderScene(scene).texts.join(" ");

  assert.equal(rendered.includes("universal-future"), false);
  assert.equal(rendered.includes("voluntary-entry"), false);
  assert.equal(scene.statusMessage.includes("universal-future"), false);
  assert.equal(scene.statusMessage.includes("voluntary-entry"), false);
});

test("resolver el criterio aplica la progresión y muestra el toast una sola vez", () => {
  const fixture = new ArchiveCriteriaState({
    verdicts: { ...ARCHIVE_CRITERIA_SOLUTION },
    phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
  });
  const { scene, input, state, ui } = createScene(fixture);
  scene.enter();

  press(scene, input, "startPuzzleAttempt");

  assert.equal(
    state.puzzles.archiveCriteria.phase,
    ARCHIVE_CRITERIA_PHASE.SOLVED,
  );
  assert.equal(state.flags.investigationComplete, true);
  assert.equal(state.flags.epilogueUnlocked, true);
  assert.equal(state.objectiveId, START_EPILOGUE_OBJECTIVE_ID);
  assert.equal(state.notebook.length, 1);
  assert.equal(state.notebook[0].id, ARCHIVE_FINAL_EVIDENCE_ENTRY.id);
  assert.equal(scene.statusMessage, "Criterio aceptado.");
  assert.deepEqual(ui.toasts, ["La investigación ha terminado"]);

  press(scene, input, "startPuzzleAttempt");
  assert.deepEqual(ui.toasts, ["La investigación ha terminado"]);
});

test("si epilogueUnlocked ya era true, repara el cuaderno sin tocar el objetivo ni mostrar toast", () => {
  const fixture = new ArchiveCriteriaState({
    verdicts: { ...ARCHIVE_CRITERIA_SOLUTION },
    phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
  });
  const { scene, input, state, ui } = createScene(fixture);
  state.flags.epilogueUnlocked = true;
  state.objectiveId = "some-later-objective";
  scene.enter();

  press(scene, input, "startPuzzleAttempt");

  assert.equal(state.notebook.length, 1);
  assert.equal(state.objectiveId, "some-later-objective");
  assert.deepEqual(ui.toasts, []);
});

test("confirmar un criterio ya resuelto no repite consecuencias ni toast", () => {
  const solved = solvedState();
  const { scene, input, state, ui } = createScene(solved);
  scene.enter();

  press(scene, input, "startPuzzleAttempt");

  assert.equal(state.puzzles.archiveCriteria, solved);
  assert.equal(scene.statusMessage, "El criterio ya está registrado.");
  assert.deepEqual(ui.toasts, []);
});

test("reentrar en un criterio resuelto no muestra el toast", () => {
  const { scene, state, ui } = createScene(solvedState());
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.addNotebookEntry(ARCHIVE_FINAL_EVIDENCE_ENTRY);

  scene.enter();
  scene.enter();

  assert.deepEqual(ui.toasts, []);
});

test("reinicio restaura veredictos y fase desde ready, classifying y failed", () => {
  const cases = [
    new ArchiveCriteriaState(),
    new ArchiveCriteriaState({
      verdicts: {
        ...ARCHIVE_CRITERIA_INITIAL_VERDICTS,
        "voluntary-entry": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
      },
      phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
      hintsRead: [1],
      attemptCount: 1,
    }),
    new ArchiveCriteriaState({
      phase: ARCHIVE_CRITERIA_PHASE.FAILED,
      failureCode: ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION,
      hintsRead: [1, 2],
      attemptCount: 2,
    }),
  ];

  for (const fixture of cases) {
    const { scene, input, state } = createScene(fixture);
    scene.enter();
    scene.focusedClaimIndex = 3;

    press(scene, input, "restartPuzzleAttempt");

    assert.deepEqual(
      state.puzzles.archiveCriteria.verdicts,
      ARCHIVE_CRITERIA_INITIAL_VERDICTS,
    );
    assert.equal(
      state.puzzles.archiveCriteria.phase,
      ARCHIVE_CRITERIA_PHASE.READY,
    );
    assert.equal(state.puzzles.archiveCriteria.failureCode, null);
    assert.deepEqual(
      state.puzzles.archiveCriteria.hintsRead,
      fixture.hintsRead,
    );
    assert.equal(
      state.puzzles.archiveCriteria.attemptCount,
      fixture.attemptCount,
    );
    assert.equal(scene.focusedClaimIndex, 0);
  }
});

test("reinicio tras solved no modifica el estado", () => {
  const solved = solvedState();
  const { scene, input, state } = createScene(solved);
  scene.enter();
  scene.focusedClaimIndex = 2;

  press(scene, input, "restartPuzzleAttempt");

  assert.equal(state.puzzles.archiveCriteria, solved);
  assert.equal(scene.focusedClaimIndex, 2);
  assert.equal(scene.statusMessage, "El criterio ya está registrado.");
});

test("revela las tres pistas en orden", () => {
  const { scene, input, state, ui } = createScene();
  scene.enter();

  for (const level of [1, 2, 3]) {
    press(scene, input, "nextPuzzleHint");
    assert.equal(scene.visibleHintLevel, level);
    assert.equal(ui.toasts.at(-1), `Reflexión ${level}/3`);

    const context = renderScene(scene);
    assert.equal(
      context.texts.some((text) =>
        text.includes(`Reflexión ${level}/3:`),
      ),
      true,
    );
  }

  assert.deepEqual(state.puzzles.archiveCriteria.hintsRead, [1, 2, 3]);
});

test("una cuarta pista conserva la tercera y no cambia hintsRead", () => {
  const { scene, input, state, ui } = createScene();
  scene.enter();

  press(scene, input, "nextPuzzleHint");
  press(scene, input, "nextPuzzleHint");
  press(scene, input, "nextPuzzleHint");
  press(scene, input, "nextPuzzleHint");

  assert.equal(ui.toasts.at(-1), "No quedan más reflexiones");
  assert.equal(scene.visibleHintLevel, 3);
  assert.deepEqual(state.puzzles.archiveCriteria.hintsRead, [1, 2, 3]);
});

test("Escape vuelve a world conservando el estado persistente", () => {
  const fixture = new ArchiveCriteriaState({
    verdicts: {
      ...ARCHIVE_CRITERIA_INITIAL_VERDICTS,
      "voluntary-entry": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
    },
    phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
  });
  const { scene, input, scenes, state } = createScene(fixture);
  scene.enter();
  scene.focusedClaimIndex = 3;
  const before = state.puzzles.archiveCriteria;

  press(scene, input, "cancel");

  assert.deepEqual(scenes.changes, [{ name: "world", payload: {} }]);
  assert.equal(state.puzzles.archiveCriteria, before);
});

test("render no lanza en ready, failed y solved", () => {
  const fixtures = [
    new ArchiveCriteriaState(),
    new ArchiveCriteriaState({
      phase: ARCHIVE_CRITERIA_PHASE.FAILED,
      failureCode: ARCHIVE_CRITERIA_FAILURE_CODE.INCORRECT_VERDICTS,
      verdicts: {
        ...ARCHIVE_CRITERIA_SOLUTION,
        "voluntary-entry": ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
      },
      attemptCount: 1,
    }),
    solvedState(),
  ];

  for (const fixture of fixtures) {
    const { scene } = createScene(fixture);
    scene.enter();
    assert.doesNotThrow(() => scene.render(new FakeCanvasContext()));
  }
});

test("la cabecera traduce las cuatro fases y no expone el valor interno", () => {
  const cases = [
    {
      fixture: new ArchiveCriteriaState(),
      label: "Pendiente",
      internal: ARCHIVE_CRITERIA_PHASE.READY,
    },
    {
      fixture: new ArchiveCriteriaState({
        verdicts: {
          ...ARCHIVE_CRITERIA_INITIAL_VERDICTS,
          "voluntary-entry": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
        },
        phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
      }),
      label: "En revisión",
      internal: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
    },
    {
      fixture: new ArchiveCriteriaState({
        phase: ARCHIVE_CRITERIA_PHASE.FAILED,
        failureCode:
          ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION,
        attemptCount: 1,
      }),
      label: "Revisión fallida",
      internal: ARCHIVE_CRITERIA_PHASE.FAILED,
    },
    {
      fixture: solvedState(),
      label: "Registrado",
      internal: ARCHIVE_CRITERIA_PHASE.SOLVED,
    },
  ];

  for (const { fixture, label, internal } of cases) {
    const { scene } = createScene(fixture);
    scene.enter();
    const context = renderScene(scene);

    assert.equal(
      context.texts.some((text) => text.includes(`Estado: ${label}`)),
      true,
      `debería mostrar la etiqueta "${label}"`,
    );
    assert.equal(
      context.texts.some((text) => text.includes(`Fase: ${internal}`)),
      false,
      `no debería mostrar "Fase: ${internal}"`,
    );
    assert.equal(
      context.texts.some((text) => text === internal),
      false,
      `no debería exponer el valor interno "${internal}" como texto exacto`,
    );
  }
});

test("los textos reales más largos respetan el límite de líneas por bloque", () => {
  const longestClaim = ARCHIVE_CRITERIA_CLAIMS.reduce((a, b) =>
    a.text.length >= b.text.length ? a : b,
  );
  assert.ok(wrapText(longestClaim.text, 78).length <= 3);

  for (const evidence of ARCHIVE_CRITERIA_EVIDENCE) {
    assert.ok(wrapText(evidence.text, 82).length <= 3);
  }

  const candidateMessages = [
    "El expediente todavía contiene afirmaciones sin revisar.",
    "Al menos un veredicto exige más —o menos— evidencia de la que contienen los registros.",
    ...ARCHIVE_CRITERIA_HINTS.map(
      (hint) => `Reflexión ${hint.level}/3: ${hint.text}`,
    ),
  ];
  const longestMessage = candidateMessages.reduce((a, b) =>
    a.length >= b.length ? a : b,
  );
  assert.ok(wrapText(longestMessage, 92).length <= 3);
});

test("tras solved se mantiene visible la clasificación final y permite navegar", () => {
  const solved = solvedState();
  const { scene, input, state } = createScene(solved);
  scene.enter();

  const context = renderScene(scene);
  assert.equal(
    context.texts.includes("CRITERIO REGISTRADO | Esc salir"),
    true,
  );

  press(scene, input, "moveRight");
  assert.equal(scene.focusedClaimIndex, 1);
  assert.equal(state.puzzles.archiveCriteria, solved);
  assert.doesNotThrow(() => scene.render(new FakeCanvasContext()));
});

test("tras solved, arriba/abajo/Q/R/Enter no alteran el estado", () => {
  const solved = solvedState();
  const { scene, input, state, ui } = createScene(solved);
  scene.enter();

  press(scene, input, "moveDown");
  press(scene, input, "moveUp");
  press(scene, input, "nextPuzzleHint");
  press(scene, input, "restartPuzzleAttempt");
  press(scene, input, "startPuzzleAttempt");

  assert.equal(state.puzzles.archiveCriteria, solved);
  assert.deepEqual(ui.toasts, []);
});

test("render muestra título, progreso, afirmación, evidencias y veredictos", () => {
  const { scene } = createScene();
  scene.enter();
  const context = renderScene(scene);

  assert.equal(context.texts.includes("LA PREGUNTA CORRECTA"), true);
  assert.equal(context.texts.includes("Afirmación 1/6"), true);
  assert.equal(
    context.texts.some((text) =>
      text.includes(ARCHIVE_CRITERIA_CLAIMS[0].text.slice(0, 12)),
    ),
    true,
  );
  assert.equal(
    context.texts.some((text) => text.includes("E1")),
    true,
  );
  assert.equal(
    context.texts.some((text) => text === "Sin clasificar"),
    true,
  );
  assert.equal(
    context.texts.some((text) => text === "Confirmada"),
    true,
  );
  assert.equal(
    context.texts.some((text) => text === "Contradicha"),
    true,
  );
  assert.equal(
    context.texts.some((text) => text === "No decidible"),
    true,
  );
});

function createScene(archiveCriteriaState = new ArchiveCriteriaState()) {
  const input = new FakeInput();
  const scenes = new FakeScenes();
  const state = new GameState();
  const ui = new FakeUi();
  state.puzzles.archiveCriteria = archiveCriteriaState;

  return {
    input,
    scenes,
    state,
    ui,
    scene: new ArchiveCriteriaScene({
      scenes,
      input,
      state,
      ui,
    }),
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

function solvedState(attemptCount = 1) {
  return new ArchiveCriteriaState({
    verdicts: { ...ARCHIVE_CRITERIA_SOLUTION },
    phase: ARCHIVE_CRITERIA_PHASE.SOLVED,
    attemptCount,
  });
}
