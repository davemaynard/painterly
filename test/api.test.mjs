// The published surface, checked against the package the way a consumer gets it.
// The other suites import from src/ or exercise the bundled page, so without
// this a renamed or dropped export ships green.
import assert from 'node:assert/strict';
import test from 'node:test';
import * as painterly from '../dist/index.js';

/** Everything README and the module header promise a caller can reach. */
const SURFACE = [
  'blur',
  'brushes',
  'cloneRaster',
  'colorDistance',
  'createPainter',
  'createRandom',
  'createRaster',
  'createSchedule',
  'defaultRadii',
  'dominantColor',
  'isStyleName',
  'jitter',
  'luminance',
  'meanDifference',
  'packPlan',
  'packedBuffers',
  'paintStroke',
  'plan',
  'rasterFromImageData',
  'sample',
  'simulate',
  'sobel',
  'styles',
  'unpackPlan',
];

/** A plain object, so the checks below can look names up without groping the namespace. */
const exported = {...painterly};

test('the package exports exactly what it documents', () => {
  assert.deepEqual(Object.keys(exported).sort(), SURFACE);
});

test('every export is the kind of thing it looks like', () => {
  for (const name of SURFACE) {
    const value = exported[name];
    const expected = name === 'brushes' || name === 'styles' ? 'object' : 'function';
    assert.equal(typeof value, expected, `${name} is a ${typeof value}`);
  }
});

test('the README usage runs end to end against the built package', () => {
  // Same four calls the README shows, on a tiny synthetic photo.
  const {brushes, createPainter, plan, createSchedule, rasterFromImageData} = painterly;
  const width = 24;
  const height = 24;
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    pixels[i * 4] = i % width < width / 2 ? 200 : 40;
    pixels[i * 4 + 1] = 90;
    pixels[i * 4 + 2] = 140;
    pixels[i * 4 + 3] = 255;
  }
  const painting = plan(rasterFromImageData({width, height, data: pixels}), {seed: 7});
  assert.ok(painting.strokes.length > 0, 'the plan has strokes');
  assert.equal(typeof createPainter, 'function');
  assert.ok(brushes.bristle.name === 'bristle');
  assert.equal(createSchedule(painting, 45_000).duration, 45_000);
});
