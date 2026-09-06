// Seeded randomness for the planner. Everything the painter decides at random
// goes through one of these, so the same seed paints the same picture on any
// machine, which is what makes the timeline scrubbable and the tests exact.
//
// MT19937 comes from the `mersenne-twister` package, bundled into dist so the
// runtime stays dependency-free; see NOTICE.
import MersenneTwister from 'mersenne-twister';

export type Random = {
  /** Uniform in [0, 1). */
  next(): number;
  /** Uniform in [min, max). */
  between(min: number, max: number): number;
  /** Uniform integer in [0, n). */
  index(n: number): number;
  /** Fisher-Yates, in place, and returns the same array. */
  shuffle<T>(items: T[]): T[];
};

export function createRandom(seed: number): Random {
  const twister = new MersenneTwister(seed >>> 0);
  const next = () => twister.random_long();
  return {
    next,
    between: (min, max) => min + (max - min) * next(),
    index: (n) => Math.floor(next() * n),
    shuffle(items) {
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const swap = items[i] as (typeof items)[number];
        items[i] = items[j] as (typeof items)[number];
        items[j] = swap;
      }
      return items;
    },
  };
}

// A small hash-based generator for per-stroke jitter in the renderer. Each
// stroke carries its own 32-bit seed from the plan, so the hand can paint stroke
// k identically whether it got there by playing forward or by scrubbing back.
// mulberry32, public domain (Tommy Ettinger).
export function jitter(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
