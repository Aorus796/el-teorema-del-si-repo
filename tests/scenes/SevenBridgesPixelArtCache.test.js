import assert from "node:assert/strict";
import test from "node:test";
import { GameState } from "../../src/state/GameState.js";
import {
  PIER_CENTER_PIXEL_HEIGHT,
  PIER_CENTER_PIXEL_WIDTH,
  PIER_SIDE_PIXEL_HEIGHT,
  PIER_SIDE_PIXEL_WIDTH,
} from "../../src/content/pierPixelArt.js";
import {
  BRIDGE_PIXEL_HEIGHT,
  BRIDGE_PIXEL_WIDTH,
} from "../../src/content/bridgePixelArt.js";
import {
  PATH_SIGN_PIXEL_HEIGHT,
  PATH_SIGN_PIXEL_WIDTH,
} from "../../src/content/pathSignPixelArt.js";

/*
 * Cubre la capa de cache de sprites pixel-art (src/scenes/WorldScene.js)
 * para los props nuevos de seven-bridges-walk (Seven Bridges Visual
 * Polish). Mismo patrón que tests/scenes/WorldScenePixelArtCache.test.js
 * para axiom-plaza: vive en su propio archivo porque `node --test` aísla
 * cada archivo en un proceso propio, así el `document` simulado y el
 * propSpriteCache que rellena no contaminan el resto de la suite (que
 * depende de que `document` sea `undefined`).
 */

class FakeSpriteContext {
  constructor() {
    this.imageSmoothingEnabled = true;
    this.fillRectCalls = 0;
  }

  fillRect() {
    this.fillRectCalls += 1;
  }

  strokeRect() {}

  fillText() {}
}

class FakeSpriteCanvas {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.context = new FakeSpriteContext();
  }

  getContext(type) {
    assert.equal(type, "2d");
    return this.context;
  }
}

class FakeGameContext {
  constructor() {
    this.drawImageCalls = [];
    this.imageSmoothingEnabled = true;
  }

  fillRect() {}

  strokeRect() {}

  fillText() {}

  drawImage(image, x, y) {
    this.drawImageCalls.push({ image, x, y });
  }
}

class FakeInput {
  wasPressed() {
    return false;
  }

  getAxis() {
    return { x: 0, y: 0 };
  }
}

class FakeScenes {
  change() {}
}

class FakeUi {
  closeAll() {}

  hidePrompt() {}

  showPrompt() {}

  showToast() {}
}

class FakeAudioService {
  playEpilogueTheme() {}

  playMusic() {}

  stopMusic() {}

  playSfx() {}
}

class FakeStorage {
  save() {}

  load() {
    return null;
  }
}

const createdCanvases = [];

const fakeDocument = {
  createElement(tagName) {
    assert.equal(tagName, "canvas");

    const canvas = new FakeSpriteCanvas();
    createdCanvases.push(canvas);
    return canvas;
  },
};

globalThis.document = fakeDocument;

const { WorldScene } = await import("../../src/scenes/WorldScene.js");

function createSevenBridgesWalkScene(playerPosition = null) {
  const state = new GameState();
  state.changeMap("seven-bridges-walk", playerPosition);

  const scene = new WorldScene({
    scenes: new FakeScenes(),
    input: new FakeInput(),
    storage: new FakeStorage(),
    state,
    ui: new FakeUi(),
    audio: new FakeAudioService(),
  });

  scene.enter();
  return scene;
}

/*
 * El spawn por defecto de seven-bridges-walk (48,192, ver GameState.js) ya
 * trae a la vista, con la cámara de 480x270 centrada en el jugador, el
 * pilar lateral izquierdo, el pilar central, el puente oeste y el cartel
 * junto al tablero del puzle P2 -- no hace falta reposicionar al jugador
 * para estos cuatro props nuevos.
 */
test("los pilares laterales y central de seven-bridges-walk se cachean con las dimensiones declaradas por sus datos", () => {
  const scene = createSevenBridgesWalkScene();
  const context = new FakeGameContext();

  scene.render(context);

  const sideCanvas = createdCanvases.find(
    (canvas) =>
      canvas.width === PIER_SIDE_PIXEL_WIDTH &&
      canvas.height === PIER_SIDE_PIXEL_HEIGHT,
  );
  const centerCanvas = createdCanvases.find(
    (canvas) =>
      canvas.width === PIER_CENTER_PIXEL_WIDTH &&
      canvas.height === PIER_CENTER_PIXEL_HEIGHT,
  );

  assert.ok(
    sideCanvas,
    `se esperaba un canvas cacheado de ${PIER_SIDE_PIXEL_WIDTH}x${PIER_SIDE_PIXEL_HEIGHT} para el pilar lateral`,
  );
  assert.ok(
    centerCanvas,
    `se esperaba un canvas cacheado de ${PIER_CENTER_PIXEL_WIDTH}x${PIER_CENTER_PIXEL_HEIGHT} para el pilar central`,
  );
  assert.ok(
    sideCanvas.context.fillRectCalls > 0 && centerCanvas.context.fillRectCalls > 0,
    "ambos pilares deben haberse rasterizado con primitivas de canvas",
  );
});

test("el tablero de puente se cachea con las dimensiones declaradas por sus datos", () => {
  const scene = createSevenBridgesWalkScene();
  const context = new FakeGameContext();

  scene.render(context);

  const bridgeCanvas = createdCanvases.find(
    (canvas) =>
      canvas.width === BRIDGE_PIXEL_WIDTH &&
      canvas.height === BRIDGE_PIXEL_HEIGHT,
  );

  assert.ok(
    bridgeCanvas,
    `se esperaba un canvas cacheado de ${BRIDGE_PIXEL_WIDTH}x${BRIDGE_PIXEL_HEIGHT} para el puente`,
  );
});

test("el cartel de señalética se cachea con las dimensiones declaradas por sus datos", () => {
  const scene = createSevenBridgesWalkScene();
  const context = new FakeGameContext();

  scene.render(context);

  const signCanvas = createdCanvases.find(
    (canvas) =>
      canvas.width === PATH_SIGN_PIXEL_WIDTH &&
      canvas.height === PATH_SIGN_PIXEL_HEIGHT,
  );

  assert.ok(
    signCanvas,
    `se esperaba un canvas cacheado de ${PATH_SIGN_PIXEL_WIDTH}x${PATH_SIGN_PIXEL_HEIGHT} para el cartel`,
  );
});

test("un segundo render de seven-bridges-walk no crea canvases de sprite adicionales para los props ya cacheados", () => {
  const scene = createSevenBridgesWalkScene();
  const firstFrame = new FakeGameContext();
  const secondFrame = new FakeGameContext();

  scene.render(firstFrame);
  const canvasCountAfterFirstFrame = createdCanvases.length;

  scene.render(secondFrame);

  assert.equal(
    createdCanvases.length,
    canvasCountAfterFirstFrame,
    "un segundo frame no debe rasterizar de nuevo ningún sprite ya cacheado",
  );

  const firstFrameImages = new Set(
    firstFrame.drawImageCalls.map((call) => call.image),
  );
  const secondFrameImages = new Set(
    secondFrame.drawImageCalls.map((call) => call.image),
  );

  assert.ok(firstFrameImages.size > 0);

  for (const image of secondFrameImages) {
    assert.ok(
      firstFrameImages.has(image),
      "el segundo frame debe reutilizar exactamente los mismos objetos canvas que el primero",
    );
  }
});
