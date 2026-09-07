// Records docs/demo.gif, the clip in the README, by driving the demo page's
// own timeline in a real browser and encoding the frames with ffmpeg.
//
// The painting is deterministic, so the recorder never waits on the clock: for
// each frame it scrubs the timeline to the stroke count the page's schedule
// would have reached at that moment, screenshots the canvas, and moves on. A
// 45-second painting becomes a 6-second clip with a hold on the finished
// picture, and the frames are exact rather than whatever a screen capture
// happened to catch.
//
// FPS divides 100 because a GIF frame delay is a whole number of centiseconds;
// 20 fps is 5 cs per frame exactly.
//
// Requires ffmpeg on PATH. Run `npm run build` first, then `npm run gif`.

import {spawn} from 'node:child_process';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {createSchedule} from '../dist/index.js';
import {serveDocs} from '../test/serve.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(root, 'docs/demo.gif');

const PHOTO = process.env.PHOTO ?? 'golden';
/** How long the page itself takes; must match DURATION_MS in src/demo/main.ts. */
const PAGE_SECONDS = 45;
const FPS = 20;
const PAINT_SECONDS = 6;
const HOLD_SECONDS = 1.5;
const WIDTH = 500;

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: ['ignore', 'ignore', 'inherit']});
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)),
    );
  });

const site = await serveDocs();
const frames = await mkdtemp(join(tmpdir(), 'painterly-frames-'));
const browser = await chromium.launch();

try {
  const page = await browser.newPage({viewport: {width: 1400, height: 1400}, deviceScaleFactor: 1});
  await page.goto(`${site.url}/#photo=${PHOTO}&seed=1`);
  await page.getByRole('button', {name: 'Pause'}).waitFor({timeout: 60_000});
  await page.getByRole('button', {name: 'Pause'}).click();
  const timeline = page.getByRole('slider', {name: 'Timeline'});
  const canvas = page.locator('canvas');

  // The page's own pacing: rebuild its schedule from the layer sizes it
  // publishes on the timeline, then compress 45 s into the clip with a curve
  // that keeps the underpainting on screen long enough to read.
  const total = await timeline.evaluate((input) => Number(input.max));
  const layerSizes = await timeline.evaluate((input) =>
    input.dataset.layers.split(',').map(Number),
  );
  const schedule = createSchedule({layerSizes, strokes: {length: total}}, PAGE_SECONDS * 1000);
  const paintFrames = PAINT_SECONDS * FPS;
  const holdFrames = HOLD_SECONDS * FPS;
  let frame = 0;
  for (let i = 0; i <= paintFrames; i++) {
    const t = i / paintFrames;
    const count = schedule.strokesAt(PAGE_SECONDS * 1000 * t ** 1.6);
    await timeline.evaluate((input, value) => {
      input.value = String(value);
      input.dispatchEvent(new Event('input', {bubbles: true}));
      // The canvas catches up over frames rather than in one block, so wait for it.
      return new Promise((resolve) => {
        const check = () =>
          input.dataset.painted === input.value ? resolve() : requestAnimationFrame(check);
        requestAnimationFrame(check);
      });
    }, count);
    await canvas.screenshot({path: join(frames, `f${String(frame++).padStart(4, '0')}.png`)});
  }
  const last = frame - 1;
  for (let i = 0; i < holdFrames; i++) {
    await run('cp', [
      join(frames, `f${String(last).padStart(4, '0')}.png`),
      join(frames, `f${String(frame++).padStart(4, '0')}.png`),
    ]);
  }

  const palette = join(frames, 'palette.png');
  const scale = `scale=${WIDTH}:-1:flags=lanczos`;
  const input = ['-framerate', String(FPS), '-i', join(frames, 'f%04d.png')];
  await run('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    ...input,
    '-vf',
    `${scale},palettegen=max_colors=112:stats_mode=diff`,
    palette,
  ]);
  await run('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    ...input,
    '-i',
    palette,
    '-lavfi',
    `${scale}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,
    '-loop',
    '0',
    OUTPUT,
  ]);
  console.log(
    `docs/demo.gif: ${frame} frames, ${frame / FPS}s at ${FPS}fps, ${total} strokes, photo ${PHOTO}`,
  );
} finally {
  await browser.close();
  await site.close();
  if (!process.env.KEEP_FRAMES) await rm(frames, {recursive: true, force: true});
}
