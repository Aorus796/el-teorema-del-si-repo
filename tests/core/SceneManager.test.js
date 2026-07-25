import assert from "node:assert/strict";
import test from "node:test";
import { SceneManager } from "../../src/core/SceneManager.js";

test("SceneManager abandona la escena actual y entra en la nueva", () => {
  const scenes = new SceneManager();
  const calls = [];
  const first = {
    enter(payload) {
      calls.push(["first-enter", payload]);
    },
    exit() {
      calls.push(["first-exit"]);
    },
  };
  const second = {
    enter(payload) {
      calls.push(["second-enter", payload]);
    },
  };

  scenes.register("first", first);
  scenes.register("second", second);
  scenes.change("first", { source: "test" });
  scenes.change("second", { source: "transition" });

  assert.deepEqual(calls, [
    ["first-enter", { source: "test" }],
    ["first-exit"],
    ["second-enter", { source: "transition" }],
  ]);
});

test("SceneManager rechaza escenas no registradas", () => {
  const scenes = new SceneManager();
  assert.throws(() => scenes.change("missing"), /No existe la escena/);
});
