import assert from 'node:assert/strict';
import {test} from 'node:test';
import {blur, createRaster} from '../dist/index.js';
import {edgeRaster} from './helpers.mjs';

/**
 * The textbook version of the same filter: three box passes, each averaging
 * every pixel's clamped neighborhood from scratch. Slow and obviously right,
 * which is what the running sums have to agree with.
 */
function referenceBlur(source, radii) {
  const {width, height} = source;
  let current = source.data;
  for (const radius of radii) {
    const across = new Float32Array(current.length);
    const down = new Float32Array(current.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let k = -radius; k <= radius; k++) {
            const cx = Math.min(width - 1, Math.max(0, x + k));
            sum += current[(y * width + cx) * 3 + c];
          }
          across[(y * width + x) * 3 + c] = sum / (radius * 2 + 1);
        }
      }
    }
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let k = -radius; k <= radius; k++) {
            const cy = Math.min(height - 1, Math.max(0, y + k));
            sum += across[(cy * width + x) * 3 + c];
          }
          down[(y * width + x) * 3 + c] = sum / (radius * 2 + 1);
        }
      }
    }
    current = down;
  }
  return current;
}

test('the blur agrees with the textbook box filter to float precision', () => {
  const source = edgeRaster(61, 37);
  // sigma 2 is boxes of radius 1, 1 and 2 by Kovesi's formula: widths 3, 3 and 5.
  const ours = blur(source, 2).data;
  const theirs = referenceBlur(source, [1, 1, 2]);
  for (let i = 0; i < ours.length; i++) {
    assert.ok(Math.abs(ours[i] - theirs[i]) < 1e-3, `channel ${i}: ${ours[i]} vs ${theirs[i]}`);
  }
});

test('a flat picture stays flat, right up to the edges', () => {
  const flat = createRaster(40, 30, [120, 60, 200]);
  const blurred = blur(flat, 9).data;
  for (let i = 0; i < blurred.length; i += 3) {
    assert.ok(Math.abs(blurred[i] - 120) < 1e-3);
    assert.ok(Math.abs(blurred[i + 1] - 60) < 1e-3);
    assert.ok(Math.abs(blurred[i + 2] - 200) < 1e-3);
  }
});

test('the blur leaves its source alone', () => {
  const source = edgeRaster(30, 20);
  const before = source.data.slice();
  blur(source, 3);
  assert.deepEqual(source.data, before);
});
