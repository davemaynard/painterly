// The scrubbing cache. Every stroke goes down with alpha over the ones before
// it, so the only way to reach a moment of the painting is to have painted
// everything up to it. Keeping copies of the canvas is what stops the timeline
// having to repaint the whole picture each time it moves.

/** A copy of the canvas as it stood after `count` strokes. */
export type Snapshot<Image> = {count: number; image: Image};

export type Snapshots<Image> = {
  /**
   * The invariant, and the reason this module exists: a seek repaints at most
   * this many strokes. Everything else here follows from holding it.
   */
  readonly every: number;
  /** How many copies are being held. */
  readonly size: number;
  /** The stroke counts in `(from, to]` that deserve a copy, in order. */
  marksBetween(from: number, to: number): number[];
  /** Keep the canvas as it stands now, which is `count` strokes in. */
  record(count: number): void;
  /** The nearest copy at or before `count`, if one has been taken. */
  nearest(count: number): Snapshot<Image> | undefined;
  /** Let every copy go. */
  clear(): void;
};

export type SnapshotOptions<Image> = {
  /** How many strokes the whole painting has. */
  strokes: number;
  /** What one copy of the canvas costs in memory. */
  bytesEach: number;
  /** Copy the canvas as it is at this moment. */
  capture: () => Promise<Image>;
  /** Release a copy that is no longer wanted. */
  release: (image: Image) => void;
  /** How much memory the copies may take between them. */
  budgetBytes?: number;
  /** Never keep more than this many, however small the canvas is. */
  most?: number;
  /** Never space them closer than this, however long the painting is. */
  least?: number;
};

const BUDGET_BYTES = 64 * 1024 * 1024;
const MOST = 12;
const LEAST = 1000;

/**
 * Copies are spaced on an even grid rather than at the seams of the painting.
 * The seams are tempting, since a plan already knows where one brush hands over
 * to the next, but they are wildly uneven: a five brush painting can put two
 * thirds of its strokes in the last one. Spacing by a structural feature bounds
 * nothing. Spacing by a fixed number of strokes bounds exactly the thing the
 * visitor feels.
 *
 * How many copies fit comes from a memory budget, since each one is a whole
 * canvas. That is the entire trade this module makes: memory against the wait
 * after the timeline moves.
 */
export function createSnapshots<Image>(options: SnapshotOptions<Image>): Snapshots<Image> {
  const {strokes, bytesEach, capture, release} = options;
  const budget = options.budgetBytes ?? BUDGET_BYTES;
  const affordable = Math.floor(budget / Math.max(1, bytesEach));
  const keep = Math.max(4, Math.min(options.most ?? MOST, affordable));
  const every = Math.max(options.least ?? LEAST, Math.ceil(Math.max(1, strokes) / keep));
  let held: Snapshot<Image>[] = [];

  return {
    every,
    get size() {
      return held.length;
    },

    marksBetween(from, to) {
      const marks: number[] = [];
      for (let n = Math.floor(from / every) + 1; n * every <= to; n++) marks.push(n * every);
      return marks;
    },

    record(count) {
      if (held.some((snapshot) => snapshot.count === count)) return;
      // The copy is taken of the canvas as it is at this call, so the painting
      // may carry on before the copy itself arrives.
      void capture().then((image) => held.push({count, image}));
    },

    nearest(count) {
      let best: Snapshot<Image> | undefined;
      for (const snapshot of held) {
        if (snapshot.count <= count && (!best || snapshot.count > best.count)) best = snapshot;
      }
      return best;
    },

    clear() {
      for (const {image} of held) release(image);
      held = [];
    },
  };
}

/**
 * Where a seek to `target` should start painting from, given the playhead and
 * the nearest copy at or before the target.
 *
 * The two questions this answers are easy to confuse, and confusing them is a
 * bug: whether the canvas has to be thrown away depends on the direction, but
 * where the cheapest start lies does not. Jumping forward across a copy costs
 * exactly as much as scrubbing back behind one, because both repaint every
 * stroke in between.
 */
export function seekFrom(painted: number, target: number, cached: number | undefined): number {
  const copy = cached ?? 0;
  if (copy > painted) return copy;
  if (target < painted) return copy;
  return painted;
}
