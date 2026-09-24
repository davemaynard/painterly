// Getting pictures in and out: decoding a photo at the size it will be painted,
// the grounds a canvas is primed with, and the JPEG that comes out.
import {execFileSync} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createCanvas, type Image, loadImage} from '@napi-rs/canvas';
import {blur, type Raster, type Rgb, rasterFromImageData} from '../../dist/index.js';

/** Decode, stand upright, and scale so the longer side is `size` pixels. */
export async function loadPhoto(path: string, size: number): Promise<Raster> {
  const image = await loadImage(path).catch(() => loadImage(asJpeg(path)));
  const scale = size / Math.max(image.width, image.height);
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);
  return rasterOf(image, width, height);
}

/**
 * Skia reads JPEG, PNG and WebP, and turns a JPEG upright from its EXIF
 * orientation, but cannot read HEIC. `sips` ships with macOS, reads it, and
 * keeps the orientation tag when it writes a JPEG (not a PNG, which would
 * drop it).
 */
function asJpeg(path: string): string {
  const converted = join(mkdtempSync(join(tmpdir(), 'painterly-')), 'photo.jpg');
  const args = ['-s', 'format', 'jpeg', '-s', 'formatOptions', 'best', path, '--out', converted];
  execFileSync('sips', args, {stdio: 'ignore'});
  return converted;
}

function rasterOf(image: Image, width: number, height: number): Raster {
  const context = createCanvas(width, height).getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);
  // Copied out of Skia's buffer first: indexing that from JS is several times
  // slower than indexing a plain array.
  const data = new Uint8ClampedArray(context.getImageData(0, 0, width, height).data);
  return rasterFromImageData({width, height, data});
}

/**
 * A canvas toned with the picture blurred to `sigma`, as RGBA. A painter tones
 * the canvas so that a gap between strokes shows a color that belongs there;
 * over one flat ground the gaps show as flecks of it.
 */
export function tonedGround(source: Raster, sigma: number): Uint8ClampedArray {
  return rgba(blur(source, sigma));
}

export function flatGround(width: number, height: number, [r, g, b]: Rgb): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let px = 0; px < pixels.length; px += 4) {
    pixels[px] = r;
    pixels[px + 1] = g;
    pixels[px + 2] = b;
    pixels[px + 3] = 255;
  }
  return pixels;
}

export async function encodeJpeg(image: Raster, quality = 92): Promise<Buffer> {
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext('2d');
  const out = context.createImageData(image.width, image.height);
  out.data.set(rgba(image));
  context.putImageData(out, 0, 0);
  return canvas.encode('jpeg', quality);
}

/** A raster as opaque RGBA bytes. */
export function rgba(raster: Raster): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(raster.width * raster.height * 4);
  for (let px = 0, i = 0; i < raster.data.length; px += 4, i += 3) {
    pixels[px] = raster.data[i] as number;
    pixels[px + 1] = raster.data[i + 1] as number;
    pixels[px + 2] = raster.data[i + 2] as number;
    pixels[px + 3] = 255;
  }
  return pixels;
}
