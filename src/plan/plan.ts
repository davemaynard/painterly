// The painter's decisions, as pure data. Given a photo, produce every stroke in
// painting order: biggest brush first as an underpainting, then finer brushes
// wherever the picture still disagrees with the photo. This is a port of Aaron
// Hertzmann's "Painterly Rendering with Curved Brush Strokes of Multiple Sizes"
// (SIGGRAPH 1998), https://www.mrl.nyu.edu/publications/painterly98/, with
// three habits kept from the 2020
// Processing sketches: the canvas is primed with the photo's dominant colour,
// stroke order within a layer is shuffled so the hand looks human, and the
// randomness is seeded so the same photo paints the same way every time.
import {blur} from '../image/blur';
import {sobel} from '../image/gradient';
import {colorDistance, createRaster, dominantColor, type Raster, sample} from '../image/raster';
import {createRandom} from '../random';
import type {Plan, Rgb, Stroke} from '../types';
import {stampStroke} from './stamp';
import {growStroke} from './stroke';

export type PlanOptions = {
  /** Same seed, same painting. Default 1. */
  seed?: number;
  /**
   * Brush radii in pixels, largest first. Default is five brushes scaled to the
   * longer side of the image: 1/40, 1/80, 1/160, 1/320 and 1/640 of it.
   */
  radii?: number[];
  /**
   * How far (RGB distance, 0..441) a cell of the canvas may sit from the photo
   * before it earns a stroke. Lower means more strokes and a closer likeness.
   * Default 40.
   */
  threshold?: number;
  /** Grid spacing between candidate strokes, as a multiple of the radius. Default 1. */
  gridFactor?: number;
  /** Blur applied to the photo for each brush, as a multiple of the radius. Default 0.5. */
  blurFactor?: number;
  /** Shortest and longest stroke, in steps of the radius. Default 3 and 10. */
  minLength?: number;
  maxLength?: number;
  /** 1 follows the image gradient exactly; lower values straighten strokes. Default 1. */
  curvature?: number;
  /** Called after each brush is planned: how many are done, out of how many. */
  onLayer?: (planned: number, of: number) => void;
};

export function defaultRadii(width: number, height: number): number[] {
  const side = Math.max(width, height);
  return [40, 80, 160, 320, 640].map((d) => Math.max(1.5, side / d));
}

export function plan(source: Raster, options: PlanOptions = {}): Plan {
  const {
    seed = 1,
    radii = defaultRadii(source.width, source.height),
    threshold = 40,
    gridFactor = 1,
    blurFactor = 0.5,
    minLength = 3,
    maxLength = 10,
    curvature = 1,
    onLayer,
  } = options;
  const random = createRandom(seed);
  const {width, height} = source;
  const ground = dominantColor(source);
  const canvas = createRaster(width, height, ground);
  const strokes: Stroke[] = [];
  const layerSizes: number[] = [];
  const refPixel: Rgb = [0, 0, 0];
  const canvasPixel: Rgb = [0, 0, 0];

  radii.forEach((radius, layer) => {
    const reference = blur(source, blurFactor * radius);
    const gradient = sobel(reference);
    const grid = Math.max(1, Math.round(gridFactor * radius));

    // Where does the canvas still disagree with the photo at this scale?
    const difference = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        difference[y * width + x] = colorDistance(
          sample(reference, x, y, refPixel),
          sample(canvas, x, y, canvasPixel),
        );
      }
    }

    // One candidate stroke per grid cell whose average error is over the
    // threshold, started at the cell's worst pixel.
    const layerStrokes: Stroke[] = [];
    for (let gy = 0; gy < height; gy += grid) {
      for (let gx = 0; gx < width; gx += grid) {
        let sum = 0;
        let worst = -1;
        let worstX = gx;
        let worstY = gy;
        let count = 0;
        const yEnd = Math.min(height, gy + grid);
        const xEnd = Math.min(width, gx + grid);
        for (let y = gy; y < yEnd; y++) {
          for (let x = gx; x < xEnd; x++) {
            const d = difference[y * width + x] as number;
            sum += d;
            count++;
            if (d > worst) {
              worst = d;
              worstX = x;
              worstY = y;
            }
          }
        }
        if (sum / count <= threshold) continue;
        const grown = growStroke(worstX, worstY, reference, canvas, gradient, {
          radius,
          minLength,
          maxLength,
          curvature,
        });
        layerStrokes.push({
          layer,
          radius,
          color: grown.color,
          points: grown.points,
          jitter: 0,
        });
      }
    }

    // Shuffle first, then draw each stroke's jitter, so the brush's own
    // randomness follows painting order and the whole plan stays reproducible.
    // One at a time rather than push(...layerStrokes): a fine grid holds more
    // strokes than an argument list has room for.
    random.shuffle(layerStrokes);
    for (const stroke of layerStrokes) {
      stroke.jitter = Math.floor(random.next() * 0x100000000);
      stampStroke(canvas, stroke.points, radius, stroke.color);
      strokes.push(stroke);
    }
    layerSizes.push(layerStrokes.length);
    onLayer?.(layer + 1, radii.length);
  });

  return {seed, width, height, ground, strokes, layerSizes};
}

/**
 * The planner's own rendering of a plan, discs along each path. Not what the
 * page shows, but exactly what the planner steered by, so tests can measure how
 * close each layer brought the picture to the photo.
 */
export function simulate(painting: Plan, upTo: number = painting.strokes.length): Raster {
  const canvas = createRaster(painting.width, painting.height, painting.ground);
  for (let i = 0; i < upTo && i < painting.strokes.length; i++) {
    const stroke = painting.strokes[i] as Stroke;
    stampStroke(canvas, stroke.points, stroke.radius, stroke.color);
  }
  return canvas;
}

/** Mean RGB distance between two rasters of the same size. */
export function meanDifference(a: Raster, b: Raster): number {
  let sum = 0;
  const pixels = a.width * a.height;
  const pa: Rgb = [0, 0, 0];
  const pb: Rgb = [0, 0, 0];
  for (let y = 0; y < a.height; y++) {
    for (let x = 0; x < a.width; x++) {
      sum += colorDistance(sample(a, x, y, pa), sample(b, x, y, pb));
    }
  }
  return sum / pixels;
}
