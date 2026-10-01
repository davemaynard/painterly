// The studio page, in a real Chromium, against the files GitHub Pages will
// serve. A light canvas (#detail=24), because CI paints on a software GPU.
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

/** Opens the studio paused, and returns the page and any errors it throws. */
async function open(viewport = {width: 1280, height: 860}) {
  const page = await browser.newPage({viewport, reducedMotion: 'reduce'});
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${site.url}/studio/#detail=24`);
  await page.waitForFunction(() => window.studio, null, {timeout: 60_000});
  return {page, errors};
}

const renderAt = (page, time) => page.evaluate((t) => window.studio.renderAt(t), time);
const stepStarts = (page) => page.evaluate(() => window.studio.steps.map((step) => step.start));
const currentStep = (page) => page.evaluate(() => window.studio.state.step);

/** Share of the canvas's pixels that are clearly blue: the sky, once it is painted. */
const blueShare = (page) =>
  page.evaluate(() => {
    const source = document.querySelector('#painting');
    const copy = document.createElement('canvas');
    copy.width = 160;
    copy.height = 120;
    const context = copy.getContext('2d');
    context.drawImage(source, 0, 0, copy.width, copy.height);
    const {data} = context.getImageData(0, 0, copy.width, copy.height);
    let blue = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i + 2] > data[i] + 40) blue++;
    return blue / (data.length / 4);
  });

test('the page lists every step and starts on a blank canvas', async () => {
  const {page, errors} = await open();
  await assert.doesNotReject(page.getByRole('navigation', {name: 'Steps'}).waitFor());
  assert.equal(await page.getByRole('navigation', {name: 'Steps'}).getByRole('button').count(), 19);
  assert.equal(await page.getByRole('button', {name: 'Play'}).count(), 1);
  assert.ok((await blueShare(page)) < 0.2, 'mostly gesso and drops before the brush');
  assert.deepEqual(errors, []);
  await page.close();
});

test('spreading the sky puts blue across the canvas', async () => {
  const {page, errors} = await open();
  const starts = await stepStarts(page);
  await renderAt(page, starts[2]);
  assert.ok((await blueShare(page)) > 0.3, 'the wide brush has spread the blue drops');
  await assert.doesNotReject(page.getByRole('status').filter({hasText: 'Step 3 of 19'}).waitFor());
  assert.deepEqual(errors, []);
  await page.close();
});

test('a step in the list is a place to start from, and back goes back', async () => {
  const {page, errors} = await open();
  await page.getByRole('button', {name: /Pounce the scrubber/}).click();
  await page.waitForFunction(
    () => window.studio.state.step === 5 && window.studio.state.seeking === null,
  );
  await assert.doesNotReject(
    page.getByRole('status').filter({hasText: 'Steel-wool scrubber'}).waitFor(),
  );
  const current = page.getByRole('button', {name: /Pounce the scrubber/});
  assert.equal(await current.getAttribute('aria-current'), 'step');

  // From the start of a step, back goes to the step before.
  await page.getByRole('button', {name: 'Previous step'}).click();
  await page.waitForFunction(
    () => window.studio.state.step === 4 && window.studio.state.seeking === null,
  );
  assert.equal(await currentStep(page), 4);
  assert.deepEqual(errors, []);
  await page.close();
});

test('the end is finished, with the picture to download', async () => {
  const {page, errors} = await open();
  const duration = await page.evaluate(() => window.studio.duration);
  await renderAt(page, duration);
  await assert.doesNotReject(page.getByRole('status').filter({hasText: 'Finished'}).waitFor());
  assert.equal(await page.getByRole('button', {name: 'Download PNG'}).isVisible(), true);
  assert.equal(await page.getByRole('button', {name: 'Next step'}).isDisabled(), true);
  assert.deepEqual(errors, []);
  await page.close();
});

test('a phone gets the picture and the transport without sideways scrolling', async () => {
  const {page, errors} = await open({width: 390, height: 844});
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assert.ok(overflow <= 0, `${overflow}px of sideways scroll`);
  const play = await page.getByRole('button', {name: 'Play'}).boundingBox();
  assert.ok(play && play.y + play.height <= 844, 'the play button is on the first screen');
  assert.deepEqual(errors, []);
  await page.close();
});
