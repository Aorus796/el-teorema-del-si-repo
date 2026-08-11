import assert from "node:assert/strict";
import test from "node:test";
import {
  COUPLE_DEDICATION,
  COUPLE_NAMES,
  DOG_BREED,
  DOG_NAME,
  DOG_SPECIES,
  PARTNER_NAME,
  PROTAGONIST_NAME,
  STORY_TOWN,
  WEDDING_CITY,
  WEDDING_DATE,
  WEDDING_DATE_ISO,
} from "../../src/content/personalizationConfig.js";

test("los datos aprobados principales tienen exactamente el valor documentado en CODEX_HANDOFF.md", () => {
  assert.equal(PROTAGONIST_NAME, "Gonzalo");
  assert.equal(PARTNER_NAME, "Elena");
  assert.equal(COUPLE_NAMES, "Gonzalo y Elena");
  assert.equal(DOG_NAME, "Max");
  assert.equal(DOG_SPECIES, "perro");
  assert.equal(DOG_BREED, "pastor belga malinois");
  assert.equal(WEDDING_DATE, "26 de septiembre de 2026");
  assert.equal(WEDDING_DATE_ISO, "2026-09-26");
  assert.equal(WEDDING_CITY, "Logroño");
  assert.equal(STORY_TOWN, "Axioma");
});

test("COUPLE_DEDICATION contiene el texto exacto de la dedicatoria aprobada", () => {
  assert.equal(
    COUPLE_DEDICATION,
    "Gonzalo y Elena: que nunca os falten caminos por recorrer, preguntas " +
      "que resolver juntos y razones para seguir diciendo sí. Que la vida " +
      "os encuentre siempre del mismo lado del puente, con Max cerca, " +
      "muchas risas y la certeza de que el mejor teorema es el que se " +
      "demuestra cada día: elegiros una y otra vez.",
  );
});
