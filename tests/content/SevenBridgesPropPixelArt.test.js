import assert from "node:assert/strict";
import test from "node:test";
import {
  PIER_PALETTE,
  PIER_CENTER_PIXEL_HEIGHT,
  PIER_CENTER_PIXEL_WIDTH,
  PIER_CENTER_PIXELS,
  PIER_SIDE_PIXEL_HEIGHT,
  PIER_SIDE_PIXEL_WIDTH,
  PIER_SIDE_PIXELS,
  PIER_TRANSPARENT,
} from "../../src/content/pierPixelArt.js";
import {
  BRIDGE_PALETTE,
  BRIDGE_PIXEL_HEIGHT,
  BRIDGE_PIXEL_WIDTH,
  BRIDGE_PIXELS,
  BRIDGE_TRANSPARENT,
} from "../../src/content/bridgePixelArt.js";
import {
  PATH_SIGN_PALETTE,
  PATH_SIGN_PIXEL_HEIGHT,
  PATH_SIGN_PIXEL_WIDTH,
  PATH_SIGN_PIXELS,
  PATH_SIGN_TRANSPARENT,
} from "../../src/content/pathSignPixelArt.js";

/*
 * Validación de datos puros (sin DOM, sin cache) para los props nuevos de
 * seven-bridges-walk (Seven Bridges Visual Polish -- style lock indexado
 * aprobado en axiom-plaza aplicado al Paseo de los Siete Puentes). Mismo
 * patrón generalizado que tests/content/PropPixelArt.test.js: invariantes
 * estructurales del dato (dimensiones declaradas vs reales, cobertura
 * bidireccional de paleta), no pixel-tests contra una imagen de referencia.
 */

function validatePixelArt(name, width, height, palette, pixels, transparent) {
  test(`${name}: PIXELS tiene exactamente HEIGHT filas`, () => {
    assert.equal(pixels.length, height);
  });

  test(`${name}: cada fila de PIXELS mide exactamente WIDTH caracteres`, () => {
    for (const [index, row] of pixels.entries()) {
      assert.equal(
        row.length,
        width,
        `fila ${index} mide ${row.length}, se esperaban ${width}`,
      );
    }
  });

  test(`${name}: todo carácter no transparente de PIXELS tiene entrada en PALETTE`, () => {
    const usedSymbols = new Set(pixels.join(""));
    usedSymbols.delete(transparent);

    for (const symbol of usedSymbols) {
      assert.ok(
        Object.hasOwn(palette, symbol),
        `el símbolo "${symbol}" aparece en el pixel-art pero no está en la paleta`,
      );
    }
  });

  test(`${name}: PALETTE no declara colores que el pixel-art nunca usa`, () => {
    const usedSymbols = new Set(pixels.join(""));

    for (const symbol of Object.keys(palette)) {
      assert.ok(
        usedSymbols.has(symbol),
        `la paleta declara "${symbol}" pero ningún pixel lo usa`,
      );
    }
  });
}

validatePixelArt(
  "pier-side",
  PIER_SIDE_PIXEL_WIDTH,
  PIER_SIDE_PIXEL_HEIGHT,
  PIER_PALETTE,
  PIER_SIDE_PIXELS,
  PIER_TRANSPARENT,
);

validatePixelArt(
  "pier-center",
  PIER_CENTER_PIXEL_WIDTH,
  PIER_CENTER_PIXEL_HEIGHT,
  PIER_PALETTE,
  PIER_CENTER_PIXELS,
  PIER_TRANSPARENT,
);

test("PIER_PALETTE no declara colores que ninguna de las dos variantes use", () => {
  const usedSymbols = new Set([
    ...PIER_SIDE_PIXELS.join(""),
    ...PIER_CENTER_PIXELS.join(""),
  ]);

  for (const symbol of Object.keys(PIER_PALETTE)) {
    assert.ok(
      usedSymbols.has(symbol),
      `la paleta declara "${symbol}" pero ninguna variante de pier lo usa`,
    );
  }
});

validatePixelArt(
  "bridge",
  BRIDGE_PIXEL_WIDTH,
  BRIDGE_PIXEL_HEIGHT,
  BRIDGE_PALETTE,
  BRIDGE_PIXELS,
  BRIDGE_TRANSPARENT,
);

validatePixelArt(
  "path-sign",
  PATH_SIGN_PIXEL_WIDTH,
  PATH_SIGN_PIXEL_HEIGHT,
  PATH_SIGN_PALETTE,
  PATH_SIGN_PIXELS,
  PATH_SIGN_TRANSPARENT,
);

test("las dos variantes de pier son exactamente del mismo ancho (80px), solo cambia el alto", () => {
  // pier-side (80x128) y pier-center (80x192) deben compartir ancho porque
  // ambas restylan solidRegions de 5 tiles de ancho (ver worldMaps.js) --
  // si el ancho divergiera, el restyle visual dejaría de cubrir exactamente
  // el footprint del solidRegion correspondiente.
  assert.equal(PIER_SIDE_PIXEL_WIDTH, PIER_CENTER_PIXEL_WIDTH);
});
