export const P2_HINTS = Object.freeze([
  Object.freeze({
    level: 1,
    text: "Empieza por los lugares con un número impar de puentes disponibles.",
  }),
  Object.freeze({
    level: 2,
    text: "Al cerrar el puente correcto, solo la Entrada y el Molino quedan impares.",
  }),
  Object.freeze({
    level: 3,
    text: "Cierra B1 y prueba E-R-N-L-R-M-L: ningún puente se repite.",
  }),
]);

export function getP2Hint(level) {
  if (!Number.isInteger(level)) {
    return null;
  }

  return P2_HINTS[level - 1] ?? null;
}
