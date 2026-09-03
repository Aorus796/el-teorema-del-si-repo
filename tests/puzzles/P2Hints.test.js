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
  findBridge,
  validateP2Route,
} from "../../src/puzzles/p2-bridges/P2Validator.js";

const OLD_LEVEL_2_TEXT =
  "Al cerrar el puente correcto, solo la Entrada y el Molino quedan impares.";
const PREVIOUS_LEVEL_2_TEXT =
  "Antes de cerrar nada, cuenta cuántos puentes toca cada lugar. El puente correcto es el único cuyo cierre cambia esa cuenta justo en los lugares por donde empiezas y terminas tu recorrido.";
const CURRENT_LEVEL_1_TEXT =
  "Empieza por los lugares con un número impar de puentes disponibles.";
const CURRENT_LEVEL_2_TEXT =
  "Antes de cerrar nada, cuenta las conexiones de cada lugar. El puente correcto es el que deja el inicio y el final como los únicos dos con un número impar de conexiones.";
const WALKTHROUGH_LEVEL_3_TEXT =
  "Cierra B6 y prueba E-N-R-E-M-R-L: ningún puente se repite.";

// La palabra "impar" ya no se prohíbe aquí: el nivel 1 ya la usa
// literalmente ("...con un número impar de puentes disponibles."), así que
// vetarla solo en el nivel 2 no ocultaba nada que el jugador no pudiera leer
// un paso antes. La corrección lógica de esta pista (que el nodo de inicio y
// el de fin queden como los únicos dos con conteo impar tras cerrar el
// puente correcto) exige poder nombrar la propiedad con precisión; lo que sí
// se sigue prohibiendo, por ser lo que realmente resolvería el puzle sin
// pensar, es nombrar el puente concreto o la ruta completa.
const BRIDGE_ID_PATTERN = /\bB[1-7]\b/;
// Una ruta del puzle se escribe como letras de nodo unidas por guiones
// ("E-N-R-..."). Ninguna pista debe contener algo con esa forma. El
// cuantificador es {1,} y no {2,} a propósito: un tramo de dos nodos como
// "R-L" ya nombra literalmente un trozo de la solución (el final del
// recorrido), así que también debe quedar prohibido.
const ROUTE_PATTERN = /\b[A-Z](-[A-Z]){1,}\b/;
// La pista de nivel 3 solo es honesta si afirma que queda UNA conexión
// abierta. Este patrón ancla el texto a esa cantidad singular para que los
// tests de propiedad del grafo dejen de pasar si alguien reescribe la pista
// con otra cantidad ("dos conexiones abiertas") sin tocar el grafo.
const SINGLE_OPEN_CONNECTION_PATTERN = /\buna(?:\s+sola)?\s+conexión\s+abierta\b/;

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

function correctClosedBridgeId() {
  const candidates = bridgesThatLeaveStartAndEndAsOnlyOddNodes();

  assert.equal(
    candidates.length,
    1,
    "El grafo real debe tener un único puente de cierre correcto.",
  );

  return candidates[0];
}

function openBridgesAtNode(nodeId, closedBridgeId) {
  return P2_GRAPH.bridges.filter(
    (bridge) => bridge.id !== closedBridgeId && bridge.nodes.includes(nodeId),
  );
}

test("la pista de nivel 2 de P2 ya no regala el criterio de paridad completo", () => {
  const hint = getP2Hint(2);

  assert.notEqual(hint.text, OLD_LEVEL_2_TEXT);
  assert.notEqual(hint.text, PREVIOUS_LEVEL_2_TEXT);
  assert.equal(BRIDGE_ID_PATTERN.test(hint.text), false);
  assert.equal(ROUTE_PATTERN.test(hint.text), false);
  assert.notEqual(hint.text, getP2Hint(3).text);
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

test("las pistas de nivel 1 y 2 de P2 conservan su texto exacto", () => {
  // El rebalanceo de la pista de nivel 3 no debe arrastrar cambios de texto
  // en los dos niveles anteriores, que ya cumplen su función.
  assert.equal(getP2Hint(1).text, CURRENT_LEVEL_1_TEXT);
  assert.equal(getP2Hint(2).text, CURRENT_LEVEL_2_TEXT);
});

test("la pista de nivel 3 de P2 ya no es un walkthrough de la solución", () => {
  const hint = getP2Hint(3);

  // Guarda de regresión explícita: el texto antiguo nombraba el puente de
  // cierre y una ruta válida completa, es decir, resolvía el puzle por el
  // jugador.
  assert.notEqual(hint.text, WALKTHROUGH_LEVEL_3_TEXT);
  assert.equal(BRIDGE_ID_PATTERN.test(hint.text), false);
  assert.equal(ROUTE_PATTERN.test(hint.text), false);
  assert.equal(hint.text.includes(correctClosedBridgeId()), false);
  assert.notEqual(hint.text, getP2Hint(1).text);
  assert.notEqual(hint.text, getP2Hint(2).text);
});

test("la pista de nivel 3 de P2 no reutiliza la palabra 'destino' del estado de movimiento", () => {
  // Durante el recorrido, el mismo cuadro de estado muestra
  // "Destino <nodo> por <puente>." refiriéndose al nodo de la siguiente
  // jugada. Si la pista usara "destino" para la meta final del recorrido,
  // la misma palabra significaría dos cosas distintas en el mismo sitio de
  // la pantalla.
  const hint = getP2Hint(3);

  assert.equal(/destino/i.test(hint.text), false);
});

test("la pista de nivel 3 de P2 describe una propiedad real del grafo", () => {
  // La pista afirma que, con el puente correcto cerrado, al lugar de llegada
  // solo le queda una conexión abierta. Se comprueba contra P2_GRAPH, no
  // contra una copia local de la tabla de puentes, y además contra el texto
  // real de la pista: si el texto dijera otra cantidad, este test debe
  // fallar aunque el grafo siga siendo el mismo.
  const closedBridgeId = correctClosedBridgeId();
  const openBridgesAtEnd = openBridgesAtNode(P2_END_NODE, closedBridgeId);

  assert.equal(openBridgesAtEnd.length, 1);
  assert.equal(
    SINGLE_OPEN_CONNECTION_PATTERN.test(getP2Hint(3).text),
    true,
    "La pista de nivel 3 debe afirmar que queda una sola conexión abierta.",
  );
});

test("la pista de nivel 3 de P2 advierte de un riesgo que el motor confirma", () => {
  // La segunda mitad de la pista avisa de quedarse varado: cruzar esa única
  // conexión antes de agotar las demás deja puentes sin recorrer y el motor
  // rechaza el intento. El texto se ancla aquí también, para que el aviso no
  // pueda divergir de la cantidad real de conexiones que describe el grafo.
  const hintText = getP2Hint(3).text;

  assert.equal(SINGLE_OPEN_CONNECTION_PATTERN.test(hintText), true);
  assert.equal(hintText.includes("varado"), true);

  const closedBridgeId = correctClosedBridgeId();
  const [lastBridgeToEnd] = openBridgesAtNode(P2_END_NODE, closedBridgeId);
  const nodeBeforeEnd = lastBridgeToEnd.nodes.find(
    (nodeId) => nodeId !== P2_END_NODE,
  );
  const bridgeFromStart = findBridge(P2_GRAPH, P2_START_NODE, nodeBeforeEnd);

  assert.notEqual(
    bridgeFromStart,
    null,
    "Debe existir un atajo real que permita llegar pronto al destino.",
  );
  assert.notEqual(bridgeFromStart.id, closedBridgeId);

  const validation = validateP2Route({
    closedBridgeId,
    route: [P2_START_NODE, nodeBeforeEnd, P2_END_NODE],
  });

  assert.equal(validation.valid, false);
  assert.equal(validation.code, P2_VALIDATION_CODE.INCOMPLETE_ROUTE);
  assert.equal(validation.remainingBridgeIds.length > 0, true);
});

test("P2 sigue definiendo exactamente tres pistas inmutables", () => {
  assert.equal(P2_HINTS.length, 3);
  assert.equal(Object.isFrozen(P2_HINTS), true);
  assert.deepEqual(
    P2_HINTS.map((hint) => hint.level),
    [1, 2, 3],
  );
});
