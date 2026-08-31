import test from "node:test";
import assert from "node:assert/strict";
import {
  LIBRARY_CATALOGUE_HINTS,
  getLibraryCatalogueHint,
} from "../../src/puzzles/library-catalogue/LibraryCatalogueHints.js";

const OLD_LEVEL_3_TEXT =
  "Coloca A-D en las dos primeras posiciones; los huecos restantes quedan como R-C-M.";

const FORBIDDEN_SUBSTRINGS = [
  "R-C-M",
  "Registro-Catálogo-Manual",
  "A-D-R-C-M",
  "ADRCM",
];

test("la pista de nivel 3 de la Biblioteca ya no entrega el orden completo de la solución", () => {
  const hint = getLibraryCatalogueHint(3);

  assert.notEqual(hint.text, OLD_LEVEL_3_TEXT);

  for (const forbidden of FORBIDDEN_SUBSTRINGS) {
    assert.equal(
      hint.text.toLowerCase().includes(forbidden.toLowerCase()),
      false,
      `La pista de nivel 3 no debe contener "${forbidden}"`,
    );
  }
});

test("la pista de nivel 3 no es una paráfrasis de las pistas de nivel 1 o 2", () => {
  const [hintLevel1, hintLevel2, hintLevel3] = LIBRARY_CATALOGUE_HINTS;

  assert.notEqual(hintLevel3.text, hintLevel1.text);
  assert.notEqual(hintLevel3.text, hintLevel2.text);
});
