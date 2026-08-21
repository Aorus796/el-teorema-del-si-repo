import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_PIXEL_HEIGHT,
  MAX_PIXEL_PALETTE,
  MAX_PIXEL_WIDTH,
  MAX_SIDE_PIXELS,
  MAX_TRANSPARENT,
} from "../../src/content/maxPixelArt.js";

/*
 * Validación de datos puros (sin DOM, sin cache) del pixel-art indexado
 * de Max (Max Character Pixel-Art -- mismo nivel de calidad que los
 * personajes humanos ya aprobados, sin copiar su arquitectura visual:
 * una sola variante de pose, no front/back/side). Mismo patrón que
 * tests/content/GonzaloPixelArt.test.js y equivalentes: invariantes
 * estructurales del dato. No son pixel-tests contra una imagen de
 * referencia.
 */

test("MAX_SIDE_PIXELS tiene exactamente MAX_PIXEL_HEIGHT filas", () => {
  assert.equal(MAX_SIDE_PIXELS.length, MAX_PIXEL_HEIGHT);
});

test("cada fila mide exactamente MAX_PIXEL_WIDTH caracteres", () => {
  for (const [index, row] of MAX_SIDE_PIXELS.entries()) {
    assert.equal(
      row.length,
      MAX_PIXEL_WIDTH,
      `fila ${index} mide ${row.length}, se esperaban ${MAX_PIXEL_WIDTH}`,
    );
  }
});

test("todo carácter no transparente tiene entrada en MAX_PIXEL_PALETTE", () => {
  const usedSymbols = new Set(MAX_SIDE_PIXELS.join(""));
  usedSymbols.delete(MAX_TRANSPARENT);

  for (const symbol of usedSymbols) {
    assert.ok(
      Object.hasOwn(MAX_PIXEL_PALETTE, symbol),
      `el símbolo "${symbol}" aparece en el pixel-art pero no está en la paleta`,
    );
  }
});

test("MAX_PIXEL_PALETTE no declara colores que el sprite no use", () => {
  const usedSymbols = new Set(MAX_SIDE_PIXELS.join(""));

  for (const symbol of Object.keys(MAX_PIXEL_PALETTE)) {
    assert.ok(
      usedSymbols.has(symbol),
      `la paleta declara "${symbol}" pero el sprite no lo usa`,
    );
  }
});

test("contiene al menos un pixel transparente (silueta recortada, no un bloque relleno)", () => {
  const hasTransparentPixel = MAX_SIDE_PIXELS.some((row) =>
    row.includes(MAX_TRANSPARENT),
  );

  assert.ok(hasTransparentPixel);
});

test("MAX_PIXEL_PALETTE preserva exactamente los dos colores existentes de MAX_PALETTE (characterPalettes.js) que sí se usaban", async () => {
  const { MAX_PALETTE } = await import(
    "../../src/content/characterPalettes.js"
  );

  assert.equal(MAX_PIXEL_PALETTE.k, MAX_PALETTE.mask);
  assert.equal(MAX_PIXEL_PALETTE.b, MAX_PALETTE.body);
});

test("MAX_PIXEL_PALETTE no comparte ningún valor con MAX_PALETTE.collar -- Max nunca lleva collar", async () => {
  const { MAX_PALETTE } = await import(
    "../../src/content/characterPalettes.js"
  );

  const paletteValues = new Set(Object.values(MAX_PIXEL_PALETTE));

  assert.equal(paletteValues.has(MAX_PALETTE.collar), false);
});

/*
 * Ojos: Max solo tiene una vista (lateral), así que el criterio
 * aplicable es "1 ojo visible" -- no hay front/back contra los que
 * diferenciar por fila, a diferencia de los personajes humanos. Se
 * ancla a la posición exacta del ojo (fila 5, columna 3, embebido en
 * la máscara -- desplazado de la fila 4 a la 5 en la ronda que añadió
 * una fila de frente entre el cráneo y el ojo para dar más altura
 * vertical a la cabeza), que debe ser el color de contorno ("O",
 * reutilizado para ojo, mismo patrón que los personajes humanos y sin
 * blanco -- ver el comentario de cabecera de maxPixelArt.js sobre por
 * qué no se añade el reflejo claro que sí muestra el mockup).
 */
test("el ojo (fila 5, columna 3) usa el color de contorno, sin blanco ni pupila compleja", () => {
  assert.equal(MAX_SIDE_PIXELS[5][3], "O");
});

test("la nariz (fila 6, columna 0) usa el color de contorno, en la punta del hocico", () => {
  assert.equal(MAX_SIDE_PIXELS[6][0], "O");
});

/*
 * Cabeza y hocico: el hocico debe ser notablemente más estrecho que el
 * cráneo -- se compara el ancho (span) de la fila de cráneo (fila 3,
 * la masa craneal) contra el ancho del relleno de máscara ("k") en las
 * filas de hocico (5-6, comprimido de 3 a 2 filas en la ronda que ganó
 * una fila de frente), en vez de fijar columnas exactas, para no
 * proteger una silueta concreta más de lo necesario.
 */
function rowSpan(row) {
  const chars = [...row];
  const first = chars.findIndex((c) => c !== MAX_TRANSPARENT);
  const last = chars
    .map((c, i) => (c !== MAX_TRANSPARENT ? i : -1))
    .filter((i) => i >= 0)
    .pop();

  return last - first + 1;
}

test("el hocico (relleno de máscara \"k\" en filas 5-6) es más estrecho que el cráneo (fila 3)", () => {
  function symbolSpan(row, symbols) {
    const chars = [...row];
    const indexes = chars
      .map((c, i) => (symbols.has(c) ? i : -1))
      .filter((i) => i >= 0);

    return indexes.length === 0 ? 0 : indexes[indexes.length - 1] - indexes[0] + 1;
  }

  const skullSpan = symbolSpan(MAX_SIDE_PIXELS[3], new Set(["b", "h"]));
  const muzzleRows = MAX_SIDE_PIXELS.slice(5, 7);
  const muzzleSpan = Math.max(...muzzleRows.map((row) => symbolSpan(row, new Set(["k"]))));

  assert.ok(
    muzzleSpan < skullSpan,
    `hocico (${muzzleSpan}) debería ser más estrecho que el cráneo (${skullSpan})`,
  );
});

test("la región de la cabeza (filas 0-6) no es más ancha en su conjunto que el torso (filas 7-12, excluyendo el resto de contorno del hocico en columnas 0-3) -- cabeza compacta, no desproporcionada", () => {
  // Restringido a las columnas 0-12 (cráneo/orejas/hocico, ensanchado
  // en la ronda de convergencia con el mockup): en las filas 0-6
  // también pasa la raíz de la cola (columnas 18-21), una región
  // anatómica distinta que no debe contar como "ancho de cabeza" solo
  // por compartir rango de filas. El torso se restringe a columnas
  // 4-21: la fila de cuello (fila 7) conserva un resto de contorno del
  // hocico en columnas 0-2 (donde el hocico termina justo encima), que
  // si se incluyera haría que el span del torso llegara trivialmente a
  // 22 sin decir nada real sobre el ancho del cuerpo.
  const headRows = MAX_SIDE_PIXELS.slice(0, 7).map((row) => row.slice(0, 13));
  const torsoRows = MAX_SIDE_PIXELS.slice(7, 13).map((row) => row.slice(4));
  const headSpan = Math.max(...headRows.map(rowSpan));
  const torsoSpan = Math.max(...torsoRows.map(rowSpan));

  assert.ok(
    headSpan <= torsoSpan,
    `cabeza (${headSpan}) no debería ser más ancha que el torso (${torsoSpan})`,
  );
});

test("la cabeza ocupa más superficie (píxeles rellenos en cols 0-10) que en la versión anterior (commit e63dc1f)", () => {
  // Snapshot literal de MAX_SIDE_PIXELS[0..4] en e63dc1f (la versión que
  // la revisión humana rechazó por "cabeza demasiado pequeña para el
  // conjunto"), usado solo como referencia de comparación -- no es la
  // fuente del dato actual, que sigue siendo el propio MAX_SIDE_PIXELS.
  const PREVIOUS_HEAD_ROWS = [
    "...Ok...dO.",
    "..OkhhbdbO.",
    ".OOOObbbbO.",
    "OkkkbbbbO..",
    "OkkOOOOOO..",
  ];
  const countFilled = (rows) =>
    rows.join("").split("").filter((c) => c !== MAX_TRANSPARENT).length;

  const previousHeadFill = countFilled(PREVIOUS_HEAD_ROWS);
  const currentHeadFill = countFilled(
    MAX_SIDE_PIXELS.slice(0, 7).map((row) => row.slice(0, 13)),
  );

  assert.ok(
    currentHeadFill > previousHeadFill,
    `cabeza actual (${currentHeadFill} px) debería ocupar más superficie que la anterior (${previousHeadFill} px)`,
  );
});

test("la cabeza ocupa más superficie que en la versión anterior a este rediseño de cabeza (commit 444ee1f)", () => {
  // Snapshot literal de MAX_SIDE_PIXELS[0..5] en 444ee1f (la versión que
  // la revisión humana rechazó por "cabeza fea, poca masa"), usado solo
  // como referencia de comparación.
  const PREVIOUS_HEAD_ROWS = [
    ".Ok.....dO.",
    "OkkbbbbdddO",
    "ObbhOhbbbbO",
    "OkkkkObbbO.",
    "kkkkObbbO..",
    "OkkO.OOO...",
  ];
  const countFilled = (rows) =>
    rows.join("").split("").filter((c) => c !== MAX_TRANSPARENT).length;

  const previousHeadFill = countFilled(PREVIOUS_HEAD_ROWS);
  const currentHeadFill = countFilled(
    MAX_SIDE_PIXELS.slice(0, 7).map((row) => row.slice(0, 13)),
  );

  assert.ok(
    currentHeadFill > previousHeadFill,
    `cabeza actual (${currentHeadFill} px) debería ocupar más superficie que la versión anterior a este rediseño (${previousHeadFill} px)`,
  );
});

test("la cabeza ocupa más superficie que en la versión anterior a la convergencia con el mockup (commit 3353f43)", () => {
  // Snapshot literal de MAX_SIDE_PIXELS[0..6] en 3353f43 (la versión
  // previa a adjuntar la mockup de referencia), en la ventana de
  // columnas 0-10 que tenía esa versión -- comparado contra la
  // superficie actual en la ventana ensanchada 0-12, que es la fuente
  // real del dato tras esta ronda.
  const PREVIOUS_HEAD_ROWS = [
    ".Oh......O.",
    "Ohhhh....dO",
    ".OOObhbOddd",
    "ObbhhhhbbbO",
    "OkkkObbbbO.",
    "kkkkObbbO..",
    "OkkOObbbO..",
  ];
  const countFilled = (rows) =>
    rows.join("").split("").filter((c) => c !== MAX_TRANSPARENT).length;

  const previousHeadFill = countFilled(PREVIOUS_HEAD_ROWS);
  const currentHeadFill = countFilled(
    MAX_SIDE_PIXELS.slice(0, 7).map((row) => row.slice(0, 13)),
  );

  assert.ok(
    currentHeadFill > previousHeadFill,
    `cabeza actual (${currentHeadFill} px) debería ocupar más superficie que la versión previa a la mockup (${previousHeadFill} px)`,
  );
});

/*
 * Separación hocico/orejas (petición humana explícita de una ronda
 * anterior, protegida desde entonces): debe existir al menos una fila,
 * además de la fila de las puntas de las orejas, que contenga tejido
 * de oreja (h/d) pero ningún tejido de cráneo (b) ni de hocico -- un
 * "colchón" de aire visual entre la zona de las orejas y la zona donde
 * empieza la masa de cráneo/hocico, en vez de que ambas zonas se
 * toquen en la fila siguiente a las puntas. Se usa "b" (no "h") como
 * señal de cráneo: esta ronda cambió el tono de la oreja cercana de
 * "k" a "h" para ganar contraste, y "h" es también el tono de
 * highlight de la coronilla -- comprobar "h" como señal de cráneo
 * daría un falso negativo en la propia fila de la oreja. "b" (el
 * relleno base del cráneo) no se reutiliza en ninguna oreja, así que
 * sigue siendo una señal inequívoca.
 */
test("hay al menos una fila de solo-orejas (h/d, sin cráneo b), ADEMÁS de la fila de las puntas, entre las puntas de las orejas y la masa de cráneo", () => {
  // La fila 0 (puntas de las orejas) satisface "tiene h/d, no tiene b"
  // por construcción en cualquier diseño con puntas de oreja aisladas.
  // Para proteger de verdad el colchón de aire, hay que excluir la
  // fila 0 y buscar la condición en las filas siguientes, donde antes
  // empezaba directamente la masa de cráneo.
  const earOnlyRow = MAX_SIDE_PIXELS.slice(1, 3).find((row) => {
    const chars = [...row];
    const hasEarTissue = chars.some((c) => c === "h" || c === "d");
    const hasSkullTissue = chars.some((c) => c === "b");
    return hasEarTissue && !hasSkullTissue;
  });

  assert.ok(
    earOnlyRow !== undefined,
    "se esperaba al menos una fila, aparte de la fila 0, con tejido de oreja pero sin tejido de cráneo, dando separación visual real",
  );
});

/*
 * Máscara facial (sección 6): debe existir como rasgo diferenciado
 * (color "k") sin convertir toda la cabeza en un bloque negro -- debe
 * coexistir con tan ("b"/"h") en la región de la cabeza (coronilla y
 * mejilla posterior deben seguir en tan).
 */
test("la máscara facial (símbolo k) está presente en la región de la cabeza", () => {
  const headRows = MAX_SIDE_PIXELS.slice(0, 7);
  const maskCount = headRows.join("").split("").filter((c) => c === "k").length;

  assert.ok(maskCount > 0, "se esperaba al menos un pixel de máscara en la cabeza");
});

test("la máscara no ocupa toda la cabeza: hay tan (b/h) visible junto a la máscara", () => {
  const headRows = MAX_SIDE_PIXELS.slice(0, 7);
  const joined = headRows.join("");
  const tanCount = [...joined].filter((c) => c === "b" || c === "h").length;

  assert.ok(
    tanCount > 0,
    "se esperaba tan visible en la cabeza, además de la máscara",
  );
});

/*
 * Cráneo con masa entre las orejas (petición humana explícita de esta
 * ronda: "masa central más alta... coronilla compacta... cabeza con
 * volumen", no "barra horizontal con orejas"): debe haber una fila,
 * justo debajo de donde terminan las orejas, con un tramo contiguo
 * ancho de tejido de cráneo (b/h) -- no solo un par de píxeles
 * simbólicos. No se fija un ancho exacto para no proteger una silueta
 * concreta, solo un mínimo razonable que distinga "masa" de "línea".
 */
test("hay una fila con un tramo contiguo ancho (al menos 5 columnas) de cráneo (b/h) entre las orejas y el hocico", () => {
  function longestRun(row, symbols) {
    const chars = [...row];
    let longest = 0;
    let current = 0;
    for (const c of chars) {
      if (symbols.has(c)) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }
    return longest;
  }

  const skullSymbols = new Set(["b", "h"]);
  const headRows = MAX_SIDE_PIXELS.slice(0, 7);
  const maxRun = Math.max(...headRows.map((row) => longestRun(row, skullSymbols)));

  assert.ok(
    maxRun >= 5,
    `se esperaba un tramo contiguo de al menos 5 columnas de cráneo, el más largo encontrado mide ${maxRun}`,
  );
});

/*
 * Altura de cabeza / frente (petición humana explícita de esta ronda:
 * "la cabeza tiene muy poca altura... apenas existe frente... hocico y
 * orejas están demasiado cerca verticalmente"): se protegen tres
 * propiedades distintas de la separación horizontal ya protegida más
 * arriba. "Fila de cráneo/frente" = fila con tejido b/h pero SIN tejido
 * de máscara k (así se excluyen las filas de hocico, que también llevan
 * algo de "b" en las mejillas). Comparadas contra un snapshot literal de
 * las filas 3-6 de la versión anterior (commit 3ae4209, la que el
 * humano rechazó por falta de altura), no contra el propio dato actual,
 * para que el test falle de verdad si el diseño no gana altura real.
 */
function craniumRowCount(rows) {
  return rows.filter((row) => {
    const chars = [...row];
    const hasCranium = chars.some((c) => c === "b" || c === "h");
    const hasMuzzle = chars.some((c) => c === "k");
    return hasCranium && !hasMuzzle;
  }).length;
}

const PREVIOUS_SKULL_TO_MUZZLE_ROWS_3AE4209 = [
  "ObbbhhhbbbO........OmO",
  "kkkOkkbbbO........OddO",
  "kkkkkObbO.........OddO",
  "OkkkObbO..........OddO",
];

test("la cabeza tiene más filas de cráneo/frente (tejido b/h sin máscara) que en la versión anterior (commit 3ae4209) -- más altura vertical", () => {
  const previousCount = craniumRowCount(PREVIOUS_SKULL_TO_MUZZLE_ROWS_3AE4209);
  const currentCount = craniumRowCount(MAX_SIDE_PIXELS.slice(3, 7));

  assert.ok(
    currentCount > previousCount,
    `filas de cráneo/frente actuales (${currentCount}) deberían ser más que en la versión anterior (${previousCount})`,
  );
});

test("existe una fila de frente (cráneo b/h, sin máscara) inmediatamente encima de la fila del ojo, distinta de la fila del cráneo (fila 3) -- no solo el cráneo ya pegado al ojo, como en la versión anterior (commit 3ae4209)", () => {
  // No basta con comprobar "hay cráneo sin máscara justo encima del
  // ojo": en 3ae4209 esa condición ya se cumplía trivialmente, porque el
  // cráneo (fila 3) estaba directamente pegado a la máscara/ojo sin
  // ninguna fila de frente entre medias -- ese test pasaría igual contra
  // el diseño que el humano rechazó por falta de frente. Se exige además
  // que esa fila NO sea la propia fila del cráneo (fila 3), es decir,
  // que exista una fila de frente independiente y adicional.
  const eyeRowIndex = MAX_SIDE_PIXELS.findIndex((row) => row[3] === "O");
  const foreheadRowIndex = eyeRowIndex - 1;
  const foreheadRow = MAX_SIDE_PIXELS[foreheadRowIndex];
  const chars = [...foreheadRow];

  const hasCranium = chars.some((c) => c === "b" || c === "h");
  const hasMuzzle = chars.some((c) => c === "k");
  const isSkullRowItself = foreheadRowIndex === 3;

  assert.ok(
    hasCranium && !hasMuzzle && !isSkullRowItself,
    `se esperaba una fila de frente propia (cráneo sin máscara, distinta de la fila 3 del cráneo) justo encima de la fila del ojo (fila ${eyeRowIndex}), pero la fila ${foreheadRowIndex} es "${foreheadRow}"`,
  );
});

test("la distancia vertical entre el final de las orejas y el inicio del hocico (máscara k) es mayor que en la versión anterior (commit 3ae4209)", () => {
  function firstMuzzleRowOffset(rows) {
    return rows.findIndex((row) => row.includes("k"));
  }

  const previousOffset = firstMuzzleRowOffset(PREVIOUS_SKULL_TO_MUZZLE_ROWS_3AE4209);
  const currentOffset = firstMuzzleRowOffset(MAX_SIDE_PIXELS.slice(3, 7));

  assert.ok(
    currentOffset > previousOffset,
    `distancia actual (${currentOffset} filas tras el cráneo) debería ser mayor que la anterior (${previousOffset})`,
  );
});

/*
 * Orejas (sección 5): dos formas triangulares erguidas por encima del
 * cráneo (filas superiores), separadas por un hueco transparente real
 * (no solo por tono) -- la oreja cercana usa "h" (tan claro, cambiado
 * desde "k" en una ronda anterior para ganar contraste contra el
 * contorno) y la lejana "d", con al menos una columna totalmente
 * transparente entre ambas en su fila más estrecha. Se restringe la
 * comprobación a las columnas 0-12 (zona de la cabeza, ensanchada en
 * la ronda de convergencia con el mockup) para no confundir el hueco
 * entre orejas con el hueco entre el cuerpo y la cola, que vive en
 * columnas mucho más a la derecha.
 */
function countFilledSegments(row, windowStart, windowEnd) {
  const cols = [...row.slice(windowStart, windowEnd)];
  let segments = 0;
  let previousFilled = false;

  for (const symbol of cols) {
    const filled = symbol !== MAX_TRANSPARENT;
    if (filled && !previousFilled) {
      segments += 1;
    }
    previousFilled = filled;
  }

  return segments;
}

test("hay dos orejas separadas por un hueco transparente real en las filas superiores (filas 0-1, columnas 0-12)", () => {
  const headWindow = 13;
  const hasGapRow = MAX_SIDE_PIXELS.slice(0, 2).some(
    (row) => countFilledSegments(row, 0, headWindow) >= 2,
  );

  assert.ok(
    hasGapRow,
    "se esperaba al menos una fila con dos tramos de oreja separados por un hueco transparente",
  );
});

test("la oreja cercana (h) y la oreja lejana (d) son tonalmente distintas", () => {
  const earRows = MAX_SIDE_PIXELS.slice(0, 3).join("");

  assert.ok(earRows.includes("h"), "se esperaba la oreja cercana (h)");
  assert.ok(earRows.includes("d"), "se esperaba la oreja lejana (d)");
});

/*
 * Separación horizontal entre orejas (petición humana explícita de
 * esta ronda: "reducir claramente la separación horizontal... no
 * parecer dos protuberancias en extremos opuestos"): se mide el hueco
 * transparente entre los dos tramos de oreja en cada una de las tres
 * filas donde viven, y se compara contra el mismo cálculo aplicado a
 * un snapshot literal de la versión anterior (commit 2390783, la que
 * `qa` rechazó por "franja plana" entre orejas demasiado separadas).
 * No se fija un ancho de hueco exacto -- solo que sea estrictamente
 * menor que antes en las tres filas, que es la petición literal.
 */
test("el hueco horizontal entre orejas es más estrecho, en las tres filas, que en la versión anterior (commit 2390783)", () => {
  function gapWidth(row) {
    const chars = [...row];
    const filledIndexes = chars
      .map((c, i) => (c !== MAX_TRANSPARENT ? i : -1))
      .filter((i) => i >= 0);
    // Hueco = tramo de columnas transparentes entre el final del primer
    // grupo relleno y el inicio del segundo, dentro de la zona de
    // orejas (antes de que aparezca cualquier otro relleno más a la
    // derecha, p. ej. la cola).
    const earZone = chars.slice(0, 12);
    const earFilled = earZone
      .map((c, i) => (c !== MAX_TRANSPARENT ? i : -1))
      .filter((i) => i >= 0);
    let firstGapStart = -1;
    let firstGapEnd = -1;
    for (let i = 1; i < earFilled.length; i += 1) {
      if (earFilled[i] - earFilled[i - 1] > 1) {
        firstGapStart = earFilled[i - 1] + 1;
        firstGapEnd = earFilled[i] - 1;
        break;
      }
    }
    return firstGapStart === -1 ? 0 : firstGapEnd - firstGapStart + 1;
  }

  const PREVIOUS_EAR_ROWS = [
    "..Oh......dO..........",
    ".Ohhh....dddO.........",
    "Ohhhhh..dddddO......O.",
  ];

  const currentGaps = MAX_SIDE_PIXELS.slice(0, 3).map(gapWidth);
  const previousGaps = PREVIOUS_EAR_ROWS.map(gapWidth);

  currentGaps.forEach((gap, i) => {
    assert.ok(
      gap < previousGaps[i],
      `fila ${i}: hueco actual (${gap}) debería ser más estrecho que el anterior (${previousGaps[i]})`,
    );
  });
});

/*
 * Forma triangular de las orejas (hallazgo explícito de `qa` en un
 * intento anterior de esta misma ronda): un salto de solo dos niveles
 * de ancho -- una punta de 1 columna directamente a una base de 4-5 --
 * traza, una vez con contorno, una cruz o una T, no un triángulo. Se
 * protege que cada oreja tenga al menos tres niveles de ancho
 * estrictamente crecientes a lo largo de sus primeras tres filas (el
 * contorno "O" que bordea la propia oreja cuenta como parte de su
 * ancho, igual que lo vería el ojo). No se fija una progresión
 * numérica exacta (p. ej. "1, 3, 5") para no proteger una silueta
 * concreta más de lo necesario -- solo que exista una progresión
 * creciente real, que es lo que distingue un triángulo de un bloque.
 */
test("cada oreja tiene al menos tres niveles de ancho estrictamente crecientes en sus primeras tres filas (forma triangular, no cruz/T)", () => {
  function filledRunWidth(row, windowStart, windowEnd) {
    const cols = [...row.slice(windowStart, windowEnd)];
    const filledIndexes = cols
      .map((c, i) => (c !== MAX_TRANSPARENT ? i : -1))
      .filter((i) => i >= 0);

    return filledIndexes.length === 0
      ? 0
      : filledIndexes[filledIndexes.length - 1] - filledIndexes[0] + 1;
  }

  const earRows = MAX_SIDE_PIXELS.slice(0, 3);

  // Las ventanas dividen justo en la columna del hueco entre orejas
  // (columna 5, ver más abajo) -- ajustadas tras la ronda que acercó
  // las orejas, para no truncar la lejana como haría una ventana
  // pensada para la separación más ancha de la ronda anterior.
  const nearWidths = earRows.map((row) => filledRunWidth(row, 0, 6));
  const farWidths = earRows.map((row) => filledRunWidth(row, 6, 12));

  const isStrictlyIncreasing = (widths) =>
    widths[0] < widths[1] && widths[1] < widths[2];

  assert.ok(
    isStrictlyIncreasing(nearWidths),
    `se esperaba un ancho creciente en la oreja cercana por fila, se obtuvo [${nearWidths.join(", ")}]`,
  );
  assert.ok(
    isStrictlyIncreasing(farWidths),
    `se esperaba un ancho creciente en la oreja lejana por fila, se obtuvo [${farWidths.join(", ")}]`,
  );
});

test("la oreja cercana (h) tiene mejor contraste contra el contorno que el tono de máscara (k) que usaba antes", () => {
  // Petición humana explícita de esta ronda: la oreja cercana "se lee
  // demasiado rígida/apéndice" por bajo contraste contra el contorno.
  // "h" (#d4a876, tan claro) y "O" (#1c1410, contorno oscuro) están en
  // extremos opuestos de luminosidad; "k" (#3b2a1f, máscara oscura,
  // el tono que usaba antes) está mucho más cerca de "O". Se compara
  // luminosidad relativa (percepción estándar) en vez de fijar un
  // pixel exacto, para no proteger una silueta concreta más de lo
  // necesario.
  function relativeLuminance(hex) {
    const n = Number.parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 0xff;
    const g = (n >> 8) & 0xff;
    const b = n & 0xff;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  const outlineLuminance = relativeLuminance(MAX_PIXEL_PALETTE.O);
  const earLuminance = relativeLuminance(MAX_PIXEL_PALETTE.h);
  const previousEarLuminance = relativeLuminance(MAX_PIXEL_PALETTE.k);

  const currentContrast = Math.abs(earLuminance - outlineLuminance);
  const previousContrast = Math.abs(previousEarLuminance - outlineLuminance);

  assert.ok(
    currentContrast > previousContrast,
    `contraste actual (${currentContrast}) debería ser mayor que el del tono anterior (${previousContrast})`,
  );
});

/*
 * Torso/abdomen (sección 8): el torso no debe ser un rectángulo
 * degenerado -- debe haber variación de ancho entre filas de torso
 * (pecho/lomo más ancho que el vientre recogido), y una sombra de
 * vientre ("s") distinta del tono principal del cuerpo.
 */
test("el torso no es un rectángulo degenerado: el ancho varía entre filas (pecho/lomo vs. vientre recogido)", () => {
  const torsoRows = MAX_SIDE_PIXELS.slice(7, 13).map(rowSpan);
  const minSpan = Math.min(...torsoRows);
  const maxSpan = Math.max(...torsoRows);

  assert.ok(
    maxSpan > minSpan,
    `se esperaba variación de ancho en el torso, todas las filas miden ${maxSpan}`,
  );
});

test("hay una sombra de vientre (símbolo s) presente en la región del torso", () => {
  const torsoRows = MAX_SIDE_PIXELS.slice(7, 13).join("");

  assert.ok(torsoRows.includes("s"), "se esperaba sombra de vientre (s) en el torso");
});

/*
 * Cola (sección 10): debe existir como apéndice visible que nace de la
 * grupa y se proyecta hacia arriba/atrás en columnas muy a la derecha
 * (18-21), separado de la cabeza (que ocupa las columnas 0-10 en las
 * mismas filas) por una franja transparente real.
 */
test("hay una cola visible (columnas 18-21) en las filas superiores, separada de la cabeza por una franja transparente", () => {
  const upperRows = MAX_SIDE_PIXELS.slice(0, 7);

  const hasTailPixel = upperRows.some((row) =>
    [...row.slice(18, 22)].some((c) => c !== MAX_TRANSPARENT),
  );
  assert.ok(hasTailPixel, "se esperaba al menos un pixel de cola en columnas 18-21");

  const hasGapBetweenHeadAndTail = upperRows.some((row) =>
    [...row.slice(11, 18)].every((c) => c === MAX_TRANSPARENT),
  );
  assert.ok(
    hasGapBetweenHeadAndTail,
    "se esperaba al menos una fila con una franja transparente entre cabeza y cola",
  );
});

test("la cola se mantiene más baja que la cabeza: no alcanza las filas 0-1 donde están las orejas", () => {
  const earRows = MAX_SIDE_PIXELS.slice(0, 2);
  const hasTailPixelNearEars = earRows.some((row) =>
    [...row.slice(18, 22)].some((c) => c !== MAX_TRANSPARENT),
  );

  assert.equal(
    hasTailPixelNearEars,
    false,
    "la cola no debería alcanzar la altura de las orejas -- eso reproduce la silueta de 'dos extremos alzados' que se pidió evitar",
  );
});

/*
 * Patas (sección 9): cuatro patas legibles, llegando hasta la línea de
 * suelo (última fila) en dos parejas claramente separadas (delanteras/
 * traseras), con una ruptura de tono a media altura sugiriendo una
 * articulación en vez de un rectángulo uniforme de un solo color.
 */
test("hay píxeles no transparentes cerca de la línea de suelo (filas 16-17) en dos grupos de columnas separados (patas delanteras y traseras)", () => {
  const columnsWithFill = new Set();

  for (const row of MAX_SIDE_PIXELS.slice(16, 18)) {
    [...row].forEach((symbol, col) => {
      if (symbol !== MAX_TRANSPARENT) columnsWithFill.add(col);
    });
  }

  const sortedCols = [...columnsWithFill].sort((a, b) => a - b);
  assert.ok(sortedCols.length >= 4, `se esperaban al menos 4 columnas de pata cerca del suelo, hay ${sortedCols.length}`);

  // Confirma que hay un hueco entre el grupo delantero y el trasero
  // (no es una única masa continua de "patas" fusionadas).
  const gapExists = sortedCols.some(
    (col, i) => i > 0 && col - sortedCols[i - 1] >= 2,
  );
  assert.ok(gapExists, `se esperaba un hueco entre patas delanteras y traseras: ${sortedCols.join(",")}`);
});

test("cada pata muestra al menos dos tonos distintos (articulación), no un único color uniforme de arriba a abajo", () => {
  const legRows = MAX_SIDE_PIXELS.slice(13, 18);
  const legTones = new Set(
    legRows
      .join("")
      .split("")
      .filter((symbol) => symbol === "b" || symbol === "d"),
  );

  assert.ok(
    legTones.has("b") && legTones.has("d"),
    "se esperaban ambos tonos (b y d) en la región de las patas, sugiriendo un quiebre de articulación",
  );
});

test("las patas son más cortas que en la versión anterior (commit e63dc1f): menos filas de altura de pata", () => {
  // Snapshot literal de MAX_SIDE_PIXELS[10..17] en e63dc1f (8 filas de
  // pata, la versión que la revisión humana rechazó por "patas
  // demasiado largas"), usado solo como referencia -- no como fuente
  // del dato actual.
  const PREVIOUS_LEG_ROWS = 8;
  const CURRENT_LEG_ROWS = MAX_SIDE_PIXELS.length - 13;

  assert.ok(
    CURRENT_LEG_ROWS < PREVIOUS_LEG_ROWS,
    `las patas (${CURRENT_LEG_ROWS} filas) deberían ser más cortas que en la versión anterior (${PREVIOUS_LEG_ROWS} filas)`,
  );
});

/*
 * Cuerpo preservado (restricción explícita de esta ronda, que solo
 * debía tocar la cabeza): las patas deben quedar byte a byte
 * idénticas a `444ee1f` -- no un ajuste de 1-2 píxeles, sino
 * completamente intactas, ya que la cabeza pudo absorber toda la fila
 * extra que necesitaba quitándosela al torso en vez de a las patas.
 */
test("las patas (filas 13-17) son byte a byte idénticas a la versión anterior (commit 444ee1f)", () => {
  const PREVIOUS_LEGS = [
    ".....ObbOddO.ObbOddO..",
    ".....ObbOddO.ObbOddO..",
    ".....OddObbO.OddObbO..",
    "......OOOssO..OOOssO..",
    ".....OssOOO..OssOOO...",
  ];

  assert.deepEqual(MAX_SIDE_PIXELS.slice(13, 18), PREVIOUS_LEGS);
});

/*
 * Cuerpo completo preservado (restricción explícita de esta ronda:
 * "modificar únicamente la cabeza... NO reabrir el cuerpo"): torso,
 * pecho, abdomen, patas y cola (filas 7-17) deben quedar byte a byte
 * idénticos a la versión inmediatamente anterior (commit 84fe78d),
 * que ya era la versión en la que se aceptó el cuerpo por primera vez
 * ("el cuerpo está suficientemente bien"). Esta ronda solo debía tocar
 * las filas 0-6 (cabeza).
 */
test("el cuerpo completo (filas 7-17: torso, pecho, abdomen, patas y cola) es byte a byte idéntico a la versión anterior (commit 84fe78d)", () => {
  const PREVIOUS_BODY = [
    "OOO.ObbbbbbbbbbbbbbbbO",
    "....ObbbbhhhhhhhbbbbO.",
    "....ObbbbbbbbbbbbbbO..",
    "....ObbbbbbbbbbbbbbO..",
    ".....OOOssssssssbbbO..",
    "......OOOOOOOOOOOOO...",
    ".....ObbOddO.ObbOddO..",
    ".....ObbOddO.ObbOddO..",
    ".....OddObbO.OddObbO..",
    "......OOOssO..OOOssO..",
    ".....OssOOO..OssOOO...",
  ];

  assert.deepEqual(MAX_SIDE_PIXELS.slice(7, 18), PREVIOUS_BODY);
});

test("todos los pixeles del sprite forman una única silueta conectada (sin piezas flotando por separado)", () => {
  const grid = MAX_SIDE_PIXELS.map((row) => [...row]);
  const cells = [];

  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      if (grid[y][x] !== MAX_TRANSPARENT) {
        cells.push(`${x},${y}`);
      }
    }
  }

  const cellSet = new Set(cells);
  const visited = new Set([cells[0]]);
  const queue = [cells[0]];

  while (queue.length > 0) {
    const [cx, cy] = queue.pop().split(",").map(Number);

    for (const [nx, ny] of [
      [cx - 1, cy],
      [cx + 1, cy],
      [cx, cy - 1],
      [cx, cy + 1],
    ]) {
      const key = `${nx},${ny}`;
      if (cellSet.has(key) && !visited.has(key)) {
        visited.add(key);
        queue.push(key);
      }
    }
  }

  assert.equal(
    visited.size,
    cellSet.size,
    `algunas piezas de Max quedan desconectadas (conectadas: ${visited.size} de ${cellSet.size})`,
  );
});

test("no hay boca ni collar: el número de colores de la paleta es compacto (7)", () => {
  assert.equal(Object.keys(MAX_PIXEL_PALETTE).length, 7);
});
