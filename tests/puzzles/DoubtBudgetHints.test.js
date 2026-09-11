import test from "node:test";
import assert from "node:assert/strict";
import {
  DOUBT_BUDGET_HINTS,
  getDoubtBudgetHint,
} from "../../src/puzzles/doubt-budget/DoubtBudgetHints.js";
import {
  DOUBT_BUDGET_DOSSIERS,
  DOUBT_BUDGET_QUESTIONS,
  DOUBT_BUDGET_TRUE_DOSSIER,
} from "../../src/puzzles/doubt-budget/DoubtBudgetData.js";

/*
 * Mismo patrón de verificación que tests/puzzles/P2Hints.test.js: las pistas
 * se comprueban contra los datos reales del puzle, no contra copias locales,
 * y se prohíbe explícitamente lo que resolvería la consulta sin pensarla.
 */
const QUESTION_ID_PATTERN = /\bP[1-6]\b/;
const DOSSIER_ID_PATTERN = /\b[SP]{3}\b/;
const SEAT_LABEL_PATTERN = /\basientos?\s+(I{1,3})\b/;

test("existen exactamente tres reflexiones inmutables numeradas 1, 2 y 3", () => {
  assert.equal(DOUBT_BUDGET_HINTS.length, 3);
  assert.equal(Object.isFrozen(DOUBT_BUDGET_HINTS), true);
  assert.deepEqual(
    DOUBT_BUDGET_HINTS.map((hint) => hint.level),
    [1, 2, 3],
  );

  assert.throws(() => {
    DOUBT_BUDGET_HINTS.push({});
  });
  assert.throws(() => {
    DOUBT_BUDGET_HINTS[0].text = "manipulado";
  });
});

test("las tres reflexiones conservan su texto exacto", () => {
  assert.equal(
    getDoubtBudgetHint(1).text,
    "Una pregunta cuya respuesta ya puedes anticipar en casi todos los expedientes no te ha dicho casi nada. Fíjate en cuáles rara vez te sorprenderían.",
  );
  assert.equal(
    getDoubtBudgetHint(2).text,
    "Ocho expedientes, tres respuestas de sí o no: la cuenta sale exacta si cada pregunta parte el conjunto justo por la mitad. Cualquier otra reparte mal el presupuesto.",
  );
  assert.equal(
    getDoubtBudgetHint(3).text,
    "Comparar dos asientos entre sí dice cómo se relacionan, nunca de qué están hechos: gástate al menos una pregunta en la naturaleza de un asiento concreto.",
  );
});

test("ninguna reflexión nombra una pregunta concreta", () => {
  for (const hint of DOUBT_BUDGET_HINTS) {
    assert.equal(
      QUESTION_ID_PATTERN.test(hint.text),
      false,
      `La reflexión ${hint.level} nombra un identificador de pregunta.`,
    );

    for (const question of DOUBT_BUDGET_QUESTIONS) {
      assert.equal(hint.text.includes(question.id), false);
      assert.equal(hint.text.includes(question.text), false);
    }
  }
});

test("ninguna reflexión nombra un expediente, ni el real", () => {
  for (const hint of DOUBT_BUDGET_HINTS) {
    assert.equal(
      DOSSIER_ID_PATTERN.test(hint.text),
      false,
      `La reflexión ${hint.level} nombra un identificador de expediente.`,
    );

    for (const dossier of DOUBT_BUDGET_DOSSIERS) {
      assert.equal(hint.text.includes(dossier.id), false);
    }

    assert.equal(hint.text.includes(DOUBT_BUDGET_TRUE_DOSSIER.id), false);
  }
});

test("ninguna reflexión señala un asiento concreto por su número romano", () => {
  /*
   * Decir "gasta una pregunta en la naturaleza del asiento II" equivaldría a
   * nombrar la pregunta que hay que formular. La reflexión 3 debe quedarse en
   * "un asiento concreto".
   */
  for (const hint of DOUBT_BUDGET_HINTS) {
    assert.equal(
      SEAT_LABEL_PATTERN.test(hint.text),
      false,
      `La reflexión ${hint.level} señala un asiento concreto.`,
    );
  }
});

test("ninguna reflexión enumera una terna completa de preguntas", () => {
  /*
   * Una terna solo puede escribirse nombrando tres preguntas; si ninguna
   * pista nombra siquiera una, tampoco puede enumerar una terna. Se
   * comprueba de todos modos contra las ternas reales que zanjan la
   * consulta, calculadas aquí a partir de los datos de producción.
   */
  const ids = DOUBT_BUDGET_QUESTIONS.map((question) => question.id);

  for (const hint of DOUBT_BUDGET_HINTS) {
    const mentioned = ids.filter((id) => hint.text.includes(id));
    assert.equal(mentioned.length, 0);
  }
});

test("getDoubtBudgetHint() devuelve null fuera de rango o con un nivel no entero", () => {
  assert.equal(getDoubtBudgetHint(0), null);
  assert.equal(getDoubtBudgetHint(4), null);
  assert.equal(getDoubtBudgetHint(1.5), null);
  assert.equal(getDoubtBudgetHint(null), null);
  assert.equal(getDoubtBudgetHint("2"), null);
  assert.equal(getDoubtBudgetHint(undefined), null);
});

test("las tres reflexiones son distintas entre sí", () => {
  const texts = DOUBT_BUDGET_HINTS.map((hint) => hint.text);

  assert.equal(new Set(texts).size, 3);
});
