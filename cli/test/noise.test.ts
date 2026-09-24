import assert from 'node:assert/strict';
import {test} from 'node:test';
import {noiseField} from '../src/noise.ts';

function deviation(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length);
}

test('the field has mean 0 and standard deviation 1', () => {
  const field = [
    ...noiseField(300, 200, 7, [
      [12, 1],
      [3, 0.5],
    ]),
  ];
  assert.ok(Math.abs(field.reduce((sum, v) => sum + v, 0) / field.length) < 1e-3);
  assert.ok(Math.abs(deviation(field) - 1) < 1e-3);
});

test('a large-scale field is as lively at the border as in the middle', () => {
  // The failure this guards against: blurred white noise, clamped at the edge,
  // is calm in the middle and blotched along every border.
  const width = 400;
  const height = 300;
  const field = noiseField(width, height, 11, [[40, 1]]);
  const border: number[] = [];
  const middle: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const edge = Math.min(x, y, width - 1 - x, height - 1 - y);
      if (edge < 20) border.push(field[y * width + x] as number);
      else if (edge > 80) middle.push(field[y * width + x] as number);
    }
  }
  const ratio = deviation(border) / deviation(middle);
  assert.ok(ratio > 0.6 && ratio < 1.6, `border varies ${ratio.toFixed(2)}× as much as the middle`);
});

test('the same seed makes the same field', () => {
  assert.deepEqual(noiseField(64, 48, 5, [[8, 1]]), noiseField(64, 48, 5, [[8, 1]]));
});
