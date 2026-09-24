// Gaussian blur, approximated by three box blurs. Each layer of the painting
// looks at the photo blurred to that brush's scale, so a big brush is not asked
// to chase detail it cannot make. Three passes of a box filter are within a
// few percent of a true Gaussian and run in linear time regardless of radius.
//
// Both passes read memory in order. The vertical pass keeps a running sum per
// column and advances it a whole row at a time, rather than walking down each
// column, which on a photo-sized raster is the difference between staying in
// cache and missing it on every read; and the passes share two buffers rather
// than allocating a raster each.
import type {Raster} from './raster';

export function blur(source: Raster, sigma: number): Raster {
  if (sigma < 0.5) return {...source, data: source.data.slice()};
  const {width, height} = source;
  const current = source.data.slice();
  const scratch = new Float32Array(current.length);
  for (const radius of boxRadiiForGaussian(sigma, 3)) {
    boxBlurHorizontal(current, scratch, width, height, radius);
    boxBlurVertical(scratch, current, width, height, radius);
  }
  return {width, height, data: current};
}

/**
 * Box radii whose repeated application approximates a Gaussian of `sigma`.
 * Peter Kovesi, "Fast Almost-Gaussian Filtering" (2010).
 */
function boxRadiiForGaussian(sigma: number, passes: number): number[] {
  const ideal = Math.sqrt((12 * sigma * sigma) / passes + 1);
  let lower = Math.floor(ideal);
  if (lower % 2 === 0) lower--;
  const upper = lower + 2;
  const m = Math.round(
    (12 * sigma * sigma - passes * lower * lower - 4 * passes * lower - 3 * passes) /
      (-4 * lower - 4),
  );
  const radii: number[] = [];
  for (let i = 0; i < passes; i++) radii.push(((i < m ? lower : upper) - 1) / 2);
  return radii;
}

/** One box pass along each row, all three channels at once, edges clamped. */
function boxBlurHorizontal(
  src: Float32Array,
  dst: Float32Array,
  width: number,
  height: number,
  radius: number,
): void {
  const span = radius * 2 + 1;
  const last = width - 1;
  for (let y = 0; y < height; y++) {
    const row = y * width * 3;
    let r = 0;
    let g = 0;
    let b = 0;
    for (let k = -radius; k <= radius; k++) {
      const i = row + clampIndex(k, last) * 3;
      r += src[i] as number;
      g += src[i + 1] as number;
      b += src[i + 2] as number;
    }
    for (let x = 0; x < width; x++) {
      const out = row + x * 3;
      dst[out] = r / span;
      dst[out + 1] = g / span;
      dst[out + 2] = b / span;
      const leaving = row + clampIndex(x - radius, last) * 3;
      const entering = row + clampIndex(x + radius + 1, last) * 3;
      r += (src[entering] as number) - (src[leaving] as number);
      g += (src[entering + 1] as number) - (src[leaving + 1] as number);
      b += (src[entering + 2] as number) - (src[leaving + 2] as number);
    }
  }
}

/** One box pass down the columns: a running sum per column, moved one row at a time. */
function boxBlurVertical(
  src: Float32Array,
  dst: Float32Array,
  width: number,
  height: number,
  radius: number,
): void {
  const span = radius * 2 + 1;
  const stride = width * 3;
  const last = height - 1;
  const sums = new Float64Array(stride);
  for (let k = -radius; k <= radius; k++) {
    const row = clampIndex(k, last) * stride;
    for (let c = 0; c < stride; c++) sums[c] = (sums[c] as number) + (src[row + c] as number);
  }
  for (let y = 0; y < height; y++) {
    const out = y * stride;
    const leaving = clampIndex(y - radius, last) * stride;
    const entering = clampIndex(y + radius + 1, last) * stride;
    for (let c = 0; c < stride; c++) {
      const sum = sums[c] as number;
      dst[out + c] = sum / span;
      sums[c] = sum + (src[entering + c] as number) - (src[leaving + c] as number);
    }
  }
}

function clampIndex(i: number, last: number): number {
  return i < 0 ? 0 : i > last ? last : i;
}
