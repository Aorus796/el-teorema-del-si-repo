import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import os from "node:os";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import {
  extractHtmlReferences,
  extractCssReferences,
  extractJsReferences,
  classifyReference,
  findBuildOutputViolations,
  verifyBuildOutput,
} from "../../tools/verifyBuildOutput.mjs";

// Estas pruebas ejercitan exclusivamente la LOGICA de deteccion del
// validador de build (tools/verifyBuildOutput.mjs) contra fixtures
// sinteticos construidos en directorios temporales fuera del repositorio
// (node:os.tmpdir()). Ninguna depende de que builds/browser ya exista:
// npm run check ejecuta test && build, en ese orden, y builds/browser
// solo existe DESPUES del build.

async function createTempBuildRoot() {
  return mkdtemp(path.join(os.tmpdir(), "el-teorema-del-si-build-verify-"));
}

async function withTempBuildRoot(run) {
  const buildRoot = await createTempBuildRoot();
  try {
    await run(buildRoot);
  } finally {
    await rm(buildRoot, { recursive: true, force: true });
  }
}

// --- extraccion de especificadores reales de carga ---

test("extractHtmlReferences finds script src, link href, img src, and audio/video/source src", () => {
  const html = `
    <script type="module" src="./src/main.js"></script>
    <link rel="stylesheet" href="./src/styles/main.css" />
    <img src="./src/assets/logo.png" />
    <audio src="./src/assets/audio/theme.wav"></audio>
    <video src="./src/assets/video/intro.mp4"></video>
    <source src="./src/assets/audio/theme-alt.ogg" />
  `;

  const references = extractHtmlReferences(html).sort();

  assert.deepEqual(references, [
    "./src/assets/audio/theme-alt.ogg",
    "./src/assets/audio/theme.wav",
    "./src/assets/logo.png",
    "./src/assets/video/intro.mp4",
    "./src/main.js",
    "./src/styles/main.css",
  ]);
});

test("extractHtmlReferences does not pick up dialogue text or comments", () => {
  const html = `
    <!-- src="https://not-a-real-attribute.example.com/should-be-ignored.js" -->
    <p>Este texto de dialogo menciona una url como https://example.com pero no es un atributo.</p>
  `;

  assert.deepEqual(extractHtmlReferences(html), []);
});

test("extractCssReferences finds quoted and unquoted url(...) references", () => {
  const css = `
    .a { background: url("./fonts/a.woff2"); }
    .b { background: url('./fonts/b.woff2'); }
    .c { background: url(./fonts/c.woff2); }
  `;

  const references = extractCssReferences(css);

  assert.deepEqual(references, ["./fonts/a.woff2", "./fonts/b.woff2", "./fonts/c.woff2"]);
});

test("extractJsReferences finds static and dynamic import specifiers", () => {
  const js = `
import { foo } from "./foo.js";
import "./sideEffect.js";
const mod = await import("./lazy.js");
`;

  const references = extractJsReferences(js).sort();

  assert.deepEqual(references, ["./foo.js", "./lazy.js", "./sideEffect.js"]);
});

test("extractJsReferences ignores the word 'import' embedded mid-line inside content strings, not used as a real specifier", () => {
  const js = `export const TEXT = "Esto no es una sentencia import de verdad";`;

  assert.deepEqual(extractJsReferences(js), []);
});

// --- clasificacion de violaciones individuales ---

test("classifyReference flags http:// and https:// references as remote-url violations", async () => {
  await withTempBuildRoot(async (buildRoot) => {
    const filePath = path.join(buildRoot, "index.html");

    const httpViolation = await classifyReference(buildRoot, filePath, "http://example.com/a.js");
    const httpsViolation = await classifyReference(
      buildRoot,
      filePath,
      "https://example.com/b.js"
    );

    assert.equal(httpViolation.type, "remote-url");
    assert.equal(httpsViolation.type, "remote-url");
  });
});

test("classifyReference flags file:// literals as file-protocol violations", async () => {
  await withTempBuildRoot(async (buildRoot) => {
    const filePath = path.join(buildRoot, "index.html");

    const violation = await classifyReference(
      buildRoot,
      filePath,
      "file:///C:/builds/browser/src/main.js"
    );

    assert.equal(violation.type, "file-protocol");
  });
});

test("classifyReference flags Windows absolute paths as absolute-path violations", async () => {
  await withTempBuildRoot(async (buildRoot) => {
    const filePath = path.join(buildRoot, "index.html");

    const backslashViolation = await classifyReference(
      buildRoot,
      filePath,
      "C:\\Windows\\System32\\foo.dll"
    );
    const forwardSlashViolation = await classifyReference(
      buildRoot,
      filePath,
      "C:/Windows/foo.dll"
    );

    assert.equal(backslashViolation.type, "absolute-path");
    assert.equal(forwardSlashViolation.type, "absolute-path");
  });
});

test("classifyReference flags Unix absolute paths as absolute-path violations", async () => {
  await withTempBuildRoot(async (buildRoot) => {
    const filePath = path.join(buildRoot, "index.html");

    const violation = await classifyReference(buildRoot, filePath, "/etc/passwd");

    assert.equal(violation.type, "absolute-path");
  });
});

test("classifyReference flags a missing local resource as missing-resource", async () => {
  await withTempBuildRoot(async (buildRoot) => {
    const filePath = path.join(buildRoot, "index.html");

    const violation = await classifyReference(buildRoot, filePath, "./src/does-not-exist.js");

    assert.equal(violation.type, "missing-resource");
  });
});

test("classifyReference flags a reference that escapes buildRoot after normalizing ../ as path-escape", async () => {
  await withTempBuildRoot(async (buildRoot) => {
    const nestedDir = path.join(buildRoot, "src");
    await mkdir(nestedDir, { recursive: true });
    const filePath = path.join(nestedDir, "main.js");

    // Existe realmente fuera de buildRoot, pero eso no debe importar: la
    // fuga en si misma es la violacion.
    const outsideDir = await mkdtemp(path.join(os.tmpdir(), "el-teorema-del-si-outside-"));
    try {
      await writeFile(path.join(outsideDir, "leak.js"), "export const x = 1;\n");
      const relativeLeak = path
        .relative(nestedDir, path.join(outsideDir, "leak.js"))
        .split(path.sep)
        .join("/");

      const violation = await classifyReference(buildRoot, filePath, relativeLeak);

      assert.equal(violation.type, "path-escape");
    } finally {
      await rm(outsideDir, { recursive: true, force: true });
    }
  });
});

test("classifyReference returns null (valid) for a relative reference to an existing local resource inside buildRoot", async () => {
  await withTempBuildRoot(async (buildRoot) => {
    const nestedDir = path.join(buildRoot, "src");
    await mkdir(nestedDir, { recursive: true });
    await writeFile(path.join(nestedDir, "main.js"), "export const x = 1;\n");

    const filePath = path.join(buildRoot, "index.html");
    const violation = await classifyReference(buildRoot, filePath, "./src/main.js");

    assert.equal(violation, null);
  });
});

test("classifyReference returns null (valid) for a ../ reference that stays inside buildRoot", async () => {
  await withTempBuildRoot(async (buildRoot) => {
    const nestedDir = path.join(buildRoot, "src");
    await mkdir(nestedDir, { recursive: true });
    await writeFile(path.join(buildRoot, "sibling.js"), "export const x = 1;\n");

    const filePath = path.join(nestedDir, "main.js");
    const violation = await classifyReference(buildRoot, filePath, "../sibling.js");

    assert.equal(violation, null);
  });
});

test("classifyReference ignores data: URIs and internal #anchors", async () => {
  await withTempBuildRoot(async (buildRoot) => {
    const filePath = path.join(buildRoot, "index.html");

    const dataViolation = await classifyReference(
      buildRoot,
      filePath,
      "data:image/png;base64,AAAA"
    );
    const anchorViolation = await classifyReference(buildRoot, filePath, "#some-anchor");

    assert.equal(dataViolation, null);
    assert.equal(anchorViolation, null);
  });
});

// --- integracion: build sintetico completo, valido e invalido ---

test("findBuildOutputViolations returns no violations for a fully valid synthetic build", async () => {
  await withTempBuildRoot(async (buildRoot) => {
    await mkdir(path.join(buildRoot, "src", "assets", "audio"), { recursive: true });
    await mkdir(path.join(buildRoot, "src", "styles"), { recursive: true });

    await writeFile(
      path.join(buildRoot, "index.html"),
      `<!doctype html>
<html>
  <head><link rel="stylesheet" href="./src/styles/main.css" /></head>
  <body>
    <audio src="./src/assets/audio/theme.wav"></audio>
    <script type="module" src="./src/main.js"></script>
  </body>
</html>`
    );
    await writeFile(
      path.join(buildRoot, "src", "styles", "main.css"),
      `.a { background: url("../assets/audio/theme.wav"); }`
    );
    await writeFile(
      path.join(buildRoot, "src", "main.js"),
      `import { helper } from "./helper.js";\nexport const start = () => helper();\n`
    );
    await writeFile(path.join(buildRoot, "src", "helper.js"), `export const helper = () => 1;\n`);
    await writeFile(path.join(buildRoot, "src", "assets", "audio", "theme.wav"), "RIFF....");

    const violations = await findBuildOutputViolations(buildRoot);

    assert.deepEqual(violations, []);
    await assert.doesNotReject(() => verifyBuildOutput(buildRoot));
  });
});

test("verifyBuildOutput throws with details when the synthetic build contains multiple violation types", async () => {
  await withTempBuildRoot(async (buildRoot) => {
    await mkdir(path.join(buildRoot, "src"), { recursive: true });

    await writeFile(
      path.join(buildRoot, "index.html"),
      `<!doctype html>
<html>
  <head><link rel="stylesheet" href="https://cdn.example.com/remote.css" /></head>
  <body>
    <script type="module" src="./src/main.js"></script>
    <img src="./src/missing-image.png" />
  </body>
</html>`
    );
    await writeFile(
      path.join(buildRoot, "src", "main.js"),
      `import { helper } from "../../outside-of-build.js";\n`
    );

    const violations = await findBuildOutputViolations(buildRoot);
    const types = violations.map((violation) => violation.type).sort();

    assert.deepEqual(types, ["missing-resource", "path-escape", "remote-url"]);
    await assert.rejects(() => verifyBuildOutput(buildRoot), /referencias de carga invalidas/);
  });
});
