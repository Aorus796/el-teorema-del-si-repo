/*
 * Render de Elena con pixel-art indexado (Elena Character Pixel-Art --
 * aplica el mismo lenguaje visual ya aprobado para Gonzalo). Vive en
 * src/render/, igual que GonzaloRenderer.js y MaxRenderer.js, como
 * módulo de render independiente de la capa de escena
 * (src/scenes/WorldScene.js).
 *
 * Cache mínima y local a este módulo, mismo patrón que GonzaloRenderer.js
 * -- NO comparte Map con él ni con propSpriteCache de WorldScene.js.
 * Elena no tiene el mismo problema de dependencia circular que motivó esa
 * decisión en Gonzalo (WorldScene.js ya llama a este renderer
 * directamente, no a través de Player.js), pero se mantiene una cache
 * propia de todas formas por consistencia arquitectónica y para que
 * ningún cambio futuro en uno de los dos renderers pueda afectar al
 * cache del otro.
 */
import {
  ELENA_BACK_PIXELS,
  ELENA_FRONT_PIXELS,
  ELENA_PALETTE,
  ELENA_PIXEL_HEIGHT,
  ELENA_PIXEL_WIDTH,
  ELENA_SIDE_PIXELS,
  ELENA_TRANSPARENT,
} from "../content/elenaPixelArt.js";

export const ELENA_DIMENSIONS = Object.freeze({
  width: ELENA_PIXEL_WIDTH,
  height: ELENA_PIXEL_HEIGHT,
});

const spriteCache = new Map();

function getCachedSprite(key, draw) {
  if (typeof document === "undefined") {
    return null;
  }

  const cached = spriteCache.get(key);

  if (cached) {
    return cached;
  }

  const canvas = document.createElement("canvas");
  canvas.width = ELENA_PIXEL_WIDTH;
  canvas.height = ELENA_PIXEL_HEIGHT;

  const spriteContext = canvas.getContext("2d");
  spriteContext.imageSmoothingEnabled = false;
  draw(spriteContext, 0, 0);

  spriteCache.set(key, canvas);
  return canvas;
}

function createIndexedDraw(pixels) {
  return (context, x, y) => {
    for (let row = 0; row < ELENA_PIXEL_HEIGHT; row += 1) {
      const line = pixels[row];

      for (let col = 0; col < ELENA_PIXEL_WIDTH; col += 1) {
        const symbol = line[col];

        if (symbol === ELENA_TRANSPARENT) {
          continue;
        }

        context.fillStyle = ELENA_PALETTE[symbol];
        context.fillRect(x + col, y + row, 1, 1);
      }
    }
  };
}

const drawFront = createIndexedDraw(ELENA_FRONT_PIXELS);
const drawBack = createIndexedDraw(ELENA_BACK_PIXELS);
const drawSide = createIndexedDraw(ELENA_SIDE_PIXELS);

function drawCached(context, key, x, y, draw) {
  const sprite = getCachedSprite(key, draw);

  if (sprite) {
    context.imageSmoothingEnabled = false;
    context.drawImage(sprite, Math.round(x), Math.round(y));
    return;
  }

  draw(context, x, y);
}

/*
 * (x, y) es la esquina superior izquierda del sprite (14x22), misma
 * convención que renderGonzalo()/renderMax(). El facing "left" reutiliza
 * el mismo sprite cacheado de "side" que "right", reflejado
 * horizontalmente con una transformación de canvas en tiempo de dibujo --
 * una única rasterización para ambos lados, cero canvases nuevos por
 * frame. "down" (frontal) es el valor por defecto: hoy el único punto de
 * llamada real (WorldScene.renderNpc(), NPC estático "bride-epilogue")
 * siempre pide el frontal, pero se expone el contrato completo de
 * facing por si un consumidor futuro lo necesita.
 */
export function renderElena(context, x, y, facing) {
  if (facing === "up") {
    drawCached(context, "elena-back", x, y, drawBack);
    return;
  }

  if (facing === "right") {
    drawCached(context, "elena-side", x, y, drawSide);
    return;
  }

  if (facing === "left") {
    const sprite = getCachedSprite("elena-side", drawSide);

    if (sprite) {
      context.imageSmoothingEnabled = false;
      context.save();
      context.translate(Math.round(x) + ELENA_PIXEL_WIDTH, Math.round(y));
      context.scale(-1, 1);
      context.drawImage(sprite, 0, 0);
      context.restore();
      return;
    }

    drawSide(context, x, y);
    return;
  }

  drawCached(context, "elena-front", x, y, drawFront);
}
