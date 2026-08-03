import test from "node:test";
import assert from "node:assert/strict";
import { EpilogueGiftCodeScene } from "../../src/scenes/EpilogueGiftCodeScene.js";
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
    this.dialogue = null;
  }

  closeAll() {
    this.closeAllCount += 1;
  }

  showToast(text) {
    this.toasts.push(text);
  }

  beginDialogue(dialogue) {
    this.dialogue = dialogue;
  }
}

class FakeCanvasContext {
  constructor() {
    this.texts = [];
    this.fillRects = [];
    this.strokeRects = [];
  }

  fillRect(x, y, width, height) {
    this.fillRects.push({ x, y, width, height });
  }

  strokeRect(x, y, width, height) {
    this.strokeRects.push({
      x,
      y,
      width,
      height,
      lineWidth: this.lineWidth,
      strokeStyle: this.strokeStyle,
    });
  }

  fillText(text) {
    this.texts.push(String(text));
  }
}

test("la navegación izquierda/derecha es circular en los cuatro dígitos", () => {
  const { scene, input } = createScene();
  scene.enter();

  press(scene, input, "moveLeft");
  assert.equal(scene.focusedDigitIndex, 3);

  press(scene, input, "moveRight");
  assert.equal(scene.focusedDigitIndex, 0);

  press(scene, input, "moveRight");
  press(scene, input, "moveRight");
  press(scene, input, "moveRight");
  assert.equal(scene.focusedDigitIndex, 3);

  press(scene, input, "moveRight");
  assert.equal(scene.focusedDigitIndex, 0);
});

test("moveUp incrementa la cifra enfocada de forma circular, sin alterar otras cifras", () => {
  const { scene, input } = createScene();
  scene.enter();
  press(scene, input, "moveRight");
  assert.equal(scene.focusedDigitIndex, 1);

  for (let value = 1; value <= 9; value += 1) {
    press(scene, input, "moveUp");
    assert.equal(scene.digits[1], value);
  }

  press(scene, input, "moveUp");
  assert.equal(scene.digits[1], 0);

  assert.deepEqual(scene.digits, [0, 0, 0, 0]);
});

test("moveDown decrementa la cifra enfocada de forma circular, sin alterar otras cifras", () => {
  const { scene, input } = createScene();
  scene.enter();
  press(scene, input, "moveRight");
  press(scene, input, "moveRight");
  assert.equal(scene.focusedDigitIndex, 2);

  press(scene, input, "moveDown");
  assert.equal(scene.digits[2], 9);

  for (let value = 9; value >= 1; value -= 1) {
    assert.equal(scene.digits[2], value);
    press(scene, input, "moveDown");
  }

  assert.equal(scene.digits[2], 0);
  assert.deepEqual(scene.digits, [0, 0, 0, 0]);
});

test("enter con epilogueStarted en false lo marca como true", () => {
  const { scene, state } = createScene();
  assert.equal(state.flags.epilogueStarted, false);

  scene.enter();

  assert.equal(state.flags.epilogueStarted, true);
});

test("enter con epilogueStarted ya en true no produce ningún efecto adicional", () => {
  const { scene, state } = createScene();
  state.flags.epilogueStarted = true;
  scene.enter();

  const before = structuredClone(state.toSaveData());
  delete before.savedAt;

  scene.enter();

  const after = structuredClone(state.toSaveData());
  delete after.savedAt;

  assert.deepEqual(after, before);
});

test("reentrar en la escena siempre reinicia el foco y las cifras", () => {
  const { scene, input } = createScene();
  scene.enter();

  press(scene, input, "moveRight");
  press(scene, input, "moveUp");
  press(scene, input, "moveUp");
  assert.notEqual(scene.focusedDigitIndex, 0);
  assert.notDeepEqual(scene.digits, [0, 0, 0, 0]);

  scene.enter();

  assert.equal(scene.focusedDigitIndex, 0);
  assert.deepEqual(scene.digits, [0, 0, 0, 0]);

  press(scene, input, "moveLeft");
  press(scene, input, "moveDown");
  scene.enter();

  assert.equal(scene.focusedDigitIndex, 0);
  assert.deepEqual(scene.digits, [0, 0, 0, 0]);
});

test("startPuzzleAttempt no produce ningún efecto observable", () => {
  const { scene, input, state, scenes, ui } = createScene();
  scene.enter();
  press(scene, input, "moveRight");
  press(scene, input, "moveUp");

  const focusedBefore = scene.focusedDigitIndex;
  const digitsBefore = [...scene.digits];
  const stateBefore = structuredClone(state.toSaveData());
  delete stateBefore.savedAt;

  press(scene, input, "startPuzzleAttempt");

  const stateAfter = structuredClone(state.toSaveData());
  delete stateAfter.savedAt;

  assert.equal(scene.focusedDigitIndex, focusedBefore);
  assert.deepEqual(scene.digits, digitsBefore);
  assert.deepEqual(stateAfter, stateBefore);
  assert.deepEqual(scenes.changes, []);
  assert.deepEqual(ui.toasts, []);
  assert.equal(ui.dialogue, null);
});

test("cancel vuelve a world sin payload y sin alterar el estado persistente", () => {
  const { scene, input, state, scenes } = createScene();
  scene.enter();
  const epilogueStartedAfterEnter = state.flags.epilogueStarted;
  const stateBefore = structuredClone(state.toSaveData());
  delete stateBefore.savedAt;

  press(scene, input, "cancel");

  const stateAfter = structuredClone(state.toSaveData());
  delete stateAfter.savedAt;

  assert.deepEqual(scenes.changes, [{ name: "world", payload: {} }]);
  assert.equal(state.flags.epilogueStarted, epilogueStartedAfterEnter);
  assert.deepEqual(stateAfter, stateBefore);
});

test("digits y focusedDigitIndex nunca aparecen en el estado guardado", () => {
  const { scene, input, state } = createScene();
  scene.enter();
  press(scene, input, "moveRight");
  press(scene, input, "moveUp");

  const saveData = state.toSaveData();
  const serialized = JSON.stringify(saveData);

  assert.equal(Object.hasOwn(saveData, "digits"), false);
  assert.equal(Object.hasOwn(saveData, "focusedDigitIndex"), false);
  assert.equal(serialized.includes("digits"), false);
  assert.equal(serialized.includes("focusedDigitIndex"), false);
});

test("render no lanza excepción", () => {
  const { scene, input } = createScene();
  scene.enter();
  press(scene, input, "moveRight");
  press(scene, input, "moveUp");

  assert.doesNotThrow(() => scene.render(new FakeCanvasContext()));
});

test("render dibuja las cuatro cifras y un único marco de foco que rodea la cifra enfocada y se desplaza con ella", () => {
  const { scene, input } = createScene();
  scene.enter();

  const context = new FakeCanvasContext();
  scene.render(context);

  assert.equal(
    context.texts.filter((text) => /^\d$/.test(text)).length,
    4,
  );

  const baseRects = context.strokeRects.filter(
    (rect) => rect.lineWidth === 2,
  );
  const focusRects = context.strokeRects.filter(
    (rect) => rect.lineWidth !== 2,
  );

  assert.equal(baseRects.length, 4);
  assert.equal(focusRects.length, 1);
  assertSurrounds(focusRects[0], baseRects[scene.focusedDigitIndex]);

  press(scene, input, "moveRight");

  const contextAfterMove = new FakeCanvasContext();
  scene.render(contextAfterMove);

  const baseRectsAfterMove = contextAfterMove.strokeRects.filter(
    (rect) => rect.lineWidth === 2,
  );
  const focusRectsAfterMove = contextAfterMove.strokeRects.filter(
    (rect) => rect.lineWidth !== 2,
  );

  assert.equal(focusRectsAfterMove.length, 1);
  assert.notDeepEqual(focusRectsAfterMove[0], focusRects[0]);
  assertSurrounds(
    focusRectsAfterMove[0],
    baseRectsAfterMove[scene.focusedDigitIndex],
  );
});

function assertSurrounds(outer, inner) {
  assert.ok(outer.x < inner.x, "el marco de foco debe empezar antes en x");
  assert.ok(outer.y < inner.y, "el marco de foco debe empezar antes en y");
  assert.ok(
    outer.x + outer.width > inner.x + inner.width,
    "el marco de foco debe terminar después en x",
  );
  assert.ok(
    outer.y + outer.height > inner.y + inner.height,
    "el marco de foco debe terminar después en y",
  );
}

function createScene() {
  const input = new FakeInput();
  const scenes = new FakeScenes();
  const state = new GameState();
  const ui = new FakeUi();

  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;

  return {
    input,
    scenes,
    state,
    ui,
    scene: new EpilogueGiftCodeScene({
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
