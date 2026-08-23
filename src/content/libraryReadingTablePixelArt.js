/*
 * Pixel-art indexado de la mesa de lectura de `library` (Biblioteca del
 * Margen -- Library Visual Polish, v1.1). Mesa larga con un banco
 * integrado en el mismo sprite (mismo patron que
 * weddingTablePixelArt.js, que combina mesa+sillas en un unico sprite) y
 * dos libros apoyados sobre el tablero para leerse como mueble de
 * biblioteca y no una mesa generica. Puramente decorativa: no aparece en
 * `objects` ni en solidRegions, no bloquea ni se puede interactuar con
 * ella (ver createMap() en worldMaps.js -- decorations nunca alimentan
 * solidTiles).
 *
 * Generada proceduralmente (ver scratch-generate-library-art.mjs,
 * script de un solo uso, no forma parte del repositorio) para garantizar
 * las dimensiones exactas 64x28 sin errores de transcripcion manual.
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
export const LIBRARY_READING_TABLE_PIXEL_HEIGHT = 28;

export const LIBRARY_READING_TABLE_PIXELS = [
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
