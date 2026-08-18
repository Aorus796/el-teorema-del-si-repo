import assert from "node:assert/strict";
import test from "node:test";
import { Player } from "../../src/world/Player.js";
import {
  GONZALO_BACK_PIXELS,
  GONZALO_FRONT_PIXELS,
  GONZALO_PALETTE,
  GONZALO_PIXEL_WIDTH,
  GONZALO_SIDE_PIXELS,
  GONZALO_TRANSPARENT,
} from "../../src/content/gonzaloPixelArt.js";

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

/*
 * Gonzalo Character Pixel-Art Spike: render() ya no compone el cuerpo con
 * primitivas fillRect geométricas por parte del cuerpo (pelo/cabeza/
 * torso/piernas como rectángulos grandes) -- delega en
 * renderGonzalo()/GonzaloRenderer.js, que rasteriza pixel a pixel la
 * matriz indexada de src/content/gonzaloPixelArt.js. Sin `document`
 * (este entorno de test), la cache cae al camino sin DOM y dibuja
 * directamente con un fillRect de 1x1 por pixel no transparente, así que
 * estos tests comparan contra los datos reales en vez de coordenadas de
 * rectángulos grandes hardcodeadas.
 */
test("render() dibuja exactamente un fillRect de 1x1 por pixel no transparente de GONZALO_FRONT_PIXELS, con el color de paleta correcto", () => {
  const player = new Player({ x: 240, y: 192, facing: "down" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  // El marcador de orientación (color "#f5e8c8") se dibuja aparte, al
  // final -- se excluye aquí para comparar solo los pixeles del sprite.
  const spriteRects = context.fillRects.filter(
    (rect) => rect.fillStyle !== "#f5e8c8",
  );

  const expectedByColor = new Map();
  let expectedTotal = 0;

  for (const row of GONZALO_FRONT_PIXELS) {
    for (const symbol of row) {
      if (symbol === GONZALO_TRANSPARENT) {
        continue;
      }
      expectedTotal += 1;
      expectedByColor.set(
        GONZALO_PALETTE[symbol],
        (expectedByColor.get(GONZALO_PALETTE[symbol]) ?? 0) + 1,
      );
    }
  }

  assert.equal(spriteRects.length, expectedTotal);

  for (const rect of spriteRects) {
    assert.equal(rect.width, 1);
    assert.equal(rect.height, 1);
  }

  const actualByColor = new Map();
  for (const rect of spriteRects) {
    actualByColor.set(
      rect.fillStyle,
      (actualByColor.get(rect.fillStyle) ?? 0) + 1,
    );
  }

  assert.deepEqual(actualByColor, expectedByColor);
});

test("la silueta usa varios tonos distintos (pelo, piel, ropa, calzado, contorno), no un único color de bloque", () => {
  const player = new Player({ x: 240, y: 192, facing: "down" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  const spriteColors = new Set(
    context.fillRects
      .filter((rect) => rect.fillStyle !== "#f5e8c8")
      .map((rect) => rect.fillStyle),
  );

  assert.ok(
    spriteColors.size >= 6,
    `se esperaban al menos 6 tonos distintos en el sprite (encontrados: ${spriteColors.size})`,
  );
  assert.ok(spriteColors.has(GONZALO_PALETTE.O), "falta el color de contorno");
});

test("render() resta la posición de la cámara antes de dibujar", () => {
  const player = new Player({ x: 240, y: 192, facing: "down" });
  const contextAtOrigin = new FakeCanvasContext();
  const contextWithCamera = new FakeCanvasContext();

  player.render(contextAtOrigin, { x: 0, y: 0 });
  player.render(contextWithCamera, { x: 40, y: 20 });

  const spriteRectsAtOrigin = contextAtOrigin.fillRects.filter(
    (rect) => rect.fillStyle !== "#f5e8c8",
  );
  const spriteRectsWithCamera = contextWithCamera.fillRects.filter(
    (rect) => rect.fillStyle !== "#f5e8c8",
  );

  assert.equal(spriteRectsWithCamera.length, spriteRectsAtOrigin.length);

  for (let index = 0; index < spriteRectsAtOrigin.length; index += 1) {
    assert.equal(
      spriteRectsWithCamera[index].x,
      spriteRectsAtOrigin[index].x - 40,
    );
    assert.equal(
      spriteRectsWithCamera[index].y,
      spriteRectsAtOrigin[index].y - 20,
    );
  }
});

test("render() ancla el sprite de Gonzalo centrado horizontalmente en el jugador, igual que el render geométrico anterior", () => {
  const player = new Player({ x: 240, y: 192, facing: "down" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  const spriteRects = context.fillRects.filter(
    (rect) => rect.fillStyle !== "#f5e8c8",
  );
  const minX = Math.min(...spriteRects.map((rect) => rect.x));
  const minY = Math.min(...spriteRects.map((rect) => rect.y));

  // Columna no transparente más a la izquierda de los propios datos
  // (no necesariamente la columna 0: la silueta puede dejar transparentes
  // sus columnas más externas) -- así la aserción de X es una igualdad
  // exacta, no una cota floja, y sí detectaría un desplazamiento real de
  // 1px en el anclaje horizontal.
  const leftmostDataColumn = Math.min(
    ...GONZALO_FRONT_PIXELS.map((row) =>
      [...row].findIndex((symbol) => symbol !== GONZALO_TRANSPARENT),
    ).filter((index) => index !== -1),
  );
  const spriteOriginX = 240 - GONZALO_PIXEL_WIDTH / 2;

  // Mismo anclaje que el render geométrico anterior: esquina superior
  // izquierda del sprite en (screenX - anchura/2, screenY - 14).
  assert.equal(minX, spriteOriginX + leftmostDataColumn);
  assert.equal(minY, 192 - 14);
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

test("render() no usa ningún color fuera de GONZALO_PALETTE y el marcador de orientación", () => {
  const player = new Player({ x: 240, y: 192 });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  const allowedColors = new Set([
    ...Object.values(GONZALO_PALETTE),
    "#f5e8c8",
  ]);

  for (const rect of context.fillRects) {
    assert.ok(
      allowedColors.has(rect.fillStyle),
      `color inesperado en render(): ${rect.fillStyle}`,
    );
  }
});

/*
 * Integración con el facing actual (Player.updateFacing() no cambia en
 * esta tarea): "down" usa el frontal (2 ojos), "up" usa la espalda (sin
 * ojos), "left"/"right" usan el lateral (1 ojo) -- ver GONZALO_PALETTE.O
 * en la fila de ojos de cada dataset (fila 5, la única fila en la que
 * GONZALO_FRONT_PIXELS/BACK/SIDE difieren, ver gonzaloPixelArt.js).
 */
function countOutlinePixelsInSprite(context) {
  return context.fillRects.filter(
    (rect) => rect.fillStyle === GONZALO_PALETTE.O,
  ).length;
}

function countSymbolInPixels(pixels, symbol) {
  return pixels
    .join("")
    .split("")
    .filter((char) => char === symbol).length;
}

test("facing 'down' (frontal) dibuja los dos ojos aprobados", () => {
  const player = new Player({ x: 240, y: 192, facing: "down" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  const expectedOutlinePixels = countSymbolInPixels(
    GONZALO_FRONT_PIXELS,
    "O",
  );

  assert.equal(countOutlinePixelsInSprite(context), expectedOutlinePixels);
});

test("facing 'up' (espalda) no dibuja ningún ojo", () => {
  const player = new Player({ x: 240, y: 192, facing: "up" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  const expectedOutlinePixels = countSymbolInPixels(GONZALO_BACK_PIXELS, "O");

  assert.equal(countOutlinePixelsInSprite(context), expectedOutlinePixels);
  assert.ok(
    expectedOutlinePixels < countSymbolInPixels(GONZALO_FRONT_PIXELS, "O"),
    "la espalda debe tener menos pixeles de contorno/ojos que el frontal (sin ojos)",
  );
});

test("facing 'right' (lateral) dibuja un único ojo visible", () => {
  const player = new Player({ x: 240, y: 192, facing: "right" });
  const context = new FakeCanvasContext();

  player.render(context, { x: 0, y: 0 });

  const expectedOutlinePixels = countSymbolInPixels(GONZALO_SIDE_PIXELS, "O");

  assert.equal(countOutlinePixelsInSprite(context), expectedOutlinePixels);
  assert.ok(
    countSymbolInPixels(GONZALO_FRONT_PIXELS, "O") >
      countSymbolInPixels(GONZALO_SIDE_PIXELS, "O"),
    "el lateral debe tener menos ojos que el frontal (uno visible, no dos)",
  );
});

test("facing 'left' también usa el sprite lateral (mismo número de ojos que 'right')", () => {
  // Sin `document` (este entorno de test) GonzaloRenderer no refleja el
  // sprite -- solo cambia la transformación de canvas en el camino con
  // DOM real -- así que aquí solo se comprueba que usa el MISMO dataset
  // lateral (mismo número de pixeles de contorno/ojos), no la posición
  // reflejada en sí, que no es observable sin un canvas real.
  const leftPlayer = new Player({ x: 240, y: 192, facing: "left" });
  const rightPlayer = new Player({ x: 240, y: 192, facing: "right" });
  const leftContext = new FakeCanvasContext();
  const rightContext = new FakeCanvasContext();

  leftPlayer.render(leftContext, { x: 0, y: 0 });
  rightPlayer.render(rightContext, { x: 0, y: 0 });

  assert.equal(
    countOutlinePixelsInSprite(leftContext),
    countOutlinePixelsInSprite(rightContext),
  );
});

test("cada facing (frontal/espalda/lateral) dibuja exactamente los pixeles no transparentes de su propia matriz de datos", () => {
  const facingsToPixels = [
    ["down", GONZALO_FRONT_PIXELS],
    ["up", GONZALO_BACK_PIXELS],
    ["right", GONZALO_SIDE_PIXELS],
  ];

  for (const [facing, pixels] of facingsToPixels) {
    const player = new Player({ x: 240, y: 192, facing });
    const context = new FakeCanvasContext();

    player.render(context, { x: 0, y: 0 });

    const expectedTotal = pixels
      .join("")
      .split("")
      .filter((char) => char !== GONZALO_TRANSPARENT).length;
    const actualTotal = context.fillRects.filter(
      (rect) => rect.fillStyle !== "#f5e8c8",
    ).length;

    assert.equal(
      actualTotal,
      expectedTotal,
      `facing "${facing}" no coincide con su propia matriz de datos`,
    );
  }
});
