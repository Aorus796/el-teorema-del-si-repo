import assert from "node:assert/strict";
import test from "node:test";
import { GameState } from "../../src/state/GameState.js";

test("GameState inicia el prólogo en la Plaza del Axioma", () => {
  const state = new GameState();

  assert.equal(state.world.currentMapId, "axiom-plaza");
  assert.deepEqual(state.getPlayerState(), {
    x: 240,
    y: 192,
    facing: "up",
  });
  assert.equal(state.objectiveId, "review-preparations-board");
});

test("GameState mantiene una posición independiente para cada mapa", () => {
  const state = new GameState();

  state.setPlayerState({
    x: 304,
    y: 208,
    facing: "right",
  });

  state.changeMap("seven-bridges-walk", {
    x: 48,
    y: 192,
    facing: "right",
  });

  state.setPlayerState({
    x: 96,
    y: 176,
    facing: "up",
  });

  state.changeMap("axiom-plaza");

  assert.deepEqual(state.getPlayerState(), {
    x: 304,
    y: 208,
    facing: "right",
  });

  assert.deepEqual(state.getPlayerState("seven-bridges-walk"), {
    x: 96,
    y: 176,
    facing: "up",
  });
});

test("GameState guarda y restaura el progreso del prólogo", () => {
  const originalState = new GameState();

  originalState.setPlayerState({
    x: 320,
    y: 208,
    facing: "right",
  });

  originalState.flags.preparationsBoardRead = true;
  originalState.flags.brideNoteReceived = true;
  originalState.flags.sevenBridgesUnlocked = true;
  originalState.objectiveId = "investigate-seven-bridges";

  originalState.changeMap("seven-bridges-walk", {
    x: 48,
    y: 192,
    facing: "right",
  });

  originalState.setPlayerState({
    x: 112,
    y: 160,
    facing: "up",
  });

  const restoredState = new GameState();
  restoredState.restore(originalState.toSaveData());

  assert.equal(restoredState.world.currentMapId, "seven-bridges-walk");
  assert.deepEqual(restoredState.getPlayerState("axiom-plaza"), {
    x: 320,
    y: 208,
    facing: "right",
  });
  assert.deepEqual(restoredState.getPlayerState(), {
    x: 112,
    y: 160,
    facing: "up",
  });
  assert.equal(restoredState.flags.preparationsBoardRead, true);
  assert.equal(restoredState.flags.brideNoteReceived, true);
  assert.equal(restoredState.flags.sevenBridgesUnlocked, true);
  assert.equal(
    restoredState.objectiveId,
    "investigate-seven-bridges",
  );
});
