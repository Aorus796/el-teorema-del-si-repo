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
import { BRIDE_PALETTE } from "../../src/content/characterPalettes.js";

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
    // Modela el comportamiento real de UiController: al llegar al final
    // del diálogo se limpia this.dialogue antes de invocar onComplete().
    const onDialogueComplete = dialogue.onComplete;
    this.dialogue = {
      ...dialogue,
      onComplete: () => {
        this.dialogue = null;
        onDialogueComplete?.();
      },
    };
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

class FakeAudioService {
  constructor() {
    this.playEpilogueThemeCalls = 0;
  }

  playEpilogueTheme() {
    this.playEpilogueThemeCalls += 1;
  }
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
    this.fillRects = [];
  }

  fillRect(x, y, width, height) {
    this.fillRects.push({ x, y, width, height, fillStyle: this.fillStyle });
  }

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

test("el mecanismo del regalo con giftCodeSolved sincroniza al jugador y cambia a epilogue-gift-code en modo de solo lectura", () => {
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
  setup.scene.player.x = 300;
  setup.scene.player.y = 250;
  setup.scene.player.facing = "up";
  const stateBefore = structuredClone(setup.state.toSaveData());
  delete stateBefore.savedAt;

  setup.scene.interact(mechanism);

  const stateAfter = structuredClone(setup.state.toSaveData());
  delete stateAfter.savedAt;

  assert.deepEqual(setup.scenes.changes, [
    { name: "epilogue-gift-code", payload: { readOnly: true } },
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

test("el mecanismo del regalo con giftCodeSolved y epilogueCompleted también cambia a epilogue-gift-code en modo de solo lectura", () => {
  const setup = createWorldAt("axiom-plaza");
  const mechanism = findObject(
    "axiom-plaza",
    "epilogue-gift-mechanism",
  );
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = true;

  setup.scene.interact(mechanism);

  assert.deepEqual(setup.scenes.changes, [
    { name: "epilogue-gift-code", payload: { readOnly: true } },
  ]);
  assert.equal(setup.ui.dialogue, null);
});

test("una WorldScene montada sobre un GameState restaurado con giftCodeSolved no cambia de escena al entrar, e interactuar con el mecanismo del regalo ya resuelto cambia a epilogue-gift-code en modo de solo lectura", () => {
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

  assert.deepEqual(scenes.changes, [
    { name: "epilogue-gift-code", payload: { readOnly: true } },
  ]);
  assert.equal(ui.dialogue, null);
});

test("bride-epilogue no se encuentra por proximidad antes de giftCodeSolved", () => {
  const setup = createWorldAt("axiom-plaza");
  const bride = findObject("axiom-plaza", "bride-epilogue");

  setup.scene.player.x = bride.x + bride.width / 2;
  setup.scene.player.y = bride.y + bride.height / 2;
  setup.scene.update(0);

  assert.equal(setup.scene.nearbyObject, null);
});

test("bride-epilogue se encuentra por proximidad tras giftCodeSolved", () => {
  const setup = createWorldAt("axiom-plaza");
  const bride = findObject("axiom-plaza", "bride-epilogue");

  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = false;

  setup.scene.player.x = bride.x + bride.width / 2;
  setup.scene.player.y = bride.y + bride.height / 2;
  setup.scene.update(0);

  assert.equal(setup.scene.nearbyObject?.id, "bride-epilogue");
});

test("interactuar con bride-epilogue sin giftCodeSolved sigue siendo un no-op defensivo", () => {
  const setup = createWorldAt("axiom-plaza");
  const bride = findObject("axiom-plaza", "bride-epilogue");

  const stateBefore = structuredClone(setup.state.toSaveData());
  delete stateBefore.savedAt;

  setup.scene.interact(bride);

  const stateAfter = structuredClone(setup.state.toSaveData());
  delete stateAfter.savedAt;

  assert.deepEqual(setup.scenes.changes, []);
  assert.equal(setup.ui.dialogue, null);
  assert.deepEqual(stateAfter, stateBefore);
});

test("interact() invoca interactWithBrideEpilogue exactamente una vez para bride-epilogue", () => {
  const setup = createWorldAt("axiom-plaza");
  const bride = findObject("axiom-plaza", "bride-epilogue");
  let calls = 0;
  setup.scene.interactWithBrideEpilogue = () => {
    calls += 1;
  };

  setup.scene.interact(bride);

  assert.equal(calls, 1);
});

test("bride-epilogue con la cadena válida sincroniza al jugador y abre el primer turno del diálogo", () => {
  const setup = createWorldAt("axiom-plaza");
  const bride = findObject("axiom-plaza", "bride-epilogue");
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = false;
  setup.scene.player.x = 300;
  setup.scene.player.y = 250;
  setup.scene.player.facing = "up";

  setup.scene.interact(bride);

  assert.equal(setup.state.player.x, 300);
  assert.equal(setup.state.player.y, 250);
  assert.equal(
    setup.state.world.playerByMap["axiom-plaza"].x,
    300,
  );
  assert.equal(
    setup.state.world.playerByMap["axiom-plaza"].y,
    250,
  );
  assert.ok(setup.ui.dialogue !== null);
  assert.equal(setup.ui.dialogue.speaker, "Novia");
  assert.deepEqual(setup.ui.dialogue.lines, [
    "No quería saber si serías capaz de encontrarme. Quería que supieras que podías dejar de buscar.",
  ]);
});

test("el diálogo de bride-epilogue reproduce exactamente los cinco turnos aprobados en orden", () => {
  const setup = createWorldAt("axiom-plaza");
  const bride = findObject("axiom-plaza", "bride-epilogue");
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = false;

  const expectedTurns = [
    {
      speaker: "Novia",
      lines: [
        "No quería saber si serías capaz de encontrarme. Quería que supieras que podías dejar de buscar.",
      ],
    },
    { speaker: "Protagonista", lines: ["Y aun así he venido."] },
    {
      speaker: "Novia",
      lines: ["Entonces dime qué demuestra el teorema."],
    },
    {
      speaker: "Protagonista",
      lines: [
        "Que ningún sí vale para siempre solo porque se pronunció una vez. Vale porque, pudiendo decir que no, hoy volvemos a elegirlo.",
      ],
    },
    {
      speaker: "Novia",
      lines: [
        "Eso era lo único que necesitaba comprobar antes de mañana.",
      ],
    },
  ];

  setup.scene.interact(bride);

  const observedTurns = [];
  for (let i = 0; i < expectedTurns.length; i += 1) {
    assert.ok(setup.ui.dialogue !== null, `falta el turno ${i}`);
    observedTurns.push({
      speaker: setup.ui.dialogue.speaker,
      lines: setup.ui.dialogue.lines,
    });
    setup.ui.dialogue.onComplete();
  }

  assert.deepEqual(observedTurns, expectedTurns);
});

test("abrir el diálogo de bride-epilogue no modifica el estado salvo la sincronización del jugador", () => {
  const setup = createWorldAt("axiom-plaza");
  const bride = findObject("axiom-plaza", "bride-epilogue");
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = false;

  const stateBefore = structuredClone(setup.state.toSaveData());
  delete stateBefore.savedAt;

  setup.scene.interact(bride);

  const stateAfter = structuredClone(setup.state.toSaveData());
  delete stateAfter.savedAt;

  const expected = structuredClone(stateBefore);
  expected.player = { ...setup.state.player };
  expected.world.playerByMap["axiom-plaza"] = {
    ...setup.state.player,
  };

  assert.deepEqual(stateAfter, expected);
});

test("completar el diálogo de bride-epilogue invoca completeBrideDialogue exactamente una vez", () => {
  const setup = createWorldAt("axiom-plaza");
  const bride = findObject("axiom-plaza", "bride-epilogue");
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = false;

  let calls = 0;
  setup.scene.completeBrideDialogue = () => {
    calls += 1;
  };

  setup.scene.interact(bride);

  for (let i = 0; i < 5; i += 1) {
    assert.equal(calls, 0, `no debe llamarse antes del último turno (paso ${i})`);
    setup.ui.dialogue.onComplete();
  }

  assert.equal(calls, 1);
});

test("completar el diálogo de bride-epilogue cambia una sola vez a credits sin modificar objetivo ni banderas", () => {
  const setup = createWorldAt("axiom-plaza");
  const bride = findObject("axiom-plaza", "bride-epilogue");
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = false;
  setup.state.objectiveId = "epilogue-meet-bride";

  setup.scene.interact(bride);

  for (let i = 0; i < 5; i += 1) {
    setup.ui.dialogue?.onComplete();
  }

  assert.deepEqual(setup.scenes.changes, [
    { name: "credits", payload: {} },
  ]);
  assert.equal(setup.state.objectiveId, "epilogue-meet-bride");
  assert.equal(setup.state.flags.giftCodeSolved, true);
  assert.equal(setup.state.flags.epilogueCompleted, false);
  assert.equal(setup.ui.dialogue, null);
  assert.equal(setup.audio.playEpilogueThemeCalls, 1);
});

test("completar el diálogo de bride-epilogue invoca playEpilogueTheme exactamente una vez, solo tras el quinto turno", () => {
  const setup = createWorldAt("axiom-plaza");
  const bride = findObject("axiom-plaza", "bride-epilogue");
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = false;

  setup.scene.interact(bride);

  for (let i = 0; i < 5; i += 1) {
    assert.equal(
      setup.audio.playEpilogueThemeCalls,
      0,
      `no debe iniciar música antes del último turno (paso ${i})`,
    );
    setup.ui.dialogue.onComplete();
  }

  assert.equal(setup.audio.playEpilogueThemeCalls, 1);
});

test("reinteractuar con bride-epilogue durante el diálogo no duplica completeBrideDialogue", () => {
  const setup = createWorldAt("axiom-plaza");
  const bride = findObject("axiom-plaza", "bride-epilogue");
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = false;

  let calls = 0;
  setup.scene.completeBrideDialogue = () => {
    calls += 1;
  };

  setup.scene.interact(bride);
  setup.scene.interact(bride);

  for (let i = 0; i < 5; i += 1) {
    setup.ui.dialogue?.onComplete();
  }

  assert.equal(calls, 1);
});

test("bride-epilogue con epilogueCompleted no reabre el diálogo ni modifica el estado, incluida la posición del jugador", () => {
  const setup = createWorldAt("axiom-plaza");
  const bride = findObject("axiom-plaza", "bride-epilogue");
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = true;

  const stateBefore = structuredClone(setup.state.toSaveData());
  delete stateBefore.savedAt;

  setup.scene.interact(bride);

  const stateAfter = structuredClone(setup.state.toSaveData());
  delete stateAfter.savedAt;

  assert.deepEqual(setup.scenes.changes, []);
  assert.equal(setup.ui.dialogue, null);
  assert.deepEqual(stateAfter, stateBefore);
  assert.equal(setup.audio.playEpilogueThemeCalls, 0);
});

test("interactuar con epilogue-gift-mechanism no inicia la música del epílogo", () => {
  const setup = createWorldAt("axiom-plaza");
  const mechanism = findObject("axiom-plaza", "epilogue-gift-mechanism");
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = false;

  setup.scene.interact(mechanism);

  assert.equal(setup.audio.playEpilogueThemeCalls, 0);
});

test("completar el diálogo de bride-epilogue no añade campos del servicio de audio a toSaveData()", () => {
  const setup = createWorldAt("axiom-plaza");
  const bride = findObject("axiom-plaza", "bride-epilogue");
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = false;

  setup.scene.interact(bride);

  for (let i = 0; i < 5; i += 1) {
    setup.ui.dialogue?.onComplete();
  }

  const saveData = setup.state.toSaveData();
  const serialized = JSON.stringify(saveData);

  assert.equal(Object.hasOwn(saveData, "audio"), false);
  assert.equal(serialized.includes("audio"), false);
  assert.equal(serialized.includes("playEpilogueTheme"), false);
});

test("render() con epilogueCompleted sigue mostrando a bride-epilogue", () => {
  const setup = createWorldAt("axiom-plaza");
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = true;
  setup.scene.player.x = 445;
  setup.scene.player.y = 220;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const silhouettes = context.fillRects.filter(
    (rect) => rect.fillStyle === "#302637",
  );

  // 3 NPC genéricos (1 rect de silueta cada uno) + bride-epilogue, cuya
  // silueta está partida en dos piezas (torso/brazos y piernas) desde la
  // corrección de contorno fino -- ver WorldScene.renderElena.
  assert.equal(silhouettes.length, 5);
});

test("render() en axiom-plaza sin giftCodeSolved usa la paleta normal", () => {
  const setup = createWorldAt("axiom-plaza");
  const context = new FakeCanvasContext();
  const palette = getWorldMap("axiom-plaza").palette;
  const dawnPalette = getWorldMap("axiom-plaza").dawnPalette;

  setup.scene.render(context);

  const styles = context.fillRects.map((rect) => rect.fillStyle);

  assert.ok(styles.includes(palette.groundA));
  assert.ok(styles.includes(palette.groundB));
  assert.ok(styles.includes(palette.wall));
  assert.ok(styles.includes(palette.wallTop));
  assert.ok(styles.includes(palette.water));
  assert.equal(styles.includes(dawnPalette.groundA), false);
  assert.equal(styles.includes(dawnPalette.wall), false);
  assert.equal(styles.includes(dawnPalette.water), false);
});

test("render() en axiom-plaza con giftCodeSolved usa la paleta de amanecer", () => {
  const setup = createWorldAt("axiom-plaza");
  setup.state.flags.giftCodeSolved = true;
  const context = new FakeCanvasContext();
  const palette = getWorldMap("axiom-plaza").palette;
  const dawnPalette = getWorldMap("axiom-plaza").dawnPalette;

  setup.scene.render(context);

  const styles = context.fillRects.map((rect) => rect.fillStyle);

  assert.ok(styles.includes(dawnPalette.groundA));
  assert.ok(styles.includes(dawnPalette.groundB));
  assert.ok(styles.includes(dawnPalette.wall));
  assert.ok(styles.includes(dawnPalette.wallTop));
  assert.ok(styles.includes(dawnPalette.water));
  assert.equal(styles.includes(palette.groundA), false);
  assert.equal(styles.includes(palette.wall), false);
  assert.equal(styles.includes(palette.water), false);
});

test("render() con giftCodeSolved en otro mapa activo mantiene su paleta normal", () => {
  for (const mapId of ["seven-bridges-walk", "library"]) {
    const setup = createWorldAt(mapId);
    setup.state.flags.giftCodeSolved = true;
    const context = new FakeCanvasContext();
    const palette = getWorldMap(mapId).palette;

    setup.scene.render(context);

    const styles = context.fillRects.map((rect) => rect.fillStyle);

    assert.equal(getWorldMap(mapId).dawnPalette, null);
    assert.ok(styles.includes(palette.groundA));
    assert.ok(styles.includes(palette.wall));
  }
});

test("render() no modifica el estado guardable, con o sin giftCodeSolved", () => {
  for (const giftCodeSolved of [false, true]) {
    const setup = createWorldAt("axiom-plaza");
    setup.state.flags.giftCodeSolved = giftCodeSolved;
    const context = new FakeCanvasContext();
    const stateBefore = structuredClone(setup.state.toSaveData());
    delete stateBefore.savedAt;

    setup.scene.render(context);

    const stateAfter = structuredClone(setup.state.toSaveData());
    delete stateAfter.savedAt;

    assert.deepEqual(stateAfter, stateBefore);
  }
});

test("render() repetido produce el mismo resultado observable (idempotencia)", () => {
  for (const giftCodeSolved of [false, true]) {
    const setup = createWorldAt("axiom-plaza");
    setup.state.flags.giftCodeSolved = giftCodeSolved;
    const contextFirst = new FakeCanvasContext();
    const contextSecond = new FakeCanvasContext();

    setup.scene.render(contextFirst);
    setup.scene.render(contextSecond);

    assert.deepEqual(contextSecond.fillRects, contextFirst.fillRects);
  }
});

test("una WorldScene montada sobre un GameState restaurado con giftCodeSolved renderiza directamente con la paleta de amanecer", () => {
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

  const context = new FakeCanvasContext();
  scene.render(context);

  const dawnPalette = getWorldMap("axiom-plaza").dawnPalette;
  const styles = context.fillRects.map((rect) => rect.fillStyle);

  assert.ok(styles.includes(dawnPalette.groundA));
  assert.ok(styles.includes(dawnPalette.wall));
  assert.ok(styles.includes(dawnPalette.water));
});

test("los objetos y decoraciones de axiom-plaza no cambian con giftCodeSolved", () => {
  const referenceObject = findObject(
    "axiom-plaza",
    "epilogue-gift-mechanism",
  );
  const setup = createWorldAt("axiom-plaza");
  const context = new FakeCanvasContext();

  setup.state.flags.giftCodeSolved = false;
  setup.scene.render(context);

  assert.deepEqual(
    findObject("axiom-plaza", "epilogue-gift-mechanism"),
    referenceObject,
  );

  setup.state.flags.giftCodeSolved = true;
  setup.scene.render(context);

  assert.deepEqual(
    findObject("axiom-plaza", "epilogue-gift-mechanism"),
    referenceObject,
  );
  assert.equal(
    setup.scene.map.objects,
    getWorldMap("axiom-plaza").objects,
  );
  assert.equal(
    setup.scene.map.decorations,
    getWorldMap("axiom-plaza").decorations,
  );
});

test("render() en axiom-plaza sin giftCodeSolved dibuja tres NPC, sin bride-epilogue", () => {
  const setup = createWorldAt("axiom-plaza");
  const context = new FakeCanvasContext();

  setup.scene.render(context);

  const silhouettes = context.fillRects.filter(
    (rect) => rect.fillStyle === "#302637",
  );

  assert.equal(silhouettes.length, 3);
});

test("render() en axiom-plaza con giftCodeSolved dibuja cuatro NPC, incluida bride-epilogue", () => {
  const setup = createWorldAt("axiom-plaza");
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = false;

  // Posiciona a la jugadora a medio camino entre los cuatro NPC de
  // axiom-plaza para que la cámara (viewport de 480x270, clamped al
  // tamaño del mapa) los muestre todos a la vez, incluida bride-epilogue.
  setup.scene.player.x = 445;
  setup.scene.player.y = 220;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const silhouettes = context.fillRects.filter(
    (rect) => rect.fillStyle === "#302637",
  );

  // Ver nota equivalente más arriba: bride-epilogue aporta 2 rects de
  // silueta (torso/brazos + piernas), no 1.
  assert.equal(silhouettes.length, 5);
});

test("render() con giftCodeSolved añade tres rectángulos con el color de pelo de bride-epilogue", () => {
  const setup = createWorldAt("axiom-plaza");
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = false;

  setup.scene.player.x = 445;
  setup.scene.player.y = 220;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const hairRects = context.fillRects.filter(
    (rect) => rect.fillStyle === BRIDE_PALETTE.hair,
  );

  assert.equal(hairRects.length, 3);
});

test("render() sin giftCodeSolved (mayor-corolaria, bride-father, plaza-worker) no dibuja el color de pelo de bride-epilogue", () => {
  const setup = createWorldAt("axiom-plaza");
  const context = new FakeCanvasContext();

  setup.scene.render(context);

  const hairRects = context.fillRects.filter(
    (rect) => rect.fillStyle === BRIDE_PALETTE.hair,
  );

  assert.equal(hairRects.length, 0);
});

test("la silueta de bride-epilogue es un contorno de varias piezas estrechas, no un bloque de fondo grande", () => {
  const setup = createWorldAt("axiom-plaza");
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = false;

  setup.scene.player.x = 445;
  setup.scene.player.y = 220;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const silhouetteRects = context.fillRects.filter(
    (rect) => rect.fillStyle === BRIDE_PALETTE.silhouette,
  );

  // Incluye 3 rects de los NPC genéricos (1 cada uno) más las piezas
  // propias de bride-epilogue; por eso se filtran las que le pertenecen
  // buscando las que no coinciden con el tamaño fijo (12x14) del render
  // genérico de NPC.
  const brideSilhouetteRects = silhouetteRects.filter(
    (rect) => !(rect.width === 12 && rect.height === 14),
  );

  assert.ok(
    brideSilhouetteRects.length >= 2,
    `la silueta de bride-epilogue debe construirse con varias piezas de borde, no un único rectángulo de fondo (encontradas: ${brideSilhouetteRects.length})`,
  );

  const widths = brideSilhouetteRects.map((rect) => rect.width);
  assert.ok(
    Math.min(...widths) < Math.max(...widths),
    "las piezas de silueta de bride-epilogue deben variar de ancho (más estrechas donde el cuerpo es más estrecho), no ser todas iguales a un único ancho de fondo",
  );
});

test("render() repetido con giftCodeSolved sigue mostrando bride-epilogue de forma idéntica", () => {
  const setup = createWorldAt("axiom-plaza");
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = false;

  const contextFirst = new FakeCanvasContext();
  const contextSecond = new FakeCanvasContext();

  setup.scene.render(contextFirst);
  setup.scene.render(contextSecond);

  assert.deepEqual(contextFirst.fillRects, contextSecond.fillRects);
});

test("render() con bride-epilogue visible no modifica el estado guardable", () => {
  const setup = createWorldAt("axiom-plaza");
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = false;

  const stateBefore = structuredClone(setup.state.toSaveData());
  delete stateBefore.savedAt;

  setup.scene.render(new FakeCanvasContext());

  const stateAfter = structuredClone(setup.state.toSaveData());
  delete stateAfter.savedAt;

  assert.deepEqual(stateAfter, stateBefore);
});

test("una WorldScene montada sobre un GameState restaurado con giftCodeSolved muestra bride-epilogue directamente", () => {
  const bride = findObject("axiom-plaza", "bride-epilogue");
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
    x: bride.x + bride.width / 2,
    y: bride.y + bride.height / 2,
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
  scene.update(0);

  assert.equal(scene.nearbyObject?.id, "bride-epilogue");

  const context = new FakeCanvasContext();
  scene.render(context);

  // La jugadora está pegada al borde derecho del mapa (necesario para
  // quedar dentro del radio de interacción de bride-epilogue), así que la
  // cámara satura contra ese borde y dos NPC lejanos (mayor-corolaria y
  // plaza-worker) quedan fuera del viewport. Se comprueba, en su lugar,
  // que bride-epilogue se dibuja de verdad en su posición real de
  // pantalla, calculada a partir del estado real de la cámara. Se ancla a
  // la cabeza (BRIDE_PALETTE.head) en vez de a la silueta de fondo,
  // porque la geometría exacta del contorno es una decisión cosmética que
  // puede ajustarse en 1px sin que este test deba cambiar.
  const brideScreenX = Math.round(bride.x - scene.camera.x);
  const brideScreenY = Math.round(bride.y - scene.camera.y);
  const brideHeadVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === BRIDE_PALETTE.head &&
      rect.x === brideScreenX + 3 &&
      rect.y === brideScreenY + 3 &&
      rect.width === 8 &&
      rect.height === 6,
  );

  assert.equal(brideHeadVisible, true);
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

test("OBJECTIVE_LABELS reconoce epilogue-completed en el HUD renderizado", () => {
  const setup = createWorldAt("axiom-plaza");
  setup.state.objectiveId = "epilogue-completed";
  const context = new FakeCanvasContext();

  setup.scene.render(context);

  assert.ok(
    context.texts.some((text) =>
      text.includes("La demostración ha terminado."),
    ),
  );
});

test("restaurar una partida con epilogueCompleted=true no dispara ningún cambio de escena", () => {
  const saved = new GameState().toSaveData();
  saved.flags.investigationComplete = true;
  saved.flags.epilogueUnlocked = true;
  saved.flags.epilogueStarted = true;
  saved.flags.giftCodeSolved = true;
  saved.flags.epilogueCompleted = true;
  saved.objectiveId = "review-preparations-board";
  saved.scene = "library-catalogue";
  saved.world.currentMapId = "library";

  const input = new FakeInput();
  const scenes = new FakeScenes();
  const ui = new FakeUi();
  const state = new GameState();
  const scene = new WorldScene({
    scenes,
    input,
    storage: new FakeStorage({ loadResult: saved }),
    state,
    ui,
    audio: { playEpilogueTheme: () => {} },
  });

  scene.enter({ restoreFromState: true });
  scene.update(0);

  assert.deepEqual(scenes.changes, []);
  assert.equal(state.scene, "world");
  assert.equal(state.world.currentMapId, "axiom-plaza");
  assert.equal(state.objectiveId, "epilogue-completed");
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
  const audio = new FakeAudioService();
  const scene = new WorldScene({
    scenes,
    input,
    storage,
    state,
    ui,
    audio,
  });

  return { input, scenes, state, ui, audio, scene };
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
  const audio = new FakeAudioService();
  state.changeMap(mapId);
  state.puzzles.libraryCatalogue = catalogue;
  const scene = new WorldScene({
    scenes,
    input,
    storage: new FakeStorage(),
    state,
    ui,
    audio,
  });
  scene.enter();

  return { input, scenes, state, ui, audio, scene };
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
