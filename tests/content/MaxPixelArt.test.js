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
 * Ojos (sección 12 de la tarea): Max solo tiene una vista (lateral), así
 * que el criterio aplicable es "1 ojo visible" -- no hay front/back
 * contra los que diferenciar por fila, a diferencia de los personajes
 * humanos. Se ancla a la posición exacta del ojo (fila 2, columna 4, en
 * la unión cráneo/hocico del rediseño anatómico completo), que debe ser
 * el color de contorno ("O", reutilizado para ojo, mismo patrón que los
 * personajes humanos).
 */
test("el ojo (fila 2, columna 4) usa el color de contorno, sin blanco ni pupila compleja", () => {
  assert.equal(MAX_SIDE_PIXELS[2][4], "O");
});

test("la nariz (fila 4, columna 0) usa el color de contorno, en la punta del hocico", () => {
  assert.equal(MAX_SIDE_PIXELS[4][0], "O");
});

/*
 * Cabeza (sección 4) y hocico (sección 4): el hocico debe ser
 * notablemente más estrecho que el cráneo -- se compara el ancho
 * (span) de una fila de cráneo (fila 2, la más ancha, junto a las
 * orejas) contra una fila de hocico (fila 4, la más avanzada), en vez
 * de fijar columnas exactas, para no proteger una silueta concreta más
 * de lo necesario.
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

test("la región de la cabeza (filas 0-4) no es más ancha en su conjunto que la región del torso (filas 6-9) -- cabeza compacta, no desproporcionada", () => {
  // Restringido a las columnas 0-10 (cráneo/orejas/hocico): en las
  // filas 0-4 también pasa la raíz de la cola (columnas 18-21), una
  // región anatómica distinta que no debe contar como "ancho de
  // cabeza" solo por compartir rango de filas.
  const headRows = MAX_SIDE_PIXELS.slice(0, 5).map((row) => row.slice(0, 11));
  const torsoRows = MAX_SIDE_PIXELS.slice(6, 10);
  const headSpan = Math.max(...headRows.map(rowSpan));
  const torsoSpan = Math.max(...torsoRows.map(rowSpan));

  assert.ok(
    headSpan <= torsoSpan,
    `cabeza (${headSpan}) no debería ser más ancha que el torso (${torsoSpan})`,
  );
});

/*
 * Máscara facial (sección 6): debe existir como rasgo diferenciado
 * (color "k") sin convertir toda la cabeza en un bloque negro -- debe
 * coexistir con tan ("b"/"h") en la región de la cabeza (coronilla y
 * mejilla posterior deben seguir en tan).
 */
test("la máscara facial (símbolo k) está presente en la región de la cabeza", () => {
  const headRows = MAX_SIDE_PIXELS.slice(0, 5);
  const maskCount = headRows.join("").split("").filter((c) => c === "k").length;

  assert.ok(maskCount > 0, "se esperaba al menos un pixel de máscara en la cabeza");
});

test("la máscara no ocupa toda la cabeza: hay tan (b/h) visible junto a la máscara", () => {
  const headRows = MAX_SIDE_PIXELS.slice(0, 5);
  const joined = headRows.join("");
  const tanCount = [...joined].filter((c) => c === "b" || c === "h").length;

  assert.ok(
    tanCount > 0,
    "se esperaba tan visible en la cabeza, además de la máscara",
  );
});

/*
 * Orejas (sección 5): dos formas triangulares erguidas por encima del
 * cráneo (filas superiores), separadas por un hueco transparente real
 * (no solo por tono) -- la oreja cercana usa "k" y la lejana "d", con
 * al menos una columna totalmente transparente entre ambas en su fila
 * más estrecha. Se restringe la comprobación a las columnas 0-10 (zona
 * de la cabeza) para no confundir el hueco entre orejas con el hueco
 * entre el cuerpo y la cola, que vive en columnas mucho más a la
 * derecha.
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

test("hay dos orejas separadas por un hueco transparente real en las filas superiores (filas 0-2, columnas 0-10)", () => {
  const headWindow = 10;
  const hasGapRow = MAX_SIDE_PIXELS.slice(0, 3).some(
    (row) => countFilledSegments(row, 0, headWindow) >= 2,
  );

  assert.ok(
    hasGapRow,
    "se esperaba al menos una fila con dos tramos de oreja separados por un hueco transparente",
  );
});

test("la oreja cercana (k) y la oreja lejana (d) son tonalmente distintas", () => {
  const earRows = MAX_SIDE_PIXELS.slice(0, 3).join("");

  assert.ok(earRows.includes("k"), "se esperaba la oreja cercana (k)");
  assert.ok(earRows.includes("d"), "se esperaba la oreja lejana (d)");
});

/*
 * Torso/abdomen (sección 8): el torso no debe ser un rectángulo
 * degenerado -- debe haber variación de ancho entre filas de torso
 * (pecho/lomo más ancho que el vientre recogido), y una sombra de
 * vientre ("s") distinta del tono principal del cuerpo.
 */
test("el torso no es un rectángulo degenerado: el ancho varía entre filas (pecho/lomo vs. vientre recogido)", () => {
  const torsoRows = MAX_SIDE_PIXELS.slice(6, 10).map(rowSpan);
  const minSpan = Math.min(...torsoRows);
  const maxSpan = Math.max(...torsoRows);

  assert.ok(
    maxSpan > minSpan,
    `se esperaba variación de ancho en el torso, todas las filas miden ${maxSpan}`,
  );
});

test("hay una sombra de vientre (símbolo s) presente en la región del torso", () => {
  const torsoRows = MAX_SIDE_PIXELS.slice(6, 10).join("");

  assert.ok(torsoRows.includes("s"), "se esperaba sombra de vientre (s) en el torso");
});

/*
 * Cola (sección 10): debe sobresalir del cuerpo principal hacia la
 * derecha, distinguible del cuerpo (llega más allá del borde derecho
 * del bloque de torso, filas 6-9, donde no hay cola), y su grosor debe
 * disminuir hacia la punta (la fila de la punta debe ser más estrecha
 * que la fila de la raíz).
 */
test("la cola sobresale del cuerpo principal hacia la derecha", () => {
  function rightmostFilledColumn(row) {
    const chars = [...row];
    for (let x = chars.length - 1; x >= 0; x -= 1) {
      if (chars[x] !== MAX_TRANSPARENT) return x;
    }
    return -1;
  }

  const torsoRows = MAX_SIDE_PIXELS.slice(6, 10);
  const torsoRightEdge = Math.max(...torsoRows.map(rightmostFilledColumn));

  const tailRows = MAX_SIDE_PIXELS.slice(0, 9);
  const tailRightEdge = Math.max(...tailRows.map(rightmostFilledColumn));

  assert.ok(
    tailRightEdge > torsoRightEdge,
    `se esperaba que la cola (columna ${tailRightEdge}) sobresaliera del torso (columna ${torsoRightEdge})`,
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
  const legRows = MAX_SIDE_PIXELS.slice(10, 18);
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
