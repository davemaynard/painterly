// The three media. Every style uses the same planner and the same painter; a
// style only says how to prepare the photo, how far to refine it, which brush
// each layer gets, what the canvas is primed with, and how the paint sits on
// the support once the last stroke is down.
//
// The band painters read the brushes from here in their own processes, so
// the definitions stay plain data plus a few small functions.
import {type Brush, blur, type PlanOptions, type Raster, type Rgb} from '../../dist/index.js';
import {drawInk, inkLines} from './ink.ts';
import {reducePalette} from './palette.ts';
import {
  canvasWeave,
  edgeDarken,
  grade,
  granulate,
  paperGrain,
  pigmentDensity,
  shadeRelief,
  transparency,
  wobble,
} from './surface.ts';

export type Style = {
  label: string;
  /** Simplify the photo before planning, the way a painter squints at it. */
  prepare?: (photo: Raster, seed: number) => Raster;
  /** Planner options for a photo of this size, radii included; illustrate() adds `flow: 'tensor'`. */
  plan: (width: number, height: number) => PlanOptions & {radii: number[]};
  brushFor: (layer: number) => Brush;
  /**
   * What the canvas is primed with: `toned` is the prepared photo blurred to
   * the biggest brush, `source` is the prepared photo itself, or a flat color.
   */
  ground: 'toned' | 'source' | Rgb;
  /** A second pass that paints the broad strokes again as heights, for the finish to light. */
  relief?: {brush: Brush; belowLayer: number; load: [base: number, extra: number]};
  finish: (image: Raster, context: FinishContext) => void;
};

export type FinishContext = {
  /** The photo as loaded, before `prepare`. */
  photo: Raster;
  seed: number;
  /** The relief pass, when the style has one. */
  heights?: Raster;
};

export type StyleName = 'oil' | 'gouache' | 'watercolor';

/** Brush radii as fractions of the photo's longer side, never under 1.5 px. */
const radii = (width: number, height: number, divisors: number[]) =>
  divisors.map((d) => Math.max(1.5, Math.max(width, height) / d));

/** Pixel sizes in the finishes are tuned at 2,000 px on the longer side and scale from there. */
const scale = (image: Raster) => Math.max(image.width, image.height) / 2000;

// Matte oil: six stiff bristles that keep their marks on the four broad layers,
// two on the fine ones where a stroke is only a few pixels wide. The relief
// brush repaints the broad strokes with a wider drift, so each bristle leaves
// its own ridge.
const oilBroad: Brush = {
  name: 'oil, broad',
  bristles: 6,
  spread: 0.7,
  weight: [0.35, 0.6],
  alpha: 0.85,
  drift: 8,
  dots: false,
  ragged: 0.15,
};
const oilDetail: Brush = {
  ...oilBroad,
  name: 'oil, detail',
  bristles: 2,
  spread: 0.4,
  weight: [0.9, 1.1],
  drift: 6,
  ragged: 0.1,
};
const oilRelief: Brush = {...oilBroad, name: 'oil, relief', drift: 40};

// Gouache: opaque and flat. A wide brush lays one even color, its hairs barely
// wander, and it starts and finishes clean.
const gouacheBroad: Brush = {
  name: 'gouache, broad',
  bristles: 3,
  spread: 0.45,
  weight: [0.85, 1.05],
  alpha: 0.97,
  drift: 2,
  dots: false,
  ragged: 0.04,
};
const gouacheDetail: Brush = {
  ...gouacheBroad,
  name: 'gouache, detail',
  bristles: 2,
  spread: 0.35,
  weight: [0.95, 1.1],
};

// A watercolor wash: soft, wide and see-through, so color builds where washes
// overlap and thins where they do not.
const wash: Brush = {
  name: 'watercolor wash',
  bristles: 2,
  spread: 0.35,
  weight: [1.5, 1.9],
  alpha: 0.42,
  drift: 5,
  dots: false,
  ragged: 0.2,
};

export const styles: Record<StyleName, Style> = {
  oil: {
    label: 'matte oil',
    plan: (width, height) => ({
      radii: radii(width, height, [36, 72, 144, 288, 576, 1000]),
      threshold: 26,
      minLength: 3,
      maxLength: 12,
      curvature: 0.85,
    }),
    brushFor: (layer) => (layer < 4 ? oilBroad : oilDetail),
    ground: 'toned',
    relief: {brush: oilRelief, belowLayer: 4, load: [4, 14]},
    finish(image, {heights}) {
      if (heights) shadeRelief(image, heights, {amount: 0.18, texture: 2.5});
      // A matte varnish: darks a little lifted, highlights held back, color quieter.
      grade(image, {floor: 14, ceiling: 246, quieten: 0.08});
      canvasWeave(image, 0.035);
    },
  },

  gouache: {
    label: 'gouache',
    // A limited palette, so each area is one mixed color with a clean edge.
    prepare: (photo, seed) => reducePalette(photo, 32, seed),
    plan: (width, height) => ({
      radii: radii(width, height, [30, 60, 120, 240, 480, 800]),
      threshold: 30,
      minLength: 2,
      maxLength: 9,
      curvature: 0.7,
    }),
    brushFor: (layer) => (layer < 3 ? gouacheBroad : gouacheDetail),
    ground: 'toned',
    finish(image, {seed}) {
      // Gouache dries matte and a little chalky: lifted darks, no sheen.
      grade(image, {floor: 20, ceiling: 248, quieten: 0.03});
      paperGrain(image, 0.012, seed);
    },
  },

  watercolor: {
    label: 'ink line and watercolor wash',
    // A watercolorist simplifies before painting: a few mixed colors, soft
    // shapes, edges that wander. Blurring before the palette lets a textured
    // lawn average to one green instead of breaking into speckles of three.
    prepare(photo, seed) {
      const size = scale(photo);
      const simplified = blur(reducePalette(blur(photo, 2.5 * size), 18, seed), size);
      return wobble(simplified, 1.5 * size, 12 * size, seed);
    },
    // Washes only lay in color and light; the pen does the detail, so the
    // planner stops at a mid-sized brush.
    plan: (width, height) => ({
      radii: radii(width, height, [24, 48, 96, 192]),
      threshold: 22,
      minLength: 3,
      maxLength: 14,
      curvature: 0.9,
    }),
    brushFor: () => wash,
    ground: 'source',
    finish(image, {photo, seed}) {
      const size = scale(image);
      transparency(image, 0.12);
      pigmentDensity(image, 0.05, 80 * size, seed);
      edgeDarken(image, 1.6, 3 * size);
      granulate(image, 0.05, seed);
      paperGrain(image, 0.015, seed);
      const lines = inkLines(photo, {sigma: size, sharpness: 120, shapeScale: 3, keep: 0.8});
      drawInk(image, lines, [43, 39, 36], 0.7);
    },
  },
};

export function isStyleName(name: string): name is StyleName {
  return name in styles;
}

/** A painting pass: the colors, or the heights the relief is lit from. */
export type Pass = 'color' | 'relief';

/** The brush that paints `layer` in the given pass of a style. */
export function brushFor(style: StyleName, pass: Pass, layer: number): Brush {
  const definition = styles[style];
  if (pass === 'relief') {
    if (!definition.relief) throw new Error(`${style} has no relief pass`);
    return definition.relief.brush;
  }
  return definition.brushFor(layer);
}
