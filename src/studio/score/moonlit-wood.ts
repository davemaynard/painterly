// The painting this page plays: a wood at night, a low moon off to the left,
// a path winding up from the corner to a clearing that holds the light, and a
// fox sitting at its edge. The picture is our own; the method is Jay Lee's,
// step for step, from his video "Iron scrubber painting technique / Painting
// deep in the woods" (2025): paint dropped straight onto the canvas and spread
// with a wide brush, dark masses patted in with a knife, everything pounced
// with a steel-wool scrubber while wet, trunks pulled up with a flat brush,
// then a comb, a hair dryer, a cotton ball and cotton swabs.
//
// Everything is in inches on a 16 × 12 canvas, from the top left.
import {createRandom, type Random} from '../../random.ts';
import type {Mix, PaintName} from '../engine/pigments.ts';
import {
  arc,
  combFlick,
  crissCross,
  flick,
  outline,
  pats,
  pounce,
  type Region,
  rectangle,
  scatter,
  smooth,
  tour,
  trunk,
} from './gestures.ts';
import type {Gesture, Point, Score, Step, StrokePoint} from './types.ts';

const WIDTH = 16;
const HEIGHT = 12;

const MOON = {x: 5.6, y: 2.05, radius: 0.48};
const CLEARING = {x: 8.8, y: 8.95};
/** Where the fox sits: at the clearing's left edge, facing into the light. */
const FOX = {x: 7.65, y: 9.62, scale: 1.8};

/** The far edge of the ground at `x`: a low, uneven line, dipping where the clearing opens. */
const horizon = (x: number) =>
  9.15 +
  0.15 * Math.sin(x * 0.75 + 1.1) +
  0.08 * Math.sin(x * 1.9) -
  0.25 * Math.exp(-((x - CLEARING.x) ** 2) / 3);

/** The path's middle at `t` from the bottom of the canvas (0) to the clearing (1), and its width there. */
function path(t: number): {at: Point; width: number} {
  const p0 = {x: 12.4, y: 12.4};
  const p1 = {x: 12.9, y: 10.9};
  const p2 = {x: 9.8, y: 10.1};
  const p3 = CLEARING;
  const u = 1 - t;
  const at = {
    x: u ** 3 * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t ** 3 * p3.x,
    y: u ** 3 * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t ** 3 * p3.y,
  };
  return {at, width: 3.2 * (1 - t) + 0.4 * t};
}

const pathSide = (side: -1 | 1): Point[] =>
  Array.from({length: 21}, (_, i) => {
    const t = i / 20;
    const here = path(t);
    const ahead = path(Math.min(1, t + 0.02));
    const behind = path(Math.max(0, t - 0.02));
    const dx = ahead.at.x - behind.at.x;
    const dy = ahead.at.y - behind.at.y;
    const length = Math.hypot(dx, dy) || 1;
    return {
      x: here.at.x - (dy / length) * side * here.width * 0.5,
      y: here.at.y + (dx / length) * side * here.width * 0.5,
    };
  });

const PATH: Region = outline([...pathSide(-1), ...pathSide(1).reverse()]);

const SKY: Region = outline([
  {x: -0.2, y: -0.2},
  {x: WIDTH + 0.2, y: -0.2},
  ...Array.from({length: 33}, (_, i) => {
    const x = WIDTH + 0.2 - (i / 32) * (WIDTH + 0.4);
    return {x, y: horizon(x) + 0.1};
  }),
]);

/** The sky above the mist, where the wide brush crisscrosses. */
const UPPER_SKY: Region = rectangle(-0.3, -0.3, WIDTH + 0.3, 6.2);

const GROUND: Region = outline([
  ...Array.from({length: 33}, (_, i) => {
    const x = -0.2 + (i / 32) * (WIDTH + 0.4);
    return {x, y: horizon(x) - 0.05};
  }),
  {x: WIDTH + 0.2, y: HEIGHT + 0.2},
  {x: -0.2, y: HEIGHT + 0.2},
]);

const near = (a: Point, b: Point, distance: number) => Math.hypot(a.x - b.x, a.y - b.y) < distance;

// ─── The drops ──────────────────────────────────────────────────────────────
//
// Before any brush, every paint the picture needs goes onto the canvas as a
// drop, roughly where it will end up: white along the line the light will
// take, from the moon down to the clearing; sky blue around it; Prussian blue
// where the woods go dark; a row of small blues for the mist; earth colors
// and greens for the ground, warm toward the path.

type Drop = {at: Point; paint: PaintName; size?: number};

// One letter per tube, so the rows below can be read across like the canvas.
const W: PaintName = 'titaniumWhite';
const S: PaintName = 'skyBlue';
const C: PaintName = 'cobaltBlue';
const P: PaintName = 'prussianBlue';

// biome-ignore format: the drops read as the rows they make on the canvas
const SKY_ROWS: [number, [number, PaintName][]][] = [
  [0.7, [[0.6, C], [2.2, S], [3.8, S], [5.6, W], [7.2, S], [8.8, S], [10.4, S], [12, S], [13.6, S], [15.3, C]]],
  [2, [[1.4, P], [3, S], [4.6, W], [5.6, W], [6.6, W], [8.2, S], [10, P], [11.8, S], [13.4, P], [15, S]]],
  [3.3, [[0.6, P], [2.2, P], [3.8, S], [5.3, W], [6.8, W], [8.4, S], [10.2, S], [12, P], [13.8, P], [15.3, P]]],
  [4.6, [[1.4, P], [3, S], [4.6, S], [6.3, W], [7.6, W], [9, S], [10.6, P], [12.4, S], [14.2, P]]],
  [5.9, [[0.6, S], [2.2, P], [3.8, S], [5.6, S], [7.3, W], [8.5, W], [9.8, S], [11.2, P], [12.8, S], [14.6, S]]],
];

const MIST_ROW: Drop[] = Array.from({length: 18}, (_, i) => {
  const x = 0.5 + i * 0.885;
  const white = Math.abs(x - CLEARING.x) < 0.9;
  return {at: {x, y: 7.45}, paint: white ? W : S, size: 0.72};
});

const G: PaintName = 'sapGreen';
const T: PaintName = 'phthaloGreen';
const O: PaintName = 'yellowOchre';
const R: PaintName = 'burntSienna';
const K: PaintName = 'marsBlack';

// biome-ignore format: the drops read as the rows they make on the canvas
const GROUND_ROWS: [number, [number, PaintName][]][] = [
  [9.65, [[0.5, T], [2.2, G], [4, R], [6, O], [8.7, W], [9.8, O], [11.3, O], [12.9, R], [14.4, G], [15.6, T]]],
  [10.65, [[0.5, K], [2, T], [3.6, T], [5.2, G], [7, G], [8.6, G], [10.6, W], [11.7, O], [12.9, O], [14.2, G], [15.5, K]]],
  [11.55, [[0.5, K], [2, T], [3.6, G], [5.2, T], [7, G], [8.8, T], [10.5, G], [11.9, O], [12.9, W], [14, O], [15.5, K]]],
];

/** Warm paint along the path, whiter toward the clearing where the light is strongest. */
const PATH_DROPS: Drop[] = (
  [
    [0.05, 'yellowOchre'],
    [0.15, 'titaniumWhite'],
    [0.25, 'yellowOchre'],
    [0.35, 'titaniumWhite'],
    [0.45, 'yellowOchre'],
    [0.55, 'titaniumWhite'],
    [0.65, 'cadmiumYellow'],
    [0.74, 'titaniumWhite'],
    [0.83, 'titaniumWhite'],
    [0.92, 'titaniumWhite'],
  ] as [number, PaintName][]
).map(([t, paint]) => ({at: path(t).at, paint}));

const DROPS: Drop[] = [
  ...SKY_ROWS.flatMap(([y, row]) =>
    row.map(([x, paint]) => ({at: {x, y}, paint, size: paint === W ? 1.3 : 1})),
  ),
  ...MIST_ROW,
  ...GROUND_ROWS.flatMap(([y, row]) => row.map(([x, paint]) => ({at: {x, y}, paint})))
    // The path's own drops take these places.
    .filter((drop) => PATH_DROPS.every((p) => !near(p.at, drop.at, 0.6))),
  ...PATH_DROPS,
];

const PRUSSIAN_DROPS = DROPS.filter((drop) => drop.paint === P).map((drop) => drop.at);
/** Drops the sky brush must not reach: the dark ones are the knife's, the low ones belong to the mist and the ground. */
const KEEP_CLEAR = DROPS.filter((drop) => drop.paint === P || drop.at.y > 7).map((drop) => drop.at);

// ─── The trunks ─────────────────────────────────────────────────────────────
//
// Three depths. Far trunks are thin, lighter and bluer, painted first; then
// the middle distance; then the near trunks, wide, rooted below the bottom
// edge. The moon and the clearing are kept open.

type Depth = 'far' | 'middle' | 'near';
type Trunk = {x: number; depth: Depth};

/** A trunk as painted: where it is rooted, how far it leans per inch climbed, how wide it is. */
type Planted = Trunk & {base: Point; lean: number; width: number};

const TRUNKS: Trunk[] = [
  {x: 0.3, depth: 'middle'},
  {x: 1.05, depth: 'near'},
  {x: 1.75, depth: 'far'},
  {x: 2.05, depth: 'far'},
  {x: 2.85, depth: 'middle'},
  {x: 3.75, depth: 'near'},
  {x: 4.2, depth: 'far'},
  {x: 4.6, depth: 'middle'},
  {x: 6.3, depth: 'far'},
  {x: 6.75, depth: 'middle'},
  {x: 9.9, depth: 'far'},
  {x: 10.45, depth: 'middle'},
  {x: 10.8, depth: 'far'},
  {x: 11.7, depth: 'middle'},
  {x: 12.6, depth: 'far'},
  {x: 12.95, depth: 'middle'},
  {x: 13.3, depth: 'far'},
  {x: 14.1, depth: 'near'},
  {x: 14.95, depth: 'middle'},
  {x: 15.3, depth: 'far'},
  {x: 15.85, depth: 'near'},
];

const TRUNK_PAINT: Record<
  Depth,
  {mix: Mix; amount: number; passes: number; spacing: number; width: number}
> = {
  far: {
    mix: {prussianBlue: 2, burntUmber: 1, skyBlue: 1},
    amount: 7,
    passes: 1,
    spacing: 0,
    width: 0.2,
  },
  middle: {
    mix: {burntUmber: 2, marsBlack: 1, prussianBlue: 1},
    amount: 14,
    passes: 1,
    spacing: 0,
    width: 0.42,
  },
  near: {mix: {burntUmber: 2, marsBlack: 2}, amount: 16, passes: 2, spacing: 0.34, width: 0.76},
};

function plant(random: Random): Planted[] {
  return TRUNKS.map((tree) => {
    const base =
      tree.depth === 'near'
        ? {x: tree.x, y: HEIGHT + 0.3}
        : tree.depth === 'middle'
          ? {x: tree.x, y: horizon(tree.x) + random.between(0.6, 1.4)}
          : {x: tree.x, y: horizon(tree.x) + random.between(0.05, 0.3)};
    return {
      ...tree,
      base,
      lean: random.between(-0.045, 0.045),
      width: TRUNK_PAINT[tree.depth].width,
    };
  });
}

/** Where a planted trunk's middle is at height `y`. */
const trunkX = (tree: Planted, y: number) => tree.base.x + tree.lean * (tree.base.y - y);

// ─── The fox ────────────────────────────────────────────────────────────────
//
// Drawn in white with the liner: sitting, side on, facing right into the
// clearing, ears up, its brush of a tail curled round its front paws. Points
// are in units of the fox's height, from the ground beneath its chest.

const FOX_BODY: [number, number][] = [
  // From the ground behind the haunch, round it and up the back.
  [-0.26, 0],
  [-0.31, -0.08],
  [-0.32, -0.18],
  [-0.29, -0.28],
  [-0.22, -0.37],
  [-0.14, -0.45],
  [-0.07, -0.55],
  [-0.03, -0.64],
  // The nape, the skull, the brow.
  [-0.01, -0.72],
  [0.02, -0.79],
  [0.07, -0.835],
  [0.13, -0.84],
  [0.19, -0.815],
  // The long snout to the nose, and back under the jaw.
  [0.27, -0.78],
  [0.36, -0.755],
  [0.33, -0.735],
  [0.24, -0.72],
  [0.17, -0.7],
  // Throat, chest, the front leg, the paw.
  [0.13, -0.67],
  [0.12, -0.6],
  [0.14, -0.5],
  [0.15, -0.4],
  [0.15, -0.3],
  [0.15, -0.12],
  [0.19, -0.03],
  [0.19, 0],
  [0.08, 0],
];

/** The far ear and the near one, each base, tip, base. */
const FOX_EARS: [number, number][][] = [
  [
    [-0.005, -0.8],
    [0.015, -0.99],
    [0.06, -0.835],
  ],
  [
    [0.06, -0.84],
    [0.11, -1.0],
    [0.15, -0.83],
  ],
];

/** The middle line of the tail, from where it leaves the haunch to its tip, and its thickness along the way. */
const FOX_TAIL: [number, number, number][] = [
  [-0.3, -0.04, 0.06],
  [-0.26, 0.03, 0.09],
  [-0.12, 0.07, 0.1],
  [0.04, 0.08, 0.1],
  [0.18, 0.07, 0.085],
  [0.3, 0.045, 0.06],
  [0.4, 0.015, 0.03],
  [0.45, 0, 0.01],
];

const FOX_EYE: [number, number] = [0.17, -0.795];
const FOX_NOSE: [number, number] = [0.355, -0.75];

function foxGestures(): Gesture[] {
  const at = ([x, y]: [number, number]): Point => ({
    x: FOX.x + x * FOX.scale,
    y: FOX.y + y * FOX.scale,
  });
  const white = (gestures: Gesture[]) => withReloads(gestures, 3, {titaniumWhite: 1}, 9);
  const line = (points: [number, number][], pressure: [number, number]): Gesture => ({
    kind: 'stroke',
    points: smooth(
      points.map((p, i) => ({
        ...at(p),
        pressure: pressure[0] + (pressure[1] - pressure[0]) * (i / Math.max(1, points.length - 1)),
      })),
      0.03,
    ),
  });

  // The body filled with short strokes that follow its lean, each clipped to
  // the outline, side by side and overlapping, the way a liner fills a shape.
  const fill: Gesture[] = [];
  const body = outline(FOX_BODY.map(at));
  const {left, right, top, bottom} = body.bounds;
  for (let x = left + 0.01; x < right; x += 0.018) {
    let start: number | null = null;
    for (let y = bottom + 0.01; y >= top - 0.02; y -= 0.008) {
      const inside = body.contains({x, y});
      if (inside && start === null) start = y;
      if (!inside && start !== null) {
        // Long runs are filled in pieces of at most 0.4 inch, overlapping.
        const pieces = Math.max(1, Math.ceil((start - y) / 0.4));
        const piece = (start - y) / pieces;
        for (let k = 0; k < pieces; k++) {
          const from = start - k * piece + (k > 0 ? 0.03 : 0);
          const to = start - (k + 1) * piece;
          if (from - to < 0.03) continue;
          fill.push({
            kind: 'stroke',
            points: [
              {x, y: from, pressure: 0.85},
              {x: x + 0.004, y: (from + to) / 2, pressure: 0.9},
              {x: x + 0.003, y: to + 0.004, pressure: 0.75},
            ],
          });
        }
        start = null;
      }
    }
  }
  // The edge once round; the ears, filled; the tail, as sweeps laid side by
  // side across its thickness, thinning to the tip.
  const edge = [
    line(FOX_BODY.slice(0, 15), [0.55, 0.5]),
    line([...FOX_BODY.slice(14), FOX_BODY[0] as [number, number]], [0.5, 0.6]),
  ];
  const ears = FOX_EARS.flatMap(([base, tip, other]) => {
    const [bx, by] = base as [number, number];
    const [ox, oy] = other as [number, number];
    return [0.15, 0.4, 0.65, 0.85].map((t) =>
      line([[bx + (ox - bx) * t, by + (oy - by) * t], tip as [number, number]], [0.7, 0.2]),
    );
  });
  const tail = [-0.85, -0.55, -0.25, 0, 0.25, 0.55, 0.85].map((across) =>
    line(
      FOX_TAIL.map(([x, y, thickness]) => [x, y + across * thickness * 0.5] as [number, number]),
      [0.85, 0.3],
    ),
  );
  // A dark eye and nose, so it reads as a face.
  const face: Gesture[] = [
    {kind: 'clean'},
    {kind: 'load', mix: {prussianBlue: 1, marsBlack: 1}, amount: 3},
    {kind: 'press', at: at(FOX_EYE), pressure: 0.35},
    {kind: 'press', at: at(FOX_NOSE), pressure: 0.3},
  ];
  return [...white([...fill, ...edge, ...ears, ...tail]), ...face];
}

// ─── The steps ──────────────────────────────────────────────────────────────

function dropPaint(): Step {
  return {
    title: 'Drop the paint',
    tool: 'tube',
    paints: [
      'titaniumWhite',
      'skyBlue',
      'cobaltBlue',
      'prussianBlue',
      'yellowOchre',
      'burntSienna',
      'sapGreen',
      'phthaloGreen',
      'marsBlack',
    ],
    note: 'Every paint goes straight onto the canvas as a drop, near where it will end up: white along the path of the light, Prussian blue where the woods go dark, earths and greens below.',
    gestures: DROPS.map((drop) => ({
      kind: 'drop' as const,
      at: drop.at,
      mix: {[drop.paint]: 1},
      size: drop.size ?? 1,
    })),
    pace: 2,
  };
}

function spreadSky(random: Random): Step {
  // Half the brush's width, and the drop's own: the bristles must miss it.
  const avoid = KEEP_CLEAR.map((at) => ({at, distance: 1.25}));
  const strokes = crissCross(random, UPPER_SKY, {
    start: MOON,
    count: 230,
    length: [1.0, 1.7],
    avoid,
    pressure: [0.5, 0.95, 0.55],
  });
  // A light drop hemmed in by dark ones still gets spread: a short stroke
  // across it, aimed as far from its dark neighbors as it can be.
  const touched = (at: Point) =>
    strokes.some((g) => g.kind === 'stroke' && g.points.some((p) => near(p, at, 0.55)));
  for (const drop of DROPS) {
    if (drop.paint === P || drop.at.y > 7 || touched(drop.at)) continue;
    const dark = PRUSSIAN_DROPS.reduce((a, b) =>
      Math.hypot(b.x - drop.at.x, b.y - drop.at.y) < Math.hypot(a.x - drop.at.x, a.y - drop.at.y)
        ? b
        : a,
    );
    const away = Math.atan2(drop.at.y - dark.y, drop.at.x - dark.x);
    strokes.push({
      kind: 'stroke',
      points: arc(drop.at, away + Math.PI / 2, 0.9, 0.1, [0.55, 0.85, 0.5]),
    });
  }
  return {
    title: 'Spread the sky',
    tool: 'wideBrush',
    paints: ['titaniumWhite', 'skyBlue', 'cobaltBlue'],
    note: 'A dry two-inch brush works out from the moon in short crossing strokes, picking up the drops it meets and laying them down again further on. It leaves the dark drops alone.',
    gestures: strokes,
  };
}

function knifeMasses(random: Random): Step {
  const gestures: Gesture[] = [];
  for (const at of PRUSSIAN_DROPS) gestures.push(...pats(random, at, 1.3, 24));
  return {
    title: 'Knife in the dark woods',
    tool: 'knife',
    paints: ['prussianBlue'],
    note: 'The painting knife pats each Prussian blue drop outward into a ragged mass. Every pat lifts the paint under the blade and leaves a crisp ridge along its edge.',
    gestures,
  };
}

function pullMist(random: Random): Step {
  const gestures: Gesture[] = [];
  for (let x = 0.4; x < WIDTH; x += random.between(0.45, 0.7)) {
    const top = random.between(5.6, 6.1);
    const bottom = horizon(x) + 0.15;
    const down = random.next() < 0.6;
    const points: StrokePoint[] = [
      {x: x + random.between(-0.05, 0.05), y: down ? top : bottom, pressure: 0.55},
      {x, y: (top + bottom) / 2, pressure: 0.85},
      {x: x + random.between(-0.05, 0.05), y: down ? bottom : top, pressure: 0.5},
    ];
    gestures.push({kind: 'stroke', points});
  }
  return {
    title: 'Pull down the mist',
    tool: 'wideBrush',
    paints: ['skyBlue', 'titaniumWhite'],
    note: 'The same brush, turned, pulls the row of small blue drops into vertical streaks: a band of mist where the far trees stand.',
    gestures,
  };
}

function layGround(random: Random): Step {
  const gestures: Gesture[] = [];
  // Row by row, back and forth, the way a hand works a band of color.
  let row = 0;
  for (let y = 9.05; y < HEIGHT + 0.2; y += 0.36, row++) {
    const strokes: Gesture[] = [];
    for (let x = -0.4; x < WIDTH + 0.4; x += random.between(1.2, 1.9)) {
      const length = random.between(1.4, 2.2);
      const rise = random.between(-0.12, 0.12);
      const start = {x, y: Math.max(y, horizon(x) + 0.05)};
      const points: StrokePoint[] = [
        {...start, pressure: 0.6},
        {x: x + length / 2, y: start.y + rise, pressure: 0.9},
        {x: x + length, y: start.y + rise * 0.3, pressure: 0.55},
      ];
      if (points.some((p) => PATH.contains(p))) continue;
      strokes.push({kind: 'stroke', points});
    }
    gestures.push(...(row % 2 ? strokes.reverse() : strokes));
  }
  // Then the path, as a ribbon: short strokes along it, side by side across
  // its width, carrying its warm drops up toward the clearing.
  for (let t = 0.02; t < 0.97; t += 0.055) {
    const here = path(t);
    const ahead = path(Math.min(1, t + 0.07)).at;
    const dx = ahead.x - here.at.x;
    const dy = ahead.y - here.at.y;
    const length = Math.hypot(dx, dy) || 1;
    const lanes = Math.max(1, Math.min(4, Math.round(here.width / 0.8)));
    for (let lane = 0; lane < lanes; lane++) {
      const across = lanes === 1 ? 0 : (lane / (lanes - 1) - 0.5) * here.width * 0.7;
      const x = here.at.x - (dy / length) * across;
      const y = here.at.y + (dx / length) * across;
      const reach = random.between(0.7, 1);
      gestures.push({
        kind: 'stroke',
        points: [
          {x, y, pressure: 0.65},
          {x: x + (dx / length) * reach * 0.5, y: y + (dy / length) * reach * 0.5, pressure: 0.85},
          {x: x + (dx / length) * reach, y: y + (dy / length) * reach, pressure: 0.5},
        ],
      });
    }
  }
  return {
    title: 'Lay in the ground',
    tool: 'flatBrush',
    paints: ['yellowOchre', 'burntSienna', 'sapGreen', 'phthaloGreen', 'marsBlack'],
    note: 'A one-inch brush spreads the ground drops sideways: warm ochre and white where the path will catch the light, greens and black toward the edges.',
    gestures,
  };
}

function scrubAll(random: Random): Step {
  const sky = tour(random, scatter(random, SKY, 330, 0.45), MOON);
  const ground = tour(random, scatter(random, GROUND, 110, 0.5), CLEARING);
  return {
    title: 'Pounce the scrubber',
    tool: 'scrubber',
    paints: [],
    note: 'A steel-wool scrubber glued to a jar lid is pounced over everything while it is wet, from the light outward. It lifts paint and drops it again a pad-width away, breaking every brushstroke into a glittering stipple.',
    gestures: [...pounce(random, sky, [0.72, 0.95]), ...pounce(random, ground, [0.72, 0.95])],
    pace: 2.2,
  };
}

function pullTrunks(random: Random, trees: Planted[]): Step {
  const gestures: Gesture[] = [];
  const order = [...trees].sort((a, b) => depthOrder(a.depth) - depthOrder(b.depth));
  for (const tree of order) {
    const paint = TRUNK_PAINT[tree.depth];
    gestures.push({kind: 'load', mix: paint.mix, amount: paint.amount, keep: 0.2});
    gestures.push(
      ...trunk(random, tree.base, tree.base.y + 0.4, {
        lean: tree.lean,
        passes: paint.passes,
        width: paint.spacing,
        edge: tree.depth === 'far',
        fade: tree.depth === 'far' ? 0.12 : 0.3,
      }),
    );
  }
  return {
    title: 'Pull up the trunks',
    tool: 'trunkBrush',
    paints: ['burntUmber', 'marsBlack', 'prussianBlue'],
    note: 'Umber and black on a half-inch brush, pulled up from the ground in one stroke per trunk and easing off as it climbs. The far trunks go first and thinnest; the brush drags up streaks of the wet blue beneath.',
    gestures,
  };
}

const depthOrder = (depth: Depth) => (depth === 'far' ? 0 : depth === 'middle' ? 1 : 2);

function scrubCanopy(random: Random, trees: Planted[]): Step {
  const spots: Point[] = [];
  for (const tree of trees) {
    if (tree.depth === 'far' && random.next() < 0.5) continue;
    const crowns = tree.depth === 'near' ? 2 : 1;
    for (let i = 0; i < crowns; i++) {
      const y = random.between(-0.5, tree.depth === 'near' ? 2 : 1.4);
      spots.push({x: trunkX(tree, y) + random.between(-0.6, 0.6), y});
    }
  }
  const open = spots.filter((p) => !near(p, MOON, 1.8));
  const gestures: Gesture[] = [];
  // Each clump takes a couple of presses close together, so it is dense in
  // the middle and ragged at its edges, with sky between the clumps.
  tour(random, open, {x: 0, y: 0}).forEach((at, i) => {
    if (i % 2 === 0)
      gestures.push({
        kind: 'load',
        mix: {marsBlack: 2, phthaloGreen: 1, prussianBlue: 1},
        amount: 2.2,
        keep: 0.2,
      });
    gestures.push({kind: 'press', at, pressure: random.between(0.55, 0.8)});
    gestures.push({
      kind: 'press',
      at: {x: at.x + random.between(-0.3, 0.3), y: at.y + random.between(-0.25, 0.25)},
      pressure: random.between(0.4, 0.6),
    });
  });
  return {
    title: 'Pounce the leaves',
    tool: 'scrubber',
    paints: ['marsBlack', 'phthaloGreen', 'prussianBlue'],
    note: 'The scrubber again, now loaded with black and dark green, pounced at the tops of the trunks. Each press prints a clump of foliage, lighter where it barely touches.',
    gestures,
    pace: 1.6,
  };
}

function spatterStars(random: Random): Step {
  const taps: Point[] = [
    {x: 3.2, y: 2.6},
    {x: 7.6, y: 3.4},
    {x: 11.4, y: 2.2},
    {x: 13.8, y: 5.2},
    {x: 9.6, y: 6.2},
    {x: 2.4, y: 6.4},
  ];
  return {
    title: 'Spatter',
    tool: 'spatter',
    paints: ['titaniumWhite'],
    note: 'A round brush loaded with white, tapped against the handle of another: a shower of specks, the first of the night’s lights.',
    gestures: taps.map((at) => flick(random, at, {titaniumWhite: 1}, 46, 1.5, [0.008, 0.024])),
  };
}

function combGrass(random: Random): Step {
  const gestures: Gesture[] = [{kind: 'load', mix: {phthaloGreen: 1, marsBlack: 1}, amount: 5}];
  let count = 0;
  for (let x = -0.4; x < WIDTH + 0.4; x += random.between(0.45, 0.8)) {
    for (let row = 0; row < 3; row++) {
      const y = horizon(x) + random.between(0.15, 0.6) + row * random.between(0.7, 1.1);
      if (y > HEIGHT + 0.1) continue;
      if ([-0.7, 0, 0.7].some((dx) => PATH.contains({x: x + dx, y}))) continue;
      if (count++ % 4 === 0)
        gestures.push({kind: 'load', mix: {phthaloGreen: 1, marsBlack: 1}, amount: 5, keep: 0.4});
      gestures.push(
        combFlick(
          {x, y},
          random.between(0.35, 0.5 + row * 0.3),
          random.between(-0.35, 0.35),
          random.between(-0.4, 0.4),
        ),
      );
    }
  }
  // Grass caught by the light: a paler comb along the path and the clearing.
  gestures.push({kind: 'clean'});
  for (let t = 0.1; t < 1; t += 0.11) {
    for (const side of [-1, 1] as const) {
      const edge = pathSide(side)[Math.round(t * 20)] as Point;
      if (count++ % 3 === 0)
        gestures.push({
          kind: 'load',
          mix: {sapGreen: 1, yellowOchre: 1, titaniumWhite: 1},
          amount: 4,
          keep: 0.2,
        });
      gestures.push(
        combFlick(
          {x: edge.x, y: edge.y + 0.15},
          random.between(0.3, 0.55),
          random.between(-0.25, 0.25),
          random.between(-0.4, 0.4),
        ),
      );
    }
  }
  return {
    title: 'Comb the grass',
    tool: 'comb',
    paints: ['phthaloGreen', 'marsBlack', 'sapGreen', 'yellowOchre'],
    note: 'A fine comb with paint on its teeth, set down along the ground and flicked upward: a dozen blades of grass at a time. Dark first, then a paler mix where the path catches the light.',
    gestures,
  };
}

function linerLights(random: Random): Step {
  const gestures: Gesture[] = [{kind: 'load', mix: {titaniumWhite: 3, skyBlue: 1}, amount: 6}];
  // Saplings far back in the mist, catching the moon.
  for (let i = 0; i < 18; i++) {
    const x = random.between(0.5, WIDTH - 0.5);
    if (Math.abs(x - MOON.x) < 0.8) continue;
    const base = horizon(x) + random.between(-0.1, 0.2);
    const height = random.between(2, 5.2);
    const lean = random.between(-0.04, 0.04);
    if (i % 3 === 0)
      gestures.push({kind: 'load', mix: {titaniumWhite: 3, skyBlue: 1}, amount: 6, keep: 0.3});
    gestures.push({
      kind: 'stroke',
      points: [
        {x, y: base, pressure: 0.55},
        {x: x + lean * height * 0.5, y: base - height * 0.5, pressure: 0.4},
        {x: x + lean * height, y: base - height, pressure: 0.12},
      ],
      skim: 0.15,
    });
  }
  // Blades of grass along the path's edges, flicked up.
  for (let i = 0; i < 26; i++) {
    const side = random.next() < 0.5 ? -1 : 1;
    const edge = pathSide(side)[2 + random.index(18)] as Point;
    const x = edge.x + random.between(-0.3, 0.3);
    const y = edge.y + random.between(-0.1, 0.2);
    if (i % 5 === 0)
      gestures.push({
        kind: 'load',
        mix: {titaniumWhite: 2, sapGreen: 1, cadmiumYellow: 1},
        amount: 5,
        keep: 0.3,
      });
    gestures.push({
      kind: 'stroke',
      points: [
        {x, y, pressure: 0.6},
        {x: x + random.between(-0.08, 0.08), y: y - random.between(0.25, 0.5), pressure: 0.1},
      ],
    });
  }
  return {
    title: 'Saplings in the mist',
    tool: 'liner',
    paints: ['titaniumWhite', 'skyBlue', 'sapGreen'],
    note: 'A liner brush draws thin pale lines into the mist, far-off saplings with the moon on them, and flicks a few light blades of grass along the path.',
    gestures,
  };
}

function dryEverything(): Step {
  const path: Point[] = [];
  for (let row = 0; row < 7; row++) {
    const y = 0.6 + row * 1.8;
    path.push(row % 2 ? {x: WIDTH + 0.5, y} : {x: -0.5, y});
    path.push(row % 2 ? {x: -0.5, y} : {x: WIDTH + 0.5, y});
  }
  return {
    title: 'Dry it',
    tool: 'dryer',
    paints: [],
    note: 'Everything so far has been painted wet into wet. A hair dryer sets it, so what comes next sits on top, crisp, instead of blending in. Watch the shine go.',
    gestures: [{kind: 'dry', path}],
  };
}

function cottonMoon(random: Random): Step {
  const gestures: Gesture[] = [{kind: 'load', mix: {titaniumWhite: 1}, amount: 7}];
  for (let i = 0; i < 16; i++) {
    const angle = random.between(0, Math.PI * 2);
    const out = random.between(0, MOON.radius * 0.4);
    gestures.push({
      kind: 'press',
      at: {x: MOON.x + Math.cos(angle) * out, y: MOON.y + Math.sin(angle) * out},
      pressure: random.between(0.8, 0.95),
      angle: random.between(0, 6.28),
    });
    if (i === 7) gestures.push({kind: 'load', mix: {titaniumWhite: 1}, amount: 6, keep: 0.4});
  }
  // The glow: what is left on the cotton, dabbed lightly around, catching only the stipple's peaks.
  for (let i = 0; i < 36; i++) {
    if (i % 9 === 0) gestures.push({kind: 'load', mix: {titaniumWhite: 1}, amount: 1.3, keep: 0.5});
    const angle = random.between(0, Math.PI * 2);
    const out = random.between(MOON.radius * 1.1, MOON.radius * 2.8);
    gestures.push({
      kind: 'press',
      at: {x: MOON.x + Math.cos(angle) * out, y: MOON.y + Math.sin(angle) * out},
      pressure: random.between(0.3, 0.45),
      angle: random.between(0, 6.28),
      skim: 0.5,
    });
  }
  return {
    title: 'Dab the moon',
    tool: 'cotton',
    paints: ['titaniumWhite', 'cadmiumYellow'],
    note: 'A ball of cotton wool in a clothespin, dipped in white and dabbed over and over in one spot until the moon is solid; then, nearly dry, dabbed lightly around it for the glow.',
    gestures,
  };
}

/** Points where lights gather: thick around the clearing and along the path, thinner out in the woods. */
function lightSpots(random: Random, count: number, avoidFox = true): Point[] {
  const spots: Point[] = [];
  while (spots.length < count) {
    const roll = random.next();
    let at: Point;
    if (roll < 0.35) {
      const t = random.between(0, 1);
      const here = path(t);
      at = {
        x: here.at.x + random.between(-1, 1) * here.width * 0.7,
        y: here.at.y + random.between(-0.5, 0.3),
      };
    } else if (roll < 0.6) {
      const angle = random.between(0, Math.PI * 2);
      const out = Math.sqrt(random.next()) * 3.2;
      at = {
        x: CLEARING.x + Math.cos(angle) * out * 1.3,
        y: CLEARING.y - 1.2 + Math.sin(angle) * out * 0.9,
      };
    } else {
      at = {x: random.between(0.3, WIDTH - 0.3), y: random.between(2.4, HEIGHT - 0.3)};
    }
    if (at.x < 0.2 || at.x > WIDTH - 0.2 || at.y < 0.2 || at.y > HEIGHT - 0.2) continue;
    if (avoidFox && near(at, {x: FOX.x, y: FOX.y - 0.55 * FOX.scale}, 0.6 * FOX.scale)) continue;
    if (near(at, MOON, MOON.radius * 2)) continue;
    spots.push(at);
  }
  return spots;
}

function bundleFlowers(random: Random): Step {
  const gestures: Gesture[] = [];
  // Flowers grow along the path's edges, leaving the trodden middle bare.
  const along = (count: number) =>
    Array.from({length: count}, () => {
      const side: -1 | 1 = random.next() < 0.5 ? -1 : 1;
      const i = 2 + random.index(17);
      const edge = pathSide(side)[i] as Point;
      const middle = path(i / 20).at;
      const outX = edge.x - middle.x;
      const outY = edge.y - middle.y;
      const out = Math.hypot(outX, outY) || 1;
      const beyond = random.between(0.1, 0.55);
      return {x: edge.x + (outX / out) * beyond, y: edge.y + (outY / out) * beyond};
    }).filter(
      (p) => p.y < HEIGHT - 0.1 && !PATH.contains(p) && !near(p, {x: FOX.x, y: FOX.y - 0.5}, 1.3),
    );
  const clearing = scatter(random, rectangle(8.2, 9, 10.6, 9.9), 4).filter(
    (p) => !near(p, FOX, 1.3),
  );
  const yellow = tour(random, [...along(14), ...clearing], CLEARING);
  yellow.forEach((at, i) => {
    if (i % 3 === 0)
      gestures.push({
        kind: 'load',
        mix: {cadmiumYellow: 4, titaniumWhite: 1},
        amount: 5,
        keep: 0.2,
      });
    gestures.push({
      kind: 'press',
      at,
      pressure: random.between(0.6, 0.9),
      angle: random.between(-0.6, 0.6),
    });
  });
  gestures.push({kind: 'clean'});
  tour(random, along(6), CLEARING).forEach((at, i) => {
    if (i % 3 === 0) gestures.push({kind: 'load', mix: {titaniumWhite: 1}, amount: 5, keep: 0.1});
    gestures.push({
      kind: 'press',
      at,
      pressure: random.between(0.5, 0.8),
      angle: random.between(-0.6, 0.6),
    });
  });
  return {
    title: 'Stamp the flowers',
    tool: 'bundle',
    paints: ['cadmiumYellow', 'titaniumWhite'],
    note: 'Twenty cotton swabs held in a rubber band and fanned out, dipped in yellow and stamped along the path: a scatter of small flowers with every press. Then a few in white.',
    gestures,
    pace: 1.4,
  };
}

function swabFireflies(random: Random): Step {
  const gestures: Gesture[] = [];
  const spots = tour(random, lightSpots(random, 110), CLEARING);
  spots.forEach((at, i) => {
    const yellow = i % 5 < 2;
    if (i % 2 === 0) {
      gestures.push({
        kind: 'load',
        mix: yellow ? {cadmiumYellow: 5, sapGreen: 1, titaniumWhite: 2} : {titaniumWhite: 1},
        amount: 5,
        keep: 0.1,
      });
    }
    gestures.push({
      kind: 'press',
      at,
      pressure: random.between(0.55, 0.9),
      angle: random.between(0, 6.28),
    });
  });
  return {
    title: 'Dot the fireflies',
    tool: 'swab',
    paints: ['titaniumWhite', 'cadmiumYellow', 'sapGreen'],
    note: 'One swab, one dot at a time: white ones, and yellow-green ones, thickest where the light is.',
    gestures,
    pace: 1.5,
  };
}

function linerFox(): Step {
  return {
    title: 'Draw the fox',
    tool: 'liner',
    paints: ['titaniumWhite'],
    note: 'The liner again, with pure white: a fox sitting at the edge of the clearing, filled in with short strokes, then outlined, ears and tail last.',
    gestures: [{kind: 'load', mix: {titaniumWhite: 1}, amount: 9}, ...foxGestures()],
  };
}

function linerEdges(random: Random, trees: Planted[]): Step {
  const gestures: Gesture[] = [];
  const lit = trees.filter((t) => t.depth !== 'far' && Math.abs(t.x - 7.5) < 6);
  for (const tree of lit) {
    // The moonward side of each trunk takes a thin broken line of light.
    const side = tree.x > MOON.x ? -1 : 1;
    const edge = (y: number) => trunkX(tree, y) + side * (tree.width / 2 - 0.03);
    const bottom = Math.min(
      tree.base.y - 0.2,
      tree.depth === 'near' ? random.between(8.5, 10) : horizon(tree.x) + random.between(0.2, 0.8),
    );
    const top = bottom - random.between(2.5, 5);
    const middle = (bottom + top) / 2;
    gestures.push({kind: 'load', mix: {titaniumWhite: 3, skyBlue: 1}, amount: 6, keep: 0.2});
    gestures.push({
      kind: 'stroke',
      points: [
        {x: edge(bottom), y: bottom, pressure: 0.35},
        {x: edge(middle) + random.between(-0.02, 0.02), y: middle, pressure: 0.55},
        {x: edge(top), y: top, pressure: 0.15},
      ],
      skim: 0.25,
    });
  }
  return {
    title: 'Light the trunks',
    tool: 'liner',
    paints: ['titaniumWhite', 'skyBlue'],
    note: 'A broken line of pale blue down the side of each trunk that faces the moon.',
    gestures,
  };
}

function cottonGlows(spots: Point[]): Step {
  const gestures: Gesture[] = [];
  spots.forEach((at, i) => {
    if (i % 2 === 0) gestures.push({kind: 'load', mix: {titaniumWhite: 1}, amount: 3, keep: 0.2});
    gestures.push({
      kind: 'press',
      at,
      pressure: 0.5 + 0.1 * Math.sin(i * 2.3),
      angle: i * 1.7,
      skim: 0.3,
      twist: 1,
    });
  });
  return {
    title: 'Twist the glows',
    tool: 'cotton',
    paints: ['titaniumWhite'],
    note: 'The cotton ball, with a little white, pressed and twisted: the fibers drag the paint out in fine rays, and the brightest fireflies get a halo.',
    gestures,
  };
}

function swabSparkles(random: Random, glows: Point[]): Step {
  const gestures: Gesture[] = [];
  // A bright heart in every glow, then a few more small lights.
  const spots = [...glows, ...tour(random, lightSpots(random, 28), CLEARING)];
  spots.forEach((at, i) => {
    if (i % 3 === 0) gestures.push({kind: 'load', mix: {titaniumWhite: 1}, amount: 5, keep: 0.1});
    gestures.push({
      kind: 'press',
      at,
      pressure: random.between(0.35, 0.6),
      angle: random.between(0, 6.28),
    });
  });
  return {
    title: 'Last sparkles',
    tool: 'swab',
    paints: ['titaniumWhite'],
    note: 'A clean swab and small dots of white, here and there, to finish.',
    gestures,
    pace: 1.5,
  };
}

/** Insert a reload every `every` strokes, keeping a share of the old paint. */
function withReloads(gestures: Gesture[], every: number, mix: Mix, amount: number): Gesture[] {
  const out: Gesture[] = [];
  gestures.forEach((gesture, i) => {
    if (i > 0 && i % every === 0) out.push({kind: 'load', mix, amount, keep: 0.3});
    out.push(gesture);
  });
  return out;
}

export function moonlitWood(seed = 11): Score {
  const random = createRandom(seed);
  const trees = plant(random);
  const glows = tour(random, lightSpots(random, 16), CLEARING);
  return {
    title: 'Fox at the edge of the wood',
    width: WIDTH,
    height: HEIGHT,
    steps: [
      dropPaint(),
      spreadSky(random),
      knifeMasses(random),
      pullMist(random),
      layGround(random),
      scrubAll(random),
      pullTrunks(random, trees),
      scrubCanopy(random, trees),
      spatterStars(random),
      combGrass(random),
      linerLights(random),
      dryEverything(),
      cottonMoon(random),
      bundleFlowers(random),
      swabFireflies(random),
      linerFox(),
      linerEdges(random, trees),
      cottonGlows(glows),
      swabSparkles(random, glows),
    ],
  };
}
