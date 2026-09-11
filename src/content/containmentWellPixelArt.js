/*
 * Pixel-art indexado del pozo de expedientes del centro de la Cámara de
 * Contención ("containment-well").
 *
 * Rehundido circular de 32x32 que cubre EXACTAMENTE el `solidRegion` de
 * 2x2 tiles declarado para él en worldMaps.js, así que -- a diferencia de
 * archive-desk o epilogue-gift-mechanism -- no desborda su footprint ni
 * necesita compensación de anclaje: lo que se ve bloqueado es lo que
 * bloquea de verdad.
 *
 * Del fondo sube la única luz cálida... turquesa de la sala: es la misma
 * familia de color que la ranura del Custodio (custodianPixelArt.js) y que
 * la celosía de cristal, y no aparece en ningún otro sitio del mapa. La
 * lectura pretendida es que todo lo turquesa de esta cámara procede del
 * mismo expediente sin cerrar.
 *
 * Generado proceduralmente (script de un solo uso, no forma parte del
 * repositorio, mismo procedimiento documentado en archiveShelfPixelArt.js)
 * a partir de la distancia al centro: anillos concéntricos de contorno,
 * piedra (con el realce en el arco superior izquierdo) y luz.
 */

export const CONTAINMENT_WELL_TRANSPARENT = ".";

export const CONTAINMENT_WELL_PALETTE = {
  O: "#232a2e", // contorno y borde interior del rehundido
  r: "#5a6169", // anillo de piedra, lado en sombra
  R: "#7a8189", // anillo de piedra, lado iluminado
  T: "#2c7d7c", // luz turquesa profunda
  t: "#57c9c2", // luz turquesa del fondo del pozo
};

export const CONTAINMENT_WELL_PIXEL_WIDTH = 32;
export const CONTAINMENT_WELL_PIXEL_HEIGHT = 32;

export const CONTAINMENT_WELL_PIXELS = [
  "................................",
  "...........OOOOOOOOOO...........",
  ".........OOOOOOOOOOOOOO.........",
  ".......OOOORRRRRRRRRROOOO.......",
  "......OOORRRRRRRRRRRRRROOO......",
  ".....OOORRRRRRRRRRRRRRRROOO.....",
  "....OOORRRRROOOOOOOORRRrrOOO....",
  "...OOORRRROOTTTTTTTTOOrrrrOOO...",
  "...OORRRROOTTTTTTTTTTOOrrrrOO...",
  "..OORRRROTTTTTTTTTTTTTTOrrrrOO..",
  "..OORRROOTTTTTTTTTTTTTTOOrrrOO..",
  ".OORRRROTTTTTttttttTTTTTOrrrrOO.",
  ".OORRROTTTTTttttttttTTTTTOrrrOO.",
  ".OORRROTTTTttttttttttTTTTOrrrOO.",
  ".OORRROTTTTttttttttttTTTTOrrrOO.",
  ".OORRROTTTTttttttttttTTTTOrrrOO.",
  ".OORRROTTTTttttttttttTTTTOrrrOO.",
  ".OORRROTTTTttttttttttTTTTOrrrOO.",
  ".OORRROTTTTttttttttttTTTTOrrrOO.",
  ".OORRROTTTTTttttttttTTTTTOrrrOO.",
  ".OORRRROTTTTTttttttTTTTTOrrrrOO.",
  "..OORRROOTTTTTTTTTTTTTTOOrrrOO..",
  "..OORRRrOTTTTTTTTTTTTTTOrrrrOO..",
  "...OORrrrOOTTTTTTTTTTOOrrrrOO...",
  "...OOOrrrrOOTTTTTTTTOOrrrrOOO...",
  "....OOOrrrrrOOOOOOOOrrrrrOOO....",
  ".....OOOrrrrrrrrrrrrrrrrOOO.....",
  "......OOOrrrrrrrrrrrrrrOOO......",
  ".......OOOOrrrrrrrrrrOOOO.......",
  ".........OOOOOOOOOOOOOO.........",
  "...........OOOOOOOOOO...........",
  "................................",
];
