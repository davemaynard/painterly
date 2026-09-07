// The scrubbing cache, on its own. Both scrubbing bugs painted the right pixels
// and only did it slowly, so every pixel test in the suite passed while they
// were live. These are the assertions that would have failed instead.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createSnapshots, seekFrom} from '../src/demo/snapshots.ts';

/** The frame the page plans at on a desktop. */
const FRAME_BYTES = 1400 * 933 * 4;
/** The golden retriever: five brushes, the last holding 73,997 of these. */
const STROKES = 106_083;

/** Measured on this painting: what one stroke costs to repaint, in microseconds. */
const PER_STROKE_US = 14.5;
/** Longer than this and a seek reads as a stall rather than a jump. */
const STALL_MS = 200;

const settle = () => new Promise((resolve) => setImmediate(resolve));

let taken = 0;
/** A copy of the canvas, arriving the way a real one does: later. */
const copy = () => Promise.resolve({id: taken++});

function cacheFor(strokes, options = {}) {
  const released = [];
  const cache = createSnapshots({
    strokes,
    bytesEach: FRAME_BYTES,
    release: (image) => released.push(image),
    ...options,
  });
  return {cache, released};
}

/** Play the whole painting through, keeping a copy at every mark on the way. */
async function playThrough(cache, strokes) {
  for (const mark of cache.marksBetween(0, strokes)) cache.keep(mark, copy());
  await settle();
}

test('a seek repaints at most one interval, wherever on the timeline it lands', async () => {
  const {cache} = cacheFor(STROKES);
  await playThrough(cache, STROKES);
  assert.ok(cache.size > 0, 'no copies were kept');
  for (let target = 0; target <= STROKES; target += 331) {
    const from = cache.nearest(target)?.count ?? 0;
    assert.ok(
      target - from <= cache.every,
      `a seek to ${target} would repaint ${target - from} strokes, over the ${cache.every} promised`,
    );
  }
});

test('the interval is short enough that a seek is not a stall', () => {
  const {cache} = cacheFor(STROKES);
  const worst = (cache.every * PER_STROKE_US) / 1000;
  assert.ok(
    worst <= STALL_MS,
    `a seek could repaint ${cache.every} strokes, about ${worst.toFixed(0)} ms`,
  );
});

test('the copies stay inside the memory they were given', async () => {
  const budgetBytes = 64 * 1024 * 1024;
  const {cache} = cacheFor(STROKES, {budgetBytes});
  await playThrough(cache, STROKES);
  assert.ok(
    cache.size * FRAME_BYTES <= budgetBytes,
    `${cache.size} copies of ${FRAME_BYTES} bytes is over the ${budgetBytes} budget`,
  );
});

test('a seek starts from the nearest copy on either side of the playhead', () => {
  // Ahead: jumping forward across a copy costs what scrubbing back behind one costs.
  assert.equal(seekFrom(0, 90_000, 88_410), 88_410);
  // Behind: the canvas has to go, so start from the copy rather than the ground.
  assert.equal(seekFrom(90_000, 20_000, 17_682), 17_682);
  // Behind with nothing kept: there is nowhere to start but the ground.
  assert.equal(seekFrom(900, 500, undefined), 0);
  // Ahead of the playhead but behind the newest copy: carry straight on.
  assert.equal(seekFrom(90_000, 95_000, 88_410), 90_000);
});

test('the marks are the grid points after where you are, up to where you are going', () => {
  const {cache} = cacheFor(STROKES);
  const every = cache.every;
  assert.deepEqual(cache.marksBetween(0, every * 2), [every, every * 2]);
  assert.deepEqual(cache.marksBetween(every, every * 2), [every * 2]);
  assert.deepEqual(cache.marksBetween(every * 2, every * 2), []);
  assert.deepEqual(cache.marksBetween(0, every - 1), []);
});

test('a painting with few strokes keeps no copies it does not need', async () => {
  // The underpainting is a few hundred strokes; repainting all of them is quick.
  const {cache} = cacheFor(800);
  await playThrough(cache, 800);
  assert.equal(cache.size, 0);
  assert.equal(cache.nearest(700), undefined);
});

test('clearing lets every copy go', async () => {
  const {cache, released} = cacheFor(STROKES);
  await playThrough(cache, STROKES);
  const held = cache.size;
  assert.ok(held > 0);
  cache.clear();
  assert.equal(released.length, held);
  assert.equal(cache.size, 0);
  assert.equal(cache.nearest(STROKES), undefined);
});

test('a copy that arrives after everything was let go is released, not kept', async () => {
  const {cache, released} = cacheFor(STROKES);
  const late = copy();
  cache.keep(cache.every, late);
  cache.keep(cache.every, copy());
  cache.clear();
  await settle();
  assert.equal(cache.size, 0);
  assert.deepEqual(released, [await late]);
});
