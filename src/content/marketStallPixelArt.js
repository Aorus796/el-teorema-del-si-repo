/*
 * Pixel-art indexado del puesto/mostrador de preparativos de axiom-plaza
 * (Plaza Visual Polish -- migración de props). Mismo formato que
 * weddingTablePixelArt.js.
 */

export const MARKET_STALL_PIXEL_WIDTH = 118;
export const MARKET_STALL_PIXEL_HEIGHT = 43;
export const MARKET_STALL_TRANSPARENT = ".";

export const MARKET_STALL_PALETTE = {
  O: "#241812", // outline
  C: "#efe2bf", // panel/inserto crema claro
  G: "#5a7d45", // hojas verde medio
  P: "#e8b7c8", // flor/franja rosa
  W: "#7c5134", // madera media (mostrador, cesta)
  w: "#6d4530", // madera oscura (paredes de cesta/maceta)
  d: "#4a3223", // madera oscura / marco / trim del toldo
  f: "#f5ece0", // blanco (banderines, flor)
  h: "#ffffff", // highlight blanco
  p: "#a83c52", // franja de toldo rosa oscuro
  s: "rgb(0 0 0 / 30%)", // sombra de contacto
  y: "#d6b65f", // franja de toldo dorada
};

export const MARKET_STALL_PIXELS = [
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "OddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddO",
  "OyyyyyyyyyppppppppppPPPPPPPPPPyyyyyyyyyyppppppppppPPPPPPPPPPyyyyyyyyyyppppppppppPPPPPPPPPPyyyyyyyyyyppppppppppPPPPPPPO",
  "OyyyyyyyyyppppppppppPPPPPPPPPPyyyyyyyyyyppppppppppPPPPPPPPPPyyyyyyyyyyppppppppppPPPPPPPPPPyyyyyyyyyyppppppppppPPPPPPPO",
  "OyyyyyyyyyppppppppppPPPPPPPPPPyyyyyyyyyyppppppppppPPPPPPPPPPyyyyyyyyyyppppppppppPPPPPPPPPPyyyyyyyyyyppppppppppPPPPPPPO",
  "OyyyOOOOyyppOOOOppppOOOOPPPPOOOOyyyyOOOOppppOOOOppPPOOOOPPPPOOOOyyyyOOOOppppOOOOPPPPOOOOPPyyOOOOyyyyOOOOppppOOOOPPPPOO",
  "OffO....OffO....OffO....OffO....OffO....OffO....OffO....OffO....OffO....OffO....OffO....OffO....OffO....OffO....OffO..",
  "OOOO....OOOO....OffO....OOOO....OOOO....OOOO....OOOO....OOOO....OOOO....OOOO....OOOO....OOOO....OOOO....OOOO....OOOO..",
  ".............OOOffffOOO...............................................................................................",
  ".............OPPffffPPO...............................................................................................",
  ".............OPPffffPPO...............................................................................................",
  "............OPPPPPPPPPPO..................................................................OOOOO...OOOOO...............",
  "............OPPPPPPPPPPO................................OOOOOOO...........................OPPPO...OfffO...............",
  "............OWWWWWWWWWWO................................OGGGGGO........................OOOPPPPPOOOffffO...............",
  "............OWWWWWWWWWWO................................OGGGGGO........................OGGPPPPPGGGffffO...............",
  "............OWWWWWWWWWWO................................OGGGGGO........................OGGPPPPPGGGffffO...............",
  "............OWWWWWWWWWWO...............................OGGGGGGGO.......................OGGGGGGGGGGGGGGO...............",
  "............OWWWWWWWWWWO...............................OGGGGGGGO.......................OGGGGGGGGGGGGGGO...............",
  "............OWWWWWWWWWWO...............................OwwwwwwwO.......................OGGGGGGGGGGGGGGO...............",
  "............OWWWWWWWWWWO...............................OwwwwwwwO.......................OGGGGGGGGGGGGGGO...............",
  "............OOOOOOOOOOOO...............................OwwwwwwwO.......................OOOOOOOOOOOOOOOO...............",
  ".......................................................OOOOOOOOO......................................................",
  "......................................................................................................................",
  "......................................................................................................................",
  "....OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO....",
  "....OddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddO....",
  "....OddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddO....",
  "....OWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWO....",
  "....OWWdhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhWWWO....",
  "....OWWdCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCWWWO....",
  "....OWWdCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCWWWO....",
  "....OWWdCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCWWWO....",
  "....OWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWO....",
  "....OWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWO....",
  "....OWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWO....",
  "....OWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWO....",
  "....OWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWO....",
  "....OWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWWWdWWWO....",
  "....OwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwO....",
  "....OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO....",
  "....ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss....",
  "......................................................................................................................",
  "......................................................................................................................",
];
