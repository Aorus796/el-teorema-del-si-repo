import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_PIXEL_HEIGHT,
  MAX_PIXEL_WIDTH,
} from "../../src/content/maxPixelArt.js";
import { getWorldMap } from "../../src/content/worldMaps.js";

/*
 * Cubre la cache de sprites de MaxRenderer.js (propia, local a ese
 * módulo -- ver el comentario en el propio archivo). Mismo patrón que
 * tests/render/SilogioRenderer.test.js/BrideFatherRenderer.test.js/
 * CorolariaRenderer.test.js/ElenaRenderer.test.js/GonzaloRenderer.test.js:
 * simula un `document` mínimo ANTES de importar el renderer, para que
 * su cache tome la rama "hay DOM" en vez del fallback usado por el
 * resto de la suite. Vive en su propio archivo por la misma razón: la
 * cache es un Map de módulo compartido entre todos los test() de este
 * archivo bajo `node --test`.
 *
 * A diferencia de los renderers humanos, renderMax(context, x, y) NO
 * tiene parámetro de facing (Max nunca gira visualmente -- ver el
 * comentario de MaxRenderer.js), así que no hay tests de "up"/"right"/
 * "left" aquí: solo existe una pose, cacheada bajo una única clave.
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
    this.imageSmoothingEnabled = true;
  }

  fillRect() {}

  drawImage(image, x, y) {
    this.drawImageCalls.push({ image, x, y });
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

const { renderMax, MAX_DIMENSIONS } = await import(
  "../../src/render/MaxRenderer.js"
);

test("MAX_DIMENSIONS coincide con las dimensiones declaradas en los datos", () => {
  assert.equal(MAX_DIMENSIONS.width, MAX_PIXEL_WIDTH);
  assert.equal(MAX_DIMENSIONS.height, MAX_PIXEL_HEIGHT);
});

test("renderMax() rasteriza el sprite en un canvas aparte, sin smoothing, y lo reutiliza con drawImage", () => {
  createdCanvases.length = 0;

  const context = new FakeGameContext();
  renderMax(context, 10, 20);

  assert.equal(createdCanvases.length, 1);
  const [canvas] = createdCanvases;

  assert.equal(canvas.width, MAX_PIXEL_WIDTH);
  assert.equal(canvas.height, MAX_PIXEL_HEIGHT);
  assert.equal(canvas.context.imageSmoothingEnabled, false);
  assert.ok(canvas.context.fillRectCalls > 0);

  assert.equal(context.drawImageCalls.length, 1);
  assert.equal(context.drawImageCalls[0].image, canvas);
  assert.equal(context.drawImageCalls[0].x, 10);
  assert.equal(context.drawImageCalls[0].y, 20);
});

test("un segundo render no crea un canvas nuevo (cache, no reconstrucción por frame)", () => {
  const canvasCountAfterFirstFrame = createdCanvases.length;

  const first = new FakeGameContext();
  const second = new FakeGameContext();

  renderMax(first, 10, 20);
  renderMax(second, 15, 25);

  assert.equal(createdCanvases.length, canvasCountAfterFirstFrame);
  assert.equal(first.drawImageCalls[0].image, second.drawImageCalls[0].image);
});

test("renderMax() se desplaza correctamente con el origen (x, y) dado", () => {
  const context = new FakeGameContext();
  renderMax(context, 40, 20);

  assert.equal(context.drawImageCalls[0].x, 40);
  assert.equal(context.drawImageCalls[0].y, 20);
});

test("ningún mapa incluye todavía a Max como objeto jugable", () => {
  const mapIds = ["axiom-plaza", "seven-bridges-walk", "library", "archive"];

  for (const mapId of mapIds) {
    const map = getWorldMap(mapId);
    const hasMax = map.objects.some((object) => object.id === "max");

    assert.equal(hasMax, false, `el mapa "${mapId}" no debería incluir a Max`);
  }
});
