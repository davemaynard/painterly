/** An RGB triple, 0..255 each. */
export type Rgb = [number, number, number];

/** A point in canvas pixels. */
export type Point = [number, number];

/**
 * One brush stroke, as the planner decided it. The renderer decides what a
 * stroke of this radius and colour looks like; the planner only says where it
 * goes and how long it runs.
 */
export type Stroke = {
  /** 0 is the biggest brush, the underpainting; higher is finer. */
  layer: number;
  /** Brush radius in canvas pixels. */
  radius: number;
  /** Sampled from the reference photo, blurred to this layer's scale. */
  color: Rgb;
  /** The path the stroke follows, at least two points, roughly `radius` apart. */
  points: Point[];
  /** Seed for the renderer's per-stroke jitter, so replay is exact. */
  jitter: number;
};

/**
 * The whole painting, in painting order. Pure data: the same photo, options
 * and seed produce a deep-equal Plan anywhere.
 */
export type Plan = {
  seed: number;
  width: number;
  height: number;
  /** The colour the canvas is primed with before the first stroke. */
  ground: Rgb;
  strokes: Stroke[];
  /** How many strokes each layer contributed, in layer order. */
  layerSizes: number[];
};
