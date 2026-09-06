// The planner's view of a picture: a flat float array of RGB, no alpha, no
// canvas. Keeping the model off the DOM is what lets `plan()` run and be tested
// in Node, and what keeps it pure.
import type {Rgb} from '../types';

export type Raster = {
  width: number;
  height: number;
  /** RGB interleaved, row-major, 0..255. Length is width * height * 3. */
  data: Float32Array;
};

export function createRaster(width: number, height: number, fill?: Rgb): Raster {
  const data = new Float32Array(width * height * 3);
  if (fill) {
    for (let i = 0; i < data.length; i += 3) {
      data[i] = fill[0];
      data[i + 1] = fill[1];
      data[i + 2] = fill[2];
    }
  }
  return {width, height, data};
}

/** From a browser ImageData (or anything shaped like one). Alpha is dropped. */
export function rasterFromImageData(image: {
  width: number;
  height: number;
  data: Uint8ClampedArray | Uint8Array;
}): Raster {
  const raster = createRaster(image.width, image.height);
  const {data} = raster;
  const source = image.data;
  for (let px = 0, s = 0, d = 0; px < image.width * image.height; px++, s += 4, d += 3) {
    data[d] = source[s] as number;
    data[d + 1] = source[s + 1] as number;
    data[d + 2] = source[s + 2] as number;
  }
  return raster;
}

export function cloneRaster(raster: Raster): Raster {
  return {width: raster.width, height: raster.height, data: raster.data.slice()};
}

/** The pixel at integer (x, y), clamped to the edges. */
export function sample(raster: Raster, x: number, y: number, out: Rgb = [0, 0, 0]): Rgb {
  const cx = x < 0 ? 0 : x >= raster.width ? raster.width - 1 : x | 0;
  const cy = y < 0 ? 0 : y >= raster.height ? raster.height - 1 : y | 0;
  const i = (cy * raster.width + cx) * 3;
  out[0] = raster.data[i] as number;
  out[1] = raster.data[i + 1] as number;
  out[2] = raster.data[i + 2] as number;
  return out;
}

/** Euclidean distance in RGB, the difference measure Hertzmann uses. 0..441. */
export function colorDistance(a: Rgb, b: Rgb): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * The colour the canvas starts as. The 2020 sketches primed with the single most
 * common pixel value, which on a photo means one arbitrary value wins by a hair
 * and a sky that shades across sixty levels loses to a flat wall. People see
 * colour in families, so this counts by hue (twelve of them, plus dark, mid and
 * light neutrals), takes the biggest family, and averages the pixels in it.
 */
export function dominantColor(raster: Raster): Rgb {
  const {data} = raster;
  const pixels = raster.width * raster.height;
  const family = new Uint8Array(pixels);
  const counts = new Uint32Array(15);
  for (let px = 0, i = 0; px < pixels; px++, i += 3) {
    const f = hueFamily(data[i] as number, data[i + 1] as number, data[i + 2] as number);
    family[px] = f;
    counts[f] = (counts[f] as number) + 1;
  }
  let best = 0;
  for (let f = 1; f < counts.length; f++) {
    if ((counts[f] as number) > (counts[best] as number)) best = f;
  }
  const sum: Rgb = [0, 0, 0];
  for (let px = 0, i = 0; px < pixels; px++, i += 3) {
    if (family[px] !== best) continue;
    sum[0] += data[i] as number;
    sum[1] += data[i + 1] as number;
    sum[2] += data[i + 2] as number;
  }
  const n = counts[best] as number;
  return [Math.round(sum[0] / n), Math.round(sum[1] / n), Math.round(sum[2] / n)];
}

/** 0..11 are hue sectors of 30 degrees; 12, 13, 14 are dark, mid and light neutrals. */
function hueFamily(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const lightness = (max + min) / 2;
  const saturation = chroma === 0 ? 0 : chroma / (255 - Math.abs(2 * lightness - 255));
  if (saturation < 0.18) return lightness < 85 ? 12 : lightness < 170 ? 13 : 14;
  let hue: number;
  if (max === r) hue = ((g - b) / chroma + 6) % 6;
  else if (max === g) hue = (b - r) / chroma + 2;
  else hue = (r - g) / chroma + 4;
  return Math.floor(hue * 2) % 12;
}
