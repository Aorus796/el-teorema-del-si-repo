/*
 * Colores de render de personajes (protagonista, novia, Max y NPC con
 * nombre) ya usados hoy en src/world/Player.js, src/scenes/WorldScene.js,
 * src/scenes/CreditsScene.js y src/render/MaxRenderer.js -- centralizados
 * aquí para que dejen de existir por triplicado. Incluye los rasgos
 * físicos simplificados del Visual Style Lock aprobado (ver
 * docs/production/V1_1_PERSONALIZATION_SPEC.md §6): pelo de Gonzalo y
 * Elena, y la paleta propia de Max.
 */

export const SKIN_TONE = "#d9a06f";

export const PROTAGONIST_PALETTE = Object.freeze({
  silhouette: "#1c1829",
  head: SKIN_TONE,
  body: "#3f6fb0",
  bodyAccent: "#6f93c2",
  hair: "#4a3324",
});

export const BRIDE_PALETTE = Object.freeze({
  silhouette: "#302637",
  head: SKIN_TONE,
  body: "#8a5f96",
  bodyAccent: "#c9a8d1",
  hair: "#6b4226",
});

// Paleta propia de Max (perro, pastor belga malinois) -- no reutiliza
// SKIN_TONE ni ningún campo de las paletas humanas. Consumida por
// src/content/maxPixelArt.js (MAX_PIXEL_PALETTE.k/.b reutilizan
// exactamente .mask/.body); "collar" nunca se ha pintado -- Max nunca
// lleva collar, en el render geométrico anterior ni en el pixel-art
// indexado actual.
export const MAX_PALETTE = Object.freeze({
  body: "#b98653",
  mask: "#3b2a1f",
  collar: "#26201d",
});

// Paleta propia de la Alcaldesa Corolaria. Ya no la consume WorldScene:
// WorldScene.renderCorolaria delega en render/CorolariaRenderer.js
// (corolariaPixelArt.js), que trae su propia paleta indexada. Se conserva
// como referencia histórica de color, consumida hoy por
// tests/content/CorolariaPixelArt.test.js.
export const MAYOR_PALETTE = Object.freeze({
  silhouette: "#4a2e42",
  head: SKIN_TONE,
  hair: "#5c4a2e",
  body: "#8e4566",
  bodyAccent: "#d6b65f",
});

// Paleta propia del Padre de la novia. Ya no la consume WorldScene:
// WorldScene.renderBrideFather delega en render/BrideFatherRenderer.js
// (brideFatherPixelArt.js), que trae su propia paleta indexada. Se
// conserva como referencia histórica de color, consumida hoy por
// tests/content/BrideFatherPixelArt.test.js.
export const BRIDE_FATHER_PALETTE = Object.freeze({
  silhouette: "#241f1c",
  head: SKIN_TONE,
  hair: "#5a5250",
  body: "#486987",
  bodyAccent: "#efe2bf",
});

// Paleta propia de Silogio. Ya no la consume WorldScene:
// WorldScene.renderSilogio delega en render/SilogioRenderer.js
// (silogioPixelArt.js), que trae su propia paleta indexada. Se conserva
// como referencia histórica de color, consumida hoy por
// tests/content/SilogioPixelArt.test.js.
export const SILOGIO_PALETTE = Object.freeze({
  silhouette: "#22303a",
  head: SKIN_TONE,
  hair: "#9a9a9a",
  body: "#4a6b6c",
  bodyAccent: "#c98f3a",
});

// Silueta y color de cabeza compartidos por todos los NPC dibujados con
// WorldScene.renderNpc -- distintos de PROTAGONIST_PALETTE.silhouette,
// que es exclusivo del jugador.
export const NPC_SILHOUETTE = "#302637";
export const NPC_HEAD = SKIN_TONE;

// Paleta de los NPC con nombre que aún usan el render genérico de
// WorldScene.renderNpc. mayor-corolaria y bride-father ya no aparecen
// aquí: tienen renderers dedicados (WorldScene.renderCorolaria y
// WorldScene.renderBrideFather) que consultan MAYOR_PALETTE y
// BRIDE_FATHER_PALETTE directamente, igual que bride-epilogue con
// BRIDE_PALETTE.
//
// Segunda ronda de refinamiento visual (tras "todavía se leen demasiado
// como BLOQUES" -- ver CHANGELOG.md): cada entrada añade `hairStyle`
// (distinto por NPC, para diferenciar sus siluetas de pelo),
// `hairShadow`/`bodyShadow` (~20% más oscuros que `hair`/`body`, para dar
// volumen al pelo y a la franja de cintura) y `silhouetteVariant`
// ("practical"/"light"/"formal", consumido por
// WorldScene.drawGenericNpcBody/Legs para variar hombros, torso y ancho
// de piernas sin necesitar un renderer dedicado por NPC).
export const NAMED_NPC_PALETTES = Object.freeze({
  "plaza-worker": Object.freeze({
    body: "#6c8756",
    accent: "#d9a06f",
    eyes: true,
    hair: "#4a3b2a",
    hairShadow: "#3b2f22",
    bodyShadow: "#566c45",
    hairStyle: "short",
    silhouetteVariant: "practical",
  }),
  "ambient-florist-altar": Object.freeze({
    body: "#5f8f6a",
    accent: "#e8b4d0",
    // Color propio del detalle floral (drawGenericNpcBody, rama isLight en
    // WorldScene.js) -- deliberadamente distinto de `accent`, que ya se
    // reutiliza en la banda de pecho y en las piernas de todos los NPC
    // genéricos, para que el rosetón se lea como una flor y no como ruido
    // de paleta.
    flowerAccent: "#e2574c",
    eyes: true,
    hair: "#2e2419",
    hairShadow: "#251d14",
    bodyShadow: "#4c7255",
    hairStyle: "bun",
    silhouetteVariant: "light",
  }),
  "ambient-setup-helper": Object.freeze({
    body: "#7d6a4f",
    accent: "#cbb994",
    eyes: true,
    hair: "#6e5a3f",
    hairShadow: "#584832",
    bodyShadow: "#64553f",
    hairStyle: "side",
    silhouetteVariant: "practical",
  }),
  "ambient-waiter-tables": Object.freeze({
    body: "#2f3b52",
    accent: "#c9a15a",
    eyes: true,
    hair: "#1f1a15",
    hairShadow: "#191511",
    bodyShadow: "#262f42",
    hairStyle: "fringe",
    silhouetteVariant: "formal",
  }),
  "ambient-guest-bench": Object.freeze({
    body: "#7a5d8f",
    accent: "#e3c9e8",
    eyes: true,
    hair: "#8a6a4a",
    hairShadow: "#6e553b",
    bodyShadow: "#624a72",
    hairStyle: "medium",
    silhouetteVariant: "formal",
  }),
  // Paletas de los 3 NPC ambientales de Seven Bridges Walk (v1.1): mismo
  // patrón que los 4 de Plaza del Axioma de arriba, ninguno usa
  // silhouetteVariant "light" (esa variante está acoplada a
  // palette.flowerAccent, que solo define ambient-florist-altar).
  "ambient-fisher-dock": Object.freeze({
    body: "#3a4d73",
    accent: "#c2a366",
    eyes: true,
    hair: "#8a8577",
    hairShadow: "#6e6a5c",
    bodyShadow: "#2f3f5c",
    hairStyle: "short",
    silhouetteVariant: "practical",
  }),
  "ambient-riverside-stroller": Object.freeze({
    body: "#9c6b4a",
    accent: "#e0cba8",
    eyes: true,
    hair: "#5e4632",
    hairShadow: "#4a3627",
    bodyShadow: "#7d5539",
    hairStyle: "fringe",
    silhouetteVariant: "practical",
  }),
  "ambient-bench-watcher": Object.freeze({
    body: "#7a5555",
    accent: "#c9b28a",
    eyes: true,
    hair: "#6e5540",
    hairShadow: "#584331",
    bodyShadow: "#614343",
    hairStyle: "side",
    silhouetteVariant: "formal",
  }),
  // Paletas de los 3 NPC ambientales de la Biblioteca del Margen (v1.1):
  // mismo patrón que los de Plaza/Seven Bridges de arriba, ninguno usa
  // silhouetteVariant "light" (esa variante está acoplada a
  // palette.flowerAccent, que solo define ambient-florist-altar).
  "ambient-library-reader": Object.freeze({
    body: "#3d6b5e",
    accent: "#d7c49a",
    eyes: true,
    hair: "#2b2118",
    hairShadow: "#201810",
    bodyShadow: "#2f5347",
    hairStyle: "medium",
    silhouetteVariant: "practical",
  }),
  "ambient-library-assistant": Object.freeze({
    body: "#5f4a6b",
    accent: "#b8a888",
    eyes: true,
    hair: "#766655",
    hairShadow: "#5c4f41",
    bodyShadow: "#4a3a54",
    hairStyle: "bun",
    silhouetteVariant: "practical",
  }),
  "ambient-library-researcher": Object.freeze({
    body: "#7a5a3a",
    accent: "#b8945a",
    eyes: true,
    hair: "#4f3c2a",
    hairShadow: "#3d2e20",
    bodyShadow: "#5e4630",
    hairStyle: "side",
    silhouetteVariant: "formal",
  }),
  // Paletas de los 2 NPC ambientales del Archivo (v1.1): mismo patrón que
  // los de Plaza/Seven Bridges/Biblioteca de arriba, ninguno usa
  // silhouetteVariant "light" (esa variante está acoplada a
  // palette.flowerAccent, que solo define ambient-florist-altar).
  "ambient-archive-clerk": Object.freeze({
    body: "#556070",
    accent: "#a8b0ba",
    eyes: true,
    hair: "#3a332c",
    hairShadow: "#2c2721",
    bodyShadow: "#3f4854",
    hairStyle: "short",
    silhouetteVariant: "practical",
  }),
  "ambient-archive-researcher": Object.freeze({
    body: "#6b3f42",
    accent: "#8a95a8",
    eyes: true,
    hair: "#4a3f52",
    hairShadow: "#392f3f",
    bodyShadow: "#542f32",
    hairStyle: "medium",
    silhouetteVariant: "formal",
  }),
});

// Paleta usada por cualquier NPC sin entrada explícita en
// NAMED_NPC_PALETTES. Sin consumidor real hoy: los NPC con nombre que
// existían (mayor-corolaria, bride-father, library-silogio) ya tienen
// renderers dedicados. Fallback para NPCs futuros de Nivel C.
export const DEFAULT_NPC_PALETTE = Object.freeze({
  body: "#6c6387",
  accent: "#efe2bf",
});
