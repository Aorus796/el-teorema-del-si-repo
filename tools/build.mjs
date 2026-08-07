import { cp, mkdir, readFile, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { EPILOGUE_THEME_PATH } from "../src/content/epilogueAudioConfig.js";
import { verifyBuildOutput } from "./verifyBuildOutput.mjs";
import { extractCspMetaContent, validateCspContent } from "./contentSecurityPolicy.mjs";

const rootDirectory = process.cwd();
const outputDirectory = resolve(rootDirectory, "builds/browser");

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

await cp(resolve(rootDirectory, "index.html"), resolve(outputDirectory, "index.html"));
await cp(resolve(rootDirectory, "src"), resolve(outputDirectory, "src"), {
  recursive: true,
});

await assertEpilogueThemeShipped(outputDirectory);
await assertContentSecurityPolicyShipped(outputDirectory);
await verifyBuildOutput(outputDirectory);

console.log(`Build estatico generado en ${outputDirectory}`);

async function assertContentSecurityPolicyShipped(buildOutputDirectory) {
  const outputPath = resolve(buildOutputDirectory, "index.html");
  const html = await readFile(outputPath, "utf8");
  const cspContent = extractCspMetaContent(html);

  if (cspContent === null) {
    throw new Error(
      `El build generado no incluye una meta etiqueta Content-Security-Policy: ${outputPath}`,
    );
  }

  const violations = validateCspContent(cspContent);
  if (violations.length > 0) {
    throw new Error(
      `La Content-Security-Policy del build generado no cumple la politica exigida:\n${violations.join("\n")}`,
    );
  }
}

async function assertEpilogueThemeShipped(buildOutputDirectory) {
  const relativePath = EPILOGUE_THEME_PATH.replace(/^\.\//, "");
  const outputPath = resolve(buildOutputDirectory, relativePath);
  const fileStats = await stat(outputPath).catch(() => null);

  if (!fileStats || !fileStats.isFile() || fileStats.size === 0) {
    throw new Error(
      `El recurso musical del epílogo (EPILOGUE_THEME_PATH) no se generó en el build: ${outputPath}`,
    );
  }
}
