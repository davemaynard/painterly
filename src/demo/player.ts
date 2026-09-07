// The play loop. Owns the painter, the schedule and the scrubbing cache, and
// answers the only two things the page asks of it: put this moment on the
// canvas, and say when the moment changed.
import {type Brush, createPainter, createSchedule, type Painter, type Schedule} from '../paint';
import type {Plan} from '../types';
import {createSnapshots, type Snapshots, seekFrom} from './snapshots';

export type PlayerState = {
  /** Strokes on the canvas. */
  painted: number;
  /** How far into the painting that is, in milliseconds. */
  elapsed: number;
  playing: boolean;
  finished: boolean;
};

export type Player = {
  play(): void;
  pause(): void;
  /** Bring the canvas to exactly `count` strokes, from the cheapest start there is. */
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

export function createPlayer(options: PlayerOptions): Player {
  const {canvas, context, painting, duration, onChange} = options;
  const total = painting.strokes.length;
  const schedule: Schedule = createSchedule(painting, duration);
  const snapshots: Snapshots<ImageBitmap> = createSnapshots({
    strokes: total,
    bytesEach: canvas.width * canvas.height * 4,
    capture: () => createImageBitmap(canvas),
    release: (image) => image.close(),
  });

  let painter: Painter = createPainter(context, painting, options.brush);
  let playing = false;
  let startedAt = 0;
  let elapsedAtPause = 0;
  let frame = 0;

  const state = (): PlayerState => ({
    painted: painter.painted,
    elapsed: schedule.timeOf(painter.painted),
    playing,
    finished: painter.painted >= total,
  });

  /** Paint forward, stopping at each place worth keeping a copy of. */
  const paintForwardTo = (target: number) => {
    for (const mark of snapshots.marksBetween(painter.painted, target)) {
      painter.paintTo(mark);
      snapshots.record(mark);
    }
    painter.paintTo(target);
  };

  const seek = (count: number) => {
    const from = seekFrom(painter.painted, count, snapshots.nearest(count)?.count);
    if (from !== painter.painted) {
      const copy = snapshots.nearest(count);
      if (copy && copy.count === from) painter.resume(copy.image, copy.count);
      else painter.reset();
    }
    paintForwardTo(count);
    onChange(state());
  };

  const pause = () => {
    if (!playing) return;
    playing = false;
    cancelAnimationFrame(frame);
    onChange(state());
  };

  const tick = (now: number) => {
    if (!playing) return;
    const elapsed = elapsedAtPause + (now - startedAt);
    paintForwardTo(schedule.strokesAt(elapsed));
    if (painter.painted >= total) {
      playing = false;
      onChange(state());
      return;
    }
    onChange(state());
    frame = requestAnimationFrame(tick);
  };

  const play = () => {
    if (playing) return;
    // Playing on from the end means starting over, which is what Paint again
    // would do without a new plan.
    if (painter.painted >= total) seek(0);
    playing = true;
    elapsedAtPause = schedule.timeOf(painter.painted);
    startedAt = performance.now();
    frame = requestAnimationFrame(tick);
    onChange(state());
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
      const at = painter.painted;
      // Every copy was painted with the old brush, so none of them is any use.
      snapshots.clear();
      painter = createPainter(context, painting, brush);
      seek(at);
    },

    destroy() {
      playing = false;
      cancelAnimationFrame(frame);
      snapshots.clear();
    },
  };
}
