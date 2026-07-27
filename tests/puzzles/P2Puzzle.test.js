import assert from "node:assert/strict";
import test from "node:test";
import {
  P2_MOVE_CODE,
  P2Puzzle,
} from "../../src/puzzles/p2-bridges/P2Puzzle.js";
import {
  P2_PHASE,
  P2State,
} from "../../src/puzzles/p2-bridges/P2State.js";

function createStartedPuzzle(closedBridgeId = "B1") {
  const puzzle = new P2Puzzle();

  puzzle.selectClosedBridge(closedBridgeId);
  puzzle.startTraversal();

  return puzzle;
}

test("no ofrece movimientos antes de iniciar el recorrido", () => {
  const puzzle = new P2Puzzle();

  assert.deepEqual(puzzle.getAvailableMoves(), []);
});

test("con B1 cerrado el unico movimiento inicial es E hacia R", () => {
  const puzzle = createStartedPuzzle("B1");

  assert.deepEqual(puzzle.getAvailableMoves(), [
    {
      bridgeId: "B2",
      destinationNode: "R",
    },
  ]);
});

test("rechaza movimientos fuera de la fase de recorrido", () => {
  const puzzle = new P2Puzzle();

  const result = puzzle.moveTo("R");

  assert.equal(result.code, P2_MOVE_CODE.INVALID_PHASE);
});

test("rechaza nodos inexistentes sin modificar el estado", () => {
  const puzzle = createStartedPuzzle();

  const result = puzzle.moveTo("X");

  assert.equal(result.code, P2_MOVE_CODE.INVALID_NODE);
  assert.equal(puzzle.state.currentNode, "E");
  assert.deepEqual(puzzle.state.route, ["E"]);
});

test("rechaza movimientos entre nodos no conectados", () => {
  const puzzle = createStartedPuzzle();

  const result = puzzle.moveTo("M");

  assert.equal(result.code, P2_MOVE_CODE.INVALID_STEP);
  assert.equal(result.fromNode, "E");
  assert.equal(result.toNode, "M");
});

test("impide utilizar el puente seleccionado como cerrado", () => {
  const puzzle = createStartedPuzzle("B1");

  const result = puzzle.moveTo("N");

  assert.equal(result.code, P2_MOVE_CODE.CLOSED_BRIDGE);
  assert.equal(result.bridgeId, "B1");
  assert.equal(puzzle.state.currentNode, "E");
});

test("impide utilizar dos veces el mismo puente", () => {
  const puzzle = createStartedPuzzle("B1");

  const firstMove = puzzle.moveTo("R");
  const repeatedMove = puzzle.moveTo("E");

  assert.equal(firstMove.code, P2_MOVE_CODE.MOVED);
  assert.equal(repeatedMove.code, P2_MOVE_CODE.REPEATED_BRIDGE);
  assert.equal(repeatedMove.bridgeId, "B2");
  assert.equal(puzzle.state.currentNode, "R");
});

test("resuelve el recorrido principal completo", () => {
  const puzzle = createStartedPuzzle("B1");

  const route = ["R", "N", "L", "R", "M", "L"];
  let result;

  for (const nodeId of route) {
    result = puzzle.moveTo(nodeId);
  }

  assert.equal(result.code, P2_MOVE_CODE.SOLVED);
  assert.equal(puzzle.state.phase, P2_PHASE.SOLVED);
  assert.equal(puzzle.state.lifecycle.isSolved(), true);
  assert.deepEqual(puzzle.state.route, [
    "E",
    "R",
    "N",
    "L",
    "R",
    "M",
    "L",
  ]);
});

test("acepta un recorrido completo alternativo", () => {
  const puzzle = createStartedPuzzle("B1");

  const route = ["R", "M", "L", "N", "R", "L"];
  let result;

  for (const nodeId of route) {
    result = puzzle.moveTo(nodeId);
  }

  assert.equal(result.code, P2_MOVE_CODE.SOLVED);
  assert.equal(puzzle.state.phase, P2_PHASE.SOLVED);
});

test("detecta un callejon sin salida con un puente incorrecto", () => {
  const puzzle = createStartedPuzzle("B2");

  assert.equal(puzzle.moveTo("N").code, P2_MOVE_CODE.MOVED);
  assert.equal(puzzle.moveTo("R").code, P2_MOVE_CODE.MOVED);
  assert.equal(puzzle.moveTo("M").code, P2_MOVE_CODE.MOVED);
  assert.equal(puzzle.moveTo("L").code, P2_MOVE_CODE.MOVED);

  const result = puzzle.moveTo("N");

  assert.equal(result.code, P2_MOVE_CODE.DEAD_END);
  assert.equal(puzzle.state.phase, P2_PHASE.FAILED);
  assert.deepEqual(result.remainingBridgeIds, ["B7"]);
});

test("reiniciar un fallo conserva el puente y las reflexiones", () => {
  const puzzle = createStartedPuzzle("B2");

  puzzle.addHint(1);
  puzzle.moveTo("N");
  puzzle.moveTo("R");
  puzzle.moveTo("M");
  puzzle.moveTo("L");
  puzzle.moveTo("N");

  puzzle.restartTraversal();

  assert.equal(puzzle.state.phase, P2_PHASE.PLANNING);
  assert.equal(puzzle.state.closedBridgeId, "B2");
  assert.deepEqual(puzzle.state.hintsRead, [1]);
  assert.deepEqual(puzzle.state.route, ["E"]);
  assert.deepEqual(puzzle.state.usedBridgeIds, []);
});

test("puede restaurarse un intento guardado y continuar", () => {
  const original = createStartedPuzzle("B1");

  original.moveTo("R");
  original.moveTo("N");

  const restored = new P2Puzzle({
    state: new P2State(original.toSaveData()),
  });

  assert.equal(restored.state.currentNode, "N");
  assert.deepEqual(restored.state.route, ["E", "R", "N"]);
  assert.deepEqual(restored.getAvailableMoves(), [
    {
      bridgeId: "B6",
      destinationNode: "L",
    },
  ]);
});
