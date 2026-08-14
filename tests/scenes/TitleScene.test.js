import assert from "node:assert/strict";
import test from "node:test";
import { TitleScene } from "../../src/scenes/TitleScene.js";

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
  closeAll() {}
}

class FakeStorage {
  constructor({ hasSave = false } = {}) {
    this._hasSave = hasSave;
  }

  hasSave() {
    return this._hasSave;
  }
}

class FakeState {
  constructor() {
    this.resetCalls = 0;
  }

  reset() {
    this.resetCalls += 1;
  }
}

function createScene({ hasSave = false } = {}) {
  const input = new FakeInput();
  const scenes = new FakeScenes();
  const storage = new FakeStorage({ hasSave });
  const state = new FakeState();
  const ui = new FakeUi();
  const scene = new TitleScene({ scenes, input, storage, state, ui });

  return { input, scenes, storage, state, ui, scene };
}

/*
 * TitleScene ya no decide ni dispara ninguna música: WorldScene.enter()
 * es la única autoridad de qué debe sonar (ver syncMusicToFlags() en
 * WorldScene.js), así que estos tests solo verifican lo que
 * TitleScene.update() sigue haciendo -- reiniciar o no el estado y
 * cambiar de escena con el payload correcto -- sin ninguna aserción de
 * audio. La cobertura de qué música arranca al entrar en el mundo, en
 * partida nueva o restaurada, vive en tests/scenes/WorldScene.test.js.
 */

test("entrar en TitleScene sin pulsar ninguna tecla no cambia de escena ni reinicia el estado", () => {
  const setup = createScene();

  setup.scene.enter();
  setup.scene.update();

  assert.deepEqual(setup.scenes.changes, []);
  assert.equal(setup.state.resetCalls, 0);
});

test("pulsar interact reinicia el estado y cambia a world sin restaurar", () => {
  const setup = createScene();

  setup.input.press("interact");
  setup.scene.update();

  assert.equal(setup.state.resetCalls, 1);
  assert.deepEqual(setup.scenes.changes, [
    {
      name: "world",
      payload: { restoreFromState: false },
    },
  ]);
});

test("pulsar load con partida guardada cambia a world restaurando, sin reiniciar el estado", () => {
  const setup = createScene({ hasSave: true });

  setup.input.press("load");
  setup.scene.update();

  assert.equal(setup.state.resetCalls, 0);
  assert.deepEqual(setup.scenes.changes, [
    {
      name: "world",
      payload: { restoreFromState: true },
    },
  ]);
});

test("pulsar load sin partida guardada no reinicia el estado ni cambia de escena", () => {
  const setup = createScene({ hasSave: false });

  setup.input.press("load");
  setup.scene.update();

  assert.equal(setup.state.resetCalls, 0);
  assert.deepEqual(setup.scenes.changes, []);
});

test("pulsar interact dos veces seguidas reinicia el estado dos veces y cambia de escena dos veces", () => {
  const setup = createScene();

  setup.input.press("interact");
  setup.scene.update();

  setup.input.press("interact");
  setup.scene.update();

  assert.equal(setup.state.resetCalls, 2);
  assert.equal(setup.scenes.changes.length, 2);
  assert.deepEqual(setup.scenes.changes[0].payload, {
    restoreFromState: false,
  });
  assert.deepEqual(setup.scenes.changes[1].payload, {
    restoreFromState: false,
  });
});

test("volver a llamar enter() no altera el comportamiento de update()", () => {
  const setup = createScene();

  setup.input.press("interact");
  setup.scene.update();

  setup.scene.enter();

  setup.input.press("interact");
  setup.scene.update();

  assert.equal(setup.state.resetCalls, 2);
  assert.equal(setup.scenes.changes.length, 2);
});
