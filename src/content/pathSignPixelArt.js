/*
 * Pixel-art indexado del cartel/poste de señalética de seven-bridges-walk
 * (Seven Bridges Visual Polish). Decoración puramente ambiental colocada
 * junto a interactuables existentes (el tablero del puzle P2 y la nota
 * junto al embarcadero) -- no toca su id, posición, radio de interacción
 * ni lógica, solo mejora la lectura del entorno alrededor.
 */

export const PATH_SIGN_TRANSPARENT = ".";

export const PATH_SIGN_PALETTE = {
  O: "#201d18", // contorno
  G: "#c2a34f", // marco dorado del cartel
  c: "#efe2bf", // cara crema del cartel
  W: "#7c5134", // madera media del poste
  x: "#a06f4c", // resalte de madera del poste
  h: "#a89e89", // resalte de la base de piedra
  s: "rgb(0 0 0 / 30%)", // sombra de contacto
};

export const PATH_SIGN_PIXEL_WIDTH = 16;
export const PATH_SIGN_PIXEL_HEIGHT = 30;

export const PATH_SIGN_PIXELS = [
  ".OOOOOOOOOOOOOO.",
  ".OGGGGGGGGGGGGO.",
  ".OGccccccccccGO.",
  ".OGccccccccccGO.",
  ".OGccccccccccGO.",
  ".OGccccccccccGO.",
  ".OGccccccccccGO.",
  ".OGccccccccccGO.",
  ".OGGGGGGGGGGGGO.",
  ".OOOOOOOOOOOOOO.",
  "......OxWO......",
  "......OxWO......",
  "......OxWO......",
  "......OxWO......",
  "......OxWO......",
  "......OxWO......",
  "......OxWO......",
  "......OxWO......",
  "......OxWO......",
  "......OxWO......",
  "......OxWO......",
  "......OxWO......",
  "......OxWO......",
  "......OxWO......",
  "......OxWO......",
  "......OxWO......",
  "...hhhhhhhhhh...",
  "...ssssssssss...",
  "...OOOOOOOOOO...",
  "..ssssssssssss..",
];
