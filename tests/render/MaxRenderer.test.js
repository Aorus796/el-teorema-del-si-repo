import assert from "node:assert/strict";
import test from "node:test";
import { MAX_DIMENSIONS, renderMax } from "../../src/render/MaxRenderer.js";
import { MAX_PALETTE } from "../../src/content/characterPalettes.js";
import { getWorldMap } from "../../src/content/worldMaps.js";

class FakeCanvasContext {
  constructor() {
    this.fillRects = [];
  }

  fillRect(x, y, width, height) {
    this.fillRects.push({ x, y, width, height, fillStyle: this.fillStyle });
  }
}

test("renderMax usa exclusivamente los tres colores de MAX_PALETTE, sin colores inventados", () => {
  const context = new FakeCanvasContext();

  renderMax(context, 0, 0);

  const usedColors = new Set(context.fillRects.map((rect) => rect.fillStyle));
  const allowedColors = new Set(Object.values(MAX_PALETTE));

  for (const color of usedColors) {
    assert.equal(allowedColors.has(color), true);
  }
});

test("renderMax dibuja cuerpo/cabeza, dos orejas erguidas, patas delantera y trasera, cola y una máscara, sin collar", () => {
  const context = new FakeCanvasContext();

  renderMax(context, 0, 0);

  const bodyRects = context.fillRects.filter(
    (rect) => rect.fillStyle === MAX_PALETTE.body,
  );
  const maskRects = context.fillRects.filter(
    (rect) => rect.fillStyle === MAX_PALETTE.mask,
  );
  const collarRects = context.fillRects.filter(
    (rect) => rect.fillStyle === MAX_PALETTE.collar,
  );

  assert.equal(bodyRects.length, 9);
  assert.equal(maskRects.length, 1);
  assert.equal(
    collarRects.length,
    0,
    "el collar se eliminó por completo del render",
  );
});

test("renderMax dibuja todas sus formas conectadas entre sí, sin piezas flotando por separado (cabeza, pecho, cuerpo, patas, cola)", () => {
  const context = new FakeCanvasContext();

  renderMax(context, 0, 0);

  const bodyRects = context.fillRects.filter(
    (rect) => rect.fillStyle === MAX_PALETTE.body,
  );

  const touches = (a, b) => {
    const xOverlap = a.x < b.x + b.width && a.x + a.width > b.x;
    const yOverlap = a.y < b.y + b.height && a.y + a.height > b.y;
    const xAdjacent = a.x === b.x + b.width || b.x === a.x + a.width;
    const yAdjacent = a.y === b.y + b.height || b.y === a.y + a.height;
    return (
      (xOverlap && yOverlap) ||
      (xOverlap && yAdjacent) ||
      (yOverlap && xAdjacent)
    );
  };

  const visited = new Set([0]);
  const queue = [0];
  while (queue.length > 0) {
    const current = queue.pop();
    for (let i = 0; i < bodyRects.length; i += 1) {
      if (visited.has(i)) {
        continue;
      }
      if (touches(bodyRects[current], bodyRects[i])) {
        visited.add(i);
        queue.push(i);
      }
    }
  }

  assert.equal(
    visited.size,
    bodyRects.length,
    `algunas formas de Max quedan desconectadas del resto (conectadas: ${visited.size} de ${bodyRects.length})`,
  );
});

test("renderMax dibuja al menos dos patas que llegan hasta la línea de suelo", () => {
  const context = new FakeCanvasContext();

  renderMax(context, 0, 0);

  const groundLine = MAX_DIMENSIONS.height;
  const legRects = context.fillRects.filter(
    (rect) =>
      rect.fillStyle === MAX_PALETTE.body &&
      rect.y + rect.height === groundLine,
  );

  assert.ok(
    legRects.length >= 2,
    `se esperaban al menos dos patas llegando al suelo, se encontraron ${legRects.length}`,
  );
});

test("renderMax conecta cada pata con el cuerpo o la cabeza, sin huecos flotantes", () => {
  const context = new FakeCanvasContext();

  renderMax(context, 0, 0);

  const groundLine = MAX_DIMENSIONS.height;
  const bodyRects = context.fillRects.filter(
    (rect) => rect.fillStyle === MAX_PALETTE.body,
  );
  const legRects = bodyRects.filter(
    (rect) => rect.y + rect.height === groundLine,
  );

  for (const leg of legRects) {
    const connectsAbove = bodyRects.some(
      (rect) =>
        rect !== leg &&
        rect.y + rect.height >= leg.y &&
        rect.x < leg.x + leg.width &&
        rect.x + rect.width > leg.x,
    );

    assert.ok(
      connectsAbove,
      `la pata en x=${leg.x} queda flotando, sin ninguna forma que la toque por encima`,
    );
  }
});

test("renderMax dibuja una cola que sobresale del cuerpo principal hacia la derecha", () => {
  const context = new FakeCanvasContext();

  renderMax(context, 0, 0);

  const bodyRects = context.fillRects.filter(
    (rect) => rect.fillStyle === MAX_PALETTE.body,
  );
  const mainBody = bodyRects.reduce((widest, rect) =>
    rect.width * rect.height > widest.width * widest.height ? rect : widest,
  );
  const bodyRightEdge = mainBody.x + mainBody.width;

  const tailRects = bodyRects.filter((rect) => rect.x >= bodyRightEdge);

  assert.ok(
    tailRects.length >= 1,
    "se esperaba al menos una cola sobresaliendo del cuerpo principal",
  );
});

test("renderMax se desplaza correctamente con el origen (x, y) dado", () => {
  const contextOrigin = new FakeCanvasContext();
  const contextOffset = new FakeCanvasContext();

  renderMax(contextOrigin, 0, 0);
  renderMax(contextOffset, 40, 20);

  assert.equal(contextOrigin.fillRects.length, contextOffset.fillRects.length);

  for (let i = 0; i < contextOrigin.fillRects.length; i += 1) {
    const originRect = contextOrigin.fillRects[i];
    const offsetRect = contextOffset.fillRects[i];

    assert.equal(offsetRect.x, originRect.x + 40);
    assert.equal(offsetRect.y, originRect.y + 20);
    assert.equal(offsetRect.width, originRect.width);
    assert.equal(offsetRect.height, originRect.height);
    assert.equal(offsetRect.fillStyle, originRect.fillStyle);
  }
});

test("MAX_DIMENSIONS es coherente con la huella real de los rectángulos dibujados", () => {
  const context = new FakeCanvasContext();

  renderMax(context, 0, 0);

  for (const rect of context.fillRects) {
    assert.ok(rect.x >= 0, `x fuera de rango: ${rect.x}`);
    assert.ok(rect.y >= 0, `y fuera de rango: ${rect.y}`);
    assert.ok(
      rect.x + rect.width <= MAX_DIMENSIONS.width,
      `rect se sale del ancho: ${rect.x + rect.width} > ${MAX_DIMENSIONS.width}`,
    );
    assert.ok(
      rect.y + rect.height <= MAX_DIMENSIONS.height,
      `rect se sale del alto: ${rect.y + rect.height} > ${MAX_DIMENSIONS.height}`,
    );
  }
});

test("ningún mapa incluye todavía a Max como objeto jugable", () => {
  const mapIds = ["axiom-plaza", "seven-bridges-walk", "library", "archive"];

  for (const mapId of mapIds) {
    const map = getWorldMap(mapId);
    const hasMax = map.objects.some((object) => object.id === "max");

    assert.equal(hasMax, false, `el mapa "${mapId}" no debería incluir a Max`);
  }
});
