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

test("render() dibuja exactamente la silueta, el pelo, la cabeza, los brazos, el torso y las piernas con PROTAGONIST_PALETTE", () => {
  const player = new Player({ x: 240, y: 192, facing: "down" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  const [
    silhouette,
    hairCap,
    head,
    hairSide,
    leftArm,
    rightArm,
    torso,
    leftLeg,
    rightLeg,
  ] = context.fillRects;

  assert.deepEqual(silhouette, {
    x: 233,
    y: 178,
    width: 14,
    height: 22,
    fillStyle: PROTAGONIST_PALETTE.silhouette,
  });
  assert.deepEqual(hairCap, {
    x: 236,
    y: 179,
    width: 8,
    height: 2,
    fillStyle: PROTAGONIST_PALETTE.hair,
  });
  assert.deepEqual(head, {
    x: 236,
    y: 181,
    width: 8,
    height: 6,
    fillStyle: PROTAGONIST_PALETTE.head,
  });
  assert.deepEqual(hairSide, {
    x: 243,
    y: 181,
    width: 2,
    height: 3,
    fillStyle: PROTAGONIST_PALETTE.hair,
  });
  assert.deepEqual(leftArm, {
    x: 234,
    y: 188,
    width: 2,
    height: 6,
    fillStyle: PROTAGONIST_PALETTE.head,
  });
  assert.deepEqual(rightArm, {
    x: 244,
    y: 188,
    width: 2,
    height: 6,
    fillStyle: PROTAGONIST_PALETTE.head,
  });
  assert.deepEqual(torso, {
    x: 236,
    y: 188,
    width: 8,
    height: 6,
    fillStyle: PROTAGONIST_PALETTE.body,
  });
  assert.deepEqual(leftLeg, {
    x: 237,
    y: 195,
    width: 2,
    height: 5,
    fillStyle: PROTAGONIST_PALETTE.bodyAccent,
  });
  assert.deepEqual(rightLeg, {
    x: 241,
    y: 195,
    width: 2,
    height: 5,
    fillStyle: PROTAGONIST_PALETTE.bodyAccent,
  });
});

test("render() resta la posición de la cámara antes de dibujar", () => {
  const player = new Player({ x: 240, y: 192, facing: "down" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 40, y: 20 });

  const [silhouette] = context.fillRects;
  assert.equal(silhouette.x, 233 - 40);
  assert.equal(silhouette.y, 178 - 20);
});

test("render() dibuja un décimo rectángulo (marcador de orientación) tras las piernas", () => {
  const player = new Player({ x: 240, y: 192, facing: "up" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  assert.equal(context.fillRects.length, 10);
  const marker = context.fillRects[9];
  assert.equal(marker.width, 3);
  assert.equal(marker.height, 3);
});

test("render() usa exactamente los cinco colores de identidad de PROTAGONIST_PALETTE, en orden, sin colores adicionales inventados", () => {
  const player = new Player({ x: 240, y: 192 });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  const paletteColors = context.fillRects
    .slice(0, 9)
    .map((rect) => rect.fillStyle);

  assert.deepEqual(paletteColors, [
    PROTAGONIST_PALETTE.silhouette,
    PROTAGONIST_PALETTE.hair,
    PROTAGONIST_PALETTE.head,
    PROTAGONIST_PALETTE.hair,
    PROTAGONIST_PALETTE.head,
    PROTAGONIST_PALETTE.head,
    PROTAGONIST_PALETTE.body,
    PROTAGONIST_PALETTE.bodyAccent,
    PROTAGONIST_PALETTE.bodyAccent,
  ]);
});
