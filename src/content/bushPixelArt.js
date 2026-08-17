/*
 * Pixel-art indexado de la vegetación decorativa de axiom-plaza (arbustos
 * redondos y cipreses -- Plaza Visual Polish, migración de props). El
 * mapa usa el mismo tipo de decoración ("bush") en tres tamaños reales
 * distintos (ver worldMaps.js): 20x24 junto a la fuente, 20x20 en las
 * cuatro esquinas, y 14x34 para los cipreses -- así que este módulo
 * exporta tres matrices de PIXELS independientes que comparten una única
 * paleta compacta (los mismos tonos de verde/tronco/sombra en los tres).
 */

export const BUSH_TRANSPARENT = ".";

export const BUSH_PALETTE = {
  O: "#241812", // outline
  d: "#4a3223", // tronco/base
  g: "#3d5730", // follaje verde oscuro
  G: "#5a7d45", // follaje verde medio
  l: "#7fa860", // follaje verde claro
  P: "#e8b7c8", // flor rosa
  h: "rgb(255 255 255 / 25%)", // highlight sutil
  s: "rgb(0 0 0 / 30%)", // sombra de contacto
};

export const BUSH_ROUND_FOUNTAIN_PIXEL_WIDTH = 20;
export const BUSH_ROUND_FOUNTAIN_PIXEL_HEIGHT = 27;
export const BUSH_ROUND_FOUNTAIN_PIXELS = [
  "..OOOOOOOOOOOOOOOO..",
  "..OllllllllllllllO..",
  "..OllllllllllllllO..",
  "OOlllllllPllllllllOO",
  "OGllllllllllllllllGO",
  "OGllllllllllllllllGO",
  "OGllllllllllllllllGO",
  "OhllllllllllllllllGO",
  "OGllllllllllllllllGO",
  "OGGGGGGGGGGGGGGGGGGO",
  "OGGGGGGGGGGGGGGGGGGO",
  ".OggggggggggggggggO.",
  ".OggggggggggggggggO.",
  ".OggggggggggggggggO.",
  ".OggggggggggggggggO.",
  ".OggggggggggggggggO.",
  ".OggggggggggggggggO.",
  ".OggggggggggggggggO.",
  ".OggggggggggggggggO.",
  ".OOOOOOOggggOOOOOOO.",
  "........OddO........",
  "........OddO........",
  "........OddO........",
  "........OOOO........",
  "ssssssssssssssssssss",
  ".ssssssssssssssssss.",
  "....................",
];

export const BUSH_ROUND_CORNER_PIXEL_WIDTH = 20;
export const BUSH_ROUND_CORNER_PIXEL_HEIGHT = 23;
export const BUSH_ROUND_CORNER_PIXELS = [
  "..OOOOOOOOOOOOOOOO..",
  "..OllllllllllllllO..",
  "OOlllllllPllllllllOO",
  "OGllllllllllllllllGO",
  "OGllllllllllllllllGO",
  "OhllllllllllllllllGO",
  "OGllllllllllllllllGO",
  "OGGGGGGGGGGGGGGGGGGO",
  "OGGGGGGGGGGGGGGGGGGO",
  ".OggggggggggggggggO.",
  ".OggggggggggggggggO.",
  ".OggggggggggggggggO.",
  ".OggggggggggggggggO.",
  ".OggggggggggggggggO.",
  ".OggggggggggggggggO.",
  ".OOOOOOOggggOOOOOOO.",
  "........OddO........",
  "........OddO........",
  "........OddO........",
  "........OOOO........",
  "ssssssssssssssssssss",
  ".ssssssssssssssssss.",
  "....................",
];

export const CYPRESS_PIXEL_WIDTH = 14;
export const CYPRESS_PIXEL_HEIGHT = 37;
export const CYPRESS_PIXELS = [
  "..............",
  "...OOOOOOOO...",
  "...OGGGlGGO...",
  "...OggggggO...",
  "..OGGGGGGGGO..",
  "..OGGGGGGGGO..",
  "..OggggggggO..",
  "..OggggggggO..",
  "..OGGGGGGGGO..",
  "..OGGGGGGGGO..",
  "..OggggggggO..",
  "..OggggggggO..",
  "..OggggggggO..",
  ".OGGGGGGGGGGO.",
  ".OlGGGGGGGGGO.",
  ".OggggggggggO.",
  ".OggggggggggO.",
  ".OggggggggggO.",
  ".OggggggggggO.",
  ".OGGGGGGGGGGO.",
  ".OGGGGGGGGGGO.",
  ".OggggggggggO.",
  ".OggggggggglO.",
  ".OggggggggggO.",
  ".OggggggggggO.",
  "OGGGGGGGGGGGGO",
  "OGGGGGGGGGGGGO",
  "OggggggggggggO",
  "OggggggggggggO",
  "OggggggggggggO",
  "OOOOOggggOOOOO",
  ".....OddO.....",
  ".....OddO.....",
  ".....OOOO.....",
  "ssssssssssssss",
  ".ssssssssssss.",
  "..............",
];
