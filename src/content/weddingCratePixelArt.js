/*
 * Pixel-art indexado de la caja de preparativos de axiom-plaza (Plaza
 * Visual Polish -- migración de props). Mismo formato que
 * weddingTablePixelArt.js.
 */

export const WEDDING_CRATE_PIXEL_WIDTH = 14;
export const WEDDING_CRATE_PIXEL_HEIGHT = 17;
export const WEDDING_CRATE_TRANSPARENT = ".";

export const WEDDING_CRATE_PALETTE = {
  O: "#241812", // outline
  G: "#5a7d45", // hojas verde medio
  P: "#e8b7c8", // flor rosa
  W: "#8a5a3c", // madera media
  d: "#6d4530", // madera oscura (trim)
  f: "#f5ece0", // flor blanca
  j: "#4a3223", // sombra lateral de madera
  s: "rgb(0 0 0 / 30%)", // sombra de contacto
};

export const WEDDING_CRATE_PIXELS = [
  "..OOOO..OOOO..",
  ".OPPPPOOffffO.",
  ".OPPPPGGffffO.",
  ".OPPPPGGffffO.",
  ".OGGGGGGGGGGO.",
  "OjddddddddddjO",
  "OjddddddddddjO",
  "OjWWWWWWWWWWjO",
  "OjWWWWWWWWWWjO",
  "OjWWWWWWWWWWjO",
  "OjWWWWWWWWWWjO",
  "OjWWWWWWWWWWjO",
  "OjddddddddddjO",
  "OOOOOOOOOOOOOO",
  "ssssssssssssss",
  "ssssssssssssss",
  "..............",
];
