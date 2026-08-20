import assert from "node:assert/strict";
import test from "node:test";
import {
  COROLARIA_BACK_PIXELS,
  COROLARIA_FRONT_PIXELS,
  COROLARIA_PALETTE,
  COROLARIA_PIXEL_HEIGHT,
  COROLARIA_PIXEL_WIDTH,
  COROLARIA_SIDE_PIXELS,
  COROLARIA_TRANSPARENT,
} from "../../src/content/corolariaPixelArt.js";

/*
 * Validación de datos puros (sin DOM, sin cache) del pixel-art indexado de
 * la Alcaldesa Corolaria (Corolaria Character Pixel-Art -- aplica el
 * mismo lenguaje visual ya aprobado para Gonzalo y Elena). Mismo patrón
 * que tests/content/GonzaloPixelArt.test.js/ElenaPixelArt.test.js:
 * invariantes estructurales del dato (dimensiones, cobertura bidireccional
 * de paleta), más las comprobaciones específicas del criterio de ojos ya
 * aprobado y del contrato de pelo trasero aplicado desde el primer diseño.
 * No son pixel-tests contra una imagen de referencia.
 */

const VARIANTS = {
  front: COROLARIA_FRONT_PIXELS,
  back: COROLARIA_BACK_PIXELS,
  side: COROLARIA_SIDE_PIXELS,
};

for (const [name, pixels] of Object.entries(VARIANTS)) {
  test(`${name}: COROLARIA_${name.toUpperCase()}_PIXELS tiene exactamente COROLARIA_PIXEL_HEIGHT filas`, () => {
    assert.equal(pixels.length, COROLARIA_PIXEL_HEIGHT);
  });

  test(`${name}: cada fila mide exactamente COROLARIA_PIXEL_WIDTH caracteres`, () => {
    for (const [index, row] of pixels.entries()) {
      assert.equal(
        row.length,
        COROLARIA_PIXEL_WIDTH,
        `fila ${index} mide ${row.length}, se esperaban ${COROLARIA_PIXEL_WIDTH}`,
      );
    }
  });

  test(`${name}: todo carácter no transparente tiene entrada en COROLARIA_PALETTE`, () => {
    const usedSymbols = new Set(pixels.join(""));
    usedSymbols.delete(COROLARIA_TRANSPARENT);

    for (const symbol of usedSymbols) {
      assert.ok(
        Object.hasOwn(COROLARIA_PALETTE, symbol),
        `el símbolo "${symbol}" aparece en el pixel-art pero no está en la paleta`,
      );
    }
  });

  test(`${name}: contiene al menos un pixel transparente (silueta recortada, no un bloque relleno)`, () => {
    const hasTransparentPixel = pixels.some((row) =>
      row.includes(COROLARIA_TRANSPARENT),
    );

    assert.ok(hasTransparentPixel);
  });
}

test("COROLARIA_PALETTE no declara colores que ninguna de las tres variantes use", () => {
  const usedSymbols = new Set(
    [...Object.values(VARIANTS)].flatMap((pixels) => [...pixels.join("")]),
  );

  for (const symbol of Object.keys(COROLARIA_PALETTE)) {
    assert.ok(
      usedSymbols.has(symbol),
      `la paleta declara "${symbol}" pero ninguna variante lo usa`,
    );
  }
});

test("COROLARIA_PALETTE tiene el mismo tamaño que la de Gonzalo/Elena (mismo nivel de detalle) pero valores propios", async () => {
  const { GONZALO_PALETTE } = await import(
    "../../src/content/gonzaloPixelArt.js"
  );
  const { ELENA_PALETTE } = await import(
    "../../src/content/elenaPixelArt.js"
  );

  assert.equal(
    Object.keys(COROLARIA_PALETTE).length,
    Object.keys(GONZALO_PALETTE).length,
  );
  assert.equal(
    Object.keys(COROLARIA_PALETTE).length,
    Object.keys(ELENA_PALETTE).length,
  );

  // Corolaria no debe leerse como "Elena recoloreada": comparte la piel
  // (mismo SKIN_TONE en todo el juego), pero el resto de sus colores son
  // propios -- ver el comentario de corolariaPixelArt.js.
  assert.equal(COROLARIA_PALETTE.k, GONZALO_PALETTE.k, "la piel sí se comparte a propósito");
  assert.equal(COROLARIA_PALETTE.k, ELENA_PALETTE.k, "la piel sí se comparte a propósito");
  assert.notEqual(COROLARIA_PALETTE.O, ELENA_PALETTE.O);
  assert.notEqual(COROLARIA_PALETTE.d, ELENA_PALETTE.d);
  assert.notEqual(COROLARIA_PALETTE.b, ELENA_PALETTE.b);
  assert.notEqual(COROLARIA_PALETTE.L, ELENA_PALETTE.L);
});

test("COROLARIA_PALETTE preserva exactamente los cinco colores existentes de MAYOR_PALETTE", async () => {
  const { MAYOR_PALETTE } = await import(
    "../../src/content/characterPalettes.js"
  );

  assert.equal(COROLARIA_PALETTE.O, MAYOR_PALETTE.silhouette);
  assert.equal(COROLARIA_PALETTE.d, MAYOR_PALETTE.hair);
  assert.equal(COROLARIA_PALETTE.k, MAYOR_PALETTE.head);
  assert.equal(COROLARIA_PALETTE.b, MAYOR_PALETTE.body);
  assert.equal(COROLARIA_PALETTE.L, MAYOR_PALETTE.bodyAccent);
});

/*
 * Mismo criterio humano aprobado con Gonzalo/Elena (ver style lock):
 * ojos simples e integrados en el propio sprite, sin sistema facial --
 * front tiene los dos, side tiene uno solo (el visible en ese lado), back
 * no tiene ninguno. La fila de ojos se localiza comparando FRONT contra
 * SIDE (nunca difieren salvo en esa fila).
 */
const EYE_ROW_INDEX = COROLARIA_FRONT_PIXELS.findIndex(
  (row, index) => row !== COROLARIA_SIDE_PIXELS[index],
);

test("front tiene exactamente 2 pixeles de ojo más que back en la fila de ojos", () => {
  assert.notEqual(EYE_ROW_INDEX, -1, "front y side deberían diferir en alguna fila (los ojos)");

  const frontCount = [...COROLARIA_FRONT_PIXELS[EYE_ROW_INDEX]].filter(
    (symbol) => symbol === "O",
  ).length;
  const backCount = [...COROLARIA_BACK_PIXELS[EYE_ROW_INDEX]].filter(
    (symbol) => symbol === "O",
  ).length;

  assert.equal(frontCount - backCount, 2);
});

test("side tiene exactamente 1 pixel de ojo más que back en la fila de ojos", () => {
  const sideCount = [...COROLARIA_SIDE_PIXELS[EYE_ROW_INDEX]].filter(
    (symbol) => symbol === "O",
  ).length;
  const backCount = [...COROLARIA_BACK_PIXELS[EYE_ROW_INDEX]].filter(
    (symbol) => symbol === "O",
  ).length;

  assert.equal(sideCount - backCount, 1);
});

test("front y side son idénticos salvo en la fila de ojos", () => {
  for (let row = 0; row < COROLARIA_PIXEL_HEIGHT; row += 1) {
    const front = COROLARIA_FRONT_PIXELS[row];
    const side = COROLARIA_SIDE_PIXELS[row];

    if (front === side) {
      continue;
    }

    for (let col = 0; col < COROLARIA_PIXEL_WIDTH; col += 1) {
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
 * Contrato de pelo trasero aplicado desde el primer diseño de Corolaria
 * (no como corrección posterior): BACK diverge de FRONT en la fila de
 * ojos y en las filas 3-7 (cabeza), que muestran pelo continuo en vez de
 * la cara que front/side sí tienen ahí. La fila 8 (nuca/cuello) es la
 * única excepción y muestra piel incluso de espaldas -- misma lección
 * aprendida en las microiteraciones de Gonzalo (ver CHANGELOG.md),
 * aplicada aquí desde el principio.
 */
const BACK_ONLY_HAIR_ROWS = new Set([3, 4, 5, 6, 7]);
const HAIR_SYMBOLS = new Set(["d", "m"]);
const SKIN_SYMBOLS = new Set(["k", "h", "s"]);

function countSymbolsInRow(row, symbolSet) {
  return [...row].filter((symbol) => symbolSet.has(symbol)).length;
}

test("back es idéntico a front en toda fila fuera del rango de pelo trasero de la cabeza", () => {
  for (let row = 0; row < COROLARIA_PIXEL_HEIGHT; row += 1) {
    const front = COROLARIA_FRONT_PIXELS[row];
    const back = COROLARIA_BACK_PIXELS[row];

    if (front === back) {
      continue;
    }

    assert.ok(
      BACK_ONLY_HAIR_ROWS.has(row),
      `fila ${row}: back difiere de front fuera del rango de la cabeza (${[...BACK_ONLY_HAIR_ROWS].join(",")})`,
    );
  }
});

test("la cabeza de BACK (filas 3-7) es pelo puro, sin ninguna banda de piel", () => {
  for (const row of BACK_ONLY_HAIR_ROWS) {
    const backRow = COROLARIA_BACK_PIXELS[row];
    const frontRow = COROLARIA_FRONT_PIXELS[row];

    assert.equal(
      countSymbolsInRow(backRow, SKIN_SYMBOLS),
      0,
      `fila ${row} de BACK todavía muestra piel`,
    );
    assert.ok(
      countSymbolsInRow(backRow, HAIR_SYMBOLS) >
        countSymbolsInRow(frontRow, HAIR_SYMBOLS),
      `fila ${row} de BACK no tiene más pelo que la misma fila de FRONT (cara)`,
    );
  }
});

test("la nuca (fila 8) sigue mostrando piel incluso de espaldas -- cobertura de pelo coherente hasta un cuello mínimo, no un corte brusco", () => {
  assert.equal(COROLARIA_BACK_PIXELS[8], COROLARIA_FRONT_PIXELS[8]);
  assert.ok(countSymbolsInRow(COROLARIA_BACK_PIXELS[8], SKIN_SYMBOLS) > 0);
});

for (const [name, pixels] of Object.entries(VARIANTS)) {
  test(`${name}: la fila justo debajo del gorro superior (fila 2) es pelo, no piel -- el recogido tiene masa real`, () => {
    const crownRow = pixels[2];

    assert.ok(countSymbolsInRow(crownRow, HAIR_SYMBOLS) > 0);
    assert.equal(countSymbolsInRow(crownRow, SKIN_SYMBOLS), 0);
  });
}

/*
 * Identidad propia de Corolaria (secciones 4/5/10/11 de la tarea):
 * peinado recogido, SIN mechones largos cayendo por los laterales del
 * torso (a diferencia del pelo largo de Elena), y parte inferior recta
 * de ancho constante desde los hombros hasta el bajo (a diferencia de la
 * falda que se ensancha de Elena), con detalle dorado presente en varios
 * puntos estructurales para reforzar la lectura de autoridad formal.
 * Estas pruebas protegen esas señas de identidad frente a un futuro
 * cambio accidental que la hiciera leerse como "Elena con otra paleta".
 */
test("el pelo NO baja por los laterales del torso (peinado recogido, sin mechones largos, a diferencia de Elena)", () => {
  for (let row = 9; row < COROLARIA_PIXEL_HEIGHT; row += 1) {
    assert.equal(
      countSymbolsInRow(COROLARIA_FRONT_PIXELS[row], HAIR_SYMBOLS),
      0,
      `fila ${row}: no debería haber pelo por debajo de la cabeza`,
    );
  }
});

function rowSpan(row) {
  const first = row.split("").findIndex((symbol) => symbol !== COROLARIA_TRANSPARENT);
  const last = row.split("").findLastIndex((symbol) => symbol !== COROLARIA_TRANSPARENT);

  return last - first + 1;
}

test("la base inferior del cuerpo es tan ancha como la línea de hombros, sin ensancharse como la falda de Elena", () => {
  const shoulderSpan = rowSpan(COROLARIA_FRONT_PIXELS[9]);

  for (let row = 15; row <= 18; row += 1) {
    assert.equal(
      rowSpan(COROLARIA_FRONT_PIXELS[row]),
      shoulderSpan,
      `fila ${row}: la base no debe ser más ancha ni más estrecha que los hombros (fila 9)`,
    );
  }
});

test("el detalle dorado (acento) aparece en al menos tres filas estructurales distintas (hombros, cinturón, bajo)", () => {
  const rowsWithGoldAccent = COROLARIA_FRONT_PIXELS.filter((row) =>
    row.includes("L"),
  ).length;

  assert.ok(
    rowsWithGoldAccent >= 3,
    `se esperaban al menos 3 filas con acento dorado, se encontraron ${rowsWithGoldAccent}`,
  );
});

test("no hay boca: ningún color de la paleta se usa exclusivamente para representar una boca (por defecto, sin boca)", () => {
  assert.equal(Object.keys(COROLARIA_PALETTE).length, 10);
});
