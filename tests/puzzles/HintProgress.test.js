import test from "node:test";
import assert from "node:assert/strict";
import {
  HINT_PROGRESS_CODE,
  revealNextHint,
  validateHintsRead,
} from "../../src/puzzles/core/HintProgress.js";

test("valida todos los estados secuenciales permitidos", () => {
  for (const validState of [[], [1], [1, 2], [1, 2, 3]]) {
    assert.deepEqual(validateHintsRead(validState), validState);
  }
});

test("revela las tres pistas en orden y detiene la cuarta solicitud", () => {
  let hintsRead = [];

  for (const expectedLevel of [1, 2, 3]) {
    const result = revealNextHint(hintsRead);
    assert.equal(result.code, HINT_PROGRESS_CODE.HINT_REVEALED);
    assert.equal(result.level, expectedLevel);
    hintsRead = result.hintsRead;
  }

  const fourthResult = revealNextHint(hintsRead);
  assert.equal(fourthResult.code, HINT_PROGRESS_CODE.ALL_HINTS_READ);
  assert.equal(fourthResult.level, 3);
  assert.deepEqual(fourthResult.hintsRead, [1, 2, 3]);
});

test("rechaza duplicados, huecos, desorden, niveles y tipos inválidos", () => {
  const invalidStates = [
    null,
    undefined,
    "1",
    {},
    [1, 1],
    [2],
    [1, 3],
    [2, 1],
    [0],
    [1, 2, 4],
    [1, 2, 3, 4],
    [1, "2"],
  ];

  for (const invalidState of invalidStates) {
    assert.throws(() => validateHintsRead(invalidState));
  }
});

test("no muta los arrays recibidos ni comparte el resultado", () => {
  const original = [1];
  const validated = validateHintsRead(original);
  const revealed = revealNextHint(original);

  assert.deepEqual(original, [1]);
  assert.notStrictEqual(validated, original);
  assert.notStrictEqual(revealed.hintsRead, original);

  validated.push(2);
  revealed.hintsRead.push(3);
  assert.deepEqual(original, [1]);
});
