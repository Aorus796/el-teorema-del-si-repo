import { P2_GRAPH } from "./P2Graph.js";
import { P2_PHASE, P2State } from "./P2State.js";
import {
  findBridge,
  P2_VALIDATION_CODE,
  validateP2Route,
} from "./P2Validator.js";

export const P2_MOVE_CODE = Object.freeze({
  MOVED: "moved",
  SOLVED: "solved",
  DEAD_END: "dead_end",
  INVALID_PHASE: "invalid_phase",
  INVALID_NODE: "invalid_node",
  INVALID_STEP: "invalid_step",
  CLOSED_BRIDGE: "closed_bridge",
  REPEATED_BRIDGE: "repeated_bridge",
});

export class P2Puzzle {
  constructor({ state = new P2State(), graph = P2_GRAPH } = {}) {
    this.state = state;
    this.graph = graph;
  }

  selectClosedBridge(bridgeId) {
    this.state.selectClosedBridge(bridgeId);
  }

  startTraversal() {
    this.state.startTraversal();
  }

  moveTo(nodeId) {
    if (this.state.phase !== P2_PHASE.TRAVERSING) {
      return createMoveResult(P2_MOVE_CODE.INVALID_PHASE);
    }

    if (!this.graph.nodes.includes(nodeId)) {
      return createMoveResult(P2_MOVE_CODE.INVALID_NODE, {
        nodeId,
      });
    }

    const bridge = findBridge(
      this.graph,
      this.state.currentNode,
      nodeId,
    );

    if (!bridge) {
      return createMoveResult(P2_MOVE_CODE.INVALID_STEP, {
        fromNode: this.state.currentNode,
        toNode: nodeId,
      });
    }

    if (bridge.id === this.state.closedBridgeId) {
      return createMoveResult(P2_MOVE_CODE.CLOSED_BRIDGE, {
        bridgeId: bridge.id,
      });
    }

    if (this.state.usedBridgeIds.includes(bridge.id)) {
      return createMoveResult(P2_MOVE_CODE.REPEATED_BRIDGE, {
        bridgeId: bridge.id,
      });
    }

    this.state.registerStep({
      nodeId,
      bridgeId: bridge.id,
    });

    const openBridgeCount =
      this.graph.bridges.length - 1;

    if (this.state.usedBridgeIds.length === openBridgeCount) {
      return this.completeTraversal();
    }

    const availableMoves = this.getAvailableMoves();

    if (availableMoves.length === 0) {
      this.state.markFailed(
        P2_VALIDATION_CODE.INCOMPLETE_ROUTE,
      );

      return createMoveResult(P2_MOVE_CODE.DEAD_END, {
        currentNode: this.state.currentNode,
        remainingBridgeIds: this.getRemainingBridgeIds(),
      });
    }

    return createMoveResult(P2_MOVE_CODE.MOVED, {
      currentNode: this.state.currentNode,
      bridgeId: bridge.id,
      availableMoves,
    });
  }

  completeTraversal() {
    const validation = validateP2Route({
      closedBridgeId: this.state.closedBridgeId,
      route: this.state.route,
      graph: this.graph,
    });

    if (validation.valid) {
      this.state.markSolved();

      return createMoveResult(P2_MOVE_CODE.SOLVED, {
        validation,
      });
    }

    this.state.markFailed(validation.code);

    return createMoveResult(P2_MOVE_CODE.DEAD_END, {
      validation,
    });
  }

  getAvailableMoves() {
    if (this.state.phase !== P2_PHASE.TRAVERSING) {
      return [];
    }

    return this.graph.bridges
      .filter((bridge) => {
        if (bridge.id === this.state.closedBridgeId) {
          return false;
        }

        if (this.state.usedBridgeIds.includes(bridge.id)) {
          return false;
        }

        return bridge.nodes.includes(this.state.currentNode);
      })
      .map((bridge) => {
        const [nodeA, nodeB] = bridge.nodes;
        const destinationNode =
          nodeA === this.state.currentNode ? nodeB : nodeA;

        return {
          bridgeId: bridge.id,
          destinationNode,
        };
      });
  }

  getRemainingBridgeIds() {
    return this.graph.bridges
      .filter(
        (bridge) =>
          bridge.id !== this.state.closedBridgeId &&
          !this.state.usedBridgeIds.includes(bridge.id),
      )
      .map((bridge) => bridge.id);
  }

  restartTraversal() {
    this.state.restartTraversal();
  }

  addHint(hintNumber) {
    this.state.addHint(hintNumber);
  }

  toSaveData() {
    return this.state.toSaveData();
  }
}

function createMoveResult(code, details = {}) {
  return {
    code,
    ...details,
  };
}
