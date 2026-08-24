/*
 * Pixel-art indexado del módulo de cajas/documentos apilados de `archive`
 * (Archivo -- Visual Polish, v1.1). Migra las 2 decoraciones que antes
 * usaban el tipo compartido "tables" a un tipo exclusivo "archive-crates",
 * deliberadamente distinto de "archive-shelf" (ver archiveShelfPixelArt.js):
 * en vez de lomos finos en fila, son 6 cajas grandes con etiqueta y cinta,
 * en 2 filas de 3, separadas por un margen de fondo ("g") y una sombra de
 * contacto ("s") bajo la fila inferior.
 *
 * Único tamaño real en archive (64x32, ver worldMaps.js: ambas
 * decoraciones -- oeste y este -- comparten exactamente esas dimensiones).
 *
 * Generado proceduralmente (ver scratch-generate-archive-art.mjs, script de
 * un solo uso, no forma parte del repositorio) a partir de una única celda
 * de caja (20x14) repetida 6 veces con dos combinaciones de color de
 * etiqueta, para garantizar exactamente 32 filas y el ancho declarado sin
 * errores de transcripción manual.
 */

export const ARCHIVE_CRATES_TRANSPARENT = ".";

export const ARCHIVE_CRATES_PALETTE = {
  O: "#211a17", // contorno
  h: "#8a7259", // resalte superior de la tapa
  W: "#63503d", // cartón/madera media
  d: "#3a2e22", // cinta/franja oscura
  j: "#241b14", // sombra lateral
  y: "#a98a4d", // etiqueta ocre
  l: "#4c6b5c", // etiqueta verde grisácea
  g: "#332a24", // fondo/margen entre cajas
  s: "rgb(0 0 0 / 30%)", // sombra de contacto bajo la fila inferior
};

export const ARCHIVE_CRATES_PIXEL_WIDTH = 64;
export const ARCHIVE_CRATES_PIXEL_HEIGHT = 32;

export const ARCHIVE_CRATES_PIXELS = [
  "gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg",
  "gOOOOOOOOOOOOOOOOOOOOgOOOOOOOOOOOOOOOOOOOOgOOOOOOOOOOOOOOOOOOOOg",
  "gOhhhhhhhhhhhhhhhhhhOgOhhhhhhhhhhhhhhhhhhOgOhhhhhhhhhhhhhhhhhhOg",
  "gOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOg",
  "gOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOg",
  "gOWWWyyyyyyyyyyyyWWWOgOWWWllllllllllllWWWOgOWWWyyyyyyyyyyyyWWWOg",
  "gOWWWyyyyyyyyyyyyWWWOgOWWWllllllllllllWWWOgOWWWyyyyyyyyyyyyWWWOg",
  "gOWWWyyyyyyyyyyyyWWWOgOWWWllllllllllllWWWOgOWWWyyyyyyyyyyyyWWWOg",
  "gOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOg",
  "gOddddddddddddddddddOgOddddddddddddddddddOgOddddddddddddddddddOg",
  "gOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOg",
  "gOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOg",
  "gOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOg",
  "gOjjjjjjjjjjjjjjjjjjOgOjjjjjjjjjjjjjjjjjjOgOjjjjjjjjjjjjjjjjjjOg",
  "gOOOOOOOOOOOOOOOOOOOOgOOOOOOOOOOOOOOOOOOOOgOOOOOOOOOOOOOOOOOOOOg",
  "gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg",
  "gOOOOOOOOOOOOOOOOOOOOgOOOOOOOOOOOOOOOOOOOOgOOOOOOOOOOOOOOOOOOOOg",
  "gOhhhhhhhhhhhhhhhhhhOgOhhhhhhhhhhhhhhhhhhOgOhhhhhhhhhhhhhhhhhhOg",
  "gOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOg",
  "gOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOg",
  "gOWWWllllllllllllWWWOgOWWWyyyyyyyyyyyyWWWOgOWWWllllllllllllWWWOg",
  "gOWWWllllllllllllWWWOgOWWWyyyyyyyyyyyyWWWOgOWWWllllllllllllWWWOg",
  "gOWWWllllllllllllWWWOgOWWWyyyyyyyyyyyyWWWOgOWWWllllllllllllWWWOg",
  "gOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOg",
  "gOddddddddddddddddddOgOddddddddddddddddddOgOddddddddddddddddddOg",
  "gOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOg",
  "gOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOg",
  "gOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOgOWWWWWWWWWWWWWWWWWWOg",
  "gOjjjjjjjjjjjjjjjjjjOgOjjjjjjjjjjjjjjjjjjOgOjjjjjjjjjjjjjjjjjjOg",
  "gOOOOOOOOOOOOOOOOOOOOgOOOOOOOOOOOOOOOOOOOOgOOOOOOOOOOOOOOOOOOOOg",
  "ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
  "gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg",
];
