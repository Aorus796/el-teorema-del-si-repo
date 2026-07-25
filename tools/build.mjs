import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const rootDirectory = process.cwd();
const outputDirectory = resolve(rootDirectory, "builds/browser");

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

await cp(resolve(rootDirectory, "index.html"), resolve(outputDirectory, "index.html"));
await cp(resolve(rootDirectory, "src"), resolve(outputDirectory, "src"), {
  recursive: true,
});

console.log(`Build estatico generado en ${outputDirectory}`);
