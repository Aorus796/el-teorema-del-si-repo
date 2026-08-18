import assert from "node:assert/strict";
import test from "node:test";
import {
  GONZALO_BACK_PIXELS,
  GONZALO_FRONT_PIXELS,
  GONZALO_PALETTE,
  GONZALO_PIXEL_HEIGHT,
  GONZALO_PIXEL_WIDTH,
  GONZALO_SIDE_PIXELS,
  GONZALO_TRANSPARENT,
} from "../../src/content/gonzaloPixelArt.js";

/*
 * Validación de datos puros (sin DOM, sin cache) del pixel-art indexado de
 * Gonzalo (Gonzalo Character Pixel-Art Spike). Mismo patrón que
 * tests/content/PropPixelArt.test.js: invariantes estructurales del dato
 * (dimensiones, cobertura bidireccional de paleta), más las comprobaciones
 * específicas de esta tarea (ojos solo donde corresponde según la
 * decisión humana aprobada, transparencia real -- silueta recortada, no
 * un bloque relleno). No son pixel-tests contra una imagen de referencia.
 */

const VARIANTS = {
  front: GONZALO_FRONT_PIXELS,
  back: GONZALO_BACK_PIXELS,
  side: GONZALO_SIDE_PIXELS,
};

for (const [name, pixels] of Object.entries(VARIANTS)) {
  test(`${name}: GONZALO_${name.toUpperCase()}_PIXELS tiene exactamente GONZALO_PIXEL_HEIGHT filas`, () => {
    assert.equal(pixels.length, GONZALO_PIXEL_HEIGHT);
  });

  test(`${name}: cada fila mide exactamente GONZALO_PIXEL_WIDTH caracteres`, () => {
    for (const [index, row] of pixels.entries()) {
      assert.equal(
        row.length,
        GONZALO_PIXEL_WIDTH,
        `fila ${index} mide ${row.length}, se esperaban ${GONZALO_PIXEL_WIDTH}`,
      );
    }
  });

  test(`${name}: todo carácter no transparente tiene entrada en GONZALO_PALETTE`, () => {
    const usedSymbols = new Set(pixels.join(""));
    usedSymbols.delete(GONZALO_TRANSPARENT);

    for (const symbol of usedSymbols) {
      assert.ok(
        Object.hasOwn(GONZALO_PALETTE, symbol),
        `el símbolo "${symbol}" aparece en el pixel-art pero no está en la paleta`,
      );
    }
  });

  test(`${name}: contiene al menos un pixel transparente (silueta recortada, no un bloque relleno)`, () => {
    const hasTransparentPixel = pixels.some((row) =>
      row.includes(GONZALO_TRANSPARENT),
    );

    assert.ok(hasTransparentPixel);
  });
}

test("GONZALO_PALETTE no declara colores que ninguna de las tres variantes use", () => {
  const usedSymbols = new Set(
    [...Object.values(VARIANTS)].flatMap((pixels) => [...pixels.join("")]),
  );

  for (const symbol of Object.keys(GONZALO_PALETTE)) {
    assert.ok(
      usedSymbols.has(symbol),
      `la paleta declara "${symbol}" pero ninguna variante lo usa`,
    );
  }
});

/*
 * Decisión humana aprobada (Sección 4 de la tarea): ojos simples e
 * integrados en el propio sprite, sin sistema facial -- front tiene los
 * dos, side tiene uno solo (el visible en ese lado), back no tiene
 * ninguno. Se identifican por el color de contorno reutilizado para los
 * ojos (GONZALO_PALETTE.O, "sin pupilas complejas, color oscuro") en la
 * única fila en la que las tres variantes difieren.
 */
test("front tiene exactamente 2 pixeles de ojo más que back en la fila de ojos", () => {
  const eyeRowIndex = GONZALO_FRONT_PIXELS.findIndex(
    (row, index) => row !== GONZALO_BACK_PIXELS[index],
  );

  assert.notEqual(eyeRowIndex, -1, "front y back deberían diferir en alguna fila (los ojos)");

  const countEyes = (row) =>
    [...row].filter((symbol) => symbol === "O").length -
    [...GONZALO_BACK_PIXELS[eyeRowIndex]].filter((symbol) => symbol === "O")
      .length;

  assert.equal(countEyes(GONZALO_FRONT_PIXELS[eyeRowIndex]), 2);
});

test("side tiene exactamente 1 pixel de ojo más que back en la fila de ojos", () => {
  const eyeRowIndex = GONZALO_SIDE_PIXELS.findIndex(
    (row, index) => row !== GONZALO_BACK_PIXELS[index],
  );

  assert.notEqual(eyeRowIndex, -1);

  const sideEyeCount = [...GONZALO_SIDE_PIXELS[eyeRowIndex]].filter(
    (symbol) => symbol === "O",
  ).length;
  const backEyeCount = [...GONZALO_BACK_PIXELS[eyeRowIndex]].filter(
    (symbol) => symbol === "O",
  ).length;

  assert.equal(sideEyeCount - backEyeCount, 1);
});

test("front y side son idénticos salvo en la fila de ojos", () => {
  // Ninguno de los dos se tocó en la microiteración de la nuca -- deben
  // seguir siendo exactamente el mismo cuerpo salvo el ojo visible.
  for (let row = 0; row < GONZALO_PIXEL_HEIGHT; row += 1) {
    const front = GONZALO_FRONT_PIXELS[row];
    const side = GONZALO_SIDE_PIXELS[row];

    if (front === side) {
      continue;
    }

    for (let col = 0; col < GONZALO_PIXEL_WIDTH; col += 1) {
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
 * Regresión de la SEGUNDA microiteración visual de la PR #59 (revisión
 * humana: "la variante BACK todavía hace que Gonzalo parezca calvo en la
 * nuca"): a diferencia del primer ajuste (coronilla, compartido por las
 * tres variantes), este es exclusivo de BACK -- las filas 7 y 8 ganan
 * cobertura de pelo sobre la nuca que front/side deliberadamente no
 * tienen (front/side muestran la mandíbula en esas filas, back muestra la
 * base del cráneo). Fuera de la fila de ojos (donde back nunca tiene
 * ojos, eso no cambia) y de estas dos filas nuevas, back debe seguir
 * siendo idéntico a front -- si cambiara cualquier otra fila, sería una
 * señal de que el ajuste se salió del alcance pedido (solo la nuca).
 */
const BACK_ONLY_HAIR_ROWS = new Set([7, 8]);

test("back es idéntico a front salvo en la fila de ojos y en las dos filas nuevas de la nuca", () => {
  const eyeRowIndex = GONZALO_FRONT_PIXELS.findIndex(
    (row, index) => row !== GONZALO_BACK_PIXELS[index],
  );

  for (let row = 0; row < GONZALO_PIXEL_HEIGHT; row += 1) {
    const front = GONZALO_FRONT_PIXELS[row];
    const back = GONZALO_BACK_PIXELS[row];

    if (front === back) {
      continue;
    }

    assert.ok(
      row === eyeRowIndex || BACK_ONLY_HAIR_ROWS.has(row),
      `fila ${row}: back difiere de front fuera de la fila de ojos y de las filas de la nuca (${BACK_ONLY_HAIR_ROWS.size ? [...BACK_ONLY_HAIR_ROWS].join(",") : "ninguna"})`,
    );
  }
});

test("la nuca de BACK (filas 7-8) ahora es pelo puro, no la sombra de piel que tenía antes", () => {
  for (const row of BACK_ONLY_HAIR_ROWS) {
    const backRow = GONZALO_BACK_PIXELS[row];
    const frontRow = GONZALO_FRONT_PIXELS[row];

    assert.equal(
      countSymbolsInRow(backRow, SKIN_SYMBOLS),
      0,
      `fila ${row} de BACK todavía muestra piel en la nuca`,
    );
    assert.ok(
      countSymbolsInRow(backRow, HAIR_SYMBOLS) >
        countSymbolsInRow(frontRow, HAIR_SYMBOLS),
      `fila ${row} de BACK no tiene más pelo que la misma fila de FRONT (mandíbula)`,
    );
  }
});

test("BACK conserva una pequeña zona de piel en el cuello justo debajo de la nuca (fila 9), no cobertura total", () => {
  // La propia tarea permite explícitamente una pequeña zona de piel en el
  // cuello -- esta prueba documenta que el ajuste no se extralimitó hasta
  // cubrir esa fila también.
  assert.ok(countSymbolsInRow(GONZALO_BACK_PIXELS[9], SKIN_SYMBOLS) > 0);
});

test("no hay boca: ningún color de la paleta se usa exclusivamente para representar una boca (por defecto, sin boca)", () => {
  // No hay un símbolo dedicado a "boca" en GONZALO_PALETTE en absoluto
  // (Sección 12: "Por defecto: NO boca") -- esta prueba documenta esa
  // decisión de forma verificable: la paleta declarada no incluye ningún
  // color adicional más allá de los diez usados por contorno/ojos, piel
  // (x3), pelo (x2), ropa (x3) y calzado.
  assert.equal(Object.keys(GONZALO_PALETTE).length, 10);
});

/*
 * Regresión de la microiteración visual de la PR #59 (revisión humana:
 * Gonzalo se percibía "calvo o con línea de pelo demasiado retrasada").
 * No son golden pixel tests completos -- solo protegen la propiedad
 * concreta que motivó el ajuste: masa de pelo real en la parte superior
 * de la cabeza, no solo un contorno oscuro fino. "d"/"m" son los dos
 * únicos símbolos de pelo (ver GONZALO_PALETTE); "k"/"h"/"s" son piel.
 */
const HAIR_SYMBOLS = new Set(["d", "m"]);
const SKIN_SYMBOLS = new Set(["k", "h", "s"]);

function countSymbolsInRow(row, symbolSet) {
  return [...row].filter((symbol) => symbolSet.has(symbol)).length;
}

for (const [name, pixels] of Object.entries(VARIANTS)) {
  test(`${name}: la fila justo debajo del gorro superior (fila 2) es pelo, no piel -- la coronilla tiene masa real`, () => {
    const crownRow = pixels[2];

    assert.ok(
      countSymbolsInRow(crownRow, HAIR_SYMBOLS) > 0,
      `fila 2 de ${name} no tiene ningún pixel de pelo`,
    );
    assert.equal(
      countSymbolsInRow(crownRow, SKIN_SYMBOLS),
      0,
      `fila 2 de ${name} todavía muestra piel -- la línea de pelo no bajó`,
    );
  });

  test(`${name}: el pelo cubre más filas de la cabeza que la piel visible en la mitad superior (filas 0-4)`, () => {
    const upperHeadRows = pixels.slice(0, 5);
    const hairPixels = upperHeadRows.reduce(
      (total, row) => total + countSymbolsInRow(row, HAIR_SYMBOLS),
      0,
    );
    const skinPixels = upperHeadRows.reduce(
      (total, row) => total + countSymbolsInRow(row, SKIN_SYMBOLS),
      0,
    );

    assert.ok(
      hairPixels > skinPixels,
      `${name}: piel (${skinPixels}) domina sobre pelo (${hairPixels}) en la mitad superior de la cabeza`,
    );
  });
}
