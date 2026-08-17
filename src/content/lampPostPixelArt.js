/*
 * Pixel-art indexado del farol de axiom-plaza (Plaza Visual Polish --
 * migración de props). Mismo formato que weddingTablePixelArt.js.
 */

export const LAMP_POST_PIXEL_WIDTH = 13;
export const LAMP_POST_PIXEL_HEIGHT = 42;
export const LAMP_POST_TRANSPARENT = ".";

export const LAMP_POST_PALETTE = {
  O: "#241812", // outline
  w: "#3a2c22", // metal/madera oscura (poste, base, marco)
  W: "#4d3628", // metal/madera media (highlight lateral)
  d: "#c2a34f", // marco del cristal, dorado oscuro
  D: "#d6b65f", // marco del cristal, dorado claro
  j: "rgb(247 230 168 / 30%)", // halo cálido
  y: "#f7e6a8", // luz interior media
  Y: "#fff7df", // luz interior brillante
  s: "rgb(0 0 0 / 30%)", // sombra de contacto
};

export const LAMP_POST_PIXELS = [
  "....OOOO.....",
  ".OOOwwwwOOO..",
  ".OwwwwwwwwO..",
  "OjDDdddddddO.",
  "OjDDdddddddO.",
  "OjDDyyyyyddO.",
  "OjDDyYYYyddO.",
  "OjDDyYYYyddO.",
  "OjDDyYYYyddO.",
  "OjDDyyyyyddO.",
  "OjDDdddddddO.",
  "OOOOOjjjOOOO.",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  ".....OwO.....",
  "...OOwwwOO...",
  "...OWWWWWO...",
  "...OWWWWWO...",
  "...OwwwwwO...",
  "...OOOOOOO...",
  "sssssssssss..",
  "sssssssssss..",
  "sssssssssss..",
];
