import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRaster} from '../../dist/index.js';
import {reducePalette} from '../src/palette.ts';

/** Two big fields that each shade a little, and one small magenta sign in the corner. */
function scene(width = 200, height = 120) {
  const raster = createRaster(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      const shade = (x % 7) - 3;
      const sign = x < 8 && y < 8;
      const [r, g, b] = sign ? [230, 30, 200] : y < height / 2 ? [90, 150, 230] : [60, 130, 60];
      raster.data[i] = r + (sign ? 0 : shade);
      raster.data[i + 1] = g + (sign ? 0 : shade);
      raster.data[i + 2] = b + (sign ? 0 : shade);
    }
  }
  return raster;
}

test('the picture comes out in at most the colors asked for, plus its accents', () => {
  const reduced = reducePalette(scene(), 3, 1);
  const mixed = new Set<string>();
  for (let i = 0; i < reduced.data.length; i += 3) {
    const color = `${reduced.data[i]},${reduced.data[i + 1]},${reduced.data[i + 2]}`;
    if (color !== '230,30,200') mixed.add(color);
  }
  // 24,000 shaded pixels in, three mixed colors out.
  assert.ok(mixed.size <= 3, `${mixed.size} colors`);
});

test('a small accent far from every mixed color keeps its own color', () => {
  const source = scene();
  // Two colors for two fields: the sign is too small to earn a third.
  const reduced = reducePalette(source, 2, 1);
  assert.deepEqual([...reduced.data.subarray(0, 3)], [230, 30, 200]);
});
