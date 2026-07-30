import test from "node:test";
import assert from "node:assert/strict";
import { LibraryCatalogueScene } from "../../src/scenes/LibraryCatalogueScene.js";
import {
  LIBRARY_CATALOGUE_DOCUMENTS,
  LIBRARY_CATALOGUE_INITIAL_ORDER,
  LIBRARY_CATALOGUE_RULES,
  LIBRARY_CATALOGUE_SOLUTION,
} from "../../src/puzzles/library-catalogue/LibraryCatalogueData.js";
import {
  LIBRARY_CATALOGUE_FAILURE_CODE,
  LIBRARY_CATALOGUE_PHASE,
  LibraryCatalogueState,
} from "../../src/puzzles/library-catalogue/LibraryCatalogueState.js";
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

test("entrar reconstruye únicamente el estado transitorio", () => {
  const catalogue = new LibraryCatalogueState({
    phase: LIBRARY_CATALOGUE_PHASE.FAILED,
    hintsRead: [1, 2],
    attemptCount: 2,
    failureCode:
      LIBRARY_CATALOGUE_FAILURE_CODE.CONSTRAINTS_NOT_SATISFIED,
  });
  const { scene, state, ui } = createScene(catalogue);
  const before = catalogue.toSaveData();

  scene.focusedIndex = 4;
  scene.selectedIndex = 3;
  scene.enter();

  assert.equal(scene.focusedIndex, 0);
  assert.equal(scene.selectedIndex, null);
  assert.equal(scene.visibleHintLevel, null);
  assert.equal(
    scene.statusMessage,
    "La distribución contradice al menos una regla.",
  );
  assert.equal(ui.closeAllCount, 1);
  assert.equal(state.puzzles.libraryCatalogue, catalogue);
  assert.deepEqual(catalogue.toSaveData(), before);

  state.puzzles.libraryCatalogue = solvedCatalogue();
  scene.enter();
  assert.equal(scene.visibleHintLevel, null);
  assert.equal(
    scene.statusMessage,
    "El catálogo ya está registrado.",
  );
});

test("el foco se mueve circularmente sin alterar selección ni catálogo", () => {
  const { scene, input, state } = createScene();
  scene.enter();
  const catalogue = state.puzzles.libraryCatalogue;

  press(scene, input, "moveLeft");
  assert.equal(scene.focusedIndex, 4);

  press(scene, input, "moveRight");
  assert.equal(scene.focusedIndex, 0);

  press(scene, input, "selectPuzzleOption");
  press(scene, input, "moveRight");

  assert.equal(scene.focusedIndex, 1);
  assert.equal(scene.selectedIndex, 0);
  assert.equal(state.puzzles.libraryCatalogue, catalogue);
});

test("selecciona, cancela e intercambia documentos", () => {
  const { scene, input, state } = createScene();
  scene.enter();
  const initialState = state.puzzles.libraryCatalogue;

  press(scene, input, "selectPuzzleOption");
  assert.equal(scene.selectedIndex, 0);
  assert.equal(
    scene.statusMessage,
    "Selecciona otro documento para intercambiarlo.",
  );

  press(scene, input, "selectPuzzleOption");
  assert.equal(scene.selectedIndex, null);
  assert.equal(scene.statusMessage, "Selección cancelada.");

  press(scene, input, "selectPuzzleOption");
  press(scene, input, "moveRight");
  press(scene, input, "selectPuzzleOption");

  assert.notEqual(state.puzzles.libraryCatalogue, initialState);
  assert.deepEqual(
    state.puzzles.libraryCatalogue.order,
    ["M", "C", "A", "R", "D"],
  );
  assert.equal(
    state.puzzles.libraryCatalogue.phase,
    LIBRARY_CATALOGUE_PHASE.ARRANGING,
  );
  assert.equal(scene.selectedIndex, null);
  assert.equal(scene.statusMessage, "Documentos intercambiados.");
});

test("un intercambio desde failed limpia el fallo", () => {
  const failed = new LibraryCatalogueState({
    phase: LIBRARY_CATALOGUE_PHASE.FAILED,
    attemptCount: 1,
    failureCode:
      LIBRARY_CATALOGUE_FAILURE_CODE.CONSTRAINTS_NOT_SATISFIED,
  });
  const { scene, input, state } = createScene(failed);
  scene.enter();

  press(scene, input, "selectPuzzleOption");
  press(scene, input, "moveRight");
  press(scene, input, "selectPuzzleOption");

  assert.equal(
    state.puzzles.libraryCatalogue.phase,
    LIBRARY_CATALOGUE_PHASE.ARRANGING,
  );
  assert.equal(state.puzzles.libraryCatalogue.failureCode, null);
});

test("confirmar respeta selección, fallo, solución y terminalidad", () => {
  const first = createScene();
  first.scene.enter();
  press(first.scene, first.input, "selectPuzzleOption");
  press(first.scene, first.input, "startPuzzleAttempt");

  assert.equal(
    first.scene.statusMessage,
    "Completa o cancela el intercambio antes de confirmar.",
  );
  assert.equal(
    first.state.puzzles.libraryCatalogue.attemptCount,
    0,
  );

  first.scene.selectedIndex = null;
  press(first.scene, first.input, "startPuzzleAttempt");
  assert.equal(
    first.state.puzzles.libraryCatalogue.phase,
    LIBRARY_CATALOGUE_PHASE.FAILED,
  );
  assert.equal(
    first.state.puzzles.libraryCatalogue.attemptCount,
    1,
  );
  assert.deepEqual(
    first.state.puzzles.libraryCatalogue.order,
    LIBRARY_CATALOGUE_INITIAL_ORDER,
  );

  const valid = new LibraryCatalogueState({
    order: LIBRARY_CATALOGUE_SOLUTION,
    phase: LIBRARY_CATALOGUE_PHASE.ARRANGING,
    attemptCount: 2,
  });
  const second = createScene(valid);
  second.scene.enter();
  press(second.scene, second.input, "startPuzzleAttempt");

  assert.equal(
    second.state.puzzles.libraryCatalogue.phase,
    LIBRARY_CATALOGUE_PHASE.SOLVED,
  );
  assert.equal(
    second.state.puzzles.libraryCatalogue.attemptCount,
    3,
  );
  assert.equal(second.scene.statusMessage, "Catálogo resuelto.");
  assert.equal(
    second.ui.toasts.at(-1),
    "El Archivo ha quedado accesible",
  );
  assert.equal(second.state.flags.archiveUnlocked, true);
  assert.equal(second.state.notebook.length, 1);

  const solvedState = second.state.puzzles.libraryCatalogue;
  press(second.scene, second.input, "startPuzzleAttempt");
  assert.equal(
    second.state.puzzles.libraryCatalogue,
    solvedState,
  );
  assert.equal(
    second.state.puzzles.libraryCatalogue.attemptCount,
    3,
  );
  assert.equal(
    second.scene.statusMessage,
    "El catálogo ya está registrado.",
  );
  assert.equal(second.ui.toasts.length, 1);
});

test("repara el cuaderno sin anunciar un Archivo ya desbloqueado", () => {
  const catalogue = new LibraryCatalogueState({
    order: LIBRARY_CATALOGUE_SOLUTION,
    phase: LIBRARY_CATALOGUE_PHASE.ARRANGING,
  });
  const { scene, input, state, ui } = createScene(catalogue);
  state.flags.archiveUnlocked = true;
  state.objectiveId = "start-epilogue";
  scene.enter();

  press(scene, input, "startPuzzleAttempt");

  assert.equal(state.puzzles.libraryCatalogue.phase, "solved");
  assert.equal(state.notebook.length, 1);
  assert.equal(ui.toasts.includes("El Archivo ha quedado accesible"), false);
  assert.equal(state.objectiveId, "start-epilogue");
});

test("reentrar en un catálogo resuelto no muestra el toast", () => {
  const { scene, state, ui } = createScene(solvedCatalogue());
  state.flags.archiveUnlocked = true;
  state.addNotebookEntry({
    id: "library-catalogue-solution",
    title: "El catálogo perfecto",
    text: "El orden A-D-R-C-M ha restaurado el catálogo.",
  });

  scene.enter();
  scene.enter();

  assert.equal(ui.toasts.includes("El Archivo ha quedado accesible"), false);
});

test("reiniciar restaura el orden y conserva pistas e intentos", () => {
  const failed = new LibraryCatalogueState({
    order: ["M", "C", "A", "R", "D"],
    phase: LIBRARY_CATALOGUE_PHASE.FAILED,
    hintsRead: [1, 2],
    attemptCount: 4,
    failureCode:
      LIBRARY_CATALOGUE_FAILURE_CODE.CONSTRAINTS_NOT_SATISFIED,
  });
  const first = createScene(failed);
  first.scene.enter();
  first.scene.focusedIndex = 3;
  first.scene.selectedIndex = 2;

  press(first.scene, first.input, "restartPuzzleAttempt");

  assert.deepEqual(
    first.state.puzzles.libraryCatalogue.order,
    LIBRARY_CATALOGUE_INITIAL_ORDER,
  );
  assert.equal(
    first.state.puzzles.libraryCatalogue.phase,
    LIBRARY_CATALOGUE_PHASE.READY,
  );
  assert.deepEqual(
    first.state.puzzles.libraryCatalogue.hintsRead,
    [1, 2],
  );
  assert.equal(
    first.state.puzzles.libraryCatalogue.attemptCount,
    4,
  );
  assert.equal(first.scene.focusedIndex, 0);
  assert.equal(first.scene.selectedIndex, null);

  const solved = solvedCatalogue(4);
  const second = createScene(solved);
  second.scene.enter();
  second.scene.focusedIndex = 2;
  press(second.scene, second.input, "restartPuzzleAttempt");

  assert.equal(second.state.puzzles.libraryCatalogue, solved);
  assert.equal(second.scene.focusedIndex, 2);
});

test("revela las pistas, avisa y conserva la última al reentrar", () => {
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

  assert.deepEqual(
    state.puzzles.libraryCatalogue.hintsRead,
    [1, 2, 3],
  );

  press(scene, input, "nextPuzzleHint");
  assert.equal(ui.toasts.at(-1), "No quedan más reflexiones");
  assert.equal(scene.visibleHintLevel, 3);

  scene.visibleHintLevel = null;
  scene.enter();
  assert.equal(scene.visibleHintLevel, 3);

  const solved = solvedCatalogue(1, [1]);
  state.puzzles.libraryCatalogue = solved;
  scene.enter();
  press(scene, input, "nextPuzzleHint");
  assert.equal(state.puzzles.libraryCatalogue, solved);
  assert.deepEqual(state.puzzles.libraryCatalogue.hintsRead, [1]);
  assert.equal(
    scene.statusMessage,
    "El catálogo ya está registrado.",
  );
  assert.equal(scene.visibleHintLevel, null);
});

test("las acciones posteriores a una pista priorizan su mensaje de estado", () => {
  const exchange = createScene();
  exchange.scene.enter();
  press(exchange.scene, exchange.input, "nextPuzzleHint");
  press(exchange.scene, exchange.input, "selectPuzzleOption");
  press(exchange.scene, exchange.input, "moveRight");
  press(exchange.scene, exchange.input, "selectPuzzleOption");

  assertMessageIsVisible(
    exchange.scene,
    "Documentos intercambiados.",
  );

  const failed = createScene();
  failed.scene.enter();
  press(failed.scene, failed.input, "nextPuzzleHint");
  press(failed.scene, failed.input, "startPuzzleAttempt");

  assertMessageIsVisible(
    failed.scene,
    "La distribución contradice al menos una regla.",
  );

  const solved = createScene(
    new LibraryCatalogueState({
      order: LIBRARY_CATALOGUE_SOLUTION,
      phase: LIBRARY_CATALOGUE_PHASE.ARRANGING,
      hintsRead: [1],
    }),
  );
  solved.scene.enter();
  press(solved.scene, solved.input, "startPuzzleAttempt");

  assertMessageIsVisible(solved.scene, "Catálogo resuelto.");

  const reset = createScene(
    new LibraryCatalogueState({
      phase: LIBRARY_CATALOGUE_PHASE.ARRANGING,
      hintsRead: [1],
    }),
  );
  reset.scene.enter();
  press(reset.scene, reset.input, "restartPuzzleAttempt");

  assertMessageIsVisible(reset.scene, "Orden inicial restaurado.");
});

test("reentrar restaura pistas solo durante la ordenación", () => {
  const arranging = createScene(
    new LibraryCatalogueState({
      phase: LIBRARY_CATALOGUE_PHASE.ARRANGING,
      hintsRead: [1, 2],
    }),
  );
  arranging.scene.enter();

  assert.equal(arranging.scene.visibleHintLevel, 2);
  assert.equal(
    renderScene(arranging.scene).texts.some((text) =>
      text.includes("Reflexión 2/3:"),
    ),
    true,
  );

  const failed = createScene(
    new LibraryCatalogueState({
      phase: LIBRARY_CATALOGUE_PHASE.FAILED,
      hintsRead: [1, 2],
      attemptCount: 1,
      failureCode:
        LIBRARY_CATALOGUE_FAILURE_CODE.CONSTRAINTS_NOT_SATISFIED,
    }),
  );
  failed.scene.enter();

  assert.equal(failed.scene.visibleHintLevel, null);
  assertMessageIsVisible(
    failed.scene,
    "La distribución contradice al menos una regla.",
  );

  const solved = createScene(solvedCatalogue(1, [1, 2]));
  solved.scene.enter();

  assert.equal(solved.scene.visibleHintLevel, null);
  assertMessageIsVisible(
    solved.scene,
    "El catálogo ya está registrado.",
  );
});

test("Escape vuelve a world y una nueva entrada descarta la selección", () => {
  const { scene, input, scenes, state } = createScene();
  scene.enter();
  press(scene, input, "selectPuzzleOption");
  scene.focusedIndex = 3;
  const catalogue = state.puzzles.libraryCatalogue;

  press(scene, input, "cancel");

  assert.deepEqual(scenes.changes, [{ name: "world", payload: {} }]);
  assert.equal(state.puzzles.libraryCatalogue, catalogue);

  scene.enter();
  assert.equal(scene.focusedIndex, 0);
  assert.equal(scene.selectedIndex, null);
});

test("render muestra datos, reglas, controles y estado terminal", () => {
  const first = createScene();
  first.scene.enter();
  const context = new FakeCanvasContext();

  assert.doesNotThrow(() => first.scene.render(context));
  assert.equal(context.texts.includes("EL CATÁLOGO PERFECTO"), true);

  for (const document of LIBRARY_CATALOGUE_DOCUMENTS) {
    assert.equal(context.texts.includes(document.id), true);
  }

  for (const rule of LIBRARY_CATALOGUE_RULES) {
    assert.equal(
      context.texts.some((text) => text.includes(rule.text)),
      true,
    );
  }

  assert.equal(
    context.texts.includes("Catálogo de la Criba"),
    true,
  );
  assert.equal(
    context.texts.some((text) => text.includes("E seleccionar")),
    true,
  );

  const second = createScene(solvedCatalogue());
  second.scene.enter();
  const solvedContext = new FakeCanvasContext();
  second.scene.render(solvedContext);

  assert.equal(
    solvedContext.texts.some((text) =>
      text.includes("CATÁLOGO REGISTRADO"),
    ),
    true,
  );
});

function createScene(catalogueState = new LibraryCatalogueState()) {
  const input = new FakeInput();
  const scenes = new FakeScenes();
  const state = new GameState();
  const ui = new FakeUi();
  state.puzzles.libraryCatalogue = catalogueState;

  return {
    input,
    scenes,
    state,
    ui,
    scene: new LibraryCatalogueScene({
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

function assertMessageIsVisible(scene, message) {
  assert.equal(scene.visibleHintLevel, null);
  assert.equal(scene.statusMessage, message);
  assert.equal(
    renderScene(scene).texts.some((text) => text.includes(message)),
    true,
  );
}

function solvedCatalogue(attemptCount = 1, hintsRead = []) {
  return new LibraryCatalogueState({
    order: LIBRARY_CATALOGUE_SOLUTION,
    phase: LIBRARY_CATALOGUE_PHASE.SOLVED,
    hintsRead,
    attemptCount,
  });
}
