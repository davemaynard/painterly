// Planning, off the main thread and ahead of time. One worker plans one photo
// at a time. What the visitor asks for goes to the front of the line; while a
// painting plays, the other photos are planned behind it and kept packed on a
// shelf, so choosing one of them later starts at once instead of after a wait.
import {type PackedPlan, type PlanOptions, unpackPlan} from '../plan';
import type {Plan} from '../types';
import type {PlanReply, PlanRequest} from './planner';

export type PlanSource = {width: number; height: number; pixels: Uint8ClampedArray};

export type PlanJob = {
  /** Names the plan: the same key always means the same plan. */
  key: string;
  /** The photo's pixels, fetched only when its turn comes. */
  source: () => PlanSource | Promise<PlanSource>;
  /** The planner's options, once the photo's size is known. */
  options: (width: number, height: number) => PlanOptions;
  /** Called once the plan is on the shelf. */
  ready?: () => void;
};

export type OnLayer = (planned: number, of: number) => void;

export type Planning = {
  /** Whether `key` can be had without waiting. */
  has(key: string): boolean;
  /** The plan for this job: from the shelf if it is there, otherwise planned now, ahead of anything queued. */
  plan(job: PlanJob, onLayer?: OnLayer): Promise<Plan>;
  /** Plan these when nothing else is asked for, and keep the results. */
  preload(jobs: PlanJob[]): void;
  dispose(): void;
};

type Listener = {
  onLayer?: OnLayer;
  resolve: (packed: PackedPlan) => void;
  reject: (error: Error) => void;
};

type Pending = {
  id: number;
  job: PlanJob;
  listeners: Listener[];
  /** The last word from the worker, for anyone who joins while it works. */
  progress?: {planned: number; of: number};
};

/** Packed plans kept. Four photos and one more, at about 15 MB each. */
const KEEP = 5;

export function createPlanning(script = 'planner.js', keep = KEEP): Planning {
  const worker = new Worker(script);
  /** Newest last, so the oldest is first to go. */
  const shelf = new Map<string, PackedPlan>();
  const queue: Pending[] = [];
  let active: Pending | null = null;
  let ids = 0;

  const shelve = (key: string, packed: PackedPlan) => {
    shelf.delete(key);
    shelf.set(key, packed);
    while (shelf.size > keep) shelf.delete(shelf.keys().next().value as string);
  };

  const takeDown = (key: string): PackedPlan | undefined => {
    const packed = shelf.get(key);
    if (packed) shelve(key, packed);
    return packed;
  };

  const pendingFor = (key: string): Pending | undefined =>
    active?.job.key === key ? active : queue.find((pending) => pending.job.key === key);

  const fail = (pending: Pending, error: Error) => {
    if (active === pending) active = null;
    for (const listener of pending.listeners) listener.reject(error);
    next();
  };

  const next = () => {
    if (active || queue.length === 0) return;
    const pending = queue.shift() as Pending;
    active = pending;
    void Promise.resolve()
      .then(pending.job.source)
      .then(({width, height, pixels}) => {
        if (active !== pending) return;
        const request: PlanRequest = {
          id: pending.id,
          width,
          height,
          pixels,
          options: pending.job.options(width, height),
        };
        worker.postMessage(request, [pixels.buffer as ArrayBuffer]);
      })
      .catch((error: Error) => fail(pending, error));
  };

  worker.onmessage = ({data: reply}: MessageEvent<PlanReply>) => {
    if (!active || reply.id !== active.id) return;
    if (reply.type === 'layer') {
      active.progress = {planned: reply.planned, of: reply.of};
      for (const listener of active.listeners) listener.onLayer?.(reply.planned, reply.of);
      return;
    }
    const done = active;
    active = null;
    shelve(done.job.key, reply.packed);
    done.job.ready?.();
    for (const listener of done.listeners) listener.resolve(reply.packed);
    next();
  };

  worker.onerror = (event) => {
    if (active) fail(active, new Error(event.message));
  };

  return {
    has: (key) => shelf.has(key),

    plan(job, onLayer) {
      const shelved = takeDown(job.key);
      if (shelved) return Promise.resolve(unpackPlan(shelved));
      return new Promise<PackedPlan>((resolve, reject) => {
        let pending = pendingFor(job.key);
        if (pending && pending !== active) {
          queue.splice(queue.indexOf(pending), 1);
          queue.unshift(pending);
        }
        if (!pending) {
          pending = {id: ++ids, job, listeners: []};
          queue.unshift(pending);
        }
        pending.listeners.push({onLayer, resolve, reject});
        if (pending.progress) onLayer?.(pending.progress.planned, pending.progress.of);
        next();
      }).then(unpackPlan);
    },

    preload(jobs) {
      for (const job of jobs) {
        if (shelf.has(job.key) || pendingFor(job.key)) continue;
        queue.push({id: ++ids, job, listeners: []});
      }
      next();
    },

    dispose() {
      worker.terminate();
      shelf.clear();
      queue.length = 0;
      active = null;
    },
  };
}
