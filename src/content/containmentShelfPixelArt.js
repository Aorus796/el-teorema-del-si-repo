/*
 * Pixel-art indexado de la estantería sellada de expedientes
 * ("sealed-dossier-rack") de la Cámara de Contención.
 *
 * Lenguaje visual deliberadamente OPUESTO al de archiveShelfPixelArt.js:
 * allí hay lomos de libros de cinco colores distintos, anchos irregulares
 * y huecos donde falta material -- un archivo vivo, consultado a diario.
 * Aquí hay doce cajones idénticos, del mismo gris, con el mismo precinto
 * dorado centrado en cada uno: nada se ha sacado nunca de esta sala, y
 * nada distingue un expediente de otro desde fuera. El contraste es el
 * punto, no un ahorro de trabajo: por eso NO se reutiliza "archive-shelf"
 * ni "archive-crates".
 *
 * Único tamaño real en containment-chamber (64x32, las dos instancias del
 * oeste comparten exactamente esas dimensiones), así que basta un único
 * sprite cacheado -- mismo criterio que archive-shelf.
 *
 * Generado proceduralmente (script de un solo uso, no forma parte del
 * repositorio, mismo procedimiento documentado en archiveShelfPixelArt.js)
 * a partir de una regla fija: tres bandas de cuatro cajones de 14px
 * separados por 2px, cada cajón con realce superior, precinto dorado de
 * 6px y sombra inferior.
 */

export const CONTAINMENT_SHELF_TRANSPARENT = ".";

export const CONTAINMENT_SHELF_PALETTE = {
  O: "#232a2e", // contorno / junta entre cajones
  f: "#7a8189", // frente de cajón
  h: "#949ba2", // realce superior del cajón
  m: "#5a6169", // sombra de cajón y balda
  g: "#c9a24a", // precinto dorado
  G: "#8f6f2c", // precinto dorado, sombra
};

export const CONTAINMENT_SHELF_PIXEL_WIDTH = 64;
export const CONTAINMENT_SHELF_PIXEL_HEIGHT = 32;

export const CONTAINMENT_SHELF_PIXELS = [
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "OhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhO",
  "OhhhhhhhhhhhhhhmOhhhhhhhhhhhhhhmOhhhhhhhhhhhhhhmOhhhhhhhhhhhhhhO",
  "OffffffffffffffmOffffffffffffffmOffffffffffffffmOffffffffffffffO",
  "OffffffffffffffmOffffffffffffffmOffffffffffffffmOffffffffffffffO",
  "OffffggggggffffmOffffggggggffffmOffffggggggffffmOffffggggggffffO",
  "OffffGGGGGGffffmOffffGGGGGGffffmOffffGGGGGGffffmOffffGGGGGGffffO",
  "OffffffffffffffmOffffffffffffffmOffffffffffffffmOffffffffffffffO",
  "OmmmmmmmmmmmmmmmOmmmmmmmmmmmmmmmOmmmmmmmmmmmmmmmOmmmmmmmmmmmmmmO",
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "OmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmO",
  "OhhhhhhhhhhhhhhmOhhhhhhhhhhhhhhmOhhhhhhhhhhhhhhmOhhhhhhhhhhhhhhO",
  "OffffffffffffffmOffffffffffffffmOffffffffffffffmOffffffffffffffO",
  "OffffffffffffffmOffffffffffffffmOffffffffffffffmOffffffffffffffO",
  "OffffggggggffffmOffffggggggffffmOffffggggggffffmOffffggggggffffO",
  "OffffGGGGGGffffmOffffGGGGGGffffmOffffGGGGGGffffmOffffGGGGGGffffO",
  "OffffffffffffffmOffffffffffffffmOffffffffffffffmOffffffffffffffO",
  "OmmmmmmmmmmmmmmmOmmmmmmmmmmmmmmmOmmmmmmmmmmmmmmmOmmmmmmmmmmmmmmO",
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "OmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmO",
  "OhhhhhhhhhhhhhhmOhhhhhhhhhhhhhhmOhhhhhhhhhhhhhhmOhhhhhhhhhhhhhhO",
  "OffffffffffffffmOffffffffffffffmOffffffffffffffmOffffffffffffffO",
  "OffffffffffffffmOffffffffffffffmOffffffffffffffmOffffffffffffffO",
  "OffffggggggffffmOffffggggggffffmOffffggggggffffmOffffggggggffffO",
  "OffffGGGGGGffffmOffffGGGGGGffffmOffffGGGGGGffffmOffffGGGGGGffffO",
  "OffffffffffffffmOffffffffffffffmOffffffffffffffmOffffffffffffffO",
  "OmmmmmmmmmmmmmmmOmmmmmmmmmmmmmmmOmmmmmmmmmmmmmmmOmmmmmmmmmmmmmmO",
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "OmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmO",
  "OmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmO",
  "OmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmO",
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
];
