import assert from "node:assert/strict";
import test from "node:test";
import { AudioService } from "../../src/platform/AudioService.js";
import { EPILOGUE_THEME_PATH } from "../../src/content/epilogueAudioConfig.js";

const SFX_PATH = "./src/assets/audio/example-sfx.wav";
const OTHER_MUSIC_PATH = "./src/assets/audio/example-ambient.wav";

// --- playEpilogueTheme(): mismo contrato observable que antes de esta tarea ---

test("playEpilogueTheme crea como máximo un HTMLAudioElement, incluso tras varias llamadas", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playEpilogueTheme();
  service.playEpilogueTheme();
  service.playEpilogueTheme();

  assert.equal(FakeAudio.instances.length, 1);
});

test("playEpilogueTheme usa la ruta centralizada del recurso", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playEpilogueTheme();

  assert.equal(FakeAudio.instances[0].src, EPILOGUE_THEME_PATH);
});

test("playEpilogueTheme configura el recurso sin loop y reproduce exactamente una vez", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playEpilogueTheme();

  assert.equal(FakeAudio.instances[0].loop, false);
  assert.equal(FakeAudio.instances[0].playCalls, 1);
});

test("playEpilogueTheme repetido no crea audio superpuesto ni reinicia la reproducción", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playEpilogueTheme();
  service.playEpilogueTheme();
  service.playEpilogueTheme();

  assert.equal(FakeAudio.instances.length, 1);
  assert.equal(FakeAudio.instances[0].playCalls, 1);
});

// --- playMusic(): loop, reemplazo y única música activa ---

test("playMusic sin loop configura el elemento con loop=false por defecto", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playMusic(OTHER_MUSIC_PATH);

  assert.equal(FakeAudio.instances[0].loop, false);
});

test("playMusic con loop=true configura el elemento en loop", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playMusic(OTHER_MUSIC_PATH, { loop: true });

  assert.equal(FakeAudio.instances[0].loop, true);
});

test("llamar a playMusic dos veces con el mismo src mantiene una única música activa", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playMusic(OTHER_MUSIC_PATH, { loop: true });
  service.playMusic(OTHER_MUSIC_PATH, { loop: true });

  assert.equal(FakeAudio.instances.length, 1);
  assert.equal(FakeAudio.instances[0].playCalls, 1);
  assert.equal(FakeAudio.instances[0].pauseCalls, 0);
});

test("playMusic con un src distinto detiene la música anterior y reproduce la nueva", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playMusic(EPILOGUE_THEME_PATH);
  const first = FakeAudio.instances[0];

  service.playMusic(OTHER_MUSIC_PATH, { loop: true });
  const second = FakeAudio.instances[1];

  assert.equal(FakeAudio.instances.length, 2);
  assert.equal(first.pauseCalls, 1);
  assert.equal(first.currentTime, 0);
  assert.equal(second.src, OTHER_MUSIC_PATH);
  assert.equal(second.playCalls, 1);
});

test("tras reemplazar la música, playMusic con el src original la reproduce de nuevo desde el principio", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playMusic(EPILOGUE_THEME_PATH);
  service.playMusic(OTHER_MUSIC_PATH);
  service.playMusic(EPILOGUE_THEME_PATH);

  assert.equal(FakeAudio.instances.length, 3);
  assert.equal(FakeAudio.instances[2].src, EPILOGUE_THEME_PATH);
  assert.equal(FakeAudio.instances[2].playCalls, 1);
});

// --- stopMusic() ---

test("stopMusic pausa y reinicia la música activa", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playMusic(OTHER_MUSIC_PATH);
  const [instance] = FakeAudio.instances;
  instance.currentTime = 12.5;

  service.stopMusic();

  assert.equal(instance.pauseCalls, 1);
  assert.equal(instance.currentTime, 0);
});

test("stopMusic sin ninguna música activa es un no-op seguro", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  assert.doesNotThrow(() => service.stopMusic());
  assert.equal(FakeAudio.instances.length, 0);
});

test("stopMusic libera la referencia activa: una llamada posterior a playMusic no es idempotente", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playMusic(OTHER_MUSIC_PATH);
  service.stopMusic();
  service.playMusic(OTHER_MUSIC_PATH);

  assert.equal(FakeAudio.instances.length, 2);
  assert.equal(FakeAudio.instances[1].playCalls, 1);
});

test("un fallo de pause()/currentTime en stopMusic no lanza y libera igualmente la referencia", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playMusic(OTHER_MUSIC_PATH);
  FakeAudio.instances[0].pause = () => {
    throw new Error("pause() no soportado");
  };

  assert.doesNotThrow(() => service.stopMusic());

  service.playMusic(OTHER_MUSIC_PATH);
  assert.equal(FakeAudio.instances.length, 2);
});

// --- playSfx(): independiente de la música activa ---

test("playSfx crea un elemento propio, distinto de la música activa", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playMusic(OTHER_MUSIC_PATH, { loop: true });
  service.playSfx(SFX_PATH);

  assert.equal(FakeAudio.instances.length, 2);
  assert.equal(FakeAudio.instances[1].src, SFX_PATH);
  assert.equal(FakeAudio.instances[1].playCalls, 1);
});

test("playSfx no sustituye ni detiene la música activa", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playMusic(OTHER_MUSIC_PATH, { loop: true });
  const musicInstance = FakeAudio.instances[0];

  service.playSfx(SFX_PATH);

  assert.equal(musicInstance.pauseCalls, 0);
  assert.equal(service.activeMusic, musicInstance);
  assert.equal(service.activeMusicSrc, OTHER_MUSIC_PATH);
});

test("varios SFX consecutivos no acumulan estado ni afectan a la música activa", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playMusic(OTHER_MUSIC_PATH, { loop: true });
  service.playSfx(SFX_PATH);
  service.playSfx(SFX_PATH);
  service.playSfx(SFX_PATH);

  assert.equal(FakeAudio.instances.length, 4);
  assert.equal(service.activeMusicSrc, OTHER_MUSIC_PATH);
  assert.equal(FakeAudio.instances[0].pauseCalls, 0);
});

// --- Manejo de errores: play() asíncrono/síncrono, y ausencia de constructor ---

test("una promesa rechazada por play() de playMusic queda absorbida, sin rechazo sin manejar", async () => {
  const FakeAudio = createFakeAudioConstructor({
    playImplementation: () =>
      Promise.reject(new Error("bloqueado por el navegador")),
  });
  const service = new AudioService(FakeAudio);

  let unhandled = null;
  const onUnhandledRejection = (reason) => {
    unhandled = reason;
  };
  process.on("unhandledRejection", onUnhandledRejection);

  assert.doesNotThrow(() => service.playMusic(OTHER_MUSIC_PATH));

  await new Promise((resolve) => setImmediate(resolve));
  process.off("unhandledRejection", onUnhandledRejection);

  assert.equal(unhandled, null);
});

test("una promesa rechazada por play() de playSfx queda absorbida, sin rechazo sin manejar", async () => {
  const FakeAudio = createFakeAudioConstructor({
    playImplementation: () => Promise.reject(new Error("bloqueado")),
  });
  const service = new AudioService(FakeAudio);

  let unhandled = null;
  const onUnhandledRejection = (reason) => {
    unhandled = reason;
  };
  process.on("unhandledRejection", onUnhandledRejection);

  assert.doesNotThrow(() => service.playSfx(SFX_PATH));

  await new Promise((resolve) => setImmediate(resolve));
  process.off("unhandledRejection", onUnhandledRejection);

  assert.equal(unhandled, null);
});

test("una excepción síncrona de play() queda absorbida y no deja el servicio en un estado corrupto", () => {
  const FakeAudio = createFakeAudioConstructor({
    playImplementation: () => {
      throw new Error("play síncrono falló");
    },
  });
  const service = new AudioService(FakeAudio);

  assert.doesNotThrow(() => service.playMusic(OTHER_MUSIC_PATH));
  assert.equal(service.activeMusicSrc, OTHER_MUSIC_PATH);
  assert.doesNotThrow(() => service.stopMusic());
});

test("un fallo al construir el elemento de audio no lanza y dobla como no-op idempotente", () => {
  class ThrowingAudioConstructor {
    constructor() {
      throw new Error("no se pudo crear el elemento de audio");
    }
  }

  const service = new AudioService(ThrowingAudioConstructor);

  assert.doesNotThrow(() => service.playMusic(OTHER_MUSIC_PATH));
  assert.equal(service.activeMusic, null);
  assert.equal(service.activeMusicSrc, OTHER_MUSIC_PATH);

  assert.doesNotThrow(() => service.playMusic(OTHER_MUSIC_PATH));
});

test("ausencia de constructor Audio produce un no-op seguro en playMusic, stopMusic y playSfx", () => {
  const service = new AudioService(undefined);

  assert.doesNotThrow(() => service.playMusic(OTHER_MUSIC_PATH));
  assert.equal(service.activeMusic, null);

  assert.doesNotThrow(() => service.playSfx(SFX_PATH));
  assert.doesNotThrow(() => service.stopMusic());
});

test("un fallo de audio no expone ninguna propiedad relacionada con GameState o progreso", () => {
  class ThrowingAudioConstructor {
    constructor() {
      throw new Error("fallo de audio");
    }
  }

  const service = new AudioService(ThrowingAudioConstructor);
  service.playEpilogueTheme();

  const ownKeys = Object.keys(service);
  assert.deepEqual(ownKeys.sort(), [
    "AudioConstructor",
    "activeMusic",
    "activeMusicSrc",
  ]);
});

function createFakeAudioConstructor({ playImplementation } = {}) {
  const instances = [];

  class FakeAudio {
    constructor() {
      this.src = "";
      this.loop = null;
      this.playCalls = 0;
      this.pauseCalls = 0;
      this.currentTime = 0;
      instances.push(this);
    }

    play() {
      this.playCalls += 1;

      if (playImplementation) {
        return playImplementation(this);
      }

      return Promise.resolve();
    }

    pause() {
      this.pauseCalls += 1;
    }

    addEventListener() {}
  }

  FakeAudio.instances = instances;
  return FakeAudio;
}
