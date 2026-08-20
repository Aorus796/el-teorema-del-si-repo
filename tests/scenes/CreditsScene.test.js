import assert from "node:assert/strict";
import test from "node:test";
import {
  CreditsScene,
  CREDITS_STEP,
  PROTAGONIST_PALETTE,
  BRIDE_PALETTE,
  wrapTextToLines,
} from "../../src/scenes/CreditsScene.js";
import { SceneManager } from "../../src/core/SceneManager.js";
import { getWorldMap } from "../../src/content/worldMaps.js";
import { GameState } from "../../src/state/GameState.js";
import { COUPLE_DEDICATION } from "../../src/content/personalizationConfig.js";
import { ELENA_FRONT_PIXELS } from "../../src/content/elenaPixelArt.js";
import {
  MAX_PIXEL_PALETTE,
  MAX_SIDE_PIXELS,
} from "../../src/content/maxPixelArt.js";

const TITLE_TEXT = "EL TEOREMA DEL SÍ";
const CREDITS_LINE_1 = "CREADO CON CARIÑO";
const CREDITS_LINE_2 = "COMO REGALO DE BODA";
const CREDITS_LINE_3 = "GRACIAS POR JUGAR";
const FINAL_CARD_TEXT = "Pulsa para guardar y volver al menú";
const CLOSING_LINE =
  "No existe un sí para siempre. Existen dos personas que pueden volver a elegirse cada día.";

class FakeInput {
  constructor() {
    this.pressedActions = new Set();
  }

  press(action) {
    this.pressedActions.add(action);
  }

  wasPressed(action) {
    if (!this.pressedActions.has(action)) {
      return false;
    }

    this.pressedActions.delete(action);
    return true;
  }
}

class FakeUi {
  constructor() {
    this.closeAllCount = 0;
  }

  closeAll() {
    this.closeAllCount += 1;
  }
}

class FakeCanvasContext {
  constructor() {
    this.texts = [];
    this.fillRects = [];
  }

  fillRect(x, y, width, height) {
    this.fillRects.push({ x, y, width, height, fillStyle: this.fillStyle });
  }

  strokeRect() {}

  fillText(text, x, y) {
    this.texts.push({
      text: String(text),
      x,
      y,
      font: this.font,
      fillStyle: this.fillStyle,
      textAlign: this.textAlign,
    });
  }
}

test("CreditsScene puede registrarse como \"credits\" y activarse sin lanzar", () => {
  const scenes = new SceneManager();
  const scene = createScene().scene;

  scenes.register("credits", scene);

  assert.doesNotThrow(() => scenes.change("credits"));
});

test("entrar en credits llama a ui.closeAll() y comienza en el paso 1", () => {
  const { scene, ui } = createScene();

  scene.enter();

  assert.equal(ui.closeAllCount, 1);
  assert.equal(scene.step, CREDITS_STEP.CLOSING_SHOT);
});

test("se necesitan exactamente cuatro confirmaciones para alcanzar la tarjeta final", () => {
  const { scene, input } = createScene();
  scene.enter();

  for (let i = 0; i < 3; i += 1) {
    press(scene, input);
    assert.notEqual(
      scene.step,
      CREDITS_STEP.FINAL_CARD,
      `no debe alcanzar la tarjeta final tras ${i + 1} confirmaciones`,
    );
  }

  press(scene, input);
  assert.equal(scene.step, CREDITS_STEP.FINAL_CARD);
});

test("cada confirmación avanza exactamente un paso, nunca dos", () => {
  const { scene, input } = createScene();
  scene.enter();

  const order = [
    CREDITS_STEP.CLOSING_SHOT,
    CREDITS_STEP.TITLE,
    CREDITS_STEP.DEDICATION,
    CREDITS_STEP.CREDITS,
    CREDITS_STEP.FINAL_CARD,
  ];

  for (let i = 0; i < order.length; i += 1) {
    assert.equal(scene.step, order[i]);

    if (i < order.length - 1) {
      press(scene, input);
    }
  }
});

test("los cinco pasos renderizan, en orden, los textos exactos de la sección 12", () => {
  const { scene, input } = createScene();
  scene.enter();

  const step1 = new FakeCanvasContext();
  scene.render(step1);
  assert.ok(step1.texts.some((entry) => textIncludesClosingLine(step1)));

  press(scene, input);
  const step2 = new FakeCanvasContext();
  scene.render(step2);
  assert.ok(step2.texts.some((entry) => entry.text === TITLE_TEXT));

  press(scene, input);
  const step3 = new FakeCanvasContext();
  scene.render(step3);
  assert.ok(textIncludesDedication(step3));

  press(scene, input);
  const step4 = new FakeCanvasContext();
  scene.render(step4);
  assert.ok(step4.texts.some((entry) => entry.text === CREDITS_LINE_1));
  assert.ok(step4.texts.some((entry) => entry.text === CREDITS_LINE_2));
  assert.ok(step4.texts.some((entry) => entry.text === CREDITS_LINE_3));

  press(scene, input);
  const step5 = new FakeCanvasContext();
  scene.render(step5);
  assert.ok(step5.texts.some((entry) => entry.text === FINAL_CARD_TEXT));
});

test("el bloque de créditos mantiene un salto claramente mayor antes de GRACIAS POR JUGAR (línea en blanco)", () => {
  const { scene, input } = createScene();
  scene.enter();
  press(scene, input);
  press(scene, input);
  press(scene, input);

  const context = new FakeCanvasContext();
  scene.render(context);

  const line1 = context.texts.find((entry) => entry.text === CREDITS_LINE_1);
  const line2 = context.texts.find((entry) => entry.text === CREDITS_LINE_2);
  const line3 = context.texts.find((entry) => entry.text === CREDITS_LINE_3);
  const gapBefore = line2.y - line1.y;
  const gapAfterBlank = line3.y - line2.y;

  assert.ok(gapAfterBlank > gapBefore);
});

test("wrapTextToLines envuelve la frase de cierre en líneas dentro del límite indicado", () => {
  const lines = wrapTextToLines(CLOSING_LINE, 48);

  assert.ok(lines.length >= 1);
  for (const line of lines) {
    assert.ok(line.length <= 48, `línea demasiado larga: "${line}"`);
  }
  assert.equal(lines.join(" "), CLOSING_LINE);
});

test("wrapTextToLines envuelve la dedicatoria aprobada en líneas dentro del límite indicado", () => {
  const lines = wrapTextToLines(COUPLE_DEDICATION, 44);

  assert.ok(lines.length > 1, "la dedicatoria real es más larga que una sola línea");
  for (const line of lines) {
    assert.ok(line.length <= 44, `línea demasiado larga: "${line}"`);
  }
  assert.equal(lines.join(" "), COUPLE_DEDICATION);
});

test("el paso 1 dibuja dos personajes con las paletas reutilizadas del jugador y la novia, sobre el amanecer de axiom-plaza", () => {
  const { scene } = createScene();
  scene.enter();

  const context = new FakeCanvasContext();
  scene.render(context);

  const dawnPalette = getWorldMap("axiom-plaza").dawnPalette;
  const fillStyles = context.fillRects.map((rect) => rect.fillStyle);

  assert.ok(fillStyles.includes(dawnPalette.groundA));
  assert.ok(fillStyles.includes(dawnPalette.groundB));
  assert.ok(fillStyles.includes(PROTAGONIST_PALETTE.silhouette));
  assert.ok(fillStyles.includes(PROTAGONIST_PALETTE.head));
  assert.ok(fillStyles.includes(PROTAGONIST_PALETTE.body));
  assert.ok(fillStyles.includes(BRIDE_PALETTE.silhouette));
  assert.ok(fillStyles.includes(BRIDE_PALETTE.body));
  assert.ok(fillStyles.includes(PROTAGONIST_PALETTE.hair));
  assert.ok(fillStyles.includes(BRIDE_PALETTE.hair));
  assert.ok(fillStyles.includes(PROTAGONIST_PALETTE.bodyAccent));
  assert.ok(fillStyles.includes(BRIDE_PALETTE.bodyAccent));
});

test("el paso 1 dibuja el pelo, la cabeza, los brazos y el cuerpo de Gonzalo en las posiciones geométricas esperadas, y las mismas zonas de Elena con la cantidad de píxeles que declara ElenaRenderer", () => {
  const { scene } = createScene();
  scene.enter();

  const context = new FakeCanvasContext();
  scene.render(context);

  const byColor = (color) =>
    context.fillRects.filter((rect) => rect.fillStyle === color);

  assert.deepEqual(byColor(PROTAGONIST_PALETTE.hair), [
    { x: 211, y: 189, width: 8, height: 2, fillStyle: PROTAGONIST_PALETTE.hair },
    { x: 218, y: 191, width: 2, height: 3, fillStyle: PROTAGONIST_PALETTE.hair },
  ]);

  // PROTAGONIST_PALETTE.head y BRIDE_PALETTE.head son literalmente el
  // mismo valor (SKIN_TONE compartido). Gonzalo sigue con el renderer
  // geométrico antiguo (rects grandes, width/height > 1); Elena ahora usa
  // ElenaRenderer, que rasteriza píxel a píxel (rects 1x1) -- así que se
  // separan por tamaño de rect en vez de por posición exacta.
  assert.equal(PROTAGONIST_PALETTE.head, BRIDE_PALETTE.head);
  const headRects = byColor(PROTAGONIST_PALETTE.head);
  const gonzaloHeadRects = headRects.filter(
    (rect) => rect.width > 1 || rect.height > 1,
  );
  const elenaSkinPixels = headRects.filter(
    (rect) => rect.width === 1 && rect.height === 1,
  );

  assert.deepEqual(gonzaloHeadRects, [
    { x: 211, y: 191, width: 8, height: 6, fillStyle: PROTAGONIST_PALETTE.head },
    { x: 209, y: 198, width: 2, height: 6, fillStyle: PROTAGONIST_PALETTE.head },
    { x: 219, y: 198, width: 2, height: 6, fillStyle: PROTAGONIST_PALETTE.head },
  ]);
  assert.equal(
    elenaSkinPixels.length,
    countSymbolInPixels(ELENA_FRONT_PIXELS, "k"),
    "la cantidad de píxeles de piel de Elena debe coincidir con el símbolo 'k' de ELENA_FRONT_PIXELS",
  );

  assert.deepEqual(byColor(PROTAGONIST_PALETTE.body), [
    { x: 211, y: 198, width: 8, height: 6, fillStyle: PROTAGONIST_PALETTE.body },
  ]);
  assert.deepEqual(byColor(PROTAGONIST_PALETTE.bodyAccent), [
    { x: 212, y: 205, width: 2, height: 5, fillStyle: PROTAGONIST_PALETTE.bodyAccent },
    { x: 216, y: 205, width: 2, height: 5, fillStyle: PROTAGONIST_PALETTE.bodyAccent },
  ]);

  // Elena: BRIDE_PALETTE.hair/.body/.bodyAccent no colisionan con ningún
  // color de Gonzalo, así que estos rects son exclusivamente suyos. Todos
  // deben ser 1x1 (ElenaRenderer), y su cantidad debe coincidir con el
  // símbolo correspondiente en ELENA_FRONT_PIXELS ("d"=pelo, "b"=vestido
  // medio, "L"=vestido claro/cintura -- ver elenaPixelArt.js).
  const elenaHairRects = byColor(BRIDE_PALETTE.hair);
  assert.equal(
    elenaHairRects.length,
    countSymbolInPixels(ELENA_FRONT_PIXELS, "d"),
  );
  assert.ok(elenaHairRects.every((rect) => rect.width === 1 && rect.height === 1));

  const elenaBodyRects = byColor(BRIDE_PALETTE.body);
  assert.equal(
    elenaBodyRects.length,
    countSymbolInPixels(ELENA_FRONT_PIXELS, "b"),
  );
  assert.ok(elenaBodyRects.every((rect) => rect.width === 1 && rect.height === 1));

  const elenaBodyAccentRects = byColor(BRIDE_PALETTE.bodyAccent);
  assert.equal(
    elenaBodyAccentRects.length,
    countSymbolInPixels(ELENA_FRONT_PIXELS, "L"),
  );
  assert.ok(
    elenaBodyAccentRects.every((rect) => rect.width === 1 && rect.height === 1),
  );
});

test("el paso 1 dibuja el contorno de Gonzalo como varias piezas estrechas, no como un bloque de fondo grande", () => {
  const { scene } = createScene();
  scene.enter();

  const context = new FakeCanvasContext();
  scene.render(context);

  const silhouetteRects = context.fillRects.filter(
    (rect) => rect.fillStyle === PROTAGONIST_PALETTE.silhouette,
  );

  assert.ok(
    silhouetteRects.length >= 2,
    `el contorno debe tener varias piezas, no un único rectángulo de fondo (encontradas: ${silhouetteRects.length})`,
  );

  const widths = silhouetteRects.map((rect) => rect.width);
  assert.ok(
    Math.min(...widths) < Math.max(...widths),
    "las piezas de contorno deben variar de ancho (más estrechas donde el cuerpo es más estrecho), no ser todas iguales a un único ancho de fondo",
  );
});

test("el paso 1 dibuja el contorno de Elena píxel a píxel con ElenaRenderer (no el bloque geométrico antiguo de BRIDE_PALETTE)", () => {
  const { scene } = createScene();
  scene.enter();

  const context = new FakeCanvasContext();
  scene.render(context);

  const silhouetteRects = context.fillRects.filter(
    (rect) => rect.fillStyle === BRIDE_PALETTE.silhouette,
  );

  // El renderer geométrico antiguo dibujaba el contorno de Elena en solo 2
  // rects grandes (12x17 y 10x3). ElenaRenderer rasteriza un fillRect 1x1
  // por símbolo "O" de ELENA_FRONT_PIXELS: la cantidad exacta y el tamaño
  // uniforme 1x1 son la prueba de que ya no se usa el renderer antiguo.
  assert.equal(
    silhouetteRects.length,
    countSymbolInPixels(ELENA_FRONT_PIXELS, "O"),
  );
  assert.ok(
    silhouetteRects.every((rect) => rect.width === 1 && rect.height === 1),
    "ElenaRenderer dibuja el contorno píxel a píxel (1x1), no como bloques grandes",
  );
});

test("el paso 1 dibuja a Max junto a Gonzalo y Elena con un color de MAX_PIXEL_PALETTE", () => {
  const { scene } = createScene();
  scene.enter();

  const context = new FakeCanvasContext();
  scene.render(context);

  const allowedMaxColors = new Set(Object.values(MAX_PIXEL_PALETTE));
  const maxRects = context.fillRects.filter((rect) =>
    allowedMaxColors.has(rect.fillStyle),
  );

  assert.ok(
    maxRects.length > 0,
    "el paso 1 debe dibujar al menos un rectángulo con un color de MAX_PIXEL_PALETTE",
  );

  // renderClosingShot() invoca renderMax(context, 180, 190); Max
  // Character Pixel-Art migró renderMax() a un sprite indexado
  // rasterizado píxel a píxel (un fillRect 1x1 por símbolo no
  // transparente de MAX_SIDE_PIXELS), así que se ancla a un pixel
  // concreto de la nariz (fila 7, columna 0 de MAX_SIDE_PIXELS = "O")
  // en vez de a un rect grande de posición fija -- mismo patrón que los
  // tests de anclaje ya usados para Elena/Corolaria/Padre/Silogio.
  assert.equal(MAX_SIDE_PIXELS[7][0], "O");

  const noseVisible = context.fillRects.some(
    (rect) =>
      rect.fillStyle === MAX_PIXEL_PALETTE.O &&
      rect.x === 180 &&
      rect.y === 197 &&
      rect.width === 1 &&
      rect.height === 1,
  );

  assert.equal(noseVisible, true);
});

test("ningún texto renderizado cae fuera del canvas de 480x270 ni de sus márgenes", () => {
  const { scene, input } = createScene();
  scene.enter();

  for (let i = 0; i < 5; i += 1) {
    const context = new FakeCanvasContext();
    scene.render(context);

    for (const entry of context.texts) {
      assert.ok(entry.x >= 20 && entry.x <= 460, `x fuera de margen: ${entry.x}`);
      assert.ok(entry.y >= 0 && entry.y <= 270, `y fuera de canvas: ${entry.y}`);
    }

    if (i < 4) {
      press(scene, input);
    }
  }
});

test("Escape no cambia de paso en ningún punto de la secuencia", () => {
  const { scene, input } = createScene();
  scene.enter();

  for (let i = 0; i < 5; i += 1) {
    const stepBefore = scene.step;
    input.press("cancel");
    scene.update();

    assert.equal(scene.step, stepBefore);

    if (i < 4) {
      press(scene, input);
    }
  }
});

test("confirmar la tarjeta final varias veces tras un guardado exitoso no corrompe el estado ni repite efectos", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage();
  const { scene, input } = createScene({ state, storage });

  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);

  const stateAfterFirst = structuredClone(state.toSaveData());
  delete stateAfterFirst.savedAt;

  scene.confirmFinalCard();

  const stateAfterSecond = structuredClone(state.toSaveData());
  delete stateAfterSecond.savedAt;

  assert.deepEqual(stateAfterSecond, stateAfterFirst);
});

test("CreditsScene recibe state, storage y scenes para la transición terminal, pero nunca audio", () => {
  const { scene } = createScene();

  assert.equal(Object.hasOwn(scene, "audio"), false);
  assert.equal(Object.hasOwn(scene, "state"), true);
  assert.equal(Object.hasOwn(scene, "storage"), true);
  assert.equal(Object.hasOwn(scene, "scenes"), true);
});

test("confirmar la tarjeta final invoca confirmFinalCard exactamente una vez por pulsación y permanece en la tarjeta", () => {
  const { scene, input } = createScene();
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }

  let calls = 0;
  scene.confirmFinalCard = () => {
    calls += 1;
  };

  press(scene, input);
  assert.equal(calls, 1);
  assert.equal(scene.step, CREDITS_STEP.FINAL_CARD);

  press(scene, input);
  assert.equal(calls, 2);
  assert.equal(scene.step, CREDITS_STEP.FINAL_CARD);

  press(scene, input);
  assert.equal(calls, 3);
  assert.equal(scene.step, CREDITS_STEP.FINAL_CARD);
});

test("confirmar la tarjeta final con guardado exitoso prepara el estado terminal completo", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;
  state.flags.epilogueCompleted = false;
  state.objectiveId = "epilogue-meet-bride";
  state.world.currentMapId = "axiom-plaza";
  state.setPlayerState({ x: 300, y: 250, facing: "up" }, "axiom-plaza");

  const storage = new FakeStorage();
  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }

  press(scene, input);

  assert.equal(state.flags.epilogueCompleted, true);
  assert.equal(state.flags.giftCodeSolved, true);
  assert.equal(state.flags.epilogueStarted, true);
  assert.equal(state.flags.epilogueUnlocked, true);
  assert.equal(state.flags.investigationComplete, true);
  assert.equal(state.objectiveId, "epilogue-completed");
  assert.equal(state.scene, "world");
  assert.equal(state.world.currentMapId, "axiom-plaza");
  assert.deepEqual(state.player, state.world.playerByMap["axiom-plaza"]);
});

test("el guardado exitoso contiene los cuatro campos terminales exactos", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage();
  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);

  assert.ok(storage.savedData);
  assert.equal(storage.savedData.flags.epilogueCompleted, true);
  assert.equal(storage.savedData.scene, "world");
  assert.equal(storage.savedData.world.currentMapId, "axiom-plaza");
  assert.equal(storage.savedData.objectiveId, "epilogue-completed");
});

test("confirmar con éxito cambia a title exactamente una vez, después de guardar", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const callOrder = [];
  const storage = new FakeStorage();
  const originalSave = storage.save.bind(storage);
  storage.save = (data) => {
    callOrder.push("save");
    originalSave(data);
  };
  const scenes = new FakeScenes();
  const originalChange = scenes.change.bind(scenes);
  scenes.change = (name, payload) => {
    callOrder.push("change");
    originalChange(name, payload);
  };

  const { scene, input } = createScene({ state, storage, scenes });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);

  assert.deepEqual(callOrder, ["save", "change"]);
  assert.deepEqual(scenes.changes, [{ name: "title", payload: undefined }]);
});

test("un fallo de guardado no propaga, mantiene la escena en FINAL_CARD y no cambia de escena", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage({ saveError: new Error("disco lleno") });
  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }

  assert.doesNotThrow(() => press(scene, input));

  assert.equal(scene.step, CREDITS_STEP.FINAL_CARD);
  assert.equal(scene.saveFailed, true);
});

test("tras un fallo, el render muestra el mensaje exacto junto al texto principal de la tarjeta final", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage({ saveError: new Error("fallo") });
  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);

  const context = new FakeCanvasContext();
  scene.render(context);
  const texts = context.texts.map((entry) => entry.text);

  assert.ok(texts.includes(FINAL_CARD_TEXT));
  assert.ok(texts.includes("No se pudo guardar el final. Vuelve a intentarlo."));
});

test("el guardado previo permanece intacto tras un intento fallido", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage({ saveError: new Error("fallo") });
  storage.savedData = { previous: "guardado anterior" };
  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);

  assert.deepEqual(storage.savedData, { previous: "guardado anterior" });
});

test("dos fallos consecutivos mantienen la escena estable, sin duplicar la preparación en memoria", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage({ saveError: new Error("fallo") });
  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }

  let prepareCalls = 0;
  const originalPrepare = scene.prepareTerminalState.bind(scene);
  scene.prepareTerminalState = () => {
    prepareCalls += 1;
    originalPrepare();
  };

  press(scene, input);
  press(scene, input);

  assert.equal(scene.step, CREDITS_STEP.FINAL_CARD);
  assert.equal(scene.saveFailed, true);
  assert.equal(
    prepareCalls,
    1,
    "prepareTerminalState debe ejecutarse en el primer intento fallido (pone epilogueCompleted=true) y no repetirse en el segundo, así que dos intentos fallidos consecutivos producen una sola llamada, no dos",
  );
});

test("un reintento exitoso tras un fallo completa la transición", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage({ saveError: new Error("fallo") });
  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);
  assert.equal(scene.saveFailed, true);

  storage.saveError = null;
  press(scene, input);

  assert.equal(scene.saveFailed, false);
  assert.deepEqual(scene.scenes.changes, [{ name: "title", payload: undefined }]);
  assert.ok(storage.savedData);
});

test("prepareTerminalState no modifica ninguna otra bandera del epílogo", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const { scene } = createScene({ state });
  scene.prepareTerminalState();

  assert.equal(state.flags.investigationComplete, true);
  assert.equal(state.flags.epilogueUnlocked, true);
  assert.equal(state.flags.epilogueStarted, true);
  assert.equal(state.flags.giftCodeSolved, true);
});

test("prepareTerminalState mantiene idénticos state.player y world.playerByMap[axiom-plaza]", () => {
  const state = new GameState();
  state.world.currentMapId = "axiom-plaza";
  state.setPlayerState({ x: 111, y: 222, facing: "left" }, "axiom-plaza");

  const { scene } = createScene({ state });
  scene.prepareTerminalState();

  assert.deepEqual(state.player, state.world.playerByMap["axiom-plaza"]);
});

test("el mensaje de error nunca aparece en los pasos 1 a 4", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage({ saveError: new Error("fallo") });
  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);
  assert.equal(scene.saveFailed, true);

  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    const context = new FakeCanvasContext();
    scene.render(context);
    const texts = context.texts.map((entry) => entry.text);
    assert.equal(
      texts.includes("No se pudo guardar el final. Vuelve a intentarlo."),
      false,
    );
    press(scene, input);
  }
});

test("ningún texto renderizado contiene la sintaxis literal de un marcador sin resolver", () => {
  const { scene, input } = createScene();
  scene.enter();

  const allTexts = [];
  for (let i = 0; i < 5; i += 1) {
    const context = new FakeCanvasContext();
    scene.render(context);
    allTexts.push(...context.texts.map((entry) => entry.text));

    if (i < 4) {
      press(scene, input);
    }
  }

  const joined = allTexts.join(" ");
  assert.equal(joined.includes("{{FINAL_DEDICATION}}"), false);
  assert.equal(/\{\{[A-Z_]+\}\}/.test(joined), false);
});

test("los nombres de la pareja solo aparecen en el paso de dedicatoria, no en los otros cuatro pasos", () => {
  const { scene, input } = createScene();
  scene.enter();

  const stepTexts = [];
  for (let i = 0; i < 5; i += 1) {
    const context = new FakeCanvasContext();
    scene.render(context);
    stepTexts.push(context.texts.map((entry) => entry.text).join(" "));

    if (i < 4) {
      press(scene, input);
    }
  }

  const [closingShot, title, dedication, credits, finalCard] = stepTexts;

  assert.ok(dedication.includes("Gonzalo") && dedication.includes("Elena"));
  for (const step of [closingShot, title, credits, finalCard]) {
    assert.equal(step.includes("Gonzalo"), false);
    assert.equal(step.includes("Elena"), false);
  }
});

test("tras un guardado exitoso, confirmaciones adicionales no vuelven a llamar a storage.save()", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage();
  let saveCalls = 0;
  const originalSave = storage.save.bind(storage);
  storage.save = (data) => {
    saveCalls += 1;
    originalSave(data);
  };

  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);

  assert.equal(saveCalls, 1);

  scene.confirmFinalCard();
  scene.confirmFinalCard();

  assert.equal(saveCalls, 1);
});

test("tras un guardado exitoso, confirmaciones adicionales no añaden más cambios de escena ni modifican el estado", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage();
  const scenes = new FakeScenes();
  const { scene, input } = createScene({ state, storage, scenes });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);

  const stateAfterFirst = structuredClone(state.toSaveData());
  delete stateAfterFirst.savedAt;

  scene.confirmFinalCard();
  scene.confirmFinalCard();

  const stateAfterMore = structuredClone(state.toSaveData());
  delete stateAfterMore.savedAt;

  assert.deepEqual(scenes.changes, [{ name: "title", payload: undefined }]);
  assert.deepEqual(stateAfterMore, stateAfterFirst);
});

test("un fallo de guardado mantiene transitionCompleted en false", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage({ saveError: new Error("fallo") });
  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);

  assert.equal(scene.transitionCompleted, false);
});

test("un fallo seguido de éxito realiza exactamente dos intentos de guardado y un único cambio a title", () => {
  const state = new GameState();
  state.flags.investigationComplete = true;
  state.flags.epilogueUnlocked = true;
  state.flags.epilogueStarted = true;
  state.flags.giftCodeSolved = true;

  const storage = new FakeStorage({ saveError: new Error("fallo") });
  let saveCalls = 0;
  const originalSave = storage.save.bind(storage);
  storage.save = (data) => {
    saveCalls += 1;
    originalSave(data);
  };

  const { scene, input } = createScene({ state, storage });
  scene.enter();
  for (let i = 0; i < 4; i += 1) {
    press(scene, input);
  }
  press(scene, input);
  assert.equal(saveCalls, 1);
  assert.equal(scene.transitionCompleted, false);

  storage.saveError = null;
  press(scene, input);

  assert.equal(saveCalls, 2);
  assert.equal(scene.transitionCompleted, true);
  assert.deepEqual(scene.scenes.changes, [{ name: "title", payload: undefined }]);
});

test("prepareTerminalState conserva exactamente una posición válida ya existente de axiom-plaza", () => {
  const state = new GameState();
  state.setPlayerState({ x: 300, y: 210, facing: "left" }, "axiom-plaza");

  const { scene } = createScene({ state });
  scene.prepareTerminalState();

  assert.deepEqual(state.player, { x: 300, y: 210, facing: "left" });
  assert.deepEqual(state.world.playerByMap["axiom-plaza"], {
    x: 300,
    y: 210,
    facing: "left",
  });
});

test("prepareTerminalState no copia a axiom-plaza la posición de otro mapa que estuviera activo", () => {
  const state = new GameState();
  state.setPlayerState({ x: 700, y: 460, facing: "up" }, "axiom-plaza");
  state.changeMap("library");
  state.setPlayerState({ x: 999, y: 888, facing: "down" }, "library");

  const { scene } = createScene({ state });
  scene.prepareTerminalState();

  assert.deepEqual(state.world.playerByMap["axiom-plaza"], {
    x: 700,
    y: 460,
    facing: "up",
  });
  assert.deepEqual(state.player, { x: 700, y: 460, facing: "up" });
  assert.deepEqual(state.world.playerByMap.library, {
    x: 999,
    y: 888,
    facing: "down",
  });
});

test("prepareTerminalState usa el spawn seguro si la posición en vivo y la guardada de axiom-plaza están corruptas", () => {
  const state = new GameState();
  state.player = {
    x: Number.NaN,
    y: Number.NaN,
    facing: "no-es-una-orientacion",
  };
  state.world.playerByMap["axiom-plaza"] = {
    x: Number.NaN,
    y: Number.NaN,
    facing: "no-es-una-orientacion",
  };

  const { scene } = createScene({ state });
  scene.prepareTerminalState();

  assert.deepEqual(state.player, { x: 240, y: 192, facing: "up" });
  assert.deepEqual(state.world.playerByMap["axiom-plaza"], {
    x: 240,
    y: 192,
    facing: "up",
  });
});

test("prepareTerminalState no altera las posiciones guardadas de archive ni seven-bridges-walk", () => {
  const state = new GameState();
  const archiveBefore = { ...state.world.playerByMap.archive };
  const sevenBridgesBefore = {
    ...state.world.playerByMap["seven-bridges-walk"],
  };

  const { scene } = createScene({ state });
  scene.prepareTerminalState();

  assert.deepEqual(state.world.playerByMap.archive, archiveBefore);
  assert.deepEqual(
    state.world.playerByMap["seven-bridges-walk"],
    sevenBridgesBefore,
  );
});

test("prepareTerminalState deja idénticos state.player y world.playerByMap[axiom-plaza]", () => {
  const state = new GameState();

  const { scene } = createScene({ state });
  scene.prepareTerminalState();

  assert.deepEqual(state.player, state.world.playerByMap["axiom-plaza"]);
});

test("prepareTerminalState sigue siendo idempotente tras el fix de posición", () => {
  const state = new GameState();
  state.setPlayerState({ x: 400, y: 260, facing: "down" }, "axiom-plaza");

  const { scene } = createScene({ state });
  scene.prepareTerminalState();
  const afterFirst = structuredClone(state.toSaveData());
  delete afterFirst.savedAt;

  scene.prepareTerminalState();
  const afterSecond = structuredClone(state.toSaveData());
  delete afterSecond.savedAt;

  assert.deepEqual(afterSecond, afterFirst);
});

function countSymbolInPixels(pixels, symbol) {
  return pixels.join("").split("").filter((char) => char === symbol).length;
}

function textIncludesClosingLine(context) {
  const joined = context.texts.map((entry) => entry.text).join(" ");
  return CLOSING_LINE.split(" ").every((word) => joined.includes(word));
}

function textIncludesDedication(context) {
  const joined = context.texts.map((entry) => entry.text).join(" ");
  return COUPLE_DEDICATION.split(" ").every((word) => joined.includes(word));
}

function createScene({ state, storage, scenes } = {}) {
  const input = new FakeInput();
  const ui = new FakeUi();

  return {
    input,
    ui,
    scene: new CreditsScene({
      input,
      ui,
      state: state ?? new GameState(),
      storage: storage ?? new FakeStorage(),
      scenes: scenes ?? new FakeScenes(),
    }),
  };
}

class FakeStorage {
  constructor({ saveError = null } = {}) {
    this.saveError = saveError;
    this.savedData = null;
  }

  save(data) {
    if (this.saveError) {
      throw this.saveError;
    }

    this.savedData = data;
  }
}

class FakeScenes {
  constructor() {
    this.changes = [];
  }

  change(name, payload) {
    this.changes.push({ name, payload });
  }
}

function press(scene, input) {
  input.press("interact");
  scene.update();
}
