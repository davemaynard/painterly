// Where the picture is heading, pixel by pixel. Strokes run perpendicular to
// the gradient, which is what makes them follow an edge, the grain of fur, or
// the line of a roof instead of wandering.
import type {Raster} from './raster';

export type Gradient = {
  width: number;
  height: number;
  /** d(luminance)/dx per pixel. */
  gx: Float32Array;
  /** d(luminance)/dy per pixel. */
  gy: Float32Array;
};

export function luminance(raster: Raster): Float32Array {
  const out = new Float32Array(raster.width * raster.height);
  const {data} = raster;
  for (let px = 0, i = 0; px < out.length; px++, i += 3) {
    out[px] =
      0.299 * (data[i] as number) +
      0.587 * (data[i + 1] as number) +
      0.114 * (data[i + 2] as number);
  }
  return out;
}

/** Sobel operator over luminance, edges clamped. */
export function sobel(raster: Raster): Gradient {
  const {width, height} = raster;
  const lum = luminance(raster);
  const gx = new Float32Array(width * height);
  const gy = new Float32Array(width * height);
  const at = (x: number, y: number) => {
    const cx = x < 0 ? 0 : x >= width ? width - 1 : x;
    const cy = y < 0 ? 0 : y >= height ? height - 1 : y;
    return lum[cy * width + cx] as number;
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      gx[i] =
        -at(x - 1, y - 1) +
        at(x + 1, y - 1) +
        -2 * at(x - 1, y) +
        2 * at(x + 1, y) +
        -at(x - 1, y + 1) +
        at(x + 1, y + 1);
      gy[i] =
        -at(x - 1, y - 1) -
        2 * at(x, y - 1) -
        at(x + 1, y - 1) +
        at(x - 1, y + 1) +
        2 * at(x, y + 1) +
        at(x + 1, y + 1);
    }
  }
  return {width, height, gx, gy};
}
