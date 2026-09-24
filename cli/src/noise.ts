// Seeded value noise, for everything in a finish that should look random but
// paint the same way twice: paper tooth, pigment settling, a wash's wandering
// edge. Random values sit on a grid `scale` pixels apart and are smoothly
// interpolated between; octaves at several scales are summed.
//
// Value noise rather than blurred white noise, because a blur clamps at the
// border and piles variance up there: a large-scale field built that way comes
// out calm in the middle and blotched along every edge.
import {jitter} from '../../dist/index.js';

/** One layer of the field: grid spacing in pixels, and how much it contributes. */
export type Octave = [scale: number, weight: number];

/** A field of `width` × `height` values with mean 0 and standard deviation 1. */
export function noiseField(
  width: number,
  height: number,
  seed: number,
  octaves: Octave[],
): Float32Array {
  const random = jitter(seed);
  const field = new Float32Array(width * height);
  for (const [scale, weight] of octaves) {
    const cell = Math.max(1, scale);
    const columns = Math.ceil(width / cell) + 2;
    const lattice = new Float32Array(columns * (Math.ceil(height / cell) + 2));
    for (let i = 0; i < lattice.length; i++) lattice[i] = random() * 2 - 1;

    for (let y = 0, px = 0; y < height; y++) {
      const row = Math.floor(y / cell);
      const ty = smoothstep(y / cell - row);
      for (let x = 0; x < width; x++, px++) {
        const column = Math.floor(x / cell);
        const tx = smoothstep(x / cell - column);
        const at = row * columns + column;
        const topLeft = lattice[at] as number;
        const topRight = lattice[at + 1] as number;
        const bottomLeft = lattice[at + columns] as number;
        const bottomRight = lattice[at + columns + 1] as number;
        const top = topLeft + (topRight - topLeft) * tx;
        const bottom = bottomLeft + (bottomRight - bottomLeft) * tx;
        field[px] = (field[px] as number) + weight * (top + (bottom - top) * ty);
      }
    }
  }
  return standardize(field);
}

function standardize(field: Float32Array): Float32Array {
  let sum = 0;
  let squares = 0;
  for (const value of field) {
    sum += value;
    squares += value * value;
  }
  const mean = sum / field.length;
  const deviation = Math.sqrt(squares / field.length - mean * mean) || 1;
  for (let px = 0; px < field.length; px++) {
    field[px] = ((field[px] as number) - mean) / deviation;
  }
  return field;
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);
