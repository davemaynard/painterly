// The play loop. Owns the clock, the surface and the hand that works it, and
// answers what the page asks: play, pause, go to a step, go faster.
//
// Paint cannot be lifted, so the only way to reach a moment is to have painted
// everything before it. Going forward is painting faster; going back means
// starting again from an earlier copy of the canvas. Copies are kept at the
// starts of the steps the painting has passed, two at a time, because each
// is the whole canvas, five half-float textures deep.
//
// No frame paints more than it can afford. The clock asks for the events up
// to now; if the GPU cannot keep up, the clock waits for the paint rather
// than the paint skipping ahead, so the tool on screen and the marks under it
// always agree.
import type {Snapshot, Surface} from './engine/surface.ts';
import type {Performer} from './performer.ts';
import {eventIndexAt, type Pose, poseAt, stepAt, type Timeline} from './timeline.ts';

export type PlayerState = {
  /** Seconds into the painting that the canvas shows. */
  time: number;
  /** The step playing, from 0. */
  step: number;
  playing: boolean;
  speed: number;
  /** Repainting to reach a step: how far, 0..1. Null when not seeking. */
  seeking: number | null;
  finished: boolean;
};

export type Player = {
  play(): void;
  pause(): void;
  /** Go to the start of `step`, painting forward or starting again as needed. */
  seekStep(step: number): void;
  setSpeed(speed: number): void;
  /** Paint up to `time` and draw it, resolving once the canvas shows that moment. For the recorder and the tests. */
  renderAt(time: number): Promise<void>;
  /** Draw again, after the page has resized the canvas. */
  redraw(): void;
  readonly state: PlayerState;
  readonly pose: Pose;
  destroy(): void;
};

export type PlayerOptions = {
  timeline: Timeline;
  surface: Surface;
  performer: Performer;
  /** Draw the painting to the screen. */
  present(): void;
  /** Draw the tool where the pose says it is. */
  drawTool(pose: Pose): void;
  onChange(state: PlayerState): void;
};

/** Copies of the canvas kept for going back. Each is ~25 MB per million texels. */
const COPIES = 2;
/** Touches a frame may start with, before it learns what the GPU can take. */
const FIRST_ALLOWANCE = 240;
/** A frame longer than this, in milliseconds, means the GPU is behind: do less. */
const SLOW_FRAME = 24;

export function createPlayer(options: PlayerOptions): Player {
  const {timeline, surface, performer, present, drawTool, onChange} = options;
  const {events, steps} = timeline;
  const end = timeline.duration;

  /** The canvas holds every event before this index. */
  let applied = 0;
  /** The moment the clock is at; the canvas trails it by at most a frame's work. */
  let time = 0;
  let playing = false;
  let speed = 1;
  let seekTarget: number | null = null;
  let seekFrom = 0;
  let allowance = FIRST_ALLOWANCE;
  let lastFrame = 0;
  let frame = 0;
  let dirty = true;
  let reported = '';
  const copies = new Map<number, Snapshot>();
  const waiting: {time: number; done: () => void}[] = [];

  performer.reset();

  const shownTime = () =>
    applied < events.length ? Math.min(time, (events[applied]?.time ?? end) - 1e-6) : time;

  const state = (): PlayerState => ({
    time: shownTime(),
    step: stepAt(timeline, shownTime()),
    playing,
    speed,
    seeking:
      seekTarget === null
        ? null
        : Math.min(1, (shownTime() - seekFrom) / Math.max(1e-6, seekTarget - seekFrom)),
    finished: applied >= events.length && time >= end - 0.5,
  });

  const report = () => {
    const now = state();
    const key = `${now.step} ${now.playing} ${now.speed} ${now.seeking?.toFixed(2)} ${now.finished} ${Math.floor(now.time)}`;
    if (key === reported) return;
    reported = key;
    onChange(now);
  };

  /** Keep a copy at the start of each step passed, holding only the newest few. */
  const keepCopy = (step: number) => {
    if (step === 0 || copies.has(step)) return;
    copies.set(step, surface.snapshot());
    const kept = [...copies.keys()].sort((a, b) => a - b);
    while (kept.length > COPIES) {
      const oldest = kept.shift() as number;
      surface.release(copies.get(oldest) as Snapshot);
      copies.delete(oldest);
    }
  };

  /** Apply events up to `until`, at most `budget` of them. True when it got there. */
  const paintUntil = (until: number, budget: number): boolean => {
    let done = 0;
    while (applied < events.length) {
      const event = events[applied];
      if (!event || event.time > until) return true;
      if (done >= budget) return false;
      // Crossing into a new step: keep a copy of the canvas as the step found it.
      const previous = events[applied - 1];
      if (previous && previous.step !== event.step) keepCopy(event.step);
      performer.apply(event);
      applied++;
      done++;
    }
    return true;
  };

  const tick = (now: number) => {
    frame = 0;
    const interval = lastFrame ? now - lastFrame : 16;
    lastFrame = now;
    // Learn what a frame can carry: back off quickly when frames run long.
    if (interval > SLOW_FRAME) allowance = Math.max(16, allowance * 0.8);
    else allowance = Math.min(6000, allowance * 1.08 + 4);

    if (seekTarget !== null) {
      const there = paintUntil(seekTarget, Math.round(allowance * 4));
      time = there ? seekTarget : (events[applied]?.time ?? seekTarget);
      if (there) seekTarget = null;
      dirty = true;
    } else if (playing) {
      const wanted = Math.min(end, time + (Math.min(interval, 50) / 1000) * speed);
      const there = paintUntil(wanted, Math.round(allowance));
      // Behind: the clock waits where the paint is.
      time = there ? wanted : Math.max(time, (events[applied]?.time ?? wanted) - 1e-6);
      if (time >= end && applied >= events.length) playing = false;
      dirty = true;
    }

    if (dirty) {
      present();
      drawTool(poseAt(timeline, shownTime()));
      dirty = false;
    }
    for (let i = waiting.length - 1; i >= 0; i--) {
      const wait = waiting[i];
      if (
        wait &&
        seekTarget === null &&
        applied >= eventIndexAt(timeline, wait.time) &&
        time >= wait.time - 1e-6
      ) {
        waiting.splice(i, 1);
        wait.done();
      }
    }
    report();
    if (playing || seekTarget !== null || waiting.length) frame = requestAnimationFrame(tick);
    else lastFrame = 0;
  };

  const wake = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  /** Rewind to the latest copy at or before `step`, or to a blank canvas. */
  const rewindTo = (step: number) => {
    const usable = [...copies.keys()].filter((k) => k <= step).sort((a, b) => b - a)[0];
    const startStep = usable ?? 0;
    if (usable !== undefined) surface.restore(copies.get(usable) as Snapshot);
    else performer.reset();
    const startTime = (steps[startStep] as {start: number}).start;
    applied = eventIndexAt(timeline, startTime);
    time = startTime;
  };

  const seekTo = (target: number) => {
    const targetIndex = eventIndexAt(timeline, target);
    if (targetIndex < applied) rewindTo(stepAt(timeline, target));
    seekFrom = shownTime();
    seekTarget = target;
    dirty = true;
    wake();
  };

  return {
    play() {
      if (playing) return;
      if (applied >= events.length && time >= end) seekTo(0);
      playing = true;
      report();
      wake();
    },
    pause() {
      if (!playing) return;
      playing = false;
      report();
    },
    seekStep(step) {
      const clamped = Math.max(0, Math.min(steps.length - 1, step));
      seekTo((steps[clamped] as {start: number}).start);
    },
    setSpeed(next) {
      speed = next;
      report();
    },
    renderAt(target) {
      seekTo(Math.max(0, Math.min(end, target)));
      return new Promise((done) => {
        waiting.push({time: Math.max(0, Math.min(end, target)), done});
        wake();
      });
    },
    redraw() {
      dirty = true;
      wake();
    },
    get state() {
      return state();
    },
    get pose() {
      return poseAt(timeline, shownTime());
    },
    destroy() {
      playing = false;
      cancelAnimationFrame(frame);
      frame = 0;
      for (const copy of copies.values()) surface.release(copy);
      copies.clear();
    },
  };
}
