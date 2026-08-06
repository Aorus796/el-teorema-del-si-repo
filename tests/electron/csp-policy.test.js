import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  extractCspMetaContent,
  parseCspDirectives,
  validateCspContent,
} from "../../tools/contentSecurityPolicy.mjs";

// La verificacion de que builds/browser/index.html conserva la misma CSP
// tras el build vive dentro de tools/build.mjs (assertContentSecurityPolicyShipped,
// llamada al final del propio build, mismo patron que assertEpilogueThemeShipped
// y verifyBuildOutput): npm run check ejecuta test && build, en ese orden,
// asi que ningun test bajo tests/ puede depender de que builds/browser ya
// exista en un checkout limpio. Aqui solo se prueba: (a) el index.html
// fuente del repositorio, que si existe siempre, y (b) la logica de
// extraccion/validacion contra fixtures sinteticos.

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const REQUIRED_CONTENT =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; " +
  "media-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; " +
  "base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'; " +
  "manifest-src 'none';";

test("the source index.html includes a Content-Security-Policy meta tag", async () => {
  const html = await readFile(path.join(repoRoot, "index.html"), "utf8");
  const cspContent = extractCspMetaContent(html);

  assert.notEqual(cspContent, null);
  assert.deepEqual(validateCspContent(cspContent), []);
});

test("extractCspMetaContent returns the content attribute value", () => {
  const html = `<!doctype html><html><head><meta charset="UTF-8" /><meta http-equiv="Content-Security-Policy" content="${REQUIRED_CONTENT}" /></head><body></body></html>`;
  assert.equal(extractCspMetaContent(html), REQUIRED_CONTENT);
});

test("extractCspMetaContent returns null when no CSP meta tag exists", () => {
  const html = `<!doctype html><html><head><meta charset="UTF-8" /></head><body></body></html>`;
  assert.equal(extractCspMetaContent(html), null);
});

test("parseCspDirectives splits directives and values", () => {
  const directives = parseCspDirectives("default-src 'self'; connect-src 'none';");
  assert.deepEqual(directives, {
    "default-src": ["'self'"],
    "connect-src": ["'none'"],
  });
});

test("validateCspContent accepts the exact required policy", () => {
  assert.deepEqual(validateCspContent(REQUIRED_CONTENT), []);
});

test("validateCspContent rejects 'unsafe-eval' in script-src", () => {
  const violations = validateCspContent(
    REQUIRED_CONTENT.replace("script-src 'self';", "script-src 'self' 'unsafe-eval';")
  );
  assert.ok(violations.length > 0);
  assert.ok(violations.some((v) => v.includes("unsafe-eval")));
});

test("validateCspContent rejects 'unsafe-inline' in style-src", () => {
  const violations = validateCspContent(
    REQUIRED_CONTENT.replace("style-src 'self';", "style-src 'self' 'unsafe-inline';")
  );
  assert.ok(violations.length > 0);
  assert.ok(violations.some((v) => v.includes("unsafe-inline")));
});

test("validateCspContent rejects a remote domain in script-src", () => {
  const violations = validateCspContent(
    REQUIRED_CONTENT.replace("script-src 'self';", "script-src 'self' https://cdn.example.com;")
  );
  assert.ok(violations.some((v) => v.includes("script-src")));
});

test("validateCspContent rejects a wildcard source", () => {
  const violations = validateCspContent(REQUIRED_CONTENT.replace("connect-src 'none';", "connect-src *;"));
  assert.ok(violations.some((v) => v.includes("connect-src")));
});

test("validateCspContent requires script-src and style-src to be exactly 'self'", () => {
  assert.ok(
    validateCspContent(REQUIRED_CONTENT.replace("script-src 'self';", "script-src 'self' https:;")).some((v) =>
      v.includes("script-src")
    )
  );
  assert.ok(
    validateCspContent(REQUIRED_CONTENT.replace("style-src 'self';", "style-src *;")).some((v) =>
      v.includes("style-src")
    )
  );
});

test("validateCspContent requires connect-src, object-src, frame-src and worker-src to be 'none'", () => {
  for (const directive of ["connect-src", "object-src", "frame-src", "worker-src"]) {
    const weakened = REQUIRED_CONTENT.replace(`${directive} 'none';`, `${directive} 'self';`);
    const violations = validateCspContent(weakened);
    assert.ok(
      violations.some((v) => v.includes(directive)),
      `expected a violation for ${directive}`
    );
  }
});

test("validateCspContent requires img-src to allow only 'self' and data:", () => {
  assert.deepEqual(validateCspContent(REQUIRED_CONTENT), []);

  const missingData = REQUIRED_CONTENT.replace("img-src 'self' data:;", "img-src 'self';");
  assert.ok(validateCspContent(missingData).some((v) => v.includes("img-src")));

  const extraRemote = REQUIRED_CONTENT.replace(
    "img-src 'self' data:;",
    "img-src 'self' data: https://example.com;"
  );
  assert.ok(validateCspContent(extraRemote).some((v) => v.includes("img-src")));
});

test("validateCspContent requires media-src and font-src to be exactly 'self'", () => {
  assert.ok(
    validateCspContent(REQUIRED_CONTENT.replace("media-src 'self';", "media-src 'self' data:;")).some((v) =>
      v.includes("media-src")
    )
  );
  assert.ok(
    validateCspContent(REQUIRED_CONTENT.replace("font-src 'self';", "font-src *;")).some((v) =>
      v.includes("font-src")
    )
  );
});

test("validateCspContent flags a missing required directive", () => {
  const withoutObjectSrc = REQUIRED_CONTENT.replace("object-src 'none'; ", "");
  const violations = validateCspContent(withoutObjectSrc);
  assert.ok(violations.some((v) => v.includes("object-src")));
});
