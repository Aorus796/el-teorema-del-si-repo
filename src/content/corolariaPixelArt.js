/*
 * Pixel-art indexado de la Alcaldesa Corolaria (Corolaria Character
 * Pixel-Art -- aplica a Corolaria el mismo lenguaje visual ya aprobado
 * para Gonzalo y Elena: matriz de caracteres + paleta compacta,
 * rasterizada una única vez y cacheada -- ver
 * src/render/CorolariaRenderer.js, que replica el patrón de
 * ElenaRenderer.js/GonzaloRenderer.js (cache local propia, sin tocar ni
 * una línea de esos dos módulos ni de sus datos).
 *
 * Tres variantes ("front"/"back"/"side") comparten el mismo cuerpo salvo:
 *  - fila de ojos (fila 5): "front" tiene los dos ojos (mismo criterio
 *    humano aprobado con Gonzalo/Elena -- 1 pixel lógico por ojo, color
 *    oscuro, sin blanco, sin pupila compleja), "side" tiene solo el ojo
 *    del lado visible, "back" no tiene ninguno;
 *  - filas 3-7 (cabeza): "front"/"side" muestran cara (piel con frente
 *    resaltada, mejillas y sombra de mandíbula), "back" muestra pelo
 *    continuo -- aplicado así desde el primer diseño (no como corrección
 *    posterior), aprendiendo directamente de las microiteraciones que
 *    hicieron falta para llegar a ese mismo resultado en Gonzalo (ver
 *    CHANGELOG.md): fila 8 (nuca/cuello) es la única excepción y muestra
 *    piel incluso de espaldas, igual que la fila de nuca final de
 *    Gonzalo, para que la cobertura de pelo trasero no termine en un
 *    corte brusco.
 * "side" se usa también para el facing "left", reflejado horizontalmente
 * en tiempo de dibujo (ver CorolariaRenderer.js) -- un único dataset
 * lateral, no dos.
 *
 * Identidad propia de Corolaria, preservando el diseño geométrico ya
 * aprobado que sustituye (WorldScene.js:renderCorolaria() anterior:
 * burdeos/burgundy con acento dorado, silueta con autoridad) pero
 * deliberadamente distinta de Elena en su construcción, no solo en color:
 * peinado recogido (sin mechones largos cayendo por los laterales del
 * torso, a diferencia del pelo largo de Elena) y parte inferior recta de
 * ancho constante desde los hombros hasta el bajo (filas 9-18), sin la
 * silueta de falda que se ensancha ni el vestido de una sola pieza de
 * Elena. El acento dorado (MAYOR_PALETTE.bodyAccent) aparece en tres
 * puntos estructurales -- hombros (fila 9), cinturón (fila 14) y bajo
 * (fila 19) -- para reforzar la lectura de "autoridad formal" pedida en
 * el style lock. Bounding box 14x22, misma escala que Gonzalo y Elena
 * (el bounding box geométrico anterior era 13x20; la hitbox real del NPC
 * en worldMaps.js, 14x18, no cambia).
 */

export const COROLARIA_PIXEL_WIDTH = 14;
export const COROLARIA_PIXEL_HEIGHT = 22;
export const COROLARIA_TRANSPARENT = ".";

// Preserva exactamente los cinco colores ya existentes de MAYOR_PALETTE
// (characterPalettes.js) -- outline/ojos reutiliza "silhouette", "d"
// reutiliza "hair", "k" reutiliza "head" (= SKIN_TONE, compartido con
// Gonzalo/Elena), "b" reutiliza "body", "L" reutiliza "bodyAccent" (el
// dorado) -- más cinco tonos derivados nuevos para el volumen/sombreado
// que el render geométrico anterior no tenía. Mismo número de colores
// que GONZALO_PALETTE/ELENA_PALETTE (10), con sus propios valores
// hexadecimales salvo la piel (compartida) -- Corolaria no se lee como
// "Elena recoloreada": comparte filosofía de paleta, no los valores.
export const COROLARIA_PALETTE = {
  O: "#4a2e42", // contorno + ojos (= MAYOR_PALETTE.silhouette)
  d: "#5c4a2e", // pelo oscuro (= MAYOR_PALETTE.hair)
  m: "#7a6440", // pelo medio (volumen del recogido)
  k: "#d9a06f", // piel base (= MAYOR_PALETTE.head / SKIN_TONE)
  h: "#f0c090", // piel highlight (frente)
  s: "#b07f52", // piel sombra (mandíbula)
  b: "#8e4566", // burdeos medio (= MAYOR_PALETTE.body)
  B: "#6a334e", // burdeos oscuro, sombra
  L: "#d6b65f", // acento dorado (= MAYOR_PALETTE.bodyAccent)
  w: "#3a3040", // calzado
};

export const COROLARIA_FRONT_PIXELS = [
  "...OOOOOOOO...",
  "...OddddddO...",
  "..OddmmmmddO..",
  "..OkkkkkkkkO..",
  "..OkkhhhhkkO..",
  "..OkkOkkOkkO..",
  "..OkkkkkkkkO..",
  "..OksssssskO..",
  "..OksssssskO..",
  ".OLbbbbbbbbLO.",
  ".ObbbbLLbbbbO.",
  ".ObbbbbbbbbbO.",
  ".OkbbbbbbbbkO.",
  ".OkbbbbbbbbkO.",
  ".OLLLLLLLLLLO.",
  ".OBBBBBBBBBBO.",
  ".OBBBBBBBBBBO.",
  ".OBBBBBBBBBBO.",
  ".OBBBBBBBBBBO.",
  ".OLLLLLLLLLLO.",
  "...OwwwwwwO...",
  "...OOOOOOOO...",
];

export const COROLARIA_BACK_PIXELS = [
  "...OOOOOOOO...",
  "...OddddddO...",
  "..OddmmmmddO..",
  "..OddddddddO..",
  "..OddmmmmddO..",
  "..OddddddddO..",
  "..OddmmmmddO..",
  "..OddddddddO..",
  "..OksssssskO..",
  ".OLbbbbbbbbLO.",
  ".ObbbbLLbbbbO.",
  ".ObbbbbbbbbbO.",
  ".OkbbbbbbbbkO.",
  ".OkbbbbbbbbkO.",
  ".OLLLLLLLLLLO.",
  ".OBBBBBBBBBBO.",
  ".OBBBBBBBBBBO.",
  ".OBBBBBBBBBBO.",
  ".OBBBBBBBBBBO.",
  ".OLLLLLLLLLLO.",
  "...OwwwwwwO...",
  "...OOOOOOOO...",
];

export const COROLARIA_SIDE_PIXELS = [
  "...OOOOOOOO...",
  "...OddddddO...",
  "..OddmmmmddO..",
  "..OkkkkkkkkO..",
  "..OkkhhhhkkO..",
  "..OkkkkkOkkO..",
  "..OkkkkkkkkO..",
  "..OksssssskO..",
  "..OksssssskO..",
  ".OLbbbbbbbbLO.",
  ".ObbbbLLbbbbO.",
  ".ObbbbbbbbbbO.",
  ".OkbbbbbbbbkO.",
  ".OkbbbbbbbbkO.",
  ".OLLLLLLLLLLO.",
  ".OBBBBBBBBBBO.",
  ".OBBBBBBBBBBO.",
  ".OBBBBBBBBBBO.",
  ".OBBBBBBBBBBO.",
  ".OLLLLLLLLLLO.",
  "...OwwwwwwO...",
  "...OOOOOOOO...",
];
