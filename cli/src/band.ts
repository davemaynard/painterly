// One band painter, run as a child process by bands.ts. Each job is a slice of
// the canvas: its strokes, still in painting order, and its slice of the
// ground. The strokes are painted through a context shifted up by the band's
// top edge, so a plan's coordinates need no translating.
import {createCanvas} from '@napi-rs/canvas';
import {type Context2D, type PackedPlan, paintStroke, unpackPlan} from '../../dist/index.js';
import {brushFor, type Pass, type StyleName} from './styles.ts';

export type BandJob = {
  id: number;
  packed: PackedPlan;
  /** The band's first row on the full canvas, and how many rows it has. */
  top: number;
  rows: number;
  style: StyleName;
  pass: Pass;
  /** The band's slice of the primed canvas, RGBA. */
  ground: Uint8ClampedArray;
};

export type BandResult = {id: number; pixels: Uint8ClampedArray};

process.on('message', ({id, packed, top, rows, style, pass, ground}: BandJob) => {
  const painting = unpackPlan(packed);
  const canvas = createCanvas(painting.width, rows);
  // Skia's context implements the Canvas 2D API the painter draws with; only
  // its type declarations are its own.
  const context = canvas.getContext('2d') as unknown as Context2D;
  const primed = context.createImageData(painting.width, rows);
  primed.data.set(ground);
  context.putImageData(primed, 0, 0);

  context.translate(0, -top);
  for (const stroke of painting.strokes) {
    paintStroke(context, stroke, brushFor(style, pass, stroke.layer));
  }

  // Skia records strokes and rasterizes them only when the pixels are read,
  // so this line is most of the job's time.
  const pixels = context.getImageData(0, 0, painting.width, rows).data;
  const result: BandResult = {id, pixels};
  process.send?.(result);
});
