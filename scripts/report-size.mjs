// The Numbers table in the README, regenerated. A table headed Numbers is an
// invitation to check them, so they should never be typed by hand again.

import {readFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const kb = async (...files) => {
  let bytes = 0;
  for (const file of files) bytes += gzipSync(await readFile(join(root, file))).byteLength;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

console.log(`Library, gzipped                       ${await kb('dist/index.js')}`);
console.log(
  `Demo page script and its worker        ${await kb('docs/painterly.js', 'docs/planner.js')}`,
);
