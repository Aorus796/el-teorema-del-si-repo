import assert from "node:assert/strict";
import test from "node:test";
import { GameState } from "../../src/state/GameState.js";
import {
  ARCHIVE_SHELF_PIXEL_HEIGHT,
  ARCHIVE_SHELF_PIXEL_WIDTH,
} from "../../src/content/archiveShelfPixelArt.js";
import {
  ARCHIVE_CRATES_PIXEL_HEIGHT,
  ARCHIVE_CRATES_PIXEL_WIDTH,
} from "../../src/content/archiveCratesPixelArt.js";
import {
  ARCHIVE_CONSULTATION_TABLE_PIXEL_HEIGHT,
  ARCHIVE_CONSULTATION_TABLE_PIXEL_WIDTH,
} from "../../src/content/archiveConsultationTablePixelArt.js";
import {
  ARCHIVE_DESK_PIXEL_HEIGHT,
  ARCHIVE_DESK_PIXEL_WIDTH,
} from "../../src/content/archiveDeskPixelArt.js";

/*
 * Cubre la capa de cache de sprites pixel-art (src/scenes/WorldScene.js)
 * para el mobiliario nuevo/migrado de archive (Archivo -- Visual Polish,
 * v1.1). Mismo patrón que tests/scenes/LibraryVisualPolishPixelArtCache.test.js:
 * vive en su propio archivo porque `node --test` aísla cada archivo en un
 * proceso propio, así el `document` simulado y el propSpriteCache que
 * rellena no contaminan el resto de la suite (que depende de que
 * `document` sea `undefined`).
 */

class FakeSpriteContext {
  constructor() {
    this.imageSmoothingEnabled = true;
    this.fillRectCalls = 0;
  }

  fillRect() {
    this.fillRectCalls += 1;
  }

  strokeRect() {}

  fillText() {}
}

class FakeSpriteCanvas {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.context = new FakeSpriteContext();
  }

  getContext(type) {
    assert.equal(type, "2d");
    return this.context;
  }
}

class FakeGameContext {
  constructor() {
    this.drawImageCalls = [];
    this.fillRectCalls = 0;
    this.imageSmoothingEnabled = true;
  }

  fillRect() {
    this.fillRectCalls += 1;
  }

  strokeRect() {}

  fillText() {}

  drawImage(image, x, y) {
    this.drawImageCalls.push({ image, x, y });
  }
}

class FakeInput {
  wasPressed() {
    return false;
  }

  getAxis() {
    return { x: 0, y: 0 };
  }
}

class FakeScenes {
  change() {}
}

class FakeUi {
  closeAll() {}

  hidePrompt() {}

  showPrompt() {}

  showToast() {}
}

class FakeAudioService {
  playEpilogueTheme() {}

  playMusic() {}

  stopMusic() {}

  playSfx() {}
}

class FakeStorage {
  save() {}

  load() {
    return null;
  }
}

const createdCanvases = [];

const fakeDocument = {
  createElement(tagName) {
    assert.equal(tagName, "canvas");

    const canvas = new FakeSpriteCanvas();
    createdCanvases.push(canvas);
    return canvas;
  },
};

globalThis.document = fakeDocument;

const { WorldScene } = await import("../../src/scenes/WorldScene.js");

function createSceneAt(mapId) {
  const state = new GameState();
  state.changeMap(mapId);

  const scene = new WorldScene({
    scenes: new FakeScenes(),
    input: new FakeInput(),
    storage: new FakeStorage(),
    state,
    ui: new FakeUi(),
    audio: new FakeAudioService(),
  });

  scene.enter();
  return scene;
}

/*
 * archive (24x16 tiles, 384x256px) es más pequeño que el viewport lógico
 * (480x270), así que Camera.follow() lo clampa siempre a (0,0) -- ver
 * Camera.js -- y el mapa completo (las 4 decoraciones migradas, las 2
 * mesas de consulta nuevas y el escritorio) siempre está en pantalla, sin
 * depender de la posición del jugador ni del spawn.
 */
function findCanvasByDimensions(width, height) {
  return createdCanvases.find(
    (canvas) => canvas.width === width && canvas.height === height,
  );
}

test("'archive-shelf' se cachea con las dimensiones declaradas por sus datos, con imageSmoothingEnabled=false y fillRect por cada píxel no transparente", () => {
  const scene = createSceneAt("archive");
  const context = new FakeGameContext();

  scene.render(context);

  const canvas = findCanvasByDimensions(
    ARCHIVE_SHELF_PIXEL_WIDTH,
    ARCHIVE_SHELF_PIXEL_HEIGHT,
  );

  assert.ok(
    canvas,
    `se esperaba un canvas cacheado de ${ARCHIVE_SHELF_PIXEL_WIDTH}x${ARCHIVE_SHELF_PIXEL_HEIGHT} para la estantería`,
  );
  assert.equal(canvas.context.imageSmoothingEnabled, false);
  assert.ok(canvas.context.fillRectCalls > 0);
  // "archive-shelf" no usa transparencia (mismo patrón que library-shelf),
  // así que el número de fillRect debe ser exactamente ancho*alto.
  assert.equal(canvas.context.fillRectCalls, canvas.width * canvas.height);
});

test("'archive-crates' se cachea con las dimensiones declaradas por sus datos, con imageSmoothingEnabled=false", () => {
  const scene = createSceneAt("archive");
  const context = new FakeGameContext();

  scene.render(context);

  const canvas = findCanvasByDimensions(
    ARCHIVE_CRATES_PIXEL_WIDTH,
    ARCHIVE_CRATES_PIXEL_HEIGHT,
  );

  assert.ok(
    canvas,
    `se esperaba un canvas cacheado de ${ARCHIVE_CRATES_PIXEL_WIDTH}x${ARCHIVE_CRATES_PIXEL_HEIGHT} para las cajas`,
  );
  assert.equal(canvas.context.imageSmoothingEnabled, false);
  assert.ok(canvas.context.fillRectCalls > 0);
  // "archive-crates" tampoco usa transparencia.
  assert.equal(canvas.context.fillRectCalls, canvas.width * canvas.height);
});

test("'archive-consultation-table' se cachea con las dimensiones declaradas por sus datos, con imageSmoothingEnabled=false y sí usa transparencia", () => {
  const scene = createSceneAt("archive");
  const context = new FakeGameContext();

  scene.render(context);

  const canvas = findCanvasByDimensions(
    ARCHIVE_CONSULTATION_TABLE_PIXEL_WIDTH,
    ARCHIVE_CONSULTATION_TABLE_PIXEL_HEIGHT,
  );

  assert.ok(
    canvas,
    `se esperaba un canvas cacheado de ${ARCHIVE_CONSULTATION_TABLE_PIXEL_WIDTH}x${ARCHIVE_CONSULTATION_TABLE_PIXEL_HEIGHT} para la mesa de consulta`,
  );
  assert.equal(canvas.context.imageSmoothingEnabled, false);
  assert.ok(canvas.context.fillRectCalls > 0);
  assert.ok(
    canvas.context.fillRectCalls < canvas.width * canvas.height,
    "la mesa de consulta sí usa transparencia, debe haber menos fillRect que píxeles totales",
  );
});

test("el escritorio de 'archive-criteria-table' (archive-desk) se cachea con las dimensiones declaradas por sus datos, con imageSmoothingEnabled=false", () => {
  const scene = createSceneAt("archive");
  const context = new FakeGameContext();

  scene.render(context);

  const canvas = findCanvasByDimensions(
    ARCHIVE_DESK_PIXEL_WIDTH,
    ARCHIVE_DESK_PIXEL_HEIGHT,
  );

  assert.ok(
    canvas,
    `se esperaba un canvas cacheado de ${ARCHIVE_DESK_PIXEL_WIDTH}x${ARCHIVE_DESK_PIXEL_HEIGHT} para el escritorio`,
  );
  assert.equal(canvas.context.imageSmoothingEnabled, false);
  assert.ok(canvas.context.fillRectCalls > 0);
  assert.ok(canvas.context.fillRectCalls < canvas.width * canvas.height);
});

test("un segundo render de archive no crea canvases de sprite adicionales para los props ya cacheados", () => {
  const scene = createSceneAt("archive");
  const firstFrame = new FakeGameContext();
  const secondFrame = new FakeGameContext();

  scene.render(firstFrame);
  const canvasCountAfterFirstFrame = createdCanvases.length;

  scene.render(secondFrame);

  assert.equal(
    createdCanvases.length,
    canvasCountAfterFirstFrame,
    "un segundo frame no debe rasterizar de nuevo ningún sprite ya cacheado",
  );

  const firstFrameImages = new Set(
    firstFrame.drawImageCalls.map((call) => call.image),
  );
  const secondFrameImages = new Set(
    secondFrame.drawImageCalls.map((call) => call.image),
  );

  assert.ok(firstFrameImages.size > 0);

  for (const image of secondFrameImages) {
    assert.ok(
      firstFrameImages.has(image),
      "el segundo frame debe reutilizar exactamente los mismos objetos canvas que el primero",
    );
  }
});

/*
 * Regresión directa del caso especial por-id añadido a renderObjects()
 * (WorldScene.js): "archive-criteria-table" es el único id que recibe el
 * tratamiento de escritorio dedicado (archive-desk, 48x48). El único otro
 * objeto de type "table" de todo el juego, epilogue-gift-mechanism (en
 * axiom-plaza), no debe verse afectado -- debe seguir cayendo en la rama
 * genérica compartida ("table"), que dibuja directamente con fillRect
 * sobre el contexto real, sin pasar por drawCachedProp() para ese objeto.
 *
 * `createdCanvases` es un array a nivel de módulo que se acumula entre
 * TODOS los tests de este archivo (mismo `fakeDocument`, nunca se
 * resetea) -- para cuando se ejecuta este test, los tests anteriores ya
 * renderizaron `archive` y ya existe un canvas cacheado de 48x48 para
 * archive-desk. Por eso la regresión no puede comprobarse buscando "no
 * existe ningún canvas de 48x48" (ver findCanvasByDimensions): en vez de
 * eso, comprueba que el propio render de axiom-plaza no emite ninguna
 * llamada a drawImage() con una imagen de 48x48 -- es decir, que este
 * render en concreto no reutiliza el sprite de archive-desk.
 */
test("epilogue-gift-mechanism (axiom-plaza) no activa el caso especial de archive-criteria-table ni dibuja el sprite de archive-desk", () => {
  const scene = createSceneAt("axiom-plaza");
  const context = new FakeGameContext();

  scene.render(context);

  const deskDrawCalls = context.drawImageCalls.filter(
    (call) =>
      call.image.width === ARCHIVE_DESK_PIXEL_WIDTH &&
      call.image.height === ARCHIVE_DESK_PIXEL_HEIGHT,
  );

  assert.equal(
    deskDrawCalls.length,
    0,
    "el render de axiom-plaza no debería dibujar el sprite de archive-desk",
  );
  assert.ok(
    context.fillRectCalls > 0,
    "epilogue-gift-mechanism debe seguir dibujándose con fillRect directo (rama genérica 'table')",
  );
});
