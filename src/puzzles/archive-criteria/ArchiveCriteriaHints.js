export const ARCHIVE_CRITERIA_HINTS = Object.freeze([
  Object.freeze({
    level: 1,
    text:
      "No poder confirmar una afirmación no significa haber demostrado lo contrario.",
  }),
  Object.freeze({
    level: 2,
    text:
      "La entrada y el recorrido están registrados; una discrepancia contradice “nunca”; las dos declaraciones presentes coinciden.",
  }),
  Object.freeze({
    level: 3,
    text:
      "Las afirmaciones 1, 2 y 5 están confirmadas; 3 y 4 están contradichas; la afirmación 6 sobre todo el futuro no puede decidirse.",
  }),
]);

export function getArchiveCriteriaHint(level) {
  if (!Number.isInteger(level)) {
    return null;
  }

  return ARCHIVE_CRITERIA_HINTS[level - 1] ?? null;
}
