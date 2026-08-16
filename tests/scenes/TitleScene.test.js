import assert from "node:assert/strict";
import test from "node:test";
import { TitleScene } from "../../src/scenes/TitleScene.js";
import { OPENING_THEME_PATH } from "../../src/content/introAudioConfig.js";

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
  constructor({ hasSave = false, loadResult = null, loadError = null } = {}) {
    this._hasSave = hasSave;
    this.loadResult = loadResult;
    this.loadError = loadError;
  }

  hasSave() {
    return this._hasSave;
  }

  load() {
    if (this.loadError) {
      throw this.loadError;
    }

    return this.loadResult;
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

class FakeAudioService {
  constructor() {
    this.playMusicCalls = [];
    this.stopMusicCalls = 0;
  }

  playMusic(src, options) {
    this.playMusicCalls.push({ src, options });
  }

  stopMusic() {
    this.stopMusicCalls += 1;
  }
}

function createScene({
  hasSave = false,
  loadResult = null,
  loadError = null,
} = {}) {
  const input = new FakeInput();
  const scenes = new FakeScenes();
  const storage = new FakeStorage({ hasSave, loadResult, loadError });
  const state = new FakeState();
  const ui = new FakeUi();
  const audio = new FakeAudioService();
  const scene = new TitleScene({
    scenes,
    input,
    storage,
    state,
    ui,
    audio,
  });

  return { input, scenes, storage, state, ui, audio, scene };
}

/*
 * TitleScene dispara el opening de forma optimista (salvo que un peek del
 * save indique que ya se superó ese punto de la historia), y
 * WorldScene.enter()/syncMusicToFlags() sigue siendo la autoridad final
 * que corrige o confirma en el mismo tick síncrono -- ver el comentario de
 * update() en TitleScene.js. Estos tests cubren exactamente lo que
 * TitleScene.update() dispara por su cuenta, no el resultado final una vez
 * WorldScene ha corregido, que se cubre en tests/scenes/WorldScene.test.js.
 */

test("entrar en TitleScene sin pulsar ninguna tecla no cambia de escena ni reinicia el estado", () => {
  const setup = createScene();

  setup.scene.enter();
  setup.scene.update();

  assert.deepEqual(setup.scenes.changes, []);
  assert.equal(setup.state.resetCalls, 0);
  assert.deepEqual(setup.audio.playMusicCalls, []);
});

test("pulsar interact reinicia el estado, reproduce el opening y cambia a world sin restaurar", () => {
  const setup = createScene();

  setup.input.press("interact");
  setup.scene.update();

  assert.equal(setup.state.resetCalls, 1);
  assert.deepEqual(setup.audio.playMusicCalls, [
    { src: OPENING_THEME_PATH, options: { loop: true } },
  ]);
  assert.deepEqual(setup.scenes.changes, [
    {
      name: "world",
      payload: { restoreFromState: false },
    },
  ]);
});

test("pulsar interact dos veces seguidas produce dos llamadas a playMusic con el mismo opening", () => {
  const setup = createScene();

  setup.input.press("interact");
  setup.scene.update();

  setup.input.press("interact");
  setup.scene.update();

  assert.equal(setup.state.resetCalls, 2);
  assert.equal(setup.scenes.changes.length, 2);
  assert.deepEqual(setup.audio.playMusicCalls, [
    { src: OPENING_THEME_PATH, options: { loop: true } },
    { src: OPENING_THEME_PATH, options: { loop: true } },
  ]);
});

test("pulsar load con un save temprano reproduce el opening antes de cambiar a world", () => {
  const setup = createScene({
    hasSave: true,
    loadResult: {
      flags: { brideNoteReceived: false, epilogueCompleted: false },
    },
  });

  setup.input.press("load");
  setup.scene.update();

  assert.equal(setup.state.resetCalls, 0);
  assert.deepEqual(setup.audio.playMusicCalls, [
    { src: OPENING_THEME_PATH, options: { loop: true } },
  ]);
  assert.deepEqual(setup.scenes.changes, [
    {
      name: "world",
      payload: { restoreFromState: true },
    },
  ]);
});

test("pulsar load con un save sin flags (null) trata el caso como save temprano y reproduce el opening", () => {
  const setup = createScene({ hasSave: true, loadResult: null });

  setup.input.press("load");
  setup.scene.update();

  assert.deepEqual(setup.audio.playMusicCalls, [
    { src: OPENING_THEME_PATH, options: { loop: true } },
  ]);
  assert.deepEqual(setup.scenes.changes, [
    {
      name: "world",
      payload: { restoreFromState: true },
    },
  ]);
});

test("pulsar load con un save de exploración no reproduce ningún audio", () => {
  const setup = createScene({
    hasSave: true,
    loadResult: {
      flags: { brideNoteReceived: true, epilogueCompleted: false },
    },
  });

  setup.input.press("load");
  setup.scene.update();

  assert.deepEqual(setup.audio.playMusicCalls, []);
  assert.equal(setup.audio.stopMusicCalls, 0);
  assert.deepEqual(setup.scenes.changes, [
    {
      name: "world",
      payload: { restoreFromState: true },
    },
  ]);
});

test("pulsar load con un save terminal (epílogo completado) no reproduce ningún audio", () => {
  const setup = createScene({
    hasSave: true,
    loadResult: {
      flags: { brideNoteReceived: true, epilogueCompleted: true },
    },
  });

  setup.input.press("load");
  setup.scene.update();

  assert.deepEqual(setup.audio.playMusicCalls, []);
  assert.equal(setup.audio.stopMusicCalls, 0);
  assert.deepEqual(setup.scenes.changes, [
    {
      name: "world",
      payload: { restoreFromState: true },
    },
  ]);
});

test("pulsar load cuando storage.load() lanza no propaga la excepción, reproduce el opening y cambia de escena", () => {
  const setup = createScene({
    hasSave: true,
    loadError: new Error("save corrupto"),
  });

  assert.doesNotThrow(() => {
    setup.input.press("load");
    setup.scene.update();
  });

  assert.deepEqual(setup.audio.playMusicCalls, [
    { src: OPENING_THEME_PATH, options: { loop: true } },
  ]);
  assert.deepEqual(setup.scenes.changes, [
    {
      name: "world",
      payload: { restoreFromState: true },
    },
  ]);
});

test("pulsar load sin partida guardada no reinicia el estado, no reproduce audio ni cambia de escena", () => {
  const setup = createScene({ hasSave: false });

  setup.input.press("load");
  setup.scene.update();

  assert.equal(setup.state.resetCalls, 0);
  assert.deepEqual(setup.audio.playMusicCalls, []);
  assert.deepEqual(setup.scenes.changes, []);
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
  assert.equal(setup.audio.playMusicCalls.length, 2);
});

class FakeCanvasContext {
  constructor() {
    this.texts = [];
  }

  fillRect() {}

  fillText(text) {
    this.texts.push(String(text));
  }
}

test("render() sin partida guardada no dibuja \"Gonzalo\", \"Elena\" ni el subtítulo heredado del vertical slice", () => {
  const setup = createScene({ hasSave: false });
  const context = new FakeCanvasContext();

  setup.scene.render(context);

  assert.ok(context.texts.length > 0);
  assert.ok(
    context.texts.every((text) => !text.includes("Gonzalo")),
  );
  assert.ok(context.texts.every((text) => !text.includes("Elena")));
  assert.ok(
    context.texts.every(
      (text) => !text.includes("Vertical slice narrativo"),
    ),
  );
});

test("render() con partida guardada tampoco dibuja \"Gonzalo\", \"Elena\" ni el subtítulo heredado del vertical slice", () => {
  const setup = createScene({
    hasSave: true,
    loadResult: {
      flags: { brideNoteReceived: true, epilogueCompleted: false },
    },
  });
  const context = new FakeCanvasContext();

  setup.scene.render(context);

  assert.ok(context.texts.length > 0);
  assert.ok(
    context.texts.every((text) => !text.includes("Gonzalo")),
  );
  assert.ok(context.texts.every((text) => !text.includes("Elena")));
  assert.ok(
    context.texts.every(
      (text) => !text.includes("Vertical slice narrativo"),
    ),
  );
});
