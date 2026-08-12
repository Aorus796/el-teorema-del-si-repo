/*
 * Render procedural mínimo e independiente para Max (perro, pastor belga
 * malinois) -- no reutiliza el renderer humano de Player.js/WorldScene.js/
 * CreditsScene.js. Sin consumidor jugable todavía: worldMaps.js no
 * coloca a Max en ningún mapa hasta que su ubicación jugable esté
 * aprobada (docs/production/V1_1_PERSONALIZATION_SPEC.md §8).
 */
import { MAX_PALETTE } from "../content/characterPalettes.js";

export const MAX_DIMENSIONS = Object.freeze({ width: 18, height: 13 });

export function renderMax(context, x, y) {
  context.fillStyle = MAX_PALETTE.body;
  context.fillRect(x + 3, y + 4, 14, 8);
  context.fillRect(x, y + 2, 6, 6);
  context.fillRect(x + 1, y, 2, 3);
  context.fillRect(x + 4, y, 2, 3);

  context.fillStyle = MAX_PALETTE.mask;
  context.fillRect(x, y + 4, 4, 3);

  context.fillStyle = MAX_PALETTE.collar;
  context.fillRect(x + 2, y + 6, 3, 2);
}
