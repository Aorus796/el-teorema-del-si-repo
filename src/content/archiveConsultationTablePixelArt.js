/*
 * Pixel-art indexado de la mesa de consulta de `archive` (Archivo --
 * Visual Polish, v1.1). Mismo espíritu y misma geometría que
 * libraryReadingTablePixelArt.js (mesa larga con un banco integrado a
 * AMBOS lados del tablero -- lectura de arriba a abajo: banco / mesa /
 * banco -- simétrica verticalmente para que las 2 instancias del mapa se
 * lean como mesas de consulta reales con asiento en ambos lados), pero
 * recolorea los dos objetos apoyados sobre el tablero como una pila de
 * documentos con un sello/cinta roja encima, en vez de los dos libros de
 * `library`, para que se lea como mobiliario de archivo y no una
 * duplicación literal del mueble de biblioteca. Puramente decorativa: no
 * aparece en `objects` ni en solidRegions, no bloquea ni se puede
 * interactuar con ella (ver createMap() en worldMaps.js -- decorations
 * nunca alimentan solidTiles).
 *
 * Único tamaño real en archive (48x40, ver worldMaps.js: las dos
 * decoraciones -- oeste y este -- comparten exactamente esas dimensiones,
 * mismo dataset sin reflejo porque el diseño ya es simétrico
 * horizontalmente por sí solo).
 *
 * Generado (ver scratch-generate-archive-table-desk.mjs, script de un solo
 * uso, no forma parte del repositorio) recortando 4 columnas transparentes
 * de cada lado de LIBRARY_READING_TABLE_PIXELS (64x40, generada
 * proceduralmente con scratch-generate-library-art.mjs) para encajar en el
 * hueco disponible entre el escritorio central y los módulos de
 * cajas/estanterías de `archive` (56x40 intermedio).
 *
 * Corrección de encajonamiento (v1.1, mismo pase de "Archivo -- Visual
 * Polish"): las mesas de 56x40 dejaban solo 4px de margen visual real
 * frente al escritorio central (ver ARCHIVE_DESK_PIXEL_WIDTH en
 * archiveDeskPixelArt.js, que desborda 8px por lado su hitbox declarado).
 * Se recortaron 4 columnas de cada lado (56x40 -> 48x40) para liberar 12px
 * de margen real en los 4 puntos de contacto (ver worldMaps.js). Antes de
 * recortar, las patas centrales del banco (filas 22-24, antes en columnas
 * [2-5]/[50-53] del dataset de 56) se desplazaron 2px hacia el interior (a
 * [4-7]/[48-51]) para sobrevivir íntegras al recorte de 4 columnas por lado
 * -- sin ese ajuste, el recorte simétrico habría cercenado su borde
 * exterior, que solo tenía 2px de margen. Las patas de banco (filas
 * 0-3/33-36) y la sombra (filas 37-38) sí tenían margen transparente de
 * sobra y sobrevivieron intactas sin ajuste. Las filas de tablero/
 * documentos (12-21) son bandas de color de ancho completo, sin margen
 * transparente -- el recorte las angosta uniformemente junto con el resto
 * del sprite (el efecto buscado), no elimina ninguna forma discreta, así
 * que no corren el mismo riesgo de asimetría que una pata puntual.
 *
 * Sin errores de transcripción manual: ambos pasos (desplazamiento de patas
 * y recorte) se verificaron programáticamente contra el dataset original
 * antes de aplicarse.
 */

export const ARCHIVE_CONSULTATION_TABLE_TRANSPARENT = ".";

export const ARCHIVE_CONSULTATION_TABLE_PALETTE = {
  O: "#241812", // contorno
  w: "#3f2a1e", // madera oscura (patas)
  W: "#63503d", // madera media (tablero), tono frío coherente con archive
  x: "#8f7a5c", // veta/resalte claro (tablero y asiento del banco)
  h: "#79654c", // resalte superior
  R: "#c9b7a0", // pila de documentos clara apoyada sobre la mesa
  Y: "#8a3324", // sello/cinta roja sobre la pila de documentos
  s: "rgb(0 0 0 / 30%)", // sombra de contacto
};

export const ARCHIVE_CONSULTATION_TABLE_PIXEL_WIDTH = 48;
export const ARCHIVE_CONSULTATION_TABLE_PIXEL_HEIGHT = 40;

export const ARCHIVE_CONSULTATION_TABLE_PIXELS = [
  "......OwwO............................OwwO......",
  "......OwwO............................OwwO......",
  "......OwwO............................OwwO......",
  "......OwwO............................OwwO......",
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "OxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO",
  "OxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO",
  "OxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO",
  "OxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO",
  "OhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhO",
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "................................................",
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh",
  "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
  "WORRRRROWWWWWWWWWWWWWWWWWWWWWWWWWWWWOYYYYYOWWWWW",
  "WORRRRROWWWWWWWWWWWWWWWWWWWWWWWWWWWWOYYYYYOWWWWW",
  "WORRRRROWWWWWWWWWWWWWWWWWWWWWWWWWWWWOYYYYYOWWWWW",
  "WOOOOOOOWWWWWWWWWWWWWWWWWWWWWWWWWWWWOOOOOOOWWWWW",
  "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "OwwO........................................OwwO",
  "OwwO........................................OwwO",
  "OwwO........................................OwwO",
  "................................................",
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "OhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhO",
  "OxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO",
  "OxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO",
  "OxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO",
  "OxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxO",
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "......OwwO............................OwwO......",
  "......OwwO............................OwwO......",
  "......OwwO............................OwwO......",
  "......OwwO............................OwwO......",
  "ssssssssssssssssssssssssssssssssssssssssssssssss",
  "..ssssssssssssssssssssssssssssssssssssssssssss..",
  "................................................",
];
