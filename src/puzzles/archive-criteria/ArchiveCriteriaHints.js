export const ARCHIVE_CRITERIA_HINTS = Object.freeze([
  Object.freeze({
    level: 1,
    text:
      "No poder confirmar una afirmación no significa haber demostrado lo contrario.",
  }),
  Object.freeze({
    level: 2,
    text:
      "Salvo el recorrido hasta el Archivo, ninguna otra afirmación se decide con un solo registro: mira de quién es cada anotación, en qué momento se hizo y si dos registros del mismo hecho pueden ser ciertos a la vez.",
  }),
  Object.freeze({
    level: 3,
    text:
      "Un registro posterior no explica cómo empezó lo anterior; una corrección firmada no borra que hubo dos propuestas incompatibles; y una declaración de hoy no alcanza a mañana.",
  }),
]);

export function getArchiveCriteriaHint(level) {
  if (!Number.isInteger(level)) {
    return null;
  }

  return ARCHIVE_CRITERIA_HINTS[level - 1] ?? null;
}
