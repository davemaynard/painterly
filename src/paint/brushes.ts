// What a stroke looks like once a hand holds the brush. The planner only says
// where a stroke goes, how wide it is and what colour; a Brush says how many
// bristles that becomes, how translucent, how much each bristle's colour and
// weight wander. `bristle` is the 2020 look; `round` is the pointillist sketch
// that never finished; `flat` is a wide, opaque house-painter's brush.

export type Brush = {
  name: string;
  /** Parallel passes per stroke. 1 draws the path once. */
  bristles: number;
  /** How far the bristles fan out, as a fraction of the stroke radius. */
  spread: number;
  /** Line width of each bristle, as a range of fractions of the radius. */
  weight: [number, number];
  /** Opacity of each bristle, 0..1. */
  alpha: number;
  /** How far each bristle's colour may wander from the stroke colour, 0..255 per channel. */
  drift: number;
  /** Draw a dot at each point instead of a line through them. */
  dots: boolean;
  // `spread` has no effect at one bristle, and `ragged` none when `dots` is set:
  // a dot has no path to come in short of.
  /**
   * How much of the path each bristle may skip at either end, 0..0.5. Real
   * bristles do not all touch down and lift at the same moment; this ragged
   * start and finish is most of what makes a stroke read as hair, not ribbon.
   */
  ragged: number;
};

export const brushes = {
  bristle: {
    name: 'bristle',
    bristles: 8,
    spread: 0.9,
    weight: [0.12, 0.38],
    alpha: 0.55,
    drift: 14,
    dots: false,
    ragged: 0.25,
  },
  ribbon: {
    name: 'ribbon',
    bristles: 6,
    spread: 0.8,
    weight: [0.18, 0.5],
    alpha: 0.6,
    drift: 12,
    dots: false,
    ragged: 0,
  },
  round: {
    name: 'round',
    bristles: 1,
    spread: 0,
    weight: [1.6, 2.2],
    alpha: 0.9,
    drift: 8,
    dots: true,
    ragged: 0,
  },
  flat: {
    name: 'flat',
    bristles: 2,
    spread: 0.45,
    weight: [1.0, 1.2],
    alpha: 0.85,
    drift: 6,
    dots: false,
    ragged: 0.08,
  },
} satisfies Record<string, Brush>;

export type BrushName = keyof typeof brushes;
