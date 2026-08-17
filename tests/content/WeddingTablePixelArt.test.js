import assert from "node:assert/strict";
import test from "node:test";
import {
  WEDDING_TABLE_PALETTE,
  WEDDING_TABLE_PIXEL_HEIGHT,
  WEDDING_TABLE_PIXEL_WIDTH,
  WEDDING_TABLE_PIXELS,
  WEDDING_TABLE_TRANSPARENT,
} from "../../src/content/weddingTablePixelArt.js";

/*
 * Validación de datos puros (sin DOM, sin cache): el pixel-art indexado de
 * la mesa de boda es una matriz de caracteres estática -- esto comprueba
 * que la propia matriz es internamente consistente, no que se rasterice
 * correctamente (eso lo cubre tests/scenes/WorldScenePixelArtCache.test.js
 * a través de la cache real). No es un pixel-test frágil: no compara
 * contra una imagen de referencia, solo invariantes estructurales del
 * dato (dimensiones declaradas vs reales, cobertura de paleta).
 */

test("WEDDING_TABLE_PIXELS tiene exactamente WEDDING_TABLE_PIXEL_HEIGHT filas", () => {
  assert.equal(WEDDING_TABLE_PIXELS.length, WEDDING_TABLE_PIXEL_HEIGHT);
});

test("cada fila de WEDDING_TABLE_PIXELS mide exactamente WEDDING_TABLE_PIXEL_WIDTH caracteres", () => {
  for (const [index, row] of WEDDING_TABLE_PIXELS.entries()) {
    assert.equal(
      row.length,
      WEDDING_TABLE_PIXEL_WIDTH,
      `fila ${index} mide ${row.length}, se esperaban ${WEDDING_TABLE_PIXEL_WIDTH}`,
    );
  }
});

test("todo carácter no transparente de WEDDING_TABLE_PIXELS tiene una entrada en WEDDING_TABLE_PALETTE", () => {
  const usedSymbols = new Set(WEDDING_TABLE_PIXELS.join(""));
  usedSymbols.delete(WEDDING_TABLE_TRANSPARENT);

  for (const symbol of usedSymbols) {
    assert.ok(
      Object.hasOwn(WEDDING_TABLE_PALETTE, symbol),
      `el símbolo "${symbol}" aparece en el pixel-art pero no está en la paleta`,
    );
  }
});

test("WEDDING_TABLE_PALETTE no declara colores que el pixel-art nunca usa", () => {
  const usedSymbols = new Set(WEDDING_TABLE_PIXELS.join(""));

  for (const symbol of Object.keys(WEDDING_TABLE_PALETTE)) {
    assert.ok(
      usedSymbols.has(symbol),
      `la paleta declara "${symbol}" pero ningún pixel lo usa`,
    );
  }
});

test("el pixel-art contiene al menos un pixel transparente (silueta recortada, no un rectángulo relleno)", () => {
  const hasTransparentPixel = WEDDING_TABLE_PIXELS.some((row) =>
    row.includes(WEDDING_TABLE_TRANSPARENT),
  );

  assert.ok(hasTransparentPixel);
});
