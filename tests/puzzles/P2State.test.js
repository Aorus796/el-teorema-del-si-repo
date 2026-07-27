import assert from "node:assert/strict";
import test from "node:test";
import { PUZZLE_STATUS } from "../../src/puzzles/core/PuzzleLifecycle.js";
import {
  P2_PHASE,
  P2State,
} from "../../src/puzzles/p2-bridges/P2State.js";

test("P2 comienza en fase de planificacion", () => {
  const state = new P2State();

  assert.equal(state.phase, P2_PHASE.PLANNING);
  assert.equal(state.closedBridgeId, null);
  assert.equal(state.currentNode, "E");
  assert.deepEqual(state.route, ["E"]);
  assert.deepEqual(state.usedBridgeIds, []);
  assert.equal(state.lifecycle.status, PUZZLE_STATUS.READY);
});

test("permite seleccionar un puente durante la planificacion", () => {
  const state = new P2State();

  state.selectClosedBridge("B1");

  assert.equal(state.closedBridgeId, "B1");
});

test("rechaza iniciar el recorrido sin seleccionar un puente", () => {
  const state = new P2State();

  assert.throws(
    () => state.startTraversal(),
    /Debe seleccionarse un puente cerrado/,
  );
});

test("iniciar el recorrido prepara el intento desde E", () => {
  const state = new P2State();

  state.selectClosedBridge("B1");
  state.startTraversal();

  assert.equal(state.phase, P2_PHASE.TRAVERSING);
  assert.equal(state.currentNode, "E");
  assert.deepEqual(state.route, ["E"]);
  assert.deepEqual(state.usedBridgeIds, []);
  assert.equal(state.lifecycle.status, PUZZLE_STATUS.ACTIVE);
  assert.equal(state.lifecycle.attemptCount, 1);
});

test("registra los pasos y puentes utilizados", () => {
  const state = new P2State();

  state.selectClosedBridge("B1");
  state.startTraversal();
  state.registerStep({
    nodeId: "R",
    bridgeId: "B2",
  });
  state.registerStep({
    nodeId: "N",
    bridgeId: "B3",
  });

  assert.equal(state.currentNode, "N");
  assert.deepEqual(state.route, ["E", "R", "N"]);
  assert.deepEqual(state.usedBridgeIds, ["B2", "B3"]);
});

test("rechaza registrar dos veces el mismo puente", () => {
  const state = new P2State();

  state.selectClosedBridge("B1");
  state.startTraversal();
  state.registerStep({
    nodeId: "R",
    bridgeId: "B2",
  });

  assert.throws(
    () =>
      state.registerStep({
        nodeId: "E",
        bridgeId: "B2",
      }),
    /ya fue utilizado/,
  );
});

test("un intento fallido puede reiniciarse conservando la planificacion", () => {
  const state = new P2State();

  state.selectClosedBridge("B1");
  state.addHint(1);
  state.startTraversal();
  state.registerStep({
    nodeId: "R",
    bridgeId: "B2",
  });
  state.markFailed("incomplete_route");
  state.restartTraversal();

  assert.equal(state.phase, P2_PHASE.PLANNING);
  assert.equal(state.closedBridgeId, "B1");
  assert.equal(state.currentNode, "E");
  assert.deepEqual(state.route, ["E"]);
  assert.deepEqual(state.usedBridgeIds, []);
  assert.deepEqual(state.hintsRead, [1]);
  assert.equal(state.failureCode, null);
  assert.equal(state.lifecycle.attemptCount, 1);
});

test("las reflexiones no se duplican y se mantienen ordenadas", () => {
  const state = new P2State();

  state.addHint(3);
  state.addHint(1);
  state.addHint(2);
  state.addHint(2);

  assert.deepEqual(state.hintsRead, [1, 2, 3]);
});

test("un recorrido activo puede marcarse como resuelto", () => {
  const state = new P2State();

  state.selectClosedBridge("B1");
  state.startTraversal();
  state.markSolved();

  assert.equal(state.phase, P2_PHASE.SOLVED);
  assert.equal(state.lifecycle.status, PUZZLE_STATUS.SOLVED);
  assert.equal(state.lifecycle.isSolved(), true);
});

test("el estado puede guardarse y restaurarse sin perder progreso", () => {
  const original = new P2State();

  original.selectClosedBridge("B1");
  original.addHint(1);
  original.addHint(2);
  original.startTraversal();
  original.registerStep({
    nodeId: "R",
    bridgeId: "B2",
  });
  original.registerStep({
    nodeId: "N",
    bridgeId: "B3",
  });

  const restored = new P2State(original.toSaveData());

  assert.deepEqual(restored.toSaveData(), original.toSaveData());
});

test("rechaza datos persistidos incoherentes", () => {
  assert.throws(
    () =>
      new P2State({
        currentNode: "N",
        route: ["E", "R"],
        usedBridgeIds: ["B2"],
      }),
    /ultimo nodo de la ruta/,
  );

  assert.throws(
    () =>
      new P2State({
        currentNode: "E",
        route: ["E", "R", "E"],
        usedBridgeIds: ["B2", "B2"],
      }),
    /puentes utilizados repetidos/,
  );
});
