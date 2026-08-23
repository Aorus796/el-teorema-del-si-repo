/*
 * Pixel-art indexado del emblema central de `library` (Biblioteca del
 * Margen -- Library Visual Polish, v1.1). Motivo institucional
 * abstracto: sello geometrico circular (anillos concentricos + 8
 * radios), sobrio, sin texto ni lore nuevo, pensado para leerse como
 * decoracion de SUELO en el centro de la sala -- el jugador se dibuja
 * siempre por encima (ver render() en WorldScene.js), asi que no bloquea
 * nada (decorations nunca alimentan solidTiles, ver createMap() en
 * worldMaps.js).
 *
 * Generado proceduralmente (ver scratch-generate-library-art.mjs, script
 * de un solo uso, no forma parte del repositorio) a partir de bandas
 * radiales sobre una elipse (para leerse como un circulo grabado en el
 * suelo, en la misma perspectiva que el resto del mundo) -- garantiza
 * simetria exacta y las dimensiones declaradas 80x40 sin errores de
 * transcripcion manual.
 */

export const LIBRARY_EMBLEM_TRANSPARENT = ".";

export const LIBRARY_EMBLEM_PALETTE = {
  O: "#2a1c12", // contorno / anillo interior
  R: "#3f2716", // anillo exterior (borde grabado)
  B: "#6b5c49", // anillo de piedra media
  b: "#4a3f33", // fondo del disco central
  s: "#c08a2e", // radios dorados (8 puntas)
  c: "#7c5134", // disco central de madera
};

export const LIBRARY_EMBLEM_PIXEL_WIDTH = 80;
export const LIBRARY_EMBLEM_PIXEL_HEIGHT = 40;

export const LIBRARY_EMBLEM_PIXELS = [
  "................................................................................",
  "............................OOOOOOOOOOOOOOOOOOOOOOOO............................",
  ".......................OOOOOORRRRRRRRRRRRRRRRRRRRRROOOOOO.......................",
  "...................OOOOORRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRROOOOO...................",
  "................OOOORRRRRRRRRRRRRRRRBBBBBBBBRRRRRRRRRRRRRRRROOOO................",
  "..............OOOORRRRRRRRRRBBBBBBBBBBBBBBBBBBBBBBBBRRRRRRRRRROOOO..............",
  "............OOORRRRRRRRRBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBRRRRRRRRROOO............",
  "..........OOORRRRRRRRBBBBBBBBBBBBBbbbssssssbbbBBBBBBBBBBBBBRRRRRRRROOO..........",
  ".........OORRRRRRRRBBBBBBBBBbbbbbbbbbbssssbbbbbbbbbbBBBBBBBBBRRRRRRRROO.........",
  ".......OOORRRRRRRBBBBBBBBbbbbbbbbbbbbbssssbbbbbbbbbbbbbBBBBBBBBRRRRRRROOO.......",
  "......OOORRRRRRBBBBBBBBssbbbbbbbbbbbbbssssbbbbbbbbbbbbbssBBBBBBBBRRRRRROOO......",
  ".....OOORRRRRRBBBBBBBsssssbbbbbbbbbbbbssssbbbbbbbbbbbbsssssBBBBBBBRRRRRROOO.....",
  "....OOORRRRRRBBBBBBbbsssssssbbbbbbbbbbssssbbbbbbbbbbsssssssbbBBBBBBRRRRRROOO....",
  "...OOORRRRRRBBBBBBbbbbbbsssssbbbbbbbbbbssbbbbbbbbbbsssssbbbbbbBBBBBBRRRRRROOO...",
  "...OORRRRRRBBBBBBbbbbbbbbbsssssbbbbbbbbssbbbbbbbbsssssbbbbbbbbbBBBBBBRRRRRROO...",
  "..OORRRRRRBBBBBBbbbbbbbbbbbbbssssbbbbOOOOOObbbbssssbbbbbbbbbbbbbBBBBBBRRRRRROO..",
  "..OORRRRRRBBBBBbbbbbbbbbbbbbbbbsssOOOOOccOOOOOsssbbbbbbbbbbbbbbbbBBBBBRRRRRROO..",
  ".OOORRRRRBBBBBBbbbbbbbbbbbbbbbbbOOOccccccccccOOObbbbbbbbbbbbbbbbbBBBBBBRRRRROOO.",
  ".OORRRRRRBBBBBbbbbbbbbbbbbbbbbbOOOccccccccccccOOObbbbbbbbbbbbbbbbbBBBBBRRRRRROO.",
  ".OORRRRRRBBBBBssssssssssssssssbOOccccccccccccccOObssssssssssssssssBBBBBRRRRRROO.",
  ".OORRRRRRBBBBBssssssssssssssssbOOccccccccccccccOObssssssssssssssssBBBBBRRRRRROO.",
  ".OORRRRRRBBBBBbbbbbbbbbbbbbbbbbOOOccccccccccccOOObbbbbbbbbbbbbbbbbBBBBBRRRRRROO.",
  ".OOORRRRRBBBBBBbbbbbbbbbbbbbbbbbOOOccccccccccOOObbbbbbbbbbbbbbbbbBBBBBBRRRRROOO.",
  "..OORRRRRRBBBBBbbbbbbbbbbbbbbbbsssOOOOOccOOOOOsssbbbbbbbbbbbbbbbbBBBBBRRRRRROO..",
  "..OORRRRRRBBBBBBbbbbbbbbbbbbbssssbbbbOOOOOObbbbssssbbbbbbbbbbbbbBBBBBBRRRRRROO..",
  "...OORRRRRRBBBBBBbbbbbbbbbsssssbbbbbbbbssbbbbbbbbsssssbbbbbbbbbBBBBBBRRRRRROO...",
  "...OOORRRRRRBBBBBBbbbbbbsssssbbbbbbbbbbssbbbbbbbbbbsssssbbbbbbBBBBBBRRRRRROOO...",
  "....OOORRRRRRBBBBBBbbsssssssbbbbbbbbbbssssbbbbbbbbbbsssssssbbBBBBBBRRRRRROOO....",
  ".....OOORRRRRRBBBBBBBsssssbbbbbbbbbbbbssssbbbbbbbbbbbbsssssBBBBBBBRRRRRROOO.....",
  "......OOORRRRRRBBBBBBBBssbbbbbbbbbbbbbssssbbbbbbbbbbbbbssBBBBBBBBRRRRRROOO......",
  ".......OOORRRRRRRBBBBBBBBbbbbbbbbbbbbbssssbbbbbbbbbbbbbBBBBBBBBRRRRRRROOO.......",
  ".........OORRRRRRRRBBBBBBBBBbbbbbbbbbbssssbbbbbbbbbbBBBBBBBBBRRRRRRRROO.........",
  "..........OOORRRRRRRRBBBBBBBBBBBBBbbbssssssbbbBBBBBBBBBBBBBRRRRRRRROOO..........",
  "............OOORRRRRRRRRBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBRRRRRRRRROOO............",
  "..............OOOORRRRRRRRRRBBBBBBBBBBBBBBBBBBBBBBBBRRRRRRRRRROOOO..............",
  "................OOOORRRRRRRRRRRRRRRRBBBBBBBBRRRRRRRRRRRRRRRROOOO................",
  "...................OOOOORRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRROOOOO...................",
  ".......................OOOOOORRRRRRRRRRRRRRRRRRRRRROOOOOO.......................",
  "............................OOOOOOOOOOOOOOOOOOOOOOOO............................",
  "................................................................................",
];
