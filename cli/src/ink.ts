// Pen lines for the watercolor style: an extended difference of Gaussians
// (Winnemöller, Kyprianidis and Olsen, "XDoG", 2012) over the photo's
// luminance. Two blurs a little apart in scale are subtracted, which leaves a
// signal only where the picture changes at that scale; its dark side becomes
// a line with a soft, pen-like edge.
//
// A pen draws shapes, not texture, so a line is only kept where the picture
// also has an edge at a coarser scale. That is what stops a lawn or a gravel
// path from turning into scribble.
import {blur, luminance, type Raster, type Rgb, sobel} from '../../dist/index.js';

export type InkOptions = {
  /** Width of the finer blur, in pixels; the pen's nib. */
  sigma: number;
  /** How hard the line's edge is. Higher is crisper. */
  sharpness: number;
  /** How much coarser than the nib a shape's edge must be, as a multiple of `sigma`. */
  shapeScale: number;
  /** The share of the picture, weakest edges first, that gets no line at all. */
  keep: number;
};

/** Ink coverage per pixel, from 0 (bare paper) to 1 (a solid line). */
export function inkLines(source: Raster, options: InkOptions): Float32Array {
  const {sigma, sharpness, shapeScale, keep} = options;
  const gray = grayRaster(source);
  const fine = blur(gray, sigma).data;
  const wide = blur(gray, sigma * 1.6).data;
  const shapes = shapeStrength(gray, sigma * shapeScale, keep);

  const coverage = new Float32Array(source.width * source.height);
  for (let px = 0; px < coverage.length; px++) {
    // Negative on the dark side of an edge at the nib's scale.
    const difference = (fine[px * 3] as number) - 0.985 * (wide[px * 3] as number);
    const line = difference >= 0 ? 0 : -Math.tanh(sharpness * difference);
    coverage[px] = line * (shapes[px] as number);
  }
  return coverage;
}

/** Lay the lines over the painting in `color`, at `opacity`. */
export function drawInk(image: Raster, coverage: Float32Array, color: Rgb, opacity: number): void {
  const {data} = image;
  for (let px = 0, i = 0; px < coverage.length; px++, i += 3) {
    const a = (coverage[px] as number) * opacity;
    for (let c = 0; c < 3; c++) {
      data[i + c] = (data[i + c] as number) + ((color[c] as number) - (data[i + c] as number)) * a;
    }
  }
}

/** Luminance, 0..1, in the first channel of a raster so the shared blur can take it. */
function grayRaster(source: Raster): Raster {
  const lum = luminance(source);
  const data = new Float32Array(lum.length * 3);
  for (let px = 0; px < lum.length; px++) data[px * 3] = (lum[px] as number) / 255;
  return {width: source.width, height: source.height, data};
}

/**
 * How near each pixel is to a real shape edge, 0..1, from the gradient at a
 * coarser scale: edges weaker than the `keep` quantile fade out, and the
 * strongest tenth of the rest count in full.
 */
function shapeStrength(gray: Raster, sigma: number, keep: number): Float32Array {
  const coarse = blur(gray, sigma);
  for (let i = 0; i < coarse.data.length; i++) coarse.data[i] = (coarse.data[i] as number) * 255;
  const {gx, gy} = sobel(coarse);
  const magnitude = new Float32Array(gx.length);
  for (let px = 0; px < gx.length; px++) {
    magnitude[px] = Math.hypot(gx[px] as number, gy[px] as number);
  }

  const sorted = magnitude.slice().sort();
  const low = sorted[Math.floor(sorted.length * keep * 0.8)] as number;
  const high = sorted[Math.floor(sorted.length * Math.min(0.995, keep + 0.1))] as number;
  const strength = new Float32Array(gx.length);
  for (let px = 0; px < gx.length; px++) {
    const t = ((magnitude[px] as number) - low) / (high - low || 1);
    strength[px] = t < 0 ? 0 : t > 1 ? 1 : t;
  }
  return strength;
}
