import test from "node:test";
import assert from "node:assert/strict";
import { P2BridgesScene } from "../../src/scenes/P2BridgesScene.js";
import { P2Puzzle } from "../../src/puzzles/p2-bridges/P2Puzzle.js";
import { P2_PHASE, P2State } from "../../src/puzzles/p2-bridges/P2State.js";
import { PUZZLE_SUCCESS_SFX_PATH } from "../../src/content/sfxAudioConfig.js";
import { GameState } from "../../src/state/GameState.js";

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
 * Recorrido completo real (cerrando B1 y cruzando R, N, L, R, M, L, en ese
 * orden) que resuelve el puzle -- el mismo recorrido principal ya cubierto
 * a nivel de puzle puro en tests/puzzles/P2Puzzle.test.js
 * ("resuelve el recorrido principal completo"). Cada paso se expresa como
 * el número de veces que hay que pulsar moveRight para desplazar el
 * cursor de movimiento disponible hasta el destino deseado antes de
 * confirmar con selectPuzzleOption -- derivado directamente del orden real
 * de P2Puzzle.getAvailableMoves() (que sigue el orden de P2_GRAPH.bridges)
 * en cada paso de este recorrido concreto, no inventado.
 */
const SOLVING_ROUTE_MOVE_RIGHT_COUNTS = [0, 0, 0, 1, 0, 0];

/*
 * Recorrido que termina en un callejón sin salida (cerrando B2 y cruzando
 * N, R, M, L, N), el mismo caso ya cubierto a nivel de puzle puro en
 * tests/puzzles/P2Puzzle.test.js ("detecta un callejon sin salida con un
 * puente incorrecto"). El puente cerrado (B2) es el segundo de
 * P2_GRAPH.bridges, así que planificar requiere un moveRight antes de
 * seleccionarlo.
 */
const DEAD_END_MOVE_RIGHT_COUNTS = [0, 0, 0, 0, 0];

function solvePuzzleWithRealControls(scene, input) {
  press(scene, input, "selectPuzzleOption"); // cierra B1 (ya resaltado)
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

function buildSolvedP2SaveData() {
  const puzzle = new P2Puzzle();

  puzzle.selectClosedBridge("B1");
  puzzle.startTraversal();

  for (const nodeId of ["R", "N", "L", "R", "M", "L"]) {
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
