/*
 * Render de la Alcaldesa Corolaria con pixel-art indexado (Corolaria
 * Character Pixel-Art -- aplica el mismo lenguaje visual ya aprobado
 * para Gonzalo y Elena). Vive en src/render/, igual que
 * ElenaRenderer.js/GonzaloRenderer.js/MaxRenderer.js, como módulo de
 * render independiente de la capa de escena (src/scenes/WorldScene.js).
 *
 * Cache mínima y local a este módulo, mismo patrón que
 * ElenaRenderer.js/GonzaloRenderer.js -- NO comparte Map con ninguno de
 * los dos, ni con propSpriteCache de WorldScene.js, por consistencia
 * arquitectónica y para que ningún cambio futuro en uno de los
 * renderers pueda afectar al cache de otro.
 */
import {
  COROLARIA_BACK_PIXELS,
  COROLARIA_FRONT_PIXELS,
  COROLARIA_PALETTE,
  COROLARIA_PIXEL_HEIGHT,
  COROLARIA_PIXEL_WIDTH,
  COROLARIA_SIDE_PIXELS,
  COROLARIA_TRANSPARENT,
} from "../content/corolariaPixelArt.js";

export const COROLARIA_DIMENSIONS = Object.freeze({
  width: COROLARIA_PIXEL_WIDTH,
  height: COROLARIA_PIXEL_HEIGHT,
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
  canvas.width = COROLARIA_PIXEL_WIDTH;
  canvas.height = COROLARIA_PIXEL_HEIGHT;

  const spriteContext = canvas.getContext("2d");
  spriteContext.imageSmoothingEnabled = false;
  draw(spriteContext, 0, 0);

  spriteCache.set(key, canvas);
  return canvas;
}

function createIndexedDraw(pixels) {
  return (context, x, y) => {
    for (let row = 0; row < COROLARIA_PIXEL_HEIGHT; row += 1) {
      const line = pixels[row];

      for (let col = 0; col < COROLARIA_PIXEL_WIDTH; col += 1) {
        const symbol = line[col];

        if (symbol === COROLARIA_TRANSPARENT) {
          continue;
        }

        context.fillStyle = COROLARIA_PALETTE[symbol];
        context.fillRect(x + col, y + row, 1, 1);
      }
    }
  };
}

const drawFront = createIndexedDraw(COROLARIA_FRONT_PIXELS);
const drawBack = createIndexedDraw(COROLARIA_BACK_PIXELS);
const drawSide = createIndexedDraw(COROLARIA_SIDE_PIXELS);

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
 * convención que renderGonzalo()/renderElena()/renderMax(). El facing
 * "left" reutiliza el mismo sprite cacheado de "side" que "right",
 * reflejado horizontalmente con una transformación de canvas en tiempo
 * de dibujo -- una única rasterización para ambos lados, cero canvases
 * nuevos por frame. "down" (frontal) es el valor por defecto: hoy el
 * único punto de llamada real (WorldScene.renderNpc(), NPC estático
 * "mayor-corolaria") siempre pide el frontal, pero se expone el
 * contrato completo de facing por si un consumidor futuro lo necesita.
 */
export function renderCorolaria(context, x, y, facing) {
  if (facing === "up") {
    drawCached(context, "corolaria-back", x, y, drawBack);
    return;
  }

  if (facing === "right") {
    drawCached(context, "corolaria-side", x, y, drawSide);
    return;
  }

  if (facing === "left") {
    const sprite = getCachedSprite("corolaria-side", drawSide);

    if (sprite) {
      context.imageSmoothingEnabled = false;
      context.save();
      context.translate(Math.round(x) + COROLARIA_PIXEL_WIDTH, Math.round(y));
      context.scale(-1, 1);
      context.drawImage(sprite, 0, 0);
      context.restore();
      return;
    }

    drawSide(context, x, y);
    return;
  }

  drawCached(context, "corolaria-front", x, y, drawFront);
}
