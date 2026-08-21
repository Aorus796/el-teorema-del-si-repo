/*
 * Render de Max (perro, pastor belga malinois) con pixel-art indexado
 * (Max Character Pixel-Art -- aplica el mismo NIVEL DE CALIDAD ya
 * aprobado para Gonzalo/Elena/Corolaria/Padre/Silogio, sin copiar su
 * arquitectura visual: Max es un cuadrúpedo con una única pose fija, no
 * un bípedo con tres variantes de facing). Vive en src/render/, igual
 * que los cinco renderers humanos, como módulo de render independiente
 * de la capa de escena (src/scenes/WorldScene.js, src/scenes/
 * CreditsScene.js).
 *
 * Cache mínima y local a este módulo, mismo patrón que los renderers
 * humanos -- NO comparte Map con ninguno de ellos, ni con
 * propSpriteCache de WorldScene.js.
 *
 * renderMax(context, x, y) mantiene EXACTAMENTE la misma firma que el
 * render geométrico anterior (sin parámetro de facing): tanto
 * MaxCompanion.render() como CreditsScene.js ya llamaban a renderMax()
 * sin pedir ninguna orientación -- Max nunca gira visualmente, siempre
 * la misma pose lateral (cabeza a la izquierda). Por eso este módulo NO
 * recibe ni expone un parámetro "facing": añadirlo sin que ningún
 * consumidor real lo use sería la "infraestructura duplicada" que la
 * propia tarea pide evitar. MaxCompanion.js y CreditsScene.js no
 * necesitan ningún cambio para beneficiarse de esta migración.
 */
import {
  MAX_PIXEL_HEIGHT,
  MAX_PIXEL_PALETTE,
  MAX_PIXEL_WIDTH,
  MAX_SIDE_PIXELS,
  MAX_TRANSPARENT,
} from "../content/maxPixelArt.js";

export const MAX_DIMENSIONS = Object.freeze({
  width: MAX_PIXEL_WIDTH,
  height: MAX_PIXEL_HEIGHT,
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
  canvas.width = MAX_PIXEL_WIDTH;
  canvas.height = MAX_PIXEL_HEIGHT;

  const spriteContext = canvas.getContext("2d");
  spriteContext.imageSmoothingEnabled = false;
  draw(spriteContext, 0, 0);

  spriteCache.set(key, canvas);
  return canvas;
}

function createIndexedDraw(pixels) {
  return (context, x, y) => {
    for (let row = 0; row < MAX_PIXEL_HEIGHT; row += 1) {
      const line = pixels[row];

      for (let col = 0; col < MAX_PIXEL_WIDTH; col += 1) {
        const symbol = line[col];

        if (symbol === MAX_TRANSPARENT) {
          continue;
        }

        context.fillStyle = MAX_PIXEL_PALETTE[symbol];
        context.fillRect(x + col, y + row, 1, 1);
      }
    }
  };
}

const drawSide = createIndexedDraw(MAX_SIDE_PIXELS);

/*
 * (x, y) es la esquina superior izquierda del sprite (22x18), misma
 * convención que renderGonzalo()/renderElena()/renderCorolaria()/
 * renderBrideFather()/renderSilogio(). Sin cache -> se dibuja
 * directamente (rama usada por el entorno de test, sin DOM).
 */
export function renderMax(context, x, y) {
  const sprite = getCachedSprite("max-side", drawSide);

  if (sprite) {
    context.imageSmoothingEnabled = false;
    context.drawImage(sprite, Math.round(x), Math.round(y));
    return;
  }

  drawSide(context, x, y);
}
