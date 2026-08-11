import test from "node:test";
import assert from "node:assert/strict";
import { InputManager } from "../../src/core/InputManager.js";

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) ?? new Set();
    handlers.add(handler);
    this.listeners.set(type, handlers);
  }

  removeEventListener(type, handler) {
    this.listeners.get(type)?.delete(handler);
  }

  dispatch(type, event) {
    for (const handler of this.listeners.get(type) ?? []) {
      handler(event);
    }
  }
}

function keyEvent(code, repeat = false) {
  return {
    code,
    repeat,
    preventDefault() {},
  };
}

test("Q activa cuaderno y siguiente pista de puzle", () => {
  const target = new FakeEventTarget();
  const input = new InputManager(target);

  target.dispatch("keydown", keyEvent("KeyQ"));

  assert.equal(input.wasPressed("notebook"), true);
  assert.equal(input.wasPressed("nextPuzzleHint"), true);
  input.destroy();
});

test("Tab activa cuaderno pero no siguiente pista de puzle", () => {
  const target = new FakeEventTarget();
  const input = new InputManager(target);

  target.dispatch("keydown", keyEvent("Tab"));

  assert.equal(input.wasPressed("notebook"), true);
  assert.equal(input.wasPressed("nextPuzzleHint"), false);
  input.destroy();
});

test("un keydown repetido no vuelve a registrar una pulsación", () => {
  const target = new FakeEventTarget();
  const input = new InputManager(target);

  target.dispatch("keydown", keyEvent("KeyQ"));
  assert.equal(input.wasPressed("nextPuzzleHint"), true);

  input.endFrame();
  target.dispatch("keydown", keyEvent("KeyQ", true));

  assert.equal(input.wasPressed("nextPuzzleHint"), false);
  assert.equal(input.isDown("nextPuzzleHint"), true);

  target.dispatch("keyup", keyEvent("KeyQ"));
  assert.equal(input.isDown("nextPuzzleHint"), false);
  input.destroy();
});
