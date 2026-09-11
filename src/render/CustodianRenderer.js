/*
 * Render del Custodio con pixel-art indexado. Vive en src/render/, igual
 * que ElenaRenderer.js/SilogioRenderer.js, como módulo de render
 * independiente de la capa de escena (src/scenes/WorldScene.js), con cache
 * mínima y local a este módulo -- NO comparte Map con ningún otro renderer
 * ni con propSpriteCache de WorldScene.js.
 *
 * Simplificación deliberada frente a los renderers de personajes humanos:
 * el Custodio no camina. Se desliza por una guía fija de la Cámara de
 * Contención y siempre encara al visitante, así que este módulo no expone
 * ningún contrato de `facing` (ni front/back/side, ni reflejo horizontal
 * en tiempo de dibujo). Lo que sí distingue son dos variantes de estado de
 * su ranura de cristal -- "idle" y "contradiction", las únicas dos que
 * define custodianPixelArt.js -- que la escena elige explícitamente; no hay
 * animación ni parpadeo, son dos sprites estáticos cacheados por separado.
 */
import {
  CUSTODIAN_CONTRADICTION_PIXELS,
  CUSTODIAN_IDLE_PIXELS,
  CUSTODIAN_PALETTE,
  CUSTODIAN_PIXEL_HEIGHT,
  CUSTODIAN_PIXEL_WIDTH,
  CUSTODIAN_TRANSPARENT,
} from "../content/custodianPixelArt.js";

export const CUSTODIAN_DIMENSIONS = Object.freeze({
  width: CUSTODIAN_PIXEL_WIDTH,
  height: CUSTODIAN_PIXEL_HEIGHT,
});

export const CUSTODIAN_VARIANT = Object.freeze({
  IDLE: "idle",
  CONTRADICTION: "contradiction",
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
  canvas.width = CUSTODIAN_PIXEL_WIDTH;
  canvas.height = CUSTODIAN_PIXEL_HEIGHT;

  const spriteContext = canvas.getContext("2d");
  spriteContext.imageSmoothingEnabled = false;
  draw(spriteContext, 0, 0);

  spriteCache.set(key, canvas);
  return canvas;
}

function createIndexedDraw(pixels) {
  return (context, x, y) => {
    for (let row = 0; row < CUSTODIAN_PIXEL_HEIGHT; row += 1) {
      const line = pixels[row];

      for (let col = 0; col < CUSTODIAN_PIXEL_WIDTH; col += 1) {
        const symbol = line[col];

        if (symbol === CUSTODIAN_TRANSPARENT) {
          continue;
        }

        context.fillStyle = CUSTODIAN_PALETTE[symbol];
        context.fillRect(x + col, y + row, 1, 1);
      }
    }
  };
}

const drawIdle = createIndexedDraw(CUSTODIAN_IDLE_PIXELS);
const drawContradiction = createIndexedDraw(CUSTODIAN_CONTRADICTION_PIXELS);

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
 * (x, y) es la esquina superior izquierda del sprite (20x32), misma
 * convención que renderElena()/renderSilogio(). Cualquier variante
 * desconocida cae en "idle": es el estado por defecto del Custodio y el
 * único que la exploración normal necesita.
 */
export function renderCustodian(context, x, y, variant = CUSTODIAN_VARIANT.IDLE) {
  if (variant === CUSTODIAN_VARIANT.CONTRADICTION) {
    drawCached(
      context,
      "custodian-contradiction",
      x,
      y,
      drawContradiction,
    );
    return;
  }

  drawCached(context, "custodian-idle", x, y, drawIdle);
}
