export const HINT_PROGRESS_CODE = Object.freeze({
  HINT_REVEALED: "hint_revealed",
  ALL_HINTS_READ: "all_hints_read",
});

export function validateHintsRead(hintsRead) {
  if (!Array.isArray(hintsRead)) {
    throw new TypeError("El progreso de pistas debe ser un array.");
  }

  if (hintsRead.length > 3) {
    throw new RangeError("El progreso de pistas no puede superar tres niveles.");
  }

  for (let index = 0; index < hintsRead.length; index += 1) {
    if (hintsRead[index] !== index + 1) {
      throw new RangeError(
        "El progreso de pistas debe ser [], [1], [1, 2] o [1, 2, 3].",
      );
    }
  }

  return [...hintsRead];
}

export function revealNextHint(hintsRead) {
  const validHintsRead = validateHintsRead(hintsRead);

  if (validHintsRead.length === 3) {
    return {
      code: HINT_PROGRESS_CODE.ALL_HINTS_READ,
      level: 3,
      hintsRead: validHintsRead,
    };
  }

  const level = validHintsRead.length + 1;
  return {
    code: HINT_PROGRESS_CODE.HINT_REVEALED,
    level,
    hintsRead: [...validHintsRead, level],
  };
}
