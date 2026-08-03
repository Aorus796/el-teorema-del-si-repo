import assert from "node:assert/strict";
import test from "node:test";
import {
  CreditsScene,
  CREDITS_STEP,
  PROTAGONIST_PALETTE,
  BRIDE_PALETTE,
  wrapTextToLines,
} from "../../src/scenes/CreditsScene.js";
import { SceneManager } from "../../src/core/SceneManager.js";
import { getWorldMap } from "../../src/content/worldMaps.js";
import { GameState } from "../../src/state/GameState.js";

const TITLE_TEXT = "EL TEOREMA DEL SÍ";
const DEDICATION_TEXT = "Por todos los síes que aún quedan por elegir.";
const CREDITS_LINE_1 = "CREADO CON CARIÑO";
const CREDITS_LINE_2 = "COMO REGALO DE BODA";
const CREDITS_LINE_3 = "GRACIAS POR JUGAR";
const FINAL_CARD_TEXT = "Pulsa para guardar y volver al menú";
const CLOSING_LINE =
  "No existe un sí para siempre. Existen dos personas que pueden volver a elegirse cada día.";

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

class FakeUi {
  constructor() {
    this.closeAllCount = 0;
  }

  closeAll() {
    this.closeAllCount += 1;
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

  fillText(text, x, y) {
    this.texts.push({
      text: String(text),
      x,
      y,
      font: this.font,
      fillStyle: this.fillStyle,
      textAlign: this.textAlign,
    });
  }
}

test("CreditsScene puede registrarse como \"credits\" y activarse sin lanzar", () => {
  const scenes = new SceneManager();
  const scene = createScene().scene;

  scenes.register("credits", scene);

  assert.doesNotThrow(() => scenes.change("credits"));
});

test("entrar en credits llama a ui.closeAll() y comienza en el paso 1", () => {
  const { scene, ui } = createScene();

  scene.enter();

  assert.equal(ui.closeAllCount, 1);
  assert.equal(scene.step, CREDITS_STEP.CLOSING_SHOT);
});

test("se necesitan exactamente cuatro confirmaciones para alcanzar la tarjeta final", () => {
  const { scene, input } = createScene();
  scene.enter();

  for (let i = 0; i < 3; i += 1) {
    press(scene, input);
    assert.notEqual(
      scene.step,
      CREDITS_STEP.FINAL_CARD,
      `no debe alcanzar la tarjeta final tras ${i + 1} confirmaciones`,
    );
  }

  press(scene, input);
  assert.equal(scene.step, CREDITS_STEP.FINAL_CARD);
});

test("cada confirmación avanza exactamente un paso, nunca dos", () => {
  const { scene, input } = createScene();
  scene.enter();

  const order = [
    CREDITS_STEP.CLOSING_SHOT,
    CREDITS_STEP.TITLE,
    CREDITS_STEP.DEDICATION,
    CREDITS_STEP.CREDITS,
    CREDITS_STEP.FINAL_CARD,
  ];

  for (let i = 0; i < order.length; i += 1) {
    assert.equal(scene.step, order[i]);

    if (i < order.length - 1) {
      press(scene, input);
    }
  }
});

test("los cinco pasos renderizan, en orden, los textos exactos de la sección 12", () => {
  const { scene, input } = createScene();
  scene.enter();

  const step1 = new FakeCanvasContext();
  scene.render(step1);
  assert.ok(step1.texts.some((entry) => textIncludesClosingLine(step1)));

  press(scene, input);
  const step2 = new FakeCanvasContext();
  scene.render(step2);
  assert.ok(step2.texts.some((entry) => entry.text === TITLE_TEXT));

  press(scene, input);
  const step3 = new FakeCanvasContext();
  scene.render(step3);
  assert.ok(step3.texts.some((entry) => entry.text === DEDICATION_TEXT));

  press(scene, input);
  const step4 = new FakeCanvasContext();
  scene.render(step4);
  assert.ok(step4.texts.some((entry) => entry.text === CREDITS_LINE_1));
  assert.ok(step4.texts.some((entry) => entry.text === CREDITS_LINE_2));
  assert.ok(step4.texts.some((entry) => entry.text === CREDITS_LINE_3));

  press(scene, input);
  const step5 = new FakeCanvasContext();
  scene.render(step5);
  assert.ok(step5.texts.some((entry) => entry.text === FINAL_CARD_TEXT));
});

test("el bloque de créditos mantiene un salto claramente mayor antes de GRACIAS POR JUGAR (línea en blanco)", () => {
  const { scene, input } = createScene();
  scene.enter();
  press(scene, input);
  press(scene, input);
  press(scene, input);

  const context = new FakeCanvasContext();
  scene.render(context);

  const line1 = context.texts.find((entry) => entry.text === CREDITS_LINE_1);
  const line2 = context.texts.find((entry) => entry.text === CREDITS_LINE_2);
  const line3 = context.texts.find((entry) => entry.text === CREDITS_LINE_3);
  const gapBefore = line2.y - line1.y;
  const gapAfterBlank = line3.y - line2.y;

  assert.ok(gapAfterBlank > gapBefore);
});

test("wrapTextToLines envuelve la frase de cierre en líneas dentro del límite indicado", () => {
  const lines = wrapTextToLines(CLOSING_LINE, 48);

  assert.ok(lines.length >= 1);
  for (const line of lines) {
    assert.ok(line.length <= 48, `línea demasiado larga: "${line}"`);
  }
  assert.equal(lines.join(" "), CLOSING_LINE);
});

test("el paso 1 dibuja dos personajes con las paletas reutilizadas del jugador y la novia, sobre el amanecer de axiom-plaza", () => {
  const { scene } = createScene();
  scene.enter();

  const context = new FakeCanvasContext();
  scene.render(context);

  const dawnPalette = getWorldMap("axiom-plaza").dawnPalette;
  const fillStyles = context.fillRects.map((rect) => rect.fillStyle);

  assert.ok(fillStyles.includes(dawnPalette.groundA));
  assert.ok(fillStyles.includes(dawnPalette.groundB));
  assert.ok(fillStyles.includes(PROTAGONIST_PALETTE.silhouette));
  assert.ok(fillStyles.includes(PROTAGONIST_PALETTE.head));
  assert.ok(fillStyles.includes(PROTAGONIST_PALETTE.body));
  assert.ok(fillStyles.includes(BRIDE_PALETTE.silhouette));
  assert.ok(fillStyles.includes(BRIDE_PALETTE.body));
});

test("ningún texto renderizado cae fuera del canvas de 480x270 ni de sus márgenes", () => {
  const { scene, input } = createScene();
  scene.enter();

  for (let i = 0; i < 5; i += 1) {
    const context = new FakeCanvasContext();
    scene.render(context);

    for (const entry of context.texts) {
      assert.ok(entry.x >= 20 && entry.x <= 460, `x fuera de margen: ${entry.x}`);
      assert.ok(entry.y >= 0 && entry.y <= 270, `y fuera de canvas: ${entry.y}`);
    }

    if (i < 4) {
      press(scene, input);
    }
  }
});

test("Escape no cambia de paso en ningún punto de la secuencia", () => {
  const { scene, input } = createScene();
  scene.enter();

  for (let i = 0; i < 5; i += 1) {
    const stepBefore = scene.step;
    input.press("cancel");
    scene.update();

    assert.equal(scene.step, stepBefore);

    if (i < 4) {
      press(scene, input);
    }
  }
});

test("confirmar la tarjeta final varias veces tras un guardado exitoso no corrompe el estado ni repite efectos", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage();
  const { scene, input } = createScene({ state, storage });

  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);

  const stateAfterFirst = structuredClone(state.toSaveData());
  delete stateAfterFirst.savedAt;

  scene.confirmFinalCard();

  const stateAfterSecond = structuredClone(state.toSaveData());
  delete stateAfterSecond.savedAt;

  assert.deepEqual(stateAfterSecond, stateAfterFirst);
});

test("CreditsScene recibe state, storage y scenes para la transición terminal, pero nunca audio", () => {
  const { scene } = createScene();

  assert.equal(Object.hasOwn(scene, "audio"), false);
  assert.equal(Object.hasOwn(scene, "state"), true);
  assert.equal(Object.hasOwn(scene, "storage"), true);
  assert.equal(Object.hasOwn(scene, "scenes"), true);
});

test("confirmar la tarjeta final invoca confirmFinalCard exactamente una vez por pulsación y permanece en la tarjeta", () => {
  const { scene, input } = createScene();
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }

  let calls = 0;
  scene.confirmFinalCard = () => {
    calls += 1;
  };

  press(scene, input);
  assert.equal(calls, 1);
  assert.equal(scene.step, CREDITS_STEP.FINAL_CARD);

  press(scene, input);
  assert.equal(calls, 2);
  assert.equal(scene.step, CREDITS_STEP.FINAL_CARD);

  press(scene, input);
  assert.equal(calls, 3);
  assert.equal(scene.step, CREDITS_STEP.FINAL_CARD);
});

test("confirmar la tarjeta final con guardado exitoso prepara el estado terminal completo", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;
  state.flags.epilogueCompleted = false;
  state.objectiveId = "epilogue-meet-bride";
  state.world.currentMapId = "axiom-plaza";
  state.setPlayerState({ x: 300, y: 250, facing: "up" }, "axiom-plaza");

  const storage = new FakeStorage();
  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }

  press(scene, input);

  assert.equal(state.flags.epilogueCompleted, true);
  assert.equal(state.flags.giftCodeSolved, true);
  assert.equal(state.flags.epilogueStarted, true);
  assert.equal(state.flags.epilogueUnlocked, true);
  assert.equal(state.flags.investigationComplete, true);
  assert.equal(state.objectiveId, "epilogue-completed");
  assert.equal(state.scene, "world");
  assert.equal(state.world.currentMapId, "axiom-plaza");
  assert.deepEqual(state.player, state.world.playerByMap["axiom-plaza"]);
});

test("el guardado exitoso contiene los cuatro campos terminales exactos", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage();
  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);

  assert.ok(storage.savedData);
  assert.equal(storage.savedData.flags.epilogueCompleted, true);
  assert.equal(storage.savedData.scene, "world");
  assert.equal(storage.savedData.world.currentMapId, "axiom-plaza");
  assert.equal(storage.savedData.objectiveId, "epilogue-completed");
});

test("confirmar con éxito cambia a title exactamente una vez, después de guardar", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const callOrder = [];
  const storage = new FakeStorage();
  const originalSave = storage.save.bind(storage);
  storage.save = (data) => {
    callOrder.push("save");
    originalSave(data);
  };
  const scenes = new FakeScenes();
  const originalChange = scenes.change.bind(scenes);
  scenes.change = (name, payload) => {
    callOrder.push("change");
    originalChange(name, payload);
  };

  const { scene, input } = createScene({ state, storage, scenes });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);

  assert.deepEqual(callOrder, ["save", "change"]);
  assert.deepEqual(scenes.changes, [{ name: "title", payload: undefined }]);
});

test("un fallo de guardado no propaga, mantiene la escena en FINAL_CARD y no cambia de escena", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage({ saveError: new Error("disco lleno") });
  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }

  assert.doesNotThrow(() => press(scene, input));

  assert.equal(scene.step, CREDITS_STEP.FINAL_CARD);
  assert.equal(scene.saveFailed, true);
});

test("tras un fallo, el render muestra el mensaje exacto junto al texto principal de la tarjeta final", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage({ saveError: new Error("fallo") });
  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);

  const context = new FakeCanvasContext();
  scene.render(context);
  const texts = context.texts.map((entry) => entry.text);

  assert.ok(texts.includes(FINAL_CARD_TEXT));
  assert.ok(texts.includes("No se pudo guardar el final. Vuelve a intentarlo."));
});

test("el guardado previo permanece intacto tras un intento fallido", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage({ saveError: new Error("fallo") });
  storage.savedData = { previous: "guardado anterior" };
  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);

  assert.deepEqual(storage.savedData, { previous: "guardado anterior" });
});

test("dos fallos consecutivos mantienen la escena estable, sin duplicar la preparación en memoria", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage({ saveError: new Error("fallo") });
  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }

  let prepareCalls = 0;
  const originalPrepare = scene.prepareTerminalState.bind(scene);
  scene.prepareTerminalState = () => {
    prepareCalls += 1;
    originalPrepare();
  };

  press(scene, input);
  press(scene, input);

  assert.equal(scene.step, CREDITS_STEP.FINAL_CARD);
  assert.equal(scene.saveFailed, true);
  assert.equal(
    prepareCalls,
    1,
    "prepareTerminalState debe ejecutarse en el primer intento fallido (pone epilogueCompleted=true) y no repetirse en el segundo, así que dos intentos fallidos consecutivos producen una sola llamada, no dos",
  );
});

test("un reintento exitoso tras un fallo completa la transición", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage({ saveError: new Error("fallo") });
  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);
  assert.equal(scene.saveFailed, true);

  storage.saveError = null;
  press(scene, input);

  assert.equal(scene.saveFailed, false);
  assert.deepEqual(scene.scenes.changes, [{ name: "title", payload: undefined }]);
  assert.ok(storage.savedData);
});

test("prepareTerminalState no modifica ninguna otra bandera del epílogo", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const { scene } = createScene({ state });
  scene.prepareTerminalState();

  assert.equal(state.flags.investigationComplete, true);
  assert.equal(state.flags.epilogueUnlocked, true);
  assert.equal(state.flags.epilogueStarted, true);
  assert.equal(state.flags.giftCodeSolved, true);
});

test("prepareTerminalState mantiene idénticos state.player y world.playerByMap[axiom-plaza]", () => {
  const state = new GameState();
  state.world.currentMapId = "axiom-plaza";
  state.setPlayerState({ x: 111, y: 222, facing: "left" }, "axiom-plaza");

  const { scene } = createScene({ state });
  scene.prepareTerminalState();

  assert.deepEqual(state.player, state.world.playerByMap["axiom-plaza"]);
});

test("el mensaje de error nunca aparece en los pasos 1 a 4", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage({ saveError: new Error("fallo") });
  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);
  assert.equal(scene.saveFailed, true);

  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    const context = new FakeCanvasContext();
    scene.render(context);
    const texts = context.texts.map((entry) => entry.text);
    assert.equal(
      texts.includes("No se pudo guardar el final. Vuelve a intentarlo."),
      false,
    );
    press(scene, input);
  }
});

test("ningún texto renderizado contiene {{FINAL_DEDICATION}} ni contenido personalizado", () => {
  const { scene, input } = createScene();
  scene.enter();

  const allTexts = [];
  for (let i = 0; i < 5; i += 1) {
    const context = new FakeCanvasContext();
    scene.render(context);
    allTexts.push(...context.texts.map((entry) => entry.text));

    if (i < 4) {
      press(scene, input);
    }
  }

  const joined = allTexts.join(" ");
  assert.equal(joined.includes("{{FINAL_DEDICATION}}"), false);
});

function textIncludesClosingLine(context) {
  const joined = context.texts.map((entry) => entry.text).join(" ");
  return CLOSING_LINE.split(" ").every((word) => joined.includes(word));
}

function createScene({ state, storage, scenes } = {}) {
  const input = new FakeInput();
  const ui = new FakeUi();

  return {
    input,
    ui,
    scene: new CreditsScene({
      input,
      ui,
      state: state ?? new GameState(),
      storage: storage ?? new FakeStorage(),
      scenes: scenes ?? new FakeScenes(),
    }),
  };
}

class FakeStorage {
  constructor({ saveError = null } = {}) {
    this.saveError = saveError;
    this.savedData = null;
  }

  save(data) {
    if (this.saveError) {
      throw this.saveError;
    }

    this.savedData = data;
  }
}

class FakeScenes {
  constructor() {
    this.changes = [];
  }

  change(name, payload) {
    this.changes.push({ name, payload });
  }
}

function press(scene, input) {
  input.press("interact");
  scene.update();
}
