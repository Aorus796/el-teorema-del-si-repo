/*
 * Tres reflexiones progresivas. Ninguna nombra una pregunta concreta, una
 * terna completa ni el expediente real: la última da el criterio con el que
 * decidir, no la respuesta.
 */
export const DOUBT_BUDGET_HINTS = Object.freeze([
  Object.freeze({
    level: 1,
    text:
      "Una pregunta cuya respuesta ya puedes anticipar en casi todos los expedientes no te ha dicho casi nada. Fíjate en cuáles rara vez te sorprenderían.",
  }),
  Object.freeze({
    level: 2,
    text:
      "Ocho expedientes, tres respuestas de sí o no: la cuenta sale exacta si cada pregunta parte el conjunto justo por la mitad. Cualquier otra reparte mal el presupuesto.",
  }),
  Object.freeze({
    level: 3,
    text:
      "Comparar dos asientos entre sí dice cómo se relacionan, nunca de qué están hechos: gástate al menos una pregunta en la naturaleza de un asiento concreto.",
  }),
]);

export function getDoubtBudgetHint(level) {
  if (!Number.isInteger(level)) {
    return null;
  }

  return DOUBT_BUDGET_HINTS[level - 1] ?? null;
}
