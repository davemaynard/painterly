// The pacing, at layer counts plan() will actually produce. radii is caller-set
// with no cap, so the schedule has to stretch past the five-brush default.
import assert from 'node:assert/strict';
import test from 'node:test';
import {createSchedule} from '../dist/index.js';

const planOf = (layerSizes) => ({
  seed: 0,
  width: 0,
  height: 0,
  ground: [0, 0, 0],
  strokes: [],
  layerSizes,
});

test('every layer gets time of its own, however many there are', () => {
  for (const count of [1, 2, 3, 5, 6, 8]) {
    const sizes = Array.from({length: count}, (_, i) => 100 * (i + 1));
    const schedule = createSchedule(planOf(sizes), 45_000);
    let stroke = 0;
    for (let i = 0; i < count; i++) {
      const from = schedule.timeOf(stroke);
      stroke += sizes[i];
      const to = schedule.timeOf(stroke);
      assert.ok(to > from, `with ${count} brushes, brush ${i + 1} spans ${from}–${to} ms`);
    }
    assert.equal(schedule.timeOf(stroke), 45_000, `${count} brushes do not fill the clock`);
  }
});

test('later brushes are given more of the clock than earlier ones', () => {
  const schedule = createSchedule(planOf([100, 100, 100, 100, 100, 100]), 45_000);
  const spans = [];
  for (let i = 0; i < 6; i++) spans.push(schedule.timeOf((i + 1) * 100) - schedule.timeOf(i * 100));
  for (let i = 1; i < spans.length; i++) {
    assert.ok(spans[i] > spans[i - 1], `brush ${i + 1} is quicker than brush ${i}: ${spans}`);
  }
});

test('the five-brush pacing is unchanged', () => {
  // The default the page uses; the shares are tuned, so they are pinned.
  const schedule = createSchedule(planOf([100, 100, 100, 100, 100]), 100_000);
  const spans = [];
  for (let i = 0; i < 5; i++) spans.push(schedule.timeOf((i + 1) * 100) - schedule.timeOf(i * 100));
  assert.deepEqual(
    spans.map((span) => Math.round(span)),
    [8000, 12_000, 18_000, 27_000, 35_000],
  );
});
