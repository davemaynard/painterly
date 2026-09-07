// A plan as flat typed arrays. The object form is what the planner and the
// painter speak. This form is what crosses a worker boundary in one transfer
// instead of a copy, and what a plan is kept as when it is planned ahead of
// being wanted: a 106,000-stroke plan is about 110 MB of objects and takes
// 190 ms to clone, against 15 MB packed and nothing to transfer.
//
// Doubles throughout, so unpacking gives back exactly what was packed.
import type {Plan, Point, Rgb, Stroke} from '../types';

export type PackedPlan = {
  seed: number;
  width: number;
  height: number;
  ground: Rgb;
  layerSizes: number[];
  /** One entry per stroke. */
  layers: Uint8Array;
  radii: Float64Array;
  /** Three entries per stroke. */
  colors: Float64Array;
  jitters: Uint32Array;
  /** Where each stroke's points begin in `points`, with one more for the end. */
  starts: Uint32Array;
  /** x then y for every point of every stroke, in stroke order. */
  points: Float64Array;
};

export function packPlan(plan: Plan): PackedPlan {
  const count = plan.strokes.length;
  let pointCount = 0;
  for (const stroke of plan.strokes) pointCount += stroke.points.length;
  const layers = new Uint8Array(count);
  const radii = new Float64Array(count);
  const colors = new Float64Array(count * 3);
  const jitters = new Uint32Array(count);
  const starts = new Uint32Array(count + 1);
  const points = new Float64Array(pointCount * 2);
  let at = 0;
  plan.strokes.forEach((stroke, i) => {
    layers[i] = stroke.layer;
    radii[i] = stroke.radius;
    colors.set(stroke.color, i * 3);
    jitters[i] = stroke.jitter;
    starts[i] = at;
    for (const [x, y] of stroke.points) {
      points[at * 2] = x;
      points[at * 2 + 1] = y;
      at++;
    }
  });
  starts[count] = at;
  return {
    seed: plan.seed,
    width: plan.width,
    height: plan.height,
    ground: [...plan.ground] as Rgb,
    layerSizes: [...plan.layerSizes],
    layers,
    radii,
    colors,
    jitters,
    starts,
    points,
  };
}

export function unpackPlan(packed: PackedPlan): Plan {
  const {layers, radii, colors, jitters, starts, points} = packed;
  const strokes: Stroke[] = new Array(layers.length);
  for (let i = 0; i < layers.length; i++) {
    const from = starts[i] as number;
    const to = starts[i + 1] as number;
    const path: Point[] = new Array(to - from);
    for (let p = from; p < to; p++) {
      path[p - from] = [points[p * 2] as number, points[p * 2 + 1] as number];
    }
    strokes[i] = {
      layer: layers[i] as number,
      radius: radii[i] as number,
      color: [colors[i * 3] as number, colors[i * 3 + 1] as number, colors[i * 3 + 2] as number],
      points: path,
      jitter: jitters[i] as number,
    };
  }
  return {
    seed: packed.seed,
    width: packed.width,
    height: packed.height,
    ground: [...packed.ground] as Rgb,
    strokes,
    layerSizes: [...packed.layerSizes],
  };
}

/** The memory a packed plan owns, to hand over with `postMessage` rather than copy. */
export function packedBuffers(packed: PackedPlan): ArrayBuffer[] {
  const {layers, radii, colors, jitters, starts, points} = packed;
  return [layers, radii, colors, jitters, starts, points].map(
    (array) => array.buffer as ArrayBuffer,
  );
}
