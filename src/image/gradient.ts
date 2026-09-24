// Where the picture is heading, pixel by pixel. Strokes run perpendicular to
// the gradient, which is what makes them follow an edge, the grain of fur, or
// the line of a roof instead of wandering.
import {blur} from './blur';
import {createRaster, type Raster} from './raster';

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

/**
 * The gradient with its direction smoothed over `sigma` pixels, for calmer
 * strokes. Where the picture is nearly flat, a sky or a patch of mist, the
 * Sobel gradient is mostly noise, and strokes that follow it curl along faint
 * contours until the painting turns to swirls. This blurs the structure tensor
 * (the products gx², gx·gy and gy²) and reads the dominant direction back out
 * of it, the usual fix (Kyprianidis and Döllner, "Image Abstraction by
 * Structure Adaptive Filtering", 2008). Blurring the products rather than the
 * gradient keeps the opposite gradients on either side of a line from
 * cancelling, and lets a flat area take the direction of the nearest real
 * edge.
 *
 * The result is shaped like any gradient, so the planner follows it the same
 * way: its direction is the tensor's dominant axis, and its magnitude the
 * root of the tensor's energy, which is zero only where the picture is flat.
 */
export function smoothGradient(raster: Raster, sigma: number): Gradient {
  const {width, height, gx, gy} = sobel(raster);
  // The tensor's three distinct entries ride in a raster's three channels, so
  // one blur smooths them all.
  const tensor = createRaster(width, height);
  for (let px = 0, i = 0; px < gx.length; px++, i += 3) {
    const x = gx[px] as number;
    const y = gy[px] as number;
    tensor.data[i] = x * x;
    tensor.data[i + 1] = x * y;
    tensor.data[i + 2] = y * y;
  }
  const smooth = blur(tensor, sigma).data;
  for (let px = 0, i = 0; px < gx.length; px++, i += 3) {
    const xx = smooth[i] as number;
    const xy = smooth[i + 1] as number;
    const yy = smooth[i + 2] as number;
    const angle = 0.5 * Math.atan2(2 * xy, xx - yy);
    const magnitude = Math.sqrt(xx + yy);
    gx[px] = Math.cos(angle) * magnitude;
    gy[px] = Math.sin(angle) * magnitude;
  }
  return {width, height, gx, gy};
}
