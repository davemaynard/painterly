// A static server over docs/, for the browser tests and the GIF recorder. The
// published page is exactly these files, so testing them here tests the deploy.

import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {dirname, extname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const docs = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
};

/** Starts serving docs/ on a free port; resolves to {url, close}. */
export async function serveDocs() {
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, 'http://localhost').pathname;
      const file = join(docs, pathname === '/' ? 'index.html' : pathname);
      const body = await readFile(file);
      response.writeHead(200, {'content-type': types[extname(file)] ?? 'application/octet-stream'});
      response.end(body);
    } catch {
      response.writeHead(404).end('not found');
    }
  });
  await new Promise((resolve) => server.listen(0, resolve));
  return {
    url: `http://localhost:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
