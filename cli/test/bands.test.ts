import assert from 'node:assert/strict';
import {after, test} from 'node:test';
import {createRaster, plan} from '../../dist/index.js';
import {createBandPool, paintInBands} from '../src/bands.ts';
import {flatGround} from '../src/photo.ts';
import {styles} from '../src/styles.ts';

/** A small photo with an edge, a ramp and a spot, so every brush has work to do. */
function photo(width = 180, height = 120) {
  const raster = createRaster(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      const spot = Math.hypot(x - 120, y - 60) < 18;
      raster.data[i] = spot ? 230 : x < width / 2 ? 200 : 40;
      raster.data[i + 1] = spot ? 40 : 60 + (y / height) * 120;
      raster.data[i + 2] = spot ? 160 : 90;
    }
  }
  return raster;
}

const oneBand = createBandPool(1);
const fourBands = createBandPool(4);
after(() => {
  oneBand.close();
  fourBands.close();
});

for (const style of ['oil', 'gouache', 'watercolor'] as const) {
  test(`${style}: painted in four bands, the canvas matches one canvas up to antialiasing`, async () => {
    const source = photo();
    const painting = plan(source, {seed: 3, flow: 'tensor', ...styles[style].plan(180, 120)});
    const ground = flatGround(180, 120, [128, 128, 128]);
    const job = {style, pass: 'color', ground} as const;
    const [whole, banded] = await Promise.all([
      paintInBands(oneBand, painting, job),
      paintInBands(fourBands, painting, job),
    ]);
    assert.equal(banded.length, whole.length);
    // Not bit for bit: Skia rasterizes in 32-bit floats, so moving the origin
    // (which is all a band does) nudges antialiased edges by a few levels. A
    // stroke dropped at a seam would differ by far more than that.
    let differing = 0;
    let worst = 0;
    for (let i = 0; i < whole.length; i++) {
      const difference = Math.abs((whole[i] as number) - (banded[i] as number));
      if (difference > 0) differing++;
      worst = Math.max(worst, difference);
    }
    assert.ok(worst <= 16, `a pixel differs by ${worst} levels`);
    assert.ok(differing / whole.length < 0.08, `${differing} of ${whole.length} values differ`);
  });
}
