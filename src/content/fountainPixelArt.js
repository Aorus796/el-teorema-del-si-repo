/*
 * Pixel-art indexado de la fuente de piedra de axiom-plaza (Plaza Visual
 * Polish -- migración de props). El agua no tiene un color fijo: cada mapa
 * define su propio `palette.water`/`dawnPalette.water` (ver worldMaps.js),
 * así que la paleta de la fuente se construye en tiempo de llamada con
 * buildFountainPalette(waterColor), variando solo los cuatro tonos de agua
 * (b/h/t/j); el resto (piedra, boquilla, sombra) es fijo. El llamador
 * (WorldScene.js) incluye waterColor en la clave de cache para no mezclar
 * sprites de mapas con agua de distinto color.
 */

export const FOUNTAIN_PIXEL_WIDTH = 96;
export const FOUNTAIN_PIXEL_HEIGHT = 84;
export const FOUNTAIN_TRANSPARENT = ".";

function clampByte(value) {
  return Math.max(0, Math.min(255, value));
}

function shiftHex(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = clampByte((num >> 16) + amount);
  const g = clampByte(((num >> 8) & 0xff) + amount);
  const b = clampByte((num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function buildFountainPalette(waterColor) {
  return {
    O: "#241812", // outline
    c: "#8f7c58", // piedra oscura (filo exterior)
    e: "#b3a07a", // piedra media-oscura
    m: "#c9b78e", // piedra media
    l: "#d8c8a4", // piedra clara (interior)
    k: "rgb(0 0 0 / 18%)", // sombra de esquina
    w: "#4d4238", // boquilla oscura
    s: "rgb(0 0 0 / 30%)", // sombra de contacto
    b: waterColor, // agua base
    h: shiftHex(waterColor, 35), // reflejo claro
    t: shiftHex(waterColor, 60), // ondas/rizos brillantes
    j: shiftHex(waterColor, -28), // agua profunda/sombra
  };
}

export const FOUNTAIN_PIXELS = [
  ".........................................OOOOOOOOOOOOOO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  ".........................................OmlllllllllmmO.........................................",
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOmmlllllllllmmmOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "OkkkkeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeemmlllllllllmmmeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeekkkkO",
  "OkkkkmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmlllllllllmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmkkkkO",
  "OkkkkmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmlllllllllmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmkkkkO",
  "OkkkkmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmlllllllllmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmkkkkO",
  "OkkkkllllllllllllllllllllllllllllllllllllmmlllllllllmmmllllllllllllllllllllllllllllllllllllkkkkO",
  "OemmlllllllllllllllllllllllllllllllllllllmmlllllllllmmmlllllllllllllllllllllllllllllllllllllmmeO",
  "OemmlllllllllllllllllllllllllllllllllllllmmlllllllllmmmlllllllllllllllllllllllllllllllllllllmmeO",
  "OemmlllllllllllllllllllllllllllllllllllllmmlllllllllmmmlllllllllllllllllllllllllllllllllllllmmeO",
  "OemmlllllllllllllllllllllllllllllllllllllmmlllllllllmmmlllllllllllllllllllllllllllllllllllllmmeO",
  "OemmlllllllllllllllllllllllllllllllllllllmmlllllllllmmmlllllllllllllllllllllllllllllllllllllmmeO",
  "OemmlllllllllllllllllllllllllllllllllllllmmlllllllllmmmlllllllllllllllllllllllllllllllllllllmmeO",
  "OemmllllllhhhhhhtttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttthhhhhhllllllmmeO",
  "OemmllllllhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhcccccccccccccchhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhllllllmmeO",
  "OemmllllllhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhcccccccccccccchhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhllllllmmeO",
  "OemmllllllhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhcccccccccccccchhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhllllllmmeO",
  "OemmllllllhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhccccwwwwwwcccchhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbccccwwwwwwccccbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbmmllwwwwwwlmmmbbbbbbbbbbbbbbbttttttbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbmmllwwwwwwlmmmbbbbbbbbbbbbbbbttttttbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbtttttttttttttttttttttttttttttttwwwwwwtttttttttttttttttttttttttttttttbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbwwwwwwbbbbbbbbbbbbbbbbbbbttttttbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbwbbbbwbbbbbbbbbbbbbbbbbbbttttttbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbwbbbbwbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbttttttttttttttttttttttttttttttttttttttttttttttttttttttttbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmllllllbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbllllllmmeO",
  "OemmlllllljjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjllllllmmeO",
  "OemmllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllmmeO",
  "OemmllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllmmeO",
  "OemmllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllmmeO",
  "OemmllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllmmeO",
  "OemmllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllmmeO",
  "OemmlllllllllllllllllllllllllllllllllllllljjjjjjjjjjjjllllllllllllllllllllllllllllllllllllllmmeO",
  "OemmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmeO",
  "OemmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmeO",
  "OemmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmeO",
  "OemmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmeO",
  "OeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeO",
  "OeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeO",
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "................................................................................................",
  "..ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss..",
  "...ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss...",
  "................................................................................................",
];
