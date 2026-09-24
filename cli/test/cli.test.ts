import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {loadImage} from '@napi-rs/canvas';

const cli = fileURLToPath(new URL('../src/paint.ts', import.meta.url));
// The dog: 1050 × 1400, so a 240 px painting is 180 × 240.
const photo = fileURLToPath(new URL('../../docs/photos/golden.jpg', import.meta.url));
const out = mkdtempSync(join(tmpdir(), 'painterly-cli-'));

function paint(...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], {encoding: 'utf8'});
}

for (const style of ['oil', 'gouache', 'watercolor']) {
  test(`--style ${style} writes a painting of the requested size and prints its path`, async () => {
    const file = join(out, `${style}.jpg`);
    const run = paint(photo, '--style', style, '--size', '240', '--out', file);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout.trim(), file);
    const image = await loadImage(file);
    assert.deepEqual([image.width, image.height], [180, 240]);
  });
}

test('the same photo and seed paint the same file', () => {
  const a = join(out, 'a.jpg');
  const b = join(out, 'b.jpg');
  for (const file of [a, b]) {
    assert.equal(paint(photo, '--style', 'gouache', '--size', '200', '--out', file).status, 0);
  }
  assert.ok(readFileSync(a).equals(readFileSync(b)));
});

test('a style it does not know is a one-line error, not a stack trace', () => {
  const run = paint(photo, '--style', 'pastel');
  assert.equal(run.status, 1);
  assert.equal(
    run.stderr.trim(),
    'painterly: --style must be one of oil|gouache|watercolor, got pastel',
  );
});

test('a photo that is not there is a one-line error', () => {
  const run = paint(join(out, 'missing.jpg'));
  assert.equal(run.status, 1);
  assert.match(run.stderr.trim(), /^painterly: no such photo: /);
});
