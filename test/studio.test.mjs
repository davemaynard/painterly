// The studio's pure half, which needs no GPU: how paints mix, the score, and
// the timeline it compiles to. The browser suite covers the page.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  coefficientsOfMix,
  hexToLinear,
  masstoneOf,
  paints,
  reflectance,
} from '../src/studio/engine/pigments.ts';
import {moonlitWood} from '../src/studio/score/moonlit-wood.ts';
import {compile, eventIndexAt, poseAt, stepAt} from '../src/studio/timeline.ts';
import {tools} from '../src/studio/tools.ts';

const BLACK = [0, 0, 0];

test('a thick enough layer of any paint shows its masstone', () => {
  for (const [name, paint] of Object.entries(paints)) {
    const masstone = hexToLinear(paint.masstone);
    const shown = masstoneOf({[name]: 1});
    for (let c = 0; c < 3; c++)
      assert.ok(Math.abs(shown[c] - masstone[c]) < 2e-3, `${name} channel ${c}`);
  }
});

test('white over black hides it more the thicker it is, and never goes past white', () => {
  const white = coefficientsOfMix({titaniumWhite: 1});
  let last = 0;
  for (const thickness of [0.1, 0.25, 0.5, 1, 2, 4, 8]) {
    const [r] = reflectance(white, thickness, BLACK);
    assert.ok(r > last, `brighter at ${thickness}`);
    assert.ok(r <= hexToLinear(paints.titaniumWhite.masstone)[0] + 1e-9);
    last = r;
  }
});

test('blue and yellow make green, not gray', () => {
  const [r, g, b] = masstoneOf({skyBlue: 1, cadmiumYellow: 1});
  assert.ok(g > r * 1.5 && g > b * 3, `got ${[r, g, b].map((v) => v.toFixed(3))}`);
});

test('a little Prussian blue goes a long way into white', () => {
  const [r, , b] = masstoneOf({prussianBlue: 1, titaniumWhite: 9});
  assert.ok(
    b - r > 0.2,
    `a tenth of Prussian still reads blue: ${r.toFixed(3)} vs ${b.toFixed(3)}`,
  );
});

test('the score follows the method step for step', () => {
  const score = moonlitWood();
  assert.deepEqual(
    score.steps.map((step) => step.tool),
    [
      'tube',
      'wideBrush',
      'knife',
      'wideBrush',
      'flatBrush',
      'scrubber',
      'trunkBrush',
      'scrubber',
      'spatter',
      'comb',
      'liner',
      'dryer',
      'cotton',
      'bundle',
      'swab',
      'liner',
      'liner',
      'cotton',
      'swab',
    ],
  );
  for (const step of score.steps) {
    assert.ok(step.gestures.length > 0, `${step.title} does something`);
    assert.ok(tools[step.tool], `${step.title} uses a tool on the table`);
  }
});

test('the same score compiles to the same timeline', () => {
  const a = compile(moonlitWood(), 32);
  const b = compile(moonlitWood(), 32);
  assert.equal(a.duration, b.duration);
  assert.deepEqual(a.events, b.events);
  assert.deepEqual(a.poses, b.poses);
});

test('events run in order, on the canvas, inside the step that makes them', () => {
  const timeline = compile(moonlitWood(), 32);
  const {events, steps, width, height} = timeline;
  for (let i = 1; i < steps.length; i++) assert.equal(steps[i].start, steps[i - 1].end);
  let last = Number.NEGATIVE_INFINITY;
  for (const event of events) {
    assert.ok(event.time >= last, 'in time order');
    last = event.time;
    const {start, end} = steps[event.step];
    assert.ok(
      event.time >= start && event.time <= end,
      `event at ${event.time} sits in step ${event.step}`,
    );
    assert.equal(stepAt(timeline, event.time), event.step);
    const at =
      event.kind === 'touch' ? event.touch : event.kind === 'deposit' ? event.deposit : null;
    if (at) {
      // A tool can hang off the edge, but its middle is on or near the canvas.
      assert.ok(at.x > -width * 0.1 && at.x < width * 1.1, 'x on the canvas');
      assert.ok(at.y > -height * 0.1 && at.y < height * 1.1, 'y on the canvas');
    }
  }
});

test('a step begins with its own tool in hand and nothing of the next one painted', () => {
  const timeline = compile(moonlitWood(), 32);
  const score = moonlitWood();
  timeline.steps.forEach(({start, end}, i) => {
    const first = eventIndexAt(timeline, start);
    assert.equal(
      timeline.events[first]?.step ?? i,
      i,
      `the first event after step ${i} starts belongs to it`,
    );
    assert.equal(poseAt(timeline, (start + end) / 2).tool, score.steps[i].tool);
  });
});
