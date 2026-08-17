import assert from "node:assert/strict";
import test from "node:test";
import { GameState } from "../../src/state/GameState.js";

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

function createAxiomPlazaScene() {
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
   * src/content/worldMaps.js. drawDecorativeBush() las cachea con clave
   * `bush:${width}:${height}` en un canvas de tamaño (width, height + 3),
   * así que deben producir DOS canvases de ancho 20 con alturas distintas
   * (23 y 27), no un único canvas reutilizado incorrectamente entre
   * ambas variantes de tamaño (lo que recortaría o deformaría una de las
   * dos). Comprobar esto contra el ancho/alto real de cada
   * FakeSpriteCanvas creado -- en vez de solo contar "más de un canvas
   * distinto" en todo el render -- es lo que aísla específicamente esta
   * variante, ya que axiom-plaza tiene de sobra otros tipos de prop que
   * por sí solos ya producirían más de un canvas.
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
