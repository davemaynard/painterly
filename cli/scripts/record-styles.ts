// The README's picture of the command line's three styles: the photo, then the
// same photo in matte oil, gouache, and ink line and watercolor wash. Painted
// by the CLI's own pipeline, so it is always what the command makes.
//
//   npm run styles --prefix cli           # docs/styles.jpg
//
// PHOTO picks the subject; SEED picks the painting.
import {writeFileSync} from 'node:fs';
import {availableParallelism} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createCanvas} from '@napi-rs/canvas';
import type {Raster} from '../../dist/index.js';
import {createBandPool} from '../src/bands.ts';
import {illustrate} from '../src/illustrate.ts';
import {loadPhoto, rgba} from '../src/photo.ts';
import {type StyleName, styles} from '../src/styles.ts';

const docs = new URL('../../docs/', import.meta.url);
const PHOTO = process.env.PHOTO ?? 'golden';
const SEED = Number(process.env.SEED ?? '1');
/** Each panel is a 3:4 portrait, the demo photos' own shape; other shapes are center-cropped. */
const PANEL = {width: 540, height: 720};
const GUTTER = 12;
const ORDER: StyleName[] = ['oil', 'gouache', 'watercolor'];

const pool = createBandPool(Math.min(8, availableParallelism()));
try {
  const path = fileURLToPath(new URL(`photos/${PHOTO}.jpg`, docs));
  const photo = await loadPhoto(path, PANEL.height);
  const panels: Raster[] = [photo];
  for (const style of ORDER) {
    const {image, strokes} = await illustrate(photo, style, {seed: SEED, pool});
    console.log(`${styles[style].label}: ${strokes.toLocaleString()} strokes`);
    panels.push(image);
  }

  const width = panels.length * PANEL.width + (panels.length - 1) * GUTTER;
  const sheet = createCanvas(width, PANEL.height);
  const context = sheet.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, PANEL.height);
  for (const [n, panel] of panels.entries()) {
    const tile = createCanvas(panel.width, panel.height);
    const tileContext = tile.getContext('2d');
    const pixels = tileContext.createImageData(panel.width, panel.height);
    pixels.data.set(rgba(panel));
    tileContext.putImageData(pixels, 0, 0);
    const scale = Math.max(PANEL.width / panel.width, PANEL.height / panel.height);
    const shown = {width: PANEL.width / scale, height: PANEL.height / scale};
    context.drawImage(
      tile,
      (panel.width - shown.width) / 2,
      (panel.height - shown.height) / 2,
      shown.width,
      shown.height,
      n * (PANEL.width + GUTTER),
      0,
      PANEL.width,
      PANEL.height,
    );
  }

  const out = fileURLToPath(new URL('styles.jpg', docs));
  writeFileSync(out, await sheet.encode('jpeg', 86));
  console.log(out);
} finally {
  pool.close();
}
