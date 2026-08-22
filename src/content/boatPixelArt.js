/*
 * Pixel-art indexado de un pequeño bote de remos, decoración nueva de
 * seven-bridges-walk (Seven Bridges Visual Polish, ronda de inversión
 * agua/paseo). Puramente cosmética -- decorations nunca alimenta
 * solidTiles (ver createMap() en worldMaps.js) -- se coloca sobre un tramo
 * de agua realmente bloqueada para reforzar la lectura de "esto es agua,
 * no se puede caminar" cerca del embarcadero. Reutiliza tonos de madera ya
 * aprobados en bridgePixelArt.js (mismo casco de madera que el tablero de
 * los puentes) y el contorno oscuro ya usado en pier/bridge/path-sign, sin
 * introducir colores nuevos en la paleta del mapa.
 */

export const BOAT_TRANSPARENT = ".";

export const BOAT_PALETTE = {
  O: "#201d18", // contorno
  W: "#7c5134", // casco de madera media
  x: "#a06f4c", // resalte de la borda
  d: "#3f2a1e", // bancos/asientos, junta oscura entre tablones
};

export const BOAT_PIXEL_WIDTH = 32;
export const BOAT_PIXEL_HEIGHT = 18;

export const BOAT_PIXELS = [
  "................................",
  ".........OOOOOOOOOOOOOO.........",
  "......OOOOxxxxxxxxxxxxOOOO......",
  "....OOOxxxxxxxxxxxxxxxxxxOOO....",
  "...OOWWWWWWWWWWWWWWWWWWWWWWOO...",
  "..OOWWWWWWddWWWWWWWWddWWWWWWOO..",
  ".OOWWWWWWWddWWWWWWWWddWWWWWWWOO.",
  ".OOWWWWWWWddWWWWWWWWddWWWWWWWOO.",
  ".OOWWWWWWWddWWWWWWWWddWWWWWWWOO.",
  ".OOWWWWWWWddWWWWWWWWddWWWWWWWOO.",
  ".OOWWWWWWWddWWWWWWWWddWWWWWWWOO.",
  ".OOWWWWWWWddWWWWWWWWddWWWWWWWOO.",
  "..OOWWWWWWWWWWWWWWWWWWWWWWWWOO..",
  "...OOWWWWWWWWWWWWWWWWWWWWWWOO...",
  "....OOOWWWWWWWWWWWWWWWWWWOOO....",
  "......OOOOWWWWWWWWWWWWOOOO......",
  ".........OOOOOOOOOOOOOO.........",
  "................................",
];
