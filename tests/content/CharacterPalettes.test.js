import assert from "node:assert/strict";
import test from "node:test";
import {
  BRIDE_PALETTE,
  DEFAULT_NPC_PALETTE,
  NAMED_NPC_PALETTES,
  NPC_HEAD,
  NPC_SILHOUETTE,
  PROTAGONIST_PALETTE,
  SKIN_TONE,
} from "../../src/content/characterPalettes.js";

test("PROTAGONIST_PALETTE y BRIDE_PALETTE conservan exactamente los colores ya usados en el juego", () => {
  assert.deepEqual(PROTAGONIST_PALETTE, {
    silhouette: "#1c1829",
    head: "#d9a06f",
    body: "#5dc1b9",
  });
  assert.deepEqual(BRIDE_PALETTE, {
    silhouette: "#302637",
    head: "#d9a06f",
    body: "#6c6387",
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

test("NAMED_NPC_PALETTES conserva exactamente los tres NPC ya diferenciados", () => {
  assert.deepEqual(Object.keys(NAMED_NPC_PALETTES).sort(), [
    "bride-father",
    "mayor-corolaria",
    "plaza-worker",
  ]);
  assert.deepEqual(NAMED_NPC_PALETTES["mayor-corolaria"], {
    body: "#8e4566",
    accent: "#d6b65f",
  });
  assert.deepEqual(NAMED_NPC_PALETTES["bride-father"], {
    body: "#486987",
    accent: "#efe2bf",
  });
  assert.deepEqual(NAMED_NPC_PALETTES["plaza-worker"], {
    body: "#6c8756",
    accent: "#d9a06f",
  });
  assert.equal(Object.isFrozen(NAMED_NPC_PALETTES), true);
});

test("DEFAULT_NPC_PALETTE conserva el mismo fallback ya usado por bride-epilogue y library-silogio", () => {
  assert.deepEqual(DEFAULT_NPC_PALETTE, {
    body: "#6c6387",
    accent: "#efe2bf",
  });
  assert.equal(Object.isFrozen(DEFAULT_NPC_PALETTE), true);
});
