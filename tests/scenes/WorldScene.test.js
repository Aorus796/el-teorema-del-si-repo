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
  save() {}

  load() {
    return null;
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
    assert.equal(
      Object.hasOwn(setup.state.flags, "archiveUnlocked"),
      false,
    );
    assert.equal(setup.state.objectiveId, objectiveBefore);
    assert.deepEqual(setup.state.notebook, notebookBefore);
  }
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
