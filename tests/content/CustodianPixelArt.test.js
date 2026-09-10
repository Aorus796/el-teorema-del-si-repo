import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync } from "node:fs";
import {
  CUSTODIAN_CONTRADICTION_PIXELS,
  CUSTODIAN_IDLE_PIXELS,
  CUSTODIAN_PALETTE,
  CUSTODIAN_PIXEL_HEIGHT,
  CUSTODIAN_PIXEL_WIDTH,
  CUSTODIAN_SLIT_VARIANTS,
  CUSTODIAN_TRANSPARENT,
} from "../../src/content/custodianPixelArt.js";
import {
  ELENA_PIXEL_HEIGHT,
  ELENA_PIXEL_WIDTH,
} from "../../src/content/elenaPixelArt.js";
import { NAMED_NPC_PALETTES } from "../../src/content/characterPalettes.js";

const VARIANT_PIXELS = {
  idle: CUSTODIAN_IDLE_PIXELS,
  contradiction: CUSTODIAN_CONTRADICTION_PIXELS,
};

/*
 * Los cuatro únicos módulos de src/content/ con los que el Custodio puede
 * compartir un valor hexadecimal: los otros props de la Cámara de
 * Contención, que representan los mismos materiales de la misma sala (ver
 * el comentario de cabecera de custodianPixelArt.js). Lista cerrada a
 * propósito: si un módulo nuevo empezara a reutilizar estos colores, este
 * test debe fallar y obligar a decidirlo de forma explícita -- que es
 * justo lo que ocurrió al añadir el panel de consulta.
 */
const ALLOWED_PALETTE_SHARING_FILES = new Set([
  "containmentBudgetPanelPixelArt.js",
  "containmentLatticePixelArt.js",
  "containmentShelfPixelArt.js",
  "containmentWellPixelArt.js",
]);

test("las dos variantes tienen exactamente el alto y el ancho declarados", () => {
  for (const variant of CUSTODIAN_SLIT_VARIANTS) {
    const pixels = VARIANT_PIXELS[variant];

    assert.ok(pixels, `no existe la matriz de la variante ${variant}`);
    assert.equal(
      pixels.length,
      CUSTODIAN_PIXEL_HEIGHT,
      `la variante ${variant} no tiene ${CUSTODIAN_PIXEL_HEIGHT} filas`,
    );

    for (const [index, row] of pixels.entries()) {
      assert.equal(
        row.length,
        CUSTODIAN_PIXEL_WIDTH,
        `la fila ${index} de ${variant} no mide ${CUSTODIAN_PIXEL_WIDTH}`,
      );
    }
  }
});

test("todo símbolo no transparente tiene entrada en la paleta", () => {
  for (const variant of CUSTODIAN_SLIT_VARIANTS) {
    for (const row of VARIANT_PIXELS[variant]) {
      for (const symbol of row) {
        if (symbol === CUSTODIAN_TRANSPARENT) {
          continue;
        }

        assert.ok(
          Object.hasOwn(CUSTODIAN_PALETTE, symbol),
          `el símbolo "${symbol}" de la variante ${variant} no está en la paleta`,
        );
      }
    }
  }
});

test("la paleta no declara ningún color que ninguna variante utilice", () => {
  const usedSymbols = new Set();

  for (const variant of CUSTODIAN_SLIT_VARIANTS) {
    for (const row of VARIANT_PIXELS[variant]) {
      for (const symbol of row) {
        if (symbol !== CUSTODIAN_TRANSPARENT) {
          usedSymbols.add(symbol);
        }
      }
    }
  }

  assert.deepEqual(
    Object.keys(CUSTODIAN_PALETTE).sort(),
    [...usedSymbols].sort(),
  );
});

/*
 * Las dos variantes son el MISMO cuerpo con distinta ranura: si divergieran
 * fuera de las filas 3-6 (el bloque que compone createCustodianPixels()),
 * se habría colado un error de transcripción. Dentro de ese bloque no todas
 * las filas cambian -- la 4 es idéntica en ambas variantes, porque el
 * núcleo de la ranura ya era turquesa en reposo y lo que "contradiction"
 * hace es derramarlo hacia arriba y hacia abajo.
 */
test("idle y contradiction solo difieren dentro del bloque de filas de la ranura", () => {
  const differingRows = [];

  for (let row = 0; row < CUSTODIAN_PIXEL_HEIGHT; row += 1) {
    if (CUSTODIAN_IDLE_PIXELS[row] !== CUSTODIAN_CONTRADICTION_PIXELS[row]) {
      differingRows.push(row);
    }
  }

  assert.deepEqual(differingRows, [3, 5, 6]);
});

test("la variante contradiction extiende el cristal turquesa, no lo reduce", () => {
  const countTurquoise = (pixels) =>
    pixels.reduce(
      (total, row) => total + [...row].filter((symbol) => symbol === "t").length,
      0,
    );

  assert.ok(
    countTurquoise(CUSTODIAN_CONTRADICTION_PIXELS) >
      countTurquoise(CUSTODIAN_IDLE_PIXELS),
  );
});

/*
 * El Custodio no es un personaje humano: su bounding box es
 * deliberadamente mayor que el de los cinco personajes humanos (14x22,
 * representados aquí por Elena) y su cabeza es un trapecio invertido --
 * más ancha arriba que abajo, justo la inversión de una cabeza humana.
 */
test("el bounding box es mayor que el de los personajes humanos", () => {
  assert.ok(CUSTODIAN_PIXEL_WIDTH > ELENA_PIXEL_WIDTH);
  assert.ok(CUSTODIAN_PIXEL_HEIGHT > ELENA_PIXEL_HEIGHT);
});

test("la cabeza es un trapecio invertido: la fila superior es más ancha que la base del cuello", () => {
  const opaqueWidth = (row) =>
    [...row].filter((symbol) => symbol !== CUSTODIAN_TRANSPARENT).length;

  const headTop = opaqueWidth(CUSTODIAN_IDLE_PIXELS[0]);
  const neck = opaqueWidth(CUSTODIAN_IDLE_PIXELS[11]);

  assert.ok(
    headTop > neck,
    `la cabeza (${headTop}px) debe ser más ancha que el cuello (${neck}px)`,
  );
});

test("la paleta no comparte ningún color con las paletas de NPC nombrados", () => {
  const custodianColors = new Set(
    Object.values(CUSTODIAN_PALETTE).map((color) => color.toLowerCase()),
  );

  for (const [npcId, palette] of Object.entries(NAMED_NPC_PALETTES)) {
    for (const [key, color] of Object.entries(palette)) {
      if (typeof color !== "string" || !color.startsWith("#")) {
        continue;
      }

      assert.equal(
        custodianColors.has(color.toLowerCase()),
        false,
        `${npcId}.${key} (${color}) coincide con un color del Custodio`,
      );
    }
  }
});

test("fuera de los cuatro props de la Cámara, ningún módulo de src/content comparte color con el Custodio", async () => {
  const custodianColors = new Set(
    Object.values(CUSTODIAN_PALETTE).map((color) => color.toLowerCase()),
  );
  const files = readdirSync("src/content").filter(
    (file) =>
      file.endsWith(".js") &&
      file !== "custodianPixelArt.js" &&
      !ALLOWED_PALETTE_SHARING_FILES.has(file),
  );

  for (const file of files) {
    const module = await import(`../../src/content/${file}`);

    for (const [exportName, exported] of Object.entries(module)) {
      if (
        !exported ||
        typeof exported !== "object" ||
        Array.isArray(exported)
      ) {
        continue;
      }

      for (const [key, color] of Object.entries(exported)) {
        if (typeof color !== "string" || !color.startsWith("#")) {
          continue;
        }

        assert.equal(
          custodianColors.has(color.toLowerCase()),
          false,
          `${file}:${exportName}.${key} (${color}) coincide con un color del Custodio`,
        );
      }
    }
  }
});
