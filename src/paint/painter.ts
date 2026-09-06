// The hand. Draws a Plan onto a 2D canvas, stroke by stroke, and can be asked
// for any moment of the painting: `paintTo(k)` leaves exactly the first k
// strokes on the canvas. Each stroke's jitter comes from its own seed, so
// stroke k looks the same whether the painter played forward to it or jumped.
import {jitter} from '../random';
import type {Plan, Point, Stroke} from '../types';
import type {Brush} from './brushes';

export type Painter = {
  /** Bring the canvas to exactly `count` strokes painted. */
  paintTo(count: number): void;
  /** How many strokes are on the canvas now. */
  readonly painted: number;
  /** Prime the canvas with the ground colour and forget every stroke. */
  reset(): void;
  /**
   * Put a snapshot taken at `count` strokes back on the canvas and continue from
   * there. How a scrubber jumps backwards without repainting from zero.
   */
  resume(snapshot: CanvasImageSource, count: number): void;
};

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export function createPainter(context: Context2D, painting: Plan, brush: Brush): Painter {
  let painted = 0;

  const reset = () => {
    context.save();
    context.globalAlpha = 1;
    context.fillStyle = css(painting.ground);
    context.fillRect(0, 0, painting.width, painting.height);
    context.restore();
    painted = 0;
  };

  const paintTo = (count: number) => {
    const target = Math.max(0, Math.min(count, painting.strokes.length));
    if (target < painted) reset();
    for (; painted < target; painted++) {
      paintStroke(context, painting.strokes[painted] as Stroke, brush);
    }
  };

  const resume = (snapshot: CanvasImageSource, count: number) => {
    context.save();
    context.globalAlpha = 1;
    context.drawImage(snapshot, 0, 0);
    context.restore();
    painted = count;
  };

  reset();
  return {
    paintTo,
    reset,
    resume,
    get painted() {
      return painted;
    },
  };
}

export function paintStroke(context: Context2D, stroke: Stroke, brush: Brush): void {
  const random = jitter(stroke.jitter);
  const {radius, points} = stroke;
  const first = points[0];
  if (!first) return;

  // Fan the bristles out perpendicular to the stroke's opening direction.
  const second = points[1] ?? first;
  let nx = -(second[1] - first[1]);
  let ny = second[0] - first[0];
  const norm = Math.hypot(nx, ny) || 1;
  nx /= norm;
  ny /= norm;

  context.save();
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.globalAlpha = brush.alpha;

  for (let b = 0; b < brush.bristles; b++) {
    const fan = brush.bristles === 1 ? 0 : (b / (brush.bristles - 1) - 0.5) * 2;
    const offset = fan * brush.spread * radius + (random() - 0.5) * radius * 0.3;
    const ox = nx * offset;
    const oy = ny * offset;
    const width = radius * lerp(brush.weight[0], brush.weight[1], random());
    const color = drift(stroke.color, brush.drift, random);
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = width;

    if (brush.dots || points.length === 1) {
      for (const [x, y] of points) {
        context.beginPath();
        context.arc(x + ox, y + oy, width / 2, 0, Math.PI * 2);
        context.fill();
      }
      continue;
    }

    // Each bristle covers its own slice of the path, then follows it as a
    // smooth curve: straight to the first midpoint, a quadratic through each
    // point to the next midpoint, straight to the end.
    const path = slice(points, random() * brush.ragged, 1 - random() * brush.ragged);
    const start = path[0] as Point;
    context.beginPath();
    context.moveTo(start[0] + ox, start[1] + oy);
    for (let i = 1; i < path.length - 1; i++) {
      const [cx, cy] = path[i] as Point;
      const [nx2, ny2] = path[i + 1] as Point;
      context.quadraticCurveTo(cx + ox, cy + oy, (cx + nx2) / 2 + ox, (cy + ny2) / 2 + oy);
    }
    const end = path[path.length - 1] as Point;
    context.lineTo(end[0] + ox, end[1] + oy);
    context.stroke();
  }
  context.restore();
}

/** The part of a polyline between fractions `from` and `to` of its point count, at least two points. */
function slice(points: Point[], from: number, to: number): Point[] {
  const first = Math.min(points.length - 2, Math.floor(from * points.length));
  const last = Math.max(first + 1, Math.ceil(to * points.length) - 1);
  return points.slice(first, last + 1);
}

function drift(color: [number, number, number], amount: number, random: () => number): string {
  const r = clamp(color[0] + (random() - 0.5) * 2 * amount);
  const g = clamp(color[1] + (random() - 0.5) * 2 * amount);
  const b = clamp(color[2] + (random() - 0.5) * 2 * amount);
  return `rgb(${r | 0} ${g | 0} ${b | 0})`;
}

function css([r, g, b]: [number, number, number]): string {
  return `rgb(${r} ${g} ${b})`;
}

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
