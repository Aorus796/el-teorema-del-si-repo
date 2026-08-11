/*
 * Fuente única de verdad para los datos de personalización aprobados de
 * v1.1 (docs/production/V1_1_PERSONALIZATION_SPEC.md, docs/production/
 * CODEX_HANDOFF.md -> "Personalización futura"). Ningún otro archivo de
 * src/ debe repetir estos valores de forma literal.
 *
 * Este módulo no decide todavía dónde ni cuándo se usa cada dato en el
 * juego -- eso corresponde a tareas posteriores (ver la especificación,
 * secciones 5 y 13). Mismo patrón que src/content/epilogueConfig.js:
 * solo constantes, sin lógica.
 */

export const PROTAGONIST_NAME = "Gonzalo";
export const PARTNER_NAME = "Elena";
export const COUPLE_NAMES = "Gonzalo y Elena";
export const DOG_NAME = "Max";
export const DOG_SPECIES = "perro";
export const DOG_BREED = "pastor belga malinois";
export const WEDDING_DATE = "26 de septiembre de 2026";
export const WEDDING_DATE_ISO = "2026-09-26";
export const WEDDING_CITY = "Logroño";
export const STORY_TOWN = "Axioma";

export const COUPLE_DEDICATION =
  "Gonzalo y Elena: que nunca os falten caminos por recorrer, preguntas " +
  "que resolver juntos y razones para seguir diciendo sí. Que la vida os " +
  "encuentre siempre del mismo lado del puente, con Max cerca, muchas " +
  "risas y la certeza de que el mejor teorema es el que se demuestra " +
  "cada día: elegiros una y otra vez.";
