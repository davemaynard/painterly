// A score is a painting written down as what the painter does: which tool,
// which paint, and every movement of the hand, step by step. It is pure data,
// in inches from the top left of the canvas, and says nothing about pixels or
// time; timeline.ts turns it into touches on the clock.
import type {Mix, PaintName} from '../engine/pigments.ts';
import type {ToolName} from '../tools.ts';

/** A point on the canvas, in inches from its top left corner. */
export type Point = {x: number; y: number};

/** A point along a stroke, with how hard the hand presses there, 0..1. */
export type StrokePoint = Point & {pressure: number};

/** How a stroke handles paint, where it differs from the tool's habit. */
export type Handling = {
  /** Only catch the high points of the surface, 0..1: dry brushing. */
  skim?: number;
  deposit?: number;
  pickup?: number;
  /** Level the paint to this thickness (0.1 mm), scraping off what stands above it. */
  level?: number;
  scrape?: number;
};

export type Gesture =
  /**
   * Drag the tool along a path. A flat brush is pulled flat unless it is
   * turned on its edge; `tilt` turns the tool off square to its path, in radians.
   */
  | ({kind: 'stroke'; points: StrokePoint[]; edge?: boolean; tilt?: number} & Handling)
  /** Put the tool down at one spot and lift it: a pounce, a dab, a dot. `twist` turns it while pressed. */
  | ({kind: 'press'; at: Point; pressure: number; angle?: number; twist?: number} & Handling)
  /** Charge the tool with paint. `keep` is how much of what it held stays mixed in. */
  | {kind: 'load'; mix: Mix; amount: number; keep?: number}
  /** Wipe the tool. */
  | {kind: 'clean'}
  /** Squeeze a drop of paint straight from the tube. */
  | {kind: 'drop'; at: Point; mix: Mix; size: number; angle?: number}
  /** Tap a loaded brush against a handle: specks fly and land. */
  | {kind: 'flick'; from: Point; mix: Mix; specks: Speck[]}
  /** Sweep warm air along a path. */
  | {kind: 'dry'; path: Point[]};

/** One flicked speck: where it lands, its radius in inches and the way it was flying. */
export type Speck = Point & {radius: number; angle: number};

export type Step = {
  title: string;
  tool: ToolName;
  /** The paints this step uses, for the chips beside it. */
  paints: PaintName[];
  /** What the tool is doing and why, in a sentence or two. */
  note: string;
  gestures: Gesture[];
  /** Plays this many times faster than the hand would move, for long, repetitive work. */
  pace?: number;
};

export type Score = {
  title: string;
  /** The canvas, in inches. */
  width: number;
  height: number;
  steps: Step[];
};
