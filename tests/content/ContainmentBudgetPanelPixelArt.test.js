import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTAINMENT_BUDGET_PANEL_PALETTE,
  CONTAINMENT_BUDGET_PANEL_PIXEL_HEIGHT,
  CONTAINMENT_BUDGET_PANEL_PIXEL_WIDTH,
  CONTAINMENT_BUDGET_PANEL_PIXELS,
  CONTAINMENT_BUDGET_PANEL_TRANSPARENT,
} from "../../src/content/containmentBudgetPanelPixelArt.js";
import { getWorldMap } from "../../src/content/worldMaps.js";

/*
 * Validación de datos puros (sin DOM ni cache) del panel de consulta de la
 * Cámara de Contención, con las mismas invariantes estructurales que
 * tests/content/PropPixelArt.test.js aplica al resto de props: dimensiones
 * declaradas frente a reales y cobertura bidireccional de paleta. Se suma
 * la comprobación que motiva la existencia del sprite: la paleta es fría,
 * sin un solo valor de la madera cálida que pintaba la rama genérica de
 * type "table" en WorldScene.js.
 */

const GENERIC_TABLE_COLORS = ["#553b2d", "#d6b65f"];

test("PIXELS tiene exactamente HEIGHT filas de WIDTH caracteres", () => {
  assert.equal(
    CONTAINMENT_BUDGET_PANEL_PIXELS.length,
    CONTAINMENT_BUDGET_PANEL_PIXEL_HEIGHT,
  );

  for (const [index, row] of CONTAINMENT_BUDGET_PANEL_PIXELS.entries()) {
    assert.equal(
      row.length,
      CONTAINMENT_BUDGET_PANEL_PIXEL_WIDTH,
      `la fila ${index} mide ${row.length}, se esperaban ${CONTAINMENT_BUDGET_PANEL_PIXEL_WIDTH}`,
    );
  }
});

test("la paleta cubre exactamente los símbolos usados, en los dos sentidos", () => {
  const usedSymbols = new Set(CONTAINMENT_BUDGET_PANEL_PIXELS.join(""));

  usedSymbols.delete(CONTAINMENT_BUDGET_PANEL_TRANSPARENT);

  assert.deepEqual(
    [...usedSymbols].sort(),
    Object.keys(CONTAINMENT_BUDGET_PANEL_PALETTE).sort(),
  );
});

/*
 * El panel no usa transparencia: cubre su bounding box entero, que a su vez
 * cubre exactamente el solidRegion de 2x2 tiles declarado en worldMaps.js
 * (32x32), 8px más alto que el hitbox interactivo del objeto (32x24). Lo
 * que se ve bloqueado es lo que bloquea de verdad, igual que en el pozo.
 */
test("el sprite cubre exactamente la región sólida del panel, no su hitbox", () => {
  const map = getWorldMap("containment-chamber");
  const panel = map.objects.find(
    (object) => object.id === "containment-budget-panel",
  );
  const solidRegion = { x: 11, y: 3, width: 2, height: 2 };

  assert.equal(
    CONTAINMENT_BUDGET_PANEL_PIXELS.join("").includes(
      CONTAINMENT_BUDGET_PANEL_TRANSPARENT,
    ),
    false,
    "el panel no debe tener píxeles transparentes",
  );

  assert.equal(
    CONTAINMENT_BUDGET_PANEL_PIXEL_WIDTH,
    solidRegion.width * map.tileSize,
  );
  assert.equal(
    CONTAINMENT_BUDGET_PANEL_PIXEL_HEIGHT,
    solidRegion.height * map.tileSize,
  );
  assert.equal(panel.x, solidRegion.x * map.tileSize);
  assert.equal(panel.y, solidRegion.y * map.tileSize);
  assert.equal(
    CONTAINMENT_BUDGET_PANEL_PIXEL_HEIGHT - panel.height,
    8,
    "el sprite desborda 8px por debajo del hitbox, hasta el borde de su región sólida",
  );
});

/*
 * La razón de ser de este pixel-art: la rama genérica de type "table" pinta
 * madera cálida (#553b2d) y franja dorada (#d6b65f), la paleta del
 * mobiliario del Archivo y la Biblioteca. Dentro de la Cámara eso rompía la
 * identidad fría de la sala.
 */
test("ningún color del panel procede de la rama genérica de mesas", () => {
  const colors = Object.values(CONTAINMENT_BUDGET_PANEL_PALETTE).map((color) =>
    color.toLowerCase(),
  );

  for (const warmColor of GENERIC_TABLE_COLORS) {
    assert.equal(
      colors.includes(warmColor),
      false,
      `${warmColor} es un color de la rama genérica de mesas`,
    );
  }
});

/*
 * Continuidad con el resto de la Cámara: el turquesa de la ranura de
 * lectura es exactamente el mismo de la celosía y el pozo, y el dorado del
 * precinto exactamente el de la estantería sellada. Si alguien retocara uno
 * de los dos, la sala dejaría de leerse como un único material.
 */
test("el turquesa y el dorado del panel son los ya establecidos en la Cámara", () => {
  assert.equal(CONTAINMENT_BUDGET_PANEL_PALETTE.t, "#57c9c2");
  assert.equal(CONTAINMENT_BUDGET_PANEL_PALETTE.T, "#2c7d7c");
  assert.equal(CONTAINMENT_BUDGET_PANEL_PALETTE.g, "#c9a24a");
  assert.equal(CONTAINMENT_BUDGET_PANEL_PALETTE.G, "#8f6f2c");
});

/*
 * El acento dorado es un precinto discreto, no el protagonista de la pieza
 * (el criterio explícito del encargo de arte): ocupa menos que el turquesa
 * y muchísimo menos que la piedra.
 */
test("el dorado es un acento minoritario frente al turquesa y la piedra", () => {
  const countSymbols = (symbols) =>
    CONTAINMENT_BUDGET_PANEL_PIXELS.reduce(
      (total, row) =>
        total + [...row].filter((symbol) => symbols.includes(symbol)).length,
      0,
    );

  const gold = countSymbols(["g", "G"]);
  const turquoise = countSymbols(["t", "T"]);
  const stone = countSymbols(["s", "S", "d"]);

  assert.ok(gold > 0, "el precinto dorado debe existir");
  assert.ok(gold < turquoise, "el dorado no debe superar al turquesa");
  assert.ok(gold * 10 < stone, "la piedra debe dominar la pieza");
});
