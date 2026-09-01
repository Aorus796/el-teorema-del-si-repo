import assert from "node:assert/strict";
import test from "node:test";
import {
  P2_BRIDGES,
  P2_END_NODE,
  P2_GRAPH,
  P2_NODE_IDS,
  P2_START_NODE,
} from "../../src/puzzles/p2-bridges/P2Graph.js";

test("P2 define cinco nodos y siete puentes", () => {
  assert.equal(P2_GRAPH.nodes.length, 5);
  assert.equal(P2_BRIDGES.length, 7);
});

test("P2 comienza en E y termina en L", () => {
  assert.equal(P2_START_NODE, P2_NODE_IDS.ENTRANCE);
  assert.equal(P2_END_NODE, P2_NODE_IDS.MILL_PATH);
});

test("todos los puentes tienen identificadores y extremos unicos", () => {
  const bridgeIds = P2_BRIDGES.map((bridge) => bridge.id);
  const connections = P2_BRIDGES.map((bridge) =>
    [...bridge.nodes].sort().join("-"),
  );

  assert.equal(new Set(bridgeIds).size, P2_BRIDGES.length);
  assert.equal(new Set(connections).size, P2_BRIDGES.length);
});

test("los grados iniciales coinciden con el diseño", () => {
  const degrees = Object.fromEntries(
    P2_GRAPH.nodes.map((nodeId) => [nodeId, 0]),
  );

  for (const bridge of P2_BRIDGES) {
    const [nodeA, nodeB] = bridge.nodes;
    degrees[nodeA] += 1;
    degrees[nodeB] += 1;
  }

  assert.deepEqual(degrees, {
    E: 3,
    N: 3,
    R: 4,
    M: 2,
    L: 2,
  });
});
