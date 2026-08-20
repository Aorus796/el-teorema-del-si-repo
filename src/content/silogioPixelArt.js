/*
 * Pixel-art indexado de Silogio (Silogio Character Pixel-Art -- aplica a
 * Silogio el mismo lenguaje visual ya aprobado para Gonzalo, Elena,
 * Corolaria y el Padre de la novia: matriz de caracteres + paleta
 * compacta, rasterizada una única vez y cacheada -- ver
 * src/render/SilogioRenderer.js, que replica el patrón de
 * BrideFatherRenderer.js/CorolariaRenderer.js/ElenaRenderer.js/
 * GonzaloRenderer.js (cache local propia, sin tocar ni una línea de esos
 * cuatro módulos ni de sus datos).
 *
 * Tres variantes ("front"/"back"/"side") comparten el mismo cuerpo salvo:
 *  - fila de ojos (fila 5): "front" tiene los dos ojos (mismo criterio
 *    humano aprobado con los cuatro personajes anteriores -- 1 pixel
 *    lógico por ojo, color oscuro, sin blanco, sin pupila compleja),
 *    "side" tiene solo el ojo del lado visible, "back" no tiene ninguno;
 *  - filas 3-8 (cabeza): "front"/"side" muestran cara con gafas (piel,
 *    lentes redondas simples con puente central, mejillas y sombra de
 *    mandíbula), "back" muestra pelo continuo -- las gafas NO aparecen
 *    en "back" porque no son visibles de espaldas. Aplicado así desde el
 *    primer diseño (no como corrección posterior), aprendiendo
 *    directamente de las microiteraciones que hicieron falta en Gonzalo
 *    (ver CHANGELOG.md): fila 9 (nuca/cuello) es la única excepción y
 *    muestra piel incluso de espaldas, para que la cobertura de pelo
 *    trasero no termine en un corte brusco ni deje una banda de
 *    calvicie.
 * "side" se usa también para el facing "left", reflejado horizontalmente
 * en tiempo de dibujo (ver SilogioRenderer.js) -- un único dataset
 * lateral, no dos. Las gafas (fila 4) se mantienen idénticas entre
 * "front" y "side" (no se reduce a una sola lente en lateral) para no
 * introducir una segunda fila divergente además de la de ojos -- mismo
 * criterio de "una única fila de diferencia" ya usado en los cuatro
 * personajes anteriores.
 *
 * Identidad propia de Silogio, preservando el diseño geométrico ya
 * aprobado que sustituye (WorldScene.js:renderSilogio() anterior: teal
 * oscuro + acento mostaza, silueta larga y estrecha, aspecto erudito)
 * pero deliberadamente distinta de los cuatro personajes anteriores en
 * su construcción: el abrigo/túnica (filas 10-19) es la silueta MÁS
 * ESTRECHA de los cinco personajes migrados -- 10 columnas de ancho en
 * TODA su longitud, de hombros a bajo, sin ensanchar en ningún punto más
 * allá del ancho de la cabeza (misma anchura que ella) -- a diferencia
 * de Gonzalo/Corolaria/Padre, que siempre tienen hombros/torso más
 * anchos que la cabeza en algún tramo. Distinta también de la base recta
 * de Corolaria (12 columnas constantes): la de Silogio es más estrecha
 * (10, no 12) además de vertical. Pelo gris en dos tonos con una mezcla
 * asimétrica en la coronilla (fila 2)
 * para leerse como "algo desordenado", y gafas redondas simples (fila 4:
 * dos clústeres de 2 píxeles por lente con un hueco de piel central de 2
 * píxeles a modo de puente, sin dominar la cabeza) que no existían en el
 * render geométrico anterior. Bounding box 14x22, misma escala que
 * Gonzalo, Elena, Corolaria y el Padre (el bounding box geométrico
 * anterior era más estrecho, ~12x22 -- ver el comentario de tamaño en
 * SilogioRenderer.js); la hitbox real del NPC en worldMaps.js, 14x18, no
 * cambia.
 */

export const SILOGIO_PIXEL_WIDTH = 14;
export const SILOGIO_PIXEL_HEIGHT = 22;
export const SILOGIO_TRANSPARENT = ".";

// Nombrada SILOGIO_PIXEL_PALETTE (no SILOGIO_PALETTE) para no colisionar
// con la constante ya existente del mismo nombre en characterPalettes.js.
// Preserva exactamente los cinco colores ya existentes de esa paleta --
// outline/ojos/gafas reutiliza "silhouette", "d" reutiliza "hair", "k"
// reutiliza "head" (= SKIN_TONE, compartido con los cuatro personajes
// anteriores), "b" reutiliza "body" (teal), "L" reutiliza "bodyAccent"
// (mostaza) -- más cinco tonos derivados nuevos para el volumen/
// sombreado que el render geométrico anterior no tenía. Mismo número de
// colores que GONZALO_PALETTE/ELENA_PALETTE/COROLARIA_PALETTE/
// BRIDE_FATHER_PIXEL_PALETTE (10), con sus propios valores hexadecimales
// salvo la piel (compartida) -- Silogio no se lee como "otro personaje
// recoloreado": comparte filosofía de paleta, no los valores ni,
// especialmente, la anchura de la silueta.
export const SILOGIO_PIXEL_PALETTE = {
  O: "#22303a", // contorno + ojos + gafas (= SILOGIO_PALETTE.silhouette de characterPalettes.js)
  d: "#9a9a9a", // pelo gris medio (= SILOGIO_PALETTE.hair)
  m: "#c9c9c9", // pelo gris claro (highlight, "desordenado")
  k: "#d9a06f", // piel base (= SILOGIO_PALETTE.head / SKIN_TONE)
  h: "#f0c090", // piel highlight (frente)
  s: "#b07f52", // piel sombra (mandíbula)
  b: "#4a6b6c", // teal medio, abrigo (= SILOGIO_PALETTE.body)
  B: "#374f50", // teal oscuro, sombra del abrigo
  L: "#c98f3a", // mostaza, panel y dobladillo (= SILOGIO_PALETTE.bodyAccent)
  w: "#3a3040", // calzado
};

export const SILOGIO_FRONT_PIXELS = [
  "...OOOOOOOO...",
  "...OddddddO...",
  "..OmdmddmdmO..",
  "..OdmhhhhmdO..",
  "..OdOOkkOOmO..",
  "..OdkOkkOkmO..",
  "..OdkkkkkkmO..",
  "..OdssssssdO..",
  "..OdssssssdO..",
  "..OdssssssdO..",
  "..ObbbbbbbbO..",
  "..ObbbLLbbbO..",
  "..OkbbLLbbkO..",
  "..OkbbLLbbkO..",
  "..ObbbLLbbbO..",
  "..OBBBLLBBBO..",
  "..OBBBLLBBBO..",
  "..OBBBLLBBBO..",
  "..OLLLLLLLLO..",
  "..OBBBBBBBBO..",
  "...OwwwwwwO...",
  "...OOOOOOOO...",
];

export const SILOGIO_BACK_PIXELS = [
  "...OOOOOOOO...",
  "...OddddddO...",
  "..OmdmddmdmO..",
  "..OddddddddO..",
  "..OddmmmmddO..",
  "..OddddddddO..",
  "..OddmmmmddO..",
  "..OddddddddO..",
  "..OddddddddO..",
  "..OdssssssdO..",
  "..ObbbbbbbbO..",
  "..ObbbLLbbbO..",
  "..OkbbLLbbkO..",
  "..OkbbLLbbkO..",
  "..ObbbLLbbbO..",
  "..OBBBLLBBBO..",
  "..OBBBLLBBBO..",
  "..OBBBLLBBBO..",
  "..OLLLLLLLLO..",
  "..OBBBBBBBBO..",
  "...OwwwwwwO...",
  "...OOOOOOOO...",
];

export const SILOGIO_SIDE_PIXELS = [
  "...OOOOOOOO...",
  "...OddddddO...",
  "..OmdmddmdmO..",
  "..OdmhhhhmdO..",
  "..OdOOkkOOmO..",
  "..OdkkkkOkmO..",
  "..OdkkkkkkmO..",
  "..OdssssssdO..",
  "..OdssssssdO..",
  "..OdssssssdO..",
  "..ObbbbbbbbO..",
  "..ObbbLLbbbO..",
  "..OkbbLLbbkO..",
  "..OkbbLLbbkO..",
  "..ObbbLLbbbO..",
  "..OBBBLLBBBO..",
  "..OBBBLLBBBO..",
  "..OBBBLLBBBO..",
  "..OLLLLLLLLO..",
  "..OBBBBBBBBO..",
  "...OwwwwwwO...",
  "...OOOOOOOO...",
];
