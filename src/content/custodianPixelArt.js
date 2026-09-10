/*
 * Pixel-art indexado del Custodio (autómata administrativo de la Cámara de
 * Contención). Mismo patrón técnico que elenaPixelArt.js -- constantes de
 * ancho/alto, símbolo -> color, filas de caracteres -- pero deliberadamente
 * NO su anatomía: el Custodio no es un personaje humano y no debe leerse
 * como uno.
 *
 * Bounding box 20x32, frente a los 14x22 de los personajes humanos
 * (Gonzalo/Elena/Corolaria/Silogio/padre de la novia): más alto y más
 * ancho, para que se lea como mobiliario institucional con voz propia y no
 * como "una persona más" del reparto.
 *
 * Silueta, de abajo arriba:
 *  - peana ancha (filas 26-31): el Custodio no tiene piernas, se desliza
 *    por una guía; nunca camina, así que no existen variantes de marcha;
 *  - fuste de placas de piedra apiladas (filas 13-25) con juntas doradas
 *    horizontales, ensanchándose hacia la base;
 *  - dos brazos finos de metal dorado plegados sobre el pecho (filas
 *    17-18), nunca extendidos: el Custodio no entrega nada;
 *  - cuello estrecho de 2px de ancho interior (filas 10-12);
 *  - cabeza en trapecio INVERTIDO (filas 0-9): más ancha arriba (16px) que
 *    abajo (8px), justo la inversión de la silueta de una cabeza humana.
 *
 * Elemento distintivo: una ranura horizontal de cristal turquesa
 * atravesando la cabeza (filas 4-5) en lugar de ojos. Es lo único que
 * cambia entre variantes.
 *
 * Variantes implementadas: DOS ("idle" y "contradiction"), no las cinco del
 * diseño ideal. Reducción de alcance anticipada y aceptada en el estudio de
 * validación del personaje ("qué recortaría primero: los estados
 * error/confirmación de la ranura"): el juego solo necesita distinguir el
 * reposo administrativo del único momento en que el Custodio tiene que
 * aplicarse su propio protocolo. Las variantes de error/confirmación/
 * escucha quedan fuera; añadirlas es sumar filas 3-6 nuevas a esta misma
 * matriz, sin tocar el resto del cuerpo.
 *
 * Paleta de 10 colores, sin un solo valor hexadecimal compartido con
 * characterPalettes.js ni con la paleta de ningún personaje del juego
 * (Gonzalo/Elena/Corolaria/Silogio/padre de la novia/Max): el Custodio no
 * puede leerse como un personaje humano recoloreado.
 *
 * Sí comparte colores -- a propósito, y sólo dentro de la Cámara de
 * Contención -- con los otros cuatro props de la sala, pero no los mismos
 * con cada uno, porque no todos están hechos del mismo material:
 *  - el turquesa del cristal (t/T), con la celosía
 *    (containmentLatticePixelArt.js) y el pozo
 *    (containmentWellPixelArt.js);
 *  - el dorado del precinto (g/G), con la estantería sellada
 *    (containmentShelfPixelArt.js);
 *  - el gris de placa fría `P`, con la celosía;
 *  - todos los anteriores más la piedra (s/S/d) y el metal `p`, con el
 *    panel de consulta (containmentBudgetPanelPixelArt.js), que es el prop
 *    hecho literalmente de los mismos materiales que el Custodio.
 * Ninguno de los cuatro comparte a la vez el turquesa y el dorado salvo el
 * panel. Son los mismos materiales de la misma sala, y esa continuidad es
 * lo que hace legible que todo lo turquesa de la Cámara procede del mismo
 * expediente sin cerrar. Fuera de esos cuatro archivos, la paleta no
 * coincide en ningún valor con nada de src/content/ (ver
 * tests/content/CustodianPixelArt.test.js, que comprueba exactamente eso:
 * la exclusividad frente a los personajes y frente al resto del juego, y
 * la lista cerrada de coincidencias permitidas dentro de la Cámara).
 */

export const CUSTODIAN_PIXEL_WIDTH = 20;
export const CUSTODIAN_PIXEL_HEIGHT = 32;
export const CUSTODIAN_TRANSPARENT = ".";

export const CUSTODIAN_PALETTE = {
  O: "#1b2226", // contorno
  s: "#cfc7b4", // piedra base
  S: "#e8e1d0", // piedra realce
  d: "#9d9483", // piedra sombra
  g: "#c9a24a", // junta dorada / brazo
  G: "#8f6f2c", // dorado sombra
  t: "#57c9c2", // cristal turquesa de la ranura
  T: "#2c7d7c", // turquesa oscuro, fondo de la ranura
  p: "#6b7178", // placa de metal frío (cabeza y cuello)
  P: "#474d53", // placa de metal, sombra
};

/*
 * Filas comunes a todas las variantes: cuerpo completo salvo las filas
 * 3-6, que son las únicas que dependen del estado de la ranura. Se
 * componen en createCustodianPixels() para que no puedan divergir entre
 * variantes por un error de transcripción.
 */
const CUSTODIAN_HEAD_TOP_ROWS = [
  "..OOOOOOOOOOOOOOOO..",
  "..OppppppppppppppO..",
  "...OppppppppppppO...",
];

const CUSTODIAN_BODY_ROWS = [
  ".....OPPPPPPPPO.....",
  "......OPPPPPPO......",
  "......OOOOOOOO......",
  "........OPPO........",
  "........OPPO........",
  "........OPPO........",
  ".....OSSSSSSSSO.....",
  ".....OssssssssO.....",
  ".....OggggggggO.....",
  "....OSSSSSSSSSSO....",
  "....OsggggggggsO....",
  "....OsGGGGGGGGsO....",
  "....OssssssssssO....",
  "....OggggggggggO....",
  "...OSSSSSSSSSSSSO...",
  "...OssssssssssssO...",
  "...OddddddddddddO...",
  "...OggggggggggggO...",
  "...OddddddddddddO...",
  "..OSSSSSSSSSSSSSSO..",
  "..OssssssssssssssO..",
  ".OssssssssssssssssO.",
  ".OddddddddddddddddO.",
  "OddddddddddddddddddO",
  "OOOOOOOOOOOOOOOOOOOO",
];

// Filas 3-6: contorno de la cabeza más el estado de la ranura.
const CUSTODIAN_SLIT_ROWS = {
  idle: [
    "...OPppppppppppPO...",
    "....OttttttttttO....",
    "....OTTTTTTTTTTO....",
    ".....OppppppppO.....",
  ],
  /*
   * "contradiction": la ranura se derrama una fila hacia arriba y otra
   * hacia abajo y pierde el fondo oscuro. No es un parpadeo ni una
   * animación: es un segundo sprite estático que la escena elige cuando el
   * Custodio tiene que aplicarse su propio protocolo.
   */
  contradiction: [
    "...OPppttttttppPO...",
    "....OttttttttttO....",
    "....OttttttttttO....",
    ".....OpttttttpO.....",
  ],
};

function createCustodianPixels(variant) {
  return Object.freeze([
    ...CUSTODIAN_HEAD_TOP_ROWS,
    ...CUSTODIAN_SLIT_ROWS[variant],
    ...CUSTODIAN_BODY_ROWS,
  ]);
}

export const CUSTODIAN_IDLE_PIXELS = createCustodianPixels("idle");
export const CUSTODIAN_CONTRADICTION_PIXELS =
  createCustodianPixels("contradiction");

export const CUSTODIAN_SLIT_VARIANTS = Object.freeze([
  "idle",
  "contradiction",
]);
