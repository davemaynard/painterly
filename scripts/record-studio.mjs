// Records the studio page painting from first drop to last sparkle, by
// driving the page's own clock in a real browser and encoding the frames with
// ffmpeg. Like record-demo.mjs, it never waits on the clock: each frame asks
// the page for an exact moment, so the clip is the same every time.
//
// The frames are the viewer: the step it is on, the painting with the tool
// over it, the note on what the tool is doing, and the stages filling.
//
// With --stills it writes the README's pictures instead: process.jpg, six
// moments of tools at work in a grid, and still.jpg, the finished painting.
//
// Requires ffmpeg on PATH, and a GPU; on a Mac the run uses Metal. Run
// `npm run build` first, then:
//   node scripts/record-studio.mjs --speed 3 --out ~/Movies/studio.mp4
//   node scripts/record-studio.mjs --from 230 --to 290 --speed 1 --out scrubber.mp4
//   node scripts/record-studio.mjs --stills docs/studio

import {spawn} from 'node:child_process';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {chromium} from 'playwright';
import {serveDocs} from '../test/serve.mjs';

// A flat --key value parser; every option takes a value.
const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i].replace(/^--/, ''), process.argv[i + 1]);
}

const speed = Number(args.get('speed') ?? 3);
const fps = Number(args.get('fps') ?? 30);
const width = Number(args.get('width') ?? 1440);
const holdSeconds = Number(args.get('hold') ?? 3);
const output = resolve(args.get('out') ?? 'studio.mp4');

const run = (command, commandArgs) =>
  new Promise((ok, fail) => {
    const child = spawn(command, commandArgs, {stdio: ['ignore', 'ignore', 'inherit']});
    child.on('error', fail);
    child.on('close', (code) => (code === 0 ? ok() : fail(new Error(`${command} exited ${code}`))));
  });

const site = await serveDocs();
const frames = await mkdtemp(join(tmpdir(), 'studio-frames-'));
// Metal on a Mac; elsewhere Chromium picks its own GPU path.
const browser = await chromium.launch({
  args: process.platform === 'darwin' ? ['--use-angle=metal'] : [],
});

try {
  // Reduced motion keeps the page from playing on its own; the recorder drives it.
  const page = await browser.newPage({
    viewport: {width: 1600, height: 1060},
    reducedMotion: 'reduce',
  });
  await page.goto(`${site.url}/studio/`);
  await page.waitForFunction(() => window.studio, null, {timeout: 60_000});
  const duration = await page.evaluate(() => window.studio.duration);
  const from = Number(args.get('from') ?? 0);
  const to = Math.min(duration, Number(args.get('to') ?? duration));
  const viewer = page.locator('.viewer');

  if (args.has('stills')) {
    await writeStills(page, resolve(args.get('stills')));
    process.exit(0);
  }

  const paintFrames = Math.ceil(((to - from) / speed) * fps);
  let frame = 0;
  const shoot = async (time) => {
    await page.evaluate((t) => window.studio.renderAt(t), time);
    // JPEG at high quality: several times quicker to write than PNG, and the
    // encode that follows is lossy anyway.
    await viewer.screenshot({
      path: join(frames, `f${String(frame++).padStart(5, '0')}.jpg`),
      type: 'jpeg',
      quality: 92,
    });
  };
  for (let i = 0; i <= paintFrames; i++) {
    await shoot(from + ((to - from) * i) / paintFrames);
    if (i % (fps * 10) === 0) console.log(`${Math.round((i / paintFrames) * 100)}%`);
  }
  // Hold on the last moment.
  for (let i = 0; i < holdSeconds * fps; i++) await shoot(to);

  // -2 on the height: H.264 needs even dimensions. yuv420p and faststart are
  // what make it play inline on a phone and start before it has all arrived.
  await run('ffmpeg', [
    ...['-y', '-loglevel', 'error'],
    ...['-framerate', String(fps), '-i', join(frames, 'f%05d.jpg')],
    ...['-vf', `scale=${width}:-2:flags=lanczos`],
    ...['-c:v', 'libx264', '-preset', 'slow', '-crf', String(args.get('crf') ?? 24)],
    ...['-pix_fmt', 'yuv420p', '-movflags', '+faststart'],
    output,
  ]);
  console.log(
    `${output}: ${frame} frames, ${(frame / fps).toFixed(1)}s at ${fps}fps, painting ${from}s to ${to.toFixed(1)}s at ${speed}×`,
  );
} finally {
  await browser.close();
  await site.close();
  if (process.env.KEEP_FRAMES) console.log(`frames kept in ${frames}`);
  else await rm(frames, {recursive: true, force: true});
}

/**
 * The README's pictures: six moments, each a step part-way done with its
 * tool in hand, tiled three by two; and the finished painting on its own.
 */
async function writeStills(page, directory) {
  const moments = [
    [0, 0.9],
    [1, 0.45],
    [2, 0.22],
    [5, 0.4],
    [7, 0.7],
    [18, 1],
  ];
  const steps = await page.evaluate(() => window.studio.steps);
  const frame = page.locator('.frame');
  const shots = [];
  for (const [step, share] of moments) {
    const {start, end} = steps[step];
    await page.evaluate((t) => window.studio.renderAt(t), start + (end - start) * share);
    const shot = join(frames, `moment-${step}.png`);
    await frame.screenshot({path: shot});
    shots.push(shot);
  }
  const scaled = shots.map((_, i) => `[${i}]scale=640:-2[s${i}]`).join(';');
  await run('ffmpeg', [
    ...['-y', '-loglevel', 'error'],
    ...shots.flatMap((shot) => ['-i', shot]),
    ...[
      '-filter_complex',
      `${scaled};[s0][s1][s2]hstack=3[top];[s3][s4][s5]hstack=3[bottom];[top][bottom]vstack=2`,
    ],
    ...['-q:v', '3'],
    join(directory, 'process.jpg'),
  ]);
  const png = await page.evaluate(() => window.studio.fullSizePng());
  const still = join(frames, 'still.png');
  await writeFile(still, Buffer.from(png.split(',')[1], 'base64'));
  await run('ffmpeg', [
    ...['-y', '-loglevel', 'error', '-i', still],
    ...['-vf', 'scale=1400:-2:flags=lanczos', '-q:v', '4'],
    join(directory, 'still.jpg'),
  ]);
  console.log(`wrote process.jpg and still.jpg to ${directory}`);
}
