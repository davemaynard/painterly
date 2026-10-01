// The hand that carries out a timeline's events on a surface: it keeps one GPU
// tool per tool on the table, all made before the first stroke so that no
// playing frame pays for a tool's textures, and maps each event to the
// surface verb that does it.
import type {Surface, Tool} from './engine/surface.ts';
import type {TimedEvent} from './timeline.ts';
import {type ToolName, tools} from './tools.ts';

export type Performer = {
  apply(event: TimedEvent): void;
  /** The GPU tool for `name`; none for a tool that never touches the canvas. */
  held(name: ToolName): Tool | undefined;
  /** A blank canvas and clean tools. */
  reset(): void;
};

export function createPerformer(surface: Surface): Performer {
  const held = new Map<ToolName, Tool>();
  for (const spec of Object.values(tools)) {
    if (spec.body) held.set(spec.name, surface.createTool(spec.body));
  }

  const tool = (name: ToolName): Tool => {
    const gpu = held.get(name);
    if (!gpu) throw new Error(`${name} does not touch the canvas`);
    return gpu;
  };

  return {
    apply(event) {
      switch (event.kind) {
        case 'touch':
          surface.touch(tool(event.tool), event.touch);
          return;
        case 'load':
          surface.load(tool(event.tool), event.mix, event.amount, {
            keep: event.keep,
            seed: event.seed,
          });
          return;
        case 'clean':
          surface.clean(tool(event.tool));
          return;
        case 'deposit':
          surface.deposit(event.deposit);
          return;
        case 'dry':
          surface.dry(event.x, event.y, event.radius, event.amount);
          return;
      }
    },
    held: (name) => held.get(name),
    reset() {
      surface.prime();
      for (const gpu of held.values()) surface.clean(gpu);
    },
  };
}
