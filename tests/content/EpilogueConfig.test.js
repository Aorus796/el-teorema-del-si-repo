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
    "Todos los puentes del Paseo parecían caminos posibles.",
    "El mapa completo mentía sobre un puente que nunca estuvo abierto.",
    "Los documentos del catálogo recuperaron su lugar correcto.",
    "Solo las declaraciones coincidentes resistieron al Archivo.",
  ]);
});

/*
 * La pista es un texto para deducir, no la respuesta escrita: ninguna línea
 * puede contener un dígito arábigo literal, que revelaría la combinación sin
 * razonarla. La comprobación es únicamente sobre caracteres 0-9; la
 * prohibición de los dígitos escritos con letra vive en el test siguiente.
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

/*
 * Cada línea alude a un tramo del recorrido y el jugador debe reconocer de
 * dónde viene para reconstruir el dígito: escribir con letra cualquiera de
 * los cuatro dígitos equivaldría a regalar parte de la combinación.
 *
 * Los patrones usan límite de palabra porque solo cuenta el numeral como
 * palabra completa. Ese `\b` es lo que evita las colisiones por subcadena:
 * la primera línea ("Todos los puentes...") contiene "dos" dentro de
 * "Todos", y `/\bdos\b/i` no la marca; el "un" de "un puente" es artículo
 * indefinido y no coincide con `/\buno\b/i`.
 */
const digitWordPatterns = [/\bsiete\b/i, /\buno\b/i, /\bcinco\b/i, /\bdos\b/i];

/*
 * Comprobación por índice, cada línea contra el patrón de su propio dígito.
 * No existe para evitar falsos positivos —de eso ya se encarga el límite de
 * palabra, y el test cruzado siguiente pasa sin ninguno— sino por
 * especificidad y trazabilidad: deja escrito qué línea corresponde a qué
 * dígito y señala exactamente cuál se rompió.
 */
test("ninguna línea de GIFT_CODE_CLUE_LINES revela su propio dígito escrito con letra", () => {
  assert.equal(digitWordPatterns.length, GIFT_CODE_CLUE_LINES.length);
  for (let index = 0; index < GIFT_CODE_CLUE_LINES.length; index += 1) {
    const line = GIFT_CODE_CLUE_LINES[index];
    assert.equal(
      digitWordPatterns[index].test(line),
      false,
      `La línea "${line}" nombra con letra su propio dígito (${GIFT_CODE_DIGITS[index]}).`,
    );
  }
});

/*
 * Comprobación cruzada, más estricta que la anterior: ninguna línea puede
 * nombrar con letra ninguno de los cuatro dígitos, tampoco el de otra línea.
 * Sin ella queda un hueco real: una línea cuyo dígito es el 7 podría
 * contener "cinco" y regalar el dígito de la tercera línea sin que la
 * comprobación por índice llegue a compararlas nunca.
 */
test("ninguna línea de GIFT_CODE_CLUE_LINES nombra con letra ningún dígito de la combinación", () => {
  for (const line of GIFT_CODE_CLUE_LINES) {
    for (let index = 0; index < digitWordPatterns.length; index += 1) {
      assert.equal(
        digitWordPatterns[index].test(line),
        false,
        `La línea "${line}" nombra con letra el dígito ${GIFT_CODE_DIGITS[index]} de la combinación.`,
      );
    }
  }
});
