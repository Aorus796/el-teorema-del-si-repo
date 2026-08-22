import assert from "node:assert/strict";
import test from "node:test";
import {
  ELENA_BACK_PIXELS,
  ELENA_FRONT_PIXELS,
  ELENA_PALETTE,
  ELENA_PIXEL_HEIGHT,
  ELENA_PIXEL_WIDTH,
  ELENA_SIDE_PIXELS,
  ELENA_TRANSPARENT,
} from "../../src/content/elenaPixelArt.js";

/*
 * Validación de datos puros (sin DOM, sin cache) del pixel-art indexado de
 * Elena (Elena Character Pixel-Art -- aplica a Elena el mismo lenguaje
 * visual ya aprobado para Gonzalo). Mismo patrón que
 * tests/content/GonzaloPixelArt.test.js: invariantes estructurales del
 * dato (dimensiones, cobertura bidireccional de paleta), más las
 * comprobaciones específicas del criterio de ojos ya aprobado y del
 * contrato de pelo aplicado desde el primer diseño (no como corrección
 * posterior, a diferencia de las cuatro microiteraciones que hicieron
 * falta en Gonzalo -- ver CHANGELOG.md). No son pixel-tests contra una
 * imagen de referencia.
 */

const VARIANTS = {
  front: ELENA_FRONT_PIXELS,
  back: ELENA_BACK_PIXELS,
  side: ELENA_SIDE_PIXELS,
};

for (const [name, pixels] of Object.entries(VARIANTS)) {
  test(`${name}: ELENA_${name.toUpperCase()}_PIXELS tiene exactamente ELENA_PIXEL_HEIGHT filas`, () => {
    assert.equal(pixels.length, ELENA_PIXEL_HEIGHT);
  });

  test(`${name}: cada fila mide exactamente ELENA_PIXEL_WIDTH caracteres`, () => {
    for (const [index, row] of pixels.entries()) {
      assert.equal(
        row.length,
        ELENA_PIXEL_WIDTH,
        `fila ${index} mide ${row.length}, se esperaban ${ELENA_PIXEL_WIDTH}`,
      );
    }
  });

  test(`${name}: todo carácter no transparente tiene entrada en ELENA_PALETTE`, () => {
    const usedSymbols = new Set(pixels.join(""));
    usedSymbols.delete(ELENA_TRANSPARENT);

    for (const symbol of usedSymbols) {
      assert.ok(
        Object.hasOwn(ELENA_PALETTE, symbol),
        `el símbolo "${symbol}" aparece en el pixel-art pero no está en la paleta`,
      );
    }
  });

  test(`${name}: contiene al menos un pixel transparente (silueta recortada, no un bloque relleno)`, () => {
    const hasTransparentPixel = pixels.some((row) =>
      row.includes(ELENA_TRANSPARENT),
    );

    assert.ok(hasTransparentPixel);
  });
}

test("ELENA_PALETTE no declara colores que ninguna de las tres variantes use", () => {
  const usedSymbols = new Set(
    [...Object.values(VARIANTS)].flatMap((pixels) => [...pixels.join("")]),
  );

  for (const symbol of Object.keys(ELENA_PALETTE)) {
    assert.ok(
      usedSymbols.has(symbol),
      `la paleta declara "${symbol}" pero ninguna variante lo usa`,
    );
  }
});

test("ELENA_PALETTE tiene el mismo tamaño que la de Gonzalo (mismo nivel de detalle) pero valores propios", async () => {
  const { GONZALO_PALETTE } = await import(
    "../../src/content/gonzaloPixelArt.js"
  );

  assert.equal(
    Object.keys(ELENA_PALETTE).length,
    Object.keys(GONZALO_PALETTE).length,
  );

  // Elena no debe leerse como "Gonzalo recoloreado": comparte la piel
  // (mismo SKIN_TONE en todo el juego), pero el resto de sus colores son
  // propios -- ver el comentario de elenaPixelArt.js.
  assert.equal(ELENA_PALETTE.k, GONZALO_PALETTE.k, "la piel sí se comparte a propósito");
  assert.notEqual(ELENA_PALETTE.d, GONZALO_PALETTE.d);
  assert.notEqual(ELENA_PALETTE.b, GONZALO_PALETTE.b);
  assert.notEqual(ELENA_PALETTE.O, GONZALO_PALETTE.O);
});

/*
 * Mismo criterio humano aprobado con Gonzalo (Sección 8 de la tarea):
 * ojos simples e integrados en el propio sprite, sin sistema facial --
 * front tiene los dos, side tiene uno solo (el visible en ese lado), back
 * no tiene ninguno. La fila de ojos se localiza comparando FRONT contra
 * SIDE (nunca difieren salvo en esa fila).
 */
const EYE_ROW_INDEX = ELENA_FRONT_PIXELS.findIndex(
  (row, index) => row !== ELENA_SIDE_PIXELS[index],
);

test("front tiene exactamente 2 pixeles de ojo más que back en la fila de ojos", () => {
  assert.notEqual(EYE_ROW_INDEX, -1, "front y side deberían diferir en alguna fila (los ojos)");

  const frontCount = [...ELENA_FRONT_PIXELS[EYE_ROW_INDEX]].filter(
    (symbol) => symbol === "O",
  ).length;
  const backCount = [...ELENA_BACK_PIXELS[EYE_ROW_INDEX]].filter(
    (symbol) => symbol === "O",
  ).length;

  assert.equal(frontCount - backCount, 2);
});

test("side tiene exactamente 1 pixel de ojo más que back en la fila de ojos", () => {
  const sideCount = [...ELENA_SIDE_PIXELS[EYE_ROW_INDEX]].filter(
    (symbol) => symbol === "O",
  ).length;
  const backCount = [...ELENA_BACK_PIXELS[EYE_ROW_INDEX]].filter(
    (symbol) => symbol === "O",
  ).length;

  assert.equal(sideCount - backCount, 1);
});

test("front y side son idénticos salvo en la fila de ojos", () => {
  for (let row = 0; row < ELENA_PIXEL_HEIGHT; row += 1) {
    const front = ELENA_FRONT_PIXELS[row];
    const side = ELENA_SIDE_PIXELS[row];

    if (front === side) {
      continue;
    }

    for (let col = 0; col < ELENA_PIXEL_WIDTH; col += 1) {
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
 * Contrato de pelo trasero aplicado desde el primer diseño de Elena (no
 * como corrección posterior): BACK diverge de FRONT en la fila de ojos y
 * en las filas 3-8 (cabeza), que muestran pelo continuo en vez de la cara
 * que front/side sí tienen ahí -- mismo resultado final que Gonzalo
 * alcanzó tras cuatro microiteraciones (ver CHANGELOG.md), directamente
 * desde el principio. Fuera de esas filas, back debe ser idéntico a
 * front -- si cambiara cualquier otra fila, sería señal de que el pelo
 * largo de los laterales (identidad propia de Elena, filas 9-13) o
 * cualquier otra parte del cuerpo divergiera entre variantes sin motivo.
 */
const BACK_ONLY_HAIR_ROWS = new Set([3, 4, 5, 6, 7, 8]);
const HAIR_SYMBOLS = new Set(["d", "m"]);
const SKIN_SYMBOLS = new Set(["k", "h", "s"]);

function countSymbolsInRow(row, symbolSet) {
  return [...row].filter((symbol) => symbolSet.has(symbol)).length;
}

test("back es idéntico a front en toda fila fuera del rango de pelo trasero de la cabeza", () => {
  for (let row = 0; row < ELENA_PIXEL_HEIGHT; row += 1) {
    const front = ELENA_FRONT_PIXELS[row];
    const back = ELENA_BACK_PIXELS[row];

    if (front === back) {
      continue;
    }

    assert.ok(
      BACK_ONLY_HAIR_ROWS.has(row),
      `fila ${row}: back difiere de front fuera del rango de la cabeza (${[...BACK_ONLY_HAIR_ROWS].join(",")})`,
    );
  }
});

test("la cabeza de BACK (filas 3-8) es pelo puro, sin ninguna banda de piel", () => {
  for (const row of BACK_ONLY_HAIR_ROWS) {
    const backRow = ELENA_BACK_PIXELS[row];
    const frontRow = ELENA_FRONT_PIXELS[row];

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

for (const [name, pixels] of Object.entries(VARIANTS)) {
  test(`${name}: la fila justo debajo del gorro superior (fila 2) es pelo, no piel -- la coronilla tiene masa real`, () => {
    const crownRow = pixels[2];

    assert.ok(countSymbolsInRow(crownRow, HAIR_SYMBOLS) > 0);
    assert.equal(countSymbolsInRow(crownRow, SKIN_SYMBOLS), 0);
  });
}

/*
 * Identidad propia de Elena (Sección 10/11 de la tarea): pelo largo que
 * baja por los laterales del torso -- a diferencia de las mangas cortas
 * de Gonzalo -- y falda/vestido de una sola pieza sin dividir en dos
 * perneras, a diferencia del pantalón de dos piernas separadas de
 * Gonzalo. Estas dos pruebas protegen justo esas dos señas de identidad
 * frente a un futuro cambio accidental que la hiciera leerse como
 * "Gonzalo con otra paleta".
 */
test("el pelo baja por los laterales del torso más allá de la cabeza (pelo largo, identidad propia de Elena)", () => {
  // Las filas 9-12 son hombros/torso alto: deben seguir teniendo pelo en
  // los laterales, no solo piel/ropa -- si no lo tuvieran, el pelo largo
  // se habría recortado sin querer a la altura de la cabeza.
  for (let row = 9; row <= 12; row += 1) {
    const hasHairOnSides = ELENA_FRONT_PIXELS[row]
      .slice(0, 4)
      .split("")
      .some((symbol) => HAIR_SYMBOLS.has(symbol));

    assert.ok(hasHairOnSides, `fila ${row}: se esperaba pelo largo en el lateral izquierdo`);
  }
});

test("la parte inferior del cuerpo es una sola pieza continua (falda/vestido), no dos perneras separadas por un hueco", () => {
  // Gonzalo tiene un hueco transparente entre las dos perneras a esta
  // altura del cuerpo (ver GONZALO_FRONT_PIXELS filas 16-19); Elena, en
  // cambio, debe mostrar un tramo continuo sin ningún "." en el centro.
  for (let row = 16; row <= 17; row += 1) {
    const centerSpan = ELENA_FRONT_PIXELS[row].slice(4, 10);

    assert.ok(
      !centerSpan.includes(ELENA_TRANSPARENT),
      `fila ${row}: el centro de la falda no debería tener ningún hueco transparente`,
    );
  }
});

test("no hay boca: ningún color de la paleta se usa exclusivamente para representar una boca (por defecto, sin boca)", () => {
  assert.equal(Object.keys(ELENA_PALETTE).length, 10);
});
