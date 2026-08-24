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

test("NAMED_NPC_PALETTES conserva plaza-worker, los 4 NPC ambientales de Plaza del Axioma, los 3 de Seven Bridges Walk, los 3 de la Biblioteca del Margen y los 2 del Archivo; mayor-corolaria y bride-father tienen renderers dedicados", () => {
  assert.deepEqual(Object.keys(NAMED_NPC_PALETTES).sort(), [
    "ambient-archive-clerk",
    "ambient-archive-researcher",
    "ambient-bench-watcher",
    "ambient-fisher-dock",
    "ambient-florist-altar",
    "ambient-guest-bench",
    "ambient-library-assistant",
    "ambient-library-reader",
    "ambient-library-researcher",
    "ambient-riverside-stroller",
    "ambient-setup-helper",
    "ambient-waiter-tables",
    "plaza-worker",
  ]);
  assert.deepEqual(NAMED_NPC_PALETTES["plaza-worker"], {
    body: "#6c8756",
    accent: "#d9a06f",
    eyes: true,
    hair: "#4a3b2a",
    hairShadow: "#3b2f22",
    bodyShadow: "#566c45",
    hairStyle: "short",
    silhouetteVariant: "practical",
  });
  assert.deepEqual(NAMED_NPC_PALETTES["ambient-florist-altar"], {
    body: "#5f8f6a",
    accent: "#e8b4d0",
    flowerAccent: "#e2574c",
    eyes: true,
    hair: "#2e2419",
    hairShadow: "#251d14",
    bodyShadow: "#4c7255",
    hairStyle: "bun",
    silhouetteVariant: "light",
  });
  assert.deepEqual(NAMED_NPC_PALETTES["ambient-setup-helper"], {
    body: "#7d6a4f",
    accent: "#cbb994",
    eyes: true,
    hair: "#6e5a3f",
    hairShadow: "#584832",
    bodyShadow: "#64553f",
    hairStyle: "side",
    silhouetteVariant: "practical",
  });
  assert.deepEqual(NAMED_NPC_PALETTES["ambient-waiter-tables"], {
    body: "#2f3b52",
    accent: "#c9a15a",
    eyes: true,
    hair: "#1f1a15",
    hairShadow: "#191511",
    bodyShadow: "#262f42",
    hairStyle: "fringe",
    silhouetteVariant: "formal",
  });
  assert.deepEqual(NAMED_NPC_PALETTES["ambient-guest-bench"], {
    body: "#7a5d8f",
    accent: "#e3c9e8",
    eyes: true,
    hair: "#8a6a4a",
    hairShadow: "#6e553b",
    bodyShadow: "#624a72",
    hairStyle: "medium",
    silhouetteVariant: "formal",
  });
  assert.deepEqual(NAMED_NPC_PALETTES["ambient-fisher-dock"], {
    body: "#3a4d73",
    accent: "#c2a366",
    eyes: true,
    hair: "#8a8577",
    hairShadow: "#6e6a5c",
    bodyShadow: "#2f3f5c",
    hairStyle: "short",
    silhouetteVariant: "practical",
  });
  assert.deepEqual(NAMED_NPC_PALETTES["ambient-riverside-stroller"], {
    body: "#9c6b4a",
    accent: "#e0cba8",
    eyes: true,
    hair: "#5e4632",
    hairShadow: "#4a3627",
    bodyShadow: "#7d5539",
    hairStyle: "fringe",
    silhouetteVariant: "practical",
  });
  assert.deepEqual(NAMED_NPC_PALETTES["ambient-bench-watcher"], {
    body: "#7a5555",
    accent: "#c9b28a",
    eyes: true,
    hair: "#6e5540",
    hairShadow: "#584331",
    bodyShadow: "#614343",
    hairStyle: "side",
    silhouetteVariant: "formal",
  });
  assert.deepEqual(NAMED_NPC_PALETTES["ambient-library-reader"], {
    body: "#3d6b5e",
    accent: "#d7c49a",
    eyes: true,
    hair: "#2b2118",
    hairShadow: "#201810",
    bodyShadow: "#2f5347",
    hairStyle: "medium",
    silhouetteVariant: "practical",
  });
  assert.deepEqual(NAMED_NPC_PALETTES["ambient-library-assistant"], {
    body: "#5f4a6b",
    accent: "#b8a888",
    eyes: true,
    hair: "#766655",
    hairShadow: "#5c4f41",
    bodyShadow: "#4a3a54",
    hairStyle: "bun",
    silhouetteVariant: "practical",
  });
  assert.deepEqual(NAMED_NPC_PALETTES["ambient-library-researcher"], {
    body: "#7a5a3a",
    accent: "#b8945a",
    eyes: true,
    hair: "#4f3c2a",
    hairShadow: "#3d2e20",
    bodyShadow: "#5e4630",
    hairStyle: "side",
    silhouetteVariant: "formal",
  });
  assert.deepEqual(NAMED_NPC_PALETTES["ambient-archive-clerk"], {
    body: "#556070",
    accent: "#a8b0ba",
    eyes: true,
    hair: "#3a332c",
    hairShadow: "#2c2721",
    bodyShadow: "#3f4854",
    hairStyle: "short",
    silhouetteVariant: "practical",
  });
  assert.deepEqual(NAMED_NPC_PALETTES["ambient-archive-researcher"], {
    body: "#6b3f42",
    accent: "#8a95a8",
    eyes: true,
    hair: "#4a3f52",
    hairShadow: "#392f3f",
    bodyShadow: "#542f32",
    hairStyle: "medium",
    silhouetteVariant: "formal",
  });
  assert.equal(Object.isFrozen(NAMED_NPC_PALETTES), true);
});

test("las paletas de los 4 NPC ambientales de Plaza, los 3 de Seven Bridges Walk, los 3 de la Biblioteca del Margen y los 2 del Archivo no colisionan de color (body/accent/hair) entre sí ni con las demás paletas del archivo", () => {
  const ambientPalettes = [
    NAMED_NPC_PALETTES["ambient-florist-altar"],
    NAMED_NPC_PALETTES["ambient-setup-helper"],
    NAMED_NPC_PALETTES["ambient-waiter-tables"],
    NAMED_NPC_PALETTES["ambient-guest-bench"],
    NAMED_NPC_PALETTES["ambient-fisher-dock"],
    NAMED_NPC_PALETTES["ambient-riverside-stroller"],
    NAMED_NPC_PALETTES["ambient-bench-watcher"],
    NAMED_NPC_PALETTES["ambient-library-reader"],
    NAMED_NPC_PALETTES["ambient-library-assistant"],
    NAMED_NPC_PALETTES["ambient-library-researcher"],
    NAMED_NPC_PALETTES["ambient-archive-clerk"],
    NAMED_NPC_PALETTES["ambient-archive-researcher"],
  ];
  // flowerAccent es opcional (solo ambient-florist-altar lo define hoy):
  // se filtran los `undefined` de las otras tres paletas para que no
  // cuenten como colisión entre sí en el chequeo de unicidad de abajo.
  const ambientColors = ambientPalettes
    .flatMap((palette) => [
      palette.body,
      palette.accent,
      palette.hair,
      palette.hairShadow,
      palette.bodyShadow,
      palette.flowerAccent,
    ])
    .filter((color) => color !== undefined);

  assert.equal(new Set(ambientColors).size, ambientColors.length);

  const otherColors = [
    ...Object.values(PROTAGONIST_PALETTE),
    ...Object.values(BRIDE_PALETTE),
    ...Object.values(MAYOR_PALETTE),
    ...Object.values(BRIDE_FATHER_PALETTE),
    ...Object.values(SILOGIO_PALETTE),
    ...Object.values(MAX_PALETTE),
    ...Object.values(NAMED_NPC_PALETTES["plaza-worker"]),
    ...Object.values(DEFAULT_NPC_PALETTE),
    NPC_SILHOUETTE,
    NPC_HEAD,
  ];

  for (const color of ambientColors) {
    assert.equal(
      otherColors.includes(color),
      false,
      `color ${color} colisiona con una paleta existente`,
    );
  }
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
