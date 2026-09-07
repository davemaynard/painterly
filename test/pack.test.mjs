// A plan survives being packed and unpacked exactly, since a plan that came
// back from the worker must paint the same picture as one planned in place.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {packedBuffers, packPlan, unpackPlan} from '../src/plan/pack.ts';

/** Strokes with the awkward values a real plan has: fractional colours and coordinates. */
function synthetic(count) {
  const strokes = [];
  for (let i = 0; i < count; i++) {
    const points = [];
    for (let p = 0; p < 2 + (i % 7); p++) points.push([i * 1.37 + p / 3, 933 - i * 0.61 - p]);
    strokes.push({
      layer: i % 5,
      radius: 35 / 2 ** (i % 5),
      color: [12.25 + i, 200.5, 0.125 * i],
      points,
      jitter: (i * 2654435761) >>> 0,
    });
  }
  return {
    seed: 7,
    width: 1400,
    height: 933,
    ground: [200.5, 190, 180],
    strokes,
    layerSizes: [3, 3, 3, 3, 3],
  };
}

test('packing then unpacking gives back the same plan', () => {
  const plan = synthetic(15);
  assert.deepEqual(unpackPlan(packPlan(plan)), plan);
});

test('a packed plan owns its memory in a handful of buffers that can be transferred', () => {
  const packed = packPlan(synthetic(15));
  const buffers = packedBuffers(packed);
  assert.equal(buffers.length, 6);
  assert.ok(buffers.every((buffer) => buffer instanceof ArrayBuffer));
  assert.equal(packed.starts.length, 16);
});

test('an empty plan packs and unpacks', () => {
  const plan = {seed: 1, width: 10, height: 10, ground: [0, 0, 0], strokes: [], layerSizes: [0]};
  assert.deepEqual(unpackPlan(packPlan(plan)), plan);
});
