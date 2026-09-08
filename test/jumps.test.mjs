// The two decisions behind a jump, which need no browser: which moments
// deserve a copy, and where a jump starts painting from.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {copyMarks, seekFrom} from '../src/demo/jumps.ts';

test('a jump starts from the nearest copy when the canvas is past the target or behind a copy', () => {
  // Backwards: the canvas must be thrown away, and the copy is the cheapest start.
  assert.equal(seekFrom(5000, 3000, 2812), 2812);
  assert.equal(seekFrom(5000, 3000, undefined), 0);
  // Forwards across a copy: the copy is nearer than the canvas.
  assert.equal(seekFrom(500, 40000, 32086), 32086);
  // Forwards short of any copy: keep what is painted.
  assert.equal(seekFrom(500, 2000, undefined), 500);
  assert.equal(seekFrom(3000, 5000, 2812), 3000);
});

test('copies are kept where each brush after the first begins, and at the end', () => {
  assert.deepEqual(copyMarks([871, 1941, 6277, 22997, 73997]), [871, 2812, 9089, 32086, 106083]);
  assert.deepEqual(copyMarks([871]), [871]);
  assert.deepEqual(copyMarks([871, 0, 100]), [871, 971]);
});
