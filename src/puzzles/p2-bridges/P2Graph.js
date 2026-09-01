export const P2_NODE_IDS = Object.freeze({
  ENTRANCE: "E",
  NODE_ISLAND: "N",
  CLOCK_ISLAND: "R",
  MARKET: "M",
  MILL_PATH: "L",
});

export const P2_START_NODE = P2_NODE_IDS.ENTRANCE;
export const P2_END_NODE = P2_NODE_IDS.MILL_PATH;

export const P2_BRIDGES = Object.freeze([
  createBridge("B1", P2_NODE_IDS.ENTRANCE, P2_NODE_IDS.NODE_ISLAND),
  createBridge("B2", P2_NODE_IDS.CLOCK_ISLAND, P2_NODE_IDS.MILL_PATH),
  createBridge("B3", P2_NODE_IDS.NODE_ISLAND, P2_NODE_IDS.CLOCK_ISLAND),
  createBridge("B4", P2_NODE_IDS.CLOCK_ISLAND, P2_NODE_IDS.MARKET),
  createBridge("B5", P2_NODE_IDS.ENTRANCE, P2_NODE_IDS.MARKET),
  createBridge("B6", P2_NODE_IDS.NODE_ISLAND, P2_NODE_IDS.MILL_PATH),
  createBridge("B7", P2_NODE_IDS.ENTRANCE, P2_NODE_IDS.CLOCK_ISLAND),
]);

export const P2_GRAPH = Object.freeze({
  id: "p2-bridges",
  startNode: P2_START_NODE,
  endNode: P2_END_NODE,
  nodes: Object.freeze(Object.values(P2_NODE_IDS)),
  bridges: P2_BRIDGES,
});

function createBridge(id, nodeA, nodeB) {
  return Object.freeze({
    id,
    nodes: Object.freeze([nodeA, nodeB]),
  });
}
