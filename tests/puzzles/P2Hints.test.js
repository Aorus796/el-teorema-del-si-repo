import test from "node:test";
import assert from "node:assert/strict";
import { P2_HINTS, getP2Hint } from "../../src/puzzles/p2-bridges/P2Hints.js";
import {
  P2_END_NODE,
  P2_GRAPH,
  P2_START_NODE,
} from "../../src/puzzles/p2-bridges/P2Graph.js";
import {
  P2_VALIDATION_CODE,
  validateP2Route,
} from "../../src/puzzles/p2-bridges/P2Validator.js";

const OLD_LEVEL_2_TEXT =
  "Al cerrar el puente correcto, solo la Entrada y el Molino quedan impares.";
const PREVIOUS_LEVEL_2_TEXT =
  "Antes de cerrar nada, cuenta cuántos puentes toca cada lugar. El puente correcto es el único cuyo cierre cambia esa cuenta justo en los lugares por donde empiezas y terminas tu recorrido.";

// La palabra "impar" ya no se prohíbe aquí: el nivel 1 ya la usa
// literalmente ("...con un número impar de puentes disponibles."), así que
// vetarla solo en el nivel 2 no ocultaba nada que el jugador no pudiera leer
// un paso antes. La corrección lógica de esta pista (que el nodo de inicio y
// el de fin queden como los únicos dos con conteo impar tras cerrar el
// puente correcto) exige poder nombrar la propiedad con precisión; lo que sí
// se sigue prohibiendo, por ser lo que realmente resolvería el puzle sin
// pensar, es nombrar el puente concreto o la ruta completa.
const BRIDGE_ID_PATTERN = /\bB[1-7]\b/;

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

function bridgesThatLeaveStartAndEndAsOnlyOddNodes() {
  return P2_GRAPH.bridges
    .map((bridge) => bridge.id)
    .filter((bridgeId) => {
      const degrees = degreesWithoutBridge(bridgeId);
      const oddNodes = P2_GRAPH.nodes.filter(
        (nodeId) => degrees[nodeId] % 2 !== 0,
      );

      return (
        oddNodes.length === 2 &&
        oddNodes.includes(P2_START_NODE) &&
        oddNodes.includes(P2_END_NODE)
      );
    });
}

function parseLevel3Hint() {
  const match = getP2Hint(3).text.match(
    /Cierra (B[1-7]) y prueba ([A-Z](?:-[A-Z])+):/u,
  );

  assert.notEqual(
    match,
    null,
    "La pista de nivel 3 debe nombrar un puente y una ruta.",
  );

  return {
    closedBridgeId: match[1],
    route: match[2].split("-"),
  };
}

test("la pista de nivel 2 de P2 ya no regala el criterio de paridad completo", () => {
  const hint = getP2Hint(2);

  assert.notEqual(hint.text, OLD_LEVEL_2_TEXT);
  assert.notEqual(hint.text, PREVIOUS_LEVEL_2_TEXT);
  assert.equal(BRIDGE_ID_PATTERN.test(hint.text), false);
  assert.equal(hint.text.includes(parseLevel3Hint().route.join("-")), false);
});

test("la pista de nivel 1 de P2 es literalmente cierta contra el grafo real", () => {
  // El nivel 1 pide empezar por los lugares con un número impar de puentes.
  // Solo es un consejo honesto si el nodo de inicio real tiene grado impar
  // antes de cerrar nada: si no, la pista mandaría al jugador a un lugar por
  // el que ni siquiera puede empezar.
  const degrees = degreesWithoutBridge(null);

  assert.equal(getP2Hint(1).text.includes("impar"), true);
  assert.equal(degrees[P2_START_NODE] % 2, 1);
});

test("la pista de nivel 2 de P2 es lógicamente correcta contra el grafo real", () => {
  // Verificación de regresión del hallazgo de reviewer: la propiedad que
  // describe la pista -- que exista un único puente cuyo cierre deja a
  // Entrada y Molino como los únicos dos lugares con un número impar de
  // conexiones -- se comprueba aquí sobre P2_GRAPH directamente, no sobre
  // una copia local de la tabla de puentes. Una copia local haría que este
  // test siguiera pasando aunque el grafo real cambiara.
  const candidates = bridgesThatLeaveStartAndEndAsOnlyOddNodes();

  assert.equal(candidates.length, 1);
  assert.deepEqual(candidates, ["B6"]);
});

test("la pista de nivel 3 de P2 da el puente y una ruta que el motor acepta", () => {
  const { closedBridgeId, route } = parseLevel3Hint();

  assert.equal(
    getP2Hint(3).text,
    "Cierra B6 y prueba E-N-R-E-M-R-L: ningún puente se repite.",
  );

  // El puente que nombra el nivel 3 debe ser exactamente el que el criterio
  // de paridad del nivel 2 señala: si divergieran, las dos pistas se
  // contradirían entre sí.
  assert.deepEqual(bridgesThatLeaveStartAndEndAsOnlyOddNodes(), [
    closedBridgeId,
  ]);

  const validation = validateP2Route({ closedBridgeId, route });

  assert.equal(validation.valid, true);
  assert.equal(validation.code, P2_VALIDATION_CODE.VALID);
});

test("P2 sigue definiendo exactamente tres pistas inmutables", () => {
  assert.equal(P2_HINTS.length, 3);
  assert.equal(Object.isFrozen(P2_HINTS), true);
});
