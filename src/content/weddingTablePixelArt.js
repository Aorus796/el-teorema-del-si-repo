/*
 * Pixel-art indexado de la mesa redonda de boda de axiom-plaza (Plaza
 * Visual Polish -- spike de estrategia de representación, autorizado
 * explícitamente por el responsable de producto para validar un lenguaje
 * artístico distinto al de composición geométrica con fillRect antes de
 * migrar el resto de props).
 *
 * PIXELS es una matriz de caracteres: cada fila es un string de WIDTH
 * caracteres, cada carácter es una clave de PALETTE o TRANSPARENT. Es un
 * dato estático -- diseñado a mano, sin motor ni pipeline -- que
 * WorldScene.js rasteriza una única vez a un canvas descartable mediante
 * createIndexedPixelSprite() y reutiliza a través de la cache de sprites
 * ya existente (propSpriteCache/drawCachedProp).
 *
 * Nota de diseño (para no confundirlo con un bug de simetría): el lazo
 * rosa (símbolos "p"/"P", filas 23-28, columnas 7-9, junto a la silla
 * oeste) es DELIBERADAMENTE de un solo lado -- "lazo rosa a un lado" ya
 * era así en la versión geométrica anterior de este mismo prop
 * (drawWeddingTableSprite(), eliminada en este spike), y no tiene
 * contrapartida en la silla este ni en las sillas norte/sur. Las sillas
 * oeste/este SÍ están pensadas como espejo prácticamente exacto entre sí
 * en su estructura de madera (respaldo/asiento/patas, símbolos
 * "w"/"W"/"x"), con variaciones de 1px de contorno propias del pixel-art
 * dibujado a mano (mismo orden de magnitud en severidad que otras
 * variantes ya aceptadas en props anteriores de esta misma PR); el lazo
 * es un elemento decorativo aparte, no parte de esa silueta.
 */

export const WEDDING_TABLE_PIXEL_WIDTH = 40;
export const WEDDING_TABLE_PIXEL_HEIGHT = 40;
export const WEDDING_TABLE_TRANSPARENT = ".";

export const WEDDING_TABLE_PALETTE = {
  O: "#241812", // outline
  w: "#3f2a1e", // madera oscura
  W: "#7c5134", // madera media
  x: "#a06f4c", // madera clara
  c: "#c9b78e", // crema oscuro
  C: "#efe2bf", // crema medio
  h: "#ffffff", // crema claro / highlight
  f: "#f5ece0", // blanco (flor)
  p: "#a83c52", // rosa oscuro
  P: "#e8b7c8", // rosa
  g: "#3d5730", // verde oscuro
  G: "#5a7d45", // verde medio
  l: "#7fa860", // verde claro
  y: "#f7e6a8", // amarillo cálido / vela
  s: "rgb(0 0 0 / 30%)", // sombra de contacto
};

export const WEDDING_TABLE_PIXELS = [
  "...............OOOOOOOOOO...............",
  "...............OwwwwwwwwO...............",
  "...............OWWWWWWWWO...............",
  "..............OxxxxxxxxxxO..............",
  "..............OWWWWWWWWWWO..............",
  "..............OWWWWWWWWWWO..............",
  "..............OWWWOOOOWWWO..............",
  "...............OwO....OwO...............",
  "...............OOOOOOOOOOO..............",
  ".............OOhhhCCCCCCCCOO............",
  "............OhhhCCCOOOCCCCCCO...........",
  "...........OhhhCCCOfffOCcCCCCO..........",
  "..........OhhhCCCOOfOfOOcCCCCCO.........",
  ".........OhhhcCCOPPfffPPOCCCcCCO........",
  "...OOOO.OOhhhcCOOPpPOPpPOOCCcCOOOOOOO...",
  "OOOxWWWOwwOhCcOlGPPPOPPPGlOCyOwwwWWWxOOO",
  "OwWxWWWwwwOhCcOgGGGGOGGGGgOyyOwwwWWWxWwO",
  "OwWxWWWwwwOCCcOgGGGGOGGGGgOOOOOwwWWWxWwO",
  "OwWxWWWOOOCCCcOggggOCOggggOCccOOOWWWxWwO",
  "OwWxWWWOCCCCCcOggggOCOggggOCccOCOWWWxWwO",
  "OwWxWWWOCCCCCcCOOOOcccOOOOOCccOCOWWWxWwO",
  "OwWxWWWOOOCCCcCCCCOcccOCcCOCccOOOWWWxWwO",
  "OwWxWWWwwwOCCcCCCCOcccOCcCOCCCOwwWWWxWwO",
  "OwWxWWWpppOCCcCCCCOOOOOCcCOCCCOwwWWWxWwO",
  "OOOxWWWpPPOCCcCCCCcCCCCCcCOOOOOwwWWWxOOO",
  "...OOOOpPPOCCcCCCCcCCCCCcCCCcCCOOOOOO...",
  ".......OPPOCCcCCCCcCCCCCcCCCcCCcO.......",
  ".......OPPOCCcCCCCcCCCCCcCCCcCCO........",
  ".......OOOOCCcCCCCcCCCCCcCCCCCO.........",
  "...........OCCCCCCcCCCCCcCCCCO..........",
  "............OCCCCCCCCCCCCCCCO...........",
  "...........ssOOCCCCCCCCCCCOOss..........",
  "........sssssssOOOOOOOOOOOsssssss.......",
  ".....sssssssssOWWWWWWWWWWOssssssssss....",
  "........ssssssOWWWWWWWWWWOsssssss.......",
  "...........sssOWWWWWWWWWWOssss..........",
  "..............OxxxxxxxxxxOs.............",
  "...............OWWWWWWWWO...............",
  "...............OwwwwwwwwO...............",
  "...............OOOOOOOOOO...............",
];
