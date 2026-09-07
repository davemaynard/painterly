// The planner's own thread. The page sends a photo's pixels and the options
// for a style; this sends a word back after each brush, then the packed plan,
// with its memory handed over rather than copied. Built to docs/planner.js
// beside the page script, and started from there by planning.ts.
import {rasterFromImageData} from '../image';
import {type PackedPlan, type PlanOptions, packedBuffers, packPlan, plan} from '../plan';

export type PlanRequest = {
  id: number;
  width: number;
  height: number;
  /** RGBA, as an ImageData holds it. */
  pixels: Uint8ClampedArray;
  options: PlanOptions;
};

export type PlanReply =
  | {id: number; type: 'layer'; planned: number; of: number}
  | {id: number; type: 'plan'; packed: PackedPlan};

/** What this file can see of its own thread; the DOM typings are for the page. */
type WorkerScope = {
  onmessage: ((event: MessageEvent<PlanRequest>) => void) | null;
  postMessage(reply: PlanReply, transfer?: Transferable[]): void;
};

const scope = self as unknown as WorkerScope;

scope.onmessage = ({data: {id, width, height, pixels, options}}) => {
  const source = rasterFromImageData({width, height, data: pixels});
  const painting = plan(source, {
    ...options,
    onLayer: (planned, of) => scope.postMessage({id, type: 'layer', planned, of}),
  });
  const packed = packPlan(painting);
  scope.postMessage({id, type: 'plan', packed}, packedBuffers(packed));
};
