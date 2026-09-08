// How the painting spends its time. The plan has a handful of big strokes and
// tens of thousands of small ones, so playing it at a constant strokes-per-
// second would flash the underpainting past in a blink and then crawl. Instead
// each layer gets a share of the total duration: the underpainting goes down
// in the first few seconds, and the finest brush gets the most time because
// that is where the likeness arrives and the eye wants to slow down.
import type {Plan} from '../types';

/**
 * Share of the total duration each layer gets, coarsest first, renormalised to
 * the plan's own layer count. The table is the five-brush default; `sharesFor`
 * stretches it to whatever `radii` the caller actually passed to plan().
 */
const LAYER_SHARES = [0.08, 0.12, 0.18, 0.27, 0.35];
/** Roughly the ratio the table already runs at, used to extend its coarse end. */
const COARSER = 1.5;

/**
 * Fewer brushes than the table take its *tail*, because the last brush is
 * always the one the eye is given the most time on: a one-brush underpainting
 * is the finest share, and so the whole duration. More brushes extend the
 * coarse end, each a step quicker than the one after it, so a caller who asks
 * for six radii gets six paced layers instead of a sixth that lands in a
 * single frame at the very end.
 */
function sharesFor(count: number): number[] {
  if (count <= 0) return [];
  if (count <= LAYER_SHARES.length) return LAYER_SHARES.slice(-count);
  const shares = [...LAYER_SHARES];
  while (shares.length < count) shares.unshift((shares[0] as number) / COARSER);
  return shares;
}

export type Schedule = {
  /** Total playing time in milliseconds. */
  duration: number;
  /** How many strokes should be on the canvas `elapsed` ms in. */
  strokesAt(elapsed: number): number;
  /** The inverse: how far in, in ms, stroke `count` is reached. */
  timeOf(count: number): number;
};

export function createSchedule(painting: Plan, duration: number): Schedule {
  const layers = painting.layerSizes.filter((size) => size > 0);
  const shares = sharesFor(layers.length);
  const shareTotal = shares.reduce((a, b) => a + b, 0) || 1;
  // Each layer as [startTime, endTime, startStroke, endStroke].
  const spans: [number, number, number, number][] = [];
  let time = 0;
  let stroke = 0;
  layers.forEach((size, i) => {
    const length = ((shares[i] as number) / shareTotal) * duration;
    spans.push([time, time + length, stroke, stroke + size]);
    time += length;
    stroke += size;
  });
  const total = stroke;

  return {
    duration,
    strokesAt(elapsed) {
      if (elapsed <= 0) return 0;
      if (elapsed >= duration) return total;
      for (const [t0, t1, s0, s1] of spans) {
        if (elapsed < t1) return Math.floor(s0 + ((elapsed - t0) / (t1 - t0)) * (s1 - s0));
      }
      return total;
    },
    timeOf(count) {
      if (count <= 0) return 0;
      if (count >= total) return duration;
      for (const [t0, t1, s0, s1] of spans) {
        if (count < s1) return t0 + ((count - s0) / (s1 - s0)) * (t1 - t0);
      }
      return duration;
    },
  };
}
