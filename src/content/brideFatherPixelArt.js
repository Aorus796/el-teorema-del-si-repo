/*
 * Pixel-art indexado del Padre de la novia (Bride Father Character
 * Pixel-Art -- aplica al Padre de la novia el mismo lenguaje visual ya
 * aprobado para Gonzalo, Elena y Corolaria: matriz de caracteres +
 * paleta compacta, rasterizada una única vez y cacheada -- ver
 * src/render/BrideFatherRenderer.js, que replica el patrón de
 * CorolariaRenderer.js/ElenaRenderer.js/GonzaloRenderer.js (cache local
 * propia, sin tocar ni una línea de esos tres módulos ni de sus datos).
 *
 * Tres variantes ("front"/"back"/"side") comparten el mismo cuerpo salvo:
 *  - fila de ojos (fila 5): "front" tiene los dos ojos (mismo criterio
 *    humano aprobado con Gonzalo/Elena/Corolaria -- 1 pixel lógico por
 *    ojo, color oscuro, sin blanco, sin pupila compleja), "side" tiene
 *    solo el ojo del lado visible, "back" no tiene ninguno;
 *  - filas 3-8 (cabeza): "front"/"side" muestran cara (piel con frente
 *    resaltada, mejillas y sombra de mandíbula, con canas en las sienes),
 *    "back" muestra pelo/canas continuos -- aplicado así desde el primer
 *    diseño (no como corrección posterior), aprendiendo directamente de
 *    las microiteraciones que hicieron falta en Gonzalo (ver
 *    CHANGELOG.md): fila 9 (nuca/cuello) es la única excepción y muestra
 *    piel incluso de espaldas, igual que la fila de nuca final de
 *    Gonzalo, para que la cobertura de pelo trasero no termine en un
 *    corte brusco ni deje una banda de calvicie.
 * "side" se usa también para el facing "left", reflejado horizontalmente
 * en tiempo de dibujo (ver BrideFatherRenderer.js) -- un único dataset
 * lateral, no dos.
 *
 * Identidad propia del Padre de la novia, preservando el diseño
 * geométrico ya aprobado que sustituye (WorldScene.js:renderBrideFather()
 * anterior: azul #486987 + crema #efe2bf, silueta oscura, torso robusto
 * de ancho completo) pero deliberadamente distinta de Gonzalo en su
 * construcción, no solo en color: cabeza con canas en las sienes (grises,
 * no castañas) en vez del pelo joven de Gonzalo, y sobre todo un torso
 * MUCHO más ancho -- filas 10-15 ocupan el ancho completo del sprite
 * (14 columnas, sin margen transparente a los lados), frente a las 12
 * columnas del torso de Gonzalo/Corolaria -- que se estrecha de forma
 * marcada hacia unas piernas separadas por un hueco central visible
 * (filas 17-20, 8 columnas partidas en dos), leyéndose como una presencia
 * adulta más sólida y madura. El acento crema aparece en el cuello de la
 * camisa (fila 11) y en el puño del pantalón (fila 19) para reforzar la
 * identidad de "azul + crema" ya aprobada. Bounding box 14x22, misma
 * escala que Gonzalo, Elena y Corolaria (el bounding box geométrico
 * anterior ya era 14x22 -- ver comentario de tamaño más abajo -- así que
 * no cambia); la hitbox real del NPC en worldMaps.js, 14x18, tampoco
 * cambia.
 */

export const BRIDE_FATHER_PIXEL_WIDTH = 14;
export const BRIDE_FATHER_PIXEL_HEIGHT = 22;
export const BRIDE_FATHER_TRANSPARENT = ".";

// Preserva exactamente los cinco colores ya existentes de
// BRIDE_FATHER_PALETTE (characterPalettes.js) -- outline/ojos reutiliza
// "silhouette", "d" reutiliza "hair" (gris, ya canoso de por sí), "k"
// reutiliza "head" (= SKIN_TONE, compartido con Gonzalo/Elena/Corolaria),
// "b" reutiliza "body" (azul), "L" reutiliza "bodyAccent" (crema) -- más
// cinco tonos derivados nuevos para el volumen/sombreado que el render
// geométrico anterior no tenía. Mismo número de colores que
// GONZALO_PALETTE/ELENA_PALETTE/COROLARIA_PALETTE (10), con sus propios
// valores hexadecimales salvo la piel (compartida) -- el Padre no se lee
// como "Gonzalo recoloreado": comparte filosofía de paleta y la
// geometría de cabeza (edad adulta, pelo con mechón lateral), no los
// valores de color ni, sobre todo, las proporciones del torso.
// Nombrada BRIDE_FATHER_PIXEL_PALETTE (no BRIDE_FATHER_PALETTE) para no
// colisionar con la constante ya existente del mismo nombre en
// characterPalettes.js, que sigue viva (consumida por esta paleta, por
// comparación, y todavía indirectamente relevante para el resto del
// código que no pasa por el renderer indexado).
export const BRIDE_FATHER_PIXEL_PALETTE = {
  O: "#241f1c", // contorno + ojos (= BRIDE_FATHER_PALETTE.silhouette de characterPalettes.js)
  d: "#5a5250", // pelo/canas oscuro (= BRIDE_FATHER_PALETTE.hair)
  m: "#a8a19d", // pelo/canas claro (highlight de cana, sin llegar a blanco)
  k: "#d9a06f", // piel base (= BRIDE_FATHER_PALETTE.head / SKIN_TONE)
  h: "#f0c090", // piel highlight (frente)
  s: "#b07f52", // piel sombra (mandíbula)
  b: "#486987", // azul medio, camisa (= BRIDE_FATHER_PALETTE.body)
  B: "#35505f", // azul oscuro, sombra de camisa/pantalón
  L: "#efe2bf", // crema, cuello y puño (= BRIDE_FATHER_PALETTE.bodyAccent)
  w: "#3a3040", // calzado
};

export const BRIDE_FATHER_FRONT_PIXELS = [
  "...OOOOOOOO...",
  "...OddddddO...",
  "..OddmmmmddO..",
  "..OdmhhhhmdO..",
  "..OdkkkkkkmO..",
  "..OdkOkkOkmO..",
  "..OdkkkkkkmO..",
  "..OdssssssdO..",
  "..OdssssssdO..",
  "..OdssssssdO..",
  "ObbbbbbbbbbbbO",
  "ObbbbLLLLbbbbO",
  "OkbbbbbbbbbbkO",
  "OkbbbbbbbbbbkO",
  "ObbbbbbbbbbbbO",
  "OBBBBBBBBBBBBO",
  "...OBBBBBBO...",
  "...Obb..bbO...",
  "...Obb..bbO...",
  "...OLL..LLO...",
  "...Oww..wwO...",
  "...OOOOOOOO...",
];

export const BRIDE_FATHER_BACK_PIXELS = [
  "...OOOOOOOO...",
  "...OddddddO...",
  "..OddmmmmddO..",
  "..OddddddddO..",
  "..OddmmmmddO..",
  "..OddddddddO..",
  "..OddmmmmddO..",
  "..OddddddddO..",
  "..OddddddddO..",
  "..OdssssssdO..",
  "ObbbbbbbbbbbbO",
  "ObbbbLLLLbbbbO",
  "OkbbbbbbbbbbkO",
  "OkbbbbbbbbbbkO",
  "ObbbbbbbbbbbbO",
  "OBBBBBBBBBBBBO",
  "...OBBBBBBO...",
  "...Obb..bbO...",
  "...Obb..bbO...",
  "...OLL..LLO...",
  "...Oww..wwO...",
  "...OOOOOOOO...",
];

export const BRIDE_FATHER_SIDE_PIXELS = [
  "...OOOOOOOO...",
  "...OddddddO...",
  "..OddmmmmddO..",
  "..OdmhhhhmdO..",
  "..OdkkkkkkmO..",
  "..OdkkkkOkmO..",
  "..OdkkkkkkmO..",
  "..OdssssssdO..",
  "..OdssssssdO..",
  "..OdssssssdO..",
  "ObbbbbbbbbbbbO",
  "ObbbbLLLLbbbbO",
  "OkbbbbbbbbbbkO",
  "OkbbbbbbbbbbkO",
  "ObbbbbbbbbbbbO",
  "OBBBBBBBBBBBBO",
  "...OBBBBBBO...",
  "...Obb..bbO...",
  "...Obb..bbO...",
  "...OLL..LLO...",
  "...Oww..wwO...",
  "...OOOOOOOO...",
];
