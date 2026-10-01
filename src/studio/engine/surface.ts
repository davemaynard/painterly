// The canvas, on the GPU: five textures of paint (see shaders.ts for what
// each holds), the tools that work it, and the passes between them. Every
// change to the painting goes through one of five verbs here:
//
//   prime    a blank, gessoed canvas
//   load     charge a tool with a mix of paints
//   touch    one contact of a tool with the canvas: paint goes both ways
//   deposit  paint that lands without a tool: a squeezed drop, a flicked speck
//   dry      warm air over an area, which fixes whatever paint it dries
//
// and one way to look at it: render, which lights the paint for the screen.
//
// All positions here are in texels with y up, the GPU's way round. The score
// works in inches from the top left; timeline.ts converts.
import {
  copyRect,
  createMultiTarget,
  createProgram,
  createQuad,
  createTarget,
  deleteTarget,
  type Gl,
  type Program,
  type Target,
} from './gl.ts';
import {coefficientsOfMix, hexToLinear, type Linear, type Mix} from './pigments.ts';
import * as shaders from './shaders.ts';

export type ToolKind =
  | 'flat'
  | 'round'
  | 'knife'
  | 'scrubber'
  | 'comb'
  | 'swab'
  | 'bundle'
  | 'cotton'
  | 'pen';

const KIND_CODES: Record<ToolKind, number> = {
  flat: 0,
  round: 1,
  knife: 2,
  scrubber: 3,
  comb: 4,
  swab: 5,
  bundle: 6,
  cotton: 7,
  pen: 8,
};

/** What a tool is, physically, for the passes that use it. */
export type ToolBody = {
  kind: ToolKind;
  /** Fixes the tool's character: which bristles clump, which teeth hold paint. */
  seed: number;
  /** Kind-specific shape numbers; see the footprints in shaders.ts. */
  shape: readonly [number, number, number, number];
  /** For a bundle: each swab tip in the tool's frame, as x, y and radius. */
  swabs?: readonly (readonly [number, number, number])[];
  /** Of the paint on the tool at a point, the share it lays down per touch. */
  deposit: number;
  /** Of the wet paint under it, the share it lifts per touch. */
  pickup: number;
  /** The thickness of paint, in 0.1 mm, past which it lifts nothing more. */
  capacity: number;
  /**
   * For a blade or a loaded brush: the thickness it levels paint to under full
   * pressure, and how hard it scrapes. For a pen: the film its nib lays.
   */
  level?: number;
  scrape?: number;
  /** Of the fresh paint under it, the share it stirs into the paint beneath per touch. */
  churn: number;
  /** How strongly it draws wet paint up into peaks where it touched, lifting away. */
  pull?: number;
  /** For a brush: of the wet paint under its bristles, the share they carry forward with each touch. */
  drag?: number;
  /** How much paint creeps between neighboring bristles per touch, 0..1. */
  share: number;
  /** The tool's own color where it holds no paint, as sRGB hex. */
  bare: string;
  /** Size of the textures holding the paint on the tool: across, along. */
  resolution: readonly [number, number];
};

/** A tool with paint on it, as the GPU holds it. */
export type Tool = {
  readonly body: ToolBody;
  /** Read by passes; the pair written by the next touch is swapped in after. */
  pigment: Target;
  scatter: Target;
  nextPigment: Target;
  nextScatter: Target;
  framebuffer: WebGLFramebuffer;
  nextFramebuffer: WebGLFramebuffer;
};

/** One contact between a tool and the canvas. */
export type Touch = {
  /** Center of the contact, in texels. */
  x: number;
  y: number;
  /** Unit vector across the tool: across a brush's bristles, along a comb's spine. */
  axisX: number;
  axisY: number;
  /** Half the contact's extent across the tool and along it, in texels. */
  halfAcross: number;
  halfAlong: number;
  /** 0 barely touching, 1 leaning on it. */
  pressure: number;
  /** 0 presses into the paint; toward 1 the tool only catches high points. */
  skim: number;
  strokeSeed: number;
  dabSeed: number;
  /** How this stroke handles paint, where it differs from the tool's habit. */
  deposit?: number;
  pickup?: number;
  /** Thickness the tool levels paint to, scraping off what stands above; unset, the tool's own. */
  level?: number;
  scrape?: number;
  /** How far the tool is turned while pressed, in turns. */
  twist?: number;
};

export type Deposit = {
  shape: 'drop' | 'speck';
  x: number;
  y: number;
  axisX: number;
  axisY: number;
  halfAcross: number;
  halfAlong: number;
  /** Peak thickness, in units of 0.1 mm. */
  thickness: number;
  mix: Mix;
  seed: number;
};

/** The canvas's textures, in the order the multi-target passes write them. */
type Layers = {
  pigment: Target;
  scatter: Target;
  topPigment: Target;
  topScatter: Target;
  dry: Target;
};
const WET = ['pigment', 'scatter', 'topPigment', 'topScatter'] as const;
const ALL = [...WET, 'dry'] as const;

export type Snapshot = Layers;

export type Surface = {
  readonly width: number;
  readonly height: number;
  prime(): void;
  createTool(body: ToolBody): Tool;
  /** Charge `tool` with `amount` of `mix` (0.1 mm deep), keeping `keep` of what it had. */
  load(
    tool: Tool,
    mix: Mix,
    amount: number,
    options?: {keep?: number; uneven?: number; seed?: number},
  ): void;
  /** Wipe a tool clean. */
  clean(tool: Tool): void;
  touch(tool: Tool, touch: Touch): void;
  deposit(deposit: Deposit): void;
  /** Dry around a point; `radius` in texels, `amount` how much wetness one pass takes. */
  dry(x: number, y: number, radius: number, amount: number): void;
  /** Draw the painting into the current viewport of the default framebuffer. */
  render(options?: {relief?: number}): void;
  /** The colors along a tool's working edge, `samples` of them, as sRGB bytes with load in alpha. */
  probe(tool: Tool, samples: number): Uint8Array;
  /** Copy the canvas: into `into` when given, reusing its textures, otherwise into new ones. */
  snapshot(into?: Snapshot): Snapshot;
  restore(snapshot: Snapshot): void;
  release(snapshot: Snapshot): void;
  releaseTool(tool: Tool): void;
  destroy(): void;
};

/** Gesso: a bright, very slightly warm white. */
const GESSO = '#eeece6';
/** Threads of cotton duck per inch. */
const THREADS_PER_INCH = 18;
/** Light from the upper left, a little above the canvas, as a window would be. */
const LIGHT: Linear = (() => {
  const v: Linear = [-0.42, 0.5, 0.76];
  const length = Math.hypot(...v);
  return v.map((c) => c / length) as Linear;
})();

type Rect = {x: number; y: number; w: number; h: number};

export function createSurface(
  gl: Gl,
  width: number,
  height: number,
  texelsPerInch: number,
): Surface {
  const draw = createQuad(gl);
  const programs = {
    dab: createProgram(gl, shaders.DAB),
    tool: createProgram(gl, shaders.TOOL),
    load: createProgram(gl, shaders.LOAD),
    deposit: createProgram(gl, shaders.DEPOSIT),
    dryColor: createProgram(gl, shaders.DRY_COLOR),
    dryWet: createProgram(gl, shaders.DRY_WET),
    prime: createProgram(gl, shaders.PRIME),
    display: createProgram(gl, shaders.DISPLAY),
    probe: createProgram(gl, shaders.PROBE),
  };
  const weavePitch = texelsPerInch / THREADS_PER_INCH;

  // The canvas as it is, and a scratch copy each pass writes into before the
  // rectangle it changed is copied back.
  const makeLayers = (): Layers => ({
    pigment: createTarget(gl, width, height),
    scatter: createTarget(gl, width, height),
    topPigment: createTarget(gl, width, height),
    topScatter: createTarget(gl, width, height),
    dry: createTarget(gl, width, height),
  });
  const canvas = makeLayers();
  const scratch = makeLayers();
  const wetScratch = createMultiTarget(
    gl,
    WET.map((name) => scratch[name]),
  );

  let probeTarget: Target | null = null;

  /** A rectangle clamped to the canvas, with a texel of margin. */
  const clip = (x0: number, y0: number, x1: number, y1: number): Rect | null => {
    const left = Math.max(0, Math.floor(x0) - 2);
    const bottom = Math.max(0, Math.floor(y0) - 2);
    const right = Math.min(width, Math.ceil(x1) + 2);
    const top = Math.min(height, Math.ceil(y1) + 2);
    if (right <= left || top <= bottom) return null;
    return {x: left, y: bottom, w: right - left, h: top - bottom};
  };

  /** The rectangle a rotated contact covers. */
  const bounds = (x: number, y: number, ax: number, ay: number, across: number, along: number) => {
    const ex = Math.abs(ax) * across + Math.abs(ay) * along;
    const ey = Math.abs(ay) * across + Math.abs(ax) * along;
    return clip(x - ex, y - ey, x + ex, y + ey);
  };

  const copyBack = (rect: Rect, names: readonly (keyof Layers)[]) => {
    for (const name of names)
      copyRect(gl, scratch[name], canvas[name], rect.x, rect.y, rect.w, rect.h);
  };

  /** Draw a canvas pass into a scratch framebuffer, over just `rect`. */
  const drawOver = (framebuffer: WebGLFramebuffer, rect: Rect) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, width, height);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(rect.x, rect.y, rect.w, rect.h);
    draw();
    gl.disable(gl.SCISSOR_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  const setCanvasTextures = (program: Program) => {
    program.texture('uPigment', 0, canvas.pigment.texture);
    program.texture('uScatter', 1, canvas.scatter.texture);
    program.texture('uTopPigment', 2, canvas.topPigment.texture);
    program.texture('uTopScatter', 3, canvas.topScatter.texture);
    program.texture('uDry', 4, canvas.dry.texture);
  };

  /** Everything the footprint and exchange code in the shaders reads about a tool and a touch. */
  const setTouch = (program: Program, tool: Tool, touch: Touch) => {
    const {body} = tool;
    program.setInt('uKind', KIND_CODES[body.kind]);
    program.set('uToolSeed', body.seed % 16_777_216);
    program.set('uStrokeSeed', touch.strokeSeed % 16_777_216);
    program.set('uDabSeed', touch.dabSeed % 16_777_216);
    program.set('uPressure', touch.pressure);
    program.set('uTwist', touch.twist ?? 0);
    program.set('uShape', body.shape);
    setSwabs(program, body);
    program.set('uCanvas', [width, height]);
    program.set('uCenter', [touch.x, touch.y]);
    program.set('uAxis', [touch.axisX, touch.axisY]);
    program.set('uHalf', [touch.halfAcross, touch.halfAlong]);
    program.set('uDeposit', touch.deposit ?? body.deposit);
    program.set('uPickup', touch.pickup ?? body.pickup);
    program.set('uCapacity', body.capacity);
    program.set('uSkim', touch.skim);
    program.set('uLevel', touch.level ?? body.level ?? -1);
    program.set('uScrape', touch.scrape ?? body.scrape ?? 0);
    program.set('uChurn', body.churn);
    program.set('uPull', body.pull ?? 0);
    program.set('uDrag', body.drag ?? 0);
    program.set('uWeavePitch', weavePitch);
  };

  const setSwabs = (program: Program, body: ToolBody) => {
    const swabs = body.swabs ?? [];
    program.setInt('uSwabCount', swabs.length);
    if (!swabs.length) return;
    const at = gl.getUniformLocation(program.handle, 'uSwabs');
    if (at) gl.uniform3fv(at, new Float32Array(swabs.flat()));
  };

  const prime = () => {
    gl.disable(gl.SCISSOR_TEST);
    for (const name of WET) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, canvas[name].framebuffer);
      gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 0]);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, canvas.dry.framebuffer);
    gl.viewport(0, 0, width, height);
    programs.prime.use();
    programs.prime.set('uGesso', hexToLinear(GESSO));
    programs.prime.set('uWeavePitch', weavePitch);
    draw();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  const createTool = (body: ToolBody): Tool => {
    const [across, along] = body.resolution;
    const make = () => createTarget(gl, across, along);
    const pigment = make();
    const scatter = make();
    const nextPigment = make();
    const nextScatter = make();
    const tool: Tool = {
      body,
      pigment,
      scatter,
      nextPigment,
      nextScatter,
      framebuffer: createMultiTarget(gl, [pigment, scatter]),
      nextFramebuffer: createMultiTarget(gl, [nextPigment, nextScatter]),
    };
    clean(tool);
    return tool;
  };

  /** After a pass has written the tool's next textures, make them the current ones. */
  const swapTool = (tool: Tool) => {
    [tool.pigment, tool.nextPigment] = [tool.nextPigment, tool.pigment];
    [tool.scatter, tool.nextScatter] = [tool.nextScatter, tool.scatter];
    [tool.framebuffer, tool.nextFramebuffer] = [tool.nextFramebuffer, tool.framebuffer];
  };

  const clean = (tool: Tool) => {
    gl.disable(gl.SCISSOR_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, tool.framebuffer);
    gl.viewport(0, 0, tool.pigment.width, tool.pigment.height);
    gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 0]);
    gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 0]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  const load: Surface['load'] = (tool, mix, amount, options = {}) => {
    const {absorption, scattering} = coefficientsOfMix(mix);
    const program = programs.load;
    gl.disable(gl.SCISSOR_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, tool.nextFramebuffer);
    gl.viewport(0, 0, tool.pigment.width, tool.pigment.height);
    program.use();
    program.texture('uToolPigment', 5, tool.pigment.texture);
    program.texture('uToolScatter', 6, tool.scatter.texture);
    program.set('uAbsorption', absorption);
    program.set('uScattering', scattering);
    program.set('uAmount', amount);
    program.set('uKeep', options.keep ?? 0);
    program.set('uUneven', options.uneven ?? 0.6);
    program.set('uLoadSeed', (options.seed ?? 1) % 16_777_216);
    program.setInt('uKind', KIND_CODES[tool.body.kind]);
    program.set('uToolSeed', tool.body.seed % 16_777_216);
    program.set('uStrokeSeed', (options.seed ?? 1) % 16_777_216);
    program.set('uShape', tool.body.shape);
    draw();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    swapTool(tool);
  };

  const touch = (tool: Tool, contact: Touch) => {
    // A brush that drags paint carries it a little past its front edge.
    const rect = bounds(
      contact.x,
      contact.y,
      contact.axisX,
      contact.axisY,
      contact.halfAcross,
      contact.halfAlong * (tool.body.drag ? 1.5 : 1),
    );
    if (!rect) return;

    // The canvas side, into scratch, over just the contact's rectangle.
    const dab = programs.dab;
    dab.use();
    setCanvasTextures(dab);
    dab.texture('uToolPigment', 5, tool.pigment.texture);
    dab.texture('uToolScatter', 6, tool.scatter.texture);
    setTouch(dab, tool, contact);
    drawOver(wetScratch, rect);

    // The tool side, from the canvas as it was before this touch.
    gl.bindFramebuffer(gl.FRAMEBUFFER, tool.nextFramebuffer);
    gl.viewport(0, 0, tool.pigment.width, tool.pigment.height);
    const side = programs.tool;
    side.use();
    setCanvasTextures(side);
    side.texture('uToolPigment', 5, tool.pigment.texture);
    side.texture('uToolScatter', 6, tool.scatter.texture);
    side.set('uShare', tool.body.share);
    setTouch(side, tool, contact);
    draw();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    copyBack(rect, WET);
    swapTool(tool);
  };

  const deposit = (paint: Deposit) => {
    const rect = bounds(
      paint.x,
      paint.y,
      paint.axisX,
      paint.axisY,
      paint.halfAcross,
      paint.halfAlong,
    );
    if (!rect) return;
    const {absorption, scattering} = coefficientsOfMix(paint.mix);
    const program = programs.deposit;
    program.use();
    setCanvasTextures(program);
    program.set('uCenter', [paint.x, paint.y]);
    program.set('uAxis', [paint.axisX, paint.axisY]);
    program.set('uHalf', [paint.halfAcross, paint.halfAlong]);
    program.setInt('uShapeKind', paint.shape === 'drop' ? 0 : 1);
    program.set('uThickness', paint.thickness);
    program.set('uAbsorption', absorption);
    program.set('uScattering', scattering);
    program.set('uSeed', paint.seed % 16_777_216);
    drawOver(wetScratch, rect);
    copyBack(rect, WET);
  };

  const dry = (x: number, y: number, radius: number, amount: number) => {
    const rect = clip(x - radius, y - radius, x + radius, y + radius);
    if (!rect) return;
    // Both passes read the canvas as it was and decide the same way what has
    // set; one writes the new dry color, the other what is left wet.
    const passes = [
      [programs.dryColor, scratch.dry.framebuffer],
      [programs.dryWet, wetScratch],
    ] as const;
    for (const [program, framebuffer] of passes) {
      program.use();
      setCanvasTextures(program);
      program.set('uCenter', [x, y]);
      program.set('uRadius', radius);
      program.set('uAmount', amount);
      drawOver(framebuffer, rect);
    }
    copyBack(rect, ALL);
  };

  const render: Surface['render'] = (options = {}) => {
    const program = programs.display;
    program.use();
    setCanvasTextures(program);
    program.set('uCanvas', [width, height]);
    program.set('uLight', LIGHT);
    program.set('uRelief', options.relief ?? 0.9);
    program.set('uWeavePitch', weavePitch);
    draw();
  };

  const probe = (tool: Tool, samples: number) => {
    if (!probeTarget || probeTarget.width !== samples) {
      if (probeTarget) deleteTarget(gl, probeTarget);
      probeTarget = createTarget(gl, samples, 1, 'rgba8');
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, probeTarget.framebuffer);
    gl.viewport(0, 0, samples, 1);
    gl.disable(gl.SCISSOR_TEST);
    const program = programs.probe;
    program.use();
    program.texture('uToolPigment', 5, tool.pigment.texture);
    program.texture('uToolScatter', 6, tool.scatter.texture);
    program.set('uBare', hexToLinear(tool.body.bare));
    draw();
    const pixels = new Uint8Array(samples * 4);
    gl.readPixels(0, 0, samples, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return pixels;
  };

  const copyAll = (from: Layers, to: Layers) => {
    for (const name of ALL) copyRect(gl, from[name], to[name], 0, 0, width, height);
  };

  return {
    width,
    height,
    prime,
    createTool,
    load,
    clean,
    touch,
    deposit,
    dry,
    render,
    probe,
    snapshot(into) {
      const copy = into ?? makeLayers();
      copyAll(canvas, copy);
      return copy;
    },
    restore(snapshot) {
      copyAll(snapshot, canvas);
    },
    release(snapshot) {
      for (const name of ALL) deleteTarget(gl, snapshot[name]);
    },
    releaseTool(tool) {
      for (const target of [tool.pigment, tool.scatter, tool.nextPigment, tool.nextScatter]) {
        deleteTarget(gl, target);
      }
      gl.deleteFramebuffer(tool.framebuffer);
      gl.deleteFramebuffer(tool.nextFramebuffer);
    },
    destroy() {
      for (const name of ALL) {
        deleteTarget(gl, canvas[name]);
        deleteTarget(gl, scratch[name]);
      }
      if (probeTarget) deleteTarget(gl, probeTarget);
      gl.deleteFramebuffer(wetScratch);
      for (const program of Object.values(programs)) gl.deleteProgram(program.handle);
    },
  };
}
