/*
 * Ruta centralizada de la intro musical breve. Apunta a un recurso
 * original generado localmente para este repositorio (ver
 * tools/generate-intro-theme.mjs y src/assets/audio/README.md) — se
 * sustituye reemplazando el archivo o actualizando esta constante, sin
 * tocar TitleScene ni AudioService.
 */
export const INTRO_THEME_PATH = "./src/assets/audio/intro-theme.wav";

/*
 * Duración exacta, en milisegundos, del audio generado por
 * tools/generate-intro-theme.mjs: 2 acordes (CHORDS.length) x 3 segundos
 * por acorde (SECONDS_PER_CHORD) = 6 segundos. WorldScene la usa para
 * retrasar el arranque de la música ambiental hasta que la intro termina
 * de sonar, sin bloquear la jugabilidad. Si se regenera la intro con otra
 * duración, esta constante debe actualizarse manualmente para que ambas
 * sigan sincronizadas — no se deriva del archivo de audio en tiempo de
 * ejecución.
 */
export const INTRO_THEME_DURATION_MS = 6000;
