/*
 * Pixel-art indexado del rollo de tela decorativo de axiom-plaza (Plaza
 * Visual Polish -- migración de props). Mismo formato que
 * weddingTablePixelArt.js.
 */

export const FABRIC_ROLL_PIXEL_WIDTH = 16;
export const FABRIC_ROLL_PIXEL_HEIGHT = 14;
export const FABRIC_ROLL_TRANSPARENT = ".";

export const FABRIC_ROLL_PALETTE = {
  O: "#241812", // outline
  P: "#e8b7c8", // tela rosa
  d: "#a83c52", // extremo del rollo, rosa oscuro
  e: "#d99cb2", // pliegue central
  f: "#f5ece0", // borde blanco
  s: "rgb(0 0 0 / 30%)", // sombra de contacto
};

export const FABRIC_ROLL_PIXELS = [
  "......OOOO......",
  "......OPPO......",
  "OOOOOOdPPdOOOOOO",
  "OffPPPddddPPPffO",
  "OffPPPeeeePPPffO",
  "OffPPPeeeePPPffO",
  "OffPPPeeeePPPffO",
  "OffPPPeeeePPPffO",
  "OffPPPeeeePPPffO",
  "OffPPPeeeePPPffO",
  "OOOOOOOOOOOOOOOO",
  "ssssssssssssssss",
  "ssssssssssssssss",
  "................",
];
