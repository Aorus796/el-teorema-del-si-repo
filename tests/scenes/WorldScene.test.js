import assert from "node:assert/strict";
import test from "node:test";
import { SceneManager } from "../../src/core/SceneManager.js";
import { getWorldMap } from "../../src/content/worldMaps.js";
import {
  PARTNER_NAME,
  PROTAGONIST_NAME,
} from "../../src/content/personalizationConfig.js";
import {
  LIBRARY_CATALOGUE_FAILURE_CODE,
  LIBRARY_CATALOGUE_PHASE,
  LibraryCatalogueState,
} from "../../src/puzzles/library-catalogue/LibraryCatalogueState.js";
import { LibraryCatalogueScene } from "../../src/scenes/LibraryCatalogueScene.js";
import {
  ARCHIVE_CRITERIA_PHASE,
  ArchiveCriteriaState,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaState.js";
import { ArchiveCriteriaScene } from "../../src/scenes/ArchiveCriteriaScene.js";
import { P2_PHASE } from "../../src/puzzles/p2-bridges/P2State.js";
import { P2BridgesScene } from "../../src/scenes/P2BridgesScene.js";
import { WorldScene, resolveMaxSpawnPosition } from "../../src/scenes/WorldScene.js";
import { GameState } from "../../src/state/GameState.js";
import {
  BRIDE_PALETTE,
  NAMED_NPC_PALETTES,
} from "../../src/content/characterPalettes.js";
import {
  ELENA_FRONT_PIXELS,
  ELENA_PALETTE,
  ELENA_TRANSPARENT,
} from "../../src/content/elenaPixelArt.js";
import {
  COROLARIA_FRONT_PIXELS,
  COROLARIA_PALETTE,
} from "../../src/content/corolariaPixelArt.js";
import {
  BRIDE_FATHER_FRONT_PIXELS,
  BRIDE_FATHER_PIXEL_PALETTE,
} from "../../src/content/brideFatherPixelArt.js";
import {
  SILOGIO_FRONT_PIXELS,
  SILOGIO_PIXEL_PALETTE,
} from "../../src/content/silogioPixelArt.js";
import { AMBIENT_THEME_PATH } from "../../src/content/ambientAudioConfig.js";
import { OPENING_THEME_PATH } from "../../src/content/introAudioConfig.js";
import { INTERACT_SFX_PATH } from "../../src/content/sfxAudioConfig.js";
import {
  computeMaxSpawnPosition,
  MAX_FOLLOW_MIN_DISTANCE,
  MAX_HITBOX_DIMENSIONS,
  MAX_REACTION_DURATION_SECONDS,
  MaxCompanion,
} from "../../src/world/MaxCompanion.js";
import { CollisionMap } from "../../src/world/CollisionMap.js";

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
    this.playMusicCalls = [];
    this.stopMusicCalls = 0;
    this.playSfxCalls = [];
  }

  playEpilogueTheme() {
    this.playEpilogueThemeCalls += 1;
  }

  playMusic(src, options) {
    this.playMusicCalls.push({ src, options });
  }

  stopMusic() {
    this.stopMusicCalls += 1;
  }

  playSfx(src) {
    this.playSfxCalls.push(src);
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

// Elena Character Pixel-Art: los tests de bride-epilogue de más abajo
// comparan contra el recuento real de símbolos en ELENA_FRONT_PIXELS en
// vez de contra números hardcodeados, igual que se hizo para Gonzalo en
// tests/world/Player.test.js -- el render ya no compone el cuerpo con
// unos pocos fillRect grandes, sino con un fillRect de 1x1 por pixel no
// transparente del sprite indexado.
function countSymbolInPixels(pixels, symbol) {
  return pixels
    .join("")
    .split("")
    .filter((char) => char === symbol).length;
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
    audio: new FakeAudioService(),
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

test("enter() con una partida nueva, antes de completar el diálogo del padre de la novia, reproduce el opening en loop", () => {
  const setup = createWorldAt("axiom-plaza");

  assert.equal(setup.state.flags.brideNoteReceived, false);
  assert.deepEqual(setup.audio.playMusicCalls, [
    { src: OPENING_THEME_PATH, options: { loop: true } },
  ]);
});

test("enter() sobre un GameState restaurado con brideNoteReceived=true reproduce la música ambiental en loop exactamente una vez", () => {
  const saved = new GameState().toSaveData();
  saved.flags.brideNoteReceived = true;
  saved.flags.sevenBridgesUnlocked = true;
  saved.objectiveId = "investigate-seven-bridges";

  const state = new GameState();
  state.restore(saved);

  const input = new FakeInput();
  const scenes = new FakeScenes();
  const ui = new FakeUi();
  const audio = new FakeAudioService();
  const scene = new WorldScene({
    scenes,
    input,
    storage: new FakeStorage(),
    state,
    ui,
    audio,
  });

  scene.enter();

  assert.deepEqual(audio.playMusicCalls, [
    { src: AMBIENT_THEME_PATH, options: { loop: true } },
  ]);
});

test("enter() sobre un GameState restaurado con epilogueCompleted=true no reproduce ninguna música y detiene explícitamente la que pudiera sonar", () => {
  const saved = new GameState().toSaveData();
  saved.flags.investigationComplete = true;
  saved.flags.epilogueUnlocked = true;
  saved.flags.epilogueStarted = true;
  saved.flags.giftCodeSolved = true;
  saved.flags.epilogueCompleted = true;
  saved.objectiveId = "epilogue-completed";
  saved.scene = "world";
  saved.world.currentMapId = "axiom-plaza";

  const state = new GameState();
  state.restore(saved);

  const input = new FakeInput();
  const scenes = new FakeScenes();
  const ui = new FakeUi();
  const audio = new FakeAudioService();
  const scene = new WorldScene({
    scenes,
    input,
    storage: new FakeStorage(),
    state,
    ui,
    audio,
  });

  scene.enter();

  assert.deepEqual(audio.playMusicCalls, []);
  assert.equal(audio.stopMusicCalls, 1);
});

/*
 * Caso de regresión crítico: bajo el contrato de tres estados, cargar
 * desde el título una partida con epilogueCompleted:true SÍ puede
 * encontrarse con el opening ya sonando en loop (arrancado por un
 * enter() anterior sobre esta misma instancia de escena, por ejemplo una
 * partida nueva iniciada antes de cargar una partida ya terminada) -- a
 * diferencia del contrato anterior, en el que enter() con
 * epilogueCompleted:true simplemente hacía return sin detener nada,
 * porque bajo ese contrato nunca había nada sonando en ese punto. Este
 * test reutiliza deliberadamente la misma instancia de WorldScene para
 * dos llamadas a enter() sucesivas y comprueba que la segunda -- con
 * epilogueCompleted:true -- llama a stopMusic() de forma explícita, en
 * vez de limitarse a no arrancar nada nuevo.
 */
test("enter() con epilogueCompleted=true detiene el opening que hubiera quedado sonando de una llamada anterior a enter() sobre la misma instancia", () => {
  const input = new FakeInput();
  const scenes = new FakeScenes();
  const ui = new FakeUi();
  const audio = new FakeAudioService();
  const state = new GameState();
  const scene = new WorldScene({
    scenes,
    input,
    storage: new FakeStorage(),
    state,
    ui,
    audio,
  });

  // Primera llamada: partida nueva, sin ningún flag narrativo activo ->
  // arranca el opening en loop.
  scene.enter();

  assert.deepEqual(audio.playMusicCalls, [
    { src: OPENING_THEME_PATH, options: { loop: true } },
  ]);
  assert.equal(audio.stopMusicCalls, 0);

  const saved = new GameState().toSaveData();
  saved.flags.investigationComplete = true;
  saved.flags.epilogueUnlocked = true;
  saved.flags.epilogueStarted = true;
  saved.flags.giftCodeSolved = true;
  saved.flags.epilogueCompleted = true;
  saved.objectiveId = "epilogue-completed";
  saved.scene = "world";
  saved.world.currentMapId = "axiom-plaza";
  const storage = new FakeStorage({ loadResult: saved });
  scene.storage = storage;

  // Segunda llamada, sobre la misma instancia: restaura una partida con
  // el epílogo ya completado -> debe detener explícitamente el opening
  // que quedó activo tras la primera llamada, sin arrancar nada nuevo.
  scene.enter({ restoreFromState: true });

  assert.equal(audio.stopMusicCalls, 1);
  assert.deepEqual(audio.playMusicCalls, [
    { src: OPENING_THEME_PATH, options: { loop: true } },
  ]);
});

test("completar el diálogo con el padre de la novia dispara la música ambiental en loop exactamente una vez, después de marcar brideNoteReceived", () => {
  const setup = createWorldAt("axiom-plaza");
  setup.state.flags.preparationsBoardRead = true;

  // createWorldAt() ya llamó a enter() con las banderas por defecto, así
  // que el opening en loop ya suena antes de este punto.
  assert.deepEqual(setup.audio.playMusicCalls, [
    { src: OPENING_THEME_PATH, options: { loop: true } },
  ]);

  setup.scene.interactWithBrideFather();

  assert.equal(setup.state.flags.brideNoteReceived, false);
  assert.equal(setup.audio.playMusicCalls.length, 1);

  setup.ui.dialogue.onComplete();

  assert.equal(setup.state.flags.brideNoteReceived, true);
  assert.deepEqual(setup.audio.playMusicCalls, [
    { src: OPENING_THEME_PATH, options: { loop: true } },
    { src: AMBIENT_THEME_PATH, options: { loop: true } },
  ]);
});

test("reinteractuar con el padre de la novia tras brideNoteReceived:true no duplica la reproducción del ambiental", () => {
  const setup = createWorldAt("axiom-plaza");
  setup.state.flags.preparationsBoardRead = true;

  setup.scene.interactWithBrideFather();
  setup.ui.dialogue.onComplete();

  // El opening en loop de enter() más el ambiental disparado al
  // completar el diálogo del padre.
  assert.equal(setup.audio.playMusicCalls.length, 2);

  setup.scene.interactWithBrideFather();

  assert.equal(setup.audio.playMusicCalls.length, 2);
  assert.ok(setup.ui.dialogue !== null);
});

test("cambiar de mapa dentro del mundo, con el ambiental ya activo, no dispara otra llamada a playMusic", () => {
  const setup = createWorldAt("seven-bridges-walk");
  setup.state.flags.brideNoteReceived = true;
  setup.scene.enter();
  const exit = findObject(
    "seven-bridges-walk",
    "seven-bridges-to-library",
  );
  setup.state.flags.libraryObjectiveUnlocked = true;
  setup.scene.player.x = 600;
  setup.scene.player.y = 304;
  setup.scene.player.facing = "right";

  // El opening de la llamada a enter() implícita en createWorldAt() (con
  // las banderas por defecto) más el ambiental de la llamada explícita a
  // enter() de arriba, ya con brideNoteReceived:true.
  const callsBefore = setup.audio.playMusicCalls.length;
  assert.equal(callsBefore, 2);

  setup.scene.interactWithExit(exit);

  assert.equal(setup.state.world.currentMapId, "library");
  assert.equal(setup.audio.playMusicCalls.length, callsBefore);
});

test("cancelar con ambiental activo detiene la música antes de cambiar a title", () => {
  const setup = createWorldAt("axiom-plaza");
  setup.state.flags.brideNoteReceived = true;
  setup.scene.enter();
  setup.input.press("cancel");

  setup.scene.update(0);

  assert.equal(setup.audio.stopMusicCalls, 1);
  assert.deepEqual(setup.scenes.changes, [
    { name: "title", payload: {} },
  ]);
});

test("cancelar sin haber completado nunca el diálogo del padre de la novia también detiene la música (no-op seguro)", () => {
  const setup = createWorldAt("axiom-plaza");
  setup.input.press("cancel");

  setup.scene.update(0);

  assert.equal(setup.audio.stopMusicCalls, 1);
  assert.deepEqual(setup.scenes.changes, [
    { name: "title", payload: {} },
  ]);
});

test("transición de World hacia una escena de puzzle no detiene la música", () => {
  const setup = createWorldAt("library");
  const silogio = findObject("library", "library-silogio");

  setup.scene.interact(silogio);

  assert.equal(setup.audio.stopMusicCalls, 0);
});

test("completar el diálogo de bride-epilogue no detiene la música antes de reemplazarla con el tema del epílogo", () => {
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
      setup.audio.stopMusicCalls,
      0,
      `no debe detener la música antes del último turno (paso ${i})`,
    );
    setup.ui.dialogue.onComplete();
  }

  assert.equal(setup.audio.stopMusicCalls, 0);
  assert.equal(setup.audio.playEpilogueThemeCalls, 1);
});

/*
 * Los tres tests siguientes cubren, uno por uno, los tres casos
 * excluyentes de reconcileAudioAfterLoad() (delegados en
 * syncMusicToFlags(), compartido con enter()): epílogo completado
 * (detiene), diálogo del padre ya completado sin epílogo completado
 * (garantiza el ambiental en loop), y ninguno de los dos flags -- partida
 * muy temprana -- (arranca el opening en loop, en vez de conservar lo que
 * hubiera sonando antes de la carga).
 */
test("load() dentro de World con brideNoteReceived:true y epilogueCompleted:false reconcilia el ambiental en loop tras la carga", () => {
  const saved = new GameState().toSaveData();
  saved.flags.brideNoteReceived = true;
  saved.flags.sevenBridgesUnlocked = true;
  saved.objectiveId = "investigate-seven-bridges";
  const storage = new FakeStorage({ loadResult: saved });
  const { scene, input, audio } = createScene(storage);
  scene.enter();

  input.press("load");
  scene.update(0);

  assert.deepEqual(audio.playMusicCalls.at(-1), {
    src: AMBIENT_THEME_PATH,
    options: { loop: true },
  });
});

test("load() dentro de World con epilogueCompleted:true detiene la música y no arranca el ambiental tras la carga", () => {
  const saved = new GameState().toSaveData();
  saved.flags.investigationComplete = true;
  saved.flags.epilogueUnlocked = true;
  saved.flags.epilogueStarted = true;
  saved.flags.giftCodeSolved = true;
  saved.flags.epilogueCompleted = true;
  const storage = new FakeStorage({ loadResult: saved });
  const { scene, input, audio } = createScene(storage);
  scene.enter();

  const callsBeforeLoad = audio.playMusicCalls.length;

  input.press("load");
  scene.update(0);

  assert.equal(audio.stopMusicCalls, 1);
  assert.deepEqual(audio.playMusicCalls.slice(callsBeforeLoad), []);
});

test("load() dentro de World sin brideNoteReceived ni epilogueCompleted (partida muy temprana) arranca el opening en loop tras la carga", () => {
  const saved = new GameState().toSaveData();
  const storage = new FakeStorage({ loadResult: saved });
  const { scene, input, audio } = createScene(storage);
  scene.enter();

  const callsBeforeLoad = audio.playMusicCalls.length;

  input.press("load");
  scene.update(0);

  assert.equal(audio.stopMusicCalls, 0);
  assert.deepEqual(audio.playMusicCalls.slice(callsBeforeLoad), [
    { src: OPENING_THEME_PATH, options: { loop: true } },
  ]);
});

test("update() con tecla load y load() fallido no toca el audio en absoluto", () => {
  const scenarios = [
    () => new FakeStorage(),
    () => new FakeStorage({ loadError: new Error("Fallo simulado") }),
    () => {
      const saved = new GameState().toSaveData();
      saved.formatVersion = 999;
      return new FakeStorage({ loadResult: saved });
    },
    () => {
      const saved = new GameState().toSaveData();
      delete saved.puzzles.libraryCatalogue.hintsRead;
      return new FakeStorage({ loadResult: saved });
    },
  ];

  for (const buildStorage of scenarios) {
    withMockedConsoleError(() => {
      const storage = buildStorage();
      const { scene, input, audio } = createScene(storage);
      scene.enter();

      const callsBeforeLoad = audio.playMusicCalls.length;

      input.press("load");

      assert.doesNotThrow(() => scene.update(0));

      assert.equal(audio.stopMusicCalls, 0);
      assert.deepEqual(audio.playMusicCalls.slice(callsBeforeLoad), []);
    });
  }
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

  // Con la jugadora en (445,220) la cámara (205,85) deja dentro del
  // viewport, además de plaza-worker, a dos de los cuatro NPC ambientales
  // nuevos: ambient-florist-altar y ambient-guest-bench. Todos los NPC
  // dibujados con el render genérico (renderNpc, segunda ronda de
  // refinamiento visual -- ver drawGenericNpc*() en WorldScene.js) tienen
  // ahora palette.eyes true, así que cada uno de esos 3 NPC visibles
  // contribuye 6 rects en NPC_SILHOUETTE: 2 de contorno (hombros->cintura
  // y piernas->zapato), 2 de 1x1 de ojos, 1 de la hendidura de piernas y 1
  // del zapato (estos dos últimos siempre se dibujan, tenga o no apron el
  // NPC, porque el apron/corbata se pinta encima sin eliminar los
  // fillRect ya emitidos). Los otros dos NPC ambientales (ambient-setup-
  // helper y ambient-waiter-tables) quedan fuera del viewport en esta
  // posición. mayor-corolaria y bride-father ya tienen renderers
  // dedicados con su propia silueta. A eso se suma un fillRect de 1x1 por
  // cada pixel de contorno/ojo ("O") del sprite indexado de Elena --
  // ELENA_PALETTE.O reutiliza el mismo valor "#302637" que
  // BRIDE_PALETTE.silhouette/NPC_SILHOUETTE, así que ambos se cuentan
  // juntos al filtrar por ese color.
  const genericNpcSilhouetteRects = 6 + 6 + 6;
  const elenaOutlinePixels = countSymbolInPixels(ELENA_FRONT_PIXELS, "O");

  assert.equal(silhouettes.length, genericNpcSilhouetteRects + elenaOutlinePixels);
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

/*
 * Regresión de un hallazgo real de `reviewer`: las bandas de agua oscura y
 * las líneas de reflejo de "river" (renderBackgroundDecorations, Seven
 * Bridges Visual Polish) se dibujaban con un paso fijo que no dividía
 * exactamente la altura real de la decoración, desbordando una banda
 * opaca 4px más allá del borde inferior del río, sobre césped transitable.
 * Este test no compara contra una imagen de referencia (evitaría un golden
 * pixel test frágil): filtra, por color de fillStyle, exactamente los
 * fillRect que pertenecen a esas dos bandas (derivando los mismos tonos
 * que produce mixHexColors() en WorldScene.js a partir de la paleta real
 * del mapa) y comprueba la única invariante que importa -- ningún
 * fillRect de esas bandas empieza antes de `river.y` ni termina después
 * de `river.y + river.height`, sea cual sea el paso o el offset elegido.
 */
test("las bandas de agua de 'river' en seven-bridges-walk nunca se dibujan fuera de los límites verticales de la decoración", () => {
  function mixHex(colorA, colorB, ratio) {
    const parse = (hex) => {
      const value = hex.replace("#", "");
      return {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16),
      };
    };
    const a = parse(colorA);
    const b = parse(colorB);
    const mix = (channelA, channelB) =>
      Math.round(channelA + (channelB - channelA) * ratio);

    return `rgb(${mix(a.r, b.r)} ${mix(a.g, b.g)} ${mix(a.b, b.b)})`;
  }

  const setup = createWorldAt("seven-bridges-walk");
  const map = getWorldMap("seven-bridges-walk");
  const river = map.decorations.find((decoration) => decoration.type === "river");
  const waterDeep = mixHex(map.palette.water, "#000000", 0.22);
  const waterLight = mixHex(map.palette.water, "#ffffff", 0.16);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const bandRects = context.fillRects.filter(
    (rect) => rect.fillStyle === waterDeep || rect.fillStyle === waterLight,
  );

  assert.ok(
    bandRects.length > 0,
    "se esperaba al menos una banda de agua dibujada (river debe estar en el viewport del spawn por defecto)",
  );

  for (const rect of bandRects) {
    // rect.y ya está en coordenadas de pantalla (post-cámara); se compara
    // contra river en las mismas coordenadas, restando camera.x/y, igual
    // que hace renderBackgroundDecorations() para dibujar.
    const riverScreenY = Math.round(river.y - setup.scene.camera.y);

    assert.ok(
      rect.y >= riverScreenY,
      `una banda de agua empieza en y=${rect.y}, antes del borde superior del río (${riverScreenY})`,
    );
    assert.ok(
      rect.y + rect.height <= riverScreenY + river.height,
      `una banda de agua termina en y=${rect.y + rect.height}, más allá del borde inferior del río (${riverScreenY + river.height})`,
    );
  }
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
    audio: new FakeAudioService(),
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

test("render() en axiom-plaza sin giftCodeSolved dibuja plaza-worker y el NPC ambiental visible en cámara, sin bride-epilogue", () => {
  const setup = createWorldAt("axiom-plaza");
  const context = new FakeCanvasContext();

  setup.scene.render(context);

  const silhouettes = context.fillRects.filter(
    (rect) => rect.fillStyle === "#302637",
  );

  // Con la posición de aparición por defecto (240,192) la cámara queda en
  // (0,57): plaza-worker sigue usando el render genérico y, de los cuatro
  // NPC ambientales nuevos, solo ambient-florist-altar cae dentro del
  // viewport. Todos los NPC dibujados con renderNpc (segunda ronda de
  // refinamiento visual) tienen ahora palette.eyes true, así que cada uno
  // de estos 2 NPC visibles contribuye 6 rects en NPC_SILHOUETTE (2 de
  // contorno + 2 ojos + 1 hendidura de piernas + 1 zapato). mayor-corolaria
  // y bride-father tienen renderers dedicados con su propia paleta
  // (MAYOR_PALETTE.silhouette / BRIDE_FATHER_PALETTE.silhouette).
  assert.equal(silhouettes.length, 6 + 6);
});

test("render() en axiom-plaza con giftCodeSolved dibuja plaza-worker, dos NPC ambientales y bride-epilogue", () => {
  const setup = createWorldAt("axiom-plaza");
  setup.state.flags.investigationComplete = true;
  setup.state.flags.epilogueUnlocked = true;
  setup.state.flags.epilogueStarted = true;
  setup.state.flags.giftCodeSolved = true;
  setup.state.flags.epilogueCompleted = false;

  // Posiciona a la jugadora a medio camino entre plaza-worker y
  // bride-epilogue en axiom-plaza para que la cámara (viewport de
  // 480x270, clamped al tamaño del mapa) los muestre a ambos a la vez,
  // junto con los NPC ambientales que caen dentro de ese mismo viewport
  // (ambient-florist-altar y ambient-guest-bench).
  setup.scene.player.x = 445;
  setup.scene.player.y = 220;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const silhouettes = context.fillRects.filter(
    (rect) => rect.fillStyle === "#302637",
  );

  // Ver nota equivalente más arriba: 6 rects de plaza-worker + 6 rects de
  // ambient-florist-altar + 6 rects de ambient-guest-bench (cada uno: 2
  // de contorno + 2 ojos + hendidura de piernas + zapato), los dos únicos
  // NPC ambientales visibles en esta posición de cámara, + un fillRect de
  // 1x1 por cada pixel de contorno/ojo del sprite indexado de Elena.
  const genericNpcSilhouetteRects = 6 + 6 + 6;
  const elenaOutlinePixels = countSymbolInPixels(ELENA_FRONT_PIXELS, "O");

  assert.equal(silhouettes.length, genericNpcSilhouetteRects + elenaOutlinePixels);
});

/*
 * Plaza del Axioma -- NPCs ambientales (v1.1), segunda ronda de
 * refinamiento visual (revisión humana explícita: "todavía se leen
 * demasiado como BLOQUES" -- ver CHANGELOG.md): cobertura dedicada de los
 * 4 NPC nuevos sin nombre propio. Cada uno usa el render genérico
 * (renderNpc, ahora compuesto por las sub-rutinas drawGenericNpc*() de
 * WorldScene.js -- outline/hair/head/body/legs/apron) con su propia
 * entrada de NAMED_NPC_PALETTES, así que se comprueba el mismo patrón que
 * cubre plaza-worker más abajo (hombros/torso/accent/pelo trasero+frontal
 * en las posiciones fijas del render genérico, con los deltas de
 * palette.silhouetteVariant), más los rects de ojos condicionales según
 * palette.eyes. El delantal/peto/corbata (específico por object.id, no
 * por campo de paleta) tiene su propia cobertura dedicada justo debajo
 * del bucle.
 */
const AMBIENT_NPC_IDS = [
  "ambient-florist-altar",
  "ambient-setup-helper",
  "ambient-waiter-tables",
  "ambient-guest-bench",
];

for (const npcId of AMBIENT_NPC_IDS) {
  test(`${npcId} se dibuja con su propio body/accent de NAMED_NPC_PALETTES, anclado en su posición real de pantalla`, () => {
    const setup = createWorldAt("axiom-plaza");
    const object = findObject("axiom-plaza", npcId);
    const palette = NAMED_NPC_PALETTES[npcId];
    const isLight = palette.silhouetteVariant === "light";

    // Coloca a la jugadora encima del NPC para que quede dentro del
    // viewport sin depender de la posición de cámara por defecto.
    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const screenX = Math.round(object.x - setup.scene.camera.x);
    const screenY = Math.round(object.y - setup.scene.camera.y);

    const shouldersVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.body &&
        rect.x === screenX + 1 &&
        rect.y === screenY + 7 &&
        rect.width === (isLight ? 11 : 12) &&
        rect.height === 2,
    );
    const torsoVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.body &&
        rect.x === screenX + 2 &&
        rect.y === screenY + 9 &&
        rect.width === (isLight ? 9 : 10) &&
        rect.height === 5,
    );
    const accentVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.accent &&
        rect.x === screenX + 5 &&
        rect.y === screenY + 9 &&
        rect.width === 4 &&
        rect.height === 2,
    );

    assert.equal(shouldersVisible, true, `${npcId} no dibuja sus hombros`);
    assert.equal(torsoVisible, true, `${npcId} no dibuja su torso`);
    assert.equal(accentVisible, true, `${npcId} no dibuja su palette.accent`);

    const hairShadowVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.hairShadow &&
        rect.x === screenX + 2 &&
        rect.y === screenY - 2 &&
        rect.width === 10 &&
        rect.height === 4,
    );
    const hairFrontVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.hair &&
        rect.x === screenX + 3 &&
        rect.y === screenY - 1 &&
        rect.width === 8 &&
        rect.height === 3,
    );

    assert.equal(
      hairShadowVisible,
      true,
      `${npcId} no dibuja su palette.hairShadow`,
    );
    assert.equal(hairFrontVisible, true, `${npcId} no dibuja su palette.hair`);

    if (palette.eyes) {
      const eyeRects = context.fillRects.filter(
        (rect) =>
          rect.fillStyle === "#302637" &&
          rect.width === 1 &&
          rect.height === 1 &&
          rect.y === screenY + 2 &&
          (rect.x === screenX + 5 || rect.x === screenX + 9),
      );

      assert.equal(eyeRects.length, 2, `${npcId} no dibuja sus dos ojos`);
    }
  });

  test(`interactuar con ${npcId} abre un diálogo de un único turno con su label como speaker, sin tocar GameState`, () => {
    const setup = createWorldAt("axiom-plaza");
    const object = findObject("axiom-plaza", npcId);
    setup.scene.player.x = object.x + object.width / 2;
    setup.scene.player.y = object.y + object.height / 2;
    setup.input.press("interact");

    const stateBefore = structuredClone(setup.state.toSaveData());
    delete stateBefore.savedAt;

    setup.scene.update(0);

    const stateAfter = structuredClone(setup.state.toSaveData());
    delete stateAfter.savedAt;

    assert.ok(setup.ui.dialogue !== null);
    assert.equal(setup.ui.dialogue.speaker, object.label);
    assert.equal(setup.ui.dialogue.lines.length, 1);
    assert.deepEqual(stateAfter, stateBefore);
  });
}

/*
 * Delantal/peto/corbata: forma decidida por object.id (drawGenericNpcApron
 * en WorldScene.js), no por un campo de paleta nuevo. Cobertura dedicada
 * por NPC porque cada uno dibuja una forma distinta (o ninguna).
 */
test("ambient-setup-helper dibuja su banda de delantal práctica sobre la cintura", () => {
  const setup = createWorldAt("axiom-plaza");
  const object = findObject("axiom-plaza", "ambient-setup-helper");
  setup.scene.player.x = object.x;
  setup.scene.player.y = object.y;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);

  const apronVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === "#e6ded0" &&
      rect.x === screenX + 3 &&
      rect.y === screenY + 14 &&
      rect.width === 8 &&
      rect.height === 2,
  );

  assert.equal(
    apronVisible,
    true,
    "ambient-setup-helper no dibuja su banda de delantal",
  );
});

test("ambient-waiter-tables dibuja su peto integrado (tira vertical + banda de cintura)", () => {
  const setup = createWorldAt("axiom-plaza");
  const object = findObject("axiom-plaza", "ambient-waiter-tables");
  setup.scene.player.x = object.x;
  setup.scene.player.y = object.y;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);

  const bibVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === "#e6ded0" &&
      rect.x === screenX + 6 &&
      rect.y === screenY + 9 &&
      rect.width === 2 &&
      rect.height === 5,
  );
  const waistBandVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === "#e6ded0" &&
      rect.x === screenX + 3 &&
      rect.y === screenY + 14 &&
      rect.width === 8 &&
      rect.height === 2,
  );

  assert.equal(
    bibVisible,
    true,
    "ambient-waiter-tables no dibuja la tira vertical de su peto",
  );
  assert.equal(
    waistBandVisible,
    true,
    "ambient-waiter-tables no dibuja la banda de cintura de su peto",
  );
});

test("ambient-guest-bench dibuja una corbata vertical en vez de delantal", () => {
  const setup = createWorldAt("axiom-plaza");
  const object = findObject("axiom-plaza", "ambient-guest-bench");
  const palette = NAMED_NPC_PALETTES["ambient-guest-bench"];
  setup.scene.player.x = object.x;
  setup.scene.player.y = object.y;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);

  const tieVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === palette.accent &&
      rect.x === screenX + 6 &&
      rect.y === screenY + 9 &&
      rect.width === 2 &&
      rect.height === 4,
  );
  // Acotado a la propia caja del NPC (14x18px desde screenX/screenY): el
  // resto del canvas puede contener a otros NPC ambientales con delantal
  // real (#e6ded0) dentro del mismo viewport.
  const apronBand = context.fillRects.some(
    (rect) =>
      rect.fillStyle === "#e6ded0" &&
      rect.x >= screenX &&
      rect.x < screenX + 14 &&
      rect.y >= screenY - 2 &&
      rect.y < screenY + 18,
  );

  assert.equal(tieVisible, true, "ambient-guest-bench no dibuja su corbata");
  assert.equal(
    apronBand,
    false,
    "ambient-guest-bench no debería dibujar un delantal",
  );
});

test("ambient-florist-altar no dibuja delantal, peto ni corbata", () => {
  const setup = createWorldAt("axiom-plaza");
  const object = findObject("axiom-plaza", "ambient-florist-altar");
  setup.scene.player.x = object.x;
  setup.scene.player.y = object.y;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);

  // Acotado a la propia caja del NPC (14x18px desde screenX/screenY): el
  // resto del canvas puede contener a otros NPC ambientales con delantal
  // real (#e6ded0) dentro del mismo viewport.
  const apronBand = context.fillRects.some(
    (rect) =>
      rect.fillStyle === "#e6ded0" &&
      rect.x >= screenX &&
      rect.x < screenX + 14 &&
      rect.y >= screenY - 2 &&
      rect.y < screenY + 18,
  );

  assert.equal(
    apronBand,
    false,
    "ambient-florist-altar no debería dibujar un delantal",
  );
});

test("ambient-florist-altar dibuja su detalle floral (rosetón de flowerAccent + centro hairShadow) sobre el hombro derecho", () => {
  const setup = createWorldAt("axiom-plaza");
  const object = findObject("axiom-plaza", "ambient-florist-altar");
  const palette = NAMED_NPC_PALETTES["ambient-florist-altar"];
  setup.scene.player.x = object.x;
  setup.scene.player.y = object.y;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);

  // Cruz de 4 pétalos en palette.flowerAccent alrededor de un centro en
  // palette.hairShadow (ver drawGenericNpcBody, rama isLight).
  const petalCoords = [
    [10, 5],
    [9, 6],
    [11, 6],
    [10, 7],
  ];
  const petalRects = petalCoords.map(([dx, dy]) =>
    context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.flowerAccent &&
        rect.x === screenX + dx &&
        rect.y === screenY + dy &&
        rect.width === 1 &&
        rect.height === 1,
    ),
  );

  assert.ok(
    petalRects.every(Boolean),
    "ambient-florist-altar no dibuja los 4 pétalos de su detalle floral",
  );

  const centerVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === palette.hairShadow &&
      rect.x === screenX + 10 &&
      rect.y === screenY + 6 &&
      rect.width === 1 &&
      rect.height === 1,
  );

  assert.equal(
    centerVisible,
    true,
    "ambient-florist-altar no dibuja el centro de su detalle floral",
  );
});

test("ningún otro NPC ambiental ni plaza-worker dibuja con el color flowerAccent de ambient-florist-altar", () => {
  const floristFlowerAccent =
    NAMED_NPC_PALETTES["ambient-florist-altar"].flowerAccent;
  const otherIds = ["plaza-worker", ...AMBIENT_NPC_IDS].filter(
    (id) => id !== "ambient-florist-altar",
  );

  for (const npcId of otherIds) {
    const setup = createWorldAt("axiom-plaza");
    const object = findObject("axiom-plaza", npcId);
    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const screenX = Math.round(object.x - setup.scene.camera.x);
    const screenY = Math.round(object.y - setup.scene.camera.y);

    // Acotado a la propia caja del NPC (14x18px desde screenX/screenY):
    // otros NPC visibles en el mismo viewport (incluido, en algunas
    // posiciones de cámara, el propio ambient-florist-altar) sí pueden
    // dibujar con flowerAccent, pero eso no significa que este NPC lo
    // haga.
    const usesFlowerAccent = context.fillRects.some(
      (rect) =>
        rect.fillStyle === floristFlowerAccent &&
        rect.x >= screenX &&
        rect.x < screenX + 14 &&
        rect.y >= screenY - 2 &&
        rect.y < screenY + 18,
    );

    assert.equal(
      usesFlowerAccent,
      false,
      `${npcId} no debería dibujar con el flowerAccent de ambient-florist-altar`,
    );
  }
});

/*
 * NPC ambientales de Seven Bridges Walk (v1.1, "Paseo de los Siete
 * Puentes"): mismo mecanismo exacto que los 4 de Plaza del Axioma de
 * arriba (renderNpc/drawGenericNpc*, NAMED_NPC_PALETTES), reutilizando el
 * mismo patrón de test render/interacción para cada uno.
 */
const SEVEN_BRIDGES_AMBIENT_NPC_IDS = [
  "ambient-fisher-dock",
  "ambient-riverside-stroller",
  "ambient-bench-watcher",
];

for (const npcId of SEVEN_BRIDGES_AMBIENT_NPC_IDS) {
  test(`${npcId} se dibuja con su propio body/accent de NAMED_NPC_PALETTES, anclado en su posición real de pantalla`, () => {
    const setup = createWorldAt("seven-bridges-walk");
    const object = findObject("seven-bridges-walk", npcId);
    const palette = NAMED_NPC_PALETTES[npcId];

    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const screenX = Math.round(object.x - setup.scene.camera.x);
    const screenY = Math.round(object.y - setup.scene.camera.y);

    const shouldersVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.body &&
        rect.x === screenX + 1 &&
        rect.y === screenY + 7 &&
        rect.width === 12 &&
        rect.height === 2,
    );
    const torsoVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.body &&
        rect.x === screenX + 2 &&
        rect.y === screenY + 9 &&
        rect.width === 10 &&
        rect.height === 5,
    );
    const accentVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.accent &&
        rect.x === screenX + 5 &&
        rect.y === screenY + 9 &&
        rect.width === 4 &&
        rect.height === 2,
    );

    assert.equal(shouldersVisible, true, `${npcId} no dibuja sus hombros`);
    assert.equal(torsoVisible, true, `${npcId} no dibuja su torso`);
    assert.equal(accentVisible, true, `${npcId} no dibuja su palette.accent`);

    const hairShadowVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.hairShadow &&
        rect.x === screenX + 2 &&
        rect.y === screenY - 2 &&
        rect.width === 10 &&
        rect.height === 4,
    );
    const hairFrontVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.hair &&
        rect.x === screenX + 3 &&
        rect.y === screenY - 1 &&
        rect.width === 8 &&
        rect.height === 3,
    );

    assert.equal(
      hairShadowVisible,
      true,
      `${npcId} no dibuja su palette.hairShadow`,
    );
    assert.equal(hairFrontVisible, true, `${npcId} no dibuja su palette.hair`);

    if (palette.eyes) {
      const eyeRects = context.fillRects.filter(
        (rect) =>
          rect.fillStyle === "#302637" &&
          rect.width === 1 &&
          rect.height === 1 &&
          rect.y === screenY + 2 &&
          (rect.x === screenX + 5 || rect.x === screenX + 9),
      );

      assert.equal(eyeRects.length, 2, `${npcId} no dibuja sus dos ojos`);
    }
  });

  test(`interactuar con ${npcId} abre un diálogo de un único turno con su label como speaker, sin tocar GameState`, () => {
    const setup = createWorldAt("seven-bridges-walk");
    const object = findObject("seven-bridges-walk", npcId);
    setup.scene.player.x = object.x + object.width / 2;
    setup.scene.player.y = object.y + object.height / 2;
    setup.input.press("interact");

    const stateBefore = structuredClone(setup.state.toSaveData());
    delete stateBefore.savedAt;

    setup.scene.update(0);

    const stateAfter = structuredClone(setup.state.toSaveData());
    delete stateAfter.savedAt;

    assert.ok(setup.ui.dialogue !== null);
    assert.equal(setup.ui.dialogue.speaker, object.label);
    assert.equal(setup.ui.dialogue.lines.length, 1);
    assert.deepEqual(stateAfter, stateBefore);
  });
}

/*
 * Caña de pescar de ambient-fisher-dock (drawGenericNpcApron, rama nueva al
 * final): color exclusivo (GENERIC_NPC_ROD_COLOR = "#5a4632" en
 * WorldScene.js, no exportado -- se referencia por su valor literal, mismo
 * patrón que GENERIC_NPC_APRON_COLOR = "#e6ded0" en los tests de arriba)
 * que ningún otro NPC genérico debería usar.
 */
// Ambas coordenadas de la caña (context.fillRect(x+1,y+9,2,14) y
// context.fillRect(x-6,y+21,8,2), ver drawGenericNpcApron() en
// WorldScene.js) salen a propósito de la caja de 14x18px del NPC -- este
// margen generoso (todavía muy por debajo de la separación real en pantalla
// entre cualquier par de NPC de este mapa/Plaza) la sigue acotando a la
// posición real de un NPC concreto, para no confundirla con la de otro NPC
// visible en el mismo viewport.
function findRodRectsNear(context, screenX, screenY) {
  return context.fillRects.filter(
    (rect) =>
      rect.fillStyle === "#5a4632" &&
      rect.x >= screenX - 10 &&
      rect.x < screenX + 20 &&
      rect.y >= screenY - 5 &&
      rect.y < screenY + 25,
  );
}

test("ambient-fisher-dock dibuja su caña de pescar con GENERIC_NPC_ROD_COLOR", () => {
  const setup = createWorldAt("seven-bridges-walk");
  const object = findObject("seven-bridges-walk", "ambient-fisher-dock");
  setup.scene.player.x = object.x;
  setup.scene.player.y = object.y;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);

  const rodRects = findRodRectsNear(context, screenX, screenY);

  assert.ok(
    rodRects.length > 0,
    "ambient-fisher-dock no dibuja ningún rect con el color de la caña",
  );
});

test("ningún otro NPC (los 3 nuevos de Seven Bridges Walk ni los 5 de Plaza del Axioma) dibuja con el color de la caña de ambient-fisher-dock", () => {
  const otherSevenBridgesIds = SEVEN_BRIDGES_AMBIENT_NPC_IDS.filter(
    (id) => id !== "ambient-fisher-dock",
  );

  for (const npcId of otherSevenBridgesIds) {
    const setup = createWorldAt("seven-bridges-walk");
    const object = findObject("seven-bridges-walk", npcId);
    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const screenX = Math.round(object.x - setup.scene.camera.x);
    const screenY = Math.round(object.y - setup.scene.camera.y);

    const rodRects = findRodRectsNear(context, screenX, screenY);

    assert.equal(
      rodRects.length,
      0,
      `${npcId} no debería dibujar con el color de la caña de ambient-fisher-dock`,
    );
  }

  for (const npcId of ["plaza-worker", ...AMBIENT_NPC_IDS]) {
    const setup = createWorldAt("axiom-plaza");
    const object = findObject("axiom-plaza", npcId);
    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const rodRects = context.fillRects.filter(
      (rect) => rect.fillStyle === "#5a4632",
    );

    assert.equal(
      rodRects.length,
      0,
      `${npcId} no debería dibujar con el color de la caña de ambient-fisher-dock`,
    );
  }
});

/*
 * NPC ambientales de la Biblioteca del Margen (v1.1): mismo mecanismo
 * exacto que los 4 de Plaza del Axioma y los 3 de Seven Bridges Walk de
 * arriba (renderNpc/drawGenericNpc*, NAMED_NPC_PALETTES), reutilizando el
 * mismo patrón de test render/interacción para cada uno.
 */
const LIBRARY_AMBIENT_NPC_IDS = [
  "ambient-library-reader",
  "ambient-library-assistant",
  "ambient-library-researcher",
];

for (const npcId of LIBRARY_AMBIENT_NPC_IDS) {
  test(`${npcId} se dibuja con su propio body/accent de NAMED_NPC_PALETTES, anclado en su posición real de pantalla`, () => {
    const setup = createWorldAt("library");
    const object = findObject("library", npcId);
    const palette = NAMED_NPC_PALETTES[npcId];

    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const screenX = Math.round(object.x - setup.scene.camera.x);
    const screenY = Math.round(object.y - setup.scene.camera.y);

    const shouldersVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.body &&
        rect.x === screenX + 1 &&
        rect.y === screenY + 7 &&
        rect.width === 12 &&
        rect.height === 2,
    );
    const torsoVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.body &&
        rect.x === screenX + 2 &&
        rect.y === screenY + 9 &&
        rect.width === 10 &&
        rect.height === 5,
    );
    const accentVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.accent &&
        rect.x === screenX + 5 &&
        rect.y === screenY + 9 &&
        rect.width === 4 &&
        rect.height === 2,
    );

    assert.equal(shouldersVisible, true, `${npcId} no dibuja sus hombros`);
    assert.equal(torsoVisible, true, `${npcId} no dibuja su torso`);
    assert.equal(accentVisible, true, `${npcId} no dibuja su palette.accent`);

    const hairShadowVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.hairShadow &&
        rect.x === screenX + 2 &&
        rect.y === screenY - 2 &&
        rect.width === 10 &&
        rect.height === 4,
    );
    const hairFrontVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.hair &&
        rect.x === screenX + 3 &&
        rect.y === screenY - 1 &&
        rect.width === 8 &&
        rect.height === 3,
    );

    assert.equal(
      hairShadowVisible,
      true,
      `${npcId} no dibuja su palette.hairShadow`,
    );
    assert.equal(hairFrontVisible, true, `${npcId} no dibuja su palette.hair`);

    if (palette.eyes) {
      const eyeRects = context.fillRects.filter(
        (rect) =>
          rect.fillStyle === "#302637" &&
          rect.width === 1 &&
          rect.height === 1 &&
          rect.y === screenY + 2 &&
          (rect.x === screenX + 5 || rect.x === screenX + 9),
      );

      assert.equal(eyeRects.length, 2, `${npcId} no dibuja sus dos ojos`);
    }
  });

  test(`interactuar con ${npcId} abre un diálogo de un único turno con su label como speaker, sin tocar GameState`, () => {
    const setup = createWorldAt("library");
    const object = findObject("library", npcId);
    setup.scene.player.x = object.x + object.width / 2;
    setup.scene.player.y = object.y + object.height / 2;
    setup.input.press("interact");

    const stateBefore = structuredClone(setup.state.toSaveData());
    delete stateBefore.savedAt;

    setup.scene.update(0);

    const stateAfter = structuredClone(setup.state.toSaveData());
    delete stateAfter.savedAt;

    assert.ok(setup.ui.dialogue !== null);
    assert.equal(setup.ui.dialogue.speaker, object.label);
    assert.equal(setup.ui.dialogue.lines.length, 1);
    assert.deepEqual(stateAfter, stateBefore);
  });
}

/*
 * Libro de ambient-library-reader (drawGenericNpcApron, rama nueva al
 * final): páginas en GENERIC_NPC_APRON_COLOR ("#e6ded0", ya usado por
 * ambient-setup-helper/ambient-waiter-tables) y lomo en
 * NAMED_NPC_PALETTES["ambient-library-reader"].hairShadow
 * ("#201810") -- combinación exclusiva de este NPC, ningún otro debería
 * dibujar con ese color de lomo en esas coordenadas relativas.
 */
test("ambient-library-reader dibuja las páginas y el lomo de su libro en las coordenadas relativas esperadas", () => {
  const setup = createWorldAt("library");
  const object = findObject("library", "ambient-library-reader");
  setup.scene.player.x = object.x;
  setup.scene.player.y = object.y;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);

  const pagesVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === "#e6ded0" &&
      rect.x === screenX + 9 &&
      rect.y === screenY + 11 &&
      rect.width === 4 &&
      rect.height === 3,
  );
  const spineVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === "#201810" &&
      rect.x === screenX + 9 &&
      rect.y === screenY + 11 &&
      rect.width === 1 &&
      rect.height === 3,
  );

  assert.equal(pagesVisible, true, "ambient-library-reader no dibuja las páginas del libro");
  assert.equal(spineVisible, true, "ambient-library-reader no dibuja el lomo del libro");
});

test("ningún otro NPC (los otros 2 nuevos de library, los 3 de Seven Bridges Walk ni los 5 de Plaza del Axioma) dibuja con el lomo del libro de ambient-library-reader", () => {
  const otherLibraryIds = LIBRARY_AMBIENT_NPC_IDS.filter(
    (id) => id !== "ambient-library-reader",
  );

  for (const npcId of otherLibraryIds) {
    const setup = createWorldAt("library");
    const object = findObject("library", npcId);
    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const screenX = Math.round(object.x - setup.scene.camera.x);
    const screenY = Math.round(object.y - setup.scene.camera.y);

    const spineRects = context.fillRects.filter(
      (rect) =>
        rect.fillStyle === "#201810" &&
        rect.x === screenX + 9 &&
        rect.y === screenY + 11 &&
        rect.width === 1 &&
        rect.height === 3,
    );

    assert.equal(
      spineRects.length,
      0,
      `${npcId} no debería dibujar con el lomo del libro de ambient-library-reader`,
    );
  }

  for (const npcId of SEVEN_BRIDGES_AMBIENT_NPC_IDS) {
    const setup = createWorldAt("seven-bridges-walk");
    const object = findObject("seven-bridges-walk", npcId);
    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const spineRects = context.fillRects.filter(
      (rect) => rect.fillStyle === "#201810",
    );

    assert.equal(
      spineRects.length,
      0,
      `${npcId} no debería dibujar con el lomo del libro de ambient-library-reader`,
    );
  }

  for (const npcId of ["plaza-worker", ...AMBIENT_NPC_IDS]) {
    const setup = createWorldAt("axiom-plaza");
    const object = findObject("axiom-plaza", npcId);
    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const spineRects = context.fillRects.filter(
      (rect) => rect.fillStyle === "#201810",
    );

    assert.equal(
      spineRects.length,
      0,
      `${npcId} no debería dibujar con el lomo del libro de ambient-library-reader`,
    );
  }
});

/*
 * NPC ambientales del Archivo (v1.1): mismo mecanismo exacto que los de
 * Plaza del Axioma/Seven Bridges Walk/Biblioteca de arriba
 * (renderNpc/drawGenericNpc*, NAMED_NPC_PALETTES), reutilizando el mismo
 * patrón de test render/interacción para cada uno.
 */
const ARCHIVE_AMBIENT_NPC_IDS = [
  "ambient-archive-clerk",
  "ambient-archive-researcher",
];

for (const npcId of ARCHIVE_AMBIENT_NPC_IDS) {
  test(`${npcId} se dibuja con su propio body/accent de NAMED_NPC_PALETTES, anclado en su posición real de pantalla`, () => {
    const setup = createWorldAt("archive");
    const object = findObject("archive", npcId);
    const palette = NAMED_NPC_PALETTES[npcId];

    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const screenX = Math.round(object.x - setup.scene.camera.x);
    const screenY = Math.round(object.y - setup.scene.camera.y);

    const shouldersVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.body &&
        rect.x === screenX + 1 &&
        rect.y === screenY + 7 &&
        rect.width === 12 &&
        rect.height === 2,
    );
    const torsoVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.body &&
        rect.x === screenX + 2 &&
        rect.y === screenY + 9 &&
        rect.width === 10 &&
        rect.height === 5,
    );
    const accentVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.accent &&
        rect.x === screenX + 5 &&
        rect.y === screenY + 9 &&
        rect.width === 4 &&
        rect.height === 2,
    );

    assert.equal(shouldersVisible, true, `${npcId} no dibuja sus hombros`);
    assert.equal(torsoVisible, true, `${npcId} no dibuja su torso`);
    assert.equal(accentVisible, true, `${npcId} no dibuja su palette.accent`);

    const hairShadowVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.hairShadow &&
        rect.x === screenX + 2 &&
        rect.y === screenY - 2 &&
        rect.width === 10 &&
        rect.height === 4,
    );
    const hairFrontVisible = context.fillRects.some(
      (rect) =>
        rect.fillStyle === palette.hair &&
        rect.x === screenX + 3 &&
        rect.y === screenY - 1 &&
        rect.width === 8 &&
        rect.height === 3,
    );

    assert.equal(
      hairShadowVisible,
      true,
      `${npcId} no dibuja su palette.hairShadow`,
    );
    assert.equal(hairFrontVisible, true, `${npcId} no dibuja su palette.hair`);

    if (palette.eyes) {
      const eyeRects = context.fillRects.filter(
        (rect) =>
          rect.fillStyle === "#302637" &&
          rect.width === 1 &&
          rect.height === 1 &&
          rect.y === screenY + 2 &&
          (rect.x === screenX + 5 || rect.x === screenX + 9),
      );

      assert.equal(eyeRects.length, 2, `${npcId} no dibuja sus dos ojos`);
    }
  });

  test(`interactuar con ${npcId} abre un diálogo de un único turno con su label como speaker, sin tocar GameState`, () => {
    const setup = createWorldAt("archive");
    const object = findObject("archive", npcId);
    setup.scene.player.x = object.x + object.width / 2;
    setup.scene.player.y = object.y + object.height / 2;
    setup.input.press("interact");

    const stateBefore = structuredClone(setup.state.toSaveData());
    delete stateBefore.savedAt;

    setup.scene.update(0);

    const stateAfter = structuredClone(setup.state.toSaveData());
    delete stateAfter.savedAt;

    assert.ok(setup.ui.dialogue !== null);
    assert.equal(setup.ui.dialogue.speaker, object.label);
    assert.equal(setup.ui.dialogue.lines.length, 1);
    assert.deepEqual(stateAfter, stateBefore);
  });
}

/*
 * Carpeta/expediente de ambient-archive-clerk (drawGenericNpcApron, rama
 * nueva al final): GENERIC_NPC_MANILA_COLOR ("#b5915a", no exportado -- se
 * referencia por su valor literal, mismo patrón ya usado para
 * GENERIC_NPC_APRON_COLOR/GENERIC_NPC_ROD_COLOR en los tests de arriba) es
 * exclusivo de este NPC.
 */
test("ambient-archive-clerk dibuja su carpeta con GENERIC_NPC_MANILA_COLOR", () => {
  const setup = createWorldAt("archive");
  const object = findObject("archive", "ambient-archive-clerk");
  setup.scene.player.x = object.x;
  setup.scene.player.y = object.y;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const folderRects = context.fillRects.filter(
    (rect) => rect.fillStyle === "#b5915a",
  );

  assert.ok(
    folderRects.length > 0,
    "ambient-archive-clerk no dibuja ningún rect con el color de la carpeta",
  );
});

test("ningún otro NPC (el otro nuevo de archive, los 3 de Biblioteca, los 3 de Seven Bridges Walk ni los 5 de Plaza del Axioma) dibuja con el color de la carpeta de ambient-archive-clerk", () => {
  const otherArchiveIds = ARCHIVE_AMBIENT_NPC_IDS.filter(
    (id) => id !== "ambient-archive-clerk",
  );

  // Nota: dentro de "archive" ambos NPC ambientales caben en el mismo
  // viewport, así que render() dibuja a los dos en el mismo frame -- el
  // color de la carpeta de ambient-archive-clerk sigue apareciendo
  // legítimamente en SU PROPIA posición de pantalla aunque el jugador esté
  // junto a ambient-archive-researcher. Por eso este bucle (a diferencia de
  // los de abajo, en mapas donde ningún otro NPC del mismo mapa reutiliza
  // este color) comprueba las coordenadas relativas exactas de la carpeta
  // (screenX+1..6/screenY+12..16) en vez de contar cualquier aparición del
  // color en todo el canvas.
  for (const npcId of otherArchiveIds) {
    const setup = createWorldAt("archive");
    const object = findObject("archive", npcId);
    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const screenX = Math.round(object.x - setup.scene.camera.x);
    const screenY = Math.round(object.y - setup.scene.camera.y);

    const folderRects = context.fillRects.filter(
      (rect) =>
        rect.fillStyle === "#b5915a" &&
        ((rect.x === screenX + 1 &&
          rect.y === screenY + 13 &&
          rect.width === 5 &&
          rect.height === 3) ||
          (rect.x === screenX + 2 &&
            rect.y === screenY + 12 &&
            rect.width === 3 &&
            rect.height === 1)),
    );

    assert.equal(
      folderRects.length,
      0,
      `${npcId} no debería dibujar con el color de la carpeta de ambient-archive-clerk en sus propias coordenadas`,
    );
  }

  for (const npcId of LIBRARY_AMBIENT_NPC_IDS) {
    const setup = createWorldAt("library");
    const object = findObject("library", npcId);
    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const folderRects = context.fillRects.filter(
      (rect) => rect.fillStyle === "#b5915a",
    );

    assert.equal(
      folderRects.length,
      0,
      `${npcId} no debería dibujar con el color de la carpeta de ambient-archive-clerk`,
    );
  }

  for (const npcId of SEVEN_BRIDGES_AMBIENT_NPC_IDS) {
    const setup = createWorldAt("seven-bridges-walk");
    const object = findObject("seven-bridges-walk", npcId);
    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const folderRects = context.fillRects.filter(
      (rect) => rect.fillStyle === "#b5915a",
    );

    assert.equal(
      folderRects.length,
      0,
      `${npcId} no debería dibujar con el color de la carpeta de ambient-archive-clerk`,
    );
  }

  for (const npcId of ["plaza-worker", ...AMBIENT_NPC_IDS]) {
    const setup = createWorldAt("axiom-plaza");
    const object = findObject("axiom-plaza", npcId);
    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const folderRects = context.fillRects.filter(
      (rect) => rect.fillStyle === "#b5915a",
    );

    assert.equal(
      folderRects.length,
      0,
      `${npcId} no debería dibujar con el color de la carpeta de ambient-archive-clerk`,
    );
  }
});

/*
 * Papeles/dossier de ambient-archive-researcher (drawGenericNpcApron, rama
 * nueva al final): sostenidos a la altura del pecho, en su propio
 * palette.accent ("#8a95a8") -- posición y orientación distintas del libro
 * de ambient-library-reader (cadera, x+9/y+11), ver el comentario junto a
 * la rama en WorldScene.js.
 */
test("ambient-archive-researcher dibuja su dossier en las coordenadas relativas esperadas, distintas del libro de ambient-library-reader", () => {
  const setup = createWorldAt("archive");
  const object = findObject("archive", "ambient-archive-researcher");
  setup.scene.player.x = object.x;
  setup.scene.player.y = object.y;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);

  const papersVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === "#8a95a8" &&
      rect.x === screenX + 1 &&
      rect.y === screenY + 8 &&
      rect.width === 4 &&
      rect.height === 3,
  );
  const bindingVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === "#392f3f" &&
      rect.x === screenX + 1 &&
      rect.y === screenY + 8 &&
      rect.width === 4 &&
      rect.height === 1,
  );

  assert.equal(
    papersVisible,
    true,
    "ambient-archive-researcher no dibuja los papeles del dossier",
  );
  assert.equal(
    bindingVisible,
    true,
    "ambient-archive-researcher no dibuja la línea de encuadernación del dossier",
  );
});

test("ningún otro NPC dibuja con la línea de encuadernación del dossier de ambient-archive-researcher en sus coordenadas relativas", () => {
  const otherArchiveIds = ARCHIVE_AMBIENT_NPC_IDS.filter(
    (id) => id !== "ambient-archive-researcher",
  );

  const matchesBinding = (context, screenX, screenY) =>
    context.fillRects.some(
      (rect) =>
        rect.fillStyle === "#392f3f" &&
        rect.x === screenX + 1 &&
        rect.y === screenY + 8 &&
        rect.width === 4 &&
        rect.height === 1,
    );

  for (const npcId of otherArchiveIds) {
    const setup = createWorldAt("archive");
    const object = findObject("archive", npcId);
    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const screenX = Math.round(object.x - setup.scene.camera.x);
    const screenY = Math.round(object.y - setup.scene.camera.y);

    assert.equal(
      matchesBinding(context, screenX, screenY),
      false,
      `${npcId} no debería dibujar con la línea de encuadernación del dossier de ambient-archive-researcher`,
    );
  }

  for (const npcId of LIBRARY_AMBIENT_NPC_IDS) {
    const setup = createWorldAt("library");
    const object = findObject("library", npcId);
    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const screenX = Math.round(object.x - setup.scene.camera.x);
    const screenY = Math.round(object.y - setup.scene.camera.y);

    assert.equal(
      matchesBinding(context, screenX, screenY),
      false,
      `${npcId} no debería dibujar con la línea de encuadernación del dossier de ambient-archive-researcher`,
    );
  }

  for (const npcId of SEVEN_BRIDGES_AMBIENT_NPC_IDS) {
    const setup = createWorldAt("seven-bridges-walk");
    const object = findObject("seven-bridges-walk", npcId);
    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const screenX = Math.round(object.x - setup.scene.camera.x);
    const screenY = Math.round(object.y - setup.scene.camera.y);

    assert.equal(
      matchesBinding(context, screenX, screenY),
      false,
      `${npcId} no debería dibujar con la línea de encuadernación del dossier de ambient-archive-researcher`,
    );
  }

  for (const npcId of ["plaza-worker", ...AMBIENT_NPC_IDS]) {
    const setup = createWorldAt("axiom-plaza");
    const object = findObject("axiom-plaza", npcId);
    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const screenX = Math.round(object.x - setup.scene.camera.x);
    const screenY = Math.round(object.y - setup.scene.camera.y);

    assert.equal(
      matchesBinding(context, screenX, screenY),
      false,
      `${npcId} no debería dibujar con la línea de encuadernación del dossier de ambient-archive-researcher`,
    );
  }
});

/*
 * plaza-worker: cobertura dedicada del pulido visual (ojos + pelo +
 * hombros/torso/accent) que ahora recibe el mismo render genérico
 * (renderNpc) que los 4 NPC ambientales, sin que cambie su posición,
 * colisión ni diálogo. plaza-worker nunca tuvo delantal, y sigue sin
 * tenerlo (no se inventa uno nuevo).
 */
test("plaza-worker se dibuja con ojos en las mismas coordenadas relativas que los NPC ambientales", () => {
  const setup = createWorldAt("axiom-plaza");
  const object = findObject("axiom-plaza", "plaza-worker");

  setup.scene.player.x = object.x;
  setup.scene.player.y = object.y;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);

  const eyeRects = context.fillRects.filter(
    (rect) =>
      rect.fillStyle === "#302637" &&
      rect.width === 1 &&
      rect.height === 1 &&
      rect.y === screenY + 2 &&
      (rect.x === screenX + 5 || rect.x === screenX + 9),
  );

  assert.equal(eyeRects.length, 2, "plaza-worker no dibuja sus dos ojos");
});

test("plaza-worker se dibuja con el pelo trasero (hairShadow) y frontal (hair) de NAMED_NPC_PALETTES['plaza-worker']", () => {
  const setup = createWorldAt("axiom-plaza");
  const object = findObject("axiom-plaza", "plaza-worker");
  const palette = NAMED_NPC_PALETTES["plaza-worker"];

  setup.scene.player.x = object.x;
  setup.scene.player.y = object.y;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);

  const hairShadowVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === palette.hairShadow &&
      rect.x === screenX + 2 &&
      rect.y === screenY - 2 &&
      rect.width === 10 &&
      rect.height === 4,
  );
  const hairFrontVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === palette.hair &&
      rect.x === screenX + 3 &&
      rect.y === screenY - 1 &&
      rect.width === 8 &&
      rect.height === 3,
  );

  assert.equal(
    hairShadowVisible,
    true,
    "plaza-worker no dibuja su palette.hairShadow",
  );
  assert.equal(hairFrontVisible, true, "plaza-worker no dibuja su palette.hair");
});

test("plaza-worker sigue dibujando su body/accent en la misma posición exacta que antes", () => {
  const setup = createWorldAt("axiom-plaza");
  const object = findObject("axiom-plaza", "plaza-worker");
  const palette = NAMED_NPC_PALETTES["plaza-worker"];

  setup.scene.player.x = object.x;
  setup.scene.player.y = object.y;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);

  const shouldersVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === palette.body &&
      rect.x === screenX + 1 &&
      rect.y === screenY + 7 &&
      rect.width === 12 &&
      rect.height === 2,
  );
  const torsoVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === palette.body &&
      rect.x === screenX + 2 &&
      rect.y === screenY + 9 &&
      rect.width === 10 &&
      rect.height === 5,
  );
  const accentVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === palette.accent &&
      rect.x === screenX + 5 &&
      rect.y === screenY + 9 &&
      rect.width === 4 &&
      rect.height === 2,
  );

  assert.equal(shouldersVisible, true, "plaza-worker no dibuja sus hombros");
  assert.equal(torsoVisible, true, "plaza-worker no dibuja su torso");
  assert.equal(accentVisible, true, "plaza-worker no dibuja su palette.accent");
});

test("plaza-worker no dibuja ningún delantal (nunca lo tuvo)", () => {
  const setup = createWorldAt("axiom-plaza");
  const object = findObject("axiom-plaza", "plaza-worker");
  setup.scene.player.x = object.x;
  setup.scene.player.y = object.y;
  setup.scene.update(0);

  const context = new FakeCanvasContext();
  setup.scene.render(context);

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);

  // Acotado a la propia caja del NPC (14x18px desde screenX/screenY): el
  // resto del canvas puede contener a otros NPC ambientales con delantal
  // real (#e6ded0) dentro del mismo viewport.
  const apronBand = context.fillRects.some(
    (rect) =>
      rect.fillStyle === "#e6ded0" &&
      rect.x >= screenX &&
      rect.x < screenX + 14 &&
      rect.y >= screenY - 2 &&
      rect.y < screenY + 18,
  );

  assert.equal(apronBand, false, "plaza-worker no debería dibujar un delantal");
});

/*
 * Cobertura estructural y objetiva de "no bloque" (segunda ronda de
 * refinamiento visual): en vez de juzgar subjetivamente el resultado,
 * estos tests comprueban tres propiedades geométricas concretas para
 * cada uno de los 5 NPC que usan el render genérico -- hombros más
 * anchos que la fila de piernas, brazos cortos (no pegados a toda la
 * altura del torso) y un hueco real (un rect NPC_SILHOUETTE) entre dos
 * rects de pierna con x distintos.
 */
const GENERIC_NPC_IDS = ["plaza-worker", ...AMBIENT_NPC_IDS];

for (const npcId of GENERIC_NPC_IDS) {
  test(`${npcId}: la fila de hombros es más ancha que la fila de piernas, los brazos son cortos y hay un hueco real entre las piernas`, () => {
    const setup = createWorldAt("axiom-plaza");
    const object = findObject("axiom-plaza", npcId);
    const palette = NAMED_NPC_PALETTES[npcId];

    setup.scene.player.x = object.x;
    setup.scene.player.y = object.y;
    setup.scene.update(0);

    const context = new FakeCanvasContext();
    setup.scene.render(context);

    const screenX = Math.round(object.x - setup.scene.camera.x);
    const screenY = Math.round(object.y - setup.scene.camera.y);

    // height === 2 aísla el rect de "hombros" (drawGenericNpcBody) del
    // rect de contorno hombros->cintura de drawGenericNpcOutline (que
    // también empieza en y+7 pero mide 8px de alto): sin este filtro, el
    // contorno de fondo sesgaría la comparación agregada.
    const shoulderRowWidth = context.fillRects
      .filter((rect) => rect.y === screenY + 7 && rect.height === 2)
      .reduce((total, rect) => total + rect.width, 0);

    // Mismo razonamiento para la fila de piernas: height === 2 aísla las
    // dos piernas (accent) y el hueco (NPC_SILHOUETTE) del rect de
    // contorno piernas->zapato (también en y+15, pero de 3px de alto).
    const legRowRects = context.fillRects.filter(
      (rect) => rect.y === screenY + 15 && rect.height === 2,
    );
    const legRowWidth = legRowRects.reduce(
      (total, rect) => total + rect.width,
      0,
    );

    assert.ok(
      shoulderRowWidth > legRowWidth,
      `${npcId}: la fila de hombros (${shoulderRowWidth}px) no es más ancha que la fila de piernas (${legRowWidth}px)`,
    );

    const armRects = context.fillRects.filter(
      (rect) =>
        rect.fillStyle === palette.body &&
        (rect.x === screenX + 0 || rect.x === screenX + 12) &&
        rect.y === screenY + 9,
    );

    assert.equal(armRects.length, 2, `${npcId}: no hay exactamente dos rects de brazo`);
    for (const armRect of armRects) {
      assert.ok(
        armRect.height <= 4,
        `${npcId}: un brazo cubre toda la altura del torso (${armRect.height}px)`,
      );
    }

    const gapRect = legRowRects.find((rect) => rect.fillStyle === "#302637");
    const legFillRects = legRowRects.filter(
      (rect) => rect.fillStyle === palette.accent,
    );

    assert.ok(gapRect, `${npcId}: no hay hueco real entre las piernas`);
    assert.equal(
      legFillRects.length,
      2,
      `${npcId}: no hay exactamente dos rects de pierna`,
    );
    assert.notEqual(
      legFillRects[0].x,
      legFillRects[1].x,
      `${npcId}: los dos rects de pierna comparten la misma x`,
    );
    assert.ok(
      (legFillRects[0].x < gapRect.x && gapRect.x < legFillRects[1].x) ||
        (legFillRects[1].x < gapRect.x && gapRect.x < legFillRects[0].x),
      `${npcId}: el hueco no está estrictamente entre las dos piernas`,
    );
  });
}

test("plaza-worker mantiene exactamente su id/x/y/width/height/interactionRadius/label de antes", () => {
  const object = findObject("axiom-plaza", "plaza-worker");

  assert.deepEqual(object, {
    id: "plaza-worker",
    type: "npc",
    x: 224,
    y: 240,
    width: 14,
    height: 18,
    interactionRadius: 28,
    label: "Ayudante de la ceremonia",
  });
});

test("render() con giftCodeSolved dibuja el color de pelo oscuro de Elena tantas veces como pixeles de ese tono tiene su propio sprite", () => {
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

  // ELENA_PALETTE.d (pelo oscuro) reutiliza el mismo valor hexadecimal
  // que BRIDE_PALETTE.hair a propósito (ver elenaPixelArt.js), así que
  // este filtro sigue capturando los pixeles de pelo oscuro del sprite
  // indexado -- ahora uno por pixel en vez de en 3 rects grandes.
  assert.equal(hairRects.length, countSymbolInPixels(ELENA_FRONT_PIXELS, "d"));
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

test("mayor-corolaria (Corolaria) usa varios tonos distintos de COROLARIA_PALETTE, no un único color de bloque", () => {
  const setup = createWorldAt("axiom-plaza");
  const context = new FakeCanvasContext();

  setup.scene.render(context);

  // Corolaria Character Pixel-Art: mismo razonamiento que el test
  // equivalente de Elena justo más abajo -- el sprite indexado se
  // rasteriza pixel a pixel (un fillRect de 1x1 por símbolo no
  // transparente), así que "varios rects de silueta con ancho variable"
  // ya no aplica (ese contrato era del render geométrico anterior). Se
  // comprueba en su lugar que el conjunto de colores realmente usados
  // cubre toda la paleta declarada.
  const corolariaColors = new Set(
    context.fillRects
      .filter((rect) =>
        Object.values(COROLARIA_PALETTE).includes(rect.fillStyle),
      )
      .map((rect) => rect.fillStyle),
  );

  assert.equal(corolariaColors.size, Object.keys(COROLARIA_PALETTE).length);
});

test("mayor-corolaria se dibuja con CorolariaRenderer, anclado en su posición real de pantalla", () => {
  const setup = createWorldAt("axiom-plaza");
  const object = findObject("axiom-plaza", "mayor-corolaria");
  const context = new FakeCanvasContext();

  setup.scene.render(context);

  // Se ancla a un pixel de piel concreto del sprite indexado (fila 3,
  // columna 4 de COROLARIA_FRONT_PIXELS = "k") en vez de a un rect de
  // silueta de fondo, porque la geometría exacta del contorno es una
  // decisión cosmética que puede ajustarse sin que este test deba
  // cambiar -- mismo patrón que los tests de anclaje de Elena/Gonzalo.
  assert.equal(COROLARIA_FRONT_PIXELS[3][4], "k");

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);

  const skinVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === COROLARIA_PALETTE.k &&
      rect.x === screenX + 4 &&
      rect.y === screenY + 3 &&
      rect.width === 1 &&
      rect.height === 1,
  );

  assert.equal(skinVisible, true);
});

test("la base inferior de Corolaria (mayor-corolaria) es tan ancha como su línea de hombros, sin ensancharse como la falda de Elena", () => {
  const setup = createWorldAt("axiom-plaza");
  const object = findObject("axiom-plaza", "mayor-corolaria");
  const context = new FakeCanvasContext();

  setup.scene.render(context);

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);
  const corolariaColors = new Set(Object.values(COROLARIA_PALETTE));

  const rowSpanAt = (row) => {
    // Filtra también por rango de X propio de Corolaria (su sprite mide
    // 14 columnas): algunos símbolos de COROLARIA_PALETTE (piel, calzado)
    // reutilizan a propósito el mismo hex que otros personajes cercanos
    // en axiom-plaza (p.ej. el Padre de la novia), así que filtrar solo
    // por color e Y podría capturar pixeles ajenos que caen en la misma
    // fila absoluta de pantalla.
    const xs = context.fillRects
      .filter(
        (rect) =>
          rect.y === screenY + row &&
          corolariaColors.has(rect.fillStyle) &&
          rect.x >= screenX &&
          rect.x < screenX + 14,
      )
      .map((rect) => rect.x - screenX);

    assert.ok(xs.length > 0, `no se dibujó ningún pixel de Corolaria en la fila ${row}`);
    return Math.max(...xs) - Math.min(...xs) + 1;
  };

  // Fila 9 (línea de hombros) y fila 17 (base del vestido) en
  // COROLARIA_FRONT_PIXELS -- ver corolariaPixelArt.js.
  assert.equal(rowSpanAt(17), rowSpanAt(9));
});

test("bride-father (Padre de la novia) usa varios tonos distintos de BRIDE_FATHER_PIXEL_PALETTE, no un único color de bloque", () => {
  const setup = createWorldAt("axiom-plaza");
  const context = new FakeCanvasContext();

  setup.scene.render(context);

  // Bride Father Character Pixel-Art: mismo razonamiento que los tests
  // equivalentes de Elena/Corolaria justo más abajo -- el sprite indexado
  // se rasteriza pixel a pixel (un fillRect de 1x1 por símbolo no
  // transparente), así que "varios rects de silueta con ancho variable"
  // ya no aplica (ese contrato era del render geométrico anterior). Se
  // comprueba en su lugar que el conjunto de colores realmente usados
  // cubre toda la paleta declarada.
  const brideFatherColors = new Set(
    context.fillRects
      .filter((rect) =>
        Object.values(BRIDE_FATHER_PIXEL_PALETTE).includes(rect.fillStyle),
      )
      .map((rect) => rect.fillStyle),
  );

  assert.equal(
    brideFatherColors.size,
    Object.keys(BRIDE_FATHER_PIXEL_PALETTE).length,
  );
});

test("bride-father se dibuja con BrideFatherRenderer, anclado en su posición real de pantalla", () => {
  const setup = createWorldAt("axiom-plaza");
  const object = findObject("axiom-plaza", "bride-father");
  const context = new FakeCanvasContext();

  setup.scene.render(context);

  // Se ancla a un pixel de piel concreto del sprite indexado (fila 4,
  // columna 4 de BRIDE_FATHER_FRONT_PIXELS = "k") en vez de a un rect de
  // silueta de fondo, porque la geometría exacta del contorno es una
  // decisión cosmética que puede ajustarse sin que este test deba
  // cambiar -- mismo patrón que los tests de anclaje de Elena/Corolaria/
  // Gonzalo.
  assert.equal(BRIDE_FATHER_FRONT_PIXELS[4][4], "k");

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);

  const skinVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === BRIDE_FATHER_PIXEL_PALETTE.k &&
      rect.x === screenX + 4 &&
      rect.y === screenY + 4 &&
      rect.width === 1 &&
      rect.height === 1,
  );

  assert.equal(skinVisible, true);
});

test("el torso de bride-father (fila 10) ocupa las 14 columnas del sprite, sin margen transparente -- presencia robusta, más ancho que el de Gonzalo", () => {
  const setup = createWorldAt("axiom-plaza");
  const object = findObject("axiom-plaza", "bride-father");
  const context = new FakeCanvasContext();

  setup.scene.render(context);

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);
  const brideFatherColors = new Set(Object.values(BRIDE_FATHER_PIXEL_PALETTE));

  // Filtra también por rango de X propio del Padre (su sprite mide 14
  // columnas): algunos símbolos de BRIDE_FATHER_PIXEL_PALETTE (piel,
  // calzado) reutilizan a propósito el mismo hex que otros personajes
  // cercanos en axiom-plaza, así que filtrar solo por color e Y podría
  // capturar pixeles ajenos que caen en la misma fila absoluta de
  // pantalla -- ver el mismo ajuste en el test equivalente de Corolaria.
  const shoulderRowXs = context.fillRects
    .filter(
      (rect) =>
        rect.y === screenY + 10 &&
        brideFatherColors.has(rect.fillStyle) &&
        rect.x >= screenX &&
        rect.x < screenX + 14,
    )
    .map((rect) => rect.x - screenX);

  assert.ok(shoulderRowXs.length > 0, "no se dibujó ningún pixel en la fila 10");
  assert.equal(Math.max(...shoulderRowXs) - Math.min(...shoulderRowXs) + 1, 14);
});

test("library-silogio (Silogio) usa varios tonos distintos de SILOGIO_PIXEL_PALETTE, no un único color de bloque", () => {
  const setup = createWorldAt("library");
  const context = new FakeCanvasContext();

  setup.scene.render(context);

  // Silogio Character Pixel-Art: mismo razonamiento que los tests
  // equivalentes de Elena/Corolaria/Padre más abajo -- el sprite indexado
  // se rasteriza pixel a pixel (un fillRect de 1x1 por símbolo no
  // transparente), así que "varios rects de silueta con ancho variable"
  // ya no aplica (ese contrato era del render geométrico anterior). Se
  // comprueba en su lugar que el conjunto de colores realmente usados
  // cubre toda la paleta declarada.
  const silogioColors = new Set(
    context.fillRects
      .filter((rect) =>
        Object.values(SILOGIO_PIXEL_PALETTE).includes(rect.fillStyle),
      )
      .map((rect) => rect.fillStyle),
  );

  assert.equal(
    silogioColors.size,
    Object.keys(SILOGIO_PIXEL_PALETTE).length,
  );
});

test("library-silogio se dibuja con SilogioRenderer, anclado en su posición real de pantalla", () => {
  const setup = createWorldAt("library");
  const object = findObject("library", "library-silogio");
  const context = new FakeCanvasContext();

  setup.scene.render(context);

  // Se ancla a un pixel de piel concreto del sprite indexado (fila 3,
  // columna 5 de SILOGIO_FRONT_PIXELS = "h", frente resaltada) en vez de
  // a un rect de silueta de fondo, porque la geometría exacta del
  // contorno es una decisión cosmética que puede ajustarse sin que este
  // test deba cambiar -- mismo patrón que los tests de anclaje de
  // Elena/Corolaria/Padre/Gonzalo.
  assert.equal(SILOGIO_FRONT_PIXELS[3][5], "h");

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);

  const highlightVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === SILOGIO_PIXEL_PALETTE.h &&
      rect.x === screenX + 5 &&
      rect.y === screenY + 3 &&
      rect.width === 1 &&
      rect.height === 1,
  );

  assert.equal(highlightVisible, true);
});

test("el abrigo de Silogio (filas 10-19, hombros hasta dobladillo) nunca es más ancho que su cabeza (fila 3) en el render real -- silueta estrecha y vertical", () => {
  const setup = createWorldAt("library");
  const object = findObject("library", "library-silogio");
  const context = new FakeCanvasContext();

  setup.scene.render(context);

  const screenX = Math.round(object.x - setup.scene.camera.x);
  const screenY = Math.round(object.y - setup.scene.camera.y);
  const silogioColors = new Set(Object.values(SILOGIO_PIXEL_PALETTE));

  const rowSpanAt = (row) => {
    // Acota también por rango de X propio de Silogio (su sprite mide 14
    // columnas): algunos símbolos de SILOGIO_PIXEL_PALETTE (piel,
    // calzado) reutilizan a propósito el mismo hex que otros personajes,
    // así que filtrar solo por color e Y podría capturar pixeles ajenos
    // si en el futuro otro NPC coincidiera en la misma fila absoluta de
    // pantalla -- misma cautela aplicada a los tests de Corolaria/Padre.
    const xs = context.fillRects
      .filter(
        (rect) =>
          rect.y === screenY + row &&
          silogioColors.has(rect.fillStyle) &&
          rect.x >= screenX &&
          rect.x < screenX + 14,
      )
      .map((rect) => rect.x - screenX);

    assert.ok(xs.length > 0, `no se dibujó ningún pixel de Silogio en la fila ${row}`);
    return Math.max(...xs) - Math.min(...xs) + 1;
  };

  const headSpan = rowSpanAt(3);

  for (let row = 10; row <= 19; row += 1) {
    assert.equal(
      rowSpanAt(row),
      headSpan,
      `fila ${row}: el abrigo no debe ser más ancho que la cabeza`,
    );
  }
});

test("Elena (bride-epilogue) usa varios tonos distintos (pelo, piel, vestido, calzado, contorno), no un único color de bloque", () => {
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

  // El sprite indexado de Elena se rasteriza pixel a pixel (un fillRect
  // de 1x1 por símbolo no transparente, ver ELENA_FRONT_PIXELS), así que
  // ya no tiene sentido comprobar "varios rects de silueta con ancho
  // variable" (ese contrato era del render geométrico anterior). En su
  // lugar se comprueba que el conjunto de colores realmente usados
  // cubre toda la paleta declarada -- prueba de que es un sprite con
  // detalle real, no un bloque plano de 1-2 colores.
  const elenaColors = new Set(
    context.fillRects
      .filter((rect) => Object.values(ELENA_PALETTE).includes(rect.fillStyle))
      .map((rect) => rect.fillStyle),
  );

  assert.equal(elenaColors.size, Object.keys(ELENA_PALETTE).length);
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
    audio: new FakeAudioService(),
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
  // que bride-epilogue (Elena) se dibuja de verdad en su posición real de
  // pantalla, calculada a partir del estado real de la cámara. Se ancla a
  // un pixel de piel concreto del sprite indexado (fila 4, columna 4 de
  // ELENA_FRONT_PIXELS = "k") en vez de a un rect de silueta de fondo,
  // porque la geometría exacta del contorno es una decisión cosmética que
  // puede ajustarse sin que este test deba cambiar -- mismo patrón que
  // los tests de anclaje de Gonzalo en tests/world/Player.test.js.
  assert.equal(ELENA_FRONT_PIXELS[4][4], "k");

  const brideScreenX = Math.round(bride.x - scene.camera.x);
  const brideScreenY = Math.round(bride.y - scene.camera.y);
  const brideSkinVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === ELENA_PALETTE.k &&
      rect.x === brideScreenX + 4 &&
      rect.y === brideScreenY + 4 &&
      rect.width === 1 &&
      rect.height === 1,
  );

  assert.equal(brideSkinVisible, true);
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
      text.includes(`Acércate a ${PARTNER_NAME} en la Plaza.`),
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
  const audio = new FakeAudioService();
  const scene = new WorldScene({
    scenes,
    input,
    storage: new FakeStorage({ loadResult: saved }),
    state,
    ui,
    audio,
  });

  scene.enter({ restoreFromState: true });
  scene.update(0);

  assert.deepEqual(scenes.changes, []);
  assert.equal(state.scene, "world");
  assert.equal(state.world.currentMapId, "axiom-plaza");
  assert.deepEqual(audio.playMusicCalls, []);
  assert.equal(audio.stopMusicCalls, 1);
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
    audio: new FakeAudioService(),
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

test("interactuar con un objeto válido cercano dispara playSfx(INTERACT_SFX_PATH) exactamente una vez", () => {
  const setup = createWorldAt("library");
  const silogio = findObject("library", "library-silogio");
  setup.scene.player.x = silogio.x + silogio.width / 2;
  setup.scene.player.y = silogio.y + silogio.height / 2;
  setup.input.press("interact");

  setup.scene.update(0);

  assert.deepEqual(setup.audio.playSfxCalls, [INTERACT_SFX_PATH]);
});

test("pulsar interactuar sin ningún objeto cercano no dispara nada", () => {
  const setup = createWorldAt("axiom-plaza");
  setup.scene.player.x = -400;
  setup.scene.player.y = -400;
  setup.input.press("interact");

  setup.scene.update(0);

  assert.equal(setup.scene.nearbyObject, null);
  assert.deepEqual(setup.audio.playSfxCalls, []);
});

test("abrir un diálogo de varias líneas y avanzarlo varias veces con interactuar dispara el SFX exactamente una vez en total (solo al abrir)", () => {
  const setup = createWorldAt("axiom-plaza");
  const worker = findObject("axiom-plaza", "plaza-worker");
  setup.scene.player.x = worker.x + worker.width / 2;
  setup.scene.player.y = worker.y + worker.height / 2;
  setup.input.press("interact");

  setup.scene.update(0);

  assert.deepEqual(setup.audio.playSfxCalls, [INTERACT_SFX_PATH]);
  assert.ok(setup.ui.dialogue !== null);
  assert.equal(setup.ui.dialogue.speaker, "Ayudante de la ceremonia");
  assert.deepEqual(setup.ui.dialogue.lines, [
    "He contado las sillas tres veces.",
    "Siempre sobra una, pero nunca es la misma.",
    "La alcaldesa dice que eso no es un problema matemático sino logístico.",
  ]);

  const stateBefore = structuredClone(setup.state.toSaveData());
  delete stateBefore.savedAt;

  for (let i = 0; i < 3; i += 1) {
    setup.input.press("interact");
    setup.scene.update(0);
  }

  const stateAfter = structuredClone(setup.state.toSaveData());
  delete stateAfter.savedAt;

  assert.deepEqual(setup.audio.playSfxCalls, [INTERACT_SFX_PATH]);
  assert.deepEqual(stateAfter, stateBefore);
});

test("moverse sin pulsar interactuar no dispara ningún SFX", () => {
  const setup = createWorldAt("axiom-plaza");

  setup.scene.update(16);

  assert.deepEqual(setup.audio.playSfxCalls, []);
});

/*
 * A partir de aquí: cobertura de MaxCompanion dentro de WorldScene --
 * reposicionamiento en cambios de mapa y cargas, reacciones ligeras en los
 * cuatro momentos aprobados (interacción normal, cambio de mapa, puzle
 * recién resuelto) y ausencia de reacción retrospectiva o por reentrada.
 */

test("tras un cambio de mapa exitoso, maxCompanion queda en el offset correcto respecto al nuevo jugador y con una reacción activa", () => {
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
  assert.ok(setup.scene.maxCompanion instanceof MaxCompanion);
  assert.deepEqual(
    { x: setup.scene.maxCompanion.x, y: setup.scene.maxCompanion.y },
    computeMaxSpawnPosition(setup.scene.player),
  );
  assert.equal(
    setup.scene.maxCompanion.reactionTimer,
    MAX_REACTION_DURATION_SECONDS,
  );
});

test("tras una salida bloqueada, maxCompanion no cambia", () => {
  const setup = createWorldAt("seven-bridges-walk");
  const exit = findObject(
    "seven-bridges-walk",
    "seven-bridges-to-library",
  );
  const maxBefore = setup.scene.maxCompanion;
  const positionBefore = { x: maxBefore.x, y: maxBefore.y };
  const reactionTimerBefore = maxBefore.reactionTimer;

  setup.scene.interactWithExit(exit);

  assert.equal(setup.scene.maxCompanion, maxBefore);
  assert.deepEqual(
    { x: setup.scene.maxCompanion.x, y: setup.scene.maxCompanion.y },
    positionBefore,
  );
  assert.equal(setup.scene.maxCompanion.reactionTimer, reactionTimerBefore);
});

test("enter({restoreFromState: true}) deja maxCompanion definido en el offset correcto, sin NaN ni undefined", () => {
  const seed = new GameState();
  seed.changeMap("library", { x: 216, y: 176, facing: "left" });
  const saved = seed.toSaveData();
  const storage = new FakeStorage({ loadResult: saved });
  const { scene } = createScene(storage);

  scene.enter({ restoreFromState: true });

  assert.ok(scene.maxCompanion instanceof MaxCompanion);
  assert.equal(Number.isFinite(scene.maxCompanion.x), true);
  assert.equal(Number.isFinite(scene.maxCompanion.y), true);
  assert.deepEqual(
    { x: scene.maxCompanion.x, y: scene.maxCompanion.y },
    computeMaxSpawnPosition(scene.player),
  );
});

test("cargar un guardado con un puzle ya resuelto deja reactionTimer en 0 inmediatamente, sin reacción retrospectiva", () => {
  const seed = new GameState();
  seed.puzzles.libraryCatalogue = new LibraryCatalogueState({
    order: ["A", "D", "R", "C", "M"],
    phase: LIBRARY_CATALOGUE_PHASE.SOLVED,
    hintsRead: [1, 2, 3],
    attemptCount: 3,
  });
  const saved = seed.toSaveData();
  const storage = new FakeStorage({ loadResult: saved });
  const { scene } = createScene(storage);

  scene.enter({ restoreFromState: true });

  assert.equal(scene.maxCompanion.reactionTimer, 0);
});

test("la tecla de cargar en pleno juego reposiciona a Max igual que un cambio de mapa", () => {
  const seed = new GameState();
  seed.changeMap("library", { x: 216, y: 176, facing: "down" });
  const saved = seed.toSaveData();
  const storage = new FakeStorage({ loadResult: saved });
  const { scene, input } = createScene(storage);
  scene.enter();

  input.press("load");
  scene.update(0);

  assert.equal(scene.state.world.currentMapId, "library");
  assert.deepEqual(
    { x: scene.maxCompanion.x, y: scene.maxCompanion.y },
    computeMaxSpawnPosition(scene.player),
  );
});

test("interact() sobre un objeto normal activa reactionTimer; sobre una salida (incluso bloqueada) no", () => {
  const setup = createWorldAt("axiom-plaza");
  const normalObject = findObject("axiom-plaza", "preparations-board");

  assert.equal(setup.scene.maxCompanion.reactionTimer, 0);

  setup.scene.interact(normalObject);

  assert.equal(
    setup.scene.maxCompanion.reactionTimer,
    MAX_REACTION_DURATION_SECONDS,
  );

  const blockedSetup = createWorldAt("axiom-plaza");
  const blockedExitObject = findObject(
    "axiom-plaza",
    "plaza-to-seven-bridges",
  );

  assert.equal(blockedSetup.state.flags.sevenBridgesUnlocked, false);
  assert.equal(blockedSetup.scene.maxCompanion.reactionTimer, 0);

  blockedSetup.scene.interact(blockedExitObject);

  assert.equal(blockedSetup.scene.maxCompanion.reactionTimer, 0);
});

test("maxCompanion coincidente con la posición del jugador no lanza excepción ni se desplaza de forma anómala en update()", () => {
  const setup = createWorldAt("axiom-plaza");
  setup.scene.maxCompanion.x = setup.scene.player.x;
  setup.scene.maxCompanion.y = setup.scene.player.y;

  assert.doesNotThrow(() => setup.scene.update(0.1));

  assert.equal(Number.isFinite(setup.scene.maxCompanion.x), true);
  assert.equal(Number.isFinite(setup.scene.maxCompanion.y), true);
  assert.equal(setup.scene.maxCompanion.x, setup.scene.player.x);
  assert.equal(setup.scene.maxCompanion.y, setup.scene.player.y);
});

/*
 * Cobertura aislada de resolveMaxSpawnPosition() con un CollisionMap
 * sintético (sin depender de las coordenadas reales de ningún mapa de
 * worldMaps.js), verificando los tres casos descritos en su comentario:
 * candidato principal libre se usa tal cual, candidato principal bloqueado
 * prueba los siguientes en orden, y el último recurso nunca falla.
 */
function buildCollisionMap({
  width = 30,
  height = 30,
  tileSize = 16,
  solidTileRanges = [],
} = {}) {
  const solidTiles = [];

  for (const { xRange, yRange } of solidTileRanges) {
    for (let tileY = yRange[0]; tileY <= yRange[1]; tileY += 1) {
      for (let tileX = xRange[0]; tileX <= xRange[1]; tileX += 1) {
        solidTiles.push(tileY * width + tileX);
      }
    }
  }

  return new CollisionMap({ width, height, tileSize, solidTiles });
}

test("resolveMaxSpawnPosition() usa el candidato principal tal cual cuando no colisiona", () => {
  const player = { x: 200, y: 200, facing: "down" };
  const collisionMap = buildCollisionMap();

  const result = resolveMaxSpawnPosition(player, collisionMap);

  assert.deepEqual(result, computeMaxSpawnPosition(player));
});

test("resolveMaxSpawnPosition() prueba los siguientes candidatos, en orden, cuando los anteriores colisionan", () => {
  const player = { x: 200, y: 200, facing: "down" };

  /*
   * Con player en (200, 200), facing "down", y MAX_FOLLOW_MIN_DISTANCE
   * (31), los tiles (tileSize 16) ocupados por cada candidato son:
   *   1. normal (norte, y-31=169):     x[11,13] y[10,11]
   *   2. opuesto (sur, y+31=231):      x[11,13] y[13,14]
   *   3. lateral izquierda (x+31=231): x[13,15] y[11,13]
   *   4. lateral derecha (x-31=169):   x[9,11]  y[11,13]
   * (12,10) solo pertenece al footprint del candidato 1; (12,14) solo al
   * del candidato 2 -- ninguno de los dos se solapa con el footprint del
   * candidato 3, así que sirven para bloquear un candidato sin afectar al
   * siguiente que debería elegirse.
   */

  // Solo el candidato principal (1) bloqueado -- el resto del mapa libre.
  const primaryBlocked = buildCollisionMap({
    solidTileRanges: [{ xRange: [12, 12], yRange: [10, 10] }],
  });

  assert.deepEqual(
    resolveMaxSpawnPosition(player, primaryBlocked),
    { x: player.x, y: player.y + MAX_FOLLOW_MIN_DISTANCE }, // opuesto (up)
  );

  // Candidatos 1 y 2 bloqueados: debe caer al primer lateral (candidato 3).
  const primaryAndOppositeBlocked = buildCollisionMap({
    solidTileRanges: [
      { xRange: [12, 12], yRange: [10, 10] },
      { xRange: [12, 12], yRange: [14, 14] },
    ],
  });

  assert.deepEqual(
    resolveMaxSpawnPosition(player, primaryAndOppositeBlocked),
    { x: player.x + MAX_FOLLOW_MIN_DISTANCE, y: player.y }, // lateral izquierda
  );
});

function getMaxCollisionBoxForTest(position) {
  return {
    x: position.x - MAX_HITBOX_DIMENSIONS.width / 2,
    y: position.y - MAX_HITBOX_DIMENSIONS.height / 2,
    width: MAX_HITBOX_DIMENSIONS.width,
    height: MAX_HITBOX_DIMENSIONS.height,
  };
}

const RING_2_DIAGONAL_OFFSET = Math.ceil(
  MAX_FOLLOW_MIN_DISTANCE / Math.SQRT2,
);
const RING_3_DISTANCE = MAX_FOLLOW_MIN_DISTANCE * 2;

/*
 * Bloquea los cuatro candidatos del anillo 1 alrededor de player=(200,200)
 * con un tile aislado dentro de cada footprint -- no con el rectángulo que
 * los envuelve a todos, porque ese rectángulo también cubriría, de forma
 * no intencionada, los footprints (más cercanos al jugador) de los cuatro
 * candidatos diagonales del anillo 2. Mismos tiles que ya usaba el test
 * "prueba los siguientes candidatos" de más arriba para (12,10)/(12,14);
 * (14,12) y (10,12) aíslan del mismo modo los candidatos laterales.
 */
const RING_1_BLOCK = [
  { xRange: [12, 12], yRange: [10, 10] },
  { xRange: [12, 12], yRange: [14, 14] },
  { xRange: [14, 14], yRange: [12, 12] },
  { xRange: [10, 10], yRange: [12, 12] },
];

// Cubre, con cuatro rectángulos, los footprints de los cuatro candidatos
// diagonales del anillo 2 alrededor de player=(200,200) -- ver el cálculo
// en el comentario de computeMaxSpawnCandidates() en MaxCompanion.js.
const RING_2_BLOCK = [
  { xRange: [13, 14], yRange: [10, 11] },
  { xRange: [10, 11], yRange: [10, 11] },
  { xRange: [13, 14], yRange: [13, 14] },
  { xRange: [10, 11], yRange: [13, 14] },
];

// Cubre los footprints de los cuatro candidatos cardinales lejanos del
// anillo 3 alrededor de player=(200,200).
const RING_3_BLOCK = [
  { xRange: [11, 13], yRange: [8, 9] },
  { xRange: [11, 13], yRange: [15, 16] },
  { xRange: [7, 9], yRange: [11, 13] },
  { xRange: [15, 17], yRange: [11, 13] },
];

// Cubre, además de los tres anillos, el footprint del último candidato
// local (la posición exacta del jugador).
const ALL_LOCAL_CANDIDATES_BLOCK = [
  ...RING_1_BLOCK,
  ...RING_2_BLOCK,
  ...RING_3_BLOCK,
  { xRange: [11, 13], yRange: [11, 13] },
];

test("resolveMaxSpawnPosition() cae al segundo anillo (diagonal) cuando los cuatro candidatos del primer anillo colisionan", () => {
  const player = { x: 200, y: 200, facing: "down" };
  const ring1Blocked = buildCollisionMap({
    solidTileRanges: RING_1_BLOCK,
  });

  assert.deepEqual(resolveMaxSpawnPosition(player, ring1Blocked), {
    x: player.x + RING_2_DIAGONAL_OFFSET,
    y: player.y - RING_2_DIAGONAL_OFFSET,
  });
});

test("resolveMaxSpawnPosition() cae al tercer anillo (cardinales lejanos) cuando también el segundo anillo colisiona entero", () => {
  const player = { x: 200, y: 200, facing: "down" };
  const ring1And2Blocked = buildCollisionMap({
    solidTileRanges: [...RING_1_BLOCK, ...RING_2_BLOCK],
  });

  assert.deepEqual(resolveMaxSpawnPosition(player, ring1And2Blocked), {
    x: player.x,
    y: player.y - RING_3_DISTANCE,
  });
});

/*
 * Contrato reforzado: resolveMaxSpawnPosition() solo puede devolver una
 * posición cuyo bounding box completo de Max (MAX_HITBOX_DIMENSIONS) haya sido
 * validado como libre por el CollisionMap real -- nunca una posición que
 * el propio CollisionMap marca como colisionante. Se verifica sobre varios
 * mapas sintéticos distintos, incluido el caso patológico de los 13
 * candidatos locales bloqueados a la vez, en vez de confiar en un único
 * escenario feliz.
 */
test("resolveMaxSpawnPosition() nunca devuelve una posición que el CollisionMap marque como colisionante", () => {
  const player = { x: 200, y: 200, facing: "down" };
  const scenarios = [
    buildCollisionMap(),
    buildCollisionMap({ solidTileRanges: RING_1_BLOCK }),
    buildCollisionMap({ solidTileRanges: [...RING_1_BLOCK, ...RING_2_BLOCK] }),
    buildCollisionMap({ solidTileRanges: ALL_LOCAL_CANDIDATES_BLOCK }),
  ];

  for (const collisionMap of scenarios) {
    const result = resolveMaxSpawnPosition(player, collisionMap);

    if (result !== null) {
      assert.equal(
        collisionMap.collides(getMaxCollisionBoxForTest(result)),
        false,
        `resolveMaxSpawnPosition() devolvió una posición colisionante: ${JSON.stringify(result)}`,
      );
    }
  }
});

/*
 * Caso límite explícito: si los 13 candidatos locales colisionan y no hay
 * ninguna posición previa de Max que probar (reconstrucción inicial, sin
 * instancia previa), resolveMaxSpawnPosition() devuelve `null` en vez de
 * fabricar una posición que sabe que colisiona. WorldScene.setupCurrentMap()
 * no dibuja a Max ese ciclo en ese caso (ver this.maxCompanion = null y los
 * usos con `?.`), en vez de colocarlo visualmente dentro de geometría
 * sólida. No es una mentira sobre una garantía más fuerte de la real: es el
 * comportamiento honesto documentado en el comentario de la función.
 */
test("resolveMaxSpawnPosition() devuelve null, sin lanzar excepción, cuando los 13 candidatos locales colisionan y no hay posición previa", () => {
  const player = { x: 200, y: 200, facing: "down" };
  const allBlocked = buildCollisionMap({
    solidTileRanges: ALL_LOCAL_CANDIDATES_BLOCK,
  });

  assert.doesNotThrow(() => resolveMaxSpawnPosition(player, allBlocked));
  assert.equal(resolveMaxSpawnPosition(player, allBlocked), null);
});

test("resolveMaxSpawnPosition() usa la posición previa de Max como último recurso si sigue siendo válida, incluso con los 13 candidatos locales bloqueados", () => {
  const player = { x: 200, y: 200, facing: "down" };
  const allBlocked = buildCollisionMap({
    solidTileRanges: ALL_LOCAL_CANDIDATES_BLOCK,
  });
  // Bien lejos de player y de cualquier candidato local, en una zona libre
  // y dentro de los límites del mapa por defecto de buildCollisionMap()
  // (30 tiles * 16px = 480px de ancho/alto).
  const previousMaxPosition = { x: 400, y: 400 };

  assert.deepEqual(
    resolveMaxSpawnPosition(player, allBlocked, previousMaxPosition),
    previousMaxPosition,
  );
});

test("resolveMaxSpawnPosition() no reutiliza la posición previa de Max si también colisiona en el mapa actual", () => {
  const player = { x: 200, y: 200, facing: "down" };
  const allBlocked = buildCollisionMap({
    solidTileRanges: ALL_LOCAL_CANDIDATES_BLOCK,
  });
  // Dentro del propio bloque que cubre los 13 candidatos locales.
  const collidingPreviousPosition = { x: 200, y: 200 };

  assert.equal(
    resolveMaxSpawnPosition(player, allBlocked, collidingPreviousPosition),
    null,
  );
});

test("resolveMaxSpawnPosition() respeta los límites del mapa cerca de cada esquina: nunca lanza excepción ni devuelve una posición colisionante", () => {
  const width = 30;
  const height = 30;
  const tileSize = 16;
  const collisionMap = buildCollisionMap({ width, height, tileSize });
  const corners = [
    { x: tileSize * 1, y: tileSize * 1, facing: "up" }, // esquina superior izquierda
    { x: tileSize * (width - 2), y: tileSize * 1, facing: "up" }, // esquina superior derecha
    { x: tileSize * 1, y: tileSize * (height - 2), facing: "down" }, // esquina inferior izquierda
    {
      x: tileSize * (width - 2),
      y: tileSize * (height - 2),
      facing: "down",
    }, // esquina inferior derecha
  ];

  for (const player of corners) {
    assert.doesNotThrow(() => resolveMaxSpawnPosition(player, collisionMap));

    const result = resolveMaxSpawnPosition(player, collisionMap);

    // Cerca de una esquina, algunos candidatos del anillo 3 caen fuera del
    // mapa (CollisionMap trata fuera-de-límites como sólido) y se
    // descartan; puede devolver null si eso ocurre con los 13, pero nunca
    // una posición que el propio CollisionMap marque como colisionante.
    if (result !== null) {
      assert.equal(
        collisionMap.collides(getMaxCollisionBoxForTest(result)),
        false,
      );
    }
  }
});

test("resolveMaxSpawnPosition() con el jugador pegado a un obstáculo en su offset normal, elige el siguiente candidato libre", () => {
  const player = { x: 200, y: 200, facing: "up" };
  // Bloquea únicamente el candidato normal (offset "up", detrás de
  // Gonzalo según su facing), dejando el resto del mapa libre -- simula
  // a Gonzalo parado justo contra un obstáculo por el lado por el que
  // Max intentaría colocarse.
  const normalOffsetBlocked = buildCollisionMap({
    solidTileRanges: [{ xRange: [12, 12], yRange: [14, 14] }],
  });

  assert.deepEqual(
    resolveMaxSpawnPosition(player, normalOffsetBlocked),
    { x: player.x, y: player.y - MAX_FOLLOW_MIN_DISTANCE }, // opuesto (down)
  );
});

test("resolver P2 y volver al mundo dispara la reacción de Max exactamente una vez", () => {
  const input = new FakeInput();
  const scenes = new SceneManager();
  const state = new GameState();
  const ui = new FakeUi();
  const storage = new FakeStorage();
  state.changeMap("seven-bridges-walk");
  const world = new WorldScene({
    scenes,
    input,
    storage,
    state,
    ui,
    audio: new FakeAudioService(),
  });
  const p2Scene = new P2BridgesScene({
    scenes,
    input,
    state,
    ui,
    audio: new FakeAudioService(),
  });
  scenes.register("world", world);
  scenes.register("p2-bridges", p2Scene);
  scenes.change("world");

  world.interact(findObject("seven-bridges-walk", "p2-bridge-board"));
  ui.dialogue.onComplete();

  assert.equal(scenes.currentName, "p2-bridges");
  assert.notEqual(state.puzzles.p2.phase, P2_PHASE.SOLVED);

  state.puzzles.p2.selectClosedBridge("B1");
  state.puzzles.p2.startTraversal();
  state.puzzles.p2.markSolved();

  const triggerCalls = withPatchedTriggerReaction(() => {
    input.press("cancel");
    scenes.update(0);
  });

  assert.equal(scenes.currentName, "world");
  assert.equal(triggerCalls, 1);
  assert.ok(world.maxCompanion.reactionTimer > 0);
});

test("resolver el catálogo de la Biblioteca y volver al mundo dispara la reacción de Max exactamente una vez", () => {
  const input = new FakeInput();
  const scenes = new SceneManager();
  const state = new GameState();
  const ui = new FakeUi();
  const storage = new FakeStorage();
  state.changeMap("library", { x: 216, y: 176, facing: "up" });
  state.puzzles.libraryCatalogue = new LibraryCatalogueState({
    order: ["M", "C", "A", "R", "D"],
    phase: LIBRARY_CATALOGUE_PHASE.ARRANGING,
    hintsRead: [1],
    attemptCount: 1,
  });
  const world = new WorldScene({
    scenes,
    input,
    storage,
    state,
    ui,
    audio: new FakeAudioService(),
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

  state.puzzles.libraryCatalogue = new LibraryCatalogueState({
    order: ["A", "D", "R", "C", "M"],
    phase: LIBRARY_CATALOGUE_PHASE.SOLVED,
    hintsRead: [1, 2, 3],
    attemptCount: 2,
  });

  const triggerCalls = withPatchedTriggerReaction(() => {
    input.press("cancel");
    scenes.update(0);
  });

  assert.equal(scenes.currentName, "world");
  assert.equal(triggerCalls, 1);
  assert.ok(world.maxCompanion.reactionTimer > 0);
});

test("resolver el criterio del Archivo y volver al mundo dispara la reacción de Max exactamente una vez", () => {
  const input = new FakeInput();
  const scenes = new SceneManager();
  const state = new GameState();
  const ui = new FakeUi();
  const storage = new FakeStorage();
  state.changeMap("archive", { x: 300, y: 250, facing: "up" });
  const world = new WorldScene({
    scenes,
    input,
    storage,
    state,
    ui,
    audio: new FakeAudioService(),
  });
  const archiveCriteriaScene = new ArchiveCriteriaScene({
    scenes,
    input,
    state,
    ui,
    audio: new FakeAudioService(),
  });
  scenes.register("world", world);
  scenes.register("archive-criteria", archiveCriteriaScene);
  scenes.change("world");

  world.interact(findObject("archive", "archive-criteria-table"));

  assert.equal(scenes.currentName, "archive-criteria");
  assert.notEqual(state.puzzles.archiveCriteria.phase, ARCHIVE_CRITERIA_PHASE.SOLVED);

  state.puzzles.archiveCriteria = new ArchiveCriteriaState({
    verdicts: {
      "voluntary-entry": "confirmed",
      "followed-trail": "confirmed",
      "never-disagreed": "contradicted",
      "someone-refuses-now": "contradicted",
      "present-choice": "confirmed",
      "universal-future": "undecidable",
    },
    phase: ARCHIVE_CRITERIA_PHASE.SOLVED,
    hintsRead: [],
    attemptCount: 1,
  });

  const triggerCalls = withPatchedTriggerReaction(() => {
    input.press("cancel");
    scenes.update(0);
  });

  assert.equal(scenes.currentName, "world");
  assert.equal(triggerCalls, 1);
  assert.ok(world.maxCompanion.reactionTimer > 0);
});

test("reentrar a un puzle ya resuelto y volver no reactiva a Max", () => {
  const input = new FakeInput();
  const scenes = new SceneManager();
  const state = new GameState();
  const ui = new FakeUi();
  const storage = new FakeStorage();
  state.changeMap("library", { x: 216, y: 176, facing: "up" });
  state.puzzles.libraryCatalogue = new LibraryCatalogueState({
    order: ["A", "D", "R", "C", "M"],
    phase: LIBRARY_CATALOGUE_PHASE.SOLVED,
    hintsRead: [1, 2, 3],
    attemptCount: 3,
  });
  const world = new WorldScene({
    scenes,
    input,
    storage,
    state,
    ui,
    audio: new FakeAudioService(),
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

  const triggerCalls = withPatchedTriggerReaction(() => {
    input.press("cancel");
    scenes.update(0);
  });

  assert.equal(scenes.currentName, "world");
  assert.equal(triggerCalls, 0);
  assert.equal(world.maxCompanion.reactionTimer, 0);
});

test("el primer diálogo de Corolaria (antes de leer el tablón) se dirige al protagonista por su nombre, consumiendo PROTAGONIST_NAME", () => {
  const setup = createWorldAt("axiom-plaza");

  setup.scene.interactWithCorolaria();

  assert.ok(
    setup.ui.dialogue.lines.some((line) => line.includes(PROTAGONIST_NAME)),
  );
});

test('el nombre de PARTNER_NAME solo aparece por primera vez al recibir la nota del padre de la novia, nunca antes -- consumiendo PARTNER_NAME, no un literal', () => {
  const setup = createWorldAt("axiom-plaza");

  setup.scene.interactWithCorolaria();
  assert.ok(
    setup.ui.dialogue.lines.every((line) => !line.includes(PARTNER_NAME)),
    "Corolaria (antes de leer el tablón) no debe nombrar a la pareja",
  );

  setup.state.flags.preparationsBoardRead = true;
  setup.scene.interactWithCorolaria();
  assert.ok(
    setup.ui.dialogue.lines.every((line) => !line.includes(PARTNER_NAME)),
    "Corolaria (tras leer el tablón) no debe nombrar a la pareja",
  );

  setup.scene.interactWithPreparationsBoard();
  assert.ok(
    setup.ui.dialogue.lines.every((line) => !line.includes(PARTNER_NAME)),
    "El tablón de preparativos no debe nombrar a la pareja",
  );

  setup.state.objectiveId = "speak-to-bride-father";
  const context = new FakeCanvasContext();
  setup.scene.render(context);
  assert.ok(
    context.texts.every((text) => !text.includes(PARTNER_NAME)),
    'el objectiveId "speak-to-bride-father" no debe nombrar a la pareja',
  );

  // Recién ahora, en la rama final de interactWithBrideFather() (la que
  // arma brideNoteReceived = true), el nombre de la pareja aparece por
  // primera vez.
  setup.scene.interactWithBrideFather();
  assert.ok(
    setup.ui.dialogue.lines.some((line) => line.includes(PARTNER_NAME)),
    "El padre de la novia debe revelar el nombre de la pareja en esta rama",
  );

  assert.equal(setup.state.flags.brideNoteReceived, false);
  setup.ui.dialogue.onComplete();
  assert.equal(setup.state.flags.brideNoteReceived, true);
});

test("interactWithBlockedExit para blocked-library ya no menciona el vertical slice", () => {
  const setup = createWorldAt("axiom-plaza");
  const blockedLibrary = findObject(
    "axiom-plaza",
    "blocked-library",
  );
  setup.state.flags.libraryObjectiveUnlocked = true;

  setup.scene.interactWithBlockedExit(blockedLibrary);

  assert.ok(
    setup.ui.dialogue.lines.every(
      (line) => !line.toLowerCase().includes("vertical slice"),
    ),
  );
});

/*
 * Ejecuta `run` con MaxCompanion.prototype.triggerReaction instrumentado
 * para contar exactamente cuántas veces se invoca durante `run`, sin
 * afectar a ningún trigger anterior o posterior a esa ventana (por
 * ejemplo, el que dispara interact() al abrir el puzle, que no debe
 * confundirse con el trigger específico de la resolución al volver).
 * Restaura siempre el método original, incluso si `run` lanza.
 */
function withPatchedTriggerReaction(run) {
  let calls = 0;
  const originalTriggerReaction = MaxCompanion.prototype.triggerReaction;

  MaxCompanion.prototype.triggerReaction = function patchedTriggerReaction(
    ...args
  ) {
    calls += 1;
    return originalTriggerReaction.apply(this, args);
  };

  try {
    run();
  } finally {
    MaxCompanion.prototype.triggerReaction = originalTriggerReaction;
  }

  return calls;
}

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
