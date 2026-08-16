/*
 * Rutas centralizadas de los tres efectos de sonido (SFX) cortos del
 * juego, reproducidos con AudioService.playSfx() -- independientes de la
 * música principal, sin sustituirla ni guardar ninguna referencia tras
 * dispararse (ver src/platform/AudioService.js). Apuntan a recursos
 * originales generados localmente para este repositorio (ver
 * tools/generate-sfx-interact.mjs, tools/generate-sfx-activate.mjs,
 * tools/generate-sfx-puzzle-success.mjs y src/assets/audio/README.md) --
 * se sustituyen reemplazando el archivo correspondiente o actualizando la
 * constante correspondiente, sin tocar las escenas que las consumen.
 */
export const INTERACT_SFX_PATH = "./src/assets/audio/sfx-interact.wav";
export const ACTIVATE_SFX_PATH = "./src/assets/audio/sfx-activate.wav";
export const PUZZLE_SUCCESS_SFX_PATH =
  "./src/assets/audio/sfx-puzzle-success.wav";
