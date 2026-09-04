import assert from "node:assert/strict";
import test from "node:test";
import {
  GIFT_CODE_CLUE_LINES,
  GIFT_CODE_DIGITS,
} from "../../src/content/epilogueConfig.js";

test("GIFT_CODE_DIGITS define exactamente los cuatro dígitos inmutables de la combinación", () => {
  assert.ok(Array.isArray(GIFT_CODE_DIGITS));
  assert.equal(Object.isFrozen(GIFT_CODE_DIGITS), true);
  assert.deepEqual(GIFT_CODE_DIGITS, [7, 1, 5, 2]);
});

test("GIFT_CODE_CLUE_LINES define exactamente las cuatro líneas inmutables de la pista", () => {
  assert.ok(Array.isArray(GIFT_CODE_CLUE_LINES));
  assert.equal(Object.isFrozen(GIFT_CODE_CLUE_LINES), true);
  assert.deepEqual(GIFT_CODE_CLUE_LINES, [
    "Siete caminos parecían posibles.",
    "Uno nunca lo fue.",
    "Cinco nombres recuperaron su lugar.",
    "Solo dos verdades resistieron al Archivo.",
  ]);
});

/*
 * La pista es un texto para deducir, no la respuesta escrita: ninguna línea
 * puede contener un dígito arábigo literal, que revelaría la combinación sin
 * razonarla. Las palabras "Siete", "Uno", "Cinco" y "dos" son intencionales y
 * no se prohíben aquí: la comprobación es únicamente sobre caracteres 0-9.
 */
test("ninguna línea de GIFT_CODE_CLUE_LINES revela la combinación con dígitos arábigos", () => {
  for (const line of GIFT_CODE_CLUE_LINES) {
    assert.equal(
      /[0-9]/.test(line),
      false,
      `La línea "${line}" contiene un dígito arábigo literal.`,
    );
  }
});
