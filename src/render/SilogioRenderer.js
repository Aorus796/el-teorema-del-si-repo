/*
 * Render de Silogio con pixel-art indexado (Silogio Character Pixel-Art
 * -- aplica el mismo lenguaje visual ya aprobado para Gonzalo, Elena,
 * Corolaria y el Padre de la novia). Vive en src/render/, igual que
 * BrideFatherRenderer.js/CorolariaRenderer.js/ElenaRenderer.js/
 * GonzaloRenderer.js/MaxRenderer.js, como módulo de render independiente
 * de la capa de escena (src/scenes/WorldScene.js).
 *
 * Cache mínima y local a este módulo, mismo patrón que los cuatro
 * renderers anteriores -- NO comparte Map con ninguno de ellos, ni con
 * propSpriteCache de WorldScene.js, por consistencia arquitectónica y
 * para que ningún cambio futuro en uno de los renderers pueda afectar al
 * cache de otro.
 *
 * Tamaño: el render geométrico anterior de Silogio ya era ligeramente
 * más estrecho que el resto de NPC dedicados (~12 de ancho, frente a
 * ~13-14 de Gonzalo/Corolaria/Padre); el nuevo sprite indexado preserva
 * esa lectura de "más alto/estrecho" ensanchando su silueta mucho menos
 * que el resto (ver silogioPixelArt.js) dentro del mismo lienzo 14x22
 * usado por los demás personajes migrados, sin cambiar la hitbox real
 * del NPC (14x18 en worldMaps.js).
 */
import {
  SILOGIO_BACK_PIXELS,
  SILOGIO_FRONT_PIXELS,
  SILOGIO_PIXEL_HEIGHT,
  SILOGIO_PIXEL_PALETTE,
  SILOGIO_PIXEL_WIDTH,
  SILOGIO_SIDE_PIXELS,
  SILOGIO_TRANSPARENT,
} from "../content/silogioPixelArt.js";

export const SILOGIO_DIMENSIONS = Object.freeze({
  width: SILOGIO_PIXEL_WIDTH,
  height: SILOGIO_PIXEL_HEIGHT,
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
  canvas.width = SILOGIO_PIXEL_WIDTH;
  canvas.height = SILOGIO_PIXEL_HEIGHT;

  const spriteContext = canvas.getContext("2d");
  spriteContext.imageSmoothingEnabled = false;
  draw(spriteContext, 0, 0);

  spriteCache.set(key, canvas);
  return canvas;
}

function createIndexedDraw(pixels) {
  return (context, x, y) => {
    for (let row = 0; row < SILOGIO_PIXEL_HEIGHT; row += 1) {
      const line = pixels[row];

      for (let col = 0; col < SILOGIO_PIXEL_WIDTH; col += 1) {
        const symbol = line[col];

        if (symbol === SILOGIO_TRANSPARENT) {
          continue;
        }

        context.fillStyle = SILOGIO_PIXEL_PALETTE[symbol];
        context.fillRect(x + col, y + row, 1, 1);
      }
    }
  };
}

const drawFront = createIndexedDraw(SILOGIO_FRONT_PIXELS);
const drawBack = createIndexedDraw(SILOGIO_BACK_PIXELS);
const drawSide = createIndexedDraw(SILOGIO_SIDE_PIXELS);

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
 * renderBrideFather()/renderMax(). El facing "left" reutiliza el mismo
 * sprite cacheado de "side" que "right", reflejado horizontalmente con
 * una transformación de canvas en tiempo de dibujo -- una única
 * rasterización para ambos lados, cero canvases nuevos por frame. "down"
 * (frontal) es el valor por defecto: hoy el único punto de llamada real
 * (WorldScene.renderNpc(), NPC estático "library-silogio") siempre pide
 * el frontal, pero se expone el contrato completo de facing por si un
 * consumidor futuro lo necesita.
 */
export function renderSilogio(context, x, y, facing) {
  if (facing === "up") {
    drawCached(context, "silogio-back", x, y, drawBack);
    return;
  }

  if (facing === "right") {
    drawCached(context, "silogio-side", x, y, drawSide);
    return;
  }

  if (facing === "left") {
    const sprite = getCachedSprite("silogio-side", drawSide);

    if (sprite) {
      context.imageSmoothingEnabled = false;
      context.save();
      context.translate(Math.round(x) + SILOGIO_PIXEL_WIDTH, Math.round(y));
      context.scale(-1, 1);
      context.drawImage(sprite, 0, 0);
      context.restore();
      return;
    }

    drawSide(context, x, y);
    return;
  }

  drawCached(context, "silogio-front", x, y, drawFront);
}
