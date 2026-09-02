/*
 * Pixel-art indexado del escritorio central de `archive`
 * (archive-criteria-table, Archivo -- Visual Polish, v1.1): escritorio
 * ornamentado con lámpara y libro/registro abierto sobre el tablero,
 * silla detrás (más arriba, más lejos del jugador) y una alfombra con dos
 * macetas flanqueando. Caso especial por-id en renderObjects() de
 * WorldScene.js (ANTES de la rama genérica "table"). El otro objeto de
 * tipo "table" del juego, epilogue-gift-mechanism en axiom-plaza, tiene
 * desde v1.2 su propio caso especial por-id junto a este (ver
 * epilogueGiftMechanismPixelArt.js).
 *
 * Rediseño (corrección de un hallazgo de QA sobre el diseño original de
 * 48x40): a la escala real del juego, "lámpara + libro" como dos óvalos
 * contiguos se leía como una cara/carátula, y el frente del escritorio
 * (rejilla de rectángulos oscuros) se leía como panel de control. Este
 * rediseño usa formas más distintas y separadas espacialmente:
 *   - Silla: respaldo rectangular angosto ("w", madera oscura) sobre un
 *     asiento más ancho ("S", tapizado en un tono musgo que no se confunde
 *     con la madera del escritorio ni con la alfombra).
 *   - Lámpara: base+tallo estrecho ("L") con una pantalla/cúpula pequeña
 *     arriba ("y"/"Y" con el punto de luz encendida) -- silueta vertical
 *     de lámpara de escritorio, no un óvalo plano.
 *   - Libro: rectángulo plano más ancho que alto ("b") con lomo central
 *     ("c"), separado de la lámpara por varias columnas de tablero simple
 *     ("x") para que no se lean como una única forma tipo cara.
 *   - Frente del escritorio: tablero de madera liso ("W") con dos paneles
 *     tipo puerta de mueble (bordeados, "w" recesado) y un tirador oscuro
 *     cada uno ("j") -- mueble reconocible, sin rejilla de flechas.
 *   - Alfombra: borde/fleco ("r") + marco decorativo interior ("r" sobre
 *     "R") en vez de un bloque liso, con dos macetas más grandes y
 *     reconocibles (hoja "g" + tiesto "o" bordeado) flanqueando.
 *
 * El sprite (48x48, antes 48x40 -- ver más abajo) desborda a propósito el
 * hitbox real del objeto (32x24, ver `archive-criteria-table` en
 * worldMaps.js) hacia arriba (silla) y a los lados (alfombra + macetas) --
 * mismo precedente que `library-ladder` sobre `library-shelves-west-upper`
 * (libraryLadderPixelArt.js): solape visual intencional y documentado,
 * sin afectar colisión ni interacción (el objeto real sigue siendo
 * 32x24, la interacción real usa su interactionRadius de 30 sin cambios).
 *
 * Las 8 filas nuevas (40->48 de alto) extienden la alfombra 8px más hacia
 * abajo que el diseño original -- no para cambiar la posición del sprite
 * (la silla y el tablero quedan exactamente donde estaban), sino para
 * cubrir el parche de tile suelto visible bajo el escritorio (hallazgo
 * menor de QA): el `solidRegion` real de este mueble (worldMaps.js,
 * x176-208,y112-144, 32x32) es 8px más alto que el hitbox interactivo del
 * `object` (32x24, y112-136), así que el sprite original (anclado al
 * fondo del hitbox) dejaba y136-144 sin cubrir. drawArchiveDesk()
 * (WorldScene.js) compensa este alto extra restándolo del cálculo de
 * offsetY para que el desborde adicional caiga hacia abajo, no hacia
 * arriba -- ver el comentario junto a esa función. Mismo precedente que
 * la escalera de Biblioteca: desborde visual intencional sin tocar el
 * `solidRegion` ni el hitbox real.
 *
 * Verificado contra las mesas de consulta
 * (`archive-table-west`/`archive-table-east`, ver worldMaps.js): el
 * sprite ocupa x168-216 en coordenadas de mundo (176-8 a 208+8), que no
 * solapa ninguna de las dos mesas (x108-156 y x228-276) y deja 12px de
 * margen visual real frente a cada una.
 *
 * Generado (ver scratch-generate-archive-desk-v2.mjs, script de un solo
 * uso, no forma parte del repositorio) para garantizar las dimensiones
 * exactas 48x48 sin errores de transcripción manual.
 */

export const ARCHIVE_DESK_TRANSPARENT = ".";

export const ARCHIVE_DESK_PALETTE = {
  O: "#211a17", // contorno
  w: "#3a2e22", // madera oscura de la silla y paneles recesados del frente
  W: "#5a4832", // madera media del panel frontal del escritorio
  x: "#8f7a5c", // tablero del escritorio
  h: "#79654c", // resalte superior del tablero
  y: "#a98a4d", // lámpara (pantalla/cúpula)
  Y: "#efe2bf", // lámpara (luz encendida)
  L: "#4a3319", // lámpara (base y tallo, bronce oscuro)
  b: "#c9b7a0", // páginas del libro/registro abierto
  c: "#211a17", // lomo/pliegue central del libro
  S: "#5c6b45", // asiento tapizado de la silla, tono musgo
  j: "#1c1613", // sombra de contacto del escritorio y tiradores oscuros
  r: "#3f2716", // borde/flecos y marco decorativo de la alfombra
  R: "#6b3f33", // alfombra
  g: "#3d5730", // hoja de la maceta
  o: "#6b3f33", // tiesto de la maceta (mismo tono cálido que la alfombra)
};

export const ARCHIVE_DESK_PIXEL_WIDTH = 48;
export const ARCHIVE_DESK_PIXEL_HEIGHT = 48;

export const ARCHIVE_DESK_PIXELS = [
  "................OOOOOOOOOOOOOOOO................",
  "................OwwwwwwwwwwwwwwO................",
  "................OwwwwwwwwwwwwwwO................",
  "................OOOOOOOOOOOOOOOO................",
  "............OOOOOOOOOOOOOOOOOOOOOOOO............",
  "............OSSSSSSSSSSSSSSSSSSSSSSO............",
  "............OSSSSSSSSSSSSSSSSSSSSSSO............",
  "............OOOOOOOOOOOOOOOOOOOOOOOO............",
  "........OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO........",
  "........OhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhO........",
  "........OxxxxxYYxxxxxxxxxxxxxxxxxxxxxxxO........",
  "........OxxxxyyyyxxxxxxxxxxxxxxxxxxxxxxO........",
  "........OxxxyyyyyyxxxxxOOOOOOOOOOOOOOxxO........",
  "........OxxxxxLLxxxxxxxbbbbbbccbbbbbbxxO........",
  "........OxxxxLLLLxxxxxxOOOOOOOOOOOOOOxxO........",
  "........OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO........",
  "........OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO........",
  "........OhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhO........",
  "........OWWWOOOOOOOOOOOWWOOOOOOOOOOOWWWO........",
  "........OWWWOwwwwwwwwwOWWOwwwwwwwwwOWWWO........",
  "........OWWWOwwwjjwwwwOWWOwwwjjwwwwOWWWO........",
  "........OWWWOwwwjjwwwwOWWOwwwjjwwwwOWWWO........",
  "........OWWWOwwwwwwwwwOWWOwwwwwwwwwOWWWO........",
  "........OWWWOOOOOOOOOOOWWOOOOOOOOOOOWWWO........",
  "........OWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWO........",
  "........OjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjO........",
  "........OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO........",
  "..rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr..",
  "..RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..",
  ".gggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggg.",
  ".gggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggg.",
  ".gggggggrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrggggggg.",
  ".gggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggg.",
  ".OOOOOOORRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRROOOOOOO.",
  ".OoooooORRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRROoooooO.",
  ".OoooooORRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRROoooooO.",
  ".OoooooORRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRROoooooO.",
  ".OoooooORRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRROoooooO.",
  ".OoooooORRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRROoooooO.",
  ".OOOOOOORRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRROOOOOOO.",
  "..RRRrRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRrRRR..",
  "..RRRrRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRrRRR..",
  "..RRRrRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRrRRR..",
  "..RRRrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrRRR..",
  "..RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..",
  "..RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..",
  "..RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..",
  "..rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr..",
];
