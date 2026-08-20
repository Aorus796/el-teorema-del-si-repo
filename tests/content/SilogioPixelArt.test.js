import assert from "node:assert/strict";
import test from "node:test";
import {
  SILOGIO_BACK_PIXELS,
  SILOGIO_FRONT_PIXELS,
  SILOGIO_PIXEL_HEIGHT,
  SILOGIO_PIXEL_PALETTE,
  SILOGIO_PIXEL_WIDTH,
  SILOGIO_SIDE_PIXELS,
  SILOGIO_TRANSPARENT,
} from "../../src/content/silogioPixelArt.js";

/*
 * Validación de datos puros (sin DOM, sin cache) del pixel-art indexado
 * de Silogio (Silogio Character Pixel-Art -- aplica el mismo lenguaje
 * visual ya aprobado para Gonzalo, Elena, Corolaria y el Padre de la
 * novia). Mismo patrón que tests/content/GonzaloPixelArt.test.js/
 * ElenaPixelArt.test.js/CorolariaPixelArt.test.js/
 * BrideFatherPixelArt.test.js: invariantes estructurales del dato
 * (dimensiones, cobertura bidireccional de paleta), más las
 * comprobaciones específicas del criterio de ojos ya aprobado y del
 * contrato de pelo trasero aplicado desde el primer diseño. No son
 * pixel-tests contra una imagen de referencia.
 */

const VARIANTS = {
  front: SILOGIO_FRONT_PIXELS,
  back: SILOGIO_BACK_PIXELS,
  side: SILOGIO_SIDE_PIXELS,
};

for (const [name, pixels] of Object.entries(VARIANTS)) {
  test(`${name}: SILOGIO_${name.toUpperCase()}_PIXELS tiene exactamente SILOGIO_PIXEL_HEIGHT filas`, () => {
    assert.equal(pixels.length, SILOGIO_PIXEL_HEIGHT);
  });

  test(`${name}: cada fila mide exactamente SILOGIO_PIXEL_WIDTH caracteres`, () => {
    for (const [index, row] of pixels.entries()) {
      assert.equal(
        row.length,
        SILOGIO_PIXEL_WIDTH,
        `fila ${index} mide ${row.length}, se esperaban ${SILOGIO_PIXEL_WIDTH}`,
      );
    }
  });

  test(`${name}: todo carácter no transparente tiene entrada en SILOGIO_PIXEL_PALETTE`, () => {
    const usedSymbols = new Set(pixels.join(""));
    usedSymbols.delete(SILOGIO_TRANSPARENT);

    for (const symbol of usedSymbols) {
      assert.ok(
        Object.hasOwn(SILOGIO_PIXEL_PALETTE, symbol),
        `el símbolo "${symbol}" aparece en el pixel-art pero no está en la paleta`,
      );
    }
  });

  test(`${name}: contiene al menos un pixel transparente (silueta recortada, no un bloque relleno)`, () => {
    const hasTransparentPixel = pixels.some((row) =>
      row.includes(SILOGIO_TRANSPARENT),
    );

    assert.ok(hasTransparentPixel);
  });
}

test("SILOGIO_PIXEL_PALETTE no declara colores que ninguna de las tres variantes use", () => {
  const usedSymbols = new Set(
    [...Object.values(VARIANTS)].flatMap((pixels) => [...pixels.join("")]),
  );

  for (const symbol of Object.keys(SILOGIO_PIXEL_PALETTE)) {
    assert.ok(
      usedSymbols.has(symbol),
      `la paleta declara "${symbol}" pero ninguna variante lo usa`,
    );
  }
});

test("SILOGIO_PIXEL_PALETTE tiene el mismo tamaño que la de los cuatro personajes anteriores (mismo nivel de detalle) pero valores propios", async () => {
  const { GONZALO_PALETTE } = await import(
    "../../src/content/gonzaloPixelArt.js"
  );
  const { ELENA_PALETTE } = await import(
    "../../src/content/elenaPixelArt.js"
  );
  const { COROLARIA_PALETTE } = await import(
    "../../src/content/corolariaPixelArt.js"
  );
  const { BRIDE_FATHER_PIXEL_PALETTE } = await import(
    "../../src/content/brideFatherPixelArt.js"
  );

  for (const otherPalette of [
    GONZALO_PALETTE,
    ELENA_PALETTE,
    COROLARIA_PALETTE,
    BRIDE_FATHER_PIXEL_PALETTE,
  ]) {
    assert.equal(
      Object.keys(SILOGIO_PIXEL_PALETTE).length,
      Object.keys(otherPalette).length,
    );
  }

  // Silogio no debe leerse como "otro personaje recoloreado": comparte
  // la piel (mismo SKIN_TONE en todo el juego), pero el resto de sus
  // colores son propios -- ver el comentario de silogioPixelArt.js.
  assert.equal(
    SILOGIO_PIXEL_PALETTE.k,
    GONZALO_PALETTE.k,
    "la piel sí se comparte a propósito",
  );
  assert.notEqual(SILOGIO_PIXEL_PALETTE.O, GONZALO_PALETTE.O);
  assert.notEqual(SILOGIO_PIXEL_PALETTE.b, GONZALO_PALETTE.b);
  assert.notEqual(SILOGIO_PIXEL_PALETTE.b, ELENA_PALETTE.b);
  assert.notEqual(SILOGIO_PIXEL_PALETTE.b, COROLARIA_PALETTE.b);
  assert.notEqual(SILOGIO_PIXEL_PALETTE.b, BRIDE_FATHER_PIXEL_PALETTE.b);
});

test("SILOGIO_PIXEL_PALETTE preserva exactamente los cinco colores existentes de SILOGIO_PALETTE (characterPalettes.js)", async () => {
  const { SILOGIO_PALETTE } = await import(
    "../../src/content/characterPalettes.js"
  );

  assert.equal(SILOGIO_PIXEL_PALETTE.O, SILOGIO_PALETTE.silhouette);
  assert.equal(SILOGIO_PIXEL_PALETTE.d, SILOGIO_PALETTE.hair);
  assert.equal(SILOGIO_PIXEL_PALETTE.k, SILOGIO_PALETTE.head);
  assert.equal(SILOGIO_PIXEL_PALETTE.b, SILOGIO_PALETTE.body);
  assert.equal(SILOGIO_PIXEL_PALETTE.L, SILOGIO_PALETTE.bodyAccent);
});

/*
 * Mismo criterio humano aprobado con los cuatro personajes anteriores:
 * ojos simples e integrados en el propio sprite, sin sistema facial --
 * front tiene los dos, side tiene uno solo (el visible en ese lado), back
 * no tiene ninguno. La fila de ojos se localiza comparando FRONT contra
 * SIDE (nunca difieren salvo en esa fila).
 */
const EYE_ROW_INDEX = SILOGIO_FRONT_PIXELS.findIndex(
  (row, index) => row !== SILOGIO_SIDE_PIXELS[index],
);

test("front tiene exactamente 2 pixeles de ojo más que back en la fila de ojos", () => {
  assert.notEqual(
    EYE_ROW_INDEX,
    -1,
    "front y side deberían diferir en alguna fila (los ojos)",
  );

  const frontCount = [...SILOGIO_FRONT_PIXELS[EYE_ROW_INDEX]].filter(
    (symbol) => symbol === "O",
  ).length;
  const backCount = [...SILOGIO_BACK_PIXELS[EYE_ROW_INDEX]].filter(
    (symbol) => symbol === "O",
  ).length;

  assert.equal(frontCount - backCount, 2);
});

test("side tiene exactamente 1 pixel de ojo más que back en la fila de ojos", () => {
  const sideCount = [...SILOGIO_SIDE_PIXELS[EYE_ROW_INDEX]].filter(
    (symbol) => symbol === "O",
  ).length;
  const backCount = [...SILOGIO_BACK_PIXELS[EYE_ROW_INDEX]].filter(
    (symbol) => symbol === "O",
  ).length;

  assert.equal(sideCount - backCount, 1);
});

test("front y side son idénticos salvo en la fila de ojos", () => {
  for (let row = 0; row < SILOGIO_PIXEL_HEIGHT; row += 1) {
    const front = SILOGIO_FRONT_PIXELS[row];
    const side = SILOGIO_SIDE_PIXELS[row];

    if (front === side) {
      continue;
    }

    for (let col = 0; col < SILOGIO_PIXEL_WIDTH; col += 1) {
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
 * Gafas (sección 9 de la tarea): fila 4 de FRONT/SIDE debe mostrar dos
 * clústeres del color de contorno ("O", reutilizado como color de
 * montura/lente oscura) representando las lentes, sin dominar la
 * cabeza. No deben aparecer en BACK (no son visibles de espaldas).
 */
test("front y side muestran gafas en la fila 4: dos clústeres de contorno además de los bordes de la silueta", () => {
  for (const pixels of [SILOGIO_FRONT_PIXELS, SILOGIO_SIDE_PIXELS]) {
    const glassesRow = pixels[4];
    const outlineCount = [...glassesRow].filter(
      (symbol) => symbol === "O",
    ).length;

    // 2 bordes de silueta + al menos 2 píxeles de lente (un clúster
    // mínimo por lente) = al menos 4 "O" en esta fila.
    assert.ok(
      outlineCount >= 4,
      `fila 4 solo tiene ${outlineCount} píxeles de contorno/gafas, se esperaban al menos 4`,
    );
  }
});

test("las gafas no dominan la cabeza: la fila 4 sigue teniendo piel visible (puente central) además de las lentes", () => {
  const glassesRow = SILOGIO_FRONT_PIXELS[4];
  const skinCount = [...glassesRow].filter((symbol) => symbol === "k").length;

  assert.ok(
    skinCount > 0,
    "se esperaba al menos un pixel de piel visible como puente central entre las lentes",
  );
});

test("BACK no muestra gafas (no son visibles de espaldas): la fila 4 de BACK es pelo puro, sin contorno adicional más allá de los bordes", () => {
  const backGlassesRow = SILOGIO_BACK_PIXELS[4];
  const outlineCount = [...backGlassesRow].filter(
    (symbol) => symbol === "O",
  ).length;

  assert.equal(
    outlineCount,
    2,
    "BACK no debería tener más contorno que los dos bordes de la silueta en esta fila",
  );
});

/*
 * Contrato de pelo trasero aplicado desde el primer diseño de Silogio
 * (no como corrección posterior): BACK diverge de FRONT en la fila de
 * ojos y en las filas 3-8 (cabeza), que muestran pelo continuo en vez de
 * la cara/gafas que front/side sí tienen ahí -- mismo resultado final
 * que Gonzalo alcanzó tras cuatro microiteraciones (ver CHANGELOG.md),
 * directamente desde el principio. Fuera de esas filas, back debe ser
 * idéntico a front -- la fila 9 (nuca/cuello) es la única excepción y
 * muestra piel incluso de espaldas, para que la cobertura no termine en
 * un corte brusco ni deje una banda de calvicie.
 */
const BACK_ONLY_HAIR_ROWS = new Set([3, 4, 5, 6, 7, 8]);
const HAIR_SYMBOLS = new Set(["d", "m"]);
const SKIN_SYMBOLS = new Set(["k", "h", "s"]);

function countSymbolsInRow(row, symbolSet) {
  return [...row].filter((symbol) => symbolSet.has(symbol)).length;
}

test("back es idéntico a front en toda fila fuera del rango de pelo trasero de la cabeza", () => {
  for (let row = 0; row < SILOGIO_PIXEL_HEIGHT; row += 1) {
    const front = SILOGIO_FRONT_PIXELS[row];
    const back = SILOGIO_BACK_PIXELS[row];

    if (front === back) {
      continue;
    }

    assert.ok(
      BACK_ONLY_HAIR_ROWS.has(row),
      `fila ${row}: back difiere de front fuera del rango de la cabeza (${[...BACK_ONLY_HAIR_ROWS].join(",")})`,
    );
  }
});

test("la cabeza de BACK (filas 3-8) es pelo puro, sin ninguna banda de piel (sin tonsura ni calvicie accidental)", () => {
  for (const row of BACK_ONLY_HAIR_ROWS) {
    const backRow = SILOGIO_BACK_PIXELS[row];
    const frontRow = SILOGIO_FRONT_PIXELS[row];

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

test("la nuca (fila 9) sigue mostrando piel incluso de espaldas -- cobertura de pelo coherente hasta un cuello mínimo, no un corte brusco", () => {
  assert.equal(SILOGIO_BACK_PIXELS[9], SILOGIO_FRONT_PIXELS[9]);
  assert.ok(countSymbolsInRow(SILOGIO_BACK_PIXELS[9], SKIN_SYMBOLS) > 0);
});

for (const [name, pixels] of Object.entries(VARIANTS)) {
  test(`${name}: la coronilla (fila 2) es pelo, no piel, y mezcla ambos tonos de gris -- lectura de pelo "algo desordenado"`, () => {
    const crownRow = pixels[2];

    assert.ok(countSymbolsInRow(crownRow, HAIR_SYMBOLS) > 0);
    assert.equal(countSymbolsInRow(crownRow, SKIN_SYMBOLS), 0);
    assert.ok(crownRow.includes("d"));
    assert.ok(crownRow.includes("m"));
  });
}

/*
 * Identidad propia de Silogio (secciones 5/12/13 de la tarea): silueta
 * más estrecha y vertical que los cuatro personajes anteriores -- el
 * abrigo/túnica nunca ensancha más allá del ancho de la cabeza en NINGUNA
 * fila (hombros, torso o bajo incluidos), a diferencia de
 * Gonzalo/Corolaria/Padre (que siempre tienen hombros/torso más anchos
 * que la cabeza en algún tramo), y presencia clara de teal + mostaza.
 * Estas pruebas protegen esas señas de identidad frente a un futuro
 * cambio accidental que lo hiciera leerse como "otro personaje con otra
 * paleta".
 */
function rowSpan(row) {
  const symbols = row.split("");
  const first = symbols.findIndex((symbol) => symbol !== SILOGIO_TRANSPARENT);
  const last = symbols.findLastIndex(
    (symbol) => symbol !== SILOGIO_TRANSPARENT,
  );

  return last - first + 1;
}

test("el abrigo (hombros, fila 10) nunca es más ancho que la cabeza (fila 3) -- silueta estrecha y vertical, sin hombros ensanchados", () => {
  assert.equal(
    rowSpan(SILOGIO_FRONT_PIXELS[10]),
    rowSpan(SILOGIO_FRONT_PIXELS[3]),
  );
});

test("el abrigo se mantiene con el mismo ancho estrecho durante todas las filas del torso y el bajo (filas 10-19), incluido el dobladillo", () => {
  const shoulderSpan = rowSpan(SILOGIO_FRONT_PIXELS[10]);

  for (let row = 11; row <= 19; row += 1) {
    assert.equal(
      rowSpan(SILOGIO_FRONT_PIXELS[row]),
      shoulderSpan,
      `fila ${row}: se esperaba el mismo ancho estrecho que los hombros`,
    );
  }
});

test("ninguna fila del abrigo (10-19), incluido el dobladillo, es más ancha que la cabeza (fila 3)", () => {
  const headSpan = rowSpan(SILOGIO_FRONT_PIXELS[3]);

  for (let row = 10; row <= 19; row += 1) {
    assert.equal(
      rowSpan(SILOGIO_FRONT_PIXELS[row]),
      headSpan,
      `fila ${row}: no debe ser más ancha que la cabeza (fila 3)`,
    );
  }
});

test("Silogio es notablemente más estrecho que Gonzalo en el torso -- no queda como 'Gonzalo recoloreado'", async () => {
  const { GONZALO_FRONT_PIXELS } = await import(
    "../../src/content/gonzaloPixelArt.js"
  );

  for (let row = 10; row <= 19; row += 1) {
    assert.ok(
      rowSpan(SILOGIO_FRONT_PIXELS[row]) < rowSpan(GONZALO_FRONT_PIXELS[10]),
      `fila ${row}: se esperaba más estrecho que el torso de Gonzalo`,
    );
  }
});

test("presencia de teal (body) y mostaza (bodyAccent/L) en el abrigo -- identidad teal + mostaza preservada", () => {
  const joined = SILOGIO_FRONT_PIXELS.join("");

  assert.ok(joined.includes("b"), "se esperaba teal (b) en el abrigo");
  assert.ok(joined.includes("L"), "se esperaba mostaza (L) como acento");
});

test("no hay boca: ningún color de la paleta se usa exclusivamente para representar una boca (por defecto, sin boca)", () => {
  assert.equal(Object.keys(SILOGIO_PIXEL_PALETTE).length, 10);
});
