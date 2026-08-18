/*
 * Pixel-art indexado de Gonzalo (Gonzalo Character Pixel-Art Spike --
 * prueba de si el style lock indexado ya aprobado para props (Plaza
 * Visual Polish) generaliza también a personajes). Misma técnica: matriz
 * de caracteres + paleta compacta, rasterizada una única vez y cacheada
 * -- ver src/render/GonzaloRenderer.js, que reutiliza el mismo patrón de
 * createIndexedPixelSprite()/cache que src/scenes/WorldScene.js pero con
 * su propia cache mínima local (Player.js no importa de WorldScene.js
 * para evitar una dependencia circular entre la capa de mundo/juego y la
 * capa de escena).
 *
 * Tres variantes ("front"/"back"/"side") comparten EXACTAMENTE el mismo
 * cuerpo (silueta, pelo, ropa, calzado) -- solo difieren en la fila de
 * ojos (fila 5): "front" tiene los dos ojos (aprobados explícitamente por
 * el responsable humano, ver informe de la tarea), "side" tiene solo el
 * ojo del lado visible, "back" no tiene ninguno. "side" se usa también
 * para el facing "left", reflejado horizontalmente en tiempo de dibujo
 * (ver GonzaloRenderer.js) -- un único dataset lateral, no dos.
 *
 * Bounding box idéntico al render geométrico anterior de Player.js
 * (14 de ancho x 22 de alto, anclado en (screenX-7, screenY-14)): mismo
 * tamaño visual aproximado que antes, la hitbox real (10x14,
 * Player.width/height) no cambia en absoluto.
 */

export const GONZALO_PIXEL_WIDTH = 14;
export const GONZALO_PIXEL_HEIGHT = 22;
export const GONZALO_TRANSPARENT = ".";

// Preserva exactamente los cuatro colores ya existentes de
// PROTAGONIST_PALETTE (characterPalettes.js) -- outline/ojos reutiliza
// "silhouette", "d" reutiliza "hair", "k" reutiliza "head", "b" reutiliza
// "body", "L" reutiliza "bodyAccent" -- más cinco tonos derivados nuevos
// para el volumen/sombreado que ese renderer geométrico no tenía.
export const GONZALO_PALETTE = {
  O: "#1c1829", // contorno + ojos (= PROTAGONIST_PALETTE.silhouette)
  d: "#4a3324", // pelo oscuro (= PROTAGONIST_PALETTE.hair)
  m: "#6b4a34", // pelo medio (mechón lateral)
  k: "#d9a06f", // piel base (= PROTAGONIST_PALETTE.head / SKIN_TONE)
  h: "#f0c090", // piel highlight (frente)
  s: "#b07f52", // piel sombra (mandíbula)
  b: "#3f6fb0", // azul medio, camisa (= PROTAGONIST_PALETTE.body)
  B: "#2d5385", // azul oscuro, sombra de camisa
  L: "#6f93c2", // azul claro, pantalón (= PROTAGONIST_PALETTE.bodyAccent)
  w: "#3a3040", // calzado
};

export const GONZALO_FRONT_PIXELS = [
  "...OOOOOOOO...",
  "...OddddddO...",
  "..OddddddddO..",
  "..OdmhhhhmdO..",
  "..OdkkkkkkmO..",
  "..OdkOkkOkmO..",
  "..OdkkkkkkmO..",
  "..OdssssssdO..",
  "..OdssssssdO..",
  "..OdssssssdO..",
  ".ObbbbLLbbbbO.",
  ".ObbbbbbbbbbO.",
  ".OkbbbbbbbbkO.",
  ".OkbbbbbbbbkO.",
  ".OkBBBBBBBBkO.",
  ".OOBBBBBBBBOO.",
  "...OLLBBLLO...",
  "...OLLBBLLO...",
  "...OLLBBLLO...",
  "...OLLBBLLO...",
  "...OwwwwwwO...",
  "...OOOOOOOO...",
];

export const GONZALO_BACK_PIXELS = [
  "...OOOOOOOO...",
  "...OddddddO...",
  "..OddddddddO..",
  "..OdmhhhhmdO..",
  "..OdkkkkkkmO..",
  "..OdkkkkkkmO..",
  "..OdkkkkkkmO..",
  "..OdssssssdO..",
  "..OdssssssdO..",
  "..OdssssssdO..",
  ".ObbbbLLbbbbO.",
  ".ObbbbbbbbbbO.",
  ".OkbbbbbbbbkO.",
  ".OkbbbbbbbbkO.",
  ".OkBBBBBBBBkO.",
  ".OOBBBBBBBBOO.",
  "...OLLBBLLO...",
  "...OLLBBLLO...",
  "...OLLBBLLO...",
  "...OLLBBLLO...",
  "...OwwwwwwO...",
  "...OOOOOOOO...",
];

export const GONZALO_SIDE_PIXELS = [
  "...OOOOOOOO...",
  "...OddddddO...",
  "..OddddddddO..",
  "..OdmhhhhmdO..",
  "..OdkkkkkkmO..",
  "..OdkkkkOkmO..",
  "..OdkkkkkkmO..",
  "..OdssssssdO..",
  "..OdssssssdO..",
  "..OdssssssdO..",
  ".ObbbbLLbbbbO.",
  ".ObbbbbbbbbbO.",
  ".OkbbbbbbbbkO.",
  ".OkbbbbbbbbkO.",
  ".OkBBBBBBBBkO.",
  ".OOBBBBBBBBOO.",
  "...OLLBBLLO...",
  "...OLLBBLLO...",
  "...OLLBBLLO...",
  "...OLLBBLLO...",
  "...OwwwwwwO...",
  "...OOOOOOOO...",
];
