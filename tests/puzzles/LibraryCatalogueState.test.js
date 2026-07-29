import test from "node:test";
import assert from "node:assert/strict";
import {
  LIBRARY_CATALOGUE_FAILURE_CODE,
  LIBRARY_CATALOGUE_PHASE,
  LibraryCatalogueState,
} from "../../src/puzzles/library-catalogue/LibraryCatalogueState.js";

const INITIAL_ORDER = ["C", "M", "A", "R", "D"];
const SOLVED_ORDER = ["A", "D", "R", "C", "M"];

test("crea el estado inicial exacto y lo serializa", () => {
  const state = new LibraryCatalogueState();

  assert.deepEqual(state.toSaveData(), {
    order: INITIAL_ORDER,
    phase: LIBRARY_CATALOGUE_PHASE.READY,
    hintsRead: [],
    attemptCount: 0,
    failureCode: null,
  });
});

test("restaura estados válidos en las cuatro fases", () => {
  const cases = [
    {
      phase: LIBRARY_CATALOGUE_PHASE.READY,
      order: INITIAL_ORDER,
      failureCode: null,
    },
    {
      phase: LIBRARY_CATALOGUE_PHASE.ARRANGING,
      order: ["M", "C", "A", "R", "D"],
      failureCode: null,
    },
    {
      phase: LIBRARY_CATALOGUE_PHASE.FAILED,
      order: INITIAL_ORDER,
      failureCode:
        LIBRARY_CATALOGUE_FAILURE_CODE.CONSTRAINTS_NOT_SATISFIED,
    },
    {
      phase: LIBRARY_CATALOGUE_PHASE.SOLVED,
      order: SOLVED_ORDER,
      failureCode: null,
    },
  ];

  for (const data of cases) {
    const state = new LibraryCatalogueState({
      ...data,
      hintsRead: [1, 2],
      attemptCount: 3,
    });

    assert.deepEqual(state.toSaveData(), {
      ...data,
      hintsRead: [1, 2],
      attemptCount: 3,
    });
  }
});

test("mantiene copias defensivas de order y hintsRead", () => {
  const order = [...INITIAL_ORDER];
  const hintsRead = [1];
  const state = new LibraryCatalogueState({ order, hintsRead });

  order[0] = "A";
  hintsRead.push(2);

  assert.deepEqual(state.order, INITIAL_ORDER);
  assert.deepEqual(state.hintsRead, [1]);
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(state.order), true);
  assert.equal(Object.isFrozen(state.hintsRead), true);

  const saved = state.toSaveData();
  saved.order[0] = "A";
  saved.hintsRead.push(2);
  assert.deepEqual(state.order, INITIAL_ORDER);
  assert.deepEqual(state.hintsRead, [1]);
});

test("rechaza órdenes estructuralmente inválidos", () => {
  const invalidOrders = [
    { order: "C-M-A-R-D", code: "invalid_order" },
    { order: ["C", "M"], code: "invalid_document_count" },
    { order: ["C", "M", "A", "R", "X"], code: "unknown_document" },
    { order: ["C", "M", "A", "R", "R"], code: "duplicate_document" },
  ];

  for (const { order, code } of invalidOrders) {
    assert.throws(
      () => new LibraryCatalogueState({ order }),
      new RegExp(code),
    );
  }
});

test("rechaza fases y progresos de pistas desconocidos", () => {
  assert.throws(
    () => new LibraryCatalogueState({ phase: "unknown" }),
    /Fase del catálogo no válida/,
  );

  for (const hintsRead of [[2], [1, 3], [1, 1], "1"]) {
    assert.throws(
      () => new LibraryCatalogueState({ hintsRead }),
      /progreso de pistas/,
    );
  }
});

test("rechaza contadores negativos, decimales o no numéricos", () => {
  for (const attemptCount of [-1, 1.5, "1"]) {
    assert.throws(
      () => new LibraryCatalogueState({ attemptCount }),
      /entero mayor o igual que cero/,
    );
  }
});

test("rechaza códigos de fallo desconocidos", () => {
  assert.throws(
    () => new LibraryCatalogueState({ failureCode: "unknown" }),
    /Código de fallo del catálogo desconocido/,
  );
});

test("exige coherencia entre phase y failureCode", () => {
  assert.throws(
    () =>
      new LibraryCatalogueState({
        phase: LIBRARY_CATALOGUE_PHASE.FAILED,
      }),
    /failed exige constraints_not_satisfied/,
  );

  for (const phase of [
    LIBRARY_CATALOGUE_PHASE.READY,
    LIBRARY_CATALOGUE_PHASE.ARRANGING,
    LIBRARY_CATALOGUE_PHASE.SOLVED,
  ]) {
    assert.throws(
      () =>
        new LibraryCatalogueState({
          order:
            phase === LIBRARY_CATALOGUE_PHASE.SOLVED
              ? SOLVED_ORDER
              : INITIAL_ORDER,
          phase,
          failureCode:
            LIBRARY_CATALOGUE_FAILURE_CODE.CONSTRAINTS_NOT_SATISFIED,
        }),
      /exige failureCode=null/,
    );
  }
});

test("solved exige que el orden satisfaga las seis reglas", () => {
  assert.throws(
    () =>
      new LibraryCatalogueState({
        order: INITIAL_ORDER,
        phase: LIBRARY_CATALOGUE_PHASE.SOLVED,
      }),
    /solved exige un orden/,
  );
});

test("no muta datos recibidos aunque la restauración falle", () => {
  const order = ["C", "M", "A", "R", "R"];
  const hintsRead = [1, 3];
  const originalOrder = [...order];
  const originalHints = [...hintsRead];

  assert.throws(() => new LibraryCatalogueState({ order, hintsRead }));
  assert.deepEqual(order, originalOrder);
  assert.deepEqual(hintsRead, originalHints);
});
