import assert from "node:assert/strict";
import test from "node:test";
import {
  BRIDE_FATHER_PALETTE,
  BRIDE_PALETTE,
  DEFAULT_NPC_PALETTE,
  MAX_PALETTE,
  MAYOR_PALETTE,
  NAMED_NPC_PALETTES,
  NPC_HEAD,
  NPC_SILHOUETTE,
  PROTAGONIST_PALETTE,
  SILOGIO_PALETTE,
  SKIN_TONE,
} from "../../src/content/characterPalettes.js";

test("PROTAGONIST_PALETTE y BRIDE_PALETTE reflejan los rasgos simplificados del Visual Style Lock", () => {
  assert.deepEqual(PROTAGONIST_PALETTE, {
    silhouette: "#1c1829",
    head: "#d9a06f",
    body: "#3f6fb0",
    bodyAccent: "#6f93c2",
    hair: "#4a3324",
  });
  assert.deepEqual(BRIDE_PALETTE, {
    silhouette: "#302637",
    head: "#d9a06f",
    body: "#8a5f96",
    bodyAccent: "#c9a8d1",
    hair: "#6b4226",
  });
  assert.equal(Object.isFrozen(PROTAGONIST_PALETTE), true);
  assert.equal(Object.isFrozen(BRIDE_PALETTE), true);
});

test("el color de cabeza es el mismo valor compartido en todas las paletas", () => {
  assert.equal(SKIN_TONE, "#d9a06f");
  assert.equal(PROTAGONIST_PALETTE.head, SKIN_TONE);
  assert.equal(BRIDE_PALETTE.head, SKIN_TONE);
  assert.equal(NPC_HEAD, SKIN_TONE);
});

test("NPC_SILHOUETTE conserva el valor ya usado por WorldScene.renderNpc", () => {
  assert.equal(NPC_SILHOUETTE, "#302637");
});

test("NAMED_NPC_PALETTES conserva solo plaza-worker; mayor-corolaria y bride-father tienen renderers dedicados", () => {
  assert.deepEqual(Object.keys(NAMED_NPC_PALETTES).sort(), ["plaza-worker"]);
  assert.deepEqual(NAMED_NPC_PALETTES["plaza-worker"], {
    body: "#6c8756",
    accent: "#d9a06f",
  });
  assert.equal(Object.isFrozen(NAMED_NPC_PALETTES), true);
});

test("DEFAULT_NPC_PALETTE conserva su valor de fallback aunque hoy no lo consulte ningún NPC real", () => {
  assert.deepEqual(DEFAULT_NPC_PALETTE, {
    body: "#6c6387",
    accent: "#efe2bf",
  });
  assert.equal(Object.isFrozen(DEFAULT_NPC_PALETTE), true);
});

test("MAX_PALETTE define los tonos propios de Max sin compartir valores con otras paletas", () => {
  assert.deepEqual(MAX_PALETTE, {
    body: "#b98653",
    mask: "#3b2a1f",
    collar: "#26201d",
  });
  assert.equal(Object.isFrozen(MAX_PALETTE), true);

  const maxValues = Object.values(MAX_PALETTE);
  assert.equal(maxValues.includes(SKIN_TONE), false);

  const otherValues = [
    ...Object.values(PROTAGONIST_PALETTE),
    ...Object.values(BRIDE_PALETTE),
  ];
  for (const value of maxValues) {
    assert.equal(otherValues.includes(value), false);
  }
});

test("MAYOR_PALETTE, BRIDE_FATHER_PALETTE y SILOGIO_PALETTE tienen el mismo shape que PROTAGONIST_PALETTE/BRIDE_PALETTE", () => {
  assert.deepEqual(MAYOR_PALETTE, {
    silhouette: "#4a2e42",
    head: SKIN_TONE,
    hair: "#5c4a2e",
    body: "#8e4566",
    bodyAccent: "#d6b65f",
  });
  assert.deepEqual(BRIDE_FATHER_PALETTE, {
    silhouette: "#241f1c",
    head: SKIN_TONE,
    hair: "#5a5250",
    body: "#486987",
    bodyAccent: "#efe2bf",
  });
  assert.deepEqual(SILOGIO_PALETTE, {
    silhouette: "#22303a",
    head: SKIN_TONE,
    hair: "#9a9a9a",
    body: "#4a6b6c",
    bodyAccent: "#c98f3a",
  });

  assert.equal(Object.isFrozen(MAYOR_PALETTE), true);
  assert.equal(Object.isFrozen(BRIDE_FATHER_PALETTE), true);
  assert.equal(Object.isFrozen(SILOGIO_PALETTE), true);
});

test("MAYOR_PALETTE, BRIDE_FATHER_PALETTE y SILOGIO_PALETTE no colisionan de color entre sí ni con las demás paletas del archivo", () => {
  const newPalettes = [MAYOR_PALETTE, BRIDE_FATHER_PALETTE, SILOGIO_PALETTE];

  const newSilhouettes = newPalettes.map((palette) => palette.silhouette);
  const newHairs = newPalettes.map((palette) => palette.hair);

  assert.equal(new Set(newSilhouettes).size, newSilhouettes.length);
  assert.equal(new Set(newHairs).size, newHairs.length);

  const otherSilhouettesAndHairs = [
    PROTAGONIST_PALETTE.silhouette,
    PROTAGONIST_PALETTE.hair,
    BRIDE_PALETTE.silhouette,
    BRIDE_PALETTE.hair,
    NPC_SILHOUETTE,
    ...Object.values(MAX_PALETTE),
  ];

  for (const value of [...newSilhouettes, ...newHairs]) {
    assert.equal(
      otherSilhouettesAndHairs.includes(value),
      false,
      `color ${value} colisiona con una paleta existente`,
    );
  }
});
