import assert from "node:assert/strict";
import test from "node:test";
import { GameState } from "../../src/state/GameState.js";
import {
  LIBRARY_SHELF_NARROW_PIXEL_HEIGHT,
  LIBRARY_SHELF_NARROW_PIXEL_WIDTH,
  LIBRARY_SHELF_WIDE_PIXEL_HEIGHT,
  LIBRARY_SHELF_WIDE_PIXEL_WIDTH,
} from "../../src/content/libraryShelfPixelArt.js";
import {
  LIBRARY_READING_TABLE_PIXEL_HEIGHT,
  LIBRARY_READING_TABLE_PIXEL_WIDTH,
} from "../../src/content/libraryReadingTablePixelArt.js";
import {
  LIBRARY_LADDER_PIXEL_HEIGHT,
  LIBRARY_LADDER_PIXEL_WIDTH,
} from "../../src/content/libraryLadderPixelArt.js";
import {
  LIBRARY_EMBLEM_PIXEL_HEIGHT,
  LIBRARY_EMBLEM_PIXEL_WIDTH,
} from "../../src/content/libraryEmblemPixelArt.js";

/*
 * Cubre la capa de cache de sprites pixel-art (src/scenes/WorldScene.js)
 * para el mobiliario nuevo/migrado de library (Biblioteca del Margen --
 * Visual Polish, v1.1). Mismo patrón que
 * tests/scenes/SevenBridgesPixelArtCache.test.js: vive en su propio
 * archivo porque `node --test` aísla cada archivo en un proceso propio,
 * así el `document` simulado y el propSpriteCache que rellena no
 * contaminan el resto de la suite (que depende de que `document` sea
 * `undefined`).
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

function createLibraryScene() {
  const state = new GameState();
  state.changeMap("library");

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
 * El spawn por defecto de library (240,256, ver GameState.js) ya trae a
 * la vista, con la cámara de 480x270 y el mapa de 480x320 (30x20 tiles
 * de 16px), las 6 estanterías (dos parcialmente recortadas por arriba,
 * pero no descartadas del todo por renderForegroundDecorations -- ver el
 * comentario de culling en WorldScene.js), las 3 mesas de lectura, la
 * escalera y el emblema -- no hace falta reposicionar al jugador para
 * que un único render() rasterice los 5 tipos nuevos.
 */
function findCanvasByDimensions(width, height) {
  return createdCanvases.find(
    (canvas) => canvas.width === width && canvas.height === height,
  );
}

test("las dos variantes de 'library-shelf' (wide y narrow) se cachean como dos canvases distintos, con imageSmoothingEnabled=false y fillRect por cada píxel no transparente", () => {
  const scene = createLibraryScene();
  const context = new FakeGameContext();

  scene.render(context);

  const wideCanvas = findCanvasByDimensions(
    LIBRARY_SHELF_WIDE_PIXEL_WIDTH,
    LIBRARY_SHELF_WIDE_PIXEL_HEIGHT,
  );
  const narrowCanvas = findCanvasByDimensions(
    LIBRARY_SHELF_NARROW_PIXEL_WIDTH,
    LIBRARY_SHELF_NARROW_PIXEL_HEIGHT,
  );

  assert.ok(
    wideCanvas,
    `se esperaba un canvas cacheado de ${LIBRARY_SHELF_WIDE_PIXEL_WIDTH}x${LIBRARY_SHELF_WIDE_PIXEL_HEIGHT} para la estantería ancha`,
  );
  assert.ok(
    narrowCanvas,
    `se esperaba un canvas cacheado de ${LIBRARY_SHELF_NARROW_PIXEL_WIDTH}x${LIBRARY_SHELF_NARROW_PIXEL_HEIGHT} para la estantería estrecha`,
  );
  assert.notEqual(
    wideCanvas,
    narrowCanvas,
    "wide y narrow deben ser dos canvases cacheados distintos",
  );

  for (const canvas of [wideCanvas, narrowCanvas]) {
    assert.equal(canvas.context.imageSmoothingEnabled, false);
    assert.ok(
      canvas.context.fillRectCalls > 0,
      "la estantería debe haberse rasterizado con fillRect",
    );
    // "library-shelf" no usa transparencia (ninguna fila de sus datos
    // contiene "."), así que el número de fillRect debe ser exactamente
    // ancho*alto: un fillRect por píxel.
    assert.equal(canvas.context.fillRectCalls, canvas.width * canvas.height);
  }
});

test("'library-reading-table' se cachea con las dimensiones declaradas por sus datos, con imageSmoothingEnabled=false", () => {
  const scene = createLibraryScene();
  const context = new FakeGameContext();

  scene.render(context);

  const canvas = findCanvasByDimensions(
    LIBRARY_READING_TABLE_PIXEL_WIDTH,
    LIBRARY_READING_TABLE_PIXEL_HEIGHT,
  );

  assert.ok(
    canvas,
    `se esperaba un canvas cacheado de ${LIBRARY_READING_TABLE_PIXEL_WIDTH}x${LIBRARY_READING_TABLE_PIXEL_HEIGHT} para la mesa de lectura`,
  );
  assert.equal(canvas.context.imageSmoothingEnabled, false);
  assert.ok(canvas.context.fillRectCalls > 0);
  assert.ok(
    canvas.context.fillRectCalls < canvas.width * canvas.height,
    "la mesa de lectura sí usa transparencia, debe haber menos fillRect que píxeles totales",
  );
});

test("'library-ladder' se cachea con las dimensiones declaradas por sus datos, con imageSmoothingEnabled=false", () => {
  const scene = createLibraryScene();
  const context = new FakeGameContext();

  scene.render(context);

  const canvas = findCanvasByDimensions(
    LIBRARY_LADDER_PIXEL_WIDTH,
    LIBRARY_LADDER_PIXEL_HEIGHT,
  );

  assert.ok(
    canvas,
    `se esperaba un canvas cacheado de ${LIBRARY_LADDER_PIXEL_WIDTH}x${LIBRARY_LADDER_PIXEL_HEIGHT} para la escalera`,
  );
  assert.equal(canvas.context.imageSmoothingEnabled, false);
  assert.ok(canvas.context.fillRectCalls > 0);
  assert.ok(canvas.context.fillRectCalls < canvas.width * canvas.height);
});

test("'library-emblem' se cachea con las dimensiones declaradas por sus datos, con imageSmoothingEnabled=false", () => {
  const scene = createLibraryScene();
  const context = new FakeGameContext();

  scene.render(context);

  const canvas = findCanvasByDimensions(
    LIBRARY_EMBLEM_PIXEL_WIDTH,
    LIBRARY_EMBLEM_PIXEL_HEIGHT,
  );

  assert.ok(
    canvas,
    `se esperaba un canvas cacheado de ${LIBRARY_EMBLEM_PIXEL_WIDTH}x${LIBRARY_EMBLEM_PIXEL_HEIGHT} para el emblema`,
  );
  assert.equal(canvas.context.imageSmoothingEnabled, false);
  assert.ok(canvas.context.fillRectCalls > 0);
  assert.ok(canvas.context.fillRectCalls < canvas.width * canvas.height);
});

test("un segundo render de library no crea canvases de sprite adicionales para los props ya cacheados", () => {
  const scene = createLibraryScene();
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
