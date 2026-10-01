// The tools on the table, as the simulation and the page need them: how big
// each one is, how it holds and gives paint, how fast a hand moves it, and
// what to call it. The sizes are the real ones, in inches, read off the
// tools in the video this painting follows.
//
// A tool's body (surface.ts) is the physics. The rest is choreography: how
// far apart its touches fall along a stroke, how quickly it travels, how it
// is held.
import type {ToolBody} from './engine/surface.ts';

export type ToolName =
  | 'tube'
  | 'wideBrush'
  | 'knife'
  | 'flatBrush'
  | 'scrubber'
  | 'trunkBrush'
  | 'spatter'
  | 'comb'
  | 'liner'
  | 'dryer'
  | 'cotton'
  | 'swab'
  | 'bundle'
  | 'pen';

export type ToolSpec = {
  name: ToolName;
  /** What a painter would call it. */
  label: string;
  /** The contact physics, for tools that touch the canvas. */
  body?: ToolBody;
  /** Width of the working edge, in inches: across a brush, along a comb, a pad's diameter. */
  width: number;
  /** Depth of the contact along the stroke at full pressure, in inches. */
  depth: number;
  /** Depth of the contact at the lightest touch, as a share of `depth`. */
  lightDepth: number;
  /** Gap between touches along a stroke, as a share of the contact's depth. */
  spacing: number;
  /** How fast a hand moves it along a stroke, inches per second. */
  speed: number;
};

/** A fan of swab tips, 19 of them, as a bundle held in a rubber band spreads them. */
const FANNED_SWABS = (() => {
  const tips: [number, number, number][] = [];
  const rows = [
    {count: 8, radius: 0.78, spread: 1.05},
    {count: 7, radius: 0.52, spread: 0.95},
    {count: 4, radius: 0.27, spread: 0.8},
  ];
  for (const row of rows) {
    for (let i = 0; i < row.count; i++) {
      const angle = Math.PI / 2 + (i / (row.count - 1) - 0.5) * 2 * row.spread;
      tips.push([Math.cos(angle) * row.radius, Math.sin(angle) * row.radius - 0.35, 0.075]);
    }
  }
  return tips;
})();

export const tools: Record<ToolName, ToolSpec> = {
  tube: {
    name: 'tube',
    label: 'Paint, straight from the tube',
    width: 0.52,
    depth: 0.72,
    lightDepth: 1,
    spacing: 1,
    speed: 6,
  },
  wideBrush: {
    name: 'wideBrush',
    label: 'Two-inch flat brush',
    body: {
      kind: 'flat',
      seed: 2101,
      shape: [26, 0, 0, 0],
      deposit: 0.09,
      pickup: 0.18,
      capacity: 36,
      level: 2,
      scrape: 0.6,
      churn: 0.3,
      drag: 0.35,
      share: 0.05,
      bare: '#9a8c74',
      resolution: [256, 48],
    },
    width: 2,
    depth: 0.42,
    lightDepth: 0.55,
    spacing: 0.22,
    speed: 9,
  },
  knife: {
    name: 'knife',
    label: 'Painting knife',
    body: {
      kind: 'knife',
      seed: 3301,
      shape: [0, 0, 0, 0],
      deposit: 0.2,
      pickup: 0.25,
      capacity: 40,
      level: 1.6,
      scrape: 0.55,
      churn: 0.25,
      share: 0,
      bare: '#b9bcc0',
      resolution: [80, 160],
    },
    width: 0.62,
    depth: 1.35,
    lightDepth: 0.8,
    spacing: 0.06,
    speed: 4,
  },
  flatBrush: {
    name: 'flatBrush',
    label: 'One-inch flat brush',
    body: {
      kind: 'flat',
      seed: 1102,
      shape: [15, 0, 0, 0],
      deposit: 0.1,
      pickup: 0.16,
      capacity: 30,
      level: 2,
      scrape: 0.55,
      churn: 0.3,
      drag: 0.3,
      share: 0.05,
      bare: '#a39377',
      resolution: [160, 40],
    },
    width: 1,
    depth: 0.3,
    lightDepth: 0.6,
    spacing: 0.22,
    speed: 7,
  },
  scrubber: {
    name: 'scrubber',
    label: 'Steel-wool scrubber on a jar lid',
    body: {
      kind: 'scrubber',
      seed: 4401,
      shape: [12, 0, 0, 0],
      deposit: 0.3,
      pickup: 0.1,
      capacity: 3,
      churn: 0.3,
      pull: 0.5,
      share: 0,
      bare: '#8f9396',
      resolution: [192, 192],
    },
    width: 2.6,
    depth: 2.6,
    lightDepth: 0.9,
    spacing: 1,
    speed: 30,
  },
  trunkBrush: {
    name: 'trunkBrush',
    label: 'Half-inch flat brush',
    body: {
      kind: 'flat',
      seed: 5502,
      shape: [8, 0, 0, 0],
      deposit: 0.05,
      pickup: 0.03,
      capacity: 30,
      churn: 0.04,
      drag: 0.2,
      share: 0.04,
      bare: '#8e8068',
      resolution: [96, 40],
    },
    width: 0.42,
    depth: 0.2,
    lightDepth: 0.6,
    spacing: 0.25,
    speed: 7,
  },
  spatter: {
    name: 'spatter',
    label: 'Round brush, tapped on a handle',
    width: 0.3,
    depth: 0.3,
    lightDepth: 1,
    spacing: 1,
    speed: 10,
  },
  comb: {
    name: 'comb',
    label: 'Fine-tooth comb',
    body: {
      kind: 'comb',
      seed: 6601,
      shape: [16, 0.22, 0, 0],
      deposit: 0.28,
      pickup: 0.05,
      capacity: 6,
      churn: 0.02,
      share: 0,
      bare: '#2a2a2c',
      resolution: [192, 16],
    },
    width: 1.05,
    depth: 0.07,
    lightDepth: 0.7,
    spacing: 0.5,
    speed: 6,
  },
  liner: {
    name: 'liner',
    label: 'Liner brush',
    body: {
      kind: 'round',
      seed: 7702,
      shape: [3, 0.9, 0, 0],
      deposit: 0.3,
      pickup: 0.03,
      capacity: 8,
      churn: 0.0,
      share: 0.05,
      bare: '#c9b18a',
      resolution: [24, 24],
    },
    width: 0.07,
    depth: 0.07,
    lightDepth: 0.45,
    spacing: 0.3,
    speed: 3.5,
  },
  dryer: {
    name: 'dryer',
    label: 'Hair dryer',
    width: 5,
    depth: 5,
    lightDepth: 1,
    spacing: 0.08,
    speed: 4,
  },
  cotton: {
    name: 'cotton',
    label: 'Cotton ball in a clothespin',
    body: {
      kind: 'cotton',
      seed: 8801,
      shape: [0, 0, 0, 0],
      deposit: 0.34,
      pickup: 0.05,
      capacity: 8,
      churn: 0.05,
      share: 0,
      bare: '#f2f0ea',
      resolution: [96, 96],
    },
    width: 0.8,
    depth: 0.8,
    lightDepth: 0.8,
    spacing: 1,
    speed: 12,
  },
  swab: {
    name: 'swab',
    label: 'Cotton swab',
    body: {
      kind: 'swab',
      seed: 9901,
      shape: [0, 0, 0, 0],
      deposit: 0.7,
      pickup: 0.03,
      capacity: 8,
      churn: 0.0,
      share: 0,
      bare: '#f4f2ec',
      resolution: [32, 32],
    },
    width: 0.19,
    depth: 0.19,
    lightDepth: 0.85,
    spacing: 1,
    speed: 12,
  },
  bundle: {
    name: 'bundle',
    label: 'Bundle of cotton swabs',
    body: {
      kind: 'bundle',
      seed: 9911,
      shape: [0, 0, 0, 0],
      swabs: FANNED_SWABS,
      deposit: 0.65,
      pickup: 0.03,
      capacity: 8,
      churn: 0.0,
      share: 0,
      bare: '#f4f2ec',
      resolution: [160, 160],
    },
    width: 1.7,
    depth: 1.7,
    lightDepth: 1,
    spacing: 1,
    speed: 12,
  },
  pen: {
    name: 'pen',
    label: 'White paint pen',
    body: {
      kind: 'pen',
      seed: 1203,
      shape: [0, 0, 0, 0],
      deposit: 0.85,
      pickup: 0,
      capacity: 1,
      level: 2.6,
      churn: 0,
      share: 0,
      bare: '#f4f3ef',
      resolution: [16, 16],
    },
    width: 0.075,
    depth: 0.075,
    lightDepth: 1,
    spacing: 0.3,
    speed: 2.5,
  },
};
