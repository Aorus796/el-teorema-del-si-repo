/*
 * Ruta centralizada del opening musical. El archivo conserva el nombre
 * "intro-theme.wav" por compatibilidad con recursos y herramientas ya
 * existentes (ver tools/generate-intro-theme.mjs), pero ya no es un
 * one-shot corto: funciona como un loop de apertura que suena desde la
 * primera interacción hasta completar el diálogo con el padre de la
 * novia (ver WorldScene.js). Apunta a un recurso original generado
 * localmente para este repositorio (ver también
 * src/assets/audio/README.md) — se sustituye reemplazando el archivo o
 * actualizando esta constante, sin tocar WorldScene ni AudioService.
 */
export const OPENING_THEME_PATH = "./src/assets/audio/intro-theme.wav";
