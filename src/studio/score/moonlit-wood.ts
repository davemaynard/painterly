// The painting this page plays: a wood at night, a low moon off to the left,
// a path winding up from the corner to a clearing that holds the light, and a
// fox sitting at its edge. The picture is our own; the method is Jay Lee's,
// from his video "Iron scrubber painting technique / Painting deep in the
// woods" (2025): paint dropped straight onto the canvas and spread
// with a wide brush, dark masses patted in with a knife, everything pounced
// with a steel-wool scrubber while wet, trunks pulled up with a flat brush,
// then a comb, a hair dryer, a cotton ball, cotton swabs and a paint pen.
//
// Everything is in inches on a 16 × 12 canvas, from the top left.
import {createRandom, type Random} from '../../random.ts';
import type {Mix, PaintName} from '../engine/pigments.ts';
import {type ToolSpec, tools} from '../tools.ts';
import {
  arc,
  combFlick,
  crissCross,
  flick,
  hatch,
  outline,
  passesOver,
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
/**
 * Where the fox sits: on the far edge of the clearing, in its light, beside
 * the end of the path and facing into it. Small, as a fox is among trees.
 */
const FOX = {x: 8.35, y: 9.13, scale: 0.8};

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

/** How far a point is outside the path's edge, in inches; below 0 on it. */
function fromPath(at: Point): number {
  let nearest = Number.POSITIVE_INFINITY;
  for (let i = 0; i <= 40; i++) {
    const here = path(i / 40);
    nearest = Math.min(nearest, Math.hypot(at.x - here.at.x, at.y - here.at.y) - here.width / 2);
  }
  return nearest;
}

/**
 * Where the scrubber is pounced on the sky: high enough that the pad, 2.6
 * inches across, stops short of the wet ground and never carries its green
 * up into the light.
 */
const SKY_POUNCE: Region = outline([
  {x: -0.2, y: -0.2},
  {x: WIDTH + 0.2, y: -0.2},
  ...Array.from({length: 33}, (_, i) => {
    const x = WIDTH + 0.2 - (i / 32) * (WIDTH + 0.4);
    return {x, y: horizon(x) - 1.1};
  }),
]);

/** The sky above the mist, where the wide brush crisscrosses. */
const UPPER_SKY: Region = rectangle(-0.3, -0.3, WIDTH + 0.3, 6.2);

/**
 * The pool of light in the clearing, where the fox sits. Its warm drops are
 * spread first, with a clean brush, and the greens are laid in around it.
 */
const LIGHT: Region = outline(
  Array.from({length: 32}, (_, i) => ({
    x: 8.6 + 2.2 * Math.cos((i / 32) * Math.PI * 2),
    y: 9.9 + 1.0 * Math.sin((i / 32) * Math.PI * 2),
  })),
);

/**
 * Where the scrubber is pounced on the ground: low enough that the pad stops
 * short of the wet mist and never carries its blue down into the light.
 */
const GROUND_POUNCE: Region = outline([
  ...Array.from({length: 33}, (_, i) => {
    const x = -0.2 + (i / 32) * (WIDTH + 0.4);
    return {x, y: horizon(x) + 0.55};
  }),
  {x: WIDTH + 0.2, y: HEIGHT + 0.2},
  {x: -0.2, y: HEIGHT + 0.2},
]);

const GROUND: Region = outline([
  ...Array.from({length: 33}, (_, i) => {
    const x = -0.2 + (i / 32) * (WIDTH + 0.4);
    return {x, y: horizon(x) - 0.05};
  }),
  {x: WIDTH + 0.2, y: HEIGHT + 0.2},
  {x: -0.2, y: HEIGHT + 0.2},
]);

const near = (a: Point, b: Point, distance: number) => Math.hypot(a.x - b.x, a.y - b.y) < distance;

const smoothstep = (from: number, to: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

/** A mix as a hand puts it together on the palette: never quite the same twice. */
function byHand(random: Random, mix: Mix, spread = 0.25): Mix {
  const varied: Mix = {};
  for (const [paint, parts] of Object.entries(mix) as [PaintName, number][]) {
    varied[paint] = parts * random.between(1 - spread, 1 + spread);
  }
  return varied;
}

// ─── The drops ──────────────────────────────────────────────────────────────
//
// Before any brush, every paint the picture needs goes onto the canvas as a
// drop, roughly where it will end up: white along the line the light will
// take, from the moon down to the clearing; sky blue around it; Prussian blue
// where the woods go dark; a row of small blues for the mist; earth colors
// and greens for the ground, warm toward the path.

type Drop = {at: Point; paint: PaintName; size: number; angle: number};

/**
 * A hand never squeezes two drops alike: each lands a little off its mark, a
 * little bigger or smaller, the tube lifting away at its own angle.
 */
const squeeze = createRandom(29);
const squeezed = (x: number, y: number, paint: PaintName, size: number, slip = 0.2): Drop => ({
  at: {x: x + squeeze.between(-slip, slip), y: y + squeeze.between(-slip, slip) * 0.75},
  paint,
  size: size * squeeze.between(0.82, 1.18),
  angle: squeeze.between(-0.45, 0.45),
});

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
  return squeezed(x, 7.45, white ? W : S, 0.72, 0.12);
});

const G: PaintName = 'sapGreen';
const T: PaintName = 'phthaloGreen';
const O: PaintName = 'yellowOchre';
const Y: PaintName = 'cadmiumYellow';
const R: PaintName = 'burntSienna';
const K: PaintName = 'marsBlack';

// biome-ignore format: the drops read as the rows they make on the canvas
const GROUND_ROWS: [number, [number, PaintName][]][] = [
  [9.65, [[0.5, T], [2.2, G], [4, R], [6, O], [7.5, Y], [8.4, W], [9.3, Y], [10.2, O], [11.3, O], [12.9, R], [14.4, G], [15.6, T]]],
  [10.65, [[0.5, K], [2, T], [3.6, T], [5.2, G], [6.9, O], [8.2, Y], [9.2, W], [10.6, W], [11.7, O], [12.9, O], [14.2, G], [15.5, K]]],
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
).map(([t, paint]) => squeezed(path(t).at.x, path(t).at.y, paint, 1, 0.15));

const DROPS: Drop[] = [
  ...SKY_ROWS.flatMap(([y, row]) =>
    row.map(([x, paint]) => squeezed(x, y, paint, paint === W ? 1.3 : 1)),
  ),
  ...MIST_ROW,
  // Ground drops only ever land a little low, out of reach of the mist brush.
  ...GROUND_ROWS.flatMap(([y, row]) =>
    row.map(([x, paint]) => squeezed(x, y + 0.09, paint, 1, 0.12)),
  )
    // The path's own drops take these places.
    .filter((drop) => PATH_DROPS.every((p) => !near(p.at, drop.at, 0.6))),
  ...PATH_DROPS,
];

/**
 * Whether a flat brush's strokes pass right over every part of a drop on the
 * canvas, its middle and all round its edge, so none of its first shape is
 * left standing.
 */
function spreads(strokes: Gesture[], drop: Drop, brush: ToolSpec): boolean {
  const radius = (tools.tube.width / 2) * drop.size;
  const parts = [
    drop.at,
    ...Array.from({length: 8}, (_, i) => ({
      x: drop.at.x + Math.cos((i * Math.PI) / 4) * radius,
      y: drop.at.y + Math.sin((i * Math.PI) / 4) * radius,
    })),
  ].filter((p) => p.x >= 0 && p.x <= WIDTH && p.y >= 0 && p.y <= HEIGHT);
  return parts.every((p) =>
    strokes.some((g) => g.kind === 'stroke' && passesOver(g.points, p, brush.width, brush.depth)),
  );
}

const PRUSSIAN_DROPS = DROPS.filter((drop) => drop.paint === P).map((drop) => drop.at);
/** Drops the sky brush must not reach: the dark ones are the knife's, the low ones belong to the mist and the ground. */
const KEEP_CLEAR = DROPS.filter((drop) => drop.paint === P || drop.at.y > 7).map((drop) => drop.at);

// ─── The trunks ─────────────────────────────────────────────────────────────
//
// Three depths. Far trunks are thin and pale, the mist's own blue and white,
// painted first; then the middle distance, navy and umber; then the near
// trunks, wide, rooted below the bottom edge. Every one is pulled up through
// the wet sky and drags its blue up with it. The moon and the clearing are
// kept open.

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
    mix: {skyBlue: 2, titaniumWhite: 1, prussianBlue: 0.5},
    amount: 7,
    passes: 1,
    spacing: 0,
    width: 0.2,
  },
  middle: {
    mix: {burntUmber: 1.5, prussianBlue: 1.5, marsBlack: 0.6},
    amount: 14,
    passes: 1,
    spacing: 0,
    width: 0.42,
  },
  near: {
    mix: {burntUmber: 2, marsBlack: 1.5, prussianBlue: 0.6},
    amount: 16,
    passes: 2,
    spacing: 0.34,
    width: 0.76,
  },
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
// Drawn with a white paint pen: sitting, side on, facing right into the
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
  [-0.3, -0.04, 0.07],
  [-0.26, 0.03, 0.11],
  [-0.12, 0.07, 0.135],
  [0.04, 0.08, 0.14],
  [0.18, 0.07, 0.12],
  [0.3, 0.045, 0.09],
  [0.4, 0.015, 0.05],
  [0.46, -0.005, 0.015],
];

/** A point of the fox's drawing on the canvas. */
const onCanvas = ([x, y]: [number, number]): Point => ({
  x: FOX.x + x * FOX.scale,
  y: FOX.y + y * FOX.scale,
});

/** Whether `p` is on the fox's body or tail, or within `margin` inches of them. */
function onFox(p: Point, margin: number): boolean {
  const body = outline(FOX_BODY.map(onCanvas));
  const around = [
    {x: 0, y: 0},
    ...Array.from({length: 8}, (_, i) => ({
      x: Math.cos((i * Math.PI) / 4) * margin,
      y: Math.sin((i * Math.PI) / 4) * margin,
    })),
  ];
  if (around.some((d) => body.contains({x: p.x + d.x, y: p.y + d.y}))) return true;
  return FOX_TAIL.some(([x, y, thickness]) => {
    const middle = onCanvas([x, y]);
    return Math.hypot(p.x - middle.x, p.y - middle.y) < (thickness / 2) * FOX.scale + margin;
  });
}

/** The lean of the fox's back, haunch to nape: the way the pen fills the body. */
const BACK_LEAN = Math.atan2(-0.56, 0.28);

function foxGestures(): Gesture[] {
  const at = onCanvas;
  const line = (points: [number, number][]): Gesture => ({
    kind: 'stroke',
    points: smooth(
      points.map((p) => ({...at(p), pressure: 0.8})),
      0.03,
    ),
  });
  const between = ([ax, ay]: [number, number], [bx, by]: [number, number]): [number, number] => [
    (ax + bx) / 2,
    (ay + by) / 2,
  ];

  // Round the edge first, the way a pen finds a shape; then the body filled
  // solid with lines back and forth along the lean of the back.
  const edge = [
    line(FOX_BODY.slice(0, 15)),
    line([...FOX_BODY.slice(14), FOX_BODY[0] as [number, number]]),
  ];
  // Lines closer than the nib is wide, so they run together into one film;
  // and in under the edge's own line, so the two meet without a seam.
  const nib = tools.pen.width;
  const fill = hatch(outline(FOX_BODY.map(at)), BACK_LEAN, nib * 0.6, nib / 4);
  // Each ear from both corners of its base and its middle up to the tip; the
  // tail as sweeps laid side by side across its thickness, thinning to the tip.
  const ears = FOX_EARS.flatMap(([base, tip, other]) => {
    const corners = [base, other] as [number, number][];
    const point = tip as [number, number];
    return [
      line([corners[0] as [number, number], point]),
      line([corners[1] as [number, number], point]),
      line([between(corners[0] as [number, number], corners[1] as [number, number]), point]),
    ];
  });
  const tail = [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75].map((across) =>
    line(FOX_TAIL.map(([x, y, thickness]) => [x, y + across * thickness * 0.5])),
  );
  return [...edge, ...fill, ...ears, ...tail];
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
      'cadmiumYellow',
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
      size: drop.size,
      angle: drop.angle,
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
  // A light drop the strokes missed, or only grazed, still gets spread: a
  // short stroke right through it, aimed as far from its dark neighbors as it
  // can be.
  for (const drop of DROPS) {
    if (drop.paint === P || drop.at.y > 7 || spreads(strokes, drop, tools.wideBrush)) continue;
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
    // Down to just above the ground line, clear of the ground's drops.
    const bottom = horizon(x) - 0.1;
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
  const stroke = (points: [number, number][], pressure: [number, number, number]) =>
    gestures.push({
      kind: 'stroke',
      points: points.map(([x, y], i) => ({x, y, pressure: pressure[i] ?? 0.6})),
    });

  // The light first, with the brush clean: each warm drop in the clearing is
  // pulled up to the ground line and out to either side, then the pool is
  // worked back and forth until it is one glow.
  const warm = DROPS.filter(
    (drop) => LIGHT.contains(drop.at) && (drop.paint === Y || drop.paint === W || drop.paint === O),
  );
  for (const at of tour(
    random,
    warm.map((drop) => drop.at),
    {x: 6, y: 9.5},
  )) {
    stroke(
      [
        [at.x, at.y],
        [at.x - 0.15, (at.y + horizon(at.x)) / 2],
        [at.x - 0.05, horizon(at.x) - 0.05],
      ],
      [0.7, 0.85, 0.5],
    );
    for (const side of [-1, 1]) {
      const reach = random.between(0.8, 1.2);
      stroke(
        [
          [at.x, at.y],
          [at.x + side * reach * 0.5, at.y - 0.12],
          [at.x + side * reach, at.y - random.between(0, 0.25)],
        ],
        [0.7, 0.9, 0.5],
      );
    }
  }
  /** Short strokes across the pool at height `y`, rightward or, on the way back, leftward. */
  const across = (y: number, from: number, to: number, back: boolean) => {
    const way = back ? -1 : 1;
    for (let along = 0; along < to - from - 0.2; along += 1.1) {
      const x = back ? to - along : from + along;
      const end = back ? Math.max(from, x - 1.25) : Math.min(to, x + 1.25);
      stroke(
        [
          [x, y],
          [x + way * 0.6, y + random.between(-0.06, 0.06)],
          [end, y],
        ],
        [0.6, 0.8, 0.55],
      );
    }
  };
  for (let y = 9.15, pass = 0; y < 10.8; y += 0.32, pass++) {
    const half = 2.2 * Math.sqrt(Math.max(0, 1 - ((y - 9.9) / 1.0) ** 2)) - 0.2;
    if (half > 0.3)
      across(Math.max(y, horizon(8.6) - 0.05), 8.6 - half, 8.6 + half, pass % 2 === 1);
  }

  // Then the greens and darks, row by row, back and forth, the way a hand
  // works a band of color. A stroke stops at the edge of the path or the
  // light, and the next one starts again on the far side of it.
  gestures.push({kind: 'clean'});
  const open = (p: Point) => !PATH.contains(p) && !LIGHT.contains(p);
  let row = 0;
  for (let y = 9.05; y < HEIGHT + 0.2; y += 0.36, row++) {
    // The top row tucks up under the mist, so no canvas shows between them.
    const on = (x: number) => ({x, y: Math.max(y, horizon(x) - 0.08)});
    const strokes: Gesture[] = [];
    let x = -0.4;
    while (x < WIDTH + 0.4) {
      if (!open(on(x))) {
        x += 0.05;
        continue;
      }
      // A stroke runs off the edge of the canvas, but not far past it.
      const goal = Math.min(x + random.between(1.4, 2.2), WIDTH + 0.5);
      let end = x;
      while (end < goal && open(on(end + 0.05))) end += 0.05;
      if (end - x > 0.3) {
        const rise = random.between(-0.12, 0.12);
        const start = on(x);
        strokes.push({
          kind: 'stroke',
          points: [
            {...start, pressure: 0.6},
            {x: (x + end) / 2, y: start.y + rise, pressure: 0.9},
            {x: end, y: start.y + rise * 0.3, pressure: 0.55},
          ],
        });
      }
      // The next stroke starts back inside this one, unless this one stopped at an edge.
      x = end < goal ? end + 0.05 : x + (end - x) * random.between(0.65, 0.85);
    }
    gestures.push(...(row % 2 ? strokes.reverse() : strokes));
  }
  // Then the path, as a ribbon, with the brush wiped so it stays warm: short
  // strokes along it, side by side across its width, carrying its warm drops
  // up into the pool of light.
  gestures.push({kind: 'clean'});
  for (let t = 0.02; t < 0.9; t += 0.055) {
    const here = path(t);
    const ahead = path(Math.min(1, t + 0.07)).at;
    const dx = ahead.x - here.at.x;
    const dy = ahead.y - here.at.y;
    const length = Math.hypot(dx, dy) || 1;
    // Lanes close enough that the brush's bands overlap, so no strip down the middle is missed.
    const lanes = Math.min(4, Math.ceil((here.width * 0.7) / 0.8) + 1);
    for (let lane = 0; lane < lanes; lane++) {
      const across = (lane / (lanes - 1) - 0.5) * here.width * 0.7;
      const x = here.at.x - (dy / length) * across;
      const y = here.at.y + (dx / length) * across;
      // No stroke runs on past the clearing into the mist.
      const reach = Math.min(
        random.between(0.7, 1),
        Math.hypot(CLEARING.x - here.at.x, CLEARING.y - here.at.y),
      );
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
    note: 'A one-inch brush, clean, spreads the warm drops in the clearing into a pool of light first; then, wiped, it lays the greens and black in around it, and runs the path up to the light.',
    gestures,
  };
}

function scrubAll(random: Random): Step {
  const sky = tour(random, scatter(random, SKY_POUNCE, 330, 0.45), MOON);
  const ground = tour(random, scatter(random, GROUND_POUNCE, 110, 0.5), {x: 8.6, y: 9.9});
  return {
    title: 'Pounce the scrubber',
    tool: 'scrubber',
    paints: [],
    note: 'A steel-wool scrubber glued to a jar lid is pounced over everything while it is wet, from the light outward, and wiped before it goes from the sky to the ground. It lifts paint and drops it again a pad-width away, breaking every brushstroke into a glittering stipple.',
    gestures: [
      ...pounce(random, sky, [0.72, 0.95]),
      {kind: 'clean'},
      ...pounce(random, ground, [0.72, 0.95]),
    ],
    pace: 2.2,
  };
}

function pullTrunks(random: Random, trees: Planted[]): Step {
  const gestures: Gesture[] = [];
  const order = [...trees].sort((a, b) => depthOrder(a.depth) - depthOrder(b.depth));
  for (const tree of order) {
    const paint = TRUNK_PAINT[tree.depth];
    gestures.push({
      kind: 'load',
      mix: byHand(random, paint.mix),
      amount: paint.amount * random.between(0.85, 1.15),
      keep: 0.2,
    });
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

/**
 * How thick the leaves are at a point: heavy along the top and down both
 * sides, so the trees frame the picture, and thinning toward the middle,
 * where the moon and the light keep the sky open.
 */
function foliage(at: Point): number {
  const fromSide = Math.min(at.x, WIDTH - at.x);
  const sides = (1 - smoothstep(0.6, 4, fromSide)) * (1 - smoothstep(5.2, 8, at.y));
  const top = 1 - smoothstep(0.3, 2.4, at.y);
  return Math.max(sides, 0.8 * top);
}

function scrubCanopy(random: Random): Step {
  const clumps: Point[] = [];
  while (clumps.length < 30) {
    const at = {x: random.between(-0.3, WIDTH + 0.3), y: random.between(-0.3, 8.4)};
    if (near(at, MOON, 2) || random.next() > foliage(at)) continue;
    clumps.push(at);
  }
  const leaves = {prussianBlue: 2, phthaloGreen: 1.2, marsBlack: 0.8, burntUmber: 0.5};
  const lighter = {phthaloGreen: 1, prussianBlue: 1, skyBlue: 1.2};
  const gestures: Gesture[] = [];
  // Each clump is one firm press, and often a light one beside it that
  // catches only the high points of the stipple: dense in the middle, lacy
  // at the edges, with sky between the clumps. The pad runs drier between
  // loads, so no two clumps are the same weight.
  tour(random, clumps, {x: 0, y: 0}).forEach((at, i) => {
    if (i % 3 === 0)
      gestures.push({
        kind: 'load',
        mix: byHand(random, i % 12 === 9 ? lighter : leaves, 0.35),
        amount: random.between(1.3, 2),
        keep: 0.15,
      });
    // Pressed into wet paint, the pad lifts the sky's blue into its leaves.
    gestures.push({kind: 'press', at, pressure: random.between(0.45, 0.8), pickup: 0.3});
    if (random.next() < 0.55)
      gestures.push({
        kind: 'press',
        at: {x: at.x + random.between(-0.6, 0.6), y: at.y + random.between(-0.45, 0.45)},
        pressure: random.between(0.25, 0.45),
        skim: 0.35,
        pickup: 0.3,
      });
  });
  return {
    title: 'Pounce the leaves',
    tool: 'scrubber',
    paints: ['prussianBlue', 'phthaloGreen', 'marsBlack', 'burntUmber', 'skyBlue'],
    note: 'The scrubber again, now loaded with navy and dark green, pounced along the top and down both sides so the trees frame the picture. Each press prints a clump of leaves, lighter where it barely touches.',
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
  const tufts = scatter(random, GROUND, 170, 0.3).filter(
    (at) =>
      at.y > horizon(at.x) + 0.12 &&
      at.y < HEIGHT + 0.05 &&
      [-0.45, 0, 0.45].every((dx) => !PATH.contains({x: at.x + dx, y: at.y})),
  );
  /** 1 on the path's edge and in the clearing, falling to 0 in the shadows. */
  const light = (at: Point) =>
    Math.max(
      1 - smoothstep(0.2, 2.6, fromPath(at)),
      1 - smoothstep(0.8, 3, Math.hypot(at.x - CLEARING.x, at.y - CLEARING.y)),
    );
  const dark = tufts.filter((at) => light(at) < 0.25 && random.next() < 0.45);
  const pale = tufts.filter((at) => !dark.includes(at));

  const gestures: Gesture[] = [];
  const comb = (at: Point, length: [number, number]) =>
    gestures.push(
      combFlick(
        at,
        random.between(...length),
        random.between(-0.55, 0.55),
        random.between(-0.45, 0.45),
      ),
    );
  // A few dark blades first, where the ground is in shadow.
  tour(random, dark, {x: 0, y: HEIGHT}).forEach((at, i) => {
    if (i % 3 === 0)
      gestures.push({
        kind: 'load',
        mix: byHand(random, {phthaloGreen: 1, marsBlack: 1}),
        amount: 5,
        keep: 0.3,
      });
    comb(at, [0.3, 0.6]);
  });
  // Then pale ones over them everywhere, whitest where the light reaches.
  gestures.push({kind: 'clean'});
  tour(random, pale, {x: 0, y: HEIGHT}).forEach((at, i) => {
    if (i % 3 === 0) {
      const lit = light(at);
      const mix =
        lit > 0.55
          ? {titaniumWhite: 5, sapGreen: 0.4, cadmiumYellow: 0.4}
          : random.next() < 0.5
            ? {titaniumWhite: 3, sapGreen: 1}
            : {titaniumWhite: 3, sapGreen: 0.7, cadmiumYellow: 0.8};
      gestures.push({kind: 'load', mix: byHand(random, mix), amount: 5, keep: 0.3});
    }
    comb(at, [0.22, 0.5]);
  });
  return {
    title: 'Comb the grass',
    tool: 'comb',
    paints: ['titaniumWhite', 'sapGreen', 'cadmiumYellow', 'phthaloGreen', 'marsBlack'],
    note: 'A fine comb with paint on its teeth, set down on the ground and flicked upward: a dozen blades at a time. A few dark ones in the shadows first, then pale green and white over them, palest where the light reaches.',
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
  const gestures: Gesture[] = [];
  // Thin coats of white, dabbed over and over in one spot until the moon is
  // solid, the cotton dipped again every few dabs so the wet blue under it
  // never dulls the white.
  for (let i = 0; i < 20; i++) {
    if (i % 5 === 0) gestures.push({kind: 'load', mix: {titaniumWhite: 1}, amount: 3, keep: 0.25});
    const angle = random.between(0, Math.PI * 2);
    const out = random.between(0, MOON.radius * 0.35);
    gestures.push({
      kind: 'press',
      at: {x: MOON.x + Math.cos(angle) * out, y: MOON.y + Math.sin(angle) * out},
      pressure: random.between(0.75, 0.95),
      angle: random.between(0, 6.28),
    });
  }
  // The glow: what is left on the cotton, dabbed around the moon and outward,
  // lighter and smaller the further it goes, catching only the stipple's peaks.
  gestures.push({kind: 'load', mix: {titaniumWhite: 1}, amount: 1.4, keep: 0.5});
  for (let i = 0; i < 36; i++) {
    const far = random.next();
    const angle = random.between(0, Math.PI * 2);
    const out = MOON.radius * (1 + 1.9 * far * far);
    gestures.push({
      kind: 'press',
      at: {x: MOON.x + Math.cos(angle) * out, y: MOON.y + Math.sin(angle) * out},
      pressure: random.between(0.38, 0.48) - 0.15 * far,
      angle: random.between(0, 6.28),
      skim: 0.45,
      size: random.between(1, 1.25) - 0.35 * far,
    });
  }
  return {
    title: 'Dab the moon',
    tool: 'cotton',
    paints: ['titaniumWhite'],
    note: 'Before a single trunk goes in, a ball of cotton wool in a clothespin, dipped in white and dabbed over and over in one spot until the moon is solid; then, nearly dry, dabbed lightly around it for the glow. The trees will stand in front of its light.',
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
    // Close around the fox, as lights gather round the brightest thing, but never on it.
    if (avoidFox && onFox(at, 0.25)) continue;
    if (near(at, MOON, MOON.radius * 2)) continue;
    spots.push(at);
  }
  return spots;
}

function bundleFlowers(random: Random): Step {
  // Meadow flowers: thick in the foreground and toward the light, thinning
  // into the shadows; never on the trodden path or where the fox will sit.
  const meadow = (count: number) => {
    const spots: Point[] = [];
    while (spots.length < count) {
      const at = {x: random.between(0.3, WIDTH - 0.3), y: random.between(9, HEIGHT - 0.2)};
      if (at.y < horizon(at.x) + 0.35 || fromPath(at) < 0.45) continue;
      // Up to the fox's edge; the fan of swabs never reaches under it.
      if (onFox(at, 0.95)) continue;
      const lit = 1 - smoothstep(0.4, 3, fromPath(at));
      const foreground = smoothstep(horizon(at.x), HEIGHT, at.y);
      if (random.next() > 0.2 + 0.45 * foreground + 0.45 * lit) continue;
      spots.push(at);
    }
    return spots;
  };
  const gestures: Gesture[] = [];
  const stamp = (at: Point) =>
    gestures.push({
      kind: 'press',
      at,
      pressure: random.between(0.45, 0.95),
      angle: random.between(-0.9, 0.9),
      size: random.between(0.8, 1.15),
    });
  tour(random, meadow(20), CLEARING).forEach((at, i) => {
    if (i % 3 === 0)
      gestures.push({
        kind: 'load',
        mix: byHand(random, {cadmiumYellow: 4, titaniumWhite: 1}, 0.3),
        amount: random.between(4, 5.5),
        keep: 0.2,
      });
    stamp(at);
  });
  gestures.push({kind: 'clean'});
  tour(random, meadow(9), CLEARING).forEach((at, i) => {
    if (i % 3 === 0)
      gestures.push({
        kind: 'load',
        mix: byHand(random, {titaniumWhite: 6, cadmiumYellow: 0.15}),
        amount: random.between(4, 5.5),
        keep: 0.1,
      });
    stamp(at);
  });
  return {
    title: 'Stamp the flowers',
    tool: 'bundle',
    paints: ['cadmiumYellow', 'titaniumWhite'],
    note: 'Twenty cotton swabs held in a rubber band and fanned out, dipped in yellow and stamped through the meadow, right up to where the fox will sit: a scatter of small flowers with every press, thickest toward the light. Then a few in white.',
    gestures,
    pace: 1.4,
  };
}

function swabFireflies(random: Random): Step {
  const gestures: Gesture[] = [];
  const spots = tour(random, lightSpots(random, 150), CLEARING);
  spots.forEach((at, i) => {
    const yellow = i % 5 < 2;
    if (i % 2 === 0) {
      gestures.push({
        kind: 'load',
        mix: byHand(
          random,
          yellow ? {cadmiumYellow: 5, sapGreen: 1, titaniumWhite: 2} : {titaniumWhite: 1},
        ),
        amount: random.between(4, 5.5),
        keep: 0.1,
      });
    }
    // Most are a quick touch of the tip; now and then the swab is pressed flat.
    gestures.push({
      kind: 'press',
      at,
      pressure: random.between(0.4, 0.95),
      angle: random.between(0, 6.28),
      size: 0.42 + random.next() ** 1.8,
    });
  });
  return {
    title: 'Dot the fireflies',
    tool: 'swab',
    paints: ['titaniumWhite', 'cadmiumYellow', 'sapGreen'],
    note: 'One swab, one dot at a time, some with just its tip and some pressed flat: white ones and yellow-green ones, thickest where the light is.',
    gestures,
    pace: 1.5,
  };
}

function penFox(): Step {
  return {
    title: 'Draw the fox',
    tool: 'pen',
    paints: ['titaniumWhite'],
    note: 'A white paint pen, fed from its barrel so it never runs dry: the fox outlined first, then filled with lines back and forth until it is solid white, the ears and the curl of the tail last.',
    gestures: [{kind: 'load', mix: {titaniumWhite: 1}, amount: 4}, ...foxGestures()],
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

function cottonGlows(random: Random, spots: Point[]): Step {
  const gestures: Gesture[] = [];
  // The cotton is dabbed off on a card first, so it is nearly dry: each press
  // and twist leaves a small soft halo of fine rays, not a patch of paint.
  spots.forEach((at, i) => {
    if (i % 2 === 0)
      gestures.push({
        kind: 'load',
        mix: {titaniumWhite: 1},
        amount: random.between(0.9, 1.4),
        keep: 0.2,
      });
    gestures.push({
      kind: 'press',
      at,
      pressure: random.between(0.45, 0.65),
      angle: random.between(0, 6.28),
      skim: 0.3,
      twist: random.between(0.9, 1.3),
      size: random.between(0.45, 0.75),
    });
  });
  return {
    title: 'Twist the glows',
    tool: 'cotton',
    paints: ['titaniumWhite'],
    note: 'The cotton ball, with a little white dabbed off on a card until it is nearly dry, pressed and twisted: the fibers drag the paint out in fine rays, and the brightest fireflies get a halo.',
    gestures,
  };
}

function swabSparkles(random: Random, glows: Point[]): Step {
  const gestures: Gesture[] = [];
  // A bright heart in every glow, light on the ground round the fox's feet,
  // then more small lights everywhere.
  const atFeet = Array.from({length: 14}, () => ({
    x: FOX.x + random.between(-0.6, 0.8),
    y: FOX.y + random.between(-0.02, 0.22),
  })).filter((p) => !onFox(p, 0.08));
  const spots = [...glows, ...atFeet, ...tour(random, lightSpots(random, 40), CLEARING)];
  spots.forEach((at, i) => {
    if (i % 3 === 0) gestures.push({kind: 'load', mix: {titaniumWhite: 1}, amount: 5, keep: 0.1});
    gestures.push({
      kind: 'press',
      at,
      pressure: random.between(0.35, 0.6),
      angle: random.between(0, 6.28),
      size: 0.35 + 0.6 * random.next() ** 1.5,
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

export function moonlitWood(seed = 11): Score {
  // Each part of the picture draws from its own stream, so retouching one
  // step leaves every other just as it was.
  const hand = (part: number) => createRandom(seed * 100 + part);
  const trees = plant(hand(0));
  const lights = hand(1);
  const glows = tour(lights, lightSpots(lights, 24), CLEARING);
  return {
    title: 'Fox at the edge of the wood',
    width: WIDTH,
    height: HEIGHT,
    steps: [
      dropPaint(),
      spreadSky(hand(2)),
      knifeMasses(hand(3)),
      pullMist(hand(4)),
      layGround(hand(5)),
      scrubAll(hand(6)),
      cottonMoon(hand(7)),
      pullTrunks(hand(8), trees),
      scrubCanopy(hand(9)),
      spatterStars(hand(10)),
      combGrass(hand(11)),
      linerLights(hand(12)),
      dryEverything(),
      bundleFlowers(hand(13)),
      swabFireflies(hand(14)),
      penFox(),
      linerEdges(hand(15), trees),
      cottonGlows(hand(16), glows),
      swabSparkles(hand(17), glows),
    ],
  };
}
