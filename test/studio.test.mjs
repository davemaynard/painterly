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
import {passesOver} from '../src/studio/score/gestures.ts';
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

test('each step of the score picks up its own tool, in order', () => {
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
      'cotton',
      'trunkBrush',
      'scrubber',
      'spatter',
      'comb',
      'liner',
      'dryer',
      'bundle',
      'swab',
      'pen',
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

test('a brush passes right over every drop before the scrubber comes, whatever the seed', () => {
  for (const seed of [11, 1, 2, 3, 4, 5, 6, 7]) {
    const score = moonlitWood(seed);
    const [drops, ...after] = score.steps;
    const brushes = after.slice(
      0,
      after.findIndex((step) => step.tool === 'scrubber'),
    );
    for (const drop of drops.gestures) {
      // The knife pats its own drops out.
      if (drop.mix.prussianBlue) continue;
      const radius = (tools.tube.width / 2) * drop.size;
      const parts = [
        drop.at,
        ...Array.from({length: 8}, (_, i) => ({
          x: drop.at.x + Math.cos((i * Math.PI) / 4) * radius,
          y: drop.at.y + Math.sin((i * Math.PI) / 4) * radius,
        })),
      ].filter((p) => p.x >= 0 && p.x <= score.width && p.y >= 0 && p.y <= score.height);
      for (const part of parts) {
        const brushed = brushes.some(({tool, gestures}) =>
          gestures.some(
            (g) =>
              g.kind === 'stroke' &&
              passesOver(g.points, part, tools[tool].width, tools[tool].depth),
          ),
        );
        const where = `${drop.at.x.toFixed(2)}, ${drop.at.y.toFixed(2)}`;
        assert.ok(brushed, `seed ${seed}: the drop at ${where} is brushed all over`);
      }
    }
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
