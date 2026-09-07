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

/** Drags the timeline to `count` strokes and waits for the frame that paints them. */
async function seek(page, count) {
  await page.getByRole('slider', {name: 'Timeline'}).evaluate((input, value) => {
    input.value = String(value);
    input.dispatchEvent(new Event('input', {bubbles: true}));
    // The page coalesces a drag into one repaint per frame.
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, count);
}

const canvasPng = (page) => page.evaluate(() => document.querySelector('canvas').toDataURL());
const strokeCount = (page) =>
  page.getByRole('slider', {name: 'Timeline'}).evaluate((input) => Number(input.max));

test('the page paints: the canvas leaves the ground colour and reaches Done', async () => {
  const page = await open('photo=mist&seed=1');
  await seek(page, 0);
  const ground = await canvasPng(page);
  const total = await strokeCount(page);
  assert.ok(total > 10_000, `only ${total} strokes`);
  await seek(page, total);
  assert.notEqual(await canvasPng(page), ground);
  await assert.doesNotReject(page.getByText(/strokes, planned in/).waitFor());
  await assert.doesNotReject(page.getByRole('button', {name: 'Download PNG'}).waitFor());
  await page.close();
});

test('the same photo and seed paint the same pixels in two separate loads', async () => {
  const a = await open('photo=oranges&seed=3');
  const b = await open('photo=oranges&seed=3');
  const total = await strokeCount(a);
  assert.equal(total, await strokeCount(b));
  await seek(a, total);
  await seek(b, total);
  assert.equal(await canvasPng(a), await canvasPng(b));
  await a.close();
  await b.close();
});

test('scrubbing backwards lands on the same pixels as painting forward', async () => {
  const page = await open('photo=oranges&seed=1');
  const total = await strokeCount(page);
  const middle = Math.floor(total * 0.55);
  await seek(page, middle);
  const forward = await canvasPng(page);
  await seek(page, total);
  await seek(page, middle);
  assert.equal(await canvasPng(page), forward);
  await page.close();
});

test('jumping forward lands on the same pixels as painting the way there', async () => {
  // One page paints its way to the target from near the start; the other has
  // played through, so it resumes from the nearest snapshot and paints the rest.
  const painted = await open('photo=oranges&seed=1');
  const jumped = await open('photo=oranges&seed=1');
  const total = await strokeCount(painted);
  const target = Math.floor(total * 0.8);
  await seek(painted, target);
  await seek(jumped, total);
  await seek(jumped, 0);
  await seek(jumped, target);
  assert.equal(await canvasPng(jumped), await canvasPng(painted));
  await painted.close();
  await jumped.close();
});

test('a different seed paints a different picture', async () => {
  const a = await open('photo=boats&seed=1');
  const b = await open('photo=boats&seed=2');
  await seek(a, 2000);
  await seek(b, 2000);
  assert.notEqual(await canvasPng(a), await canvasPng(b));
  await a.close();
  await b.close();
});

test('changing the brush repaints what is on the canvas', async () => {
  const page = await open('photo=mist&seed=1');
  await seek(page, 3000);
  const bristle = await canvasPng(page);
  await page.getByLabel('Brush', {exact: true}).selectOption('round');
  assert.notEqual(await canvasPng(page), bristle);
  assert.match(page.url(), /brush=round/);
  await page.close();
});

test('the underpainting style stops after one brush and keeps its own URL', async () => {
  const page = await open('photo=mist&seed=1&style=underpainting');
  const total = await strokeCount(page);
  assert.ok(total > 100 && total < 3000, `${total} strokes is not a single big brush`);
  assert.equal(await page.getByLabel('Brush', {exact: true}).inputValue(), 'ribbon');
  await assert.doesNotReject(page.getByText('Brush 1 of 1').waitFor());
  await page.getByLabel('Style', {exact: true}).selectOption('painting');
  await page.getByRole('button', {name: 'Pause'}).waitFor({timeout: 60_000});
  assert.ok((await strokeCount(page)) > 10_000);
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
  for (const name of ['Play', 'Paint again']) {
    assert.ok(await page.getByRole('button', {name}).isVisible(), `${name} is visible`);
  }
  assert.ok(await page.getByRole('radio', {name: /golden retriever/}).isChecked());
  await page.close();
});
