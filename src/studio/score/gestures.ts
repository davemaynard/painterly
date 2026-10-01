// The movements a painter's hand makes, as small generators of gestures:
// criss-cross strokes that blend a sky, pats of a knife, pounces of a pad, a
// trunk pulled up from the ground. A score is mostly these, aimed at places.
// Every random choice comes from the Random passed in, so a score is the same
// painting each time it is built.
import type {Random} from '../../random.ts';
import type {Mix} from '../engine/pigments.ts';
import type {Gesture, Handling, Point, Speck, StrokePoint} from './types.ts';

/** An area of the canvas that gestures can be scattered over. */
export type Region = {
  bounds: {left: number; top: number; right: number; bottom: number};
  contains(point: Point): boolean;
};

export function rectangle(left: number, top: number, right: number, bottom: number): Region {
  return {
    bounds: {left, top, right, bottom},
    contains: ({x, y}) => x >= left && x <= right && y >= top && y <= bottom,
  };
}

/** A region bounded by a closed outline (even-odd rule). */
export function outline(points: Point[]): Region {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    bounds: {
      left: Math.min(...xs),
      top: Math.min(...ys),
      right: Math.max(...xs),
      bottom: Math.max(...ys),
    },
    contains({x, y}) {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const a = points[i] as Point;
        const b = points[j] as Point;
        if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x)
          inside = !inside;
      }
      return inside;
    },
  };
}

/** `count` points spread over `region`, none closer than `gap` inches where room allows. */
export function scatter(random: Random, region: Region, count: number, gap = 0): Point[] {
  const {left, top, right, bottom} = region.bounds;
  const points: Point[] = [];
  let tries = 0;
  while (points.length < count && tries < count * 60) {
    tries++;
    const point = {x: random.between(left, right), y: random.between(top, bottom)};
    if (!region.contains(point)) continue;
    // Relax the gap as the area fills, so the count is always met.
    const needed = gap * Math.max(0, 1 - tries / (count * 30));
    if (needed > 0 && points.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < needed))
      continue;
    points.push(point);
  }
  return points;
}

/**
 * Put points in the order a hand would visit them: from `start`, always on to
 * a near one, with a little wandering. A painter blending a sky works outward
 * from where they began rather than jumping about.
 */
export function tour(random: Random, points: Point[], start: Point): Point[] {
  const left = [...points];
  const ordered: Point[] = [];
  let at = start;
  while (left.length) {
    let best = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let i = 0; i < left.length; i++) {
      const p = left[i] as Point;
      const score = Math.hypot(p.x - at.x, p.y - at.y) * random.between(0.8, 1.25);
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    at = left.splice(best, 1)[0] as Point;
    ordered.push(at);
  }
  return ordered;
}

/** Points along a smooth curve through `points` (Catmull-Rom), about `spacing` inches apart. */
export function smooth(points: StrokePoint[], spacing = 0.1): StrokePoint[] {
  if (points.length < 3) return points;
  const out: StrokePoint[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)] as StrokePoint;
    const p1 = points[i] as StrokePoint;
    const p2 = points[i + 1] as StrokePoint;
    const p3 = points[Math.min(points.length - 1, i + 2)] as StrokePoint;
    const length = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const steps = Math.max(1, Math.ceil(length / spacing));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const blend = (a: number, b: number, c: number, d: number) =>
        0.5 *
        (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({
        x: blend(p0.x, p1.x, p2.x, p3.x),
        y: blend(p0.y, p1.y, p2.y, p3.y),
        pressure: p1.pressure + (p2.pressure - p1.pressure) * t,
      });
    }
  }
  out.push(points[points.length - 1] as StrokePoint);
  return out;
}

/**
 * A short curved stroke through `center` at `angle` (radians, 0 = rightward,
 * y down), `length` inches long, bowed sideways by `bend` inches, with the
 * pressure rising from `pressure[0]` to `pressure[1]` mid-stroke and easing to
 * `pressure[2]` as the brush leaves.
 */
export function arc(
  center: Point,
  angle: number,
  length: number,
  bend: number,
  pressure: [number, number, number],
): StrokePoint[] {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const points: StrokePoint[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    const along = (t - 0.5) * length;
    const side = bend * 4 * t * (1 - t);
    const p =
      t < 0.5
        ? pressure[0] + (pressure[1] - pressure[0]) * (t / 0.5)
        : pressure[1] + (pressure[2] - pressure[1]) * ((t - 0.5) / 0.5);
    points.push({
      x: center.x + dx * along - dy * side,
      y: center.y + dy * along + dx * side,
      pressure: p,
    });
  }
  return points;
}

export type CrissCross = {
  /** Where the hand starts; strokes work outward from here. */
  start: Point;
  count: number;
  length: [number, number];
  /** Strokes keep this far, in inches, from these points. */
  avoid?: {at: Point; distance: number}[];
  pressure?: [number, number, number];
  handling?: Handling;
};

/**
 * Short strokes crossing each other at about ±45°, the way a wide brush
 * blends a sky: X after X, each one bowed a little, walking outward from
 * where the hand began.
 */
export function crissCross(random: Random, region: Region, options: CrissCross): Gesture[] {
  const avoid = options.avoid ?? [];
  const clear = (p: Point) =>
    avoid.every(({at, distance}) => Math.hypot(at.x - p.x, at.y - p.y) > distance);
  const spots = tour(
    random,
    scatter(random, region, options.count, 0.35).filter(clear),
    options.start,
  );
  const gestures: Gesture[] = [];
  spots.forEach((spot, i) => {
    const angle =
      (i % 2 ? 1 : -1) * (Math.PI / 4) +
      random.between(-0.35, 0.35) +
      (random.next() < 0.5 ? Math.PI : 0);
    const length = random.between(...options.length);
    const points = arc(
      spot,
      angle,
      length,
      random.between(-0.18, 0.18),
      options.pressure ?? [0.55, 0.9, 0.6],
    );
    if (!smooth(points, 0.1).every(clear)) return;
    gestures.push({kind: 'stroke', points, ...options.handling});
  });
  return gestures;
}

/**
 * Pats of a painting knife around a drop of paint: the tip set down near it
 * and pushed out a little, lifting as it goes, so the paint is spread into a
 * ragged mass with a crisp lip at every pat.
 */
export function pats(random: Random, center: Point, radius: number, count: number): Gesture[] {
  const gestures: Gesture[] = [];
  for (let i = 0; i < count; i++) {
    // The first pats pick up the drop; later ones carry it further out.
    const reach = radius * Math.sqrt((i + 1) / count);
    const out = random.between(0, Math.PI * 2);
    const from = random.between(0, reach);
    const start = {x: center.x + Math.cos(out) * from, y: center.y + Math.sin(out) * from};
    // The blade faces any way the wrist happens to; the push is short.
    const angle = random.between(0, Math.PI * 2);
    const length = random.between(0.12, 0.38);
    const points: StrokePoint[] = [
      {...start, pressure: random.between(0.6, 0.9)},
      {
        x: start.x + Math.cos(angle) * length * 0.6,
        y: start.y + Math.sin(angle) * length * 0.6,
        pressure: random.between(0.5, 0.75),
      },
      {
        x: start.x + Math.cos(angle) * length,
        y: start.y + Math.sin(angle) * length,
        pressure: 0.25,
      },
    ];
    gestures.push({kind: 'stroke', points});
  }
  return gestures;
}

/**
 * Pounce a pad at each point: press straight down, lift, move on. The hand
 * does not turn the pad between presses, so paint it lifts goes down again a
 * press-width away rather than across the pad.
 */
export function pounce(random: Random, points: Point[], pressure: [number, number]): Gesture[] {
  return points.map((at) => ({kind: 'press' as const, at, pressure: random.between(...pressure)}));
}

/**
 * A tree trunk pulled up from the ground with a flat brush: hard at the base,
 * easing off as it climbs, so the paint runs thin and breaks up near the top.
 * A wide trunk is two passes side by side.
 */
export function trunk(
  random: Random,
  base: Point,
  height: number,
  options: {lean: number; passes: number; width: number; edge?: boolean; fade?: number},
): Gesture[] {
  const gestures: Gesture[] = [];
  for (let pass = 0; pass < options.passes; pass++) {
    // `width` is the gap between side-by-side passes of the brush.
    const offset = (pass - (options.passes - 1) / 2) * options.width;
    // A trunk is never quite straight: a slow bow along its height and a
    // little wander where the hand steadied itself.
    const bow = random.between(-0.08, 0.08);
    const phase = random.between(0, Math.PI * 2);
    const points: StrokePoint[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const fade = options.fade ?? 0.25;
      const wander = 0.02 * Math.sin(t * 9 + phase);
      points.push({
        // Side-by-side passes draw together as they climb: the trunk tapers.
        x:
          base.x +
          offset * (1 - 0.45 * t) +
          options.lean * height * t +
          bow * Math.sin(t * Math.PI) +
          wander,
        y: base.y - height * t,
        pressure: 1 - (1 - fade) * t ** 1.3,
      });
    }
    gestures.push({kind: 'stroke', points, edge: options.edge});
  }
  return gestures;
}

/** A tap of a loaded brush: `count` specks around `from`, spread about `spread` inches. */
export function flick(
  random: Random,
  from: Point,
  mix: Mix,
  count: number,
  spread: number,
  size: [number, number],
): Gesture {
  const specks: Speck[] = [];
  const heading = random.between(0, Math.PI * 2);
  for (let i = 0; i < count; i++) {
    // Mostly near the tap, a few flung further.
    const distance = spread * Math.sqrt(-2 * Math.log(Math.max(1e-6, random.next()))) * 0.6;
    const angle = random.between(0, Math.PI * 2);
    specks.push({
      x: from.x + Math.cos(angle) * distance,
      y: from.y + Math.sin(angle) * distance,
      radius: random.between(...size) * (random.next() < 0.12 ? 1.8 : 1),
      angle: heading + random.between(-0.4, 0.4),
    });
  }
  return {kind: 'flick', from, mix, specks};
}

/**
 * A comb set down on its teeth and flicked up and away: one tuft of grass
 * blades. `lean` bends the flick sideways; `tilt` turns the comb's spine off
 * square, so the blades fan out at different heights.
 */
export function combFlick(at: Point, length: number, lean: number, tilt = 0): Gesture {
  const points: StrokePoint[] = [];
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    points.push({x: at.x + lean * length * t * t, y: at.y - length * t, pressure: 0.95 - 0.8 * t});
  }
  return {kind: 'stroke', points, tilt};
}
