import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  createRandom,
  defaultRadii,
  dominantColor,
  meanDifference,
  plan,
  simulate,
  styles,
} from '../dist/index.js';
import {edgeRaster, rampRaster} from './helpers.mjs';

test('the same photo, options and seed produce a deep-equal plan', () => {
  const source = edgeRaster();
  const a = plan(source, {seed: 7});
  const b = plan(source, {seed: 7});
  assert.deepEqual(a, b);
  assert.ok(a.strokes.length > 0);
});

test('a different seed changes the order and the jitter, not the coverage', () => {
  const source = edgeRaster();
  const a = plan(source, {seed: 1});
  const b = plan(source, {seed: 2});
  // Stroke order changes how discs overlap, so later layers differ by a stroke or
  // two; the underpainting and the total are the same picture.
  assert.equal(a.layerSizes[0], b.layerSizes[0]);
  assert.ok(Math.abs(a.strokes.length - b.strokes.length) / a.strokes.length < 0.05);
  assert.notDeepEqual(
    a.strokes.map((s) => s.jitter),
    b.strokes.map((s) => s.jitter),
  );
});

test('the painting converges on the photo, layer by layer', () => {
  const source = edgeRaster();
  const painting = plan(source, {seed: 3});
  const start = meanDifference(simulate(painting, 0), source);
  let painted = 0;
  let previous = start;
  for (const size of painting.layerSizes) {
    painted += size;
    const now = meanDifference(simulate(painting, painted), source);
    // A finer brush may smear a hard edge by up to its own radius, so allow a
    // hair of regression, never a real one.
    assert.ok(now <= previous + 1.5, `layer left error at ${now}, was ${previous}`);
    previous = now;
  }
  assert.ok(
    previous < start / 4,
    `final mean difference ${previous} from ${start} is not a likeness`,
  );
});

test('strokes stay inside the canvas', () => {
  const source = edgeRaster();
  const painting = plan(source, {seed: 5});
  for (const stroke of painting.strokes) {
    assert.ok(stroke.points.length >= 1);
    for (const [x, y] of stroke.points) {
      assert.ok(x >= 0 && x < source.width, `x ${x}`);
      assert.ok(y >= 0 && y < source.height, `y ${y}`);
    }
  }
});

test('strokes run perpendicular to the image gradient', () => {
  const painting = plan(rampRaster(), {seed: 9, radii: [4]});
  const long = painting.strokes.filter((s) => s.points.length >= 3);
  assert.ok(long.length > 20, `only ${long.length} strokes long enough to have a direction`);
  const vertical = long.filter((s) => {
    const [x0, y0] = s.points[0];
    const [x1, y1] = s.points[s.points.length - 1];
    return Math.abs(y1 - y0) > Math.abs(x1 - x0);
  });
  assert.ok(
    vertical.length / long.length > 0.9,
    `${vertical.length} of ${long.length} strokes are vertical`,
  );
});

test('the ground is the hue family that covers most of the photo', () => {
  const source = edgeRaster(200, 100);
  // Push the edge right so the red side, ramp and all, covers 65% of the photo.
  for (let y = 0; y < 100; y++) {
    for (let x = 100; x < 130; x++) {
      const i = (y * 200 + x) * 3;
      source.data[i] = 200;
      source.data[i + 1] = 40 + (y / 100) * 60;
      source.data[i + 2] = 40;
    }
  }
  const [r, g, b] = dominantColor(source);
  assert.ok(r > 180 && g < 110 && b < 60, `ground rgb(${r} ${g} ${b}) is not the red side`);
});

test('default radii scale with the image and never drop below 1.5px', () => {
  assert.deepEqual(defaultRadii(1400, 900), [35, 17.5, 8.75, 4.375, 2.1875]);
  assert.deepEqual(defaultRadii(200, 100), [5, 2.5, 1.5, 1.5, 1.5]);
});

test('seeded random is reproducible', () => {
  const a = createRandom(42);
  const b = createRandom(42);
  const seqA = Array.from({length: 5}, () => a.next());
  const seqB = Array.from({length: 5}, () => b.next());
  assert.deepEqual(seqA, seqB);
  assert.deepEqual(
    createRandom(1).shuffle([1, 2, 3, 4, 5]),
    createRandom(1).shuffle([1, 2, 3, 4, 5]),
  );
});

test('the underpainting style is one big brush with long strokes', () => {
  const source = edgeRaster(320, 240);
  const painting = plan(source, {...styles.underpainting.options(320, 240), seed: 1});
  assert.equal(painting.layerSizes.length, 1);
  assert.equal(painting.strokes[0].radius, 8);
  const longest = Math.max(...painting.strokes.map((s) => s.points.length));
  assert.ok(longest > 10, `longest stroke has ${longest} points`);
  assert.ok(painting.strokes.length < plan(source, {seed: 1}).strokes.length);
});
