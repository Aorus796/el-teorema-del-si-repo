export const LIBRARY_CATALOGUE_HINTS = Object.freeze([
  Object.freeze({
    level: 1,
    text:
      "Atlas y Diario forman un bloque: el Atlas va inmediatamente antes del Diario.",
  }),
  Object.freeze({
    level: 2,
    text:
      "El Registro no está en un extremo, aparece antes del Catálogo y también antes del Manual.",
  }),
  Object.freeze({
    level: 3,
    text:
      "El Catálogo de la Criba no puede ocupar la segunda posición: si lo intentas ahí, el Registro quedaría obligado a un extremo, y eso rompe una regla ya conocida.",
  }),
]);

export function getLibraryCatalogueHint(level) {
  if (!Number.isInteger(level)) {
    return null;
  }

  return LIBRARY_CATALOGUE_HINTS[level - 1] ?? null;
}
