import assert from "node:assert/strict";
import test from "node:test";
import { GameState } from "../../src/state/GameState.js";
import { getWorldMap } from "../../src/content/worldMaps.js";
import {
  EPILOGUE_GIFT_MECHANISM_PALETTE,
  EPILOGUE_GIFT_MECHANISM_PIXEL_HEIGHT,
  EPILOGUE_GIFT_MECHANISM_PIXEL_WIDTH,
  EPILOGUE_GIFT_MECHANISM_PIXELS,
  EPILOGUE_GIFT_MECHANISM_TRANSPARENT,
} from "../../src/content/epilogueGiftMechanismPixelArt.js";

/*
 * Cubre el caso especial por-id de `epilogue-gift-mechanism` en
 * renderObjects() (src/scenes/WorldScene.js) y su capa de cache de
 * sprites pixel-art (Plaza del Axioma -- Visual Polish, v1.2). Mismo
 * patrón que tests/scenes/ArchiveVisualPolishPixelArtCache.test.js: vive
 * en su propio archivo porque `node --test` aísla cada archivo en un
 * proceso propio, así el `document` simulado y el propSpriteCache que
 * rellena no contaminan el resto de la suite (que depende de que
 * `document` sea `undefined`).
 */

class FakeSpriteContext {
  constructor() {
    this.imageSmoothingEnabled = true;
    this.fillRectCalls = 0;
    this.fillStyleCounts = new Map();
  }

  set fillStyle(value) {
    this.currentFillStyle = value;
  }

  get fillStyle() {
    return this.currentFillStyle;
  }

  fillRect() {
    this.fillRectCalls += 1;
    this.fillStyleCounts.set(
      this.currentFillStyle,
      (this.fillStyleCounts.get(this.currentFillStyle) ?? 0) + 1,
    );
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
    this.usedFillStyles = new Set();
    this.imageSmoothingEnabled = true;
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

const MECHANISM = getWorldMap("axiom-plaza").objects.find(
  (object) => object.id === "epilogue-gift-mechanism",
);

/*
 * axiom-plaza (48x32 tiles, 768x512px) es mayor que el viewport lógico
 * (480x270), y el spawn por defecto (240,192, ver GameState.js) deja el
 * mecanismo (x560) fuera de cámara: renderObjects() lo descartaría por
 * culling. Por eso el escenario coloca al jugador junto al mecanismo y
 * vuelve a enganchar la cámara antes de renderizar.
 */
function createPlazaSceneWithPlayerAt(x, y) {
  const state = new GameState();
  state.changeMap("axiom-plaza");

  const scene = new WorldScene({
    scenes: new FakeScenes(),
    input: new FakeInput(),
    storage: new FakeStorage(),
    state,
    ui: new FakeUi(),
    audio: new FakeAudioService(),
  });

  scene.enter();
  scene.player.x = x;
  scene.player.y = y;
  scene.camera.follow(scene.player);
  return scene;
}

function createPlazaSceneNearMechanism() {
  return createPlazaSceneWithPlayerAt(
    MECHANISM.x + MECHANISM.width / 2,
    MECHANISM.y + MECHANISM.height + 16,
  );
}

/*
 * axiom-plaza tiene otro prop indexado de exactamente 40x40 (la mesa
 * redonda de boda, weddingTablePixelArt.js), así que buscar el canvas
 * cacheado solo por dimensiones sería ambiguo. El contorno del mecanismo
 * (#191820) sí es exclusivo suyo en todo `src/`, así que sirve como firma
 * para identificar su canvas sin depender de un snapshot de imagen.
 */
const MECHANISM_OUTLINE_COLOR = EPILOGUE_GIFT_MECHANISM_PALETTE.O;

function findMechanismCanvas() {
  return createdCanvases.find(
    (canvas) =>
      canvas.width === EPILOGUE_GIFT_MECHANISM_PIXEL_WIDTH &&
      canvas.height === EPILOGUE_GIFT_MECHANISM_PIXEL_HEIGHT &&
      canvas.context.fillStyleCounts.has(MECHANISM_OUTLINE_COLOR),
  );
}

function findMechanismDrawCalls(context) {
  const canvas = findMechanismCanvas();

  return context.drawImageCalls.filter((call) => call.image === canvas);
}

function countPixelsBySymbol() {
  const counts = new Map();

  for (const row of EPILOGUE_GIFT_MECHANISM_PIXELS) {
    for (const symbol of row) {
      counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
    }
  }

  return counts;
}

test("los datos de pixel-art del mecanismo son rectangulares y todos sus símbolos están en la paleta", () => {
  assert.equal(
    EPILOGUE_GIFT_MECHANISM_PIXELS.length,
    EPILOGUE_GIFT_MECHANISM_PIXEL_HEIGHT,
  );

  for (const [index, row] of EPILOGUE_GIFT_MECHANISM_PIXELS.entries()) {
    assert.equal(
      row.length,
      EPILOGUE_GIFT_MECHANISM_PIXEL_WIDTH,
      `la fila ${index} no mide ${EPILOGUE_GIFT_MECHANISM_PIXEL_WIDTH} caracteres`,
    );
  }

  const counts = countPixelsBySymbol();

  for (const symbol of counts.keys()) {
    if (symbol === EPILOGUE_GIFT_MECHANISM_TRANSPARENT) {
      continue;
    }

    assert.ok(
      EPILOGUE_GIFT_MECHANISM_PALETTE[symbol],
      `el símbolo "${symbol}" no tiene color en la paleta`,
    );
  }

  for (const symbol of Object.keys(EPILOGUE_GIFT_MECHANISM_PALETTE)) {
    assert.ok(
      counts.has(symbol),
      `el símbolo "${symbol}" está en la paleta pero no se usa en los datos`,
    );
  }
});

test("'epilogue-gift-mechanism' se cachea con las dimensiones declaradas por sus datos, con imageSmoothingEnabled=false y un fillRect por píxel no transparente", () => {
  const scene = createPlazaSceneNearMechanism();
  const context = new FakeGameContext();

  scene.render(context);

  const canvas = findMechanismCanvas();

  assert.ok(
    canvas,
    `se esperaba un canvas cacheado de ${EPILOGUE_GIFT_MECHANISM_PIXEL_WIDTH}x${EPILOGUE_GIFT_MECHANISM_PIXEL_HEIGHT} para el mecanismo del regalo`,
  );
  assert.equal(canvas.context.imageSmoothingEnabled, false);

  const counts = countPixelsBySymbol();
  const transparentPixels =
    counts.get(EPILOGUE_GIFT_MECHANISM_TRANSPARENT) ?? 0;
  const opaquePixels = canvas.width * canvas.height - transparentPixels;

  assert.ok(
    transparentPixels > 0,
    "el mecanismo sí usa transparencia en sus esquinas",
  );
  assert.equal(canvas.context.fillRectCalls, opaquePixels);
});

test("cada color de la paleta del mecanismo se rasteriza tantas veces como píxeles declara su símbolo", () => {
  const scene = createPlazaSceneNearMechanism();
  const context = new FakeGameContext();

  scene.render(context);

  const canvas = findMechanismCanvas();
  const counts = countPixelsBySymbol();

  for (const [symbol, color] of Object.entries(
    EPILOGUE_GIFT_MECHANISM_PALETTE,
  )) {
    assert.equal(
      canvas.context.fillStyleCounts.get(color),
      counts.get(symbol),
      `el color ${color} ("${symbol}") debería rasterizarse ${counts.get(symbol)} veces`,
    );
  }
});

/*
 * Regresión del desborde documentado en drawEpilogueGiftMechanism()
 * (WorldScene.js): el sprite (40x40) es mayor que el hitbox declarado del
 * objeto (32x24), se centra horizontalmente sobre él y se ancla a su
 * borde inferior. Los valores esperados se derivan del propio objeto de
 * worldMaps.js y de la cámara, no de coordenadas fijas.
 */
test("el sprite del mecanismo se centra sobre el hitbox y se ancla a su borde inferior", () => {
  const scene = createPlazaSceneNearMechanism();
  const context = new FakeGameContext();

  scene.render(context);

  const drawCalls = findMechanismDrawCalls(context);

  assert.equal(
    drawCalls.length,
    1,
    "el mecanismo debe dibujarse exactamente una vez por frame",
  );

  const objectScreenX = Math.round(MECHANISM.x - scene.camera.x);
  const objectScreenY = Math.round(MECHANISM.y - scene.camera.y);
  const expectedX =
    objectScreenX -
    (EPILOGUE_GIFT_MECHANISM_PIXEL_WIDTH - MECHANISM.width) / 2;
  const expectedY =
    objectScreenY - (EPILOGUE_GIFT_MECHANISM_PIXEL_HEIGHT - MECHANISM.height);

  assert.equal(drawCalls[0].x, expectedX);
  assert.equal(drawCalls[0].y, expectedY);
  assert.equal(
    expectedY + EPILOGUE_GIFT_MECHANISM_PIXEL_HEIGHT,
    objectScreenY + MECHANISM.height,
    "el borde inferior del sprite debe coincidir con el del hitbox",
  );
});

/*
 * Regresión del "pop" en el borde inferior de pantalla: el culling por
 * viewport de renderObjects() medía el hitbox declarado (32x24) y no el
 * footprint real del sprite (40x40), así que descartaba el mecanismo
 * mientras sus 16px de desborde superior seguían dentro del viewport y el
 * objeto aparecía entero de golpe un paso más abajo. axiom-plaza es el
 * único mapa afectado porque es el único con scroll de cámara.
 *
 * Escenario exacto reportado: jugador en (600,160) -> camera.y=25 ->
 * el hitbox cae en y=271 (fuera por 1px) pero el sprite empieza en y=255,
 * con 15 filas visibles.
 */
const VIEWPORT_HEIGHT = 270;

function mechanismSpriteTopFor(scene) {
  const objectScreenY = Math.round(MECHANISM.y - scene.camera.y);

  return (
    objectScreenY - (EPILOGUE_GIFT_MECHANISM_PIXEL_HEIGHT - MECHANISM.height)
  );
}

test("el mecanismo sigue dibujándose cuando su hitbox sale por abajo pero su sprite aún entra en pantalla", () => {
  const scene = createPlazaSceneWithPlayerAt(600, 160);
  const context = new FakeGameContext();

  scene.render(context);

  const objectScreenY = Math.round(MECHANISM.y - scene.camera.y);

  assert.ok(
    objectScreenY > VIEWPORT_HEIGHT,
    "el escenario debe dejar el hitbox declarado fuera del viewport",
  );

  const spriteTop = mechanismSpriteTopFor(scene);

  assert.ok(
    spriteTop <= VIEWPORT_HEIGHT,
    "pero el sprite real todavía debe asomar por el borde inferior",
  );

  const drawCalls = findMechanismDrawCalls(context);

  assert.equal(
    drawCalls.length,
    1,
    "el mecanismo no debe descartarse por culling mientras su sprite sea visible",
  );
  assert.equal(drawCalls[0].y, spriteTop);
});

test("el mecanismo entra deslizándose por el borde inferior, sin aparecer de golpe", () => {
  const visibility = [];

  for (let playerY = 140; playerY <= 176; playerY += 2) {
    const scene = createPlazaSceneWithPlayerAt(600, playerY);
    const context = new FakeGameContext();

    scene.render(context);

    visibility.push({
      playerY,
      spriteTop: mechanismSpriteTopFor(scene),
      drawn: findMechanismDrawCalls(context).length === 1,
    });
  }

  for (const frame of visibility) {
    assert.equal(
      frame.drawn,
      frame.spriteTop <= VIEWPORT_HEIGHT,
      `con el jugador en y=${frame.playerY} el sprite empieza en y=${frame.spriteTop}: debe dibujarse si y solo si entra en el viewport`,
    );
  }

  assert.ok(
    visibility.some((frame) => !frame.drawn),
    "el barrido debe incluir frames con el sprite totalmente fuera: el culling sigue descartando",
  );
  assert.ok(
    visibility.some((frame) => frame.drawn),
    "y frames con el sprite dentro",
  );
});

test("un segundo render de axiom-plaza no crea un canvas de sprite adicional para el mecanismo", () => {
  const scene = createPlazaSceneNearMechanism();
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

  const firstMechanismCalls = findMechanismDrawCalls(firstFrame);
  const secondMechanismCalls = findMechanismDrawCalls(secondFrame);

  assert.equal(firstMechanismCalls.length, 1);
  assert.equal(secondMechanismCalls.length, 1);
  assert.equal(
    secondMechanismCalls[0].image,
    firstMechanismCalls[0].image,
    "el segundo frame debe reutilizar exactamente el mismo canvas cacheado",
  );
});

/*
 * El mecanismo ya no cae en la rama genérica compartida de type "table"
 * (dos fillRect: cuerpo marrón madera #553b2d + franja dorada #d6b65f),
 * que era el "bloque marrón sin identidad visual" reportado. Tras el
 * visual polish, esa rama se queda sin ningún consumidor real en todo el
 * juego.
 */
test("ningún objeto de axiom-plaza usa ya los colores de la rama genérica de type 'table'", () => {
  const scene = createPlazaSceneNearMechanism();
  const context = new FakeGameContext();

  scene.render(context);

  const tableObjects = getWorldMap("axiom-plaza").objects.filter(
    (object) => object.type === "table",
  );

  assert.deepEqual(
    tableObjects.map((object) => object.id),
    ["epilogue-gift-mechanism"],
    "axiom-plaza sigue declarando un único objeto de type 'table'",
  );

  assert.equal(findMechanismDrawCalls(context).length, 1);
  assert.ok(
    !context.usedFillStyles.has("#553b2d"),
    "el marrón madera de la rama genérica 'table' ya no debe dibujarse en axiom-plaza",
  );
});
