// From a score to the clock. compile() walks every gesture of every step and
// turns it into what the GPU does (touches, loads, deposits, drying) at the
// moment the hand would do it, plus a track of where the tool is and how high
// it is held, so the page can draw it moving between strokes.
//
// Times are seconds of playback at normal speed. Positions in events are in
// texels with y up, the engine's frame; positions in poses stay in inches
// from the top left, the score's frame, for drawing.
import {linearToHex, type Mix, masstoneOf} from './engine/pigments.ts';
import type {Deposit, Touch} from './engine/surface.ts';
import type {Gesture, Point, Score, StrokePoint} from './score/types.ts';
import {type ToolName, type ToolSpec, tools} from './tools.ts';

export type Event =
  | {kind: 'touch'; tool: ToolName; touch: Touch}
  | {kind: 'load'; tool: ToolName; mix: Mix; amount: number; keep: number; seed: number}
  | {kind: 'clean'; tool: ToolName}
  | {kind: 'deposit'; deposit: Deposit}
  | {kind: 'dry'; x: number; y: number; radius: number; amount: number};

export type TimedEvent = Event & {time: number; step: number};

/** Where the tool is at a moment, for drawing it. */
export type Pose = {
  time: number;
  tool: ToolName;
  /** Inches from the top left. */
  x: number;
  y: number;
  /** Which way the tool faces, in radians: a stroke's heading, a press's turn. */
  angle: number;
  /** 0 on the canvas, 1 held up clear of it. */
  lift: number;
  pressure: number;
  /** For the tube: the color of the paint being squeezed, as hex. */
  paint?: string;
};

export type Timeline = {
  /** Seconds the whole painting takes at normal speed. */
  duration: number;
  /** When each step starts and ends. */
  steps: {start: number; end: number}[];
  /** In time order. */
  events: TimedEvent[];
  /** In time order. */
  poses: Pose[];
  /** The canvas, in texels. */
  width: number;
  height: number;
  texelsPerInch: number;
};

/** Seconds to take a tool off the canvas and bring the next one on. */
const CHANGE_TOOLS = 0.8;
/** How fast a hand carries a tool between strokes, inches per second. */
const CARRY_SPEED = 32;
/** Seconds to lift a tool clear, and to set it down. */
const LIFT = 0.07;
/** Seconds a tool spends being loaded or wiped. */
const LOAD = 0.3;
/** Seconds the hand rests at the end of a step. */
const BETWEEN_STEPS = 0.25;
/** Where tools wait off the canvas: past its bottom right corner. */
const PARKED = {x: 2.5, y: 2};

/** A 32-bit hash of a few integers, for seeds that do not depend on playback. */
function seedOf(...parts: number[]): number {
  let h = 2166136261;
  for (const part of parts) {
    h ^= part >>> 0;
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
  }
  return (h >>> 0) % 16_777_216;
}

export function compile(score: Score, texelsPerInch: number): Timeline {
  const width = Math.round(score.width * texelsPerInch);
  const height = Math.round(score.height * texelsPerInch);
  const events: TimedEvent[] = [];
  const poses: Pose[] = [];
  const steps: Timeline['steps'] = [];
  const parked = {x: score.width + PARKED.x, y: score.height + PARKED.y};

  let time = 0;
  let stepIndex = 0;
  let pose: Pose = {time: 0, tool: 'tube', ...parked, angle: 0, lift: 1, pressure: 0};

  const texel = (p: Point) => ({x: p.x * texelsPerInch, y: (score.height - p.y) * texelsPerInch});
  const emit = (event: Event, at = time) => events.push({...event, time: at, step: stepIndex});
  const key = (next: Partial<Pose>) => {
    pose = {...pose, ...next, time};
    poses.push(pose);
  };

  /** Lift, carry the tool to `to`, and hold it there in the air. */
  const carry = (to: Point, pace: number) => {
    if (pose.lift < 1) {
      time += LIFT / pace;
      key({lift: 1, pressure: 0});
    }
    const distance = Math.hypot(to.x - pose.x, to.y - pose.y);
    if (distance > 1e-3) {
      time += Math.min(0.6, 0.05 + distance / CARRY_SPEED) / pace;
      key({x: to.x, y: to.y});
    }
  };

  /** Set the tool down at the current spot. */
  const lower = (pace: number, pressure: number) => {
    time += LIFT / pace;
    key({lift: 0, pressure});
  };

  for (const [index, step] of score.steps.entries()) {
    stepIndex = index;
    const start = time;
    const spec = tools[step.tool];
    const pace = step.pace ?? 1;

    // The last tool goes back to the table and this one comes on.
    if (pose.tool !== step.tool) {
      time += CHANGE_TOOLS / 2;
      key({...parked, lift: 1});
      pose = {...pose, tool: step.tool};
      key({});
    }

    for (const [g, gesture] of step.gestures.entries()) {
      const strokeSeed = seedOf(index, g, 1);
      compileGesture(gesture, spec, pace, strokeSeed);
    }
    // Lift off at the end of the step, and pause: the hand rests between
    // steps, which also keeps every event strictly inside its own step.
    if (pose.lift < 1) {
      time += LIFT / pace;
      key({lift: 1, pressure: 0});
    }
    time += BETWEEN_STEPS;
    key({});
    steps.push({start, end: time});
  }
  time += CHANGE_TOOLS / 2;
  key({...parked, lift: 1});

  function compileGesture(gesture: Gesture, spec: ToolSpec, pace: number, strokeSeed: number) {
    switch (gesture.kind) {
      case 'load':
        time += LOAD / pace;
        key({lift: 1});
        emit({
          kind: 'load',
          tool: spec.name,
          mix: gesture.mix,
          amount: gesture.amount,
          keep: gesture.keep ?? 0,
          seed: strokeSeed,
        });
        return;
      case 'clean':
        time += LOAD / pace;
        key({lift: 1});
        emit({kind: 'clean', tool: spec.name});
        return;
      case 'drop': {
        key({paint: linearToHex(masstoneOf(gesture.mix))});
        carry(gesture.at, pace);
        lower(pace, 1);
        const at = texel(gesture.at);
        const size = gesture.size;
        const angle = gesture.angle ?? 0;
        emit({
          kind: 'deposit',
          deposit: {
            shape: 'drop',
            ...at,
            axisX: Math.cos(angle),
            axisY: Math.sin(angle),
            halfAcross: (spec.width / 2) * size * texelsPerInch,
            halfAlong: (spec.depth / 2) * size * texelsPerInch,
            thickness: 22 * Math.sqrt(size),
            mix: gesture.mix,
            seed: strokeSeed,
          },
        });
        time += 0.12 / pace;
        key({});
        return;
      }
      case 'flick': {
        carry(gesture.from, pace);
        time += 0.1 / pace;
        key({pressure: 1});
        for (const speck of gesture.specks) {
          const at = texel(speck);
          const distance = Math.hypot(speck.x - gesture.from.x, speck.y - gesture.from.y);
          emit(
            {
              kind: 'deposit',
              deposit: {
                shape: 'speck',
                ...at,
                axisX: Math.cos(-speck.angle),
                axisY: Math.sin(-speck.angle),
                halfAcross: speck.radius * texelsPerInch,
                halfAlong: speck.radius * 1.1 * texelsPerInch,
                thickness: 4,
                mix: gesture.mix,
                seed: seedOf(strokeSeed, Math.round(speck.x * 1000), Math.round(speck.y * 1000)),
              },
            },
            time + distance / 40 / pace,
          );
        }
        time += 0.2 / pace;
        key({pressure: 0});
        return;
      }
      case 'dry': {
        const [first, ...rest] = gesture.path;
        if (!first) return;
        carry(first, pace);
        key({lift: 1});
        let from = first;
        for (const to of rest) {
          const distance = Math.hypot(to.x - from.x, to.y - from.y);
          const steps = Math.max(1, Math.ceil(distance / (spec.width * spec.spacing)));
          for (let s = 1; s <= steps; s++) {
            const at = {
              x: from.x + ((to.x - from.x) * s) / steps,
              y: from.y + ((to.y - from.y) * s) / steps,
            };
            time += distance / steps / spec.speed / pace;
            key({x: at.x, y: at.y, angle: Math.atan2(to.y - from.y, to.x - from.x)});
            const where = texel(at);
            emit({kind: 'dry', ...where, radius: spec.width * 0.5 * texelsPerInch, amount: 0.22});
          }
          from = to;
        }
        return;
      }
      case 'press': {
        carry(gesture.at, pace);
        lower(pace, gesture.pressure);
        const at = texel(gesture.at);
        const angle = gesture.angle ?? 0;
        const reach =
          (spec.lightDepth + (1 - spec.lightDepth) * gesture.pressure) * (gesture.size ?? 1);
        key({angle});
        emit({
          kind: 'touch',
          tool: spec.name,
          touch: {
            ...at,
            axisX: Math.cos(angle),
            axisY: -Math.sin(angle),
            halfAcross: (spec.width / 2) * reach * texelsPerInch,
            halfAlong: (spec.depth / 2) * reach * texelsPerInch,
            pressure: gesture.pressure,
            skim: gesture.skim ?? 0,
            strokeSeed,
            dabSeed: seedOf(strokeSeed, 7),
            deposit: gesture.deposit,
            pickup: gesture.pickup,
            level: gesture.level,
            scrape: gesture.scrape,
            twist: gesture.twist,
          },
        });
        time += 0.05 / pace;
        key({});
        return;
      }
      case 'stroke':
        compileStroke(gesture, spec, pace, strokeSeed);
        return;
    }
  }

  function compileStroke(
    gesture: Extract<Gesture, {kind: 'stroke'}>,
    spec: ToolSpec,
    pace: number,
    strokeSeed: number,
  ) {
    const points = gesture.points;
    const first = points[0];
    if (!first || points.length < 2) return;
    const kind = spec.body?.kind;
    carry(first, pace);
    lower(pace, first.pressure);

    let touchIndex = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i] as StrokePoint;
      const b = points[i + 1] as StrokePoint;
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      if (length < 1e-4) continue;
      // Heading in the score's frame (y down), and the same direction on the GPU (y up).
      const heading = Math.atan2(b.y - a.y, b.x - a.x);
      const motionX = (b.x - a.x) / length;
      const motionY = -(b.y - a.y) / length;
      const meanPressure = (a.pressure + b.pressure) / 2;
      const depth = spec.depth * (spec.lightDepth + (1 - spec.lightDepth) * meanPressure);
      const spacing = Math.max(0.004, depth * spec.spacing);
      const count = Math.max(1, Math.ceil(length / spacing));
      for (let k = 0; k < count; k++) {
        const t = k / count;
        const at = {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t};
        const pressure = a.pressure + (b.pressure - a.pressure) * t;
        time += length / count / spec.speed / pace;
        key({x: at.x, y: at.y, angle: heading, lift: 0, pressure});
        emit({
          kind: 'touch',
          tool: spec.name,
          touch: strokeTouch(
            spec,
            texel(at),
            motionX,
            motionY,
            pressure,
            gesture,
            strokeSeed,
            touchIndex++,
            kind,
          ),
        });
      }
    }
    const last = points[points.length - 1] as StrokePoint;
    key({x: last.x, y: last.y});
  }

  /** One touch along a stroke: the contact's shape follows the tool, the pressure and the heading. */
  function strokeTouch(
    spec: ToolSpec,
    at: {x: number; y: number},
    motionX: number,
    motionY: number,
    pressure: number,
    gesture: Extract<Gesture, {kind: 'stroke'}>,
    strokeSeed: number,
    index: number,
    kind: string | undefined,
  ): Touch {
    const reach = spec.lightDepth + (1 - spec.lightDepth) * pressure;
    let across = (spec.width / 2) * texelsPerInch;
    let along = (spec.depth / 2) * reach * texelsPerInch;
    // A round brush spreads as it is pressed; a flat one narrows as it lifts onto
    // its tip. A pen's felt nib keeps its width however it is held.
    if (kind === 'round') across *= 0.35 + 0.65 * pressure;
    if (kind === 'flat') across *= 0.7 + 0.3 * pressure;
    // On its edge, a flat brush slides its chisel along the stroke.
    if (gesture.edge) [across, along] = [Math.max(along * 0.6, 1.5), across];
    // Brushes lifting off break up on the canvas's tooth; a blade or a comb does not.
    const lifting =
      kind === 'flat' || kind === 'round'
        ? Math.min(1, Math.max(0, (0.45 - pressure) / 0.35)) * 0.8
        : 0;
    // Across the tool is perpendicular to the way it moves, unless the hand turns it.
    const tilt = gesture.tilt ?? 0;
    const axisX = motionY * Math.cos(tilt) + motionX * Math.sin(tilt);
    const axisY = -motionX * Math.cos(tilt) + motionY * Math.sin(tilt);
    return {
      ...at,
      axisX,
      axisY,
      halfAcross: across,
      halfAlong: along,
      pressure,
      skim: Math.max(gesture.skim ?? 0, lifting),
      strokeSeed,
      dabSeed: seedOf(strokeSeed, index),
      deposit: gesture.deposit,
      pickup: gesture.pickup,
      level: gesture.level,
      scrape: gesture.scrape,
    };
  }

  // Events go in time order; the flicked specks land a moment after the tap.
  events.sort((a, b) => a.time - b.time);
  return {duration: time, steps, events, poses, width, height, texelsPerInch};
}

/** The tool's pose at `time`, between the two keys either side of it. */
export function poseAt(timeline: Timeline, time: number): Pose {
  const {poses} = timeline;
  let low = 0;
  let high = poses.length - 1;
  if (high < 0) throw new Error('a timeline with no poses');
  if (time <= (poses[0] as Pose).time) return poses[0] as Pose;
  if (time >= (poses[high] as Pose).time) return poses[high] as Pose;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if ((poses[middle] as Pose).time <= time) low = middle;
    else high = middle;
  }
  const a = poses[low] as Pose;
  const b = poses[high] as Pose;
  const span = b.time - a.time;
  const t = span > 0 ? (time - a.time) / span : 1;
  // A tool carried through the air eases in and out; along a stroke it moves evenly.
  const eased = a.lift > 0.5 && b.lift > 0.5 ? t * t * (3 - 2 * t) : t;
  const turn = ((((b.angle - a.angle) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
  return {
    time,
    tool: t < 1 ? a.tool : b.tool,
    paint: t < 1 ? a.paint : b.paint,
    x: a.x + (b.x - a.x) * eased,
    y: a.y + (b.y - a.y) * eased,
    angle: a.angle + turn * eased,
    lift: a.lift + (b.lift - a.lift) * t,
    pressure: a.pressure + (b.pressure - a.pressure) * t,
  };
}

/** The index of the first event at or after `time`. */
export function eventIndexAt(timeline: Timeline, time: number): number {
  const {events} = timeline;
  let low = 0;
  let high = events.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((events[middle] as TimedEvent).time < time) low = middle + 1;
    else high = middle;
  }
  return low;
}

/** Which step is playing at `time`. */
export function stepAt(timeline: Timeline, time: number): number {
  const index = timeline.steps.findIndex((step) => time < step.end);
  return index === -1 ? timeline.steps.length - 1 : index;
}
