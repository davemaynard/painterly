// Gaussian blur, approximated by three box blurs. Each layer of the painting
// looks at the photo blurred to that brush's scale, so a big brush is not asked
// to chase detail it cannot make. Three passes of a box filter are within a
// few percent of a true Gaussian and run in linear time regardless of radius.
import {createRaster, type Raster} from './raster';

export function blur(source: Raster, sigma: number): Raster {
  if (sigma < 0.5) return {...source, data: source.data.slice()};
  let current = source;
  const scratch = createRaster(source.width, source.height);
  for (const radius of boxRadiiForGaussian(sigma, 3)) {
    const next = createRaster(source.width, source.height);
    boxBlurHorizontal(current, scratch, radius);
    boxBlurVertical(scratch, next, radius);
    current = next;
  }
  return current;
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

function boxBlurHorizontal(src: Raster, dst: Raster, radius: number): void {
  const {width, height} = src;
  const span = radius * 2 + 1;
  for (let y = 0; y < height; y++) {
    const row = y * width * 3;
    for (let c = 0; c < 3; c++) {
      let acc = 0;
      // Prime the window over [-radius, radius] with edge clamping.
      for (let k = -radius; k <= radius; k++) {
        acc += src.data[row + clampIndex(k, width) * 3 + c] as number;
      }
      for (let x = 0; x < width; x++) {
        dst.data[row + x * 3 + c] = acc / span;
        const leaving = clampIndex(x - radius, width);
        const entering = clampIndex(x + radius + 1, width);
        acc +=
          (src.data[row + entering * 3 + c] as number) -
          (src.data[row + leaving * 3 + c] as number);
      }
    }
  }
}

function boxBlurVertical(src: Raster, dst: Raster, radius: number): void {
  const {width, height} = src;
  const span = radius * 2 + 1;
  const stride = width * 3;
  for (let x = 0; x < width; x++) {
    for (let c = 0; c < 3; c++) {
      const col = x * 3 + c;
      let acc = 0;
      for (let k = -radius; k <= radius; k++) {
        acc += src.data[clampIndex(k, height) * stride + col] as number;
      }
      for (let y = 0; y < height; y++) {
        dst.data[y * stride + col] = acc / span;
        const leaving = clampIndex(y - radius, height);
        const entering = clampIndex(y + radius + 1, height);
        acc +=
          (src.data[entering * stride + col] as number) -
          (src.data[leaving * stride + col] as number);
      }
    }
  }
}

function clampIndex(i: number, n: number): number {
  return i < 0 ? 0 : i >= n ? n - 1 : i;
}
