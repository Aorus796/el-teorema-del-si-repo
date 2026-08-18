/*
 * Render de Gonzalo con pixel-art indexado (Gonzalo Character Pixel-Art
 * Spike -- prueba de si el style lock indexado ya aprobado para props en
 * axiom-plaza generaliza también a personajes). Vive en src/render/, igual
 * que MaxRenderer.js, como módulo de render independiente de la capa de
 * escena (src/scenes/WorldScene.js).
 *
 * Cache mínima y local a este módulo -- NO reutiliza propSpriteCache de
 * WorldScene.js a propósito, para no crear una dependencia circular:
 * Player.js (capa de mundo/juego, src/world/) llama a este renderer, y
 * WorldScene.js (capa de escena) ya importa desde Player.js, así que
 * Player.js importando de vuelta desde WorldScene.js formaría un ciclo.
 * Mismo patrón exacto que la cache de WorldScene.js (rasterizar una vez
 * en un <canvas> aparte, reutilizar con drawImage(); sin DOM -- el
 * entorno de test, `node --test`, que no tiene document -- se dibuja
 * directamente sobre el context real), solo que aislado en un Map propio
 * en vez de compartir el de props genéricos.
 */
import {
  GONZALO_BACK_PIXELS,
  GONZALO_FRONT_PIXELS,
  GONZALO_PALETTE,
  GONZALO_PIXEL_HEIGHT,
  GONZALO_PIXEL_WIDTH,
  GONZALO_SIDE_PIXELS,
  GONZALO_TRANSPARENT,
} from "../content/gonzaloPixelArt.js";

export const GONZALO_DIMENSIONS = Object.freeze({
  width: GONZALO_PIXEL_WIDTH,
  height: GONZALO_PIXEL_HEIGHT,
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
  canvas.width = GONZALO_PIXEL_WIDTH;
  canvas.height = GONZALO_PIXEL_HEIGHT;

  const spriteContext = canvas.getContext("2d");
  spriteContext.imageSmoothingEnabled = false;
  draw(spriteContext, 0, 0);

  spriteCache.set(key, canvas);
  return canvas;
}

function createIndexedDraw(pixels) {
  return (context, x, y) => {
    for (let row = 0; row < GONZALO_PIXEL_HEIGHT; row += 1) {
      const line = pixels[row];

      for (let col = 0; col < GONZALO_PIXEL_WIDTH; col += 1) {
        const symbol = line[col];

        if (symbol === GONZALO_TRANSPARENT) {
          continue;
        }

        context.fillStyle = GONZALO_PALETTE[symbol];
        context.fillRect(x + col, y + row, 1, 1);
      }
    }
  };
}

const drawFront = createIndexedDraw(GONZALO_FRONT_PIXELS);
const drawBack = createIndexedDraw(GONZALO_BACK_PIXELS);
const drawSide = createIndexedDraw(GONZALO_SIDE_PIXELS);

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
 * (x, y) es la esquina superior izquierda del sprite (14x22), igual
 * convención que renderMax(). El facing "left" reutiliza el mismo sprite
 * cacheado de "side" que "right", reflejado horizontalmente con una
 * transformación de canvas en tiempo de dibujo -- una única rasterización
 * para ambos lados, cero canvases nuevos por frame.
 */
export function renderGonzalo(context, x, y, facing) {
  if (facing === "up") {
    drawCached(context, "gonzalo-back", x, y, drawBack);
    return;
  }

  if (facing === "right") {
    drawCached(context, "gonzalo-side", x, y, drawSide);
    return;
  }

  if (facing === "left") {
    const sprite = getCachedSprite("gonzalo-side", drawSide);

    if (sprite) {
      context.imageSmoothingEnabled = false;
      context.save();
      context.translate(Math.round(x) + GONZALO_PIXEL_WIDTH, Math.round(y));
      context.scale(-1, 1);
      context.drawImage(sprite, 0, 0);
      context.restore();
      return;
    }

    // Sin DOM (entorno de test) no hay canvas que reflejar: se dibuja el
    // lateral sin reflejar. No es una ruta de render visual real -- el
    // entorno de test no compara orientación de pixeles, solo estructura.
    drawSide(context, x, y);
    return;
  }

  drawCached(context, "gonzalo-front", x, y, drawFront);
}
