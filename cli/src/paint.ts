#!/usr/bin/env node
// painterly on the command line: a photo in, a painting out.
//
//   painterly photo.jpg                      ~/Downloads/photo-oil.jpg
//   painterly photo.jpg --style gouache      ~/Downloads/photo-gouache.jpg
//   painterly photo.heic --style watercolor --size 2400 --seed 3 --out park.jpg --open
import {execFileSync} from 'node:child_process';
import {existsSync, writeFileSync} from 'node:fs';
import {availableParallelism, homedir} from 'node:os';
import {basename, extname, join, resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {createBandPool} from './bands.ts';
import {illustrate} from './illustrate.ts';
import {encodeJpeg, loadPhoto} from './photo.ts';
import {isStyleName, styles} from './styles.ts';

const names = Object.keys(styles).join('|');
const usage = `usage: painterly <photo> [--style ${names}] [--size 1800] [--seed 1] [--out file.jpg] [--open]

  --style  oil (matte oil, the default), gouache, or watercolor (ink line and wash)
  --size   pixels on the longer side of the painting
  --seed   same photo, same seed, same painting
  --out    where to write the JPEG; ~/Downloads/<photo>-<style>.jpg by default
  --open   open it when it is done`;

async function main(): Promise<void> {
  const {values, positionals} = parseArgs({
    allowPositionals: true,
    options: {
      style: {type: 'string', default: 'oil'},
      size: {type: 'string', default: '1800'},
      seed: {type: 'string', default: '1'},
      out: {type: 'string'},
      open: {type: 'boolean', default: false},
      help: {type: 'boolean', short: 'h', default: false},
    },
  });
  const [input] = positionals;
  if (values.help || !input) {
    console.log(usage);
    process.exit(values.help ? 0 : 1);
  }

  const {style} = values;
  const size = Number(values.size);
  const seed = Number(values.seed);
  if (!existsSync(input)) throw new Error(`no such photo: ${input}`);
  if (!isStyleName(style)) throw new Error(`--style must be one of ${names}, got ${style}`);
  if (!(size >= 64 && size <= 8000)) throw new Error(`--size must be 64..8000, got ${values.size}`);
  if (!Number.isInteger(seed)) throw new Error(`--seed must be a whole number, got ${values.seed}`);
  const output = resolve(
    values.out ?? join(homedir(), 'Downloads', `${basename(input, extname(input))}-${style}.jpg`),
  );

  const clock = stopwatch();
  const pool = createBandPool(Math.min(8, availableParallelism()));
  try {
    const photo = await loadPhoto(resolve(input), size);
    clock.lap(`loaded ${photo.width} × ${photo.height}`);
    const {image} = await illustrate(photo, style, {seed, pool, onStage: clock.lap});
    writeFileSync(output, await encodeJpeg(image));
    clock.lap(`finished in ${styles[style].label}`);
  } finally {
    pool.close();
  }

  console.log(output);
  if (values.open) execFileSync('open', [output]);
}

/** Progress on stderr, each line with the time since the last, so stdout is only the path. */
function stopwatch() {
  let last = performance.now();
  return {
    lap(what: string) {
      const now = performance.now();
      process.stderr.write(`  ${what} (${((now - last) / 1000).toFixed(1)} s)\n`);
      last = now;
    },
  };
}

main().catch((error: Error) => {
  console.error(`painterly: ${error.message}`);
  process.exit(1);
});
