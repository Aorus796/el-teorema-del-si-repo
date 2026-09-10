/*
 * Pixel-art indexado del panel de consulta de la Cámara de Contención
 * ("containment-budget-panel"), el objeto que abre la escena del
 * presupuesto de la duda.
 *
 * Existe por la misma razón que archiveDeskPixelArt.js y
 * epilogueGiftMechanismPixelArt.js: el panel es de type "table", y la rama
 * genérica de ese tipo en renderObjects() pinta madera cálida y franja
 * dorada -- la paleta del mobiliario del Archivo y la Biblioteca, que
 * rompía de lleno la identidad fría (piedra, metal, turquesa) que el resto
 * de la Cámara ya establece. Aquí no hay madera: sólo los materiales que ya
 * usan la celosía, el pozo, la estantería sellada y el propio Custodio.
 *
 * Cubre EXACTAMENTE el `solidRegion` de 2x2 tiles declarado para el panel
 * en worldMaps.js (32x32, x176-208 / y48-80), que es 8px más alto que el
 * hitbox interactivo del objeto (32x24). Por eso el sprite se ancla al
 * borde SUPERIOR del hitbox y desborda esos 8px hacia abajo: mismo problema
 * que archive-desk, resuelto sin constante de compensación porque aquí el
 * desborde es justo la diferencia entre ambos rectángulos. Lo que se ve
 * bloqueado vuelve a ser lo que bloquea de verdad, igual que en el pozo.
 *
 * Lectura de arriba abajo: plancha de metal frío con la ranura de lectura
 * turquesa (tres líneas de texto de longitud decreciente, la única
 * animación que este juego no necesita), un precinto dorado discreto -- el
 * mismo dorado de los precintos de la estantería sellada, y sólo en 12px de
 * ancho para que no domine la pieza --, la repisa de piedra clara y el
 * cuerpo de piedra con dos juntas verticales sobre una peana de metal.
 *
 * Generado proceduralmente (script de un solo uso, no forma parte del
 * repositorio, mismo procedimiento documentado en archiveShelfPixelArt.js)
 * a partir de esas cinco bandas horizontales.
 */

export const CONTAINMENT_BUDGET_PANEL_TRANSPARENT = ".";

export const CONTAINMENT_BUDGET_PANEL_PALETTE = {
  O: "#232a2e", // contorno, mismo que el resto de props de la Cámara
  p: "#6b7178", // metal frío, canto de la plancha
  P: "#474d53", // metal frío, sombra y peana
  t: "#57c9c2", // turquesa de la ranura de lectura
  T: "#2c7d7c", // turquesa profundo, fondo de la ranura
  g: "#c9a24a", // precinto dorado
  G: "#8f6f2c", // precinto dorado, sombra
  S: "#e8e1d0", // piedra clara, realce de la repisa
  s: "#cfc7b4", // piedra clara del cuerpo
  d: "#9d9483", // piedra en sombra, cantos y juntas
};

export const CONTAINMENT_BUDGET_PANEL_PIXEL_WIDTH = 32;
export const CONTAINMENT_BUDGET_PANEL_PIXEL_HEIGHT = 32;

export const CONTAINMENT_BUDGET_PANEL_PIXELS = [
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "OppppppppppppppppppppppppppppppO",
  "OpPPPPPPPPPPPPPPPPPPPPPPPPPPPPpO",
  "OpPPOTTTTTTTTTTTTTTTTTTTTTTOPPpO",
  "OpPPOttttttttttttttttttTTTTOPPpO",
  "OpPPOTTTTTTTTTTTTTTTTTTTTTTOPPpO",
  "OpPPOttttttttttttttTTTTTTTTOPPpO",
  "OpPPOTTTTTTTTTTTTTTTTTTTTTTOPPpO",
  "OpPPOttttttttttTTTTTTTTTTTTOPPpO",
  "OpPPOTTTTTTTTTTTTTTTTTTTTTTOPPpO",
  "OpPPPPPPPPggggggggggggPPPPPPPPpO",
  "OpPPPPPPPPGGGGGGGGGGGGPPPPPPPPpO",
  "OSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSO",
  "OssssssssssssssssssssssssssssssO",
  "OssssssssssssssssssssssssssssssO",
  "OddddddddddddddddddddddddddddddO",
  "OSSSSSSSSSdSSSSSSSSSSdSSSSSSSSSO",
  "OsssssssssdssssssssssdsssssssssO",
  "OsssssssssdssssssssssdsssssssssO",
  "OsssssssssdssssssssssdsssssssssO",
  "OsssssssssdssssssssssdsssssssssO",
  "OsssssssssdssssssssssdsssssssssO",
  "OsssssssssdssssssssssdsssssssssO",
  "OsssssssssdssssssssssdsssssssssO",
  "OsssssssssdssssssssssdsssssssssO",
  "OsssssssssdssssssssssdsssssssssO",
  "OsssssssssdssssssssssdsssssssssO",
  "OsssssssssdssssssssssdsssssssssO",
  "OsssssssssdssssssssssdsssssssssO",
  "OPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPO",
  "OPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPO",
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
];
