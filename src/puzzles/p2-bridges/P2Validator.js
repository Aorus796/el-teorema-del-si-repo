import { P2_GRAPH } from "./P2Graph.js";

export const P2_VALIDATION_CODE = Object.freeze({
  VALID: "valid",
  INVALID_CLOSED_BRIDGE: "invalid_closed_bridge",
  INVALID_ROUTE: "invalid_route",
  INVALID_START: "invalid_start",
  INVALID_STEP: "invalid_step",
  CLOSED_BRIDGE_USED: "closed_bridge_used",
  REPEATED_BRIDGE: "repeated_bridge",
  INCOMPLETE_ROUTE: "incomplete_route",
  INVALID_END: "invalid_end",
});

export function validateP2Route({
  closedBridgeId,
  route,
  graph = P2_GRAPH,
}) {
  const closedBridge = graph.bridges.find(
    (bridge) => bridge.id === closedBridgeId,
  );

  if (!closedBridge) {
    return invalidResult(P2_VALIDATION_CODE.INVALID_CLOSED_BRIDGE);
  }

  if (!Array.isArray(route) || route.length === 0) {
    return invalidResult(P2_VALIDATION_CODE.INVALID_ROUTE);
  }

  if (route[0] !== graph.startNode) {
    return invalidResult(P2_VALIDATION_CODE.INVALID_START);
  }

  const usedBridgeIds = [];
  const usedBridgeSet = new Set();

  for (let index = 0; index < route.length - 1; index += 1) {
    const fromNode = route[index];
    const toNode = route[index + 1];
    const bridge = findBridge(graph, fromNode, toNode);

    if (!bridge) {
      return invalidResult(P2_VALIDATION_CODE.INVALID_STEP, {
        fromNode,
        toNode,
        usedBridgeIds,
      });
    }

    if (bridge.id === closedBridgeId) {
      return invalidResult(P2_VALIDATION_CODE.CLOSED_BRIDGE_USED, {
        bridgeId: bridge.id,
        usedBridgeIds,
      });
    }

    if (usedBridgeSet.has(bridge.id)) {
      return invalidResult(P2_VALIDATION_CODE.REPEATED_BRIDGE, {
        bridgeId: bridge.id,
        usedBridgeIds,
      });
    }

    usedBridgeSet.add(bridge.id);
    usedBridgeIds.push(bridge.id);
  }

  const openBridgeIds = graph.bridges
    .filter((bridge) => bridge.id !== closedBridgeId)
    .map((bridge) => bridge.id);

  const remainingBridgeIds = openBridgeIds.filter(
    (bridgeId) => !usedBridgeSet.has(bridgeId),
  );

  if (remainingBridgeIds.length > 0) {
    return invalidResult(P2_VALIDATION_CODE.INCOMPLETE_ROUTE, {
      usedBridgeIds,
      remainingBridgeIds,
    });
  }

  if (route.at(-1) !== graph.endNode) {
    return invalidResult(P2_VALIDATION_CODE.INVALID_END, {
      usedBridgeIds,
      endNode: route.at(-1),
    });
  }

  return {
    valid: true,
    code: P2_VALIDATION_CODE.VALID,
    usedBridgeIds,
    remainingBridgeIds: [],
  };
}

export function findBridge(graph, nodeA, nodeB) {
  return (
    graph.bridges.find((bridge) => {
      const [bridgeNodeA, bridgeNodeB] = bridge.nodes;

      return (
        (bridgeNodeA === nodeA && bridgeNodeB === nodeB) ||
        (bridgeNodeA === nodeB && bridgeNodeB === nodeA)
      );
    }) ?? null
  );
}

function invalidResult(code, details = {}) {
  return {
    valid: false,
    code,
    ...details,
  };
}
