import assert from "node:assert/strict";
import test from "node:test";
import { GameState, SAVE_FORMAT_VERSION } from "../../src/state/GameState.js";
import { P2_PHASE } from "../../src/puzzles/p2-bridges/P2State.js";

test("GameState no duplica entradas del cuaderno", () => {
  const state = new GameState();

  assert.equal(state.unlockPrototypeEntry(), true);
  assert.equal(state.unlockPrototypeEntry(), false);
  assert.equal(state.notebook.length, 1);
});

test("GameState restaura una partida valida", () => {
  const state = new GameState();

  state.restore({
    formatVersion: SAVE_FORMAT_VERSION,
    scene: "dev-world",
    player: {
      x: 112,
      y: 96,
      facing: "left",
    },
    flags: {
      examinedPrototypeSign: true,
    },
    notebook: [
      {
        id: "entry",
        title: "Titulo",
        text: "Texto",
      },
    ],
  });

  assert.deepEqual(state.player, {
    x: 112,
    y: 96,
    facing: "left",
  });
  assert.equal(state.flags.examinedPrototypeSign, true);
  assert.equal(state.notebook.length, 1);
});

test("GameState rechaza versiones incompatibles", () => {
  const state = new GameState();

  assert.throws(
    () =>
      state.restore({
        formatVersion: 999,
      }),
    /no es compatible/,
  );
});

test("GameState guarda y restaura el progreso de P2", () => {
  const originalState = new GameState();

  originalState.puzzles.p2.selectClosedBridge("B1");
  originalState.puzzles.p2.startTraversal();
  originalState.puzzles.p2.registerStep({
    nodeId: "R",
    bridgeId: "B2",
  });

  const restoredState = new GameState();
  restoredState.restore(originalState.toSaveData());

  assert.equal(
    restoredState.puzzles.p2.phase,
    P2_PHASE.TRAVERSING,
  );
  assert.equal(restoredState.puzzles.p2.closedBridgeId, "B1");
  assert.equal(restoredState.puzzles.p2.currentNode, "R");
  assert.deepEqual(restoredState.puzzles.p2.route, ["E", "R"]);
  assert.deepEqual(restoredState.puzzles.p2.usedBridgeIds, ["B2"]);
});

test("GameState no duplica la entrada de cuaderno de P2", () => {
  const state = new GameState();

  assert.equal(state.unlockP2Entry(), true);
  assert.equal(state.unlockP2Entry(), false);
  assert.equal(state.notebook.length, 1);
  assert.equal(state.notebook[0].id, "p2-bridges-solution");
});
