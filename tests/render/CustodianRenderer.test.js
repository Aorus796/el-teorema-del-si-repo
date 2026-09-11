import assert from "node:assert/strict";
import test from "node:test";
import {
  CUSTODIAN_IDLE_PIXELS,
  CUSTODIAN_PIXEL_HEIGHT,
  CUSTODIAN_PIXEL_WIDTH,
  CUSTODIAN_TRANSPARENT,
} from "../../src/content/custodianPixelArt.js";

/*
 * Cubre la cache de sprites de CustodianRenderer.js (propia, local a ese
 * módulo). Mismo patrón que tests/render/ElenaRenderer.test.js: simula un
 * `document` mínimo ANTES de importar el renderer, para que su cache tome
 * la rama "hay DOM" en vez del fallback usado por el resto de la suite.
 * Vive en su propio archivo por la misma razón: la cache es un Map de
 * módulo compartido entre todos los test() de este archivo bajo
 * `node --test`.
 */

class FakeSpriteContext {
  constructor() {
    this.imageSmoothingEnabled = true;
    this.fillRectCalls = 0;
    this.usedFillStyles = new Set();
  }

  set fillStyle(value) {
    this.currentFillStyle = value;
  }

  get fillStyle() {
    return this.currentFillStyle;
  }

  fillRect() {
    this.fillRectCalls += 1;
    this.usedFillStyles.add(this.currentFillStyle);
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

globalThis.document = {
  createElement(tagName) {
    assert.equal(tagName, "canvas");

    const canvas = new FakeSpriteCanvas();
    createdCanvases.push(canvas);
    return canvas;
  },
};

const { renderCustodian, CUSTODIAN_DIMENSIONS, CUSTODIAN_VARIANT } =
  await import("../../src/render/CustodianRenderer.js");

function countOpaquePixels(pixels) {
  return pixels.reduce(
    (total, row) =>
      total +
      [...row].filter((symbol) => symbol !== CUSTODIAN_TRANSPARENT).length,
    0,
  );
}

test("CUSTODIAN_DIMENSIONS coincide con las dimensiones declaradas en los datos", () => {
  assert.equal(CUSTODIAN_DIMENSIONS.width, CUSTODIAN_PIXEL_WIDTH);
  assert.equal(CUSTODIAN_DIMENSIONS.height, CUSTODIAN_PIXEL_HEIGHT);
});

test("renderCustodian() rasteriza el reposo en un canvas aparte, sin smoothing, y lo reutiliza con drawImage", () => {
  createdCanvases.length = 0;

  const context = new FakeGameContext();
  renderCustodian(context, 10, 20);

  assert.equal(createdCanvases.length, 1);
  const [canvas] = createdCanvases;

  assert.equal(canvas.width, CUSTODIAN_PIXEL_WIDTH);
  assert.equal(canvas.height, CUSTODIAN_PIXEL_HEIGHT);
  assert.equal(canvas.context.imageSmoothingEnabled, false);
  assert.equal(
    canvas.context.fillRectCalls,
    countOpaquePixels(CUSTODIAN_IDLE_PIXELS),
    "un fillRect de 1x1 por píxel no transparente, ni uno más",
  );

  assert.equal(context.drawImageCalls.length, 1);
  assert.equal(context.drawImageCalls[0].image, canvas);
  assert.equal(context.drawImageCalls[0].x, 10);
  assert.equal(context.drawImageCalls[0].y, 20);
});

test("un segundo render no crea un canvas nuevo (cache, no reconstrucción por frame)", () => {
  const canvasCountBefore = createdCanvases.length;

  const first = new FakeGameContext();
  const second = new FakeGameContext();

  renderCustodian(first, 10, 20);
  renderCustodian(second, 15, 25);

  assert.equal(createdCanvases.length, canvasCountBefore);
  assert.equal(first.drawImageCalls[0].image, second.drawImageCalls[0].image);
});

test("la variante 'contradiction' cachea un canvas DISTINTO del de reposo", () => {
  const canvasCountBefore = createdCanvases.length;

  const idleContext = new FakeGameContext();
  const contradictionContext = new FakeGameContext();

  renderCustodian(idleContext, 0, 0, CUSTODIAN_VARIANT.IDLE);
  renderCustodian(
    contradictionContext,
    0,
    0,
    CUSTODIAN_VARIANT.CONTRADICTION,
  );

  assert.equal(createdCanvases.length, canvasCountBefore + 1);
  assert.notEqual(
    idleContext.drawImageCalls[0].image,
    contradictionContext.drawImageCalls[0].image,
  );
});

/*
 * El Custodio no camina: el renderer no acepta facing, y cualquier valor
 * desconocido cae en reposo en vez de inventarse una variante. Regresión
 * directa de la simplificación documentada en CustodianRenderer.js.
 */
test("una variante desconocida reutiliza el sprite de reposo, sin rasterizar nada nuevo", () => {
  const idleContext = new FakeGameContext();
  renderCustodian(idleContext, 0, 0, CUSTODIAN_VARIANT.IDLE);

  const canvasCountBefore = createdCanvases.length;

  const unknownContext = new FakeGameContext();
  renderCustodian(unknownContext, 0, 0, "right");

  assert.equal(createdCanvases.length, canvasCountBefore);
  assert.equal(
    unknownContext.drawImageCalls[0].image,
    idleContext.drawImageCalls[0].image,
  );
});

test("renderCustodian() sin variante explícita dibuja el reposo", () => {
  const explicit = new FakeGameContext();
  const implicit = new FakeGameContext();

  renderCustodian(explicit, 0, 0, CUSTODIAN_VARIANT.IDLE);
  renderCustodian(implicit, 0, 0);

  assert.equal(
    implicit.drawImageCalls[0].image,
    explicit.drawImageCalls[0].image,
  );
});

test("las coordenadas de dibujo se redondean (rejilla de píxel entero)", () => {
  const context = new FakeGameContext();
  renderCustodian(context, 10.4, 20.6);

  assert.deepEqual(
    {
      x: context.drawImageCalls[0].x,
      y: context.drawImageCalls[0].y,
    },
    { x: 10, y: 21 },
  );
});
