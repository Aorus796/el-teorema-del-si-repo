import assert from "node:assert/strict";
import test from "node:test";
import { SceneManager } from "../../src/core/SceneManager.js";
import { getWorldMap } from "../../src/content/worldMaps.js";
import {
  LIBRARY_CATALOGUE_FAILURE_CODE,
  LIBRARY_CATALOGUE_PHASE,
  LibraryCatalogueState,
} from "../../src/puzzles/library-catalogue/LibraryCatalogueState.js";
import { LibraryCatalogueScene } from "../../src/scenes/LibraryCatalogueScene.js";
import { WorldScene } from "../../src/scenes/WorldScene.js";
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

  getAxis() {
    return { x: 0, y: 0 };
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
    this.dialogue = null;
    this.toasts = [];
  }

  closeAll() {
    this.dialogue = null;
  }

  hidePrompt() {}

  showPrompt() {}

  showToast(message) {
    this.toasts.push(message);
  }

  beginDialogue(dialogue) {
    this.dialogue = dialogue;
  }

  advanceDialogue() {}

  isDialogueOpen() {
    return this.dialogue !== null;
  }

  isNotebookOpen() {
    return false;
  }

  showNotebook() {}

  hideNotebook() {}
}

class FakeStorage {
  constructor({ loadResult = null, loadError = null } = {}) {
    this.loadResult = loadResult;
    this.loadError = loadError;
    this.savedData = null;
  }

  save(data) {
    this.savedData = data;
  }

  load() {
    if (this.loadError) {
      throw this.loadError;
    }

    return this.loadResult;
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

test("el acceso bloqueado no cambia progreso ni mapa", () => {
  const setup = createWorldAt("seven-bridges-walk");
  const exit = findObject(
    "seven-bridges-walk",
    "seven-bridges-to-library",
  );
  const flagsBefore = { ...setup.state.flags };
  const objectiveBefore = setup.state.objectiveId;
  const notebookBefore = structuredClone(setup.state.notebook);

  setup.scene.interactWithExit(exit);

  assert.equal(
    setup.state.world.currentMapId,
    "seven-bridges-walk",
  );
  assert.deepEqual(setup.state.flags, flagsBefore);
  assert.equal(setup.state.objectiveId, objectiveBefore);
  assert.deepEqual(setup.state.notebook, notebookBefore);
  assert.equal(
    setup.ui.dialogue.lines[0],
    "Todavía no tengo ningún motivo para ir a la Biblioteca.",
  );
});

test("el acceso permitido conserva el Paseo y aparece fuera del portal", () => {
  const setup = createWorldAt("seven-bridges-walk");
  const exit = findObject(
    "seven-bridges-walk",
    "seven-bridges-to-library",
  );
  setup.state.flags.libraryObjectiveUnlocked = true;
  setup.scene.player.x = 600;
  setup.scene.player.y = 304;
  setup.scene.player.facing = "right";

  setup.scene.interactWithExit(exit);

  assert.equal(setup.state.world.currentMapId, "library");
  assert.deepEqual(
    setup.state.getPlayerState("seven-bridges-walk"),
    {
      x: 600,
      y: 304,
      facing: "right",
    },
  );
  assert.deepEqual(setup.state.getPlayerState("library"), {
    x: 240,
    y: 256,
    facing: "up",
  });
  assertOutsideInteractionRadius(
    setup.state.getPlayerState(),
    findObject("library", "library-to-seven-bridges"),
  );
  assert.equal(setup.ui.toasts.at(-1), "Biblioteca");
});

test("la salida conserva la Biblioteca y evita el portal de regreso", () => {
  const setup = createWorldAt("library");
  const exit = findObject(
    "library",
    "library-to-seven-bridges",
  );
  setup.scene.player.x = 248;
  setup.scene.player.y = 256;
  setup.scene.player.facing = "down";

  setup.scene.interactWithExit(exit);

  assert.equal(
    setup.state.world.currentMapId,
    "seven-bridges-walk",
  );
  assert.deepEqual(setup.state.getPlayerState("library"), {
    x: 248,
    y: 256,
    facing: "down",
  });
  assert.deepEqual(setup.state.getPlayerState(), {
    x: 624,
    y: 304,
    facing: "left",
  });
  assertOutsideInteractionRadius(
    setup.state.getPlayerState(),
    findObject(
      "seven-bridges-walk",
      "seven-bridges-to-library",
    ),
  );
});

test("Silogio abre el catálogo sin alterar progreso global o local", () => {
  for (const catalogue of catalogueStates()) {
    const setup = createWorldAt("library", catalogue);
    const silogio = findObject("library", "library-silogio");
    const catalogueBefore = catalogue.toSaveData();
    const flagsBefore = { ...setup.state.flags };
    const objectiveBefore = setup.state.objectiveId;
    const notebookBefore = structuredClone(setup.state.notebook);

    setup.scene.interact(silogio);

    assert.deepEqual(setup.scenes.changes, [
      { name: "library-catalogue", payload: {} },
    ]);
    assert.equal(setup.state.world.currentMapId, "library");
    assert.deepEqual(
      setup.state.puzzles.libraryCatalogue.toSaveData(),
      catalogueBefore,
    );
    assert.deepEqual(setup.state.flags, flagsBefore);
    assert.equal(setup.state.flags.archiveUnlocked, false);
    assert.equal(setup.state.objectiveId, objectiveBefore);
    assert.deepEqual(setup.state.notebook, notebookBefore);
  }
});

test("el Archivo permanece cerrado hasta resolver el catálogo", () => {
  const setup = createWorldAt("library");
  const exit = findObject("library", "library-to-archive");
  const flagsBefore = { ...setup.state.flags };

  setup.scene.interactWithExit(exit);

  assert.equal(setup.state.world.currentMapId, "library");
  assert.deepEqual(setup.state.flags, flagsBefore);
  assert.equal(
    setup.ui.dialogue.lines[0],
    "El acceso al Archivo sigue cerrado.",
  );
});

test("la Biblioteca y el Archivo conservan posiciones y evitan bucles", () => {
  const setup = createWorldAt("library");
  const archiveExit = findObject("library", "library-to-archive");
  setup.state.flags.archiveUnlocked = true;
  setup.scene.player.x = 416;
  setup.scene.player.y = 176;
  setup.scene.player.facing = "right";

  setup.scene.interactWithExit(archiveExit);

  assert.equal(setup.state.world.currentMapId, "archive");
  assert.deepEqual(setup.state.getPlayerState("library"), {
    x: 416,
    y: 176,
    facing: "right",
  });
  assertOutsideInteractionRadius(
    setup.state.getPlayerState(),
    findObject("archive", "archive-to-library"),
  );

  const libraryExit = findObject("archive", "archive-to-library");
  setup.scene.player.x = 192;
  setup.scene.player.y = 208;
  setup.scene.player.facing = "down";
  setup.scene.interactWithExit(libraryExit);

  assert.equal(setup.state.world.currentMapId, "library");
  assert.deepEqual(setup.state.getPlayerState("archive"), {
    x: 192,
    y: 208,
    facing: "down",
  });
  assertOutsideInteractionRadius(
    setup.state.getPlayerState(),
    findObject("library", "library-to-archive"),
  );
});

test("interactuar con la mesa de criterios cambia a archive-criteria sin modificar estado", () => {
  const setup = createWorldAt("archive");
  const table = findObject("archive", "archive-criteria-table");
  const flagsBefore = { ...setup.state.flags };
  const objectiveBefore = setup.state.objectiveId;
  const notebookBefore = structuredClone(setup.state.notebook);
  const catalogueBefore =
    setup.state.puzzles.libraryCatalogue.toSaveData();
  const archiveCriteriaBefore =
    setup.state.puzzles.archiveCriteria.toSaveData();
  setup.scene.player.x = 300;
  setup.scene.player.y = 250;
  setup.scene.player.facing = "up";

  setup.scene.interact(table);

  assert.deepEqual(setup.scenes.changes, [
    { name: "archive-criteria", payload: {} },
  ]);
  assert.deepEqual(setup.state.getPlayerState("archive"), {
    x: 300,
    y: 250,
    facing: "up",
  });
  assert.equal(setup.ui.dialogue, null);
  assert.deepEqual(setup.state.flags, flagsBefore);
  assert.equal(setup.state.objectiveId, objectiveBefore);
  assert.deepEqual(setup.state.notebook, notebookBefore);
  assert.deepEqual(
    setup.state.puzzles.libraryCatalogue.toSaveData(),
    catalogueBefore,
  );
  assert.deepEqual(
    setup.state.puzzles.archiveCriteria.toSaveData(),
    archiveCriteriaBefore,
  );
});

test("el mecanismo del regalo sin epílogo desbloqueado no cambia estado ni mapa", () => {
  const setup = createWorldAt("axiom-plaza");
  const mechanism = findObject(
    "axiom-plaza",
    "epilogue-gift-mechanism",
  );
  const stateBefore = structuredClone(setup.state.toSaveData());
  delete stateBefore.savedAt;

  setup.scene.interact(mechanism);

  const stateAfter = structuredClone(setup.state.toSaveData());
  delete stateAfter.savedAt;

  assert.deepEqual(setup.scenes.changes, []);
  assert.ok(setup.ui.dialogue !== null);
  assert.deepEqual(stateAfter, stateBefore);
});

test("el mecanismo del regalo con epílogo desbloqueado y sin resolver cambia a epilogue-gift-code sin diálogo", () => {
  const setup = createWorldAt("axiom-plaza");
  const mechanism = findObject(
    "axiom-plaza",
    "epilogue-gift-mechanism",
  );
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.scene.player.x = 300;
  setup.scene.player.y = 250;
  setup.scene.player.facing = "up";
  const stateBefore = structuredClone(setup.state.toSaveData());
  delete stateBefore.savedAt;

  setup.scene.interact(mechanism);

  const stateAfter = structuredClone(setup.state.toSaveData());
  delete stateAfter.savedAt;

  assert.deepEqual(setup.scenes.changes, [
    { name: "epilogue-gift-code", payload: {} },
  ]);
  assert.equal(setup.ui.dialogue, null);

  const expected = structuredClone(stateBefore);
  expected.player = { x: 300, y: 250, facing: "up" };
  expected.world.playerByMap["axiom-plaza"] = {
    x: 300,
    y: 250,
    facing: "up",
  };

  assert.deepEqual(stateAfter, expected);
});

test("el mecanismo del regalo con giftCodeSolved muestra un diálogo distinto sin cambiar de escena", () => {
  const setup = createWorldAt("axiom-plaza");
  const mechanism = findObject(
    "axiom-plaza",
    "epilogue-gift-mechanism",
  );
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = false;
  const stateBefore = structuredClone(setup.state.toSaveData());
  delete stateBefore.savedAt;

  setup.scene.interact(mechanism);

  const stateAfter = structuredClone(setup.state.toSaveData());
  delete stateAfter.savedAt;

  assert.deepEqual(setup.scenes.changes, []);
  assert.ok(setup.ui.dialogue !== null);
  assert.deepEqual(stateAfter, stateBefore);
});

test("una WorldScene montada sobre un GameState restaurado con giftCodeSolved no cambia de escena al entrar ni al interactuar con el mecanismo del regalo ya resuelto", () => {
  const saved = new GameState().toSaveData();
  saved.flags.investigationComplete = true;
  saved.flags.epilogueUnlocked = true;
  saved.flags.epilogueStarted = true;
  saved.flags.giftCodeSolved = true;
  saved.flags.epilogueCompleted = false;
  saved.objectiveId = "epilogue-meet-bride";
  saved.scene = "world";
  saved.world.currentMapId = "axiom-plaza";
  saved.world.playerByMap["axiom-plaza"] = {
    x: 240,
    y: 192,
    facing: "up",
  };

  const state = new GameState();
  state.restore(saved);

  const input = new FakeInput();
  const scenes = new FakeScenes();
  const ui = new FakeUi();
  const scene = new WorldScene({
    scenes,
    input,
    storage: new FakeStorage(),
    state,
    ui,
  });

  scene.enter();

  assert.deepEqual(scenes.changes, []);

  const mechanism = findObject(
    "axiom-plaza",
    "epilogue-gift-mechanism",
  );

  scene.interact(mechanism);

  assert.deepEqual(scenes.changes, []);
  assert.ok(ui.dialogue !== null);
  assert.ok(
    ui.dialogue.lines.some((line) =>
      line.includes("Los anillos ya no giran"),
    ),
  );
});

test("OBJECTIVE_LABELS reconoce start-epilogue en el HUD renderizado", () => {
  const setup = createWorldAt("archive");
  setup.state.objectiveId = "start-epilogue";
  const context = new FakeCanvasContext();

  assert.doesNotThrow(() => setup.scene.render(context));
  assert.equal(
    context.texts.some((text) =>
      text.includes("Regresa al lugar donde comenzó la demostración."),
    ),
    true,
  );
});

test("OBJECTIVE_LABELS reconoce epilogue-meet-bride en el HUD renderizado", () => {
  const setup = createWorldAt("archive");
  setup.state.objectiveId = "epilogue-meet-bride";
  const context = new FakeCanvasContext();

  assert.doesNotThrow(() => setup.scene.render(context));
  assert.equal(
    context.texts.some((text) =>
      text.includes("Acércate a ella en la Plaza."),
    ),
    true,
  );
});

test("volver del catálogo conserva mapa, posición y datos persistentes", () => {
  const input = new FakeInput();
  const scenes = new SceneManager();
  const state = new GameState();
  const ui = new FakeUi();
  const storage = new FakeStorage();
  state.changeMap("library", {
    x: 216,
    y: 176,
    facing: "up",
  });
  state.puzzles.libraryCatalogue = new LibraryCatalogueState({
    order: ["M", "C", "A", "R", "D"],
    phase: LIBRARY_CATALOGUE_PHASE.ARRANGING,
    hintsRead: [1, 2],
    attemptCount: 3,
  });
  const catalogueBefore =
    state.puzzles.libraryCatalogue.toSaveData();
  const world = new WorldScene({
    scenes,
    input,
    storage,
    state,
    ui,
  });
  const catalogueScene = new LibraryCatalogueScene({
    scenes,
    input,
    state,
    ui,
  });
  scenes.register("world", world);
  scenes.register("library-catalogue", catalogueScene);
  scenes.change("world");

  world.interact(findObject("library", "library-silogio"));
  assert.equal(scenes.currentName, "library-catalogue");

  input.press("cancel");
  scenes.update(0);

  assert.equal(scenes.currentName, "world");
  assert.equal(state.world.currentMapId, "library");
  assert.deepEqual(state.getPlayerState("library"), {
    x: 216,
    y: 176,
    facing: "up",
  });
  assert.deepEqual(
    state.puzzles.libraryCatalogue.toSaveData(),
    catalogueBefore,
  );
  assert.equal(catalogueScene.focusedIndex, 0);
  assert.equal(catalogueScene.selectedIndex, null);
});

test("load() sin guardado existente conserva el aviso actual y devuelve false", () => {
  const storage = new FakeStorage();
  const { scene, ui } = createScene(storage);

  const result = scene.load();

  assert.equal(result, false);
  assert.deepEqual(ui.toasts, ["No existe una partida guardada"]);
});

test("load() con datos válidos restaura el estado y devuelve true", () => {
  const seed = new GameState();
  seed.changeMap("library", {
    x: 10,
    y: 20,
    facing: "left",
  });
  const saved = seed.toSaveData();
  const storage = new FakeStorage({ loadResult: saved });
  const { scene, ui, state } = createScene(storage);

  const result = scene.load();

  assert.equal(result, true);
  assert.equal(state.world.currentMapId, "library");
  assert.deepEqual(state.getPlayerState("library"), {
    x: 10,
    y: 20,
    facing: "left",
  });
  assert.deepEqual(ui.toasts, []);
});

test("load() con storage.load() que lanza no propaga, registra el error y avisa sin confundirlo con otros mensajes", () => {
  withMockedConsoleError((consoleErrorCalls) => {
    const thrownError = new Error("JSON inválido");
    const storage = new FakeStorage({ loadError: thrownError });
    const { scene, ui } = createScene(storage);

    let result;
    assert.doesNotThrow(() => {
      result = scene.load();
    });

    assert.equal(result, false);
    assert.equal(consoleErrorCalls.length, 1);
    assert.equal(consoleErrorCalls[0][0], thrownError);
    assert.equal(ui.toasts.length, 1);
    assert.notEqual(ui.toasts[0], "No existe una partida guardada");
    assert.notEqual(ui.toasts[0], "Partida cargada");
    assert.ok(ui.toasts[0].length > 0);
  });
});

test("load() con formatVersion no soportado no propaga y avisa del fallo", () => {
  withMockedConsoleError((consoleErrorCalls) => {
    const saved = new GameState().toSaveData();
    saved.formatVersion = 999;
    const storage = new FakeStorage({ loadResult: saved });
    const { scene, ui } = createScene(storage);

    let result;
    assert.doesNotThrow(() => {
      result = scene.load();
    });

    assert.equal(result, false);
    assert.equal(consoleErrorCalls.length, 1);
    assert.equal(ui.toasts.length, 1);
    assert.notEqual(ui.toasts[0], "No existe una partida guardada");
    assert.notEqual(ui.toasts[0], "Partida cargada");
  });
});

test("load() con libraryCatalogue o archiveCriteria corruptos (formatVersion válido) no propaga y avisa del fallo", () => {
  const corruptionCases = [
    (saved) => {
      delete saved.puzzles.libraryCatalogue.hintsRead;
    },
    (saved) => {
      delete saved.puzzles.archiveCriteria.hintsRead;
    },
  ];

  for (const corrupt of corruptionCases) {
    withMockedConsoleError((consoleErrorCalls) => {
      const saved = new GameState().toSaveData();
      corrupt(saved);
      const storage = new FakeStorage({ loadResult: saved });
      const { scene, ui } = createScene(storage);

      let result;
      assert.doesNotThrow(() => {
        result = scene.load();
      });

      assert.equal(result, false);
      assert.equal(consoleErrorCalls.length, 1);
      assert.equal(ui.toasts.length, 1);
      assert.notEqual(ui.toasts[0], "No existe una partida guardada");
      assert.notEqual(ui.toasts[0], "Partida cargada");
    });
  }
});

test("update() con tecla load no añade el toast de éxito cuando load() falla", () => {
  withMockedConsoleError((consoleErrorCalls) => {
    const thrownError = new Error("Fallo simulado");
    const storage = new FakeStorage({ loadError: thrownError });
    const { scene, ui, input } = createScene(storage);
    scene.enter();

    input.press("load");

    assert.doesNotThrow(() => scene.update(0));
    assert.equal(consoleErrorCalls.length, 1);
    assert.equal(ui.toasts.includes("Partida cargada"), false);
  });
});

test("update() con tecla load y load() exitoso conserva el comportamiento actual", () => {
  const saved = new GameState().toSaveData();
  const storage = new FakeStorage({ loadResult: saved });
  const { scene, ui, input } = createScene(storage);
  scene.enter();

  input.press("load");
  scene.update(0);

  assert.equal(ui.toasts.at(-1), "Partida cargada");
});

test("enter({ restoreFromState: true }) con load() fallido no lanza y deja el mundo jugable", () => {
  withMockedConsoleError((consoleErrorCalls) => {
    const thrownError = new Error("Fallo simulado");
    const storage = new FakeStorage({ loadError: thrownError });
    const { scene, ui } = createScene(storage);

    assert.doesNotThrow(() =>
      scene.enter({ restoreFromState: true }),
    );

    assert.equal(consoleErrorCalls.length, 1);
    assert.ok(scene.map);
    assert.ok(scene.player);
    assert.ok(scene.camera);
    assert.equal(ui.toasts.length, 1);
    assert.notEqual(ui.toasts[0], "Partida cargada");
  });
});

function createScene(storage) {
  const input = new FakeInput();
  const scenes = new FakeScenes();
  const state = new GameState();
  const ui = new FakeUi();
  const scene = new WorldScene({
    scenes,
    input,
    storage,
    state,
    ui,
  });

  return { input, scenes, state, ui, scene };
}

function withMockedConsoleError(run) {
  const originalConsoleError = console.error;
  const consoleErrorCalls = [];
  console.error = (...args) => {
    consoleErrorCalls.push(args);
  };

  try {
    run(consoleErrorCalls);
  } finally {
    console.error = originalConsoleError;
  }
}

function createWorldAt(
  mapId,
  catalogue = new LibraryCatalogueState(),
) {
  const input = new FakeInput();
  const scenes = new FakeScenes();
  const state = new GameState();
  const ui = new FakeUi();
  state.changeMap(mapId);
  state.puzzles.libraryCatalogue = catalogue;
  const scene = new WorldScene({
    scenes,
    input,
    storage: new FakeStorage(),
    state,
    ui,
  });
  scene.enter();

  return { input, scenes, state, ui, scene };
}

function findObject(mapId, objectId) {
  const object = getWorldMap(mapId).objects.find(
    (entry) => entry.id === objectId,
  );

  assert.ok(object, `No existe ${mapId}:${objectId}`);
  return object;
}

function assertOutsideInteractionRadius(playerState, object) {
  const objectCenter = {
    x: object.x + object.width / 2,
    y: object.y + object.height / 2,
  };
  const distance = Math.hypot(
    playerState.x - objectCenter.x,
    playerState.y - objectCenter.y,
  );

  assert.ok(distance > object.interactionRadius);
}

function catalogueStates() {
  return [
    new LibraryCatalogueState(),
    new LibraryCatalogueState({
      order: ["M", "C", "A", "R", "D"],
      phase: LIBRARY_CATALOGUE_PHASE.ARRANGING,
      hintsRead: [1],
      attemptCount: 1,
    }),
    new LibraryCatalogueState({
      phase: LIBRARY_CATALOGUE_PHASE.FAILED,
      hintsRead: [1, 2],
      attemptCount: 2,
      failureCode:
        LIBRARY_CATALOGUE_FAILURE_CODE.CONSTRAINTS_NOT_SATISFIED,
    }),
    new LibraryCatalogueState({
      order: ["A", "D", "R", "C", "M"],
      phase: LIBRARY_CATALOGUE_PHASE.SOLVED,
      hintsRead: [1, 2, 3],
      attemptCount: 3,
    }),
  ];
}
