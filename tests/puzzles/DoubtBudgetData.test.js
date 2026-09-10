import test from "node:test";
import assert from "node:assert/strict";
import {
  DOUBT_BUDGET_DOSSIERS,
  DOUBT_BUDGET_QUESTIONS,
  DOUBT_BUDGET_QUESTION_IDS,
  DOUBT_BUDGET_QUESTION_LIMIT,
  DOUBT_BUDGET_RULE_LINES,
  DOUBT_BUDGET_SEAT_IDS,
  DOUBT_BUDGET_SEAT_ORDER,
  DOUBT_BUDGET_TRUE_DOSSIER,
  DOUBT_BUDGET_TRUE_DOSSIER_ID,
} from "../../src/puzzles/doubt-budget/DoubtBudgetData.js";

/*
 * Tabla de verdad escrita a mano, expediente por expediente, en vez de
 * recalculada con los propios predicados de producción: es la única forma de
 * que este archivo compruebe algo. Si un predicado cambiara de significado,
 * esta tabla debe fallar.
 */
const EXPECTED_ANSWERS_BY_QUESTION = {
  P1: {
    SSS: true,
    SSP: true,
    SPS: false,
    SPP: false,
    PSS: false,
    PSP: false,
    PPS: true,
    PPP: true,
  },
  P2: {
    SSS: true,
    SSP: false,
    SPS: false,
    SPP: true,
    PSS: true,
    PSP: false,
    PPS: false,
    PPP: true,
  },
  P3: {
    SSS: true,
    SSP: false,
    SPS: true,
    SPP: false,
    PSS: false,
    PSP: true,
    PPS: false,
    PPP: true,
  },
  P4: {
    SSS: true,
    SSP: true,
    SPS: false,
    SPP: false,
    PSS: true,
    PSP: true,
    PPS: false,
    PPP: false,
  },
  P5: {
    SSS: true,
    SSP: true,
    SPS: true,
    SPP: true,
    PSS: true,
    PSP: true,
    PPS: true,
    PPP: false,
  },
  P6: {
    SSS: true,
    SSP: false,
    SPS: false,
    SPP: false,
    PSS: false,
    PSP: false,
    PPS: false,
    PPP: true,
  },
};

test("existen exactamente ocho expedientes, uno por combinación de los tres asientos", () => {
  assert.equal(DOUBT_BUDGET_DOSSIERS.length, 8);

  const ids = DOUBT_BUDGET_DOSSIERS.map((dossier) => dossier.id);
  assert.deepEqual(ids, [
    "SSS",
    "SSP",
    "SPS",
    "SPP",
    "PSS",
    "PSP",
    "PPS",
    "PPP",
  ]);
  assert.equal(new Set(ids).size, 8);
});

test("el identificador de cada expediente describe sus asientos en orden I-II-III", () => {
  assert.deepEqual(DOUBT_BUDGET_SEAT_ORDER, [
    "occupation",
    "validDoubt",
    "archiveCompetence",
  ]);
  assert.deepEqual(Object.values(DOUBT_BUDGET_SEAT_IDS), [
    "occupation",
    "validDoubt",
    "archiveCompetence",
  ]);

  for (const dossier of DOUBT_BUDGET_DOSSIERS) {
    const letters = DOUBT_BUDGET_SEAT_ORDER.map((seatId) => {
      assert.equal(typeof dossier.seats[seatId], "boolean");
      return dossier.seats[seatId] ? "S" : "P";
    }).join("");

    assert.equal(dossier.id, letters);
  }

  const seatCombinations = new Set(
    DOUBT_BUDGET_DOSSIERS.map((dossier) =>
      JSON.stringify([
        dossier.seats.occupation,
        dossier.seats.validDoubt,
        dossier.seats.archiveCompetence,
      ]),
    ),
  );
  assert.equal(seatCombinations.size, 8);
});

test("el expediente real es SPP: la ocupación sostenida y dos presupuestos", () => {
  assert.equal(DOUBT_BUDGET_TRUE_DOSSIER_ID, "SPP");
  assert.equal(DOUBT_BUDGET_TRUE_DOSSIER.id, "SPP");
  assert.deepEqual(DOUBT_BUDGET_TRUE_DOSSIER.seats, {
    occupation: true,
    validDoubt: false,
    archiveCompetence: false,
  });

  // El expediente real es uno de los ocho, no una definición aparte.
  assert.equal(DOUBT_BUDGET_DOSSIERS.includes(DOUBT_BUDGET_TRUE_DOSSIER), true);
});

test("existen exactamente seis preguntas con los identificadores y textos aprobados", () => {
  assert.equal(DOUBT_BUDGET_QUESTIONS.length, 6);
  assert.deepEqual(
    DOUBT_BUDGET_QUESTIONS.map((question) => question.id),
    ["P1", "P2", "P3", "P4", "P5", "P6"],
  );
  assert.deepEqual(
    Object.values(DOUBT_BUDGET_QUESTION_IDS).sort(),
    ["P1", "P2", "P3", "P4", "P5", "P6"],
  );

  assert.deepEqual(
    DOUBT_BUDGET_QUESTIONS.map((question) => question.text),
    [
      "¿Comparten naturaleza los asientos I y II?",
      "¿Comparten naturaleza los asientos II y III?",
      "¿Comparten naturaleza los asientos I y III?",
      "¿Sostiene alguna observación registrada el asiento II?",
      "¿Sostiene alguna observación registrada al menos un asiento del expediente?",
      "¿Comparten naturaleza los tres asientos entre sí?",
    ],
  );
});

test("cada predicado reproduce su tabla de verdad sobre los ocho expedientes", () => {
  for (const question of DOUBT_BUDGET_QUESTIONS) {
    const expected = EXPECTED_ANSWERS_BY_QUESTION[question.id];
    assert.notEqual(expected, undefined);

    for (const dossier of DOUBT_BUDGET_DOSSIERS) {
      assert.equal(
        question.predicate(dossier.seats),
        expected[dossier.id],
        `${question.id} sobre ${dossier.id}`,
      );
    }
  }
});

test("ninguna pregunta es equivalente a otra sobre los ocho expedientes", () => {
  const signatures = DOUBT_BUDGET_QUESTIONS.map((question) =>
    DOUBT_BUDGET_DOSSIERS.map((dossier) =>
      question.predicate(dossier.seats) ? "1" : "0",
    ).join(""),
  );

  assert.equal(new Set(signatures).size, DOUBT_BUDGET_QUESTIONS.length);
});

test("el presupuesto de la consulta es de tres preguntas", () => {
  assert.equal(DOUBT_BUDGET_QUESTION_LIMIT, 3);
});

test("las tres réplicas del Custodio sobre el presupuesto conservan su texto exacto", () => {
  assert.deepEqual(DOUBT_BUDGET_RULE_LINES, [
    "Tu presupuesto es de tres preguntas. Cada respuesta que te doy queda registrada como una entrada de este expediente, igual que cualquier otra. Mi protocolo sostiene hasta tres entradas por consulta con la observación que las respalda. Una cuarta ya no tendría observación que la sostenga: sería, ella misma, un presupuesto. Y yo no concedo lo que no puedo sostener.",
    "En este Archivo, «presupuesto» designa dos cosas: lo que se asigna y lo que se da por supuesto. No es un error de nomenclatura. Es una coincidencia útil.",
    "Cada pregunta se cobra al formularla, no al entenderla.",
  ]);
});

test("la justificación del límite es autorreferencial y no aritmética", () => {
  /*
   * Guarda de regresión: el límite no puede explicarse diciendo que tres
   * preguntas binarias bastan para distinguir ocho expedientes. Eso solo
   * explicaría que tres sean suficientes, nunca por qué el Custodio no
   * puede conceder una cuarta.
   */
  const ruleText = DOUBT_BUDGET_RULE_LINES.join(" ");

  assert.equal(/ocho expedientes/i.test(ruleText), false);
  assert.equal(/\bocho\b/i.test(ruleText), false);
  assert.equal(ruleText.includes("queda registrada como una entrada"), true);
  assert.equal(
    ruleText.includes("Una cuarta ya no tendría observación que la sostenga"),
    true,
  );
  assert.equal(ruleText.includes("no concedo lo que no puedo sostener"), true);
});

test("las constantes de datos son inmutables", () => {
  assert.equal(Object.isFrozen(DOUBT_BUDGET_DOSSIERS), true);
  assert.equal(Object.isFrozen(DOUBT_BUDGET_QUESTIONS), true);
  assert.equal(Object.isFrozen(DOUBT_BUDGET_RULE_LINES), true);

  assert.throws(() => {
    DOUBT_BUDGET_DOSSIERS.push({});
  });
  assert.throws(() => {
    DOUBT_BUDGET_QUESTIONS[0].text = "manipulado";
  });
  assert.throws(() => {
    DOUBT_BUDGET_DOSSIERS[0].seats.occupation = false;
  });
  assert.throws(() => {
    DOUBT_BUDGET_RULE_LINES.push("manipulado");
  });
});
