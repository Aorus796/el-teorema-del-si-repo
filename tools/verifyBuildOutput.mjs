// Analiza el build estatico generado en builds/browser en busca de
// referencias de carga reales (atributos HTML de <script src>,
// <link href>, <img src>, src de <audio>/<video>/<source>, url(...) en
// CSS, y especificadores de import/import() estatico o dinamico en JS)
// que romperian el empaquetado local en Electron:
//
//   - referencias obligatorias a http:// o https://;
//   - literales file://;
//   - rutas absolutas de sistema Windows (C:\... o C:/...) o Unix
//     (rutas que empiezan por / fuera de un ./ o ../ relativo);
//   - recursos locales referenciados que no existen en disco dentro del
//     build;
//   - cualquier recurso que, tras normalizar ../, resuelva fuera del
//     propio directorio de build (fuga del build).
//
// Deliberadamente NO inspecciona texto de dialogo, comentarios ni
// cadenas JS arbitrarias que no sean especificadores reales de carga:
// solo los patrones sintacticos listados arriba.
//
// Este modulo es puro (no importa "electron", no depende de Node
// globals fuera de node:fs/node:path) para poder probarse con
// `node --test` contra fixtures sinteticos, sin depender de que
// builds/browser ya exista.

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const SCANNED_EXTENSIONS = [".html", ".htm", ".css", ".js", ".mjs"];

const HTML_ATTRIBUTE_PATTERNS = [
  /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,
  /<link\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi,
  /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,
  /<audio\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,
  /<video\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,
  /<source\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,
];

const CSS_URL_PATTERN = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;

// Anclado a inicio de linea: las declaraciones de import estaticas son
// sentencias de nivel de linea, nunca texto de dialogo embebido a mitad
// de una cadena.
const JS_STATIC_IMPORT_PATTERN =
  /^[ \t]*import\s+(?:[\s\S]*?\sfrom\s+)?["']([^"']+)["']/gm;
const JS_DYNAMIC_IMPORT_PATTERN = /\bimport\(\s*["']([^"']+)["']\s*\)/g;

function matchAll(source, pattern, groupIndex) {
  const results = [];
  const regex = new RegExp(pattern.source, pattern.flags);
  let match = regex.exec(source);
  while (match !== null) {
    results.push(match[groupIndex]);
    match = regex.exec(source);
  }
  return results;
}

/**
 * Extrae los especificadores de carga reales de un fragmento HTML.
 * @param {string} source
 * @returns {string[]}
 */
export function extractHtmlReferences(source) {
  return HTML_ATTRIBUTE_PATTERNS.flatMap((pattern) => matchAll(source, pattern, 1));
}

/**
 * Extrae los especificadores de `url(...)` de un fragmento CSS.
 * @param {string} source
 * @returns {string[]}
 */
export function extractCssReferences(source) {
  return matchAll(source, CSS_URL_PATTERN, 2);
}

/**
 * Extrae los especificadores de `import`/`import()` (estatico o
 * dinamico) de un fragmento JS.
 * @param {string} source
 * @returns {string[]}
 */
export function extractJsReferences(source) {
  return [
    ...matchAll(source, JS_STATIC_IMPORT_PATTERN, 1),
    ...matchAll(source, JS_DYNAMIC_IMPORT_PATTERN, 1),
  ];
}

/**
 * Extrae las referencias de carga relevantes de un archivo segun su
 * extension. Devuelve un array vacio para extensiones no analizadas.
 *
 * @param {string} filePath
 * @param {string} source
 * @returns {string[]}
 */
export function extractReferencesFromFile(filePath, source) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".html" || extension === ".htm") {
    return extractHtmlReferences(source);
  }
  if (extension === ".css") {
    return extractCssReferences(source);
  }
  if (extension === ".js" || extension === ".mjs") {
    return extractJsReferences(source);
  }
  return [];
}

/**
 * Recorre recursivamente `rootDirectory` y devuelve las rutas absolutas
 * de todos los archivos cuya extension esta en `extensions`.
 *
 * @param {string} rootDirectory
 * @param {string[]} extensions
 * @returns {Promise<string[]>}
 */
export async function collectBuildFiles(rootDirectory, extensions = SCANNED_EXTENSIONS) {
  const results = [];

  async function walk(currentDirectory) {
    const entries = await readdir(currentDirectory, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        await walk(entryPath);
      } else if (extensions.includes(path.extname(entry.name).toLowerCase())) {
        results.push(entryPath);
      }
    }
  }

  await walk(rootDirectory);
  return results;
}

function isAbsoluteSystemPath(reference) {
  if (/^[a-zA-Z]:[\\/]/.test(reference)) {
    // Windows: C:\... o C:/...
    return true;
  }
  if (reference.startsWith("/")) {
    // Unix: cualquier ruta que empiece por / fuera de ./ o ../
    return true;
  }
  return false;
}

function isOutsideBuildRoot(buildRoot, resolvedPath) {
  const relative = path.relative(buildRoot, resolvedPath);
  return relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
}

async function resourceExistsAsFile(targetPath) {
  try {
    const fileStats = await stat(targetPath);
    return fileStats.isFile();
  } catch {
    return false;
  }
}

/**
 * Clasifica una unica referencia extraida de `filePath` y determina si
 * constituye una violacion de la politica de build. Devuelve `null`
 * cuando la referencia es valida (o no aplica, como `data:` URIs o
 * anclas internas `#...`).
 *
 * @param {string} buildRoot
 * @param {string} filePath
 * @param {string} rawReference
 * @returns {Promise<{ type: string, file: string, reference: string } | null>}
 */
export async function classifyReference(buildRoot, filePath, rawReference) {
  const reference = rawReference.trim();
  const relativeFilePath = path.relative(buildRoot, filePath);

  if (reference === "" || reference.startsWith("data:") || reference.startsWith("#")) {
    return null;
  }

  if (/^https?:\/\//i.test(reference)) {
    return { type: "remote-url", file: relativeFilePath, reference };
  }
  if (/^file:\/\//i.test(reference)) {
    return { type: "file-protocol", file: relativeFilePath, reference };
  }
  if (isAbsoluteSystemPath(reference)) {
    return { type: "absolute-path", file: relativeFilePath, reference };
  }

  const resolvedPath = path.resolve(path.dirname(filePath), reference);

  if (isOutsideBuildRoot(buildRoot, resolvedPath)) {
    return { type: "path-escape", file: relativeFilePath, reference };
  }

  const exists = await resourceExistsAsFile(resolvedPath);
  if (!exists) {
    return { type: "missing-resource", file: relativeFilePath, reference };
  }

  return null;
}

/**
 * Analiza todos los archivos HTML/CSS/JS de `buildRoot` y devuelve la
 * lista de violaciones encontradas (vacia si el build es valido).
 *
 * @param {string} buildRoot
 * @returns {Promise<Array<{ type: string, file: string, reference: string }>>}
 */
export async function findBuildOutputViolations(buildRoot) {
  const violations = [];
  const files = await collectBuildFiles(buildRoot);

  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");
    const references = extractReferencesFromFile(filePath, source);

    for (const reference of references) {
      const violation = await classifyReference(buildRoot, filePath, reference);
      if (violation !== null) {
        violations.push(violation);
      }
    }
  }

  return violations;
}

/**
 * Verifica el build generado en `buildRoot` y lanza un `Error` con el
 * detalle de todas las violaciones encontradas si hay alguna. No hace
 * nada (resuelve sin valor) si el build es valido.
 *
 * @param {string} buildRoot
 * @returns {Promise<void>}
 */
export async function verifyBuildOutput(buildRoot) {
  const violations = await findBuildOutputViolations(buildRoot);

  if (violations.length > 0) {
    const details = violations
      .map((violation) => `  [${violation.type}] ${violation.file}: "${violation.reference}"`)
      .join("\n");
    throw new Error(
      `El build generado en ${buildRoot} contiene referencias de carga invalidas para el empaquetado local:\n${details}`
    );
  }
}
