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

export const MAX_DIMENSIONS = Object.freeze({ width: 22, height: 18 });

export function renderMax(context, x, y) {
  context.fillStyle = MAX_PALETTE.body;
  context.fillRect(x + 2, y, 2, 3);
  context.fillRect(x + 6, y, 2, 3);
  context.fillRect(x + 1, y + 2, 7, 6);
  context.fillRect(x + 5, y + 7, 7, 2);
  context.fillRect(x + 8, y + 9, 10, 6);
  context.fillRect(x + 9, y + 13, 2, 5);
  context.fillRect(x + 15, y + 13, 3, 5);
  context.fillRect(x + 17, y + 7, 3, 3);
  context.fillRect(x + 19, y + 5, 3, 3);

  context.fillStyle = MAX_PALETTE.mask;
  context.fillRect(x + 1, y + 5, 4, 3);

  context.fillStyle = MAX_PALETTE.collar;
  context.fillRect(x + 6, y + 8, 3, 1);
}
