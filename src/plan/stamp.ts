// The planner's own idea of what a stroke covers, so it can measure how far the
// picture still is from the photo before choosing the next layer. A stroke is a
// run of solid discs along its path. The renderer will draw something nicer;
// this only has to be close enough to steer the next brush.
import type {Raster} from '../image/raster';
import type {Point, Rgb} from '../types';

export function stampStroke(canvas: Raster, points: Point[], radius: number, color: Rgb): void {
  const first = points[0];
  if (!first) return;
  if (points.length === 1) {
    stampDisc(canvas, first[0], first[1], radius, color);
    return;
  }
  const step = Math.max(1, radius / 2);
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1] as Point;
    const [bx, by] = points[i] as Point;
    const length = Math.hypot(bx - ax, by - ay);
    const steps = Math.max(1, Math.ceil(length / step));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      stampDisc(canvas, ax + (bx - ax) * t, ay + (by - ay) * t, radius, color);
    }
  }
}

function stampDisc(canvas: Raster, cx: number, cy: number, radius: number, color: Rgb): void {
  const {width, height, data} = canvas;
  const r2 = radius * radius;
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(width - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(height - 1, Math.ceil(cy + radius));
  for (let y = y0; y <= y1; y++) {
    const dy = y + 0.5 - cy;
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx;
      if (dx * dx + dy * dy > r2) continue;
      const i = (y * width + x) * 3;
      data[i] = color[0];
      data[i + 1] = color[1];
      data[i + 2] = color[2];
    }
  }
}
