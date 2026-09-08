// Records a clip of the demo painting itself, by driving the page's own
// timeline in a real browser and encoding the frames with ffmpeg.
//
// The painting is deterministic, so the recorder never waits on the clock: for
// each frame it scrubs the timeline to the stroke count the page's schedule
// would have reached at that moment, screenshots the canvas, and moves on. A
// 45-second painting becomes a short clip with a hold on the finished picture,
// and the frames are exact rather than whatever a screen capture happened to
// catch.
//
// Two formats, because the two readers want different things:
//   gif  — README embeds, which cannot play video. 20 fps divides 100, because
//          a GIF frame delay is a whole number of centiseconds.
//   mp4  — a web page, which can, at roughly a tenth of the bytes.
//
// Requires ffmpeg on PATH. Run `npm run build` first, then:
//   npm run gif
//   npm run clip -- --photo boats --out ../davemaynard.dev/public/assets/…mp4

import {spawn} from 'node:child_process';
import {copyFile, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {createSchedule} from '../dist/index.js';
import {serveDocs} from '../test/serve.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const FORMATS = {
  gif: {fps: 20, paintSeconds: 6, holdSeconds: 1.5, width: 500, out: 'docs/demo.gif'},
  mp4: {fps: 30, paintSeconds: 8, holdSeconds: 2, width: 1200, out: 'docs/demo.mp4', crf: 26},
};

// A flat --key value parser; the script has four options and no flags.
const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i].replace(/^--/, ''), process.argv[i + 1]);
}

const format = args.get('format') ?? 'gif';
if (!FORMATS[format]) throw new Error(`unknown --format ${format}, expected gif or mp4`);
const {fps, paintSeconds, holdSeconds, width: defaultWidth, out, crf} = FORMATS[format];

const photo = args.get('photo') ?? 'golden';
const width = Number(args.get('width') ?? defaultWidth);
const output = resolve(root, args.get('out') ?? out);

// Screenshot above the encode width so the downscale has pixels to lose, and
// the strokes stay crisp instead of smearing into the JPEG-ish mush an upscale
// would produce.
const deviceScaleFactor = format === 'mp4' ? 2 : 1;

const run = (command, commandArgs) =>
  new Promise((ok, fail) => {
    const child = spawn(command, commandArgs, {stdio: ['ignore', 'ignore', 'inherit']});
    child.on('error', fail);
    child.on('close', (code) => (code === 0 ? ok() : fail(new Error(`${command} exited ${code}`))));
  });

const site = await serveDocs();
const frames = await mkdtemp(join(tmpdir(), 'painterly-frames-'));
const browser = await chromium.launch();

try {
  const page = await browser.newPage({viewport: {width: 1400, height: 1400}, deviceScaleFactor});
  await page.goto(`${site.url}/#photo=${photo}&seed=1`);
  await page.getByRole('button', {name: 'Pause'}).waitFor({timeout: 60_000});
  await page.getByRole('button', {name: 'Pause'}).click();
  const canvas = page.locator('canvas');

  // The page's own pacing: rebuild its schedule from the layer sizes it
  // publishes for tooling, then compress 45 s into the clip with a curve that
  // keeps the underpainting on screen long enough to read.
  const {duration, layerSizes} = await page.evaluate(() => ({
    duration: window.painterly.duration,
    layerSizes: window.painterly.layers,
  }));
  // createSchedule paces from the layer sizes alone, so the strokes are not needed here.
  const schedule = createSchedule({layerSizes, strokes: []}, duration);
  const paintFrames = paintSeconds * fps;
  const holdFrames = holdSeconds * fps;
  let frame = 0;
  let total = 0;
  for (let i = 0; i <= paintFrames; i++) {
    const t = i / paintFrames;
    total = schedule.strokesAt(duration * t ** 1.6);
    // The controls offer stages, not strokes; the page keeps an exact seek for
    // tooling. The canvas catches up over frames rather than in one block.
    await page.evaluate((value) => {
      window.painterly.seek(value);
      const strip = document.querySelector('#stages');
      return new Promise((done) => {
        const check = () =>
          strip.dataset.painted === String(value) ? done() : requestAnimationFrame(check);
        requestAnimationFrame(check);
      });
    }, total);
    await canvas.screenshot({path: join(frames, `f${String(frame++).padStart(4, '0')}.png`)});
  }
  const last = frame - 1;
  for (let i = 0; i < holdFrames; i++) {
    await copyFile(
      join(frames, `f${String(last).padStart(4, '0')}.png`),
      join(frames, `f${String(frame++).padStart(4, '0')}.png`),
    );
  }

  const input = ['-framerate', String(fps), '-i', join(frames, 'f%04d.png')];
  if (format === 'gif') {
    const palette = join(frames, 'palette.png');
    const scale = `scale=${width}:-1:flags=lanczos`;
    await run('ffmpeg', [
      ...['-y', '-loglevel', 'error'],
      ...input,
      ...['-vf', `${scale},palettegen=max_colors=112:stats_mode=diff`],
      palette,
    ]);
    await run('ffmpeg', [
      ...['-y', '-loglevel', 'error'],
      ...input,
      ...['-i', palette],
      ...[
        '-lavfi',
        `${scale}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,
      ],
      ...['-loop', '0'],
      output,
    ]);
  } else {
    // -2 rather than -1 on the height: H.264 needs even dimensions. yuv420p and
    // faststart are what makes it play inline on iOS and start before it lands.
    await run('ffmpeg', [
      ...['-y', '-loglevel', 'error'],
      ...input,
      ...['-vf', `scale=${width}:-2:flags=lanczos`],
      ...['-c:v', 'libx264', '-preset', 'slow', '-crf', String(args.get('crf') ?? crf)],
      ...['-pix_fmt', 'yuv420p', '-movflags', '+faststart'],
      output,
    ]);
  }
  console.log(
    `${output}: ${frame} frames, ${frame / fps}s at ${fps}fps, ${total} strokes, photo ${photo}`,
  );
} finally {
  await browser.close();
  await site.close();
  if (process.env.KEEP_FRAMES) console.log(`frames kept in ${frames}`);
  else await rm(frames, {recursive: true, force: true});
}
