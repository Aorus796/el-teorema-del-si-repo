import { P2_GRAPH } from "../puzzles/p2-bridges/P2Graph.js";
import { P2_NODE_LAYOUT } from "../puzzles/p2-bridges/P2Layout.js";
import {
  P2_MOVE_CODE,
  P2Puzzle,
} from "../puzzles/p2-bridges/P2Puzzle.js";
import { P2_PHASE } from "../puzzles/p2-bridges/P2State.js";

export class P2BridgesScene {
  constructor({ scenes, input, state, ui }) {
    this.scenes = scenes;
    this.input = input;
    this.state = state;
    this.ui = ui;
    this.puzzle = null;
    this.selectedBridgeIndex = 0;
    this.selectedMoveIndex = 0;
    this.statusMessage = "";
    this.returnScene = "title";
  }

  enter({ returnScene = "title" } = {}) {
    this.ui.closeAll();
    this.returnScene = returnScene;
    this.puzzle = new P2Puzzle({ state: this.state.puzzles.p2 });
    this.selectedBridgeIndex = 0;
    this.selectedMoveIndex = 0;
    this.syncViewFromState();
  }

  syncViewFromState() {
    const state = this.puzzle.state;

    if (state.closedBridgeId !== null) {
      const bridgeIndex = P2_GRAPH.bridges.findIndex(
        (bridge) => bridge.id === state.closedBridgeId,
      );

      if (bridgeIndex >= 0) {
        this.selectedBridgeIndex = bridgeIndex;
      }
    }

    if (state.phase === P2_PHASE.PLANNING) {
      this.statusMessage =
        state.closedBridgeId === null
          ? "Elige el puente que estaba cerrado."
          : `Puente ${state.closedBridgeId} marcado como cerrado.`;
      return;
    }

    if (state.phase === P2_PHASE.TRAVERSING) {
      this.syncHighlightedBridgeToMove();
      this.statusMessage =
        `Recorrido reanudado desde ${state.currentNode}.`;
      return;
    }

    if (state.phase === P2_PHASE.FAILED) {
      this.statusMessage =
        "Intento fallido. Pulsa R para volver a planificar.";
      return;
    }

    this.statusMessage =
      "Recorrido completo. Has utilizado todos los puentes.";
  }

  update() {
    if (this.input.wasPressed("cancel")) {
      this.scenes.change(this.returnScene);
      return;
    }

    if (this.puzzle.state.phase === P2_PHASE.PLANNING) {
      this.updatePlanning();
      return;
    }

    if (this.puzzle.state.phase === P2_PHASE.TRAVERSING) {
      this.updateTraversal();
      return;
    }

    if (
      this.puzzle.state.phase === P2_PHASE.FAILED &&
      this.input.wasPressed("restartPuzzleAttempt")
    ) {
      this.puzzle.restartTraversal();
      this.selectedMoveIndex = 0;
      this.statusMessage =
        "Intento reiniciado. Puedes cambiar el puente cerrado.";
    }
  }

  updatePlanning() {
    if (this.input.wasPressed("moveLeft")) {
      this.moveBridgeSelection(-1);
    }

    if (this.input.wasPressed("moveRight")) {
      this.moveBridgeSelection(1);
    }

    if (this.input.wasPressed("selectPuzzleOption")) {
      const selectedBridge = this.getHighlightedBridge();

      this.puzzle.selectClosedBridge(selectedBridge.id);
      this.statusMessage =
        `Puente ${selectedBridge.id} marcado como cerrado.`;
    }

    if (this.input.wasPressed("startPuzzleAttempt")) {
      if (this.puzzle.state.closedBridgeId === null) {
        this.statusMessage =
          "Primero debes marcar un puente como cerrado.";
        return;
      }

      this.puzzle.startTraversal();
      this.selectedMoveIndex = 0;
      this.syncHighlightedBridgeToMove();
      this.statusMessage =
        "Recorrido iniciado. Selecciona una salida y pulsa E.";
    }
  }

  updateTraversal() {
    if (this.input.wasPressed("moveLeft")) {
      this.moveTraversalSelection(-1);
    }

    if (this.input.wasPressed("moveRight")) {
      this.moveTraversalSelection(1);
    }

    if (this.input.wasPressed("selectPuzzleOption")) {
      this.crossSelectedBridge();
    }
  }

  moveBridgeSelection(direction) {
    const bridgeCount = P2_GRAPH.bridges.length;

    this.selectedBridgeIndex =
      (this.selectedBridgeIndex + direction + bridgeCount) %
      bridgeCount;

    this.statusMessage =
      `Seleccionado ${this.getHighlightedBridge().id}.`;
  }

  moveTraversalSelection(direction) {
    const availableMoves = this.puzzle.getAvailableMoves();

    if (availableMoves.length === 0) {
      return;
    }

    this.selectedMoveIndex =
      (this.selectedMoveIndex + direction + availableMoves.length) %
      availableMoves.length;

    this.syncHighlightedBridgeToMove();

    const selectedMove = availableMoves[this.selectedMoveIndex];

    this.statusMessage =
      `Destino ${selectedMove.destinationNode} por ${selectedMove.bridgeId}.`;
  }

  crossSelectedBridge() {
    const availableMoves = this.puzzle.getAvailableMoves();

    if (availableMoves.length === 0) {
      this.statusMessage = "No quedan salidas disponibles.";
      return;
    }

    const selectedMove =
      availableMoves[
        Math.min(this.selectedMoveIndex, availableMoves.length - 1)
      ];

    const result = this.puzzle.moveTo(
      selectedMove.destinationNode,
    );

    this.handleMoveResult(result, selectedMove);
  }

  handleMoveResult(result, selectedMove) {
    if (result.code === P2_MOVE_CODE.MOVED) {
      this.statusMessage =
        `Cruzado ${selectedMove.bridgeId}. Estás en ${result.currentNode}.`;

      this.selectedMoveIndex = 0;
      this.syncHighlightedBridgeToMove();
      return;
    }

    if (result.code === P2_MOVE_CODE.SOLVED) {
      const wasAdded = this.state.unlockP2Entry();

      this.statusMessage =
        "Recorrido completo. Has utilizado todos los puentes.";

      if (wasAdded) {
        this.ui.showToast("Nueva observacion registrada");
      }

      return;
    }

    if (result.code === P2_MOVE_CODE.DEAD_END) {
      this.statusMessage =
        "Callejón sin salida. Pulsa R para reiniciar.";
      return;
    }

    if (result.code === P2_MOVE_CODE.CLOSED_BRIDGE) {
      this.statusMessage = "Ese puente está cerrado.";
      return;
    }

    if (result.code === P2_MOVE_CODE.REPEATED_BRIDGE) {
      this.statusMessage = "Ese puente ya ha sido utilizado.";
      return;
    }

    this.statusMessage = "Ese movimiento no es válido.";
  }

  syncHighlightedBridgeToMove() {
    const availableMoves = this.puzzle.getAvailableMoves();

    if (availableMoves.length === 0) {
      return;
    }

    if (this.selectedMoveIndex >= availableMoves.length) {
      this.selectedMoveIndex = 0;
    }

    const selectedMove = availableMoves[this.selectedMoveIndex];
    const bridgeIndex = P2_GRAPH.bridges.findIndex(
      (bridge) => bridge.id === selectedMove.bridgeId,
    );

    if (bridgeIndex >= 0) {
      this.selectedBridgeIndex = bridgeIndex;
    }
  }

  getHighlightedBridge() {
    return P2_GRAPH.bridges[this.selectedBridgeIndex];
  }

  render(context) {
    drawBackground(context);
    drawHeader(context);
    drawBridges(context, {
      highlightedBridgeId: this.getHighlightedBridge().id,
      closedBridgeId: this.puzzle.state.closedBridgeId,
      usedBridgeIds: this.puzzle.state.usedBridgeIds,
    });
    drawNodes(context, this.puzzle.state.currentNode);
    drawStatus(context, this);
    drawFooter(context, this.puzzle.state.phase);
  }
}
function drawBackground(context) {
  context.fillStyle = "#16313d";
  context.fillRect(0, 0, 480, 270);

  context.fillStyle = "#1c4552";

  for (let y = 50; y < 245; y += 16) {
    const offset = (Math.floor(y / 16) % 2) * 8;

    for (let x = -16 + offset; x < 480; x += 32) {
      context.fillRect(x, y, 16, 2);
    }
  }
}

function drawHeader(context) {
  context.fillStyle = "rgb(15 28 35 / 92%)";
  context.fillRect(0, 0, 480, 43);

  context.fillStyle = "#efe2bf";
  context.font = "bold 15px monospace";
  context.textAlign = "center";
  context.fillText("P2 - EL PASEO IMPOSIBLE", 240, 19);

  context.fillStyle = "#b9d8d2";
  context.font = "8px monospace";
  context.fillText(
    "Cierra un puente y recorre todos los demas una sola vez",
    240,
    34,
  );

  context.textAlign = "left";
}

function drawBridges(
  context,
  {
    highlightedBridgeId,
    closedBridgeId,
    usedBridgeIds,
  },
) {
  context.lineCap = "round";

  for (const bridge of P2_GRAPH.bridges) {
    const [nodeAId, nodeBId] = bridge.nodes;
    const nodeA = P2_NODE_LAYOUT[nodeAId];
    const nodeB = P2_NODE_LAYOUT[nodeBId];
    const isHighlighted = bridge.id === highlightedBridgeId;
    const isClosed = bridge.id === closedBridgeId;
    const isUsed = usedBridgeIds.includes(bridge.id);

    drawBridgeBase(context, nodeA, nodeB);

    if (isClosed) {
      drawClosedBridge(context, nodeA, nodeB);
    } else if (isUsed) {
      drawUsedBridge(context, nodeA, nodeB);
    } else if (isHighlighted) {
      drawHighlightedBridge(context, nodeA, nodeB);
    } else {
      drawOpenBridge(context, nodeA, nodeB);
    }

    drawBridgeLabel(context, bridge.id, nodeA, nodeB, {
      isHighlighted,
      isClosed,
      isUsed,
    });
  }

  context.setLineDash([]);
}

function drawBridgeBase(context, nodeA, nodeB) {
  context.strokeStyle = "#49382d";
  context.lineWidth = 9;
  context.setLineDash([]);
  drawLine(context, nodeA, nodeB);
}

function drawOpenBridge(context, nodeA, nodeB) {
  context.strokeStyle = "#c69b58";
  context.lineWidth = 5;
  context.setLineDash([]);
  drawLine(context, nodeA, nodeB);
}

function drawUsedBridge(context, nodeA, nodeB) {
  context.strokeStyle = "#65737a";
  context.lineWidth = 5;
  context.setLineDash([3, 5]);
  drawLine(context, nodeA, nodeB);
  context.setLineDash([]);
}

function drawHighlightedBridge(context, nodeA, nodeB) {
  context.strokeStyle = "#fff2a8";
  context.lineWidth = 7;
  context.setLineDash([]);
  drawLine(context, nodeA, nodeB);
}

function drawClosedBridge(context, nodeA, nodeB) {
  context.strokeStyle = "#d96b5f";
  context.lineWidth = 7;
  context.setLineDash([8, 6]);
  drawLine(context, nodeA, nodeB);
  context.setLineDash([]);
}

function drawLine(context, nodeA, nodeB) {
  context.beginPath();
  context.moveTo(nodeA.x, nodeA.y);
  context.lineTo(nodeB.x, nodeB.y);
  context.stroke();
}

function drawBridgeLabel(
  context,
  bridgeId,
  nodeA,
  nodeB,
  {
    isHighlighted,
    isClosed,
    isUsed,
  },
) {
  const x = Math.round((nodeA.x + nodeB.x) / 2);
  const y = Math.round((nodeA.y + nodeB.y) / 2);

  if (isClosed) {
    context.fillStyle = "#7a302e";
  } else if (isUsed) {
    context.fillStyle = "#3f4c52";
  } else if (isHighlighted) {
    context.fillStyle = "#6c5725";
  } else {
    context.fillStyle = "#171626";
  }

  context.fillRect(x - 9, y - 7, 18, 14);

  context.fillStyle = "#fff7df";
  context.font = "bold 7px monospace";
  context.textAlign = "center";
  context.fillText(bridgeId, x, y + 3);

  context.textAlign = "left";
}

function drawNodes(context, currentNodeId) {
  for (const nodeId of P2_GRAPH.nodes) {
    const node = P2_NODE_LAYOUT[nodeId];
    const isCurrentNode = nodeId === currentNodeId;

    context.fillStyle = "#3e3028";
    context.beginPath();
    context.arc(node.x, node.y, 20, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = isCurrentNode ? "#89aa71" : "#728c63";
    context.beginPath();
    context.arc(node.x, node.y - 2, 16, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = isCurrentNode ? "#fff2a8" : "#d6b65f";
    context.lineWidth = isCurrentNode ? 3 : 2;
    context.beginPath();
    context.arc(node.x, node.y - 2, 16, 0, Math.PI * 2);
    context.stroke();

    context.fillStyle = "#fff7df";
    context.font = "bold 10px monospace";
    context.textAlign = "center";
    context.fillText(nodeId, node.x, node.y + 2);

    context.fillStyle = "#efe2bf";
    context.font = "7px monospace";
    context.fillText(node.label, node.x, node.y + 30);
  }

  context.textAlign = "left";
}

function drawStatus(context, scene) {
  context.fillStyle = "rgb(15 28 35 / 88%)";
  context.fillRect(10, 207, 460, 34);

  context.fillStyle = "#fff7df";
  context.font = "8px monospace";
  context.textAlign = "center";

  const state = scene.puzzle.state;
  const closedBridgeId = state.closedBridgeId ?? "ninguno";
  const usedBridgeCount = state.usedBridgeIds.length;
  const usableBridgeCount =
    P2_GRAPH.bridges.length - (state.closedBridgeId === null ? 0 : 1);

  let summaryText;

  if (state.phase === P2_PHASE.PLANNING) {
    summaryText =
      `Cursor: ${scene.getHighlightedBridge().id} | Cerrado: ${closedBridgeId}`;
  } else if (state.phase === P2_PHASE.TRAVERSING) {
    summaryText =
      `Nodo: ${state.currentNode} | Recorridos: ${usedBridgeCount}/${usableBridgeCount}`;
  } else if (state.phase === P2_PHASE.FAILED) {
    summaryText =
      `Intento fallido | Nodo: ${state.currentNode} | Cerrado: ${closedBridgeId}`;
  } else {
    summaryText =
      `P2 resuelto | Puentes: ${usedBridgeCount}/${usableBridgeCount}`;
  }

  context.fillText(summaryText, 240, 220);

  context.fillStyle = "#b9d8d2";
  context.fillText(scene.statusMessage, 240, 234);

  context.textAlign = "left";
}

function drawFooter(context, phase) {
  context.fillStyle = "rgb(15 28 35 / 96%)";
  context.fillRect(0, 246, 480, 24);

  context.fillStyle = "#fff7df";
  context.font = "8px monospace";
  context.textAlign = "center";

  let helpText;

  if (phase === P2_PHASE.PLANNING) {
    helpText =
      "A/D o flechas: elegir | E: cerrar | Enter: comenzar | Esc: salir";
  } else if (phase === P2_PHASE.TRAVERSING) {
    helpText =
      "A/D o flechas: salida | E: cruzar | R: reiniciar | Esc: salir";
  } else if (phase === P2_PHASE.FAILED) {
    helpText =
      "R: volver a planificar | Esc: volver al titulo";
  } else {
    helpText =
      "Puzle resuelto | Esc: volver al titulo";
  }

  context.fillText(helpText, 240, 261);
  context.textAlign = "left";
}
