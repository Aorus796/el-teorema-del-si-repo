import test from "node:test";
import assert from "node:assert/strict";
import { P2_HINTS, getP2Hint } from "../../src/puzzles/p2-bridges/P2Hints.js";

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
const FULL_ROUTE = "E-R-N-L-R-M-L";

test("la pista de nivel 2 de P2 ya no regala el criterio de paridad completo", () => {
  const hint = getP2Hint(2);

  assert.notEqual(hint.text, OLD_LEVEL_2_TEXT);
  assert.notEqual(hint.text, PREVIOUS_LEVEL_2_TEXT);
  assert.equal(BRIDGE_ID_PATTERN.test(hint.text), false);
  assert.equal(hint.text.includes(FULL_ROUTE), false);
});

test("la pista de nivel 2 de P2 es lógicamente correcta contra el grafo real", () => {
  // Verificación de regresión del hallazgo de reviewer: antes de cerrar
  // nada, ningún puente conecta directamente Entrada (inicio) con Molino
  // (fin), así que cerrar el puente correcto no puede "cambiar la cuenta"
  // simultáneamente en ambos. La propiedad real -- comprobada aquí
  // recorriendo los grados de los 5 nodos para los 7 cierres posibles -- es
  // que B1 es el único puente cuyo cierre deja a Entrada y Molino como los
  // únicos dos lugares con un número impar de conexiones.
  const nodes = ["E", "N", "R", "M", "L"];
  const bridges = [
    ["B1", "E", "N"],
    ["B2", "E", "R"],
    ["B3", "N", "R"],
    ["B4", "R", "M"],
    ["B5", "M", "L"],
    ["B6", "N", "L"],
    ["B7", "R", "L"],
  ];

  function degreesWithoutBridge(closedBridgeId) {
    const degrees = Object.fromEntries(nodes.map((node) => [node, 0]));

    for (const [bridgeId, a, b] of bridges) {
      if (bridgeId === closedBridgeId) {
        continue;
      }

      degrees[a] += 1;
      degrees[b] += 1;
    }

    return degrees;
  }

  const bridgesThatIsolateStartAndEndAsOnlyOddNodes = bridges
    .map(([bridgeId]) => bridgeId)
    .filter((bridgeId) => {
      const degrees = degreesWithoutBridge(bridgeId);
      const oddNodes = nodes.filter((node) => degrees[node] % 2 !== 0);

      return (
        oddNodes.length === 2 &&
        oddNodes.includes("E") &&
        oddNodes.includes("L")
      );
    });

  assert.deepEqual(bridgesThatIsolateStartAndEndAsOnlyOddNodes, ["B1"]);
});

test("la pista de nivel 3 de P2 sigue intacta y da el puente y la ruta completa", () => {
  const hint = getP2Hint(3);

  assert.equal(hint.text, "Cierra B1 y prueba E-R-N-L-R-M-L: ningún puente se repite.");
});

test("P2 sigue definiendo exactamente tres pistas inmutables", () => {
  assert.equal(P2_HINTS.length, 3);
  assert.equal(Object.isFrozen(P2_HINTS), true);
});
