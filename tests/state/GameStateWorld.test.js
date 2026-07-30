import assert from "node:assert/strict";
import test from "node:test";
import {
  GameState,
  SAVE_FORMAT_VERSION,
} from "../../src/state/GameState.js";

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

  assert.deepEqual(state.getPlayerState("library"), {
    x: 240,
    y: 256,
    facing: "up",
  });
});

test("GameState guarda y restaura posiciones independientes de los tres mapas", () => {
  const state = new GameState();
  state.setPlayerState({
    x: 304,
    y: 208,
    facing: "right",
  });
  state.changeMap("seven-bridges-walk", {
    x: 112,
    y: 160,
    facing: "up",
  });
  state.changeMap("library", {
    x: 224,
    y: 240,
    facing: "left",
  });
  state.player = {
    x: 232,
    y: 248,
    facing: "down",
  };

  const worldBefore = structuredClone(state.world);
  const saved = state.toSaveData();
  const restored = new GameState();
  restored.restore(saved);

  assert.equal(saved.formatVersion, SAVE_FORMAT_VERSION);
  assert.deepEqual(state.world, worldBefore);
  assert.equal(restored.world.currentMapId, "library");
  assert.deepEqual(restored.getPlayerState("axiom-plaza"), {
    x: 304,
    y: 208,
    facing: "right",
  });
  assert.deepEqual(
    restored.getPlayerState("seven-bridges-walk"),
    {
      x: 112,
      y: 160,
      facing: "up",
    },
  );
  assert.deepEqual(restored.getPlayerState("library"), {
    x: 232,
    y: 248,
    facing: "down",
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

test("GameState registra la resolución narrativa de P2 una sola vez", () => {
  const state = new GameState();

  assert.equal(state.registerP2Solution(), true);
  assert.equal(state.registerP2Solution(), false);

  assert.equal(state.objectiveId, "inspect-p2-evidence");
  assert.equal(state.notebook.length, 1);
  assert.equal(state.notebook[0].id, "p2-bridges-solution");
});
