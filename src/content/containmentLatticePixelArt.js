/*
 * Pixel-art indexado de la celosía de cristal que sella el ala este de la
 * Cámara de Contención ("containment-lattice"), tras la cual espera Elena.
 *
 * A diferencia del resto de props del juego, este sprite NO cubre por sí
 * solo el footprint declarado de su decoración: es un patrón de 16x32
 * diseñado para repetirse verticalmente (ver drawContainmentLattice() en
 * WorldScene.js), igual que la decoración "dock" de seven-bridges-walk
 * repite tablones horizontalmente. La celosía real mide 16x224 px, siete
 * repeticiones exactas de esta matriz, y la fila 0 de cada repetición hace
 * de travesaño horizontal -- por eso el patrón es tileable: su primera
 * fila y su última encajan sin costura visible.
 *
 * La celosía es una `solidRegion` real en worldMaps.js y lo sigue siendo
 * después de resolver la consulta: el jugador nunca la cruza. Lo que se
 * abre al cerrar el expediente es narrativo -- sale Elena, no entra
 * Gonzalo -- así que no existe ninguna colisión condicional ni versión
 * "abierta" de este sprite.
 */

export const CONTAINMENT_LATTICE_TRANSPARENT = ".";

export const CONTAINMENT_LATTICE_PALETTE = {
  O: "#232a2e", // marco y montantes
  p: "#474d53", // travesaño metálico
  t: "#57c9c2", // cristal
  T: "#2c7d7c", // cristal, veta oscura
};

export const CONTAINMENT_LATTICE_PIXEL_WIDTH = 16;
export const CONTAINMENT_LATTICE_PIXEL_HEIGHT = 32;

export const CONTAINMENT_LATTICE_PIXELS = [
  "OOOOOOOOOOOOOOOO",
  "OppppppppppppppO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OOOOOOOOOOOOOOOO",
  "OppppppppppppppO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
  "OpOtTtOtTtOtTtpO",
];
