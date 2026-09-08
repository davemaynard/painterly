// The play loop. Owns the painter, the schedule and the copies of the canvas,
// and answers the only two things the page asks of it: put this moment on the
// canvas, and say when the moment changed.
//
// Every stroke goes down with alpha over the ones before it, so the only way
// to reach a moment of the painting is to have painted everything up to it.
// The moments worth returning to are few: the start of each brush, and the
// end. A copy of the canvas is kept at each, taken as the painting passes it
// or, ahead of that, by a second painter working through the same picture off
// screen in the frames' spare time. Jumping to a stage is then a restore.
//
// Nothing here paints for longer than a frame can spare. The player holds a
// position, the moment it is at, and the canvas trails it: playing, the two are
// never more than a frame apart; after a jump the canvas catches up over a few
// frames at a fixed cost each, instead of the page freezing until it is there.
import {type Brush, createPainter, createSchedule, type Painter, type Schedule} from '../paint';
import type {Plan} from '../types';
import {copyMarks, seekFrom} from './jumps';

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

type Copy = {count: number; image: ImageBitmap};

/** The copies held, each arriving a little after it was asked for. */
function createCopies() {
  let held: Copy[] = [];
  /** Counts with a copy held or on its way, so no moment is copied twice. */
  const taken = new Set<number>();
  let generation = 0;
  return {
    keep(count: number, image: Promise<ImageBitmap>) {
      if (taken.has(count)) return;
      taken.add(count);
      const wanted = generation;
      void image.then((resolved) => {
        if (wanted === generation) held.push({count, image: resolved});
        else resolved.close();
      });
    },
    /** The nearest copy at or before `count`, if one has arrived. */
    nearest(count: number): Copy | undefined {
      let best: Copy | undefined;
      for (const copy of held) {
        if (copy.count <= count && (!best || copy.count > best.count)) best = copy;
      }
      return best;
    },
    clear() {
      for (const {image} of held) image.close();
      held = [];
      taken.clear();
      generation++;
    },
  };
}

/**
 * A painter, the canvas it paints, and what its strokes have been costing.
 *
 * The cost cannot be read off a single call: a canvas records strokes and
 * rasterises them later, in one lump, when it sees fit. So each frame paints
 * an allowance, makes the canvas rasterise it, times the whole, and sets the
 * next allowance from that. A stroke of the first brush costs a hundred times
 * one of the last, and a phone a few times a desktop; the rate follows both.
 */
type Lane = {
  painter: Painter;
  source: HTMLCanvasElement | OffscreenCanvas;
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  /** Strokes per millisecond, as last seen. Starts low and learns. */
  rate: number;
};

/** A one-pixel readback: the cheapest way to make a canvas rasterise what it holds. */
const settle = (lane: Lane) => lane.context.getImageData(0, 0, 1, 1);

type Warmer = {
  /** Paint for about `budget` milliseconds. True once every mark has a copy. */
  step(budget: number): boolean;
  drop(): void;
};

export function createPlayer(options: PlayerOptions): Player {
  const {canvas, context, painting, duration, onChange} = options;
  const total = painting.strokes.length;
  const schedule: Schedule = createSchedule(painting, duration);
  const marks = copyMarks(painting.layerSizes);
  const copies = createCopies();

  const live: Lane = {
    painter: createPainter(context, painting, options.brush),
    source: canvas,
    context,
    rate: 1,
  };
  let warmer: Warmer | null = createWarmer(options.brush);
  let position = 0;
  let playing = false;
  let startedAt = 0;
  let elapsedAtPause = 0;
  let frame = 0;
  let reported = '';

  const state = (): PlayerState => ({
    position,
    painted: live.painter.painted,
    elapsed: schedule.timeOf(position),
    playing,
    finished: live.painter.painted >= total,
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
   * Paint the lane toward `target` for about `budget` milliseconds, keeping a
   * copy of its canvas at each mark passed on the way. Returns the time spent.
   */
  const advance = (lane: Lane, target: number, budget: number): number => {
    const {painter} = lane;
    if (painter.painted >= target || budget <= 0) return 0;
    const from = painter.painted;
    const started = performance.now();
    const stop = Math.min(target, from + Math.max(1, Math.floor(budget * lane.rate)));
    for (const mark of marks) {
      if (mark <= from || mark > stop) continue;
      painter.paintTo(mark);
      copies.keep(mark, createImageBitmap(lane.source));
    }
    painter.paintTo(stop);
    settle(lane);
    const took = Math.max(0.1, performance.now() - started);
    // Half the old rate, half the new: quick to follow a change of brush,
    // steady against one odd frame.
    lane.rate = lane.rate / 2 + (stop - from) / took / 2;
    return took;
  };

  /**
   * The off-screen painter. Works forward through the painting in the frames'
   * spare time; where the live painter has already left a copy, it picks that
   * up rather than painting the stretch again.
   */
  function createWarmer(brush: Brush): Warmer {
    const scratch = new OffscreenCanvas(canvas.width, canvas.height);
    const scratchContext = scratch.getContext('2d', {alpha: false});
    if (!scratchContext) throw new Error('no 2d context');
    const lane: Lane = {
      painter: createPainter(scratchContext, painting, brush),
      source: scratch,
      context: scratchContext,
      rate: 1,
    };
    return {
      step(budget) {
        const {painter} = lane;
        const copy = copies.nearest(total);
        if (copy && copy.count > painter.painted) painter.resume(copy.image, copy.count);
        advance(lane, total, budget);
        return painter.painted >= total;
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
    if (playing) position = schedule.strokesAt(elapsedAtPause + (now - startedAt));
    const spent = advance(live, position, FRAME_BUDGET_MS);
    const there = live.painter.painted >= position;
    if (playing && there && position >= total) playing = false;
    if (warmer?.step(FRAME_BUDGET_MS - spent)) {
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
    const {painter} = live;
    const copy = copies.nearest(count);
    const from = seekFrom(painter.painted, count, copy?.count);
    if (from !== painter.painted) {
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
      copies.clear();
      warmer?.drop();
      live.painter = createPainter(context, painting, brush);
      live.rate = 1;
      warmer = createWarmer(brush);
      seek(position);
    },

    destroy() {
      playing = false;
      cancelAnimationFrame(frame);
      frame = 0;
      copies.clear();
      warmer?.drop();
      warmer = null;
    },
  };
}
