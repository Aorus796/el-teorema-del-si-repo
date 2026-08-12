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

test("render() dibuja exactamente la silueta partida en dos, el pelo, la cabeza, los brazos, el torso y las piernas con PROTAGONIST_PALETTE", () => {
  const player = new Player({ x: 240, y: 192, facing: "down" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  const [
    silhouetteUpper,
    silhouetteLower,
    hairCap,
    head,
    hairSide,
    leftArm,
    rightArm,
    torso,
    leftLeg,
    rightLeg,
  ] = context.fillRects;

  assert.deepEqual(silhouetteUpper, {
    x: 233,
    y: 178,
    width: 14,
    height: 16,
    fillStyle: PROTAGONIST_PALETTE.silhouette,
  });
  assert.deepEqual(silhouetteLower, {
    x: 235,
    y: 194,
    width: 10,
    height: 6,
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

test("la silueta actúa como contorno fino: la pieza que respalda las piernas es más estrecha que el resto del cuerpo", () => {
  const player = new Player({ x: 240, y: 192, facing: "down" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  const silhouetteRects = context.fillRects.filter(
    (rect) => rect.fillStyle === PROTAGONIST_PALETTE.silhouette,
  );

  assert.equal(
    silhouetteRects.length,
    2,
    "la silueta debe estar partida en una pieza superior y una inferior, no ser un único bloque",
  );

  const [upper, lower] = silhouetteRects;
  assert.ok(
    lower.width < upper.width,
    "la pieza de silueta que respalda las piernas debe ser más estrecha que la que respalda torso/brazos, para no leerse como un bloque oscuro uniforme",
  );
});

test("render() resta la posición de la cámara antes de dibujar", () => {
  const player = new Player({ x: 240, y: 192, facing: "down" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 40, y: 20 });

  const [silhouetteUpper] = context.fillRects;
  assert.equal(silhouetteUpper.x, 233 - 40);
  assert.equal(silhouetteUpper.y, 178 - 20);
});

test("render() dibuja un undécimo rectángulo (marcador de orientación) tras las piernas", () => {
  const player = new Player({ x: 240, y: 192, facing: "up" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  assert.equal(context.fillRects.length, 11);
  const marker = context.fillRects[10];
  assert.equal(marker.width, 3);
  assert.equal(marker.height, 3);
});

test("render() usa exactamente los cinco colores de identidad de PROTAGONIST_PALETTE, en orden, sin colores adicionales inventados", () => {
  const player = new Player({ x: 240, y: 192 });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  const paletteColors = context.fillRects
    .slice(0, 10)
    .map((rect) => rect.fillStyle);

  assert.deepEqual(paletteColors, [
    PROTAGONIST_PALETTE.silhouette,
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
