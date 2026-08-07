// Politica de Content-Security-Policy exigida para el shell Electron y la
// version web. Modulo puro (sin importar "electron"), reutilizable tanto
// por la aserta que corre al final de tools/build.mjs contra el build real
// generado, como por las pruebas unitarias contra fixtures sinteticos.

// El valor de `content` puede contener comillas simples legitimas (los
// tokens de CSP como 'self'/'none' siempre las llevan), así que el
// delimitador del atributo (comilla simple o doble) se captura con una
// referencia hacia atrás en vez de excluir ambos tipos de comilla del
// contenido — de lo contrario, un `content="...'self'..."` se corta en la
// primera comilla simple interna.
const CSP_META_PATTERN =
  /<meta\s+http-equiv=(["'])Content-Security-Policy\1\s+content=(["'])([\s\S]*?)\2\s*\/?>/i;

/**
 * Extrae el valor del atributo `content` de la meta etiqueta
 * `Content-Security-Policy` de un documento HTML. Devuelve `null` si no
 * existe ninguna.
 *
 * @param {string} html
 * @returns {string | null}
 */
export function extractCspMetaContent(html) {
  const match = html.match(CSP_META_PATTERN);
  return match ? match[3].trim() : null;
}

/**
 * Convierte el contenido de una CSP (`"directiva valor valor; directiva2 ..."`)
 * en un mapa `{ directiva: [valores] }`. No valida nada por si mismo.
 *
 * @param {string} cspContent
 * @returns {Record<string, string[]>}
 */
export function parseCspDirectives(cspContent) {
  const directives = {};

  for (const rawDirective of cspContent.split(";")) {
    const trimmed = rawDirective.trim();
    if (trimmed === "") continue;

    const [name, ...values] = trimmed.split(/\s+/);
    directives[name.toLowerCase()] = values;
  }

  return directives;
}

const REQUIRES_ONLY_SELF = ["script-src", "style-src", "media-src", "font-src", "default-src"];
const REQUIRES_NONE = [
  "connect-src",
  "object-src",
  "base-uri",
  "form-action",
  "frame-src",
  "worker-src",
  "manifest-src",
];
const FORBIDDEN_SOURCE_TOKENS = [
  "'unsafe-eval'",
  "'unsafe-inline'",
  "*",
  "http:",
  "https:",
  "data:",
];

/**
 * Valida el contenido de una CSP contra la politica estricta exigida por
 * `docs/production/WINDOWS_PACKAGING_DECISION.md` (sin unsafe-eval, sin
 * unsafe-inline, sin dominios remotos, sin comodines, sin `data:` para
 * scripts/estilos, script-src y style-src limitados a `'self'`,
 * connect-src/object-src/base-uri/form-action/frame-src/worker-src/
 * manifest-src en `'none'`, img-src limitado a `'self' data:`, media-src y
 * font-src limitados a `'self'`).
 *
 * @param {string} cspContent
 * @returns {string[]} Lista de violaciones encontradas; vacia si es valida.
 */
export function validateCspContent(cspContent) {
  const violations = [];
  const directives = parseCspDirectives(cspContent);

  for (const name of [...REQUIRES_ONLY_SELF, ...REQUIRES_NONE, "img-src"]) {
    if (!(name in directives)) {
      violations.push(`Falta la directiva obligatoria "${name}".`);
    }
  }

  for (const name of REQUIRES_ONLY_SELF) {
    const values = directives[name];
    if (!values) continue;
    if (values.length !== 1 || values[0] !== "'self'") {
      violations.push(`"${name}" debe ser exactamente "'self'", encontrado: "${values.join(" ")}".`);
    }
  }

  for (const name of REQUIRES_NONE) {
    const values = directives[name];
    if (!values) continue;
    if (values.length !== 1 || values[0] !== "'none'") {
      violations.push(`"${name}" debe ser exactamente "'none'", encontrado: "${values.join(" ")}".`);
    }
  }

  const imgSrc = directives["img-src"];
  if (imgSrc) {
    const allowed = new Set(["'self'", "data:"]);
    const hasOnlyAllowed = imgSrc.every((value) => allowed.has(value));
    const hasBoth = imgSrc.includes("'self'") && imgSrc.includes("data:");
    if (!hasOnlyAllowed || !hasBoth || imgSrc.length !== 2) {
      violations.push(`"img-src" debe ser exactamente "'self' data:", encontrado: "${imgSrc.join(" ")}".`);
    }
  }

  for (const [name, values] of Object.entries(directives)) {
    for (const token of values) {
      if (FORBIDDEN_SOURCE_TOKENS.includes(token) && !(name === "img-src" && token === "data:")) {
        violations.push(`"${name}" contiene el token prohibido "${token}".`);
      }
    }
  }

  return violations;
}
