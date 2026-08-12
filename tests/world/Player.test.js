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

test("render() dibuja pelo, cabeza, brazos, torso y piernas con PROTAGONIST_PALETTE en las posiciones esperadas", () => {
  const player = new Player({ x: 240, y: 192, facing: "down" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  const byColor = (color) =>
    context.fillRects.filter((rect) => rect.fillStyle === color);

  assert.deepEqual(byColor(PROTAGONIST_PALETTE.hair), [
    { x: 236, y: 179, width: 8, height: 2, fillStyle: PROTAGONIST_PALETTE.hair },
    { x: 243, y: 181, width: 2, height: 3, fillStyle: PROTAGONIST_PALETTE.hair },
  ]);

  assert.deepEqual(byColor(PROTAGONIST_PALETTE.head), [
    { x: 236, y: 181, width: 8, height: 6, fillStyle: PROTAGONIST_PALETTE.head },
    { x: 234, y: 188, width: 2, height: 6, fillStyle: PROTAGONIST_PALETTE.head },
    { x: 244, y: 188, width: 2, height: 6, fillStyle: PROTAGONIST_PALETTE.head },
  ]);

  assert.deepEqual(byColor(PROTAGONIST_PALETTE.body), [
    { x: 236, y: 188, width: 8, height: 6, fillStyle: PROTAGONIST_PALETTE.body },
  ]);

  assert.deepEqual(byColor(PROTAGONIST_PALETTE.bodyAccent), [
    { x: 237, y: 195, width: 2, height: 5, fillStyle: PROTAGONIST_PALETTE.bodyAccent },
    { x: 241, y: 195, width: 2, height: 5, fillStyle: PROTAGONIST_PALETTE.bodyAccent },
  ]);
});

test("la silueta es un contorno de varias piezas estrechas, no un bloque de fondo grande", () => {
  const player = new Player({ x: 240, y: 192, facing: "down" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  const silhouetteRects = context.fillRects.filter(
    (rect) => rect.fillStyle === PROTAGONIST_PALETTE.silhouette,
  );

  assert.ok(
    silhouetteRects.length >= 3,
    `la silueta debe construirse con varias piezas de borde, no uno o dos rectángulos de fondo (encontradas: ${silhouetteRects.length})`,
  );

  const widths = silhouetteRects.map((rect) => rect.width);
  assert.ok(
    Math.min(...widths) < Math.max(...widths),
    "las piezas de silueta deben variar de ancho (más estrechas donde el cuerpo es más estrecho), no ser todas iguales a un único ancho de fondo",
  );
});

test("render() resta la posición de la cámara antes de dibujar", () => {
  const player = new Player({ x: 240, y: 192, facing: "down" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 40, y: 20 });

  const [head] = context.fillRects.filter(
    (rect) => rect.fillStyle === PROTAGONIST_PALETTE.head,
  );
  assert.equal(head.x, 236 - 40);
  assert.equal(head.y, 181 - 20);
});

test("render() dibuja el marcador de orientación al final, tras todas las demás formas", () => {
  const player = new Player({ x: 240, y: 192, facing: "up" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  const marker = context.fillRects.at(-1);
  assert.equal(marker.fillStyle, "#f5e8c8");
  assert.equal(marker.width, 3);
  assert.equal(marker.height, 3);
});

test("render() no usa ningún color fuera de PROTAGONIST_PALETTE y el marcador de orientación", () => {
  const player = new Player({ x: 240, y: 192 });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  const allowedColors = new Set([
    PROTAGONIST_PALETTE.silhouette,
    PROTAGONIST_PALETTE.hair,
    PROTAGONIST_PALETTE.head,
    PROTAGONIST_PALETTE.body,
    PROTAGONIST_PALETTE.bodyAccent,
    "#f5e8c8",
  ]);

  for (const rect of context.fillRects) {
    assert.ok(
      allowedColors.has(rect.fillStyle),
      `color inesperado en render(): ${rect.fillStyle}`,
    );
  }
});
