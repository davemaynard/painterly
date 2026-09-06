// Growing one stroke. Ported from Hertzmann's makeSplineStroke (SIGGRAPH 1998,
// "Painterly Rendering with Curved Brush Strokes of Multiple Sizes"), which is
// where the 2020 sketches' random-walk beziers turned into paths that follow
// the picture: each step moves perpendicular to the image gradient, so the
// stroke runs along an edge instead of across it.
import type {Gradient} from '../image/gradient';
import {colorDistance, type Raster, sample} from '../image/raster';
import type {Point, Rgb} from '../types';

export type GrowOptions = {
  radius: number;
  /** Steps of `radius` a stroke must take before it may stop early. */
  minLength: number;
  /** Steps of `radius` a stroke may take at most. */
  maxLength: number;
  /** 1 follows the gradient exactly; lower values smooth the path toward straight. */
  curvature: number;
};

export type Grown = {color: Rgb; points: Point[]};

const scratchA: Rgb = [0, 0, 0];
const scratchB: Rgb = [0, 0, 0];

/**
 * Start at (x0, y0) in the colour the blurred reference has there, and walk.
 * Stops when the canvas already matches the reference better than this stroke
 * would, when the gradient vanishes, at the edge, or at `maxLength`.
 */
export function growStroke(
  x0: number,
  y0: number,
  reference: Raster,
  canvas: Raster,
  gradient: Gradient,
  options: GrowOptions,
): Grown {
  const {radius, minLength, maxLength, curvature} = options;
  const color = sample(reference, x0, y0, [0, 0, 0]);
  const points: Point[] = [[x0, y0]];
  let x = x0;
  let y = y0;
  let lastDx = 0;
  let lastDy = 0;

  for (let i = 1; i <= maxLength; i++) {
    const px = x | 0;
    const py = y | 0;
    if (i > minLength) {
      const ref = sample(reference, px, py, scratchA);
      const already = colorDistance(ref, sample(canvas, px, py, scratchB));
      if (already < colorDistance(ref, color)) break;
    }
    const gi = py * gradient.width + px;
    const gx = gradient.gx[gi] as number;
    const gy = gradient.gy[gi] as number;
    const magnitude = Math.hypot(gx, gy);
    if (magnitude < 1e-3) break;

    // Perpendicular to the gradient, on the side that continues the stroke.
    let dx = -gy / magnitude;
    let dy = gx / magnitude;
    if (lastDx * dx + lastDy * dy < 0) {
      dx = -dx;
      dy = -dy;
    }
    dx = curvature * dx + (1 - curvature) * lastDx;
    dy = curvature * dy + (1 - curvature) * lastDy;
    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;

    x += radius * dx;
    y += radius * dy;
    if (x < 0 || y < 0 || x >= reference.width || y >= reference.height) break;
    lastDx = dx;
    lastDy = dy;
    points.push([x, y]);
  }
  return {color, points};
}
