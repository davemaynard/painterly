// The page, in a real Chromium, against the files GitHub Pages will serve.
// Controls are found by role and label; assertions read pixels and visible
// state, never class names.
import assert from 'node:assert/strict';
import {after, before, test} from 'node:test';
import {chromium} from 'playwright';
import {serveDocs} from './serve.mjs';

let browser;
let site;

before(async () => {
  browser = await chromium.launch();
  site = await serveDocs();
});

after(async () => {
  await browser.close();
  await site.close();
});

/** Opens the page on a photo, waits for the plan, pauses, and returns the page. */
async function open(hash, viewport = {width: 1280, height: 900}) {
  const page = await browser.newPage({viewport});
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${site.url}/#${hash}`);
  await page.getByRole('button', {name: 'Pause'}).waitFor({timeout: 60_000});
  await page.getByRole('button', {name: 'Pause'}).click();
  assert.deepEqual(errors, []);
  return page;
}

/** Resolves once the canvas shows the strokes the player is at. Runs in the page. */
function caughtUp(strip) {
  return new Promise((resolve) => {
    const check = () =>
      strip.dataset.painted === strip.dataset.position ? resolve() : requestAnimationFrame(check);
    requestAnimationFrame(check);
  });
}

const settled = (page) => page.locator('#stages').evaluate(caughtUp);

/**
 * Moves to an exact stroke count and waits for the canvas. The transport only
 * offers brushes, so tests that need a precise moment use the page's own hook,
 * the one the recorder uses; the transport buttons have their own tests.
 */
async function seekTo(page, count) {
  await page.evaluate((value) => window.painterly.seek(value), count);
  await settled(page);
}

/** Where each brush begins, in strokes. */
const brushStarts = (page) =>
  page.evaluate(() => {
    let at = 0;
    return window.painterly.layers
      .filter((size) => size > 0)
      .map((size) => {
        const start = at;
        at += size;
        return start;
      });
  });

/** Jumps to the start of brush `n`, counting from one. */
async function toBrush(page, n) {
  await seekTo(page, (await brushStarts(page))[n - 1]);
}

const toEnd = async (page) => seekTo(page, await strokeCount(page));

const canvasPng = (page) => page.evaluate(() => document.querySelector('canvas').toDataURL());
const strokeCount = (page) => page.evaluate(() => window.painterly.total);
const positionOf = (page) =>
  page.locator('#stages').evaluate((strip) => Number(strip.dataset.position));
const stageCount = (page) => page.locator('#stages .stage').count();

test('the page paints: the canvas leaves the ground colour and reaches Done', async () => {
  const page = await open('photo=mist&seed=1');
  await seekTo(page, 0);
  const ground = await canvasPng(page);
  const total = await strokeCount(page);
  assert.ok(total > 10_000, `only ${total} strokes`);
  await toEnd(page);
  assert.notEqual(await canvasPng(page), ground);
  await assert.doesNotReject(page.getByText(/strokes, planned in/).waitFor());
  await assert.doesNotReject(page.getByRole('button', {name: 'Download PNG'}).waitFor());
  await page.close();
});

test('the same photo and seed paint the same pixels in two separate loads', async () => {
  const a = await open('photo=mist&seed=1');
  const b = await open('photo=mist&seed=1');
  await toEnd(a);
  await toEnd(b);
  assert.equal(await canvasPng(a), await canvasPng(b));
  await a.close();
  await b.close();
});

test('jumping back to a brush lands on the same pixels as painting up to it', async () => {
  const page = await open('photo=mist&seed=1');
  // Cold: from the ground, every stroke up to the third brush.
  await toBrush(page, 3);
  const painted = await canvasPng(page);
  // Warm: from the copy taken at the handover as the painting passed it.
  await toEnd(page);
  await toBrush(page, 3);
  assert.equal(await canvasPng(page), painted);
  await page.close();
});

test('a different seed paints a different picture', async () => {
  const a = await open('photo=mist&seed=1');
  const b = await open('photo=mist&seed=2');
  await toEnd(a);
  await toEnd(b);
  assert.notEqual(await canvasPng(a), await canvasPng(b));
  await a.close();
  await b.close();
});

test('changing the brush repaints what is on the canvas', async () => {
  const page = await open('photo=mist&seed=1');
  await toBrush(page, 2);
  const bristle = await canvasPng(page);
  await page.getByLabel('Brush', {exact: true}).selectOption('ribbon');
  await settled(page);
  assert.notEqual(await canvasPng(page), bristle);
  assert.match(page.url(), /brush=ribbon/);
  await page.close();
});

test('the underpainting style stops after one brush and keeps its own URL', async () => {
  const page = await open('photo=mist&seed=1&style=underpainting');
  const total = await strokeCount(page);
  assert.ok(total > 100 && total < 3000, `${total} strokes is not a single big brush`);
  assert.equal(await page.getByLabel('Brush', {exact: true}).inputValue(), 'ribbon');
  await assert.doesNotReject(page.getByText('Brush 1 of 1').waitFor());
  assert.equal(await stageCount(page), 1);
  await page.getByLabel('Style', {exact: true}).selectOption('painting');
  await page.getByRole('button', {name: 'Pause'}).waitFor({timeout: 60_000});
  assert.ok((await strokeCount(page)) > 10_000);
  assert.equal(await stageCount(page), 5);
  assert.match(page.url(), /style=painting/);
  await page.close();
});

test('at phone width nothing overflows and the controls are reachable', async () => {
  const page = await open('photo=golden&seed=1', {width: 390, height: 844});
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  assert.equal(overflow, 0, `page overflows by ${overflow}px`);
  const canvasBox = await page.locator('canvas').boundingBox();
  assert.ok(canvasBox.width <= 390 && canvasBox.width > 300, `canvas is ${canvasBox.width}px wide`);
  for (const name of ['Previous brush', 'Play', 'Next brush', 'Paint again']) {
    assert.ok(await page.getByRole('button', {name}).isVisible(), `${name} is visible`);
  }
  assert.ok(await page.getByRole('radio', {name: /golden retriever/}).isChecked());
  await page.close();
});

test('the stages are shown, not operated: nothing on the strip is a control', async () => {
  const page = await open('photo=mist&seed=1');
  assert.equal(await stageCount(page), 5);
  assert.equal(await page.locator('#stages').getByRole('button').count(), 0);
  await page.close();
});

test('play and pause are one button showing one glyph at a time', async () => {
  const page = await open('photo=mist&seed=1');
  const glyphs = () =>
    page
      .locator('#play svg')
      .evaluateAll((all) =>
        all
          .filter((svg) => svg.getBoundingClientRect().height > 0)
          .map((svg) => svg.className.baseVal),
      );
  assert.deepEqual(await glyphs(), ['glyph-play']);
  await page.getByRole('button', {name: 'Play'}).click();
  assert.deepEqual(await glyphs(), ['glyph-pause']);
  await page.getByRole('button', {name: 'Pause'}).click();
  assert.deepEqual(await glyphs(), ['glyph-play']);
  await page.close();
});

test('the transport is disabled where it would do nothing', async () => {
  const page = await open('photo=mist&seed=1');
  await seekTo(page, 0);
  assert.ok(await page.getByRole('button', {name: 'Previous brush'}).isDisabled());
  assert.ok(await page.getByRole('button', {name: 'Next brush'}).isEnabled());
  await toEnd(page);
  assert.ok(await page.getByRole('button', {name: 'Previous brush'}).isEnabled());
  assert.ok(await page.getByRole('button', {name: 'Next brush'}).isDisabled());
  // While a new photo is planned, nothing on the transport works.
  await page.getByRole('radio', {name: /oranges/i}).check();
  await page.locator('section[aria-busy="true"]').waitFor({timeout: 5_000});
  for (const name of ['Previous brush', 'Play', 'Next brush']) {
    assert.ok(
      await page.getByRole('button', {name}).isDisabled(),
      `${name} is live while planning`,
    );
  }
  await page.close();
});

test('next goes on a brush, and from the last brush to the finished picture', async () => {
  const page = await open('photo=mist&seed=1');
  const starts = await brushStarts(page);
  await seekTo(page, 0);
  const next = page.getByRole('button', {name: 'Next brush'});
  for (let brush = 1; brush < starts.length; brush++) {
    await next.click();
    await settled(page);
    assert.equal(await positionOf(page), starts[brush], `next landed wrong from brush ${brush}`);
  }
  await next.click();
  await settled(page);
  assert.equal(await positionOf(page), await strokeCount(page));
  await assert.doesNotReject(page.getByRole('button', {name: 'Download PNG'}).waitFor());
  assert.ok(await next.isDisabled(), 'next is still offered at the end');
  await page.close();
});

test('back restarts the brush being painted, then goes to the one before', async () => {
  const page = await open('photo=mist&seed=1');
  const starts = await brushStarts(page);
  const back = page.getByRole('button', {name: 'Previous brush'});
  // Part-way into the third brush: back returns to its start.
  await seekTo(page, Math.round((starts[2] + starts[3]) / 2));
  await back.click();
  await settled(page);
  assert.equal(await positionOf(page), starts[2]);
  // Already at its start: back goes to the second brush.
  await back.click();
  await settled(page);
  assert.equal(await positionOf(page), starts[1]);
  await seekTo(page, 0);
  assert.ok(await back.isDisabled(), 'back is still offered at the start');
  await page.close();
});

test('skipping a brush while playing keeps it playing', async () => {
  const page = await open('photo=mist&seed=1');
  const starts = await brushStarts(page);
  await page.getByRole('button', {name: 'Play'}).click();
  await page.getByRole('button', {name: 'Next brush'}).click();
  await settled(page);
  const landed = await positionOf(page);
  assert.ok(landed >= starts[1], `landed at ${landed}, the second brush starts at ${starts[1]}`);
  await assert.doesNotReject(page.getByRole('button', {name: 'Pause'}).waitFor({timeout: 1000}));
  await page.waitForTimeout(400);
  assert.ok((await positionOf(page)) > landed, `the painting stopped at ${landed}`);
  await page.close();
});

/** A page with a long-task observer installed before anything loads. */
async function observed(hash) {
  const page = await browser.newPage({viewport: {width: 1280, height: 900}});
  await page.addInitScript(() => {
    window.longTasks = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.longTasks.push(Math.round(entry.duration));
    }).observe({type: 'longtask'});
  });
  await page.goto(`${site.url}/#${hash}`);
  await page.getByRole('button', {name: 'Pause'}).waitFor({timeout: 60_000});
  return page;
}

const longTasks = (page) => page.evaluate(() => window.longTasks.splice(0));

test('skipping to the end on a fresh page never blocks a frame for long', async () => {
  const page = await observed('photo=golden&seed=1');
  await longTasks(page);
  await toEnd(page);
  const tasks = await longTasks(page);
  const longest = Math.max(0, ...tasks);
  assert.ok(longest < 100, `a frame blocked for ${longest} ms (${tasks.join(', ')})`);
  await page.close();
});

test('the first seconds of painting never block a frame for long', async () => {
  const page = await observed('photo=golden&seed=1');
  // The first brush's strokes are the dearest; the budget must hold there too.
  await longTasks(page);
  await page.waitForTimeout(2_000);
  const tasks = await longTasks(page);
  const longest = Math.max(0, ...tasks);
  assert.ok(longest < 60, `a frame blocked for ${longest} ms (${tasks.join(', ')})`);
  await page.close();
});

test('once the copies are made, going back to an earlier brush is a restore', async () => {
  const page = await open('photo=golden&seed=1');
  await page.waitForTimeout(5_000);
  const started = Date.now();
  await toBrush(page, 2);
  const took = Date.now() - started;
  assert.ok(took < 250, `a jump back took ${took} ms`);
  await page.close();
});

test('while a photo is planned the picture shows the photo, the stages fill, then it paints', async () => {
  const page = await open('photo=mist&seed=1');
  const viewer = page.locator('section[aria-busy="true"]');
  await page.getByRole('radio', {name: /oranges/i}).check();
  await viewer.waitFor({timeout: 5_000});
  // The canvas is neither the old painting nor black: the photo, faint and grey.
  const middle = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const [r, g, b] = canvas
      .getContext('2d')
      .getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
    return {r, g, b};
  });
  assert.ok(middle.r + middle.g + middle.b > 150, `the plate is dark: ${JSON.stringify(middle)}`);
  await assert.doesNotReject(page.getByText(/Planning brush \d of \d/).waitFor({timeout: 5_000}));
  await page.getByRole('button', {name: 'Pause'}).waitFor({timeout: 60_000});
  assert.equal(await viewer.count(), 0);
  assert.equal(await stageCount(page), 5);
  await page.close();
});

test('a photo planned ahead starts painting at once', async () => {
  const page = await open('photo=golden&seed=1');
  // The other three are planned behind the first while it plays.
  await page.locator('label.photo[data-ready]').nth(2).waitFor({timeout: 90_000});
  const started = Date.now();
  await page.getByRole('radio', {name: /rowboats/i}).check();
  await page.getByRole('button', {name: 'Pause'}).waitFor({timeout: 5_000});
  const took = Date.now() - started;
  assert.ok(took < 1_000, `a planned-ahead photo took ${took} ms to start`);
  await page.close();
});
