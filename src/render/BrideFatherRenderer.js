/*
 * Render del Padre de la novia con pixel-art indexado (Bride Father
 * Character Pixel-Art -- aplica el mismo lenguaje visual ya aprobado
 * para Gonzalo, Elena y Corolaria). Vive en src/render/, igual que
 * CorolariaRenderer.js/ElenaRenderer.js/GonzaloRenderer.js/MaxRenderer.js,
 * como módulo de render independiente de la capa de escena
 * (src/scenes/WorldScene.js).
 *
 * Cache mínima y local a este módulo, mismo patrón que
 * CorolariaRenderer.js/ElenaRenderer.js/GonzaloRenderer.js -- NO comparte
 * Map con ninguno de los tres, ni con propSpriteCache de WorldScene.js,
 * por consistencia arquitectónica y para que ningún cambio futuro en uno
 * de los renderers pueda afectar al cache de otro.
 */
import {
  BRIDE_FATHER_BACK_PIXELS,
  BRIDE_FATHER_FRONT_PIXELS,
  BRIDE_FATHER_PIXEL_HEIGHT,
  BRIDE_FATHER_PIXEL_PALETTE,
  BRIDE_FATHER_PIXEL_WIDTH,
  BRIDE_FATHER_SIDE_PIXELS,
  BRIDE_FATHER_TRANSPARENT,
} from "../content/brideFatherPixelArt.js";

export const BRIDE_FATHER_DIMENSIONS = Object.freeze({
  width: BRIDE_FATHER_PIXEL_WIDTH,
  height: BRIDE_FATHER_PIXEL_HEIGHT,
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
  canvas.width = BRIDE_FATHER_PIXEL_WIDTH;
  canvas.height = BRIDE_FATHER_PIXEL_HEIGHT;

  const spriteContext = canvas.getContext("2d");
  spriteContext.imageSmoothingEnabled = false;
  draw(spriteContext, 0, 0);

  spriteCache.set(key, canvas);
  return canvas;
}

function createIndexedDraw(pixels) {
  return (context, x, y) => {
    for (let row = 0; row < BRIDE_FATHER_PIXEL_HEIGHT; row += 1) {
      const line = pixels[row];

      for (let col = 0; col < BRIDE_FATHER_PIXEL_WIDTH; col += 1) {
        const symbol = line[col];

        if (symbol === BRIDE_FATHER_TRANSPARENT) {
          continue;
        }

        context.fillStyle = BRIDE_FATHER_PIXEL_PALETTE[symbol];
        context.fillRect(x + col, y + row, 1, 1);
      }
    }
  };
}

const drawFront = createIndexedDraw(BRIDE_FATHER_FRONT_PIXELS);
const drawBack = createIndexedDraw(BRIDE_FATHER_BACK_PIXELS);
const drawSide = createIndexedDraw(BRIDE_FATHER_SIDE_PIXELS);

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
 * convención que renderGonzalo()/renderElena()/renderCorolaria()/
 * renderMax(). El facing "left" reutiliza el mismo sprite cacheado de
 * "side" que "right", reflejado horizontalmente con una transformación
 * de canvas en tiempo de dibujo -- una única rasterización para ambos
 * lados, cero canvases nuevos por frame. "down" (frontal) es el valor
 * por defecto: hoy el único punto de llamada real
 * (WorldScene.renderNpc(), NPC estático "bride-father") siempre pide el
 * frontal, pero se expone el contrato completo de facing por si un
 * consumidor futuro lo necesita.
 */
export function renderBrideFather(context, x, y, facing) {
  if (facing === "up") {
    drawCached(context, "bride-father-back", x, y, drawBack);
    return;
  }

  if (facing === "right") {
    drawCached(context, "bride-father-side", x, y, drawSide);
    return;
  }

  if (facing === "left") {
    const sprite = getCachedSprite("bride-father-side", drawSide);

    if (sprite) {
      context.imageSmoothingEnabled = false;
      context.save();
      context.translate(
        Math.round(x) + BRIDE_FATHER_PIXEL_WIDTH,
        Math.round(y),
      );
      context.scale(-1, 1);
      context.drawImage(sprite, 0, 0);
      context.restore();
      return;
    }

    drawSide(context, x, y);
    return;
  }

  drawCached(context, "bride-father-front", x, y, drawFront);
}
