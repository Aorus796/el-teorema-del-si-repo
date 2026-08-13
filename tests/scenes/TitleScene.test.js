import assert from "node:assert/strict";
import test from "node:test";
import { TitleScene } from "../../src/scenes/TitleScene.js";
import { INTRO_THEME_PATH } from "../../src/content/introAudioConfig.js";

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

class FakeAudioService {
  constructor() {
    this.playMusicCalls = [];
  }

  playMusic(src, options) {
    this.playMusicCalls.push({ src, options });
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
  const audio = new FakeAudioService();
  const scene = new TitleScene({ scenes, input, storage, state, ui, audio });

  return { input, scenes, storage, state, ui, audio, scene };
}

test("entrar en TitleScene sin pulsar ninguna tecla no dispara ninguna música", () => {
  const setup = createScene();

  setup.scene.enter();
  setup.scene.update();

  assert.deepEqual(setup.audio.playMusicCalls, []);
  assert.deepEqual(setup.scenes.changes, []);
});

test("pulsar interact reproduce la intro exactamente una vez y cambia a world sin restaurar, marcando introStarted", () => {
  const setup = createScene();

  setup.input.press("interact");
  setup.scene.update();

  assert.deepEqual(setup.audio.playMusicCalls, [
    { src: INTRO_THEME_PATH, options: undefined },
  ]);
  assert.deepEqual(setup.scenes.changes, [
    {
      name: "world",
      payload: { restoreFromState: false, introStarted: true },
    },
  ]);
});

test("pulsar load con partida guardada reproduce la intro exactamente una vez y cambia a world restaurando, marcando introStarted", () => {
  const setup = createScene({ hasSave: true });

  setup.input.press("load");
  setup.scene.update();

  assert.deepEqual(setup.audio.playMusicCalls, [
    { src: INTRO_THEME_PATH, options: undefined },
  ]);
  assert.deepEqual(setup.scenes.changes, [
    {
      name: "world",
      payload: { restoreFromState: true, introStarted: true },
    },
  ]);
});

test("pulsar load sin partida guardada no dispara música ni cambio de escena", () => {
  const setup = createScene({ hasSave: false });

  setup.input.press("load");
  setup.scene.update();

  assert.deepEqual(setup.audio.playMusicCalls, []);
  assert.deepEqual(setup.scenes.changes, []);
});

test("una segunda pulsación de interact no vuelve a reproducir la intro y marca introStarted en false", () => {
  const setup = createScene();

  setup.input.press("interact");
  setup.scene.update();

  setup.input.press("interact");
  setup.scene.update();

  assert.equal(setup.audio.playMusicCalls.length, 1);
  assert.equal(setup.scenes.changes.length, 2);
  assert.equal(setup.scenes.changes[0].payload.introStarted, true);
  assert.equal(setup.scenes.changes[1].payload.introStarted, false);
});

test("volver a llamar enter() no reinicia el flag de intro reproducida", () => {
  const setup = createScene();

  setup.input.press("interact");
  setup.scene.update();

  setup.scene.enter();

  setup.input.press("interact");
  setup.scene.update();

  assert.equal(setup.audio.playMusicCalls.length, 1);
  assert.equal(setup.scenes.changes[1].payload.introStarted, false);
});

test("playIntroOnce() devuelve true la primera vez y false en llamadas posteriores", () => {
  const setup = createScene();

  assert.equal(setup.scene.playIntroOnce(), true);
  assert.equal(setup.scene.playIntroOnce(), false);
  assert.equal(setup.scene.playIntroOnce(), false);
  assert.equal(setup.audio.playMusicCalls.length, 1);
});

test("TitleScene no envuelve audio.playMusic() en manejo de errores propio: confía en el contrato de AudioService (nunca lanza de forma síncrona, ver AudioService.playMusic) en vez de duplicar esa protección aquí", () => {
  const setup = createScene();
  setup.audio.playMusic = () => {
    throw new Error("violación simulada del contrato de AudioService");
  };

  setup.input.press("interact");

  assert.throws(
    () => setup.scene.update(),
    /violación simulada del contrato de AudioService/,
  );
});
