/*
 * Pixel-art indexado de la estantería de archivo de `archive` (Archivo --
 * Visual Polish, v1.1). Migra las 2 decoraciones que antes usaban el tipo
 * compartido "tables" (bloque marrón + "mantel" claro, ver la rama de
 * WorldScene.js que ahora sigue sirviendo solo a axiom-plaza) a un tipo
 * exclusivo que se lee como una estantería real: marco de madera, baldas
 * horizontales y filas de lomos de libros con varios tonos, mismo lenguaje
 * visual que libraryShelfPixelArt.js pero con una paleta ligeramente más
 * fría/grisácea, coherente con la paleta propia de `archive`
 * (groundA:"#74685b", wall:"#443d3c", más fría que la de `library`).
 *
 * Único tamaño real en archive (80x32, ver worldMaps.js: ambas
 * decoraciones -- noroeste y noreste -- comparten exactamente esas
 * dimensiones), a diferencia de library-shelf, que necesita dos variantes.
 *
 * Generado proceduralmente (ver scratch-generate-archive-art.mjs, script
 * de un solo uso, no forma parte del repositorio) a partir de una regla de
 * diseño fija -- anchos/colores de lomo en ciclo determinista, con hueco
 * oscuro ("b") sobre los libros más bajos para dar sensación de volumen,
 * mismo patrón que libraryShelfPixelArt.js -- para garantizar exactamente
 * 32 filas y el ancho declarado sin errores de transcripción manual.
 */

export const ARCHIVE_SHELF_TRANSPARENT = ".";

export const ARCHIVE_SHELF_PALETTE = {
  O: "#211a17", // contorno / marco / junta entre libros
  h: "#6e6154", // resalte superior del marco
  S: "#7a6d5e", // balda de madera clara y fría
  m: "#332a24", // sombra de la balda
  b: "#1c1613", // hueco oscuro tras libros más bajos que su compartimento
  R: "#7c4a3a", // lomo terracota
  G: "#4c6b5c", // lomo verde grisáceo
  Y: "#a98a4d", // lomo ocre apagado
  N: "#3f5a6b", // lomo azul grisáceo
  P: "#5e4a5e", // lomo ciruela apagado
};

export const ARCHIVE_SHELF_PIXEL_WIDTH = 80;
export const ARCHIVE_SHELF_PIXEL_HEIGHT = 32;

export const ARCHIVE_SHELF_PIXELS = [
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
  "OhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhO",
  "ORRRRROGGGGGGObbbbONNNNNNNOPPPPPObbbbbbOGGGGOYYYYYYYYObbbbbOPPPPPPORRRRRObbbbbbO",
  "ORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRROGGGGGGO",
  "ORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRROGGGGGGO",
  "ORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRROGGGGGGO",
  "ORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRROGGGGGGO",
  "ORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRROGGGGGGO",
  "ORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRROGGGGGGO",
  "ORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRROGGGGGGO",
  "OSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSO",
  "OmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmO",
  "ObbbbbORRRRRROGGGGObbbbbbbbONNNNNOPPPPPPObbbbbOGGGGGGOYYYYObbbbbbbOPPPPPORRRRRRO",
  "OPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRRO",
  "OPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRRO",
  "OPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRRO",
  "OPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRRO",
  "OPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRRO",
  "OPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRRO",
  "OPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRRO",
  "OSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSO",
  "OmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmO",
  "ObbbbbbORRRRROGGGGGGObbbbONNNNNNNOPPPPPObbbbbbOGGGGOYYYYYYYYObbbbbOPPPPPPORRRRRO",
  "OPPPPPPORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRRO",
  "OPPPPPPORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRRO",
  "OPPPPPPORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRRO",
  "OPPPPPPORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRRO",
  "OPPPPPPORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRRO",
  "OPPPPPPORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRRO",
  "OPPPPPPORRRRROGGGGGGOYYYYONNNNNNNOPPPPPORRRRRROGGGGOYYYYYYYYONNNNNOPPPPPPORRRRRO",
  "OmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmO",
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
];
