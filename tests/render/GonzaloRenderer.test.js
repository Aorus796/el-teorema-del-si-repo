import assert from "node:assert/strict";
import test from "node:test";
import {
  GONZALO_PIXEL_HEIGHT,
  GONZALO_PIXEL_WIDTH,
} from "../../src/content/gonzaloPixelArt.js";

/*
 * Cubre la cache de sprites de GonzaloRenderer.js (propia, local a ese
 * módulo -- ver el comentario en el propio archivo sobre por qué no
 * reutiliza propSpriteCache de WorldScene.js). Mismo patrón que
 * tests/scenes/WorldScenePixelArtCache.test.js: simula un `document`
 * mínimo ANTES de importar el renderer, para que su cache tome la rama
 * "hay DOM" en vez del fallback usado por el resto de la suite. Vive en
 * su propio archivo por la misma razón: la cache es un Map de módulo
 * compartido entre todos los test() de este archivo bajo `node --test`.
 */

class FakeSpriteContext {
  constructor() {
    this.imageSmoothingEnabled = true;
    this.fillRectCalls = 0;
  }

  fillRect() {
    this.fillRectCalls += 1;
  }
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
    this.saveCalls = 0;
    this.restoreCalls = 0;
    this.imageSmoothingEnabled = true;
  }

  fillRect() {}

  drawImage(image, x, y) {
    this.drawImageCalls.push({ image, x, y });
  }

  save() {
    this.saveCalls += 1;
  }

  restore() {
    this.restoreCalls += 1;
  }

  translate() {}

  scale() {}
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

const { renderGonzalo, GONZALO_DIMENSIONS } = await import(
  "../../src/render/GonzaloRenderer.js"
);

test("GONZALO_DIMENSIONS coincide con las dimensiones declaradas en los datos", () => {
  assert.equal(GONZALO_DIMENSIONS.width, GONZALO_PIXEL_WIDTH);
  assert.equal(GONZALO_DIMENSIONS.height, GONZALO_PIXEL_HEIGHT);
});

test("renderGonzalo() rasteriza el frontal en un canvas aparte, sin smoothing, y lo reutiliza con drawImage", () => {
  createdCanvases.length = 0;

  const context = new FakeGameContext();
  renderGonzalo(context, 10, 20, "down");

  assert.equal(createdCanvases.length, 1);
  const [canvas] = createdCanvases;

  assert.equal(canvas.width, GONZALO_PIXEL_WIDTH);
  assert.equal(canvas.height, GONZALO_PIXEL_HEIGHT);
  assert.equal(canvas.context.imageSmoothingEnabled, false);
  assert.ok(canvas.context.fillRectCalls > 0);

  assert.equal(context.drawImageCalls.length, 1);
  assert.equal(context.drawImageCalls[0].image, canvas);
  assert.equal(context.drawImageCalls[0].x, 10);
  assert.equal(context.drawImageCalls[0].y, 20);
});

test("un segundo render con el mismo facing no crea un canvas nuevo (cache, no reconstrucción por frame)", () => {
  const canvasCountAfterFirstFrame = createdCanvases.length;

  const first = new FakeGameContext();
  const second = new FakeGameContext();

  renderGonzalo(first, 10, 20, "down");
  renderGonzalo(second, 15, 25, "down");

  assert.equal(createdCanvases.length, canvasCountAfterFirstFrame);
  assert.equal(first.drawImageCalls[0].image, second.drawImageCalls[0].image);
});

test("facing 'up' (espalda) cachea un canvas DISTINTO del frontal", () => {
  const canvasCountBefore = createdCanvases.length;

  const context = new FakeGameContext();
  renderGonzalo(context, 0, 0, "up");

  assert.equal(createdCanvases.length, canvasCountBefore + 1);
});

test("facing 'right' (lateral) cachea un tercer canvas distinto", () => {
  const canvasCountBefore = createdCanvases.length;

  const context = new FakeGameContext();
  renderGonzalo(context, 0, 0, "right");

  assert.equal(createdCanvases.length, canvasCountBefore + 1);
});

test("facing 'left' reutiliza el MISMO canvas cacheado que 'right' (reflejado en tiempo de dibujo, no un cuarto canvas)", () => {
  const rightContext = new FakeGameContext();
  renderGonzalo(rightContext, 0, 0, "right");

  // Capturado DESPUÉS de "right" (que ya pudo haber cacheado su canvas en
  // un test anterior de este archivo) y ANTES de "left": lo que esta
  // prueba demuestra es que dibujar "left" no añade ningún canvas
  // respecto a este punto, no una comparación de la misma variable
  // consigo misma.
  const canvasCountAfterRight = createdCanvases.length;

  const leftContext = new FakeGameContext();
  renderGonzalo(leftContext, 0, 0, "left");

  assert.equal(createdCanvases.length, canvasCountAfterRight);

  assert.equal(
    leftContext.drawImageCalls[0].image,
    rightContext.drawImageCalls[0].image,
  );
});

test("facing 'left' aplica una transformación de canvas (save/scale/translate/restore) para reflejar, sin rasterizar de nuevo", () => {
  const context = new FakeGameContext();
  renderGonzalo(context, 0, 0, "left");

  assert.equal(context.saveCalls, 1);
  assert.equal(context.restoreCalls, 1);
  assert.equal(context.drawImageCalls.length, 1);
});
