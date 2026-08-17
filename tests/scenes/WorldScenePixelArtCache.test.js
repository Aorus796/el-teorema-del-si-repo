import assert from "node:assert/strict";
import test from "node:test";
import { GameState } from "../../src/state/GameState.js";
import {
  WEDDING_TABLE_PIXEL_HEIGHT,
  WEDDING_TABLE_PIXEL_WIDTH,
  WEDDING_TABLE_PIXELS,
  WEDDING_TABLE_TRANSPARENT,
} from "../../src/content/weddingTablePixelArt.js";
import {
  WEDDING_ARCH_PIXEL_HEIGHT,
  WEDDING_ARCH_PIXEL_WIDTH,
} from "../../src/content/weddingArchPixelArt.js";
import {
  FOUNTAIN_PIXEL_HEIGHT,
  FOUNTAIN_PIXEL_WIDTH,
} from "../../src/content/fountainPixelArt.js";

/*
 * Cubre la capa de cache de sprites pixel-art introducida en
 * src/scenes/WorldScene.js (Plaza Visual Polish, pasada de fidelidad
 * pixel-art): getCachedPropSprite()/drawCachedProp() no están exportadas a
 * propósito (siguen siendo un detalle interno pequeño, no una API pública),
 * así que este archivo las ejercita indirectamente, simulando un `document`
 * mínimo ANTES de importar WorldScene.js, para que getCachedPropSprite()
 * tome la rama "hay DOM" en vez de la rama de fallback usada por el resto
 * de la suite (que no define `document`, ver FakeCanvasContext en
 * WorldScene.test.js).
 *
 * Vive en su propio archivo (no en WorldScene.test.js) porque `node --test`
 * ejecuta cada archivo de test en un proceso aislado: así el `document`
 * simulado y el propSpriteCache que rellena no contaminan el resto de la
 * suite, que depende de que `document` sea `undefined`.
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
    this.fillRects = [];
    this.drawImageCalls = [];
    this.imageSmoothingEnabled = true;
  }

  fillRect(x, y, width, height) {
    this.fillRects.push({ x, y, width, height, fillStyle: this.fillStyle });
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

function createAxiomPlazaScene(playerPosition = null) {
  const state = new GameState();
  state.changeMap("axiom-plaza", playerPosition);

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

test("los sprites de props se rasterizan en un canvas aparte con imageSmoothingEnabled deshabilitado", () => {
  createdCanvases.length = 0;

  const scene = createAxiomPlazaScene();
  const context = new FakeGameContext();

  scene.render(context);

  assert.ok(
    createdCanvases.length > 0,
    "se esperaba al menos un canvas de sprite creado durante el render de axiom-plaza",
  );

  for (const canvas of createdCanvases) {
    assert.equal(
      canvas.context.imageSmoothingEnabled,
      false,
      "el contexto del sprite cacheado debe dibujarse sin smoothing",
    );
    assert.ok(
      canvas.context.fillRectCalls > 0,
      "el sprite cacheado debe haberse rasterizado con primitivas de canvas",
    );
  }

  assert.ok(
    context.drawImageCalls.length > 0,
    "el render normal debe reutilizar los sprites cacheados via drawImage",
  );
});

test("el cache de sprites devuelve la misma instancia de canvas en frames sucesivos, sin reconstruirla", () => {
  /*
   * No se resetea createdCanvases.length a 0 aquí: propSpriteCache es un
   * Map a nivel de módulo, compartido por todos los test() de este
   * archivo (misma instancia de módulo ES dentro del mismo proceso de
   * `node --test`), así que en este punto puede llegar ya "caliente" por
   * un test anterior. Lo que este test demuestra no depende de partir de
   * cache fría: solo de que un SEGUNDO render no cree canvases nuevos
   * respecto al primero, sea cual sea el estado de partida.
   */
  const scene = createAxiomPlazaScene();
  const firstFrame = new FakeGameContext();
  const secondFrame = new FakeGameContext();

  scene.render(firstFrame);

  const canvasCountAfterFirstFrame = createdCanvases.length;

  scene.render(secondFrame);

  // Un segundo render no debe crear ningún canvas de sprite adicional: la
  // cache ya tiene una entrada por cada combinación tipo+tamaño usada en
  // axiom-plaza y las reutiliza.
  assert.equal(
    createdCanvases.length,
    canvasCountAfterFirstFrame,
    "un segundo frame no debe rasterizar de nuevo ningún sprite ya cacheado",
  );

  // Las mismas imágenes (misma referencia de objeto canvas) deben
  // reutilizarse via drawImage en ambos frames, no copias nuevas.
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

test("los props del mismo tipo pero distinto tamaño no comparten sprite cacheado", () => {
  /*
   * No se resetea createdCanvases (misma razón que en el test anterior:
   * propSpriteCache es un Map de módulo compartido entre los test() de
   * este archivo bajo `node --test`, así que puede llegar ya caliente).
   * Eso no invalida esta comprobación: si un test anterior ya renderizó
   * axiom-plaza, los canvases de sprite de "bush" que creó siguen siendo
   * los que se reutilizan aquí -- lo que se quiere demostrar es que
   * EXISTEN dos canvases de ancho 20 con alturas distintas en el
   * historial acumulado, no en qué test concreto se crearon.
   *
   * axiom-plaza tiene decoraciones "bush" en dos tamaños distintos que
   * comparten el mismo ancho (20px): 20x20 en las esquinas
   * (bush-corner-*) y 20x24 junto a la fuente (bush-fountain-*) -- ver
   * src/content/worldMaps.js. drawDecorativeBush() elige entre tres
   * claves de cache fijas ("bush-round-fountain-indexed",
   * "bush-round-corner-indexed", "cypress-indexed", ver
   * src/content/bushPixelArt.js) comparando width/height contra las
   * dimensiones de cada matriz, así que las variantes de 20x20 y 20x24
   * deben producir DOS canvases de ancho 20 con alturas distintas (23 y
   * 27, cada matriz con 3px de margen de sombra), no un único canvas
   * reutilizado incorrectamente entre ambas (lo que recortaría o
   * deformaría una de las dos). Comprobar esto contra el ancho/alto real
   * de cada FakeSpriteCanvas creado -- en vez de solo contar "más de un
   * canvas distinto" en todo el render -- es lo que aísla específicamente
   * esta variante, ya que axiom-plaza tiene de sobra otros tipos de prop
   * que por sí solos ya producirían más de un canvas.
   */
  const scene = createAxiomPlazaScene();
  const context = new FakeGameContext();

  scene.render(context);

  const bushCanvasHeights = createdCanvases
    .filter((canvas) => canvas.width === 20)
    .map((canvas) => canvas.height);

  assert.ok(
    bushCanvasHeights.includes(23),
    "se esperaba un sprite cacheado de bush 20x20 (canvas 20x23)",
  );
  assert.ok(
    bushCanvasHeights.includes(27),
    "se esperaba un sprite cacheado de bush 20x24 (canvas 20x27) distinto del de 20x20",
  );
});

/*
 * Spike de pixel-art indexado (mesa de boda, src/content/
 * weddingTablePixelArt.js): estas pruebas cubren específicamente
 * createIndexedPixelSprite() a través de la cache real -- dimensiones del
 * canvas cacheado y que los pixeles transparentes de la matriz NO generan
 * ninguna llamada a fillRect (si se rellenaran, el sprite dejaría de tener
 * silueta recortada y se vería como un cuadrado sólido). Ningún otro prop
 * cacheado actual usa 40x40, así que filtrar por ese tamaño identifica sin
 * ambigüedad el canvas de la mesa.
 */
test("el sprite indexado de la mesa de boda se cachea con las dimensiones declaradas por sus datos", () => {
  // No se resetea createdCanvases: propSpriteCache puede llegar ya
  // caliente desde un test anterior de este mismo archivo (mismo motivo
  // que los tests de arriba) -- lo que importa es que el canvas exista en
  // el historial acumulado, no en qué render concreto se creó.
  //
  // Las mesas de boda están en (130-620, 340-394), fuera del viewport de
  // 480x270 que la cámara encuadra alrededor del spawn por defecto
  // (240,192) -- sin reposicionar al jugador cerca de una mesa antes de
  // renderizar, drawWeddingTable() nunca se llega a invocar y este test
  // fallaría con un falso negativo, no porque el sprite esté mal sino
  // porque nunca se dibujó nada que verificar.
  const scene = createAxiomPlazaScene({ x: 210, y: 348, facing: "down" });
  const context = new FakeGameContext();

  scene.render(context);

  const tableCanvas = createdCanvases.find(
    (canvas) =>
      canvas.width === WEDDING_TABLE_PIXEL_WIDTH &&
      canvas.height === WEDDING_TABLE_PIXEL_HEIGHT,
  );

  assert.ok(
    tableCanvas,
    `se esperaba un canvas cacheado de ${WEDDING_TABLE_PIXEL_WIDTH}x${WEDDING_TABLE_PIXEL_HEIGHT} para la mesa indexada`,
  );
});

test("createIndexedPixelSprite no dibuja los pixeles transparentes de la matriz", () => {
  // Tampoco se resetea aquí, por la misma razón: el canvas de la mesa
  // pudo crearse (y rasterizarse) en un test anterior, y sigue siendo la
  // misma instancia con el mismo fillRectCalls acumulado. Igual que
  // arriba, hay que situar al jugador cerca de una mesa para que
  // drawWeddingTable() llegue a ejecutarse al menos una vez en la suite.
  const scene = createAxiomPlazaScene({ x: 210, y: 348, facing: "down" });
  const context = new FakeGameContext();

  scene.render(context);

  const tableCanvas = createdCanvases.find(
    (canvas) =>
      canvas.width === WEDDING_TABLE_PIXEL_WIDTH &&
      canvas.height === WEDDING_TABLE_PIXEL_HEIGHT,
  );

  assert.ok(tableCanvas);

  const opaquePixelCount = WEDDING_TABLE_PIXELS.join("")
    .split("")
    .filter((symbol) => symbol !== WEDDING_TABLE_TRANSPARENT).length;

  assert.equal(
    tableCanvas.context.fillRectCalls,
    opaquePixelCount,
    "el número de fillRect del sprite cacheado debe coincidir exactamente con el número de pixeles no transparentes de la matriz -- ni más (pixeles transparentes rellenados) ni menos (pixeles opacos perdidos)",
  );
});

/*
 * Migración de props (Plaza Visual Polish): altar y fuente están dentro
 * del viewport de la cámara en el spawn por defecto de axiom-plaza
 * (240,192), a diferencia de las mesas -- no hace falta reposicionar al
 * jugador para estos dos.
 */
test("el sprite indexado del altar se cachea con las dimensiones declaradas por sus datos", () => {
  const scene = createAxiomPlazaScene();
  const context = new FakeGameContext();

  scene.render(context);

  const archCanvas = createdCanvases.find(
    (canvas) =>
      canvas.width === WEDDING_ARCH_PIXEL_WIDTH &&
      canvas.height === WEDDING_ARCH_PIXEL_HEIGHT,
  );

  assert.ok(
    archCanvas,
    `se esperaba un canvas cacheado de ${WEDDING_ARCH_PIXEL_WIDTH}x${WEDDING_ARCH_PIXEL_HEIGHT} para el altar indexado`,
  );
});

test("la fuente cachea sprites DISTINTOS para mapas con palette.water distinto (mismo mapa, día vs amanecer)", () => {
  // axiom-plaza cambia a dawnPalette (con su propio water) cuando
  // state.flags.giftCodeSolved es true -- ver WorldScene.js, el bloque
  // que construye `map` a partir de `this.map.dawnPalette`. La clave de
  // cache de la fuente incluye waterColor precisamente para no compartir
  // el sprite rasterizado entre ambos casos.
  const dayScene = createAxiomPlazaScene();
  const dayContext = new FakeGameContext();
  dayScene.render(dayContext);

  const dawnScene = createAxiomPlazaScene();
  dawnScene.state.flags.giftCodeSolved = true;
  const dawnContext = new FakeGameContext();
  dawnScene.render(dawnContext);

  const fountainCanvases = createdCanvases.filter(
    (canvas) =>
      canvas.width === FOUNTAIN_PIXEL_WIDTH &&
      canvas.height === FOUNTAIN_PIXEL_HEIGHT,
  );

  assert.ok(
    fountainCanvases.length >= 2,
    "se esperaban al menos dos canvases cacheados de fuente (uno por color de agua distinto)",
  );

  const dayFountainImages = new Set(
    dayContext.drawImageCalls
      .filter(
        (call) =>
          call.image.width === FOUNTAIN_PIXEL_WIDTH &&
          call.image.height === FOUNTAIN_PIXEL_HEIGHT,
      )
      .map((call) => call.image),
  );
  const dawnFountainImages = new Set(
    dawnContext.drawImageCalls
      .filter(
        (call) =>
          call.image.width === FOUNTAIN_PIXEL_WIDTH &&
          call.image.height === FOUNTAIN_PIXEL_HEIGHT,
      )
      .map((call) => call.image),
  );

  assert.equal(dayFountainImages.size, 1);
  assert.equal(dawnFountainImages.size, 1);

  const [dayImage] = dayFountainImages;
  const [dawnImage] = dawnFountainImages;

  assert.notEqual(
    dayImage,
    dawnImage,
    "el sprite de fuente del mapa normal y el del mapa con dawnPalette deben ser canvases distintos, no el mismo reutilizado con el color de agua incorrecto",
  );
});
