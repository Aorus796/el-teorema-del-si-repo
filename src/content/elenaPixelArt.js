/*
 * Pixel-art indexado de Elena (Elena Character Pixel-Art -- aplica a
 * Elena el mismo lenguaje visual ya aprobado para Gonzalo: matriz de
 * caracteres + paleta compacta, rasterizada una única vez y cacheada --
 * ver src/render/ElenaRenderer.js, que replica el patrón de
 * src/render/GonzaloRenderer.js (cache local propia, sin depender de
 * WorldScene.js) con su propio módulo, sin tocar ni una línea de
 * gonzaloPixelArt.js/GonzaloRenderer.js.
 *
 * Tres variantes ("front"/"back"/"side") comparten el mismo cuerpo salvo:
 *  - fila de ojos (fila 5): "front" tiene los dos ojos (mismo criterio
 *    humano aprobado con Gonzalo -- 1 pixel lógico por ojo, color
 *    oscuro, sin blanco, sin pupila compleja), "side" tiene solo el ojo
 *    del lado visible, "back" no tiene ninguno;
 *  - filas 3-8 (cabeza): "front"/"side" muestran cara (piel con frente
 *    resaltada y sombra de mandíbula), "back" muestra pelo continuo --
 *    aplicado así desde el primer diseño (no como corrección posterior)
 *    aprendiendo de las cuatro microiteraciones que hicieron falta para
 *    llegar a ese mismo resultado final en Gonzalo (ver CHANGELOG.md).
 * "side" se usa también para el facing "left", reflejado horizontalmente
 * en tiempo de dibujo (ver ElenaRenderer.js) -- un único dataset lateral,
 * no dos.
 *
 * Identidad propia de Elena, deliberadamente distinta de Gonzalo pese a
 * compartir escala/técnica/criterio de ojos (preserva el diseño ya
 * aprobado de src/scenes/WorldScene.js:renderElena(), migrado aquí):
 * pelo largo que baja por los laterales del torso (filas 9-13) en vez de
 * mangas cortas, y falda/vestido de una sola pieza sin dividir en dos
 * perneras (filas 16-19) en vez de pantalón. Bounding box 14x22, mismo
 * tamaño visual aproximado que el render geométrico anterior (~12x20) y
 * que Gonzalo, anclado en (screenX-7, screenY-14) sobre el punto de
 * anclaje real del NPC (ver ElenaRenderer.js).
 */

export const ELENA_PIXEL_WIDTH = 14;
export const ELENA_PIXEL_HEIGHT = 22;
export const ELENA_TRANSPARENT = ".";

// Preserva exactamente los cuatro colores ya existentes de BRIDE_PALETTE
// (characterPalettes.js) -- outline/ojos reutiliza "silhouette", "d"
// reutiliza "hair", "k" reutiliza "head" (= SKIN_TONE, compartido con
// Gonzalo), "b" reutiliza "body", "L" reutiliza "bodyAccent" -- más
// cinco tonos derivados nuevos para el volumen/sombreado que el render
// geométrico anterior no tenía. Mismo número de colores que
// GONZALO_PALETTE (10), pero con sus propios valores hexadecimales
// (salvo la piel, compartida) -- así Elena no se lee como "Gonzalo
// recoloreado": comparte filosofía de paleta, no los valores en sí.
export const ELENA_PALETTE = {
  O: "#302637", // contorno + ojos (= BRIDE_PALETTE.silhouette)
  d: "#6b4226", // pelo oscuro (= BRIDE_PALETTE.hair)
  m: "#8a5c3a", // pelo medio
  k: "#d9a06f", // piel base (= BRIDE_PALETTE.head / SKIN_TONE)
  h: "#f0c090", // piel highlight (frente)
  s: "#b07f52", // piel sombra (mandíbula)
  b: "#8a5f96", // vestido medio (= BRIDE_PALETTE.body)
  B: "#6a4874", // vestido oscuro, sombra
  L: "#c9a8d1", // vestido claro, cintura (= BRIDE_PALETTE.bodyAccent)
  w: "#3a3040", // calzado
};

export const ELENA_FRONT_PIXELS = [
  "...OOOOOOOO...",
  "...OddddddO...",
  "..OddddddddO..",
  "..OdmhhhhmdO..",
  "..OdkkkkkkmO..",
  "..OdkOkkOkmO..",
  "..OdkkkkkkmO..",
  "..OdssssssdO..",
  "..OdssssssdO..",
  ".OddbbbbbbddO.",
  ".OdbbbbbbbbdO.",
  ".OdbbbbbbbbdO.",
  ".OdbbbbbbbbdO.",
  ".OdBBBBBBBBdO.",
  ".OkBBBBBBBBkO.",
  ".OkBBBBBBBBkO.",
  "..OLLLLLLLLO..",
  "..OLLLLLLLLO..",
  "..OBBBBBBBBO..",
  ".OOBBBBBBBBOO.",
  "...OwwwwwwO...",
  "...OOOOOOOO...",
];

export const ELENA_BACK_PIXELS = [
  "...OOOOOOOO...",
  "...OddddddO...",
  "..OddddddddO..",
  "..OddddddddO..",
  "..OddddddddO..",
  "..OddddddddO..",
  "..OddddddddO..",
  "..OddddddddO..",
  "..OddddddddO..",
  ".OddbbbbbbddO.",
  ".OdbbbbbbbbdO.",
  ".OdbbbbbbbbdO.",
  ".OdbbbbbbbbdO.",
  ".OdBBBBBBBBdO.",
  ".OkBBBBBBBBkO.",
  ".OkBBBBBBBBkO.",
  "..OLLLLLLLLO..",
  "..OLLLLLLLLO..",
  "..OBBBBBBBBO..",
  ".OOBBBBBBBBOO.",
  "...OwwwwwwO...",
  "...OOOOOOOO...",
];

export const ELENA_SIDE_PIXELS = [
  "...OOOOOOOO...",
  "...OddddddO...",
  "..OddddddddO..",
  "..OdmhhhhmdO..",
  "..OdkkkkkkmO..",
  "..OdkkkkOkmO..",
  "..OdkkkkkkmO..",
  "..OdssssssdO..",
  "..OdssssssdO..",
  ".OddbbbbbbddO.",
  ".OdbbbbbbbbdO.",
  ".OdbbbbbbbbdO.",
  ".OdbbbbbbbbdO.",
  ".OdBBBBBBBBdO.",
  ".OkBBBBBBBBkO.",
  ".OkBBBBBBBBkO.",
  "..OLLLLLLLLO..",
  "..OLLLLLLLLO..",
  "..OBBBBBBBBO..",
  ".OOBBBBBBBBOO.",
  "...OwwwwwwO...",
  "...OOOOOOOO...",
];
