import assert from "node:assert/strict";
import test from "node:test";
import {
  GameState,
  SAVE_FORMAT_VERSION,
} from "../../src/state/GameState.js";
import { P2_PHASE } from "../../src/puzzles/p2-bridges/P2State.js";

/*
 * Compatibilidad de los guardados de v1.1 con la topología recableada de
 * P2 (B5 dejó de unir Mercado-Molino para unir Entrada-Mercado). El formato
 * de guardado NO cambia: siguen existiendo los mismos siete puentes y los
 * mismos cinco lugares, así que ningún guardado anterior deja de cargar.
 * Lo que sí puede quedar obsoleto es el significado geométrico de un
 * recorrido a medias guardado con la topología antigua, y eso es lo que
 * comprueban estos cuatro casos.
 */

const V1_1_SOLVED_ROUTE = ["E", "R", "N", "L", "R", "M", "L"];
const V1_1_SOLVED_USED_BRIDGE_IDS = ["B2", "B3", "B6", "B7", "B4", "B5"];

function buildSaveWithP2(p2SaveData, overrides = {}) {
  const saved = new GameState().toSaveData();

  saved.puzzles.p2 = p2SaveData;
  saved.flags = { ...saved.flags, ...(overrides.flags ?? {}) };

  if (overrides.notebook) {
    saved.notebook = overrides.notebook;
  }

  if (overrides.objectiveId) {
    saved.objectiveId = overrides.objectiveId;
  }

  assert.equal(saved.formatVersion, SAVE_FORMAT_VERSION);

  return saved;
}

function restoreWith(p2SaveData, overrides) {
  const state = new GameState();

  state.restore(buildSaveWithP2(p2SaveData, overrides));

  return state;
}

test("un guardado de v1.1 con P2 sin empezar se restaura sin cambios", () => {
  const p2SaveData = {
    lifecycle: { id: "p2-bridges", status: "ready", attemptCount: 0 },
    phase: "planning",
    closedBridgeId: null,
    currentNode: "E",
    route: ["E"],
    usedBridgeIds: [],
    hintsRead: [],
    failureCode: null,
  };

  const state = restoreWith(p2SaveData);

  assert.deepEqual(state.puzzles.p2.toSaveData(), p2SaveData);
});

test("un guardado de v1.1 en planificación conserva el puente cerrado aunque ya no sea la solución", () => {
  const p2SaveData = {
    lifecycle: { id: "p2-bridges", status: "ready", attemptCount: 0 },
    phase: "planning",
    closedBridgeId: "B1",
    currentNode: "E",
    route: ["E"],
    usedBridgeIds: [],
    hintsRead: [1, 2],
    failureCode: null,
  };

  const state = restoreWith(p2SaveData);

  // B1 era la solución de v1.1 y ya no lo es, pero marcarlo es inocuo: el
  // jugador lo ve señalado y puede cambiarlo antes de empezar.
  assert.deepEqual(state.puzzles.p2.toSaveData(), p2SaveData);
  assert.equal(state.puzzles.p2.phase, P2_PHASE.PLANNING);
  assert.equal(state.puzzles.p2.closedBridgeId, "B1");
});

test("un guardado de v1.1 a medias con pasos incoherentes vuelve a la planificación conservando las pistas", () => {
  // Recorrido válido con la topología de v1.1 (B5 unía Mercado y Molino):
  // E-R por B2, R-M por B4 y M-L por B5. Con la topología nueva, M-L ya no
  // existe, así que este historial dejó de representar aristas reales.
  const p2SaveData = {
    lifecycle: { id: "p2-bridges", status: "active", attemptCount: 1 },
    phase: "traversing",
    closedBridgeId: "B1",
    currentNode: "L",
    route: ["E", "R", "M", "L"],
    usedBridgeIds: ["B2", "B4", "B5"],
    hintsRead: [1, 2],
    failureCode: null,
  };

  let state;

  assert.doesNotThrow(() => {
    state = restoreWith(p2SaveData);
  });

  assert.equal(state.puzzles.p2.phase, P2_PHASE.PLANNING);
  assert.equal(state.puzzles.p2.currentNode, "E");
  assert.deepEqual(state.puzzles.p2.route, ["E"]);
  assert.deepEqual(state.puzzles.p2.usedBridgeIds, []);
  assert.equal(state.puzzles.p2.closedBridgeId, null);
  assert.equal(state.puzzles.p2.failureCode, null);
  assert.deepEqual(state.puzzles.p2.hintsRead, [1, 2]);
  // Mismo criterio que el reinicio dentro del juego: volver a planificar no
  // borra los intentos ya realizados.
  assert.equal(state.puzzles.p2.lifecycle.attemptCount, 1);
  assert.equal(state.puzzles.p2.lifecycle.status, "ready");
});

/*
 * Recorridos guardados con la topología de v1.1 cuyos pasos siguen siendo
 * aristas reales del grafo nuevo, pero que bajo ese grafo terminan en un
 * lugar sin ningún puente abierto por cruzar. Sin reinicio, la partida
 * quedaría bloqueada para siempre: durante el recorrido la escena solo
 * atiende girar y avanzar, y reiniciar pertenece a la fase de fallo, así que
 * P2 no podría completarse nunca y la Biblioteca no se desbloquearía.
 */
const STUCK_V1_1_TRAVERSALS = [
  {
    closedBridgeId: "B6",
    currentNode: "L",
    route: ["E", "R", "L"],
    usedBridgeIds: ["B2", "B7"],
  },
  {
    closedBridgeId: "B6",
    currentNode: "L",
    route: ["E", "N", "R", "L"],
    usedBridgeIds: ["B1", "B3", "B7"],
  },
  {
    closedBridgeId: "B7",
    currentNode: "L",
    route: ["E", "N", "L"],
    usedBridgeIds: ["B1", "B6"],
  },
  {
    closedBridgeId: "B7",
    currentNode: "L",
    route: ["E", "R", "N", "L"],
    usedBridgeIds: ["B2", "B3", "B6"],
  },
];

for (const traversal of STUCK_V1_1_TRAVERSALS) {
  const description =
    `un guardado de v1.1 a medias que con la topología nueva se queda sin ` +
    `salidas (cierra ${traversal.closedBridgeId}, ruta ` +
    `${traversal.route.join("-")}) vuelve a la planificación`;

  test(description, () => {
    const p2SaveData = {
      lifecycle: { id: "p2-bridges", status: "active", attemptCount: 2 },
      phase: "traversing",
      closedBridgeId: traversal.closedBridgeId,
      currentNode: traversal.currentNode,
      route: [...traversal.route],
      usedBridgeIds: [...traversal.usedBridgeIds],
      hintsRead: [1, 2],
      failureCode: null,
    };

    let state;

    assert.doesNotThrow(() => {
      state = restoreWith(p2SaveData);
    });

    assert.equal(state.puzzles.p2.phase, P2_PHASE.PLANNING);
    assert.equal(state.puzzles.p2.currentNode, "E");
    assert.deepEqual(state.puzzles.p2.route, ["E"]);
    assert.deepEqual(state.puzzles.p2.usedBridgeIds, []);
    assert.equal(state.puzzles.p2.closedBridgeId, null);
    assert.equal(state.puzzles.p2.failureCode, null);
    assert.deepEqual(state.puzzles.p2.hintsRead, [1, 2]);
    assert.equal(state.puzzles.p2.lifecycle.attemptCount, 2);
    assert.equal(state.puzzles.p2.lifecycle.status, "ready");
  });
}

test("un recorrido a medias que aún tiene salidas con la topología nueva no se reinicia", () => {
  // E-N por B1 y N-R por B3 siguen existiendo, y desde la Isla del Reloj
  // quedan puentes abiertos por cruzar: es progreso real, no un bloqueo.
  const p2SaveData = {
    lifecycle: { id: "p2-bridges", status: "active", attemptCount: 1 },
    phase: "traversing",
    closedBridgeId: "B6",
    currentNode: "R",
    route: ["E", "N", "R"],
    usedBridgeIds: ["B1", "B3"],
    hintsRead: [],
    failureCode: null,
  };

  const state = restoreWith(p2SaveData);

  assert.deepEqual(state.puzzles.p2.toSaveData(), p2SaveData);
});

test("un recorrido en curso ya terminado con éxito bajo la topología nueva no se reinicia", () => {
  // Los seis puentes abiertos cruzados y el paseo termina en el molino: no
  // tiene salidas porque no le queda ningún puente, no porque esté encallado.
  // E-N(B1), N-R(B3), R-M(B4), M-E(B5), E-R(B2) y R-L(B7), con B6 cerrado.
  const p2SaveData = {
    lifecycle: { id: "p2-bridges", status: "active", attemptCount: 1 },
    phase: "traversing",
    closedBridgeId: "B6",
    currentNode: "L",
    route: ["E", "N", "R", "M", "E", "R", "L"],
    usedBridgeIds: ["B1", "B3", "B4", "B5", "B2", "B7"],
    hintsRead: [],
    failureCode: null,
  };

  const state = restoreWith(p2SaveData);

  assert.deepEqual(state.puzzles.p2.toSaveData(), p2SaveData);
});

test("un fallo guardado con la topología nueva conserva la fase de fallo", () => {
  // Quedarse sin salidas es justamente lo que define un fallo, y en esa fase
  // la escena ya ofrece reiniciar: reiniciarlo al restaurar borraría el
  // mensaje de fallo de una partida perfectamente legítima.
  const p2SaveData = {
    lifecycle: { id: "p2-bridges", status: "active", attemptCount: 1 },
    phase: "failed",
    closedBridgeId: "B6",
    currentNode: "L",
    route: ["E", "R", "L"],
    usedBridgeIds: ["B2", "B7"],
    hintsRead: [1],
    failureCode: "incomplete_route",
  };

  const state = restoreWith(p2SaveData);

  assert.deepEqual(state.puzzles.p2.toSaveData(), p2SaveData);
});

test("un fallo guardado de v1.1 con pasos incoherentes vuelve a la planificación conservando las pistas", () => {
  // Mismo historial imposible que el caso a medias (M-L por B5 ya no es una
  // arista real), pero guardado ya en fase de fallo. Un fallo cuya ruta no
  // puede existir con la topología nueva no describe nada que el jugador
  // pueda revisar, así que se devuelve a planificar como cualquier otro
  // recorrido incoherente.
  const p2SaveData = {
    lifecycle: { id: "p2-bridges", status: "active", attemptCount: 1 },
    phase: "failed",
    closedBridgeId: "B1",
    currentNode: "L",
    route: ["E", "R", "M", "L"],
    usedBridgeIds: ["B2", "B4", "B5"],
    hintsRead: [1, 2],
    failureCode: "incomplete_route",
  };

  let state;

  assert.doesNotThrow(() => {
    state = restoreWith(p2SaveData);
  });

  assert.equal(state.puzzles.p2.phase, P2_PHASE.PLANNING);
  assert.equal(state.puzzles.p2.currentNode, "E");
  assert.deepEqual(state.puzzles.p2.route, ["E"]);
  assert.deepEqual(state.puzzles.p2.usedBridgeIds, []);
  assert.equal(state.puzzles.p2.closedBridgeId, null);
  assert.equal(state.puzzles.p2.failureCode, null);
  assert.deepEqual(state.puzzles.p2.hintsRead, [1, 2]);
  assert.equal(state.puzzles.p2.lifecycle.attemptCount, 1);
  assert.equal(state.puzzles.p2.lifecycle.status, "ready");
});

test("un guardado de v1.1 a medias con pasos que siguen siendo aristas reales se restaura tal cual", () => {
  // E-R por B2 sigue existiendo con la topología nueva: no hay nada que
  // reiniciar, y reiniciarlo perdería progreso real del jugador.
  const p2SaveData = {
    lifecycle: { id: "p2-bridges", status: "active", attemptCount: 1 },
    phase: "traversing",
    closedBridgeId: "B1",
    currentNode: "R",
    route: ["E", "R"],
    usedBridgeIds: ["B2"],
    hintsRead: [1],
    failureCode: null,
  };

  const state = restoreWith(p2SaveData);

  assert.deepEqual(state.puzzles.p2.toSaveData(), p2SaveData);
});

test("un guardado de v1.1 con P2 ya resuelto sigue resuelto y conserva su evidencia", () => {
  const p2SaveData = {
    lifecycle: { id: "p2-bridges", status: "solved", attemptCount: 1 },
    phase: "solved",
    closedBridgeId: "B1",
    currentNode: "L",
    route: [...V1_1_SOLVED_ROUTE],
    usedBridgeIds: [...V1_1_SOLVED_USED_BRIDGE_IDS],
    hintsRead: [1],
    failureCode: null,
  };

  const state = restoreWith(p2SaveData, {
    flags: { p2EvidenceFound: true },
    objectiveId: "inspect-p2-evidence",
    notebook: [
      {
        id: "p2-bridges-solution",
        title: "El paseo imposible",
        text: "No era necesario cruzar los siete puentes. Al reconocer cuál estaba cerrado, los seis restantes formaban un recorrido posible desde la entrada hasta el molino.",
      },
    ],
  });

  // Un puzle ya resuelto por un jugador real nunca se revalida ni se
  // reinicia: perder progreso completado sería una regresión inaceptable.
  assert.equal(state.puzzles.p2.phase, P2_PHASE.SOLVED);
  assert.deepEqual(state.puzzles.p2.toSaveData(), p2SaveData);
  assert.equal(state.flags.p2EvidenceFound, true);
  assert.equal(
    state.notebook.some((entry) => entry.id === "p2-bridges-solution"),
    true,
  );
});
