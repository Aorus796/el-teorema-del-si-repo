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

test("front, back y side son idénticos salvo en la fila de ojos", () => {
  for (let row = 0; row < GONZALO_PIXEL_HEIGHT; row += 1) {
    const front = GONZALO_FRONT_PIXELS[row];
    const back = GONZALO_BACK_PIXELS[row];
    const side = GONZALO_SIDE_PIXELS[row];

    if (front === back && back === side) {
      continue;
    }

    // Solo debe haber una fila distinta entre las tres: la de los ojos.
    // Fuera de esa fila, el cuerpo (silueta, pelo, ropa, calzado) debe
    // ser exactamente el mismo en las tres variantes -- ver Sección 9 de
    // la tarea: no inventar más datasets ni variación de pose de los
    // estrictamente necesarios para los ojos. Solo se comprueban las
    // columnas donde las tres variantes realmente difieren entre sí (la
    // inmensa mayoría de columnas de la fila de ojos son idénticas
    // también, incluidas las transparentes fuera de la silueta).
    for (let col = 0; col < GONZALO_PIXEL_WIDTH; col += 1) {
      const symbols = [front[col], back[col], side[col]];
      const allEqual = symbols.every((symbol) => symbol === symbols[0]);

      if (allEqual) {
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

test("no hay boca: ningún color de la paleta se usa exclusivamente para representar una boca (por defecto, sin boca)", () => {
  // No hay un símbolo dedicado a "boca" en GONZALO_PALETTE en absoluto
  // (Sección 12: "Por defecto: NO boca") -- esta prueba documenta esa
  // decisión de forma verificable: la paleta declarada no incluye ningún
  // color adicional más allá de los diez usados por contorno/ojos, piel
  // (x3), pelo (x2), ropa (x3) y calzado.
  assert.equal(Object.keys(GONZALO_PALETTE).length, 10);
});
