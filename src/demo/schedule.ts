// How the painting spends its time. The plan has a handful of big strokes and
// tens of thousands of small ones, so playing it at a constant strokes-per-
// second would flash the underpainting past in a blink and then crawl. Instead
// each layer gets a share of the total duration: the underpainting goes down
// in the first few seconds, and the finest brush gets the most time because
// that is where the likeness arrives and the eye wants to slow down.
import type {Plan} from '../types';

/** Share of the total duration each layer gets, coarsest first. Renormalised to the plan's layer count. */
const LAYER_SHARES = [0.08, 0.12, 0.18, 0.27, 0.35];

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
  const shares = LAYER_SHARES.slice(-layers.length);
  const shareTotal = shares.reduce((a, b) => a + b, 0) || 1;
  // Each layer as [startTime, endTime, startStroke, endStroke].
  const spans: [number, number, number, number][] = [];
  let time = 0;
  let stroke = 0;
  layers.forEach((size, i) => {
    const length = ((shares[i] ?? 0) / shareTotal) * duration;
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
