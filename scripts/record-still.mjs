// The one picture the README and a pasted link both need: the photo on the left,
// the finished painting on the right. Shot from the built page, so it is always
// the painting the page actually makes rather than an artist's impression.
//
//   node scripts/record-still.mjs           # docs/still.jpg
//
// PHOTO picks the subject; SEED picks the painting.
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {serveDocs} from '../test/serve.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PHOTO = process.env.PHOTO ?? 'golden';
const SEED = process.env.SEED ?? '1';
/** Facebook and Twitter both crop to roughly this, and GitHub renders it as the card. */
const CARD = {width: 1200, height: 630};

const site = await serveDocs();
const browser = await chromium.launch();
const scratch = await mkdtemp(join(tmpdir(), 'painterly-still-'));

try {
  const page = await browser.newPage({viewport: {width: 1400, height: 1200}, deviceScaleFactor: 2});
  await page.goto(`${site.url}/#photo=${PHOTO}&seed=${SEED}`);
  await page.getByRole('button', {name: 'Pause'}).waitFor({timeout: 60_000});
  await page.getByRole('button', {name: 'Pause'}).click();

  // Paint it to the last stroke and wait for the canvas to catch the playhead up.
  const {painting, strokes} = await page.evaluate(async () => {
    window.painterly.seek(window.painterly.total);
    const strip = document.querySelector('#stages');
    await new Promise((resolve) => {
      const check = () =>
        strip.dataset.painted === strip.dataset.position ? resolve() : requestAnimationFrame(check);
      requestAnimationFrame(check);
    });
    return {
      painting: document.querySelector('canvas').toDataURL('image/png'),
      strokes: window.painterly.total,
    };
  });

  const photo = `${site.url}/photos/${PHOTO}.jpg`;
  const card = await browser.newPage({viewport: CARD, deviceScaleFactor: 2});
  await card.goto(site.url); // Same origin, so the page's fonts are already warm.
  await card.setContent(sheet(photo, painting, strokes), {waitUntil: 'networkidle'});
  await card.evaluate(() => document.fonts.ready);
  // Photographic content, and it has to stay light enough to be a social card.
  await card.screenshot({path: join(root, 'docs/still.jpg'), type: 'jpeg', quality: 86});
  console.log(`docs/still.jpg — ${PHOTO}, seed ${SEED}`);
} finally {
  await browser.close();
  await site.close();
  await rm(scratch, {recursive: true, force: true});
}

/** The card, set as the page is: paper, a hairline, and the margin's voice. */
function sheet(photo, painting, strokes) {
  return `<!doctype html>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500&family=Instrument+Serif&display=swap"
  rel="stylesheet"
/>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: ${CARD.width}px;
    height: ${CARD.height}px;
    background: #f4f3f0;
    color: #1c1b19;
    font: 400 16px/1.5 "Instrument Sans", system-ui, sans-serif;
    display: grid;
    grid-template-rows: auto 1fr;
    padding: 40px 48px 44px;
  }
  header {
    display: flex;
    align-items: baseline;
    gap: 16px;
    padding-bottom: 20px;
    border-bottom: 1px solid #d8d6d1;
  }
  h1 { font: 400 40px/1 "Instrument Serif", Georgia, serif; letter-spacing: -0.02em; margin: 0; }
  p { margin: 0; font-size: 15px; color: #6b6965; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; padding-top: 28px; min-height: 0; }
  /* Flex, so the pictures give the captions their room instead of running past them. */
  figure { margin: 0; display: flex; flex-direction: column; gap: 10px; min-height: 0; }
  .shot { flex: 1; min-height: 0; overflow: hidden; }
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
  figcaption {
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #6b6965;
  }
</style>
<header>
  <h1>painterly</h1>
  <p>Brush strokes of several sizes, following the image, converging on it.</p>
</header>
<div class="pair">
  <figure>
    <div class="shot"><img src="${photo}" alt="" /></div>
    <figcaption>The photograph</figcaption>
  </figure>
  <figure>
    <div class="shot"><img src="${painting}" alt="" /></div>
    <figcaption>45 seconds later, ${strokes.toLocaleString('en-US')} strokes</figcaption>
  </figure>
</div>`;
}
