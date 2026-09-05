import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse
} from "node:http";
import { extname, resolve, sep } from "node:path";

export async function startFixtureServer(
  directory = "fixtures/static"
): Promise<{
  origin: string;
  close: () => Promise<void>;
}> {
  const root = resolve(directory);
  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url ?? "/", "http://fixture.invalid").pathname
      );
      const requested = resolve(
        root,
        `.${pathname === "/" ? "/index.html" : pathname}`
      );
      if (
        !requested.startsWith(`${root}${sep}`) ||
        !(await stat(requested)).isFile()
      )
        throw new Error("Not found");
      const type =
        extname(requested) === ".html"
          ? "text/html"
          : extname(requested) === ".js"
            ? "text/javascript"
            : extname(requested) === ".css"
              ? "text/css"
              : "image/svg+xml";
      response.writeHead(200, {
        "content-type": `${type}; charset=utf-8`,
        "cache-control": "no-store"
      });
      createReadStream(requested).pipe(response);
    } catch {
      response.writeHead(404).end("Not found");
    }
  };
  const server: Server = createServer((request, response) => {
    void handleRequest(request, response);
  });
  await new Promise<void>((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Fixture server did not bind to TCP.");
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolvePromise, reject) =>
        server.close((error) => (error ? reject(error) : resolvePromise()))
      )
  };
}
