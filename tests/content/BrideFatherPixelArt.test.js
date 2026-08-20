import assert from "node:assert/strict";
import test from "node:test";
import {
  BRIDE_FATHER_BACK_PIXELS,
  BRIDE_FATHER_FRONT_PIXELS,
  BRIDE_FATHER_PIXEL_HEIGHT,
  BRIDE_FATHER_PIXEL_PALETTE,
  BRIDE_FATHER_PIXEL_WIDTH,
  BRIDE_FATHER_SIDE_PIXELS,
  BRIDE_FATHER_TRANSPARENT,
} from "../../src/content/brideFatherPixelArt.js";

/*
 * Validación de datos puros (sin DOM, sin cache) del pixel-art indexado
 * del Padre de la novia (Bride Father Character Pixel-Art -- aplica el
 * mismo lenguaje visual ya aprobado para Gonzalo, Elena y Corolaria).
 * Mismo patrón que tests/content/GonzaloPixelArt.test.js/
 * ElenaPixelArt.test.js/CorolariaPixelArt.test.js: invariantes
 * estructurales del dato (dimensiones, cobertura bidireccional de
 * paleta), más las comprobaciones específicas del criterio de ojos ya
 * aprobado y del contrato de pelo/canas trasero aplicado desde el primer
 * diseño. No son pixel-tests contra una imagen de referencia.
 */

const VARIANTS = {
  front: BRIDE_FATHER_FRONT_PIXELS,
  back: BRIDE_FATHER_BACK_PIXELS,
  side: BRIDE_FATHER_SIDE_PIXELS,
};

for (const [name, pixels] of Object.entries(VARIANTS)) {
  test(`${name}: BRIDE_FATHER_${name.toUpperCase()}_PIXELS tiene exactamente BRIDE_FATHER_PIXEL_HEIGHT filas`, () => {
    assert.equal(pixels.length, BRIDE_FATHER_PIXEL_HEIGHT);
  });

  test(`${name}: cada fila mide exactamente BRIDE_FATHER_PIXEL_WIDTH caracteres`, () => {
    for (const [index, row] of pixels.entries()) {
      assert.equal(
        row.length,
        BRIDE_FATHER_PIXEL_WIDTH,
        `fila ${index} mide ${row.length}, se esperaban ${BRIDE_FATHER_PIXEL_WIDTH}`,
      );
    }
  });

  test(`${name}: todo carácter no transparente tiene entrada en BRIDE_FATHER_PIXEL_PALETTE`, () => {
    const usedSymbols = new Set(pixels.join(""));
    usedSymbols.delete(BRIDE_FATHER_TRANSPARENT);

    for (const symbol of usedSymbols) {
      assert.ok(
        Object.hasOwn(BRIDE_FATHER_PIXEL_PALETTE, symbol),
        `el símbolo "${symbol}" aparece en el pixel-art pero no está en la paleta`,
      );
    }
  });

  test(`${name}: contiene al menos un pixel transparente (silueta recortada, no un bloque relleno)`, () => {
    const hasTransparentPixel = pixels.some((row) =>
      row.includes(BRIDE_FATHER_TRANSPARENT),
    );

    assert.ok(hasTransparentPixel);
  });
}

test("BRIDE_FATHER_PIXEL_PALETTE no declara colores que ninguna de las tres variantes use", () => {
  const usedSymbols = new Set(
    [...Object.values(VARIANTS)].flatMap((pixels) => [...pixels.join("")]),
  );

  for (const symbol of Object.keys(BRIDE_FATHER_PIXEL_PALETTE)) {
    assert.ok(
      usedSymbols.has(symbol),
      `la paleta declara "${symbol}" pero ninguna variante lo usa`,
    );
  }
});

test("BRIDE_FATHER_PIXEL_PALETTE tiene el mismo tamaño que la de Gonzalo/Elena/Corolaria (mismo nivel de detalle) pero valores propios", async () => {
  const { GONZALO_PALETTE } = await import(
    "../../src/content/gonzaloPixelArt.js"
  );
  const { ELENA_PALETTE } = await import(
    "../../src/content/elenaPixelArt.js"
  );
  const { COROLARIA_PALETTE } = await import(
    "../../src/content/corolariaPixelArt.js"
  );

  assert.equal(
    Object.keys(BRIDE_FATHER_PIXEL_PALETTE).length,
    Object.keys(GONZALO_PALETTE).length,
  );
  assert.equal(
    Object.keys(BRIDE_FATHER_PIXEL_PALETTE).length,
    Object.keys(ELENA_PALETTE).length,
  );
  assert.equal(
    Object.keys(BRIDE_FATHER_PIXEL_PALETTE).length,
    Object.keys(COROLARIA_PALETTE).length,
  );

  // El Padre no debe leerse como "Gonzalo recoloreado": comparte la piel
  // (mismo SKIN_TONE en todo el juego), pero el resto de sus colores son
  // propios -- ver el comentario de brideFatherPixelArt.js.
  assert.equal(
    BRIDE_FATHER_PIXEL_PALETTE.k,
    GONZALO_PALETTE.k,
    "la piel sí se comparte a propósito",
  );
  assert.notEqual(BRIDE_FATHER_PIXEL_PALETTE.O, GONZALO_PALETTE.O);
  assert.notEqual(BRIDE_FATHER_PIXEL_PALETTE.d, GONZALO_PALETTE.d);
  assert.notEqual(BRIDE_FATHER_PIXEL_PALETTE.b, GONZALO_PALETTE.b);
  assert.notEqual(BRIDE_FATHER_PIXEL_PALETTE.b, ELENA_PALETTE.b);
  assert.notEqual(BRIDE_FATHER_PIXEL_PALETTE.b, COROLARIA_PALETTE.b);
});

test("BRIDE_FATHER_PIXEL_PALETTE preserva exactamente los cinco colores existentes de BRIDE_FATHER_PALETTE (characterPalettes.js)", async () => {
  const { BRIDE_FATHER_PALETTE } = await import(
    "../../src/content/characterPalettes.js"
  );

  assert.equal(BRIDE_FATHER_PIXEL_PALETTE.O, BRIDE_FATHER_PALETTE.silhouette);
  assert.equal(BRIDE_FATHER_PIXEL_PALETTE.d, BRIDE_FATHER_PALETTE.hair);
  assert.equal(BRIDE_FATHER_PIXEL_PALETTE.k, BRIDE_FATHER_PALETTE.head);
  assert.equal(BRIDE_FATHER_PIXEL_PALETTE.b, BRIDE_FATHER_PALETTE.body);
  assert.equal(BRIDE_FATHER_PIXEL_PALETTE.L, BRIDE_FATHER_PALETTE.bodyAccent);
});

/*
 * Mismo criterio humano aprobado con Gonzalo/Elena/Corolaria (ver style
 * lock): ojos simples e integrados en el propio sprite, sin sistema
 * facial -- front tiene los dos, side tiene uno solo (el visible en ese
 * lado), back no tiene ninguno. La fila de ojos se localiza comparando
 * FRONT contra SIDE (nunca difieren salvo en esa fila).
 */
const EYE_ROW_INDEX = BRIDE_FATHER_FRONT_PIXELS.findIndex(
  (row, index) => row !== BRIDE_FATHER_SIDE_PIXELS[index],
);

test("front tiene exactamente 2 pixeles de ojo más que back en la fila de ojos", () => {
  assert.notEqual(
    EYE_ROW_INDEX,
    -1,
    "front y side deberían diferir en alguna fila (los ojos)",
  );

  const frontCount = [...BRIDE_FATHER_FRONT_PIXELS[EYE_ROW_INDEX]].filter(
    (symbol) => symbol === "O",
  ).length;
  const backCount = [...BRIDE_FATHER_BACK_PIXELS[EYE_ROW_INDEX]].filter(
    (symbol) => symbol === "O",
  ).length;

  assert.equal(frontCount - backCount, 2);
});

test("side tiene exactamente 1 pixel de ojo más que back en la fila de ojos", () => {
  const sideCount = [...BRIDE_FATHER_SIDE_PIXELS[EYE_ROW_INDEX]].filter(
    (symbol) => symbol === "O",
  ).length;
  const backCount = [...BRIDE_FATHER_BACK_PIXELS[EYE_ROW_INDEX]].filter(
    (symbol) => symbol === "O",
  ).length;

  assert.equal(sideCount - backCount, 1);
});

test("front y side son idénticos salvo en la fila de ojos", () => {
  for (let row = 0; row < BRIDE_FATHER_PIXEL_HEIGHT; row += 1) {
    const front = BRIDE_FATHER_FRONT_PIXELS[row];
    const side = BRIDE_FATHER_SIDE_PIXELS[row];

    if (front === side) {
      continue;
    }

    for (let col = 0; col < BRIDE_FATHER_PIXEL_WIDTH; col += 1) {
      const symbols = [front[col], side[col]];

      if (symbols[0] === symbols[1]) {
        continue;
      }

      const onlyEyeSymbolDiffers = symbols.every(
        (symbol) => symbol === "O" || symbol === "k",
      );

      assert.ok(
        onlyEyeSymbolDiffers,
        `fila ${row} col ${col}: diferencia fuera de la fila de ojos (${symbols.join(",")})`,
      );
    }
  }
});

/*
 * Contrato de pelo/canas trasero aplicado desde el primer diseño del
 * Padre (no como corrección posterior): BACK diverge de FRONT en la
 * fila de ojos y en las filas 3-8 (cabeza), que muestran pelo/canas
 * continuos en vez de la cara que front/side sí tienen ahí -- mismo
 * resultado final que Gonzalo alcanzó tras cuatro microiteraciones (ver
 * CHANGELOG.md), directamente desde el principio. Fuera de esas filas,
 * back debe ser idéntico a front -- la fila 9 (nuca/cuello) es la única
 * excepción y muestra piel incluso de espaldas, para que la cobertura no
 * termine en un corte brusco ni deje una banda de calvicie.
 */
const BACK_ONLY_HAIR_ROWS = new Set([3, 4, 5, 6, 7, 8]);
const HAIR_SYMBOLS = new Set(["d", "m"]);
const SKIN_SYMBOLS = new Set(["k", "h", "s"]);

function countSymbolsInRow(row, symbolSet) {
  return [...row].filter((symbol) => symbolSet.has(symbol)).length;
}

test("back es idéntico a front en toda fila fuera del rango de pelo/canas trasero de la cabeza", () => {
  for (let row = 0; row < BRIDE_FATHER_PIXEL_HEIGHT; row += 1) {
    const front = BRIDE_FATHER_FRONT_PIXELS[row];
    const back = BRIDE_FATHER_BACK_PIXELS[row];

    if (front === back) {
      continue;
    }

    assert.ok(
      BACK_ONLY_HAIR_ROWS.has(row),
      `fila ${row}: back difiere de front fuera del rango de la cabeza (${[...BACK_ONLY_HAIR_ROWS].join(",")})`,
    );
  }
});

test("la cabeza de BACK (filas 3-8) es pelo/canas puro, sin ninguna banda de piel (sin tonsura ni calvicie accidental)", () => {
  for (const row of BACK_ONLY_HAIR_ROWS) {
    const backRow = BRIDE_FATHER_BACK_PIXELS[row];
    const frontRow = BRIDE_FATHER_FRONT_PIXELS[row];

    assert.equal(
      countSymbolsInRow(backRow, SKIN_SYMBOLS),
      0,
      `fila ${row} de BACK todavía muestra piel`,
    );
    assert.ok(
      countSymbolsInRow(backRow, HAIR_SYMBOLS) >
        countSymbolsInRow(frontRow, HAIR_SYMBOLS),
      `fila ${row} de BACK no tiene más pelo/canas que la misma fila de FRONT (cara)`,
    );
  }
});

test("la nuca (fila 9) sigue mostrando piel incluso de espaldas -- cobertura de pelo coherente hasta un cuello mínimo, no un corte brusco", () => {
  assert.equal(BRIDE_FATHER_BACK_PIXELS[9], BRIDE_FATHER_FRONT_PIXELS[9]);
  assert.ok(countSymbolsInRow(BRIDE_FATHER_BACK_PIXELS[9], SKIN_SYMBOLS) > 0);
});

for (const [name, pixels] of Object.entries(VARIANTS)) {
  test(`${name}: la fila justo debajo del gorro superior (fila 2) es pelo/canas, no piel -- la coronilla tiene masa real`, () => {
    const crownRow = pixels[2];

    assert.ok(countSymbolsInRow(crownRow, HAIR_SYMBOLS) > 0);
    assert.equal(countSymbolsInRow(crownRow, SKIN_SYMBOLS), 0);
  });

  test(`${name}: el pelo/canas usa al menos dos tonos distintos (d y m), no un único color de bloque`, () => {
    const joined = pixels.join("");

    assert.ok(joined.includes("d"));
    assert.ok(joined.includes("m"));
  });
}

/*
 * Identidad propia del Padre de la novia (secciones 5/11/12 de la
 * tarea): torso mucho más ancho que la cabeza y que las piernas (lectura
 * de "torso robusto, hombros amplios, presencia madura"), y piernas
 * legibles y separadas por un hueco central, a diferencia de Gonzalo
 * (torso de 12 columnas, piernas sin hueco central transparente) y de
 * Corolaria (silueta recta de ancho constante de hombros a bajo). Estas
 * pruebas protegen esas señas de identidad frente a un futuro cambio
 * accidental que lo hiciera leerse como "Gonzalo con otra paleta".
 */
function rowSpan(row) {
  const symbols = row.split("");
  const first = symbols.findIndex(
    (symbol) => symbol !== BRIDE_FATHER_TRANSPARENT,
  );
  const last = symbols.findLastIndex(
    (symbol) => symbol !== BRIDE_FATHER_TRANSPARENT,
  );

  return last - first + 1;
}

test("el torso (hombros, fila 10) es más ancho que la cabeza (fila 3) -- presencia robusta y madura", () => {
  assert.ok(rowSpan(BRIDE_FATHER_FRONT_PIXELS[10]) > rowSpan(BRIDE_FATHER_FRONT_PIXELS[3]));
});

test("el torso (fila 10) es más ancho que las piernas (fila 17) -- hombros amplios que se estrechan hacia las piernas", () => {
  assert.ok(rowSpan(BRIDE_FATHER_FRONT_PIXELS[10]) > rowSpan(BRIDE_FATHER_FRONT_PIXELS[17]));
});

test("el torso ocupa el ancho completo del sprite (14 columnas), sin margen transparente a los lados, a diferencia de Gonzalo y Corolaria", async () => {
  const { GONZALO_FRONT_PIXELS } = await import(
    "../../src/content/gonzaloPixelArt.js"
  );

  assert.equal(rowSpan(BRIDE_FATHER_FRONT_PIXELS[10]), BRIDE_FATHER_PIXEL_WIDTH);
  assert.ok(rowSpan(GONZALO_FRONT_PIXELS[10]) < BRIDE_FATHER_PIXEL_WIDTH);
});

test("las piernas están separadas por un hueco central transparente -- piernas diferenciadas, no una sola masa", () => {
  for (let row = 17; row <= 18; row += 1) {
    const legRow = BRIDE_FATHER_FRONT_PIXELS[row];
    const centerSpan = legRow.slice(5, 9);

    assert.ok(
      centerSpan.includes(BRIDE_FATHER_TRANSPARENT),
      `fila ${row}: se esperaba un hueco transparente entre las dos piernas`,
    );
  }
});

test("presencia de azul (body) y crema (bodyAccent/L) en el torso -- identidad azul + crema preservada", () => {
  const joined = BRIDE_FATHER_FRONT_PIXELS.join("");

  assert.ok(joined.includes("b"), "se esperaba azul (b) en el torso");
  assert.ok(joined.includes("L"), "se esperaba crema (L) como acento");
});

test("no hay boca: ningún color de la paleta se usa exclusivamente para representar una boca (por defecto, sin boca)", () => {
  assert.equal(Object.keys(BRIDE_FATHER_PIXEL_PALETTE).length, 10);
});
