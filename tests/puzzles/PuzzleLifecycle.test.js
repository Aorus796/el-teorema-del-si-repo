import assert from "node:assert/strict";
import test from "node:test";
import {
  PuzzleLifecycle,
  PUZZLE_STATUS,
} from "../../src/puzzles/core/PuzzleLifecycle.js";

test("un puzle nuevo comienza preparado y sin intentos", () => {
  const puzzle = new PuzzleLifecycle({ id: "p2-bridges" });

  assert.equal(puzzle.id, "p2-bridges");
  assert.equal(puzzle.status, PUZZLE_STATUS.READY);
  assert.equal(puzzle.attemptCount, 0);
  assert.equal(puzzle.isActive(), false);
  assert.equal(puzzle.isSolved(), false);
});

test("iniciar un puzle incrementa el numero de intentos", () => {
  const puzzle = new PuzzleLifecycle({ id: "p2-bridges" });

  puzzle.start();

  assert.equal(puzzle.status, PUZZLE_STATUS.ACTIVE);
  assert.equal(puzzle.attemptCount, 1);
  assert.equal(puzzle.isActive(), true);
});

test("iniciar dos veces un puzle activo no duplica el intento", () => {
  const puzzle = new PuzzleLifecycle({ id: "p2-bridges" });

  puzzle.start();
  puzzle.start();

  assert.equal(puzzle.attemptCount, 1);
});

test("un puzle activo puede suspenderse y reanudarse", () => {
  const puzzle = new PuzzleLifecycle({ id: "p2-bridges" });

  puzzle.start();
  puzzle.suspend();

  assert.equal(puzzle.status, PUZZLE_STATUS.SUSPENDED);

  puzzle.resume();

  assert.equal(puzzle.status, PUZZLE_STATUS.ACTIVE);
  assert.equal(puzzle.attemptCount, 1);
});

test("resolver un puzle activo lo deja cerrado", () => {
  const puzzle = new PuzzleLifecycle({ id: "p2-bridges" });

  puzzle.start();
  puzzle.solve();

  assert.equal(puzzle.status, PUZZLE_STATUS.SOLVED);
  assert.equal(puzzle.isSolved(), true);
  assert.throws(() => puzzle.start(), /resuelto no puede iniciarse/);
  assert.throws(() => puzzle.reset(), /resuelto no puede reiniciarse/);
});

test("reiniciar un intento devuelve el puzle al estado preparado", () => {
  const puzzle = new PuzzleLifecycle({ id: "p2-bridges" });

  puzzle.start();
  puzzle.reset();

  assert.equal(puzzle.status, PUZZLE_STATUS.READY);
  assert.equal(puzzle.attemptCount, 1);
});

test("el ciclo de vida genera datos serializables", () => {
  const puzzle = new PuzzleLifecycle({ id: "p2-bridges" });

  puzzle.start();

  assert.deepEqual(puzzle.toSaveData(), {
    id: "p2-bridges",
    status: PUZZLE_STATUS.ACTIVE,
    attemptCount: 1,
  });
});

test("rechaza identificadores, estados e intentos invalidos", () => {
  assert.throws(
    () => new PuzzleLifecycle({ id: "" }),
    /identificador valido/,
  );

  assert.throws(
    () =>
      new PuzzleLifecycle({
        id: "p2-bridges",
        status: "unknown",
      }),
    /Estado de puzle no valido/,
  );

  assert.throws(
    () =>
      new PuzzleLifecycle({
        id: "p2-bridges",
        attemptCount: -1,
      }),
    /entero no negativo/,
  );
});
