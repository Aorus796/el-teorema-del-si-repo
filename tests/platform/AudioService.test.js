import assert from "node:assert/strict";
import test from "node:test";
import { AudioService } from "../../src/platform/AudioService.js";
import { EPILOGUE_THEME_PATH } from "../../src/content/epilogueAudioConfig.js";

test("playEpilogueTheme crea como máximo un HTMLAudioElement, incluso tras varias llamadas", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playEpilogueTheme();
  service.playEpilogueTheme();
  service.playEpilogueTheme();

  assert.equal(FakeAudio.instances.length, 1);
});

test("usa la ruta centralizada del recurso", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playEpilogueTheme();

  assert.equal(FakeAudio.instances[0].src, EPILOGUE_THEME_PATH);
});

test("la llamada inicial configura el recurso y reproduce exactamente una vez", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playEpilogueTheme();

  assert.equal(FakeAudio.instances[0].playCalls, 1);
});

test("llamadas repetidas no crean audio superpuesto ni reinician la reproducción", () => {
  const FakeAudio = createFakeAudioConstructor();
  const service = new AudioService(FakeAudio);

  service.playEpilogueTheme();
  service.playEpilogueTheme();
  service.playEpilogueTheme();

  assert.equal(FakeAudio.instances.length, 1);
  assert.equal(FakeAudio.instances[0].playCalls, 1);
});

test("una promesa rechazada por play() queda absorbida, sin rechazo sin manejar", async () => {
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

  assert.doesNotThrow(() => service.playEpilogueTheme());

  await new Promise((resolve) => setImmediate(resolve));
  process.off("unhandledRejection", onUnhandledRejection);

  assert.equal(unhandled, null);
});

test("una excepción síncrona de play() queda absorbida", () => {
  const FakeAudio = createFakeAudioConstructor({
    playImplementation: () => {
      throw new Error("play síncrono falló");
    },
  });
  const service = new AudioService(FakeAudio);

  assert.doesNotThrow(() => service.playEpilogueTheme());
  assert.equal(service.hasStarted, true);
});

test("un fallo al construir el elemento de audio no lanza", () => {
  class ThrowingAudioConstructor {
    constructor() {
      throw new Error("no se pudo crear el elemento de audio");
    }
  }

  const service = new AudioService(ThrowingAudioConstructor);

  assert.doesNotThrow(() => service.playEpilogueTheme());
  assert.equal(service.hasStarted, true);
  assert.equal(service.audioElement, null);
});

test("ausencia de constructor Audio produce un no-op seguro", () => {
  const service = new AudioService(undefined);

  assert.doesNotThrow(() => service.playEpilogueTheme());
  assert.equal(service.audioElement, null);

  assert.doesNotThrow(() => service.playEpilogueTheme());
  assert.equal(service.hasStarted, true);
});

function createFakeAudioConstructor({ playImplementation } = {}) {
  const instances = [];

  class FakeAudio {
    constructor() {
      this.src = "";
      this.loop = null;
      this.playCalls = 0;
      instances.push(this);
    }

    play() {
      this.playCalls += 1;

      if (playImplementation) {
        return playImplementation(this);
      }

      return Promise.resolve();
    }

    addEventListener() {}
  }

  FakeAudio.instances = instances;
  return FakeAudio;
}
