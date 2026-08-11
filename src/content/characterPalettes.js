/*
 * Colores de render de personajes (protagonista, novia y NPC con
 * nombre) ya usados hoy en src/world/Player.js, src/scenes/WorldScene.js
 * y src/scenes/CreditsScene.js -- centralizados aquí para que dejen de
 * existir por triplicado. Esta extracción no cambia ningún valor,
 * dimensión ni posición de render: solo mueve dónde vive el dato, para
 * que una futura personalización visual (Gonzalo, Elena, secundarios,
 * NPC ambientales) pueda cambiar una paleta en un único sitio.
 */

export const SKIN_TONE = "#d9a06f";

export const PROTAGONIST_PALETTE = Object.freeze({
  silhouette: "#1c1829",
  head: SKIN_TONE,
  body: "#5dc1b9",
});

export const BRIDE_PALETTE = Object.freeze({
  silhouette: "#302637",
  head: SKIN_TONE,
  body: "#6c6387",
});

// Silueta y color de cabeza compartidos por todos los NPC dibujados con
// WorldScene.renderNpc -- distintos de PROTAGONIST_PALETTE.silhouette,
// que es exclusivo del jugador.
export const NPC_SILHOUETTE = "#302637";
export const NPC_HEAD = SKIN_TONE;

// Paleta de los NPC con nombre que ya distinguían body/accent en
// WorldScene.renderNpc antes de esta centralización.
export const NAMED_NPC_PALETTES = Object.freeze({
  "mayor-corolaria": Object.freeze({ body: "#8e4566", accent: "#d6b65f" }),
  "bride-father": Object.freeze({ body: "#486987", accent: "#efe2bf" }),
  "plaza-worker": Object.freeze({ body: "#6c8756", accent: "#d9a06f" }),
});

// Paleta usada por cualquier NPC sin entrada explícita en
// NAMED_NPC_PALETTES (hoy: bride-epilogue y library-silogio).
export const DEFAULT_NPC_PALETTE = Object.freeze({
  body: "#6c6387",
  accent: "#efe2bf",
});
