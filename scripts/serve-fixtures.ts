import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse
} from "node:http";
import { extname, resolve, sep } from "node:path";
import process from "node:process";

const root = resolve("fixtures/static");
const port = Number(process.env.A11Y_FIXTURE_PORT ?? "4173");
const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url ?? "/", "http://fixture.invalid").pathname
    );
    const requested = resolve(
      root,
      `.${pathname === "/" ? "/gallery-broken.html" : pathname}`
    );
    if (requested !== root && !requested.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    if (!(await stat(requested)).isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "content-type":
        contentTypes[extname(requested)] ?? "application/octet-stream",
      "cache-control": "no-store",
      "content-security-policy":
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
    });
    createReadStream(requested).pipe(response);
  } catch {
    response
      .writeHead(404, { "content-type": "text/plain; charset=utf-8" })
      .end("Not found");
  }
}

const server = createServer((request, response) => {
  void handleRequest(request, response);
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(
    `Fixture server: http://127.0.0.1:${port}/gallery-broken.html\n`
  );
});

function close(): void {
  server.close(() => process.exit(0));
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
