import test from "node:test";
import assert from "node:assert/strict";
import { P2BridgesScene } from "../../src/scenes/P2BridgesScene.js";
import { P2Puzzle } from "../../src/puzzles/p2-bridges/P2Puzzle.js";
import { P2_PHASE, P2State } from "../../src/puzzles/p2-bridges/P2State.js";
import { P2_VALIDATION_CODE } from "../../src/puzzles/p2-bridges/P2Validator.js";
import { PUZZLE_SUCCESS_SFX_PATH } from "../../src/content/sfxAudioConfig.js";
import { GameState } from "../../src/state/GameState.js";

const INCOMPLETE_ROUTE_MESSAGE =
  "Te has quedado sin puentes disponibles antes de cruzarlos todos. Pulsa R para reiniciar.";
const INVALID_END_MESSAGE =
  "Cruzaste todos los puentes, pero no terminaste en el lugar correcto. Pulsa R para reiniciar.";
const RESTART_MESSAGE =
  "Intento reiniciado. Puedes cambiar el puente cerrado.";

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

class FakeScenes {
  constructor() {
    this.changes = [];
  }

  change(name, payload = {}) {
    this.changes.push({ name, payload });
  }
}

class FakeUi {
  constructor() {
    this.closeAllCount = 0;
    this.toasts = [];
  }

  closeAll() {
    this.closeAllCount += 1;
  }

  showToast(text) {
    this.toasts.push(text);
  }
}

class FakeAudioService {
  constructor() {
    this.playSfxCalls = [];
  }

  playSfx(src) {
    this.playSfxCalls.push(src);
  }
}

class FakeCanvasContext {
  constructor() {
    this.texts = [];
  }

  fillRect() {}

  strokeRect() {}

  fillText(text) {
    this.texts.push(String(text));
  }

  beginPath() {}

  moveTo() {}

  lineTo() {}

  stroke() {}

  arc() {}

  fill() {}

  setLineDash() {}
}

/*
 * Recorrido completo real (cerrando B6 y cruzando N, R, E, M, R, L, en ese
 * orden) que resuelve el puzle -- el mismo recorrido principal ya cubierto
 * a nivel de puzle puro en tests/puzzles/P2Puzzle.test.js
 * ("resuelve el recorrido principal completo"). Cada paso se expresa como
 * el número de veces que hay que pulsar moveRight para desplazar el
 * cursor de movimiento disponible hasta el destino deseado antes de
 * confirmar con selectPuzzleOption -- derivado directamente del orden real
 * de P2Puzzle.getAvailableMoves() (que sigue el orden de P2_GRAPH.bridges)
 * en cada paso de este recorrido concreto, no inventado. El puente cerrado
 * (B6) es el sexto de P2_GRAPH.bridges, así que planificar requiere cinco
 * moveRight antes de seleccionarlo.
 *
 * El tercer paso necesita dos moveRight: al llegar a la Isla del Reloj la
 * primera salida disponible es B2 (R-L), que arruina el recorrido. Resolver
 * el puzle exige mover el cursor, no confirmar sin mirar.
 */
const SOLVING_ROUTE_MOVE_RIGHT_COUNTS = [0, 0, 2, 0, 0, 0];

/*
 * Recorrido que termina en un callejón sin salida (cerrando B2, el puente
 * R-L, y cruzando N, R, M, E, R), el mismo caso ya cubierto a nivel de
 * puzle puro en tests/puzzles/P2Puzzle.test.js ("detecta un callejon sin
 * salida con un puente incorrecto", allí con el cierre simétrico B7). El
 * puente cerrado (B2) es el segundo de P2_GRAPH.bridges, así que planificar
 * requiere un moveRight antes de seleccionarlo.
 */
const DEAD_END_MOVE_RIGHT_COUNTS = [0, 0, 0, 0, 0];

function solvePuzzleWithRealControls(scene, input) {
  for (let i = 0; i < 5; i += 1) {
    press(scene, input, "moveRight"); // resalta B6
  }

  press(scene, input, "selectPuzzleOption"); // cierra B6
  press(scene, input, "startPuzzleAttempt");

  for (const moveRightCount of SOLVING_ROUTE_MOVE_RIGHT_COUNTS) {
    for (let i = 0; i < moveRightCount; i += 1) {
      press(scene, input, "moveRight");
    }

    press(scene, input, "selectPuzzleOption");
  }
}

function driveToDeadEndWithRealControls(scene, input) {
  press(scene, input, "moveRight"); // resalta B2
  press(scene, input, "selectPuzzleOption"); // cierra B2
  press(scene, input, "startPuzzleAttempt");

  for (const moveRightCount of DEAD_END_MOVE_RIGHT_COUNTS) {
    for (let i = 0; i < moveRightCount; i += 1) {
      press(scene, input, "moveRight");
    }

    press(scene, input, "selectPuzzleOption");
  }
}

/*
 * Recorrido que agota los seis puentes abiertos (cerrando B1 y cruzando
 * R, N, L, R, M, E) pero termina en E en vez de L, el mismo caso
 * verificado a nivel de puzle puro en tests/puzzles/P2Puzzle.test.js
 * ("detecta un recorrido completo que termina fuera del lugar
 * correcto"). El puente cerrado (B1) es el primero de P2_GRAPH.bridges,
 * así que ya está resaltado al entrar y no hace falta ningún moveRight.
 */
const INVALID_END_MOVE_RIGHT_COUNTS = [1, 1, 0, 0, 0, 0];

function driveToInvalidEndWithRealControls(scene, input) {
  press(scene, input, "selectPuzzleOption"); // cierra B1 (ya resaltado)
  press(scene, input, "startPuzzleAttempt");

  for (const moveRightCount of INVALID_END_MOVE_RIGHT_COUNTS) {
    for (let i = 0; i < moveRightCount; i += 1) {
      press(scene, input, "moveRight");
    }

    press(scene, input, "selectPuzzleOption");
  }
}

function buildFailedP2SaveData({ closedBridgeId, route }) {
  const puzzle = new P2Puzzle();

  puzzle.selectClosedBridge(closedBridgeId);
  puzzle.startTraversal();

  let result;

  for (const nodeId of route) {
    result = puzzle.moveTo(nodeId);
  }

  assert.equal(puzzle.state.phase, P2_PHASE.FAILED);

  return { saveData: puzzle.toSaveData(), lastResult: result };
}

function buildSolvedP2SaveData() {
  const puzzle = new P2Puzzle();

  puzzle.selectClosedBridge("B6");
  puzzle.startTraversal();

  for (const nodeId of ["N", "R", "E", "M", "R", "L"]) {
    puzzle.moveTo(nodeId);
  }

  assert.equal(puzzle.state.phase, P2_PHASE.SOLVED);

  return puzzle.toSaveData();
}

test("resolver el recorrido correctamente dispara playSfx(PUZZLE_SUCCESS_SFX_PATH) exactamente una vez", () => {
  const { scene, input, audio } = createScene();
  scene.enter();

  solvePuzzleWithRealControls(scene, input);

  assert.equal(scene.puzzle.state.phase, P2_PHASE.SOLVED);
  assert.deepEqual(audio.playSfxCalls, [PUZZLE_SUCCESS_SFX_PATH]);
});

test("un movimiento que no completa el recorrido no dispara ningún SFX", () => {
  const { scene, input, audio } = createScene();
  scene.enter();

  press(scene, input, "selectPuzzleOption");
  press(scene, input, "startPuzzleAttempt");
  press(scene, input, "selectPuzzleOption");

  assert.equal(scene.puzzle.state.phase, P2_PHASE.TRAVERSING);
  assert.deepEqual(audio.playSfxCalls, []);
});

test("un recorrido que termina en callejón sin salida no dispara ningún SFX", () => {
  const { scene, input, audio } = createScene();
  scene.enter();

  driveToDeadEndWithRealControls(scene, input);

  assert.equal(scene.puzzle.state.phase, P2_PHASE.FAILED);
  assert.deepEqual(audio.playSfxCalls, []);
});

test("un callejón sin salida por agotar puentes muestra el mensaje de puentes agotados", () => {
  const { scene, input } = createScene();
  scene.enter();

  driveToDeadEndWithRealControls(scene, input);

  assert.equal(scene.puzzle.state.phase, P2_PHASE.FAILED);
  assert.equal(
    scene.puzzle.state.failureCode,
    P2_VALIDATION_CODE.INCOMPLETE_ROUTE,
  );
  assert.equal(scene.statusMessage, INCOMPLETE_ROUTE_MESSAGE);
});

test("leer una pista tras fallar y luego reiniciar limpia la pista y muestra el mensaje de reinicio", () => {
  const { scene, input } = createScene();
  scene.enter();

  driveToDeadEndWithRealControls(scene, input);
  assert.equal(scene.puzzle.state.phase, P2_PHASE.FAILED);

  press(scene, input, "nextPuzzleHint");
  assert.equal(scene.visibleHintLevel, 1);

  press(scene, input, "restartPuzzleAttempt");

  assert.equal(scene.visibleHintLevel, null);
  assert.equal(scene.statusMessage, RESTART_MESSAGE);
});

test("leer una pista en PLANNING y mover el cursor de puente limpia la pista", () => {
  const { scene, input } = createScene();
  scene.enter();

  press(scene, input, "nextPuzzleHint");
  assert.equal(scene.visibleHintLevel, 1);

  press(scene, input, "moveRight");

  assert.equal(scene.visibleHintLevel, null);
  assert.equal(scene.statusMessage, "Seleccionado B2.");
});

test("leer una pista en PLANNING y cerrar un puente limpia la pista", () => {
  const { scene, input } = createScene();
  scene.enter();

  press(scene, input, "nextPuzzleHint");
  assert.equal(scene.visibleHintLevel, 1);

  press(scene, input, "selectPuzzleOption");

  assert.equal(scene.visibleHintLevel, null);
  assert.equal(scene.statusMessage, "Puente B1 marcado como cerrado.");
});

test("leer una pista tras cerrar un puente e iniciar el recorrido limpia la pista", () => {
  const { scene, input } = createScene();
  scene.enter();

  press(scene, input, "selectPuzzleOption"); // cierra B1
  press(scene, input, "nextPuzzleHint");
  assert.equal(scene.visibleHintLevel, 1);

  press(scene, input, "startPuzzleAttempt");

  assert.equal(scene.puzzle.state.phase, P2_PHASE.TRAVERSING);
  assert.equal(scene.visibleHintLevel, null);
  assert.equal(
    scene.statusMessage,
    "Recorrido iniciado. Selecciona una salida y pulsa E.",
  );
});

test("leer una pista en TRAVERSING y mover el cursor de salida limpia la pista", () => {
  const { scene, input } = createScene();
  scene.enter();

  press(scene, input, "selectPuzzleOption"); // cierra B1
  press(scene, input, "startPuzzleAttempt");

  press(scene, input, "nextPuzzleHint");
  assert.equal(scene.visibleHintLevel, 1);

  press(scene, input, "moveRight");

  assert.equal(scene.visibleHintLevel, null);
  assert.notEqual(scene.statusMessage, "");
});

test("reentrar a mitad de travesía tras haber leído una pista en una sesión anterior no hereda la pista", () => {
  const { scene, input } = createScene();
  scene.enter();

  press(scene, input, "selectPuzzleOption"); // cierra B1
  press(scene, input, "startPuzzleAttempt");
  press(scene, input, "nextPuzzleHint");
  assert.equal(scene.visibleHintLevel, 1);

  const savedState = new P2State(scene.puzzle.toSaveData());
  assert.equal(savedState.phase, P2_PHASE.TRAVERSING);

  const { scene: reenteredScene } = createScene(savedState);
  reenteredScene.enter();

  assert.equal(reenteredScene.visibleHintLevel, null);
  assert.equal(
    reenteredScene.statusMessage,
    `Recorrido reanudado desde ${savedState.currentNode}.`,
  );
});

test("un recorrido completo que termina fuera de lugar muestra el mensaje de destino incorrecto", () => {
  const { scene, input } = createScene();
  scene.enter();

  driveToInvalidEndWithRealControls(scene, input);

  assert.equal(scene.puzzle.state.phase, P2_PHASE.FAILED);
  assert.equal(
    scene.puzzle.state.failureCode,
    P2_VALIDATION_CODE.INVALID_END,
  );
  assert.equal(scene.statusMessage, INVALID_END_MESSAGE);
});

test("reingresar a la escena con un intento fallido guardado muestra el mensaje diferenciado correcto", () => {
  const incompleteRouteCase = buildFailedP2SaveData({
    closedBridgeId: "B2",
    route: ["N", "R", "M", "E", "R"],
  });

  assert.equal(
    incompleteRouteCase.saveData.failureCode,
    P2_VALIDATION_CODE.INCOMPLETE_ROUTE,
  );

  const { scene: incompleteScene } = createScene(
    new P2State(incompleteRouteCase.saveData),
  );

  incompleteScene.enter();

  assert.equal(incompleteScene.statusMessage, INCOMPLETE_ROUTE_MESSAGE);

  const invalidEndCase = buildFailedP2SaveData({
    closedBridgeId: "B1",
    route: ["R", "N", "L", "R", "M", "E"],
  });

  assert.equal(
    invalidEndCase.saveData.failureCode,
    P2_VALIDATION_CODE.INVALID_END,
  );

  const { scene: invalidEndScene } = createScene(
    new P2State(invalidEndCase.saveData),
  );

  invalidEndScene.enter();

  assert.equal(invalidEndScene.statusMessage, INVALID_END_MESSAGE);
});

test("los mensajes de fallo diferenciados son distintos entre sí y del mensaje genérico anterior", () => {
  const GENERIC_MESSAGE =
    "Intento fallido. Pulsa R para volver a planificar.";

  assert.notEqual(INCOMPLETE_ROUTE_MESSAGE, INVALID_END_MESSAGE);
  assert.notEqual(INCOMPLETE_ROUTE_MESSAGE, GENERIC_MESSAGE);
  assert.notEqual(INVALID_END_MESSAGE, GENERIC_MESSAGE);
});

test("una vez resuelto, ninguna secuencia de teclas dentro de la escena vuelve a disparar el SFX", () => {
  const { scene, input, audio } = createScene();
  scene.enter();

  solvePuzzleWithRealControls(scene, input);
  assert.deepEqual(audio.playSfxCalls, [PUZZLE_SUCCESS_SFX_PATH]);

  const forcingAttempts = [
    "moveLeft",
    "moveRight",
    "selectPuzzleOption",
    "startPuzzleAttempt",
    "restartPuzzleAttempt",
    "nextPuzzleHint",
  ];

  for (const action of forcingAttempts) {
    press(scene, input, action);
  }

  assert.equal(scene.puzzle.state.phase, P2_PHASE.SOLVED);
  assert.deepEqual(audio.playSfxCalls, [PUZZLE_SUCCESS_SFX_PATH]);
});

test("construir el estado ya resuelto y solo entrar en la escena no dispara ningún SFX", () => {
  const solvedSaveData = buildSolvedP2SaveData();
  const { scene, audio, state } = createScene(
    new P2State(solvedSaveData),
  );

  scene.enter();

  assert.equal(state.puzzles.p2.phase, P2_PHASE.SOLVED);
  assert.deepEqual(audio.playSfxCalls, []);
});

test("construir el estado ya resuelto vía GameState.restore() y solo entrar en la escena no dispara ningún SFX", () => {
  const solvedSaveData = buildSolvedP2SaveData();
  const saved = new GameState().toSaveData();
  saved.puzzles.p2 = solvedSaveData;

  const state = new GameState();
  state.restore(saved);

  const input = new FakeInput();
  const scenes = new FakeScenes();
  const ui = new FakeUi();
  const audio = new FakeAudioService();
  const scene = new P2BridgesScene({ scenes, input, state, ui, audio });

  scene.enter();

  assert.equal(state.puzzles.p2.phase, P2_PHASE.SOLVED);
  assert.deepEqual(audio.playSfxCalls, []);
});

test("render no lanza excepción en ninguna fase real", () => {
  const cases = [
    () => createScene(),
    () => createScene(new P2State(buildSolvedP2SaveData())),
  ];

  for (const buildSetup of cases) {
    const { scene } = buildSetup();
    scene.enter();

    assert.doesNotThrow(() => scene.render(new FakeCanvasContext()));
  }
});

function createScene(p2State = new P2State()) {
  const input = new FakeInput();
  const scenes = new FakeScenes();
  const state = new GameState();
  const ui = new FakeUi();
  const audio = new FakeAudioService();
  state.puzzles.p2 = p2State;

  return {
    input,
    scenes,
    state,
    ui,
    audio,
    scene: new P2BridgesScene({
      scenes,
      input,
      state,
      ui,
      audio,
    }),
  };
}

function press(scene, input, action) {
  input.press(action);
  scene.update();
}
