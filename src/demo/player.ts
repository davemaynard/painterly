// The play loop. Owns the painter, the schedule and the scrubbing cache, and
// answers the only two things the page asks of it: put this moment on the
// canvas, and say when the moment changed.
//
// Nothing here paints for longer than a frame can spare. The player holds a
// position, the moment it is at, and the canvas trails it: playing, the two are
// never more than a frame apart; after a jump the canvas catches up over a few
// frames at a fixed cost each, instead of the page freezing until it is there.
// In the frames' spare time a second painter works through the same picture off
// screen, so that every stretch of it has a copy on hand before the visitor asks
// for one. Without that, the first jump forward on a fresh page paid for every
// stroke in between.
import {type Brush, createPainter, createSchedule, type Painter, type Schedule} from '../paint';
import type {Plan} from '../types';
import {createSnapshots, type Snapshots, seekFrom} from './snapshots';

export type PlayerState = {
  /** The moment the player is at, in strokes. */
  position: number;
  /** Strokes on the canvas. Trails `position` while the canvas catches up. */
  painted: number;
  /** How far into the painting `position` is, in milliseconds. */
  elapsed: number;
  playing: boolean;
  finished: boolean;
};

export type Player = {
  play(): void;
  pause(): void;
  /** Move to `count` strokes. The canvas follows, from the cheapest start there is. */
  seek(count: number): void;
  /** Paint what is on the canvas again with a different brush. */
  useBrush(brush: Brush): void;
  readonly state: PlayerState;
  /** Strokes in the whole painting. */
  readonly total: number;
  /** What the whole painting takes to play, in milliseconds. */
  readonly duration: number;
  /** Stop, and let go of everything held. */
  destroy(): void;
};

export type PlayerOptions = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  painting: Plan;
  brush: Brush;
  /** How long the whole painting should take to play. */
  duration: number;
  /** Called whenever the canvas or the playing state changes. */
  onChange: (state: PlayerState) => void;
};

/** Painting time a frame may spend, leaving the rest of its 16.7 ms to the browser. */
const FRAME_BUDGET_MS = 10;
/** Strokes between looks at the clock: a few milliseconds' worth. */
const CHUNK = 200;

type Warmer = {
  /** Paint until the deadline. True once every mark has a copy. */
  step(deadline: number): boolean;
  drop(): void;
};

export function createPlayer(options: PlayerOptions): Player {
  const {canvas, context, painting, duration, onChange} = options;
  const total = painting.strokes.length;
  const schedule: Schedule = createSchedule(painting, duration);
  const snapshots: Snapshots<ImageBitmap> = createSnapshots({
    strokes: total,
    bytesEach: canvas.width * canvas.height * 4,
    release: (image) => image.close(),
  });
  const lastMark = snapshots.marksBetween(0, total).at(-1) ?? 0;

  let painter: Painter = createPainter(context, painting, options.brush);
  let warmer: Warmer | null = createWarmer(options.brush);
  let position = 0;
  let playing = false;
  let startedAt = 0;
  let elapsedAtPause = 0;
  let frame = 0;
  let reported = '';

  const state = (): PlayerState => ({
    position,
    painted: painter.painted,
    elapsed: schedule.timeOf(position),
    playing,
    finished: painter.painted >= total,
  });

  /** Tell the page, but only when something it shows has changed. */
  const report = () => {
    const now = state();
    const key = `${now.position} ${now.painted} ${now.playing}`;
    if (key === reported) return;
    reported = key;
    onChange(now);
  };

  /**
   * Paint `who` toward `target` until the deadline, keeping a copy of `source`
   * at each mark passed on the way. True when it got there.
   */
  const advance = (
    who: Painter,
    source: HTMLCanvasElement | OffscreenCanvas,
    target: number,
    deadline: number,
  ): boolean => {
    while (who.painted < target) {
      const mark = snapshots.marksBetween(who.painted, target)[0];
      const stop = Math.min(target, mark ?? target, who.painted + CHUNK);
      who.paintTo(stop);
      if (stop === mark) snapshots.keep(mark, createImageBitmap(source));
      if (performance.now() >= deadline) break;
    }
    return who.painted >= target;
  };

  /**
   * The off-screen painter. Works forward through the marks in the frames'
   * spare time; where the live painter has already left a copy, it picks that
   * up rather than painting the stretch again.
   */
  function createWarmer(brush: Brush): Warmer {
    const scratch = new OffscreenCanvas(canvas.width, canvas.height);
    const scratchContext = scratch.getContext('2d', {alpha: false});
    if (!scratchContext) throw new Error('no 2d context');
    const who = createPainter(scratchContext, painting, brush);
    return {
      step(deadline) {
        while (who.painted < lastMark && performance.now() < deadline) {
          const mark = snapshots.marksBetween(who.painted, lastMark)[0] ?? lastMark;
          const copy = snapshots.nearest(mark);
          if (copy && copy.count > who.painted) who.resume(copy.image, copy.count);
          else advance(who, scratch, mark, deadline);
        }
        return who.painted >= lastMark;
      },
      drop() {
        scratch.width = 0;
        scratch.height = 0;
      },
    };
  }

  /** One frame's work: the canvas first, the warmer with whatever is left. */
  const tick = () => {
    frame = 0;
    const now = performance.now();
    const deadline = now + FRAME_BUDGET_MS;
    if (playing) position = schedule.strokesAt(elapsedAtPause + (now - startedAt));
    const there = advance(painter, canvas, position, deadline);
    if (playing && there && position >= total) playing = false;
    if (warmer?.step(deadline)) {
      warmer.drop();
      warmer = null;
    }
    report();
    if (playing || !there || warmer) frame = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const seek = (count: number) => {
    position = count;
    if (playing) {
      elapsedAtPause = schedule.timeOf(count);
      startedAt = performance.now();
    }
    const from = seekFrom(painter.painted, count, snapshots.nearest(count)?.count);
    if (from !== painter.painted) {
      const copy = snapshots.nearest(count);
      if (copy && copy.count === from) painter.resume(copy.image, copy.count);
      else painter.reset();
    }
    report();
    wake();
  };

  const pause = () => {
    if (!playing) return;
    playing = false;
    report();
  };

  const play = () => {
    if (playing) return;
    // Playing on from the end means starting over, which is what Paint again
    // would do without a new plan.
    if (position >= total) seek(0);
    playing = true;
    elapsedAtPause = schedule.timeOf(position);
    startedAt = performance.now();
    report();
    wake();
  };

  return {
    play,
    pause,
    seek,
    total,
    duration,
    get state() {
      return state();
    },

    useBrush(brush) {
      // Every copy was painted with the old brush, so none of them is any use.
      snapshots.clear();
      warmer?.drop();
      painter = createPainter(context, painting, brush);
      warmer = createWarmer(brush);
      seek(position);
    },

    destroy() {
      playing = false;
      cancelAnimationFrame(frame);
      frame = 0;
      snapshots.clear();
      warmer?.drop();
      warmer = null;
    },
  };
}
