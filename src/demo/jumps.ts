// Jumping between moments of a painting. Every stroke goes down with alpha
// over the ones before it, so the only way to reach a moment is to have
// painted everything up to it, or to restore a copy taken there. These are the
// two decisions that follow: which moments deserve a copy, and where a jump
// starts painting from. Pure, so they are tested without a browser.

/** The stroke counts worth a copy: where each brush after the first begins, and the end. */
export function copyMarks(layerSizes: number[]): number[] {
  const marks: number[] = [];
  let count = 0;
  for (const size of layerSizes) {
    count += size;
    if (size > 0 && !marks.includes(count)) marks.push(count);
  }
  return marks;
}

/**
 * Where a seek to `target` should start painting from, given the playhead and
 * the nearest copy at or before the target.
 *
 * Two questions that are easy to confuse, and confusing them is a bug: whether
 * the canvas has to be thrown away depends on the direction, but where the
 * cheapest start lies does not. Jumping forward across a copy costs exactly as
 * much as jumping back behind one, because both repaint every stroke between.
 */
export function seekFrom(painted: number, target: number, cached: number | undefined): number {
  const copy = cached ?? 0;
  if (copy > painted) return copy;
  if (target < painted) return copy;
  return painted;
}
