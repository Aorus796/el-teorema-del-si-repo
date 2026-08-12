/*
 * Render procedural mínimo e independiente para Max (perro, pastor belga
 * malinois) -- no reutiliza el renderer humano de Player.js/WorldScene.js/
 * CreditsScene.js. Sin consumidor jugable todavía: worldMaps.js no
 * coloca a Max en ningún mapa hasta que su ubicación jugable esté
 * aprobada (docs/production/V1_1_PERSONALIZATION_SPEC.md §8). Vista
 * lateral simplificada (cabeza a la izquierda, cuerpo a la derecha),
 * elegida por legibilidad canina antes que por coherencia de orientación
 * con el render frontal de los personajes humanos.
 */
import { MAX_PALETTE } from "../content/characterPalettes.js";

export const MAX_DIMENSIONS = Object.freeze({ width: 22, height: 16 });

export function renderMax(context, x, y) {
  context.fillStyle = MAX_PALETTE.body;
  context.fillRect(x + 2, y, 2, 3);
  context.fillRect(x + 6, y, 2, 3);
  context.fillRect(x + 1, y + 2, 7, 6);
  context.fillRect(x + 7, y + 5, 11, 7);
  context.fillRect(x + 3, y + 8, 2, 8);
  context.fillRect(x + 14, y + 12, 2, 4);
  context.fillRect(x + 18, y + 6, 3, 2);

  context.fillStyle = MAX_PALETTE.mask;
  context.fillRect(x + 1, y + 5, 4, 3);

  context.fillStyle = MAX_PALETTE.collar;
  context.fillRect(x + 6, y + 6, 3, 2);
}
