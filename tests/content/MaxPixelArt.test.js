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
 *
 * Reescrito por completo en la ronda que amplió el sprite de 22x18 a
 * 22x20 (autorización humana explícita para romper el límite visual
 * anterior, tras confirmar en varias rondas que 22x18 no daba
 * resolución suficiente para cabeza+cuerpo simultáneamente legibles).
 * Los tests de rondas anteriores que protegían geometría de cabeza ya
 * descartada (comparaciones de superficie/altura contra commits
 * concretos como e63dc1f/444ee1f/3353f43/3ae4209/2390783) se eliminan
 * -- instrucción explícita de la tarea: "NO crear tests contra commits
 * visualmente rechazados" -- y se sustituyen por contratos absolutos
 * sobre la estructura actual. Los tests de cuerpo (torso/patas/cola)
 * se conservan con los índices de fila desplazados +2 (el cuerpo migró
 * de filas 7-17 a filas 9-19, mismo contenido).
 */

function symbolSpan(row, symbols) {
  const chars = [...row];
  const indexes = chars.map((c, i) => (symbols.has(c) ? i : -1)).filter((i) => i >= 0);

  return indexes.length === 0 ? 0 : indexes[indexes.length - 1] - indexes[0] + 1;
}

function firstCol(row, symbols) {
  return [...row].findIndex((c) => symbols.has(c));
}

function hasSymbol(row, symbols) {
  return [...row].some((c) => symbols.has(c));
}

function rowSpan(row) {
  const chars = [...row];
  const first = chars.findIndex((c) => c !== MAX_TRANSPARENT);
  const last = chars
    .map((c, i) => (c !== MAX_TRANSPARENT ? i : -1))
    .filter((i) => i >= 0)
    .pop();

  return last - first + 1;
}

test("MAX_SIDE_PIXELS tiene exactamente MAX_PIXEL_HEIGHT filas", () => {
  assert.equal(MAX_SIDE_PIXELS.length, MAX_PIXEL_HEIGHT);
});

test("MAX_PIXEL_HEIGHT es 20 (ampliado desde 18 -- autorización humana explícita para romper el límite visual anterior)", () => {
  assert.equal(MAX_PIXEL_HEIGHT, 20);
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
 * diferenciar por fila. Se ancla a la posición exacta del ojo (fila 6,
 * columna 4), con tan a ambos lados (columnas 3 y 5) en vez de pegado
 * al escalón del hocico -- ver el comentario de cabecera de
 * maxPixelArt.js.
 */
test("el ojo (fila 6, columna 4) usa el color de contorno, sin blanco ni pupila compleja", () => {
  assert.equal(MAX_SIDE_PIXELS[6][4], "O");
});

test("el ojo tiene tan (b) a ambos lados en su propia fila -- embebido en la cara, no pegado al escalón del hocico", () => {
  assert.equal(MAX_SIDE_PIXELS[6][3], "b");
  assert.equal(MAX_SIDE_PIXELS[6][5], "b");
});

test("la nariz (fila 8, columna 0) usa el color de contorno, en la punta del hocico", () => {
  assert.equal(MAX_SIDE_PIXELS[8][0], "O");
});

/*
 * Cabeza y hocico: el hocico debe ser notablemente más estrecho que el
 * cráneo -- se compara el ancho (span) de la fila más ancha del cráneo
 * (fila 3, la coronilla, que respalda la base de las orejas) contra el
 * ancho del relleno de máscara ("k") en las filas de hocico (7-8), en
 * vez de fijar columnas exactas, para no proteger una silueta concreta
 * más de lo necesario.
 */
test("el hocico (relleno de máscara \"k\" en filas 7-8) es más estrecho que el cráneo (fila 3, la más ancha)", () => {
  const skullSpan = symbolSpan(MAX_SIDE_PIXELS[3], new Set(["b", "h"]));
  const muzzleRows = MAX_SIDE_PIXELS.slice(7, 9);
  const muzzleSpan = Math.max(...muzzleRows.map((row) => symbolSpan(row, new Set(["k"]))));

  assert.ok(
    muzzleSpan < skullSpan,
    `hocico (${muzzleSpan}) debería ser más estrecho que el cráneo (${skullSpan})`,
  );
});

test("la región de la cabeza (filas 0-8) no es más ancha en su conjunto que el torso (filas 9-14, sin la cola)", () => {
  // Restringido a las columnas 0-14 (cráneo/orejas/hocico): en las
  // filas 0-8 también pasa la raíz de la cola (columnas 18-21), una
  // región anatómica distinta que no debe contar como "ancho de
  // cabeza" solo por compartir rango de filas. El torso se restringe a
  // columnas 4-17 por el mismo motivo, excluyendo su propia cola.
  const headRows = MAX_SIDE_PIXELS.slice(0, 9).map((row) => row.slice(0, 15));
  const torsoRows = MAX_SIDE_PIXELS.slice(9, 15).map((row) => row.slice(4, 18));
  const headSpan = Math.max(...headRows.map(rowSpan));
  const torsoSpan = Math.max(...torsoRows.map(rowSpan));

  assert.ok(
    headSpan <= torsoSpan,
    `cabeza (${headSpan}) no debería ser más ancha que el torso (${torsoSpan})`,
  );
});

/*
 * Cráneo redondeado, silueta en "L" no en diagonal (lección aprendida
 * en un intento anterior de esta misma ronda, dentro de un presupuesto
 * de 18 filas: un cráneo cuyo borde frontal recede progresivamente
 * fila a fila, combinado con un hocico que salta hacia delante, traza
 * una única diagonal continua de punta de oreja a punta de nariz --
 * confirmado por revisión visual independiente como una lectura de
 * llama/ciervo, no de perro). Se protege aquí la estructura que evita
 * ese defecto: el borde frontal del cráneo (columna más a la izquierda
 * con tejido b/h, excluyendo filas que ya mezclan máscara) debe ser
 * IDÉNTICO en todas las filas de cráneo puro -- una pared vertical, no
 * una rampa.
 */
test("el borde frontal del cráneo es constante en sus filas inferiores, la pared que separa el cráneo del hocico (no una rampa diagonal)", () => {
  // Restringido a las filas 4-6 (mejilla, frente y fila del ojo): la
  // coronilla (fila 3) tiene deliberadamente su propio borde frontal,
  // más adelantado, para respaldar por completo la base de las orejas
  // sin dejarlas "colgando" fuera del cráneo (ver el test dedicado a
  // esa propiedad); la fila del hocico (7) ya mezcla máscara. Ninguna
  // de las dos forma parte de la pared vertical que evita la rampa
  // diagonal cráneo->hocico, que es lo que este test protege.
  const skullSymbols = new Set(["b", "h"]);
  const craniumRows = MAX_SIDE_PIXELS.slice(4, 7);

  craniumRows.forEach((row) => {
    assert.ok(
      symbolSpan(row, skullSymbols) >= 5,
      `se esperaba masa de cráneo real (>=5 columnas) en cada fila 4-6, fila "${row}" no la tiene`,
    );
  });

  const frontEdges = craniumRows.map((row) => firstCol(row, skullSymbols));
  const allSame = frontEdges.every((edge) => edge === frontEdges[0]);

  assert.ok(
    allSame,
    `se esperaba el mismo borde frontal en las filas 4-6 del cráneo, se obtuvo [${frontEdges.join(", ")}]`,
  );
});

test("el hocico (máscara \"k\") proyecta hacia delante del borde frontal del cráneo", () => {
  const skullSymbols = new Set(["b", "h"]);
  const muzzleSymbols = new Set(["k"]);
  const headRows = MAX_SIDE_PIXELS.slice(0, 9);

  const skullFrontEdge = Math.min(
    ...headRows
      .filter((row) => hasSymbol(row, skullSymbols) && !hasSymbol(row, muzzleSymbols))
      .map((row) => firstCol(row, skullSymbols)),
  );
  const muzzleFrontEdge = Math.min(
    ...headRows.filter((row) => hasSymbol(row, muzzleSymbols)).map((row) => firstCol(row, muzzleSymbols)),
  );

  assert.ok(
    muzzleFrontEdge < skullFrontEdge,
    `el hocico (columna ${muzzleFrontEdge}) debería proyectar más adelante que el cráneo (columna ${skullFrontEdge})`,
  );
});

/*
 * Cráneo más ancho que la base de las orejas (lección aprendida en un
 * segundo intento de esta ronda: un cráneo más estrecho que las bases
 * de las orejas que descansan sobre él crea un "pinzamiento" visual
 * justo en la unión, que se lee como un cuello delgado sosteniendo las
 * orejas -- el mismo problema de fondo, causado de otra forma). Se
 * protege que la fila superior del cráneo sea al menos tan ancha como
 * el propio hueco entre las puntas de las orejas más sus bases.
 */
test("el cráneo (fila superior) es al menos tan ancho como la base de las orejas que lo coronan -- sin pinzamiento", () => {
  const skullSymbols = new Set(["b", "h"]);
  const earSymbols = new Set(["h", "d"]);

  const crownSpan = symbolSpan(MAX_SIDE_PIXELS[3], skullSymbols);
  const earBaseSpan = symbolSpan(MAX_SIDE_PIXELS[2], earSymbols);

  assert.ok(
    crownSpan >= earBaseSpan,
    `cráneo (${crownSpan}) debería ser al menos tan ancho como la base de las orejas (${earBaseSpan})`,
  );
});

/*
 * Altura/masa del cráneo: al menos 4 filas de tejido craneal puro
 * (b/h, sin ninguna mezcla de máscara) antes de que empiece el hocico.
 * Sube de 3 a 4 en esta ronda -- rediseño deliberado explícito que
 * responde a "cráneo con poca masa visual" cediendo, a cambio, una
 * fila del hocico (que baja de 3 niveles de taper a 2, un escalón
 * limpio en vez de un zigzag de "demasiados quiebros").
 */
test("el cráneo ocupa al menos 4 filas de tejido craneal puro (b/h, sin máscara) antes del hocico", () => {
  const skullSymbols = new Set(["b", "h"]);
  const muzzleSymbols = new Set(["k"]);
  const headRows = MAX_SIDE_PIXELS.slice(0, 9);

  const craniumRows = headRows.filter(
    (row) =>
      hasSymbol(row, skullSymbols) &&
      !hasSymbol(row, muzzleSymbols) &&
      symbolSpan(row, skullSymbols) >= 5,
  );

  assert.ok(
    craniumRows.length >= 4,
    `se esperaban al menos 4 filas de cráneo puro con masa real, hay ${craniumRows.length}`,
  );
});

/*
 * Máscara facial: debe existir como rasgo diferenciado (color "k") sin
 * convertir toda la cabeza en un bloque negro -- debe coexistir con
 * tan ("b"/"h") en la región de la cabeza, y no cubrir la coronilla.
 */
test("la máscara facial (símbolo k) está presente en la región de la cabeza", () => {
  const headRows = MAX_SIDE_PIXELS.slice(0, 9);
  const maskCount = headRows.join("").split("").filter((c) => c === "k").length;

  assert.ok(maskCount > 0, "se esperaba al menos un pixel de máscara en la cabeza");
});

test("la máscara no ocupa toda la cabeza: hay tan (b/h) visible junto a la máscara", () => {
  const headRows = MAX_SIDE_PIXELS.slice(0, 9);
  const joined = headRows.join("");
  const tanCount = [...joined].filter((c) => c === "b" || c === "h").length;

  assert.ok(
    tanCount > 0,
    "se esperaba tan visible en la cabeza, además de la máscara",
  );
});

test("la máscara no alcanza la coronilla (fila 3): la fila superior del cráneo está enteramente en tan", () => {
  assert.ok(
    !hasSymbol(MAX_SIDE_PIXELS[3], new Set(["k"])),
    "la coronilla (fila 3) no debería tener ningún pixel de máscara",
  );
});

/*
 * Orejas (sección 8): dos triángulos que nacen del cráneo, separados
 * por un hueco transparente real, con base más ancha que la punta.
 * Se restringe la comprobación a las columnas 0-12 para no confundir
 * el hueco entre orejas con el hueco entre el cuerpo y la cola.
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

test("hay dos orejas separadas por un hueco transparente real en la fila de las puntas (fila 0, columnas 0-12)", () => {
  const hasGapRow = countFilledSegments(MAX_SIDE_PIXELS[0], 0, 13) >= 2;

  assert.ok(
    hasGapRow,
    "se esperaba que la fila de las puntas tuviera dos tramos de oreja separados por un hueco transparente",
  );
});

test("la oreja cercana (h) y la oreja lejana (d) son tonalmente distintas", () => {
  const earRows = MAX_SIDE_PIXELS.slice(0, 3).join("");

  assert.ok(earRows.includes("h"), "se esperaba la oreja cercana (h)");
  assert.ok(earRows.includes("d"), "se esperaba la oreja lejana (d)");
});

/*
 * Forma triangular de las orejas (microiteración explícita: "usar al
 * menos 3 niveles visuales si el espacio lo permite -- punta, cuerpo,
 * base"): esta ronda amplía las orejas de 2 filas a 3 -- 2 filas
 * seguían leyéndose como bultos/astas incluso con el pinzamiento
 * cráneo-orejas ya resuelto. Se protege que cada oreja tenga un ancho
 * estrictamente creciente en sus 3 niveles (punta -> cuerpo -> base),
 * no solo 2.
 */
test("cada oreja tiene tres niveles de ancho estrictamente crecientes (punta -> cuerpo -> base) -- forma triangular, no un bloque", () => {
  function filledRunWidth(row, windowStart, windowEnd) {
    return symbolSpan(row.slice(windowStart, windowEnd), new Set(["h", "d", "m"]));
  }

  const earRows = MAX_SIDE_PIXELS.slice(0, 3);
  const nearWidths = earRows.map((row) => filledRunWidth(row, 0, 6));
  const farWidths = earRows.map((row) => filledRunWidth(row, 6, 12));

  const isStrictlyIncreasing = (widths) => widths[0] < widths[1] && widths[1] < widths[2];

  assert.ok(
    isStrictlyIncreasing(nearWidths),
    `se esperaba un ancho creciente en la oreja cercana por nivel, se obtuvo [${nearWidths.join(", ")}]`,
  );
  assert.ok(
    isStrictlyIncreasing(farWidths),
    `se esperaba un ancho creciente en la oreja lejana por nivel, se obtuvo [${farWidths.join(", ")}]`,
  );
});

test("hay un hueco transparente real de al menos 1 columna entre las dos orejas, en las tres filas donde viven", () => {
  function gapWidth(row) {
    const chars = [...row];
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

  const gaps = MAX_SIDE_PIXELS.slice(0, 3).map(gapWidth);

  gaps.forEach((gap, i) => {
    assert.ok(gap >= 1, `fila ${i}: se esperaba un hueco de al menos 1 columna, hay ${gap}`);
  });
});

test("la oreja cercana (h) tiene mejor contraste contra el contorno que el tono de máscara (k)", () => {
  // "h" (#d4a876, tan claro) y "O" (#1c1410, contorno oscuro) están en
  // extremos opuestos de luminosidad; "k" (#3b2a1f, máscara oscura)
  // está mucho más cerca de "O" -- se compara luminosidad relativa
  // (percepción estándar) en vez de fijar un pixel exacto.
  function relativeLuminance(hex) {
    const n = Number.parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 0xff;
    const g = (n >> 8) & 0xff;
    const b = n & 0xff;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  const outlineLuminance = relativeLuminance(MAX_PIXEL_PALETTE.O);
  const earLuminance = relativeLuminance(MAX_PIXEL_PALETTE.h);
  const maskLuminance = relativeLuminance(MAX_PIXEL_PALETTE.k);

  const earContrast = Math.abs(earLuminance - outlineLuminance);
  const maskContrast = Math.abs(maskLuminance - outlineLuminance);

  assert.ok(
    earContrast > maskContrast,
    `contraste de la oreja (${earContrast}) debería ser mayor que el de la máscara (${maskContrast})`,
  );
});

/*
 * Torso/abdomen: reutilizado en espíritu (y, de hecho, byte a byte) de
 * la versión aprobada del cuerpo, desplazado +2 filas por el aumento de
 * resolución (filas 7-17 -> 9-19). No debe ser un rectángulo degenerado.
 */
test("el torso no es un rectángulo degenerado: el ancho varía entre filas (pecho/lomo vs. vientre recogido)", () => {
  const torsoRows = MAX_SIDE_PIXELS.slice(9, 15).map(rowSpan);
  const minSpan = Math.min(...torsoRows);
  const maxSpan = Math.max(...torsoRows);

  assert.ok(
    maxSpan > minSpan,
    `se esperaba variación de ancho en el torso, todas las filas miden ${maxSpan}`,
  );
});

test("hay una sombra de vientre (símbolo s) presente en la región del torso", () => {
  const torsoRows = MAX_SIDE_PIXELS.slice(9, 15).join("");

  assert.ok(torsoRows.includes("s"), "se esperaba sombra de vientre (s) en el torso");
});

/*
 * Cola: apéndice visible que nace de la grupa y se proyecta hacia
 * arriba/atrás en columnas muy a la derecha (18-21), separado de la
 * cabeza por una franja transparente real. Su porción superior (la que
 * la distingue de la silueta del propio torso) vive en las filas 4-8.
 */
test("hay una cola visible (columnas 18-21) en las filas superiores, separada de la cabeza por una franja transparente", () => {
  const upperRows = MAX_SIDE_PIXELS.slice(0, 9);

  const hasTailPixel = upperRows.some((row) =>
    [...row.slice(18, 22)].some((c) => c !== MAX_TRANSPARENT),
  );
  assert.ok(hasTailPixel, "se esperaba al menos un pixel de cola en columnas 18-21");

  const hasGapBetweenHeadAndTail = upperRows.some((row) =>
    [...row.slice(12, 18)].every((c) => c === MAX_TRANSPARENT),
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
 * Patas: cuatro patas legibles, llegando hasta la línea de suelo
 * (últimas filas) en dos parejas claramente separadas, con una ruptura
 * de tono a media altura sugiriendo una articulación. Filas
 * desplazadas +2 respecto a la versión de 18 filas (13-17 -> 15-19).
 */
test("hay píxeles no transparentes cerca de la línea de suelo (filas 18-19) en dos grupos de columnas separados (patas delanteras y traseras)", () => {
  const columnsWithFill = new Set();

  for (const row of MAX_SIDE_PIXELS.slice(18, 20)) {
    [...row].forEach((symbol, col) => {
      if (symbol !== MAX_TRANSPARENT) columnsWithFill.add(col);
    });
  }

  const sortedCols = [...columnsWithFill].sort((a, b) => a - b);
  assert.ok(sortedCols.length >= 4, `se esperaban al menos 4 columnas de pata cerca del suelo, hay ${sortedCols.length}`);

  const gapExists = sortedCols.some(
    (col, i) => i > 0 && col - sortedCols[i - 1] >= 2,
  );
  assert.ok(gapExists, `se esperaba un hueco entre patas delanteras y traseras: ${sortedCols.join(",")}`);
});

test("cada pata muestra al menos dos tonos distintos (articulación), no un único color uniforme de arriba a abajo", () => {
  const legRows = MAX_SIDE_PIXELS.slice(15, 20);
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

/*
 * Cuerpo preservado: torso, pecho, abdomen, patas y cola (filas 9-19)
 * reutilizan, byte a byte, el cuerpo aprobado de `2fda024` (filas
 * 7-17), desplazado +2 filas -- la tarea no obligaba a conservarlo
 * byte a byte al cambiar de resolución ("no es obligatorio... pero
 * debe mantener... el espíritu"), pero no había ningún motivo para
 * tocar un cuerpo ya aprobado, así que se reutiliza literalmente.
 */
test("el cuerpo completo (filas 9-19: torso, pecho, abdomen, patas y cola) es byte a byte idéntico al cuerpo de la versión anterior (commit 2fda024, filas 7-17)", () => {
  const PREVIOUS_BODY_FROM_2FDA024 = [
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

  assert.deepEqual(MAX_SIDE_PIXELS.slice(9, 20), PREVIOUS_BODY_FROM_2FDA024);
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
