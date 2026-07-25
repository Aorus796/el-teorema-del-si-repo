import assert from "node:assert/strict";
import test from "node:test";
import {
  P2_VALIDATION_CODE,
  findBridge,
  validateP2Route,
} from "../../src/puzzles/p2-bridges/P2Validator.js";
import { P2_GRAPH } from "../../src/puzzles/p2-bridges/P2Graph.js";

test("acepta el recorrido valido principal", () => {
  const result = validateP2Route({
    closedBridgeId: "B1",
    route: ["E", "R", "N", "L", "R", "M", "L"],
  });

  assert.equal(result.valid, true);
  assert.equal(result.code, P2_VALIDATION_CODE.VALID);
  assert.deepEqual(result.usedBridgeIds, [
    "B2",
    "B3",
    "B6",
    "B7",
    "B4",
    "B5",
  ]);
  assert.deepEqual(result.remainingBridgeIds, []);
});

test("acepta un recorrido valido alternativo", () => {
  const result = validateP2Route({
    closedBridgeId: "B1",
    route: ["E", "R", "M", "L", "N", "R", "L"],
  });

  assert.equal(result.valid, true);
  assert.equal(result.code, P2_VALIDATION_CODE.VALID);
});

test("rechaza un identificador de puente cerrado inexistente", () => {
  const result = validateP2Route({
    closedBridgeId: "B99",
    route: ["E"],
  });

  assert.equal(result.valid, false);
  assert.equal(
    result.code,
    P2_VALIDATION_CODE.INVALID_CLOSED_BRIDGE,
  );
});

test("rechaza un recorrido vacio", () => {
  const result = validateP2Route({
    closedBridgeId: "B1",
    route: [],
  });

  assert.equal(result.valid, false);
  assert.equal(result.code, P2_VALIDATION_CODE.INVALID_ROUTE);
});

test("rechaza un recorrido que no comienza en E", () => {
  const result = validateP2Route({
    closedBridgeId: "B1",
    route: ["R", "N"],
  });

  assert.equal(result.valid, false);
  assert.equal(result.code, P2_VALIDATION_CODE.INVALID_START);
});

test("rechaza un paso entre nodos no conectados", () => {
  const result = validateP2Route({
    closedBridgeId: "B1",
    route: ["E", "M"],
  });

  assert.equal(result.valid, false);
  assert.equal(result.code, P2_VALIDATION_CODE.INVALID_STEP);
  assert.equal(result.fromNode, "E");
  assert.equal(result.toNode, "M");
});

test("rechaza el uso del puente marcado como cerrado", () => {
  const result = validateP2Route({
    closedBridgeId: "B1",
    route: ["E", "N"],
  });

  assert.equal(result.valid, false);
  assert.equal(result.code, P2_VALIDATION_CODE.CLOSED_BRIDGE_USED);
  assert.equal(result.bridgeId, "B1");
});

test("rechaza un puente utilizado dos veces", () => {
  const result = validateP2Route({
    closedBridgeId: "B1",
    route: ["E", "R", "E"],
  });

  assert.equal(result.valid, false);
  assert.equal(result.code, P2_VALIDATION_CODE.REPEATED_BRIDGE);
  assert.equal(result.bridgeId, "B2");
});

test("rechaza un recorrido que deja puentes sin utilizar", () => {
  const result = validateP2Route({
    closedBridgeId: "B1",
    route: ["E", "R", "N"],
  });

  assert.equal(result.valid, false);
  assert.equal(result.code, P2_VALIDATION_CODE.INCOMPLETE_ROUTE);
  assert.deepEqual(result.usedBridgeIds, ["B2", "B3"]);
  assert.equal(result.remainingBridgeIds.length, 4);
});

test("rechaza un recorrido completo que termina fuera de L", () => {
  const result = validateP2Route({
    closedBridgeId: "B6",
    route: ["E", "N", "R", "M", "L", "R", "E"],
  });

  assert.equal(result.valid, false);
  assert.equal(result.code, P2_VALIDATION_CODE.INVALID_END);
  assert.equal(result.endNode, "E");
  assert.equal(result.usedBridgeIds.length, 6);
});

test("findBridge encuentra conexiones en ambas direcciones", () => {
  assert.equal(findBridge(P2_GRAPH, "E", "R")?.id, "B2");
  assert.equal(findBridge(P2_GRAPH, "R", "E")?.id, "B2");
  assert.equal(findBridge(P2_GRAPH, "E", "M"), null);
});
