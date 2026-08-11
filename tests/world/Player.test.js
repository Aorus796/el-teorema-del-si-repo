import assert from "node:assert/strict";
import test from "node:test";
import { Player } from "../../src/world/Player.js";
import { PROTAGONIST_PALETTE } from "../../src/content/characterPalettes.js";

class FakeCanvasContext {
  constructor() {
    this.fillRects = [];
  }

  fillRect(x, y, width, height) {
    this.fillRects.push({ x, y, width, height, fillStyle: this.fillStyle });
  }
}

test("Player mantiene sus dimensiones y velocidad de colisión por defecto", () => {
  const player = new Player({ x: 100, y: 100 });

  assert.equal(player.width, 10);
  assert.equal(player.height, 14);
  assert.equal(player.speed, 72);
  assert.equal(player.facing, "down");
});

test("render() dibuja exactamente la silueta, la cabeza y el cuerpo con PROTAGONIST_PALETTE", () => {
  const player = new Player({ x: 240, y: 192, facing: "down" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  const [silhouette, head, body] = context.fillRects;

  assert.deepEqual(silhouette, {
    x: 234,
    y: 183,
    width: 12,
    height: 18,
    fillStyle: PROTAGONIST_PALETTE.silhouette,
  });
  assert.deepEqual(head, {
    x: 236,
    y: 182,
    width: 8,
    height: 7,
    fillStyle: PROTAGONIST_PALETTE.head,
  });
  assert.deepEqual(body, {
    x: 235,
    y: 189,
    width: 10,
    height: 10,
    fillStyle: PROTAGONIST_PALETTE.body,
  });
});

test("render() resta la posición de la cámara antes de dibujar", () => {
  const player = new Player({ x: 240, y: 192, facing: "down" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 40, y: 20 });

  const [silhouette] = context.fillRects;
  assert.equal(silhouette.x, 234 - 40);
  assert.equal(silhouette.y, 183 - 20);
});

test("render() dibuja un cuarto rectángulo (marcador de orientación) tras el cuerpo", () => {
  const player = new Player({ x: 240, y: 192, facing: "up" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  assert.equal(context.fillRects.length, 4);
  const marker = context.fillRects[3];
  assert.equal(marker.width, 3);
  assert.equal(marker.height, 3);
});

test("render() usa exactamente los tres colores de PROTAGONIST_PALETTE, sin colores adicionales inventados", () => {
  const player = new Player({ x: 240, y: 192 });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  const paletteColors = context.fillRects
    .slice(0, 3)
    .map((rect) => rect.fillStyle);

  assert.deepEqual(paletteColors, [
    PROTAGONIST_PALETTE.silhouette,
    PROTAGONIST_PALETTE.head,
    PROTAGONIST_PALETTE.body,
  ]);
});
