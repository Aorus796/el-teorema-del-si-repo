/*
 * Pixel-art indexado de la mesa de lectura de `library` (Biblioteca del
 * Margen -- Library Visual Polish, v1.1, ronda de composición). Mesa larga
 * con un banco integrado a AMBOS lados del tablero (lectura de arriba a
 * abajo: banco / mesa / banco), mismo patrón que weddingTablePixelArt.js
 * (mesa+asientos en un único sprite) pero simétrico verticalmente para que
 * las 4 instancias del mapa se lean como mesas de lectura reales con
 * asiento en ambos lados, no solo uno. El bloque de banco inferior
 * (banco+patas+hueco, sin la sombra de contacto) se espeja hacia arriba
 * tal cual, mismo lenguaje visual (colores, contorno, veta) en ambos
 * bancos -- el banco superior no lleva su propia sombra de contacto
 * (queda contra el borde superior del sprite) para no duplicarla y así
 * mantener el alto total dentro del margen de 48px disponible entre
 * estanterías en las mesas noroeste/noreste. Dos libros apoyados sobre el
 * tablero para leerse como mueble de biblioteca y no una mesa genérica.
 * Puramente decorativa: no aparece en `objects` ni en solidRegions, no
 * bloquea ni se puede interactuar con ella (ver createMap() en
 * worldMaps.js -- decorations nunca alimentan solidTiles).
 *
 * Generada proceduralmente (ver scratch-generate-library-art.mjs,
 * script de un solo uso, no forma parte del repositorio) para garantizar
 * las dimensiones exactas 64x40 sin errores de transcripción manual.
 */

export const LIBRARY_READING_TABLE_TRANSPARENT = ".";

export const LIBRARY_READING_TABLE_PALETTE = {
  O: "#241812", // contorno
  w: "#3f2a1e", // madera oscura (patas)
  W: "#7c5134", // madera media (tablero)
  x: "#a06f4c", // veta/resalte claro (tablero y asiento del banco)
  h: "#8f6142", // resalte superior
  R: "#8a3324", // libro rojo apoyado sobre la mesa
  Y: "#c08a2e", // libro dorado apoyado sobre la mesa
  s: "rgb(0 0 0 / 30%)", // sombra de contacto
};

export const LIBRARY_READING_TABLE_PIXEL_WIDTH = 64;
export const LIBRARY_READING_TABLE_PIXEL_HEIGHT = 40;

export const LIBRARY_READING_TABLE_PIXELS = [
  "..............OwwO............................OwwO..............",
  "..............OwwO............................OwwO..............",
  "..............OwwO............................OwwO..............",
  "..............OwwO............................OwwO..............",
  "........OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO........",
  "........OxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO........",
  "........OxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO........",
  "........OxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO........",
  "........OxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO........",
  "........OhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhO........",
  "........OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO........",
  "................................................................",
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "OhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhO",
  "OWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWO",
  "OWWWWWWWWORRRRROWWWWWWWWWWWWWWWWWWWWWWWWWWWWOYYYYYOWWWWWWWWWWWWO",
  "OWWWWWWWWORRRRROWWWWWWWWWWWWWWWWWWWWWWWWWWWWOYYYYYOWWWWWWWWWWWWO",
  "OWWWWWWWWORRRRROWWWWWWWWWWWWWWWWWWWWWWWWWWWWOYYYYYOWWWWWWWWWWWWO",
  "OWWWWWWWWOOOOOOOWWWWWWWWWWWWWWWWWWWWWWWWWWWWOOOOOOOWWWWWWWWWWWWO",
  "OWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWO",
  "OxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO",
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "......OwwO............................................OwwO......",
  "......OwwO............................................OwwO......",
  "......OwwO............................................OwwO......",
  "................................................................",
  "........OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO........",
  "........OhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhO........",
  "........OxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO........",
  "........OxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO........",
  "........OxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO........",
  "........OxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO........",
  "........OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO........",
  "..............OwwO............................OwwO..............",
  "..............OwwO............................OwwO..............",
  "..............OwwO............................OwwO..............",
  "..............OwwO............................OwwO..............",
  "........ssssssssssssssssssssssssssssssssssssssssssssssss........",
  "..........ssssssssssssssssssssssssssssssssssssssssssss..........",
  "................................................................",
];
