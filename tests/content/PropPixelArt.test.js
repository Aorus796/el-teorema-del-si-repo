import assert from "node:assert/strict";
import test from "node:test";
import {
  WEDDING_ARCH_PALETTE,
  WEDDING_ARCH_PIXEL_HEIGHT,
  WEDDING_ARCH_PIXEL_WIDTH,
  WEDDING_ARCH_PIXELS,
  WEDDING_ARCH_TRANSPARENT,
} from "../../src/content/weddingArchPixelArt.js";
import {
  buildFountainPalette,
  FOUNTAIN_PIXEL_HEIGHT,
  FOUNTAIN_PIXEL_WIDTH,
  FOUNTAIN_PIXELS,
  FOUNTAIN_TRANSPARENT,
} from "../../src/content/fountainPixelArt.js";
import {
  FLOWER_PLANTER_PALETTE,
  FLOWER_PLANTER_PIXEL_HEIGHT,
  FLOWER_PLANTER_PIXEL_WIDTH,
  FLOWER_PLANTER_PIXELS,
  FLOWER_PLANTER_TRANSPARENT,
} from "../../src/content/flowerPlanterPixelArt.js";
import {
  FLOWER_POT_PALETTE,
  FLOWER_POT_PIXEL_HEIGHT,
  FLOWER_POT_PIXEL_WIDTH,
  FLOWER_POT_PIXELS,
  FLOWER_POT_TRANSPARENT,
} from "../../src/content/flowerPotPixelArt.js";
import {
  BUSH_PALETTE,
  BUSH_ROUND_CORNER_PIXEL_HEIGHT,
  BUSH_ROUND_CORNER_PIXEL_WIDTH,
  BUSH_ROUND_CORNER_PIXELS,
  BUSH_ROUND_FOUNTAIN_PIXEL_HEIGHT,
  BUSH_ROUND_FOUNTAIN_PIXEL_WIDTH,
  BUSH_ROUND_FOUNTAIN_PIXELS,
  BUSH_TRANSPARENT,
  CYPRESS_PIXEL_HEIGHT,
  CYPRESS_PIXEL_WIDTH,
  CYPRESS_PIXELS,
} from "../../src/content/bushPixelArt.js";
import {
  BENCH_PALETTE,
  BENCH_PIXEL_HEIGHT,
  BENCH_PIXEL_WIDTH,
  BENCH_PIXELS,
  BENCH_TRANSPARENT,
} from "../../src/content/benchPixelArt.js";
import {
  LAMP_POST_PALETTE,
  LAMP_POST_PIXEL_HEIGHT,
  LAMP_POST_PIXEL_WIDTH,
  LAMP_POST_PIXELS,
  LAMP_POST_TRANSPARENT,
} from "../../src/content/lampPostPixelArt.js";
import {
  MARKET_STALL_PALETTE,
  MARKET_STALL_PIXEL_HEIGHT,
  MARKET_STALL_PIXEL_WIDTH,
  MARKET_STALL_PIXELS,
  MARKET_STALL_TRANSPARENT,
} from "../../src/content/marketStallPixelArt.js";
import {
  WEDDING_CRATE_PALETTE,
  WEDDING_CRATE_PIXEL_HEIGHT,
  WEDDING_CRATE_PIXEL_WIDTH,
  WEDDING_CRATE_PIXELS,
  WEDDING_CRATE_TRANSPARENT,
} from "../../src/content/weddingCratePixelArt.js";
import {
  FABRIC_ROLL_PALETTE,
  FABRIC_ROLL_PIXEL_HEIGHT,
  FABRIC_ROLL_PIXEL_WIDTH,
  FABRIC_ROLL_PIXELS,
  FABRIC_ROLL_TRANSPARENT,
} from "../../src/content/fabricRollPixelArt.js";

/*
 * Validación de datos puros (sin DOM, sin cache) para todos los props de
 * axiom-plaza migrados a pixel-art indexado en esta ronda (Plaza Visual
 * Polish -- migración tras la aprobación humana de la estrategia validada
 * en wedding-table, ver weddingTablePixelArt.js /
 * WeddingTablePixelArt.test.js, que sigue teniendo su propio archivo de
 * test separado con esta misma cobertura). Generalizado en un único
 * archivo en vez de uno por prop para no multiplicar por diez el mismo
 * bloque de aserciones -- cada entrada de PROPS_TO_VALIDATE es un
 * candidato independiente para el mismo conjunto de invariantes
 * estructurales: dimensiones declaradas vs reales, y cobertura
 * bidireccional de paleta (todo símbolo usado tiene color, todo color
 * declarado se usa). No son pixel-tests: no comparan contra una imagen
 * de referencia, solo la consistencia interna del propio dato.
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
  "wedding-arch",
  WEDDING_ARCH_PIXEL_WIDTH,
  WEDDING_ARCH_PIXEL_HEIGHT,
  WEDDING_ARCH_PALETTE,
  WEDDING_ARCH_PIXELS,
  WEDDING_ARCH_TRANSPARENT,
);

// fountain tiene paleta dinámica (buildFountainPalette(waterColor)) porque
// el agua no tiene un color fijo -- se valida con un color de ejemplo
// real (el de axiom-plaza) igual que se validaría cualquier paleta
// estática, ya que la forma de la paleta (símbolos presentes) no cambia
// según el color de agua, solo los valores de b/h/t/j.
validatePixelArt(
  "fountain",
  FOUNTAIN_PIXEL_WIDTH,
  FOUNTAIN_PIXEL_HEIGHT,
  buildFountainPalette("#4f9da6"),
  FOUNTAIN_PIXELS,
  FOUNTAIN_TRANSPARENT,
);

validatePixelArt(
  "flower-planter",
  FLOWER_PLANTER_PIXEL_WIDTH,
  FLOWER_PLANTER_PIXEL_HEIGHT,
  FLOWER_PLANTER_PALETTE,
  FLOWER_PLANTER_PIXELS,
  FLOWER_PLANTER_TRANSPARENT,
);

validatePixelArt(
  "flower-pot",
  FLOWER_POT_PIXEL_WIDTH,
  FLOWER_POT_PIXEL_HEIGHT,
  FLOWER_POT_PALETTE,
  FLOWER_POT_PIXELS,
  FLOWER_POT_TRANSPARENT,
);

validatePixelArt(
  "bench",
  BENCH_PIXEL_WIDTH,
  BENCH_PIXEL_HEIGHT,
  BENCH_PALETTE,
  BENCH_PIXELS,
  BENCH_TRANSPARENT,
);

validatePixelArt(
  "lamp-post",
  LAMP_POST_PIXEL_WIDTH,
  LAMP_POST_PIXEL_HEIGHT,
  LAMP_POST_PALETTE,
  LAMP_POST_PIXELS,
  LAMP_POST_TRANSPARENT,
);

validatePixelArt(
  "market-stall",
  MARKET_STALL_PIXEL_WIDTH,
  MARKET_STALL_PIXEL_HEIGHT,
  MARKET_STALL_PALETTE,
  MARKET_STALL_PIXELS,
  MARKET_STALL_TRANSPARENT,
);

validatePixelArt(
  "crate",
  WEDDING_CRATE_PIXEL_WIDTH,
  WEDDING_CRATE_PIXEL_HEIGHT,
  WEDDING_CRATE_PALETTE,
  WEDDING_CRATE_PIXELS,
  WEDDING_CRATE_TRANSPARENT,
);

validatePixelArt(
  "fabric-roll",
  FABRIC_ROLL_PIXEL_WIDTH,
  FABRIC_ROLL_PIXEL_HEIGHT,
  FABRIC_ROLL_PALETTE,
  FABRIC_ROLL_PIXELS,
  FABRIC_ROLL_TRANSPARENT,
);

// bush comparte una única paleta entre sus tres variantes (fuente/esquina
// redondas + cipreses) -- se valida dimensiones/símbolos-en-paleta por
// variante, pero "la paleta no declara colores sin usar" solo tiene
// sentido contra la UNIÓN de las tres, ya que un color puede faltar en
// una variante concreta (por ejemplo "P", la flor, no aparece en
// cypress) sin que eso sea un error.
function validateBushDimensionsAndSymbols(name, width, height, pixels) {
  test(`${name}: PIXELS tiene exactamente HEIGHT filas`, () => {
    assert.equal(pixels.length, height);
  });

  test(`${name}: cada fila de PIXELS mide exactamente WIDTH caracteres`, () => {
    for (const [index, row] of pixels.entries()) {
      assert.equal(row.length, width);
    }
  });

  test(`${name}: todo carácter no transparente de PIXELS tiene entrada en BUSH_PALETTE`, () => {
    const usedSymbols = new Set(pixels.join(""));
    usedSymbols.delete(BUSH_TRANSPARENT);

    for (const symbol of usedSymbols) {
      assert.ok(Object.hasOwn(BUSH_PALETTE, symbol));
    }
  });
}

validateBushDimensionsAndSymbols(
  "bush-round-fountain",
  BUSH_ROUND_FOUNTAIN_PIXEL_WIDTH,
  BUSH_ROUND_FOUNTAIN_PIXEL_HEIGHT,
  BUSH_ROUND_FOUNTAIN_PIXELS,
);
validateBushDimensionsAndSymbols(
  "bush-round-corner",
  BUSH_ROUND_CORNER_PIXEL_WIDTH,
  BUSH_ROUND_CORNER_PIXEL_HEIGHT,
  BUSH_ROUND_CORNER_PIXELS,
);
validateBushDimensionsAndSymbols(
  "cypress",
  CYPRESS_PIXEL_WIDTH,
  CYPRESS_PIXEL_HEIGHT,
  CYPRESS_PIXELS,
);

test("BUSH_PALETTE no declara colores que ninguna de las tres variantes use", () => {
  const usedSymbols = new Set([
    ...BUSH_ROUND_FOUNTAIN_PIXELS.join(""),
    ...BUSH_ROUND_CORNER_PIXELS.join(""),
    ...CYPRESS_PIXELS.join(""),
  ]);

  for (const symbol of Object.keys(BUSH_PALETTE)) {
    assert.ok(
      usedSymbols.has(symbol),
      `la paleta declara "${symbol}" pero ninguna variante de bush lo usa`,
    );
  }
});
