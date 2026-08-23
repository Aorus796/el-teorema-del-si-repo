/*
 * Pixel-art indexado de la escalera de biblioteca de `library`
 * (Biblioteca del Margen -- Library Visual Polish, v1.1). Escalera
 * pequena de dos largueros con 4 peldanos horizontales, dentro de la
 * caja 16x36. Puramente decorativa: no aparece en `objects` ni en
 * solidRegions (ver createMap() en worldMaps.js -- decorations nunca
 * alimentan solidTiles).
 *
 * Generada proceduralmente (ver scratch-generate-library-art.mjs,
 * script de un solo uso, no forma parte del repositorio) para garantizar
 * las dimensiones exactas 16x36 sin errores de transcripcion manual.
 */

export const LIBRARY_LADDER_TRANSPARENT = ".";

export const LIBRARY_LADDER_PALETTE = {
  O: "#241812", // contorno de los largueros
  w: "#5c3b22", // madera de los largueros
  S: "#8a6239", // peldano de madera clara
  h: "#a06f4c", // resalte superior del peldano
  s: "rgb(0 0 0 / 30%)", // sombra de contacto en el suelo
};

export const LIBRARY_LADDER_PIXEL_WIDTH = 16;
export const LIBRARY_LADDER_PIXEL_HEIGHT = 36;

export const LIBRARY_LADDER_PIXELS = [
  "................",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".hhhhhhhhhhhhhh.",
  ".SSSSSSSSSSSSSS.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".hhhhhhhhhhhhhh.",
  ".SSSSSSSSSSSSSS.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".hhhhhhhhhhhhhh.",
  ".SSSSSSSSSSSSSS.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".hhhhhhhhhhhhhh.",
  ".SSSSSSSSSSSSSS.",
  ".Ow..........wO.",
  ".Ow..........wO.",
  ".OOOOOOOOOOOOOO.",
  ".ssssssssssssss.",
];
