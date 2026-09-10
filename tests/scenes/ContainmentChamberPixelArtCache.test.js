import assert from "node:assert/strict";
import test from "node:test";
import { GameState } from "../../src/state/GameState.js";
import {
  CONTAINMENT_SHELF_PIXEL_HEIGHT,
  CONTAINMENT_SHELF_PIXEL_WIDTH,
} from "../../src/content/containmentShelfPixelArt.js";
import {
  CONTAINMENT_LATTICE_PIXEL_HEIGHT,
  CONTAINMENT_LATTICE_PIXEL_WIDTH,
} from "../../src/content/containmentLatticePixelArt.js";
import {
  CONTAINMENT_WELL_PALETTE,
  CONTAINMENT_WELL_PIXEL_HEIGHT,
  CONTAINMENT_WELL_PIXEL_WIDTH,
} from "../../src/content/containmentWellPixelArt.js";
import {
  CONTAINMENT_BUDGET_PANEL_PALETTE,
  CONTAINMENT_BUDGET_PANEL_PIXEL_HEIGHT,
  CONTAINMENT_BUDGET_PANEL_PIXEL_WIDTH,
} from "../../src/content/containmentBudgetPanelPixelArt.js";
import { getWorldMap } from "../../src/content/worldMaps.js";

/*
 * Cubre la capa de cache de sprites pixel-art (src/scenes/WorldScene.js)
 * para el mobiliario de containment-chamber (v1.3). Mismo patrón que
 * tests/scenes/ArchiveVisualPolishPixelArtCache.test.js: vive en su propio
 * archivo porque `node --test` aísla cada archivo en un proceso propio, así
 * el `document` simulado y el propSpriteCache que rellena no contaminan el
 * resto de la suite (que depende de que `document` sea `undefined`).
 *
 * containment-chamber (24x16 tiles, 384x256px) es más pequeño que el
 * viewport lógico (480x270), así que Camera.follow() lo clampa siempre a
 * (0,0) y la sala entera está en pantalla sin depender del spawn.
 */

class FakeSpriteContext {
  constructor() {
    this.imageSmoothingEnabled = true;
    this.fillRectCalls = 0;
    this.usedFillStyles = new Set();
  }

  set fillStyle(value) {
    this.currentFillStyle = value;
  }

  get fillStyle() {
    return this.currentFillStyle;
  }

  fillRect() {
    this.fillRectCalls += 1;
    this.usedFillStyles.add(this.currentFillStyle);
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
    this.fillRectCalls = [];
    this.usedFillStyles = new Set();
    this.imageSmoothingEnabled = true;
  }

  set fillStyle(value) {
    this.currentFillStyle = value;
  }

  get fillStyle() {
    return this.currentFillStyle;
  }

  fillRect(x, y, width, height) {
    this.fillRectCalls.push({
      x,
      y,
      width,
      height,
      fillStyle: this.currentFillStyle,
    });
    this.usedFillStyles.add(this.currentFillStyle);
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

  beginDialogue() {}
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

globalThis.document = {
  createElement(tagName) {
    assert.equal(tagName, "canvas");

    const canvas = new FakeSpriteCanvas();
    createdCanvases.push(canvas);
    return canvas;
  },
};

const { WorldScene } = await import("../../src/scenes/WorldScene.js");

function createContainmentScene() {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.containmentUnlocked = true;
  state.changeMap("containment-chamber");

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

function findCanvasByDimensions(width, height) {
  return createdCanvases.find(
    (canvas) => canvas.width === width && canvas.height === height,
  );
}

/*
 * El pozo y el panel de consulta miden los dos 32x32, así que buscarlos por
 * dimensiones sería ambiguo: se localizan por la posición exacta en la que
 * se dibujan, que en este mapa coincide con la del dato en worldMaps.js
 * (containment-chamber, 384x256, cabe entera en el viewport lógico de
 * 480x270 y la cámara nunca se mueve de (0,0)).
 */
function findCanvasDrawnAt(context, x, y) {
  return (
    context.drawImageCalls.find((call) => call.x === x && call.y === y)
      ?.image ?? null
  );
}

test("'sealed-dossier-rack' se cachea con las dimensiones declaradas por sus datos, con imageSmoothingEnabled=false", () => {
  const scene = createContainmentScene();
  const context = new FakeGameContext();

  scene.render(context);

  const canvas = findCanvasByDimensions(
    CONTAINMENT_SHELF_PIXEL_WIDTH,
    CONTAINMENT_SHELF_PIXEL_HEIGHT,
  );

  assert.ok(
    canvas,
    `se esperaba un canvas cacheado de ${CONTAINMENT_SHELF_PIXEL_WIDTH}x${CONTAINMENT_SHELF_PIXEL_HEIGHT} para la estantería sellada`,
  );
  assert.equal(canvas.context.imageSmoothingEnabled, false);
  // La estantería sellada no usa transparencia: cubre su bounding box entero.
  assert.equal(canvas.context.fillRectCalls, canvas.width * canvas.height);
});

test("las dos estanterías selladas comparten un único sprite cacheado", () => {
  const scene = createContainmentScene();
  const context = new FakeGameContext();

  scene.render(context);

  const canvas = findCanvasByDimensions(
    CONTAINMENT_SHELF_PIXEL_WIDTH,
    CONTAINMENT_SHELF_PIXEL_HEIGHT,
  );
  const rackDraws = context.drawImageCalls.filter(
    (call) => call.image === canvas,
  );

  assert.equal(rackDraws.length, 2);
});

test("'containment-well' se cachea con las dimensiones declaradas y sí usa transparencia", () => {
  const scene = createContainmentScene();
  const context = new FakeGameContext();

  scene.render(context);

  const well = getWorldMap("containment-chamber").decorations.find(
    (entry) => entry.id === "containment-well",
  );
  const canvas = findCanvasDrawnAt(context, well.x, well.y);

  assert.ok(canvas, "se esperaba el canvas cacheado del pozo de expedientes");
  assert.equal(canvas.width, CONTAINMENT_WELL_PIXEL_WIDTH);
  assert.equal(canvas.height, CONTAINMENT_WELL_PIXEL_HEIGHT);
  assert.equal(canvas.context.imageSmoothingEnabled, false);
  assert.ok(canvas.context.fillRectCalls > 0);
  assert.ok(
    canvas.context.fillRectCalls < canvas.width * canvas.height,
    "el pozo es circular: debe haber menos fillRect que píxeles totales",
  );
  assert.ok(
    canvas.context.usedFillStyles.has(CONTAINMENT_WELL_PALETTE.t),
    "el fondo del pozo debe pintarse con la luz turquesa de su paleta",
  );
});

/*
 * El resplandor del pozo NO forma parte del sprite cacheado (que mide
 * exactamente 32x32 y no puede desbordar su solidRegion): son dos
 * rectángulos translúcidos dibujados directamente sobre el contexto del
 * juego, alrededor del sprite.
 */
test("el pozo dibuja su resplandor turquesa fuera del sprite cacheado", () => {
  const scene = createContainmentScene();
  const context = new FakeGameContext();

  scene.render(context);

  const glowRects = context.fillRectCalls.filter(
    (call) =>
      typeof call.fillStyle === "string" && call.fillStyle.includes("87 201 194"),
  );

  assert.equal(glowRects.length, 2);

  for (const rect of glowRects) {
    assert.ok(
      rect.width > CONTAINMENT_WELL_PIXEL_WIDTH,
      "el resplandor debe desbordar el sprite del pozo",
    );
    assert.ok(rect.height > CONTAINMENT_WELL_PIXEL_HEIGHT);
  }
});

/*
 * Única decoración del juego cuyo sprite no cubre por sí solo su footprint:
 * la celosía (16x224) repite verticalmente el mismo patrón de 16x32 -- un
 * solo canvas cacheado y siete drawImage(), no siete rasterizaciones.
 */
test("la celosía repite un único sprite cacheado a lo alto de su footprint", () => {
  const scene = createContainmentScene();
  const context = new FakeGameContext();

  scene.render(context);

  const canvas = findCanvasByDimensions(
    CONTAINMENT_LATTICE_PIXEL_WIDTH,
    CONTAINMENT_LATTICE_PIXEL_HEIGHT,
  );

  assert.ok(canvas, "se esperaba el canvas cacheado del patrón de celosía");

  const decoration = getWorldMap("containment-chamber").decorations.find(
    (entry) => entry.id === "containment-lattice-screen",
  );
  const expectedRepeats =
    decoration.height / CONTAINMENT_LATTICE_PIXEL_HEIGHT;

  assert.equal(Number.isInteger(expectedRepeats), true);

  const latticeDraws = context.drawImageCalls.filter(
    (call) => call.image === canvas,
  );

  assert.equal(latticeDraws.length, expectedRepeats);
  assert.deepEqual(
    latticeDraws.map((call) => call.y),
    Array.from(
      { length: expectedRepeats },
      (_, index) => decoration.y + index * CONTAINMENT_LATTICE_PIXEL_HEIGHT,
    ),
  );
});

/*
 * El panel de consulta es de type "table", el mismo tipo que en la rama
 * genérica de renderObjects() se pinta con dos fillRect de madera cálida y
 * dorado. Estas dos pruebas fijan que ya no cae ahí: dibuja un sprite
 * cacheado propio, y ningún fillRect del frame usa la paleta cálida.
 */
test("'containment-budget-panel' se dibuja como sprite cacheado propio, anclado a su hitbox", () => {
  const scene = createContainmentScene();
  const context = new FakeGameContext();

  scene.render(context);

  const panel = getWorldMap("containment-chamber").objects.find(
    (object) => object.id === "containment-budget-panel",
  );
  const canvas = findCanvasDrawnAt(context, panel.x, panel.y);

  assert.ok(canvas, "se esperaba el canvas cacheado del panel de consulta");
  assert.equal(canvas.width, CONTAINMENT_BUDGET_PANEL_PIXEL_WIDTH);
  assert.equal(canvas.height, CONTAINMENT_BUDGET_PANEL_PIXEL_HEIGHT);
  assert.equal(canvas.context.imageSmoothingEnabled, false);
  // Sin transparencia: cubre su bounding box entero, que es su región sólida.
  assert.equal(
    canvas.context.fillRectCalls,
    canvas.width * canvas.height,
  );
  assert.ok(
    canvas.context.usedFillStyles.has(CONTAINMENT_BUDGET_PANEL_PALETTE.t),
    "la ranura de lectura debe pintarse con el turquesa de la Cámara",
  );
  assert.notEqual(
    canvas,
    findCanvasDrawnAt(context, 176, 112),
    "el panel y el pozo miden lo mismo pero no comparten sprite",
  );
});

test("el panel de consulta no pinta la madera ni el dorado de la rama genérica de mesas", () => {
  const scene = createContainmentScene();
  const context = new FakeGameContext();

  scene.render(context);

  for (const warmColor of ["#553b2d", "#d6b65f"]) {
    assert.equal(
      context.usedFillStyles.has(warmColor),
      false,
      `${warmColor} pertenece a la rama genérica de type "table"`,
    );
  }
});

test("un segundo render de containment-chamber no crea canvases de sprite adicionales", () => {
  const scene = createContainmentScene();
  const firstFrame = new FakeGameContext();
  const secondFrame = new FakeGameContext();

  scene.render(firstFrame);
  const canvasCountAfterFirstFrame = createdCanvases.length;

  scene.render(secondFrame);

  assert.equal(createdCanvases.length, canvasCountAfterFirstFrame);

  const firstFrameImages = new Set(
    firstFrame.drawImageCalls.map((call) => call.image),
  );

  assert.ok(firstFrameImages.size > 0);

  for (const call of secondFrame.drawImageCalls) {
    assert.ok(firstFrameImages.has(call.image));
  }
});
