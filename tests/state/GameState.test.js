import assert from "node:assert/strict";
import test from "node:test";
import { GameState, SAVE_FORMAT_VERSION } from "../../src/state/GameState.js";

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
