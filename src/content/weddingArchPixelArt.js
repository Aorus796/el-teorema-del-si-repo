/*
 * Pixel-art indexado del altar/arco ceremonial de axiom-plaza (Plaza
 * Visual Polish -- migración de props tras la aprobación humana de la
 * estrategia de pixel-art indexado validada en wedding-table). Mismo
 * formato que weddingTablePixelArt.js: matriz de caracteres + paleta,
 * rasterizada una única vez por WorldScene.js vía createIndexedPixelSprite().
 */

export const WEDDING_ARCH_PIXEL_WIDTH = 160;
export const WEDDING_ARCH_PIXEL_HEIGHT = 53;
export const WEDDING_ARCH_TRANSPARENT = ".";

export const WEDDING_ARCH_PALETTE = {
  O: "#241812", // outline
  C: "#efe2bf", // tela crema medio
  h: "#ffffff", // tela highlight blanco
  c: "#c9b78e", // tela sombra crema oscuro
  d: "#d6b65f", // dintel dorado claro
  D: "#c2a34f", // dintel dorado sombra
  W: "#7c5134", // madera media (postes)
  w: "#3f2a1e", // madera oscura (postes)
  x: "#a06f4c", // madera clara (resalte postes)
  G: "#5a7d45", // hojas verde medio
  g: "#3d5730", // hojas verde oscuro
  P: "#e8b7c8", // flor rosa
  p: "#a83c52", // flor rosa oscuro
  f: "#f5ece0", // flor blanca
  R: "#c9536a", // alfombra rosa/roja principal
  r: "#a83c52", // alfombra borde oscuro
  s: "rgb(0 0 0 / 30%)", // sombra de contacto
};

export const WEDDING_ARCH_PIXELS = [
  "............OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO............",
  "............OGGPPPPPPPPPPddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddPPPPPPPPPPGGO............",
  "............OGGPPPPPPPPPPddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddPPPPPPPPPPGGO............",
  "............OGGPPPPPffffPdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddffffdddPPPPPPPPPPGGO............",
  "......OOOOOOgGGPPPPpffffPdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddffffdddPPPPppppPPGGgOOOOOO......",
  "......OxxWWWgGGPPPPpffffPdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddffffdddPPPPppppPPGGgWWWwwO......",
  "......OxxWWWgggPPPPpffffPdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddffffdddPPPPppppPPgggWWWwwO......",
  "......OxxWWWDDDPPPPppppPPDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDPPPPppppPPDDDWWWwwO......",
  "......OxxWWWDDDPPPPPPPPPPDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDCCCCCCCCCCCCCCCCCCCCCCCCCCCCDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDPPPPPPPPPPDDDWWWwwO......",
  "......OxxWWWDDDPPPPPPPPPPOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOChhhhCCCccCCCCCCCCccCCCCCCCCOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOPPPPPPPPPPDDDWWWwwO......",
  "......OxxWWWWwwPOOOOOOOOO.........................................OhhhhCCCccCCCCCCCCccCCCCCCCO.........................................OOOOOOOOOPxxWWWWwwO......",
  "......OxxWWWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWWWWwwO......",
  "......OxxWWWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWWWWwwO......",
  "......OxxWWWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWWWWwwO......",
  "......OxxWWWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWWWWwwO......",
  "......OxxWWWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWWWWwwO......",
  "......OxxWWWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWWWWwwO......",
  "...OOOgggggWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWggggggOO....",
  "...OGGGGGGgWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWgGGGGGGO....",
  "...OGGGGGGgWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWgGGGGGGO....",
  "...OPPPPGGgWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWPPPPPGGO....",
  "...OPPPPGGgWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWPPPPPGGO....",
  "...OPPPPGGgWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWPPPPPGGO....",
  "...OPPPPGGgWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWPPPPPGGO....",
  "...OPPPPGGgWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWPPPPPGGO....",
  "...OfffffGgWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWgffffffO....",
  "...OffffPPgWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWgfPffffPO...",
  "...OffffPPgWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWgfPffffPO...",
  "...OPPPPPPgWWwwO..................................................OhhhhCCCccCCCCCCCCccCCCCCCCO..................................................OxxWgfPPPPPPO...",
  "..OPPPPPPPgWWwwO..................................................OOOOOOOOOOOOOOOOOOOOOOOOOOOO..................................................OxxWggPPPPPPPO..",
  "..OPPPPPPPgWWwwO................................................................................................................................OxxWWgPPPPPPPO..",
  "..OPPPPPPPgWWwwO................................................................................................................................OxxWWgPPPPPPPO..",
  "..OggggggggWWwwwOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOwxxWWggggggggO..",
  "..OggggggggWWwwwccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccwxxWWggggggggO..",
  "..OggggggggWWwwwccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccwxxWWggggggggO..",
  "..OOOOgggggWWwwwccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccwxxWWgggggOOOO..",
  "......OxxWWWWwwwhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhwxxWWWWwwO......",
  "......OxxWWWWwwwhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhrrrrrrrrrrrrrrrrrrrrrrrrhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhwxxWWWWwwO......",
  "......OxxWWWWwwwCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCrrrrrrrrrrrrrrrrrrrrrrrrCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCwxxWWWWwwO......",
  "......OxxWWWWwwwCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCrrddddddddddddddddddddrrCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCwxxWWWWwwO......",
  "......OxxWWWWwwwCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCrrddddddddddddddddddddrrCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCwxxWWWWwwO......",
  "......OCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCrrRRRRRRRRRRRRRRRRRRRRrrCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCO......",
  "......OCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCPCCCCCrrRRRRRRRRRRRRRRRRRRRRrrCCCPCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCO......",
  "......OCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCrrRRRRRRRRRRRRRRRRRRfRrrCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCO......",
  "......OCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCrrRRRRRRPRRRRRRRRRRRRRrrCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCO......",
  "......OCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCfCCCCCCCCCrrRRRRRRRRRRRRRRRRRRRRrrCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCO......",
  "......OCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCrrRRRRRRRRRRRRRRRRRRRRrrCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCO......",
  "......OCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCrrRRRRRRRRRRRRRRRRRRRRrrCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCO......",
  "......OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO......",
  "........ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss........",
  "........ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss........",
  "........ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss........",
  "................................................................................................................................................................",
];
