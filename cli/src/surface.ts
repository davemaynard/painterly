// What happens to a painting after the last stroke: how the paint sits on its
// support. Every pass works in place on an RGB raster (floats, 0..255), and
// each style picks the passes its medium needs.
import {blur, type Raster, sobel} from '../../dist/index.js';
import {noiseField} from './noise.ts';

/**
 * Light the paint's own relief, diffuse only: a matte medium has no sheen, so
 * there is no highlight, just the soft shadow of each ridge. Only texture
 * narrower than `texture` pixels is lit. A stroke's overall height against its
 * neighbors, lit, reads as the terraces of a contour map, not as paint.
 */
export function shadeRelief(
  image: Raster,
  heights: Raster,
  {amount, texture}: {amount: number; texture: number},
): void {
  const surface = blur(heights, 1);
  const broadForm = blur(surface, texture).data;
  for (let i = 0; i < surface.data.length; i++) {
    surface.data[i] = 128 + (surface.data[i] as number) - (broadForm[i] as number);
  }
  const {gx, gy} = sobel(surface);

  // Light from the upper left, a little above the canvas. `flat` is what a
  // level patch receives, so shading only darkens or lifts the slopes.
  const [lx, ly, lz] = normalize(-0.5, -0.6, 0.62);
  const tilt = 1 / 90;
  const {data} = image;
  for (let px = 0, i = 0; px < gx.length; px++, i += 3) {
    const nx = -(gx[px] as number) * tilt;
    const ny = -(gy[px] as number) * tilt;
    const diffuse = (nx * lx + ny * ly + lz) / Math.hypot(nx, ny, 1);
    multiply(data, i, 1 + amount * ((diffuse - lz) / lz));
  }
}

/**
 * The tonal range and color of a flat finish: darks lifted to `floor`,
 * highlights held at `ceiling`, color pulled `quieten` of the way to gray.
 */
export function grade(
  image: Raster,
  {floor, ceiling, quieten}: {floor: number; ceiling: number; quieten: number},
): void {
  const range = (ceiling - floor) / 255;
  const {data} = image;
  for (let i = 0; i < data.length; i += 3) {
    const gray = luma(data, i);
    for (let c = i; c < i + 3; c++) {
      const value = data[c] as number;
      data[c] = floor + (value + (gray - value) * quieten) * range;
    }
  }
}

/** A plain-weave canvas: over-under threads about three pixels apart. */
export function canvasWeave(image: Raster, strength: number): void {
  const {width, height, data} = image;
  for (let y = 0, i = 0; y < height; y++) {
    for (let x = 0; x < width; x++, i += 3) {
      const warp = Math.sin(x * 2.1) * 0.5 + 0.5;
      const weft = Math.sin(y * 2.1) * 0.5 + 0.5;
      const over = (Math.floor(x / 3) + Math.floor(y / 3)) % 2 === 0 ? warp : weft;
      multiply(data, i, 1 + strength * (over * 2 - 1));
    }
  }
}

/** The tooth of cold-press paper: a fine grain over a softer mottle. */
export function paperGrain(image: Raster, strength: number, seed: number): void {
  const tooth = noiseField(image.width, image.height, seed, [
    [1, 1],
    [4, 0.6],
  ]);
  for (let px = 0; px < tooth.length; px++) {
    multiply(image.data, px * 3, 1 + strength * (tooth[px] as number));
  }
}

/**
 * Pigment pools at the edge of a wash as it dries, so the darker side of every
 * edge darkens a little more, by `amount` per unit of local contrast.
 */
export function edgeDarken(image: Raster, amount: number, sigma: number): void {
  const around = blur(image, sigma).data;
  const {data} = image;
  for (let i = 0; i < data.length; i += 3) {
    const pooled = Math.max(0, luma(around, i) - luma(data, i)) / 255;
    multiply(data, i, 1 - amount * pooled);
  }
}

/**
 * Pigment settling into the paper's hollows: speckled darkening, strongest
 * where the wash is densest and absent on bare paper.
 */
export function granulate(image: Raster, amount: number, seed: number): void {
  const grains = noiseField(image.width, image.height, seed + 1, [[1, 1]]);
  const {data} = image;
  for (let px = 0, i = 0; px < grains.length; px++, i += 3) {
    const density = 1 - luma(data, i) / 255;
    multiply(data, i, 1 - amount * density * Math.max(0, grains[px] as number));
  }
}

/**
 * A wash dries unevenly: pigment gathers in places and thins in others, at the
 * scale of a hand rather than a pixel. Deepens or lightens each color's
 * distance from white by up to `amount`, so bare paper stays white.
 */
export function pigmentDensity(image: Raster, amount: number, scale: number, seed: number): void {
  const turbulence = noiseField(image.width, image.height, seed + 2, [
    [scale, 1],
    [scale / 4, 0.5],
  ]);
  const {data} = image;
  for (let px = 0, i = 0; px < turbulence.length; px++, i += 3) {
    const density = 1 + amount * (turbulence[px] as number);
    for (let c = i; c < i + 3; c++) data[c] = 255 - (255 - (data[c] as number)) * density;
  }
}

/** Let the paper glow through: every color moves `clarity` of the way to white. */
export function transparency(image: Raster, clarity: number): void {
  const {data} = image;
  for (let i = 0; i < data.length; i++) data[i] = 255 - (255 - (data[i] as number)) * (1 - clarity);
}

/**
 * Push each pixel up to `distance` pixels along a smooth random field of
 * `scale`, so edges that were ruled straight in the photo wander the way a
 * wash's edge does. Returns a new raster.
 */
export function wobble(source: Raster, distance: number, scale: number, seed: number): Raster {
  const {width, height} = source;
  const shiftX = noiseField(width, height, seed + 3, [[scale, 1]]);
  const shiftY = noiseField(width, height, seed + 4, [[scale, 1]]);
  const data = new Float32Array(source.data.length);
  for (let y = 0, px = 0; y < height; y++) {
    for (let x = 0; x < width; x++, px++) {
      const sx = clamp(Math.round(x + (shiftX[px] as number) * distance), width - 1);
      const sy = clamp(Math.round(y + (shiftY[px] as number) * distance), height - 1);
      data.set(source.data.subarray((sy * width + sx) * 3, (sy * width + sx) * 3 + 3), px * 3);
    }
  }
  return {width, height, data};
}

/** Rec. 601 luma of the pixel whose red channel is at `i`. */
function luma(data: Float32Array, i: number): number {
  return (
    0.299 * (data[i] as number) + 0.587 * (data[i + 1] as number) + 0.114 * (data[i + 2] as number)
  );
}

function multiply(data: Float32Array, i: number, factor: number): void {
  data[i] = (data[i] as number) * factor;
  data[i + 1] = (data[i + 1] as number) * factor;
  data[i + 2] = (data[i + 2] as number) * factor;
}

function normalize(x: number, y: number, z: number): [number, number, number] {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
}

const clamp = (value: number, max: number) => (value < 0 ? 0 : value > max ? max : value);
