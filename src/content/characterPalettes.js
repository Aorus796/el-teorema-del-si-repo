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
// SKIN_TONE ni ningún campo de las paletas humanas. Sin consumidor
// jugable todavía (ver src/render/MaxRenderer.js).
export const MAX_PALETTE = Object.freeze({
  body: "#b98653",
  mask: "#3b2a1f",
  collar: "#26201d",
});

// Silueta y color de cabeza compartidos por todos los NPC dibujados con
// WorldScene.renderNpc -- distintos de PROTAGONIST_PALETTE.silhouette,
// que es exclusivo del jugador.
export const NPC_SILHOUETTE = "#302637";
export const NPC_HEAD = SKIN_TONE;

// Paleta de los NPC con nombre que ya distinguían body/accent en
// WorldScene.renderNpc antes de esta centralización. bride-epilogue no
// aparece aquí: Elena tiene su propio renderer dedicado en
// WorldScene.renderElena, que consulta BRIDE_PALETTE directamente.
export const NAMED_NPC_PALETTES = Object.freeze({
  "mayor-corolaria": Object.freeze({ body: "#8e4566", accent: "#d6b65f" }),
  "bride-father": Object.freeze({ body: "#486987", accent: "#efe2bf" }),
  "plaza-worker": Object.freeze({ body: "#6c8756", accent: "#d9a06f" }),
});

// Paleta usada por cualquier NPC sin entrada explícita en
// NAMED_NPC_PALETTES (hoy: library-silogio).
export const DEFAULT_NPC_PALETTE = Object.freeze({
  body: "#6c6387",
  accent: "#efe2bf",
});
