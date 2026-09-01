export const P2_HINTS = Object.freeze([
  Object.freeze({
    level: 1,
    text: "Empieza por los lugares con un número impar de puentes disponibles.",
  }),
  Object.freeze({
    level: 2,
    text: "Antes de cerrar nada, cuenta las conexiones de cada lugar. El puente correcto es el que deja el inicio y el final como los únicos dos con un número impar de conexiones.",
  }),
  Object.freeze({
    level: 3,
    text: "Cierra B6 y prueba E-N-R-E-M-R-L: ningún puente se repite.",
  }),
]);

export function getP2Hint(level) {
  if (!Number.isInteger(level)) {
    return null;
  }

  return P2_HINTS[level - 1] ?? null;
}
