import assert from "node:assert/strict";
import test from "node:test";
import {
  P2_END_NODE,
  P2_GRAPH,
  P2_START_NODE,
} from "../../src/puzzles/p2-bridges/P2Graph.js";
import {
  P2_MOVE_CODE,
  P2Puzzle,
} from "../../src/puzzles/p2-bridges/P2Puzzle.js";
import { P2_PHASE } from "../../src/puzzles/p2-bridges/P2State.js";
import {
  P2_VALIDATION_CODE,
  validateP2Route,
} from "../../src/puzzles/p2-bridges/P2Validator.js";

/*
 * Estos tests no dan por buena ninguna lista de rutas escrita a mano: todo
 * lo que afirman sobre la topología de P2 se calcula recorriendo P2_GRAPH
 * real por backtracking y se contrasta después con el motor
 * (validateP2Route / P2Puzzle). Si algún día se recablea otro puente, aquí
 * fallará la tabla, no una copia local del grafo.
 */

function degreesWithoutBridge(closedBridgeId) {
  const degrees = Object.fromEntries(
    P2_GRAPH.nodes.map((nodeId) => [nodeId, 0]),
  );

  for (const bridge of P2_GRAPH.bridges) {
    if (bridge.id === closedBridgeId) {
      continue;
    }

    const [nodeA, nodeB] = bridge.nodes;
    degrees[nodeA] += 1;
    degrees[nodeB] += 1;
  }

  return degrees;
}

// Criterio de Euler aplicado al puzle: tras cerrar un puente, el recorrido
// pedido (cruzar cada puente abierto una sola vez, de la Entrada al Molino)
// solo es plausible si la Entrada y el Molino son los dos únicos lugares
// con un número impar de conexiones.
function leavesStartAndEndAsOnlyOddNodes(closedBridgeId) {
  const degrees = degreesWithoutBridge(closedBridgeId);
  const oddNodes = P2_GRAPH.nodes.filter(
    (nodeId) => degrees[nodeId] % 2 !== 0,
  );

  return (
    oddNodes.length === 2 &&
    oddNodes.includes(P2_START_NODE) &&
    oddNodes.includes(P2_END_NODE)
  );
}

// Enumera por backtracking todos los recorridos que salen del nodo de
// inicio y consiguen cruzar los seis puentes abiertos exactamente una vez,
// sin importar dónde terminen.
function findRoutesCrossingEveryOpenBridge(closedBridgeId) {
  const openBridges = P2_GRAPH.bridges.filter(
    (bridge) => bridge.id !== closedBridgeId,
  );
  const routes = [];
  const usedBridgeIds = new Set();
  const route = [P2_START_NODE];

  function walk(currentNode) {
    if (usedBridgeIds.size === openBridges.length) {
      routes.push([...route]);
      return;
    }

    for (const bridge of openBridges) {
      if (usedBridgeIds.has(bridge.id)) {
        continue;
      }

      const [nodeA, nodeB] = bridge.nodes;

      if (nodeA !== currentNode && nodeB !== currentNode) {
        continue;
      }

      const nextNode = nodeA === currentNode ? nodeB : nodeA;

      usedBridgeIds.add(bridge.id);
      route.push(nextNode);
      walk(nextNode);
      route.pop();
      usedBridgeIds.delete(bridge.id);
    }
  }

  walk(P2_START_NODE);

  return routes;
}

function analyzeClosure(closedBridgeId) {
  const routes = findRoutesCrossingEveryOpenBridge(closedBridgeId);
  const solutions = routes.filter((route) => route.at(-1) === P2_END_NODE);

  return {
    closedBridgeId,
    leavesStartAndEndAsOnlyOddNodes:
      leavesStartAndEndAsOnlyOddNodes(closedBridgeId),
    crossesEveryOpenBridge: routes.length > 0,
    endNodes: [...new Set(routes.map((route) => route.at(-1)))].sort(),
    isSolvable: solutions.length > 0,
    solutionCount: solutions.length,
    solutions: solutions.map((route) => route.join("-")).sort(),
  };
}

test("la tabla de los siete cierres posibles coincide con el diseño", () => {
  const table = P2_GRAPH.bridges.map((bridge) => {
    const analysis = analyzeClosure(bridge.id);

    return {
      closedBridgeId: analysis.closedBridgeId,
      leavesStartAndEndAsOnlyOddNodes:
        analysis.leavesStartAndEndAsOnlyOddNodes,
      crossesEveryOpenBridge: analysis.crossesEveryOpenBridge,
      endNodes: analysis.endNodes,
      isSolvable: analysis.isSolvable,
      solutionCount: analysis.solutionCount,
    };
  });

  assert.deepEqual(table, [
    {
      closedBridgeId: "B1",
      leavesStartAndEndAsOnlyOddNodes: false,
      crossesEveryOpenBridge: true,
      endNodes: ["E"],
      isSolvable: false,
      solutionCount: 0,
    },
    {
      closedBridgeId: "B2",
      leavesStartAndEndAsOnlyOddNodes: false,
      crossesEveryOpenBridge: false,
      endNodes: [],
      isSolvable: false,
      solutionCount: 0,
    },
    {
      closedBridgeId: "B3",
      leavesStartAndEndAsOnlyOddNodes: false,
      crossesEveryOpenBridge: true,
      endNodes: ["R"],
      isSolvable: false,
      solutionCount: 0,
    },
    {
      closedBridgeId: "B4",
      leavesStartAndEndAsOnlyOddNodes: false,
      crossesEveryOpenBridge: false,
      endNodes: [],
      isSolvable: false,
      solutionCount: 0,
    },
    {
      closedBridgeId: "B5",
      leavesStartAndEndAsOnlyOddNodes: false,
      crossesEveryOpenBridge: false,
      endNodes: [],
      isSolvable: false,
      solutionCount: 0,
    },
    {
      closedBridgeId: "B6",
      leavesStartAndEndAsOnlyOddNodes: true,
      crossesEveryOpenBridge: true,
      endNodes: ["L"],
      isSolvable: true,
      solutionCount: 6,
    },
    {
      closedBridgeId: "B7",
      leavesStartAndEndAsOnlyOddNodes: false,
      crossesEveryOpenBridge: false,
      endNodes: [],
      isSolvable: false,
      solutionCount: 0,
    },
  ]);
});

test("solo un cierre es a la vez plausible por paridad y resoluble", () => {
  const plausible = P2_GRAPH.bridges
    .map((bridge) => analyzeClosure(bridge.id))
    .filter((analysis) => analysis.leavesStartAndEndAsOnlyOddNodes);
  const solvable = P2_GRAPH.bridges
    .map((bridge) => analyzeClosure(bridge.id))
    .filter((analysis) => analysis.isSolvable);

  assert.deepEqual(
    plausible.map((analysis) => analysis.closedBridgeId),
    ["B6"],
  );
  assert.deepEqual(
    solvable.map((analysis) => analysis.closedBridgeId),
    ["B6"],
  );
});

test("tres cierres permiten cruzar los seis puentes, pero solo uno termina en el Molino", () => {
  const crossing = P2_GRAPH.bridges
    .map((bridge) => analyzeClosure(bridge.id))
    .filter((analysis) => analysis.crossesEveryOpenBridge);

  assert.deepEqual(
    crossing.map((analysis) => [
      analysis.closedBridgeId,
      analysis.endNodes.join(","),
    ]),
    [
      ["B1", "E"],
      ["B3", "R"],
      ["B6", "L"],
    ],
  );
});

test("las seis rutas válidas con B6 cerrado son las que acepta el validador real", () => {
  const analysis = analyzeClosure("B6");

  assert.deepEqual(analysis.solutions, [
    "E-M-R-E-N-R-L",
    "E-M-R-N-E-R-L",
    "E-N-R-E-M-R-L",
    "E-N-R-M-E-R-L",
    "E-R-M-E-N-R-L",
    "E-R-N-E-M-R-L",
  ]);

  for (const solution of analysis.solutions) {
    const validation = validateP2Route({
      closedBridgeId: "B6",
      route: solution.split("-"),
    });

    assert.equal(validation.valid, true, solution);
    assert.equal(validation.code, P2_VALIDATION_CODE.VALID, solution);
  }
});

test("ninguna ruta completa es válida con un cierre distinto de B6", () => {
  for (const bridge of P2_GRAPH.bridges) {
    if (bridge.id === "B6") {
      continue;
    }

    for (const route of findRoutesCrossingEveryOpenBridge(bridge.id)) {
      const validation = validateP2Route({
        closedBridgeId: bridge.id,
        route,
      });

      assert.equal(validation.valid, false, `${bridge.id}: ${route}`);
      assert.equal(validation.code, P2_VALIDATION_CODE.INVALID_END);
    }
  }
});

// Clasifica cada salida disponible desde `node` (con `used` ya cruzados) en
// segura -- existe al menos una continuación que cruza todos los puentes
// abiertos restantes y acaba en el Molino -- o trampa.
function classifyMoves(closedBridgeId, node, used) {
  const openBridges = P2_GRAPH.bridges.filter(
    (bridge) => bridge.id !== closedBridgeId,
  );

  function completesFrom(currentNode, usedIds) {
    if (usedIds.size === openBridges.length) {
      return currentNode === P2_END_NODE;
    }

    for (const bridge of openBridges) {
      if (usedIds.has(bridge.id)) {
        continue;
      }

      const [nodeA, nodeB] = bridge.nodes;

      if (nodeA !== currentNode && nodeB !== currentNode) {
        continue;
      }

      usedIds.add(bridge.id);
      const solvable = completesFrom(
        nodeA === currentNode ? nodeB : nodeA,
        usedIds,
      );
      usedIds.delete(bridge.id);

      if (solvable) {
        return true;
      }
    }

    return false;
  }

  const usedIds = new Set(used);

  return openBridges
    .filter(
      (bridge) => !usedIds.has(bridge.id) && bridge.nodes.includes(node),
    )
    .map((bridge) => {
      const [nodeA, nodeB] = bridge.nodes;
      const destinationNode = nodeA === node ? nodeB : nodeA;

      usedIds.add(bridge.id);
      const safe = completesFrom(destinationNode, usedIds);
      usedIds.delete(bridge.id);

      return { bridgeId: bridge.id, destinationNode, safe };
    });
}

/*
 * Primera decisión tras acertar el cierre: las tres salidas de la Entrada
 * son seguras (solvableFirstMoves = 3, deadFirstMoves = 0), y eso NO es un
 * defecto de esta topología concreta sino una propiedad demostrada del
 * espacio de diseño completo (5 nodos, 7 puentes simples).
 *
 * Demostración: para que el puzle tenga una única solución de cierre y el
 * recorrido vaya del inicio al final, tras cerrar el puente correcto el
 * grafo debe ser un camino euleriano de E a L, es decir E y L los dos
 * únicos nodos de grado impar. Una trampa en la PRIMERA arista exigiría que
 * alguna salida de E dejase el resto sin recorrido euleriano completo; con
 * 6 aristas abiertas sobre 5 nodos, eso solo puede ocurrir si el nodo final
 * tiene grado 1 (cruzar hacia él antes de tiempo lo deja aislado), y
 * entonces la paridad de Euler fuerza que E tenga grado 3 y que ninguna de
 * sus tres salidas toque L. Cada una de esas tres salidas conserva el
 * camino euleriano restante, así que todas completan. Por eso la trampa
 * real de este grafo vive en la SEGUNDA decisión (ver más abajo), y por eso
 * este test afirma deadFirstMoves === 0 en vez de exigir lo imposible.
 */
test("con B6 cerrado, las tres salidas de la Entrada son todas seguras", () => {
  const firstMoves = classifyMoves("B6", P2_START_NODE, []);
  const solvableFirstMoves = firstMoves.filter((move) => move.safe);
  const deadFirstMoves = firstMoves.filter((move) => !move.safe);

  assert.equal(solvableFirstMoves.length, 3);
  assert.equal(deadFirstMoves.length, 0);

  const puzzle = new P2Puzzle();

  puzzle.selectClosedBridge("B6");
  puzzle.startTraversal();

  assert.deepEqual(
    puzzle.getAvailableMoves(),
    firstMoves.map(({ bridgeId, destinationNode }) => ({
      bridgeId,
      destinationNode,
    })),
  );
});

/*
 * Regresión de la validación humana de PR #77: confirmar sin girar el
 * cursor resolvía el puzle entero. El cursor de salida arranca en 0 y
 * vuelve a 0 tras cada cruce (P2BridgesScene.handleMoveResult), así que esa
 * estrategia equivale exactamente a tomar siempre getAvailableMoves()[0].
 * Con el etiquetado actual esa ruta por defecto entra en la trampa y muere.
 */
test("confirmar siempre la primera salida disponible ya no resuelve el puzle", () => {
  const puzzle = new P2Puzzle();

  puzzle.selectClosedBridge("B6");
  puzzle.startTraversal();

  let result = null;
  let crossedBridges = 0;

  while (puzzle.getAvailableMoves().length > 0) {
    const [firstMove] = puzzle.getAvailableMoves();

    result = puzzle.moveTo(firstMove.destinationNode);
    crossedBridges += 1;

    if (result.code !== P2_MOVE_CODE.MOVED) {
      break;
    }
  }

  assert.notEqual(result.code, P2_MOVE_CODE.SOLVED);
  assert.equal(result.code, P2_MOVE_CODE.DEAD_END);
  assert.equal(puzzle.state.phase, P2_PHASE.FAILED);
  assert.equal(
    puzzle.state.failureCode,
    P2_VALIDATION_CODE.INCOMPLETE_ROUTE,
  );
  assert.equal(crossedBridges, 3);
  assert.deepEqual(puzzle.state.route, ["E", "N", "R", "L"]);
  assert.deepEqual(puzzle.state.usedBridgeIds, ["B1", "B3", "B2"]);
  assert.deepEqual(puzzle.getRemainingBridgeIds(), ["B4", "B5", "B7"]);
});

/*
 * Punto de decisión real: con el puente correcto ya cerrado, el jugador
 * sigue teniendo que razonar. Este test no da por supuesto en qué nodo
 * ocurre: recorre por backtracking todos los estados alcanzables y busca
 * los que ofrecen a la vez una salida segura y una trampa. Antes de
 * recablear la topología no existía ninguno: tras acertar el cierre,
 * cualquier paseo llegaba al final.
 */
test("con B6 cerrado existen decisiones con salida segura y salida trampa", () => {
  const mixedDecisions = [];

  function explore(node, used) {
    const moves = classifyMoves("B6", node, used);
    const safeMoves = moves.filter((move) => move.safe);

    if (moves.length >= 2 && safeMoves.length > 0 && safeMoves.length < moves.length) {
      mixedDecisions.push({ node, moves });
    }

    for (const move of moves) {
      explore(move.destinationNode, [...used, move.bridgeId]);
    }
  }

  explore(P2_START_NODE, []);

  assert.ok(
    mixedDecisions.length > 0,
    "el grafo debe ofrecer al menos una decisión con trampa real",
  );

  // La trampa siempre aparece en la segunda decisión, nunca en la primera.
  for (const decision of mixedDecisions) {
    assert.notEqual(decision.node, P2_START_NODE);
  }

  // Y la primera salida que ofrece el motor en esas decisiones es
  // precisamente la trampa: por eso confirmar sin girar el cursor falla.
  const trappedByDefault = mixedDecisions.filter(
    (decision) => decision.moves[0].safe === false,
  );

  assert.ok(trappedByDefault.length > 0);
});

test("con B6 cerrado la Isla del Reloj abre tres salidas y una arruina el recorrido", () => {
  const puzzle = new P2Puzzle();

  puzzle.selectClosedBridge("B6");
  puzzle.startTraversal();

  assert.equal(puzzle.moveTo("R").code, P2_MOVE_CODE.MOVED);
  assert.deepEqual(puzzle.getAvailableMoves(), [
    { bridgeId: "B2", destinationNode: "L" },
    { bridgeId: "B3", destinationNode: "N" },
    { bridgeId: "B4", destinationNode: "M" },
  ]);
  assert.deepEqual(
    classifyMoves("B6", "R", ["B7"]).map((move) => [move.bridgeId, move.safe]),
    [
      ["B2", false],
      ["B3", true],
      ["B4", true],
    ],
  );
});

test("con B6 cerrado, cruzar B2 desde la Isla del Reloj es un callejón sin salida", () => {
  const puzzle = new P2Puzzle();

  puzzle.selectClosedBridge("B6");
  puzzle.startTraversal();
  puzzle.moveTo("R");

  const result = puzzle.moveTo("L");

  assert.equal(result.code, P2_MOVE_CODE.DEAD_END);
  assert.equal(puzzle.state.phase, P2_PHASE.FAILED);
  assert.equal(
    puzzle.state.failureCode,
    P2_VALIDATION_CODE.INCOMPLETE_ROUTE,
  );
  assert.deepEqual(result.remainingBridgeIds, ["B1", "B3", "B4", "B5"]);
});

test("con B6 cerrado, cruzar B4 desde la Isla del Reloj mantiene el recorrido completable", () => {
  const puzzle = new P2Puzzle();

  puzzle.selectClosedBridge("B6");
  puzzle.startTraversal();
  puzzle.moveTo("R");

  assert.equal(puzzle.moveTo("M").code, P2_MOVE_CODE.MOVED);

  let result;

  for (const nodeId of ["E", "N", "R", "L"]) {
    result = puzzle.moveTo(nodeId);
  }

  assert.equal(result.code, P2_MOVE_CODE.SOLVED);
  assert.equal(puzzle.state.phase, P2_PHASE.SOLVED);
  assert.deepEqual(puzzle.state.route, [
    "E",
    "R",
    "M",
    "E",
    "N",
    "R",
    "L",
  ]);
});
