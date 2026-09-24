// A limited palette, the way a gouache painter mixes a couple of dozen colors
// for a picture instead of matching every pixel. k-means over a sample of the
// photo's pixels, measured in Oklab (Björn Ottosson, 2020) so that colors a
// person would call the same land in the same cluster; then every pixel is
// replaced by its cluster's color.
import {createRandom, type Random, type Raster} from '../../dist/index.js';

/** How many pixels k-means learns the palette from. */
const SAMPLES = 40_000;
/** Rounds of k-means. The palette stops moving well before this. */
const ROUNDS = 12;
/**
 * A pixel further than this from every cluster, in Oklab, is an accent too
 * small to earn a cluster of its own: a neon sign, a red collar. A painter
 * would mix it specially, so it keeps its own color.
 */
const ACCENT_DISTANCE = 0.09;

/** The same picture in `count` colors, plus whatever accents stand apart from them. */
export function reducePalette(source: Raster, count: number, seed: number): Raster {
  const pixels = source.width * source.height;
  const random = createRandom(seed);
  const samples = Math.min(pixels, SAMPLES);
  const lab = new Float32Array(samples * 3);
  const rgb = new Float32Array(samples * 3);
  for (let s = 0; s < samples; s++) {
    const i = random.index(pixels) * 3;
    rgb.set(source.data.subarray(i, i + 3), s * 3);
    lab.set(toOklab(source.data, i), s * 3);
  }

  const centers = seedCenters(lab, count, random);
  // Each cluster is painted in the average photo color of its members, not
  // its center converted back, so the palette is made of colors the photo has.
  const paints = new Float64Array(count * 3);
  for (let round = 0; round < ROUNDS; round++) {
    const sums = new Float64Array(count * 3);
    const sizes = new Uint32Array(count);
    paints.fill(0);
    for (let s = 0; s < samples; s++) {
      const [k] = nearest(centers, lab, s * 3);
      sizes[k] = (sizes[k] as number) + 1;
      for (let c = 0; c < 3; c++) {
        sums[k * 3 + c] = (sums[k * 3 + c] as number) + (lab[s * 3 + c] as number);
        paints[k * 3 + c] = (paints[k * 3 + c] as number) + (rgb[s * 3 + c] as number);
      }
    }
    for (let k = 0; k < count; k++) {
      const size = sizes[k] as number;
      if (size === 0) continue;
      for (let c = 0; c < 3; c++) {
        centers[k * 3 + c] = (sums[k * 3 + c] as number) / size;
        paints[k * 3 + c] = (paints[k * 3 + c] as number) / size;
      }
    }
  }

  const data = new Float32Array(pixels * 3);
  const accent = ACCENT_DISTANCE ** 2;
  for (let i = 0; i < pixels * 3; i += 3) {
    const [k, distance] = nearest(centers, toOklab(source.data, i), 0);
    const from =
      distance > accent ? source.data.subarray(i, i + 3) : paints.subarray(k * 3, k * 3 + 3);
    data.set(from, i);
  }
  return {width: source.width, height: source.height, data};
}

/** k-means++: each new center is picked with odds by its squared distance to the nearest so far. */
function seedCenters(lab: Float32Array, count: number, random: Random): Float32Array {
  const samples = lab.length / 3;
  const centers = new Float32Array(count * 3);
  centers.set(lab.subarray(0, 3), 0);
  const distance = new Float64Array(samples).fill(Number.POSITIVE_INFINITY);
  for (let k = 1; k < count; k++) {
    const newest = centers.subarray((k - 1) * 3, k * 3);
    let total = 0;
    for (let s = 0; s < samples; s++) {
      const d = Math.min(distance[s] as number, squaredDistance(lab, s * 3, newest, 0));
      distance[s] = d;
      total += d;
    }
    let pick = random.next() * total;
    let s = 0;
    while (s < samples - 1) {
      pick -= distance[s] as number;
      if (pick <= 0) break;
      s++;
    }
    centers.set(lab.subarray(s * 3, s * 3 + 3), k * 3);
  }
  return centers;
}

/** The nearest center to the color at `at` in `colors`, and its squared distance. */
function nearest(centers: Float32Array, colors: ArrayLike<number>, at: number): [number, number] {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let k = 0; k < centers.length / 3; k++) {
    const d = squaredDistance(colors, at, centers, k * 3);
    if (d < bestDistance) {
      bestDistance = d;
      best = k;
    }
  }
  return [best, bestDistance];
}

function squaredDistance(a: ArrayLike<number>, i: number, b: ArrayLike<number>, j: number): number {
  const dl = (a[i] as number) - (b[j] as number);
  const da = (a[i + 1] as number) - (b[j + 1] as number);
  const db = (a[i + 2] as number) - (b[j + 2] as number);
  return dl * dl + da * da + db * db;
}

/** The sRGB pixel whose red channel is at `i`, in Oklab. */
function toOklab(data: Float32Array, i: number): [number, number, number] {
  const r = linear(data[i] as number);
  const g = linear(data[i + 1] as number);
  const b = linear(data[i + 2] as number);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function linear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
