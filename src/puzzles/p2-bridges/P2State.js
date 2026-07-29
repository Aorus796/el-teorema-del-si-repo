import { PuzzleLifecycle, PUZZLE_STATUS } from "../core/PuzzleLifecycle.js";
import {
  revealNextHint as revealNextHintProgress,
  validateHintsRead,
} from "../core/HintProgress.js";
import { P2_GRAPH } from "./P2Graph.js";

export const P2_PHASE = Object.freeze({
  PLANNING: "planning",
  TRAVERSING: "traversing",
  FAILED: "failed",
  SOLVED: "solved",
});

export class P2State {
  constructor({
    lifecycle = {},
    phase = P2_PHASE.PLANNING,
    closedBridgeId = null,
    currentNode = P2_GRAPH.startNode,
    route = [P2_GRAPH.startNode],
    usedBridgeIds = [],
    hintsRead = [],
    failureCode = null,
  } = {}) {
    this.lifecycle = new PuzzleLifecycle({
      id: P2_GRAPH.id,
      status: lifecycle.status ?? PUZZLE_STATUS.READY,
      attemptCount: lifecycle.attemptCount ?? 0,
    });

    this.phase = phase;
    this.closedBridgeId = closedBridgeId;
    this.currentNode = currentNode;
    this.route = [...route];
    this.usedBridgeIds = [...usedBridgeIds];
    this.hintsRead = validateHintsRead(hintsRead);
    this.failureCode = failureCode;

    this.validate();
  }

  selectClosedBridge(bridgeId) {
    if (this.phase !== P2_PHASE.PLANNING) {
      throw new Error(
        "El puente cerrado solo puede cambiarse durante la planificacion.",
      );
    }

    if (!P2_GRAPH.bridges.some((bridge) => bridge.id === bridgeId)) {
      throw new Error(`No existe el puente "${bridgeId}".`);
    }

    this.closedBridgeId = bridgeId;
  }

  startTraversal() {
    if (this.phase !== P2_PHASE.PLANNING) {
      throw new Error("El recorrido solo puede iniciarse desde la planificacion.");
    }

    if (this.closedBridgeId === null) {
      throw new Error("Debe seleccionarse un puente cerrado.");
    }

    this.lifecycle.start();
    this.phase = P2_PHASE.TRAVERSING;
    this.currentNode = P2_GRAPH.startNode;
    this.route = [P2_GRAPH.startNode];
    this.usedBridgeIds = [];
    this.failureCode = null;
  }

  registerStep({ nodeId, bridgeId }) {
    if (this.phase !== P2_PHASE.TRAVERSING) {
      throw new Error("Solo pueden registrarse pasos durante el recorrido.");
    }

    if (!P2_GRAPH.nodes.includes(nodeId)) {
      throw new Error(`No existe el nodo "${nodeId}".`);
    }

    if (!P2_GRAPH.bridges.some((bridge) => bridge.id === bridgeId)) {
      throw new Error(`No existe el puente "${bridgeId}".`);
    }

    if (this.usedBridgeIds.includes(bridgeId)) {
      throw new Error(`El puente "${bridgeId}" ya fue utilizado.`);
    }

    this.currentNode = nodeId;
    this.route.push(nodeId);
    this.usedBridgeIds.push(bridgeId);
  }

  markFailed(code) {
    if (this.phase !== P2_PHASE.TRAVERSING) {
      throw new Error("Solo puede fallar un recorrido activo.");
    }

    this.phase = P2_PHASE.FAILED;
    this.failureCode = code;
  }

  restartTraversal() {
    if (
      this.phase !== P2_PHASE.TRAVERSING &&
      this.phase !== P2_PHASE.FAILED
    ) {
      throw new Error("No existe un recorrido que pueda reiniciarse.");
    }

    this.lifecycle.reset();
    this.phase = P2_PHASE.PLANNING;
    this.currentNode = P2_GRAPH.startNode;
    this.route = [P2_GRAPH.startNode];
    this.usedBridgeIds = [];
    this.failureCode = null;
  }

  markSolved() {
    if (this.phase !== P2_PHASE.TRAVERSING) {
      throw new Error("Solo puede resolverse un recorrido activo.");
    }

    this.lifecycle.solve();
    this.phase = P2_PHASE.SOLVED;
    this.failureCode = null;
  }

  revealNextHint() {
    const result = revealNextHintProgress(this.hintsRead);
    this.hintsRead = [...result.hintsRead];
    return result;
  }

  toSaveData() {
    return {
      lifecycle: this.lifecycle.toSaveData(),
      phase: this.phase,
      closedBridgeId: this.closedBridgeId,
      currentNode: this.currentNode,
      route: [...this.route],
      usedBridgeIds: [...this.usedBridgeIds],
      hintsRead: [...this.hintsRead],
      failureCode: this.failureCode,
    };
  }

  validate() {
    if (!Object.values(P2_PHASE).includes(this.phase)) {
      throw new Error(`Fase de P2 no valida: ${this.phase}`);
    }

    if (
      this.closedBridgeId !== null &&
      !P2_GRAPH.bridges.some(
        (bridge) => bridge.id === this.closedBridgeId,
      )
    ) {
      throw new Error(`No existe el puente "${this.closedBridgeId}".`);
    }

    if (!P2_GRAPH.nodes.includes(this.currentNode)) {
      throw new Error(`No existe el nodo "${this.currentNode}".`);
    }

    if (!Array.isArray(this.route) || this.route.length === 0) {
      throw new Error("La ruta de P2 no puede estar vacia.");
    }

    if (this.route.at(-1) !== this.currentNode) {
      throw new Error(
        "El ultimo nodo de la ruta debe coincidir con el nodo actual.",
      );
    }

    if (new Set(this.usedBridgeIds).size !== this.usedBridgeIds.length) {
      throw new Error("La partida contiene puentes utilizados repetidos.");
    }

    validateHintsRead(this.hintsRead);

    if (this.route.length !== this.usedBridgeIds.length + 1) {
      throw new Error(
        "La cantidad de nodos y puentes utilizados no es coherente.",
      );
    }
  }
}
