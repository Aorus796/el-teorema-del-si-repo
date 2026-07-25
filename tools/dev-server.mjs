import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const rootArgument = process.argv[2] ?? ".";
const portArgument = process.argv[3] ?? "5173";
const host = process.env.HOST ?? "127.0.0.1";
const rootDirectory = resolve(process.cwd(), rootArgument);
const port = Number.parseInt(portArgument, 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Puerto no valido: ${portArgument}`);
}

if (!existsSync(rootDirectory) || !statSync(rootDirectory).isDirectory()) {
  throw new Error(`No existe el directorio: ${rootDirectory}`);
}

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".ogg", "audio/ogg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".wav", "audio/wav"],
  [".webp", "image/webp"],
]);

const server = createServer((request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
    const normalizedPath = normalize(relativePath);
    const absolutePath = resolve(rootDirectory, normalizedPath);

    if (
      absolutePath !== rootDirectory &&
      !absolutePath.startsWith(`${rootDirectory}${sep}`)
    ) {
      sendText(response, 403, "Acceso denegado");
      return;
    }

    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      sendText(response, 404, "Recurso no encontrado");
      return;
    }

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type":
        mimeTypes.get(extname(absolutePath).toLowerCase()) ??
        "application/octet-stream",
    });

    createReadStream(absolutePath).pipe(response);
  } catch (error) {
    console.error(error);
    sendText(response, 500, "Error interno del servidor");
  }
});

server.listen(port, host, () => {
  console.log(`Sirviendo ${rootDirectory}`);
  console.log(`Abre http://127.0.0.1:${port}`);
});

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end(text);
}
