// Painting a whole plan in parallel. Stroke order matters only where strokes
// overlap, so the canvas is cut into horizontal bands and each band is painted
// by its own process, with only the strokes that reach into it, still in
// painting order. Every stroke's jitter comes from its own seed, so the bands
// stitch back into the painting one canvas would have made, up to the few
// levels of antialiasing that Skia's float rounding moves with the origin.
//
// Processes, not worker threads: the canvas module contends with itself across
// threads in one process, and four threads paint barely faster than one.
import {type ChildProcess, fork} from 'node:child_process';
import {type Brush, type Plan, packPlan, type Stroke} from '../../dist/index.js';
import type {BandJob, BandResult} from './band.ts';
import {brushFor, type Pass, type StyleName} from './styles.ts';

export type BandPool = {
  readonly size: number;
  paint(job: Omit<BandJob, 'id'>): Promise<Uint8ClampedArray>;
  close(): void;
};

/**
 * A fixed set of band painters, each taking the next job as it frees up.
 * Start it before loading the photo and the processes have booted by the
 * time the plan is ready.
 */
export function createBandPool(size: number): BandPool {
  const idle: ChildProcess[] = [];
  const waiting: Array<(worker: ChildProcess) => void> = [];
  const pending = new Map<number, (pixels: Uint8ClampedArray) => void>();
  let nextId = 0;

  const workers = Array.from({length: size}, () => {
    const worker = fork(new URL('./band.ts', import.meta.url), {serialization: 'advanced'});
    worker.on('message', ({id, pixels}: BandResult) => {
      pending.get(id)?.(pixels);
      pending.delete(id);
      const next = waiting.shift();
      if (next) next(worker);
      else idle.push(worker);
    });
    idle.push(worker);
    return worker;
  });

  return {
    size,
    paint(job) {
      return new Promise((resolve) => {
        const id = nextId++;
        pending.set(id, resolve);
        const send = (worker: ChildProcess) => worker.send({...job, id});
        const worker = idle.pop();
        if (worker) send(worker);
        else waiting.push(send);
      });
    },
    close() {
      for (const worker of workers) worker.kill();
    },
  };
}

/**
 * Paint `painting` with the style's brushes for `pass`, one band per process,
 * over `ground` (RGBA, the canvas's size). Resolves to the finished canvas as
 * RGBA.
 */
export async function paintInBands(
  pool: BandPool,
  painting: Plan,
  {style, pass, ground}: {style: StyleName; pass: Pass; ground: Uint8ClampedArray},
): Promise<Uint8ClampedArray> {
  const {width, height} = painting;
  const rows = Math.ceil(height / pool.size);
  const bands: Array<{top: number; rows: number; strokes: Stroke[]}> = [];
  for (let top = 0; top < height; top += rows) {
    bands.push({top, rows: Math.min(rows, height - top), strokes: []});
  }
  for (const stroke of painting.strokes) {
    const margin = reach(brushFor(style, pass, stroke.layer), stroke.radius);
    let low = Number.POSITIVE_INFINITY;
    let high = Number.NEGATIVE_INFINITY;
    for (const [, y] of stroke.points) {
      if (y < low) low = y;
      if (y > high) high = y;
    }
    for (const band of bands) {
      if (high + margin >= band.top && low - margin < band.top + band.rows) {
        band.strokes.push(stroke);
      }
    }
  }

  const canvas = new Uint8ClampedArray(width * height * 4);
  await Promise.all(
    bands.map(async ({top, rows, strokes}) => {
      const start = top * width * 4;
      const pixels = await pool.paint({
        packed: packPlan({...painting, strokes, layerSizes: []}),
        top,
        rows,
        style,
        pass,
        ground: ground.subarray(start, start + rows * width * 4),
      });
      canvas.set(pixels, start);
    }),
  );
  return canvas;
}

/**
 * How far past its path a stroke can reach, in pixels: the bristle fan, half
 * the widest bristle, and the painter's own wobble of up to 0.15 radius.
 */
export function reach(brush: Brush, radius: number): number {
  return radius * (brush.spread + brush.weight[1] / 2 + 0.15) + 2;
}
