// The studio page. Builds the score, compiles it onto the clock, sets up the
// GPU canvas and the overlay the tools are drawn on, and wires the controls:
// the list of steps, a DVD player's three buttons, and a speed.
//
// The controls promise only what paint can do. There is no scrubbing
// backwards a frame at a time, because a mark cannot be lifted: going back a
// step means starting again from the last copy of the canvas, and the step
// list says so by being a list of places to start from.
import {createContext} from './engine/gl.ts';
import {linearToHex, masstoneOf, paints} from './engine/pigments.ts';
import {createSurface} from './engine/surface.ts';
import {createPerformer} from './performer.ts';
import {createPlayer, type PlayerState} from './player.ts';
import {moonlitWood} from './score/moonlit-wood.ts';
import {createSprites, type Load, type View} from './sprites.ts';
import {compile, type Pose} from './timeline.ts';
import {tools} from './tools.ts';

/** The 55rem the stylesheet unfolds the bench at, so the two agree on which screens are phones. */
const NARROW_PX = 880;
const hash = new URLSearchParams(location.hash.slice(1));
/**
 * Simulation detail, texels per inch of canvas. A phone gets a lighter
 * canvas; `#detail=` overrides it, for the tests on a software GPU.
 */
const PHONE = window.innerWidth < NARROW_PX;
const DETAIL = Number(hash.get('detail')) || (PHONE ? 60 : 128);
const SPEEDS = [1, 2, 4, 8];
/** How often, in frames, to ask the GPU what paint is on the tool in hand. */
const PROBE_EVERY = 6;

const $ = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`missing ${selector}`);
  return element;
};

const frame = $<HTMLElement>('.frame');
const canvas = $<HTMLCanvasElement>('#painting');
const overlay = $<HTMLCanvasElement>('#tools');
const stepList = $<HTMLOListElement>('#steps');
const stages = $<HTMLElement>('#stages');
const status = $<HTMLElement>('#status');
const caption = $<HTMLElement>('#caption');
const playButton = $<HTMLButtonElement>('#play');
const backButton = $<HTMLButtonElement>('#back');
const aheadButton = $<HTMLButtonElement>('#ahead');
const speedSelect = $<HTMLSelectElement>('#speed');
const downloadButton = $<HTMLButtonElement>('#download');

const score = moonlitWood();
const timeline = compile(score, DETAIL);

let gl: WebGL2RenderingContext;
try {
  gl = createContext(canvas);
} catch (error) {
  status.textContent = error instanceof Error ? error.message : String(error);
  throw error;
}
// A browser can take the GPU back (a driver reset, a phone short of memory),
// and the paint lives there. Say so rather than show a frozen picture.
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  player.pause();
  status.textContent = 'The browser took back the GPU this painting lives on. Reload to start again.';
});

const surface = createSurface(gl, timeline.width, timeline.height, DETAIL);
const performer = createPerformer(surface);
const sprites = createSprites(overlay);

// ─── Layout ─────────────────────────────────────────────────────────────────

/** Where the painting sits on the overlay, refreshed on every resize. */
let view: View = {scale: 1, left: 0, top: 0};

function layout() {
  const box = frame.getBoundingClientRect();
  const style = getComputedStyle(frame);
  const padX = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
  const padY = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
  const room = {width: Math.max(1, box.width - padX), height: Math.max(1, box.height - padY)};
  const scale = Math.min(room.width / score.width, room.height / score.height);
  const width = Math.round(score.width * scale);
  const height = Math.round(score.height * scale);
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  // Never draw the screen larger than the simulation underneath it.
  canvas.width = Math.min(timeline.width, Math.round(width * ratio));
  canvas.height = Math.min(timeline.height, Math.round(height * ratio));
  overlay.width = Math.round(box.width * ratio);
  overlay.height = Math.round(box.height * ratio);
  const placed = canvas.getBoundingClientRect();
  view = {scale, left: placed.left - box.left, top: placed.top - box.top};
}

// ─── Drawing ────────────────────────────────────────────────────────────────

let frames = 0;
let load: Load | undefined;
let loadTool: string | undefined;

/** The paint on the tool in hand, as the sprite shows it, asked of the GPU every few frames. */
function currentLoad(pose: Pose): Load | undefined {
  const held = tools[pose.tool].body ? performer.held(pose.tool) : undefined;
  if (!held) return undefined;
  if (loadTool !== pose.tool || frames % PROBE_EVERY === 0) {
    const pixels = surface.probe(held, 8);
    load = Array.from({length: 8}, (_, i) => {
      const [r, g, b, a] = pixels.subarray(i * 4, i * 4 + 4);
      return `rgba(${r}, ${g}, ${b}, ${((a ?? 0) / 255).toFixed(2)})`;
    });
    loadTool = pose.tool;
  }
  return load;
}

const player = createPlayer({
  timeline,
  surface,
  performer,
  // A phone's GPU memory runs out sooner: one copy of the canvas, not two.
  copies: PHONE ? 1 : 2,
  present() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    surface.render();
  },
  drawTool(pose) {
    frames++;
    if (pose.x > score.width + 1.5 || pose.y > score.height + 1.5) {
      sprites.clear();
      return;
    }
    sprites.draw(pose, view, currentLoad(pose), performance.now() / 1000);
  },
  onChange: render,
});

// ─── The step list and the stages ───────────────────────────────────────────

const swatch = (name: keyof typeof paints) =>
  `<span class="chip" style="--paint: ${linearToHex(masstoneOf({[name]: 1}))}" title="${paints[name].name}"></span>`;

stepList.innerHTML = score.steps
  .map(
    (step, i) => `
    <li>
      <button type="button" data-step="${i}">
        <span class="number">${String(i + 1).padStart(2, '0')}</span>
        <span class="what">
          <span class="title">${step.title}</span>
          <span class="tool">${tools[step.tool].label}</span>
        </span>
        <span class="paints" aria-hidden="true">${step.paints.map(swatch).join('')}</span>
      </button>
    </li>`,
  )
  .join('');

// The stages: one mark per step, as wide as the time it takes, inked as it plays.
stages.innerHTML = timeline.steps
  .map(
    ({start, end}) =>
      `<span class="stage" data-planned style="--share: ${(end - start).toFixed(2)}"></span>`,
  )
  .join('');

const stepButtons = [...stepList.querySelectorAll<HTMLButtonElement>('button')];
const stageMarks = [...stages.querySelectorAll<HTMLElement>('.stage')];

let shownStep = -1;
const rail = $<HTMLElement>('.rail');

/**
 * Scroll the rail, and only the rail, so the step playing is in view. Where
 * the rail is not a scrolling column (a phone, with the list under the
 * picture), leave the page where the reader put it.
 */
function keepInView(button: HTMLElement | undefined) {
  if (!button || rail.scrollHeight <= rail.clientHeight) return;
  const box = button.getBoundingClientRect();
  const view = rail.getBoundingClientRect();
  if (box.top < view.top + 24) rail.scrollBy({top: box.top - view.top - 24});
  else if (box.bottom > view.bottom - 24) rail.scrollBy({top: box.bottom - view.bottom + 24});
}

function render(state: PlayerState) {
  const step = score.steps[state.step];
  if (!step) return;
  if (state.step !== shownStep) {
    shownStep = state.step;
    stepButtons.forEach((button, i) => {
      if (i === state.step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      button.toggleAttribute('data-done', i < state.step);
    });
    caption.textContent = step.note;
    keepInView(stepButtons[state.step]);
  }
  const words =
    state.seeking !== null
      ? `Painting up to step ${state.step + 1}…`
      : state.finished
        ? 'Finished'
        : `Step ${state.step + 1} of ${score.steps.length} · ${tools[step.tool].label}`;
  // Only when the words change, so a screen reader hears each step once.
  if (status.textContent !== words) status.textContent = words;
  timeline.steps.forEach(({start, end}, i) => {
    const filled = Math.min(1, Math.max(0, (state.time - start) / (end - start)));
    stageMarks[i]?.style.setProperty('--fill', filled.toFixed(3));
  });
  stages.dataset.time = state.time.toFixed(2);
  playButton.toggleAttribute('data-playing', state.playing);
  playButton.setAttribute('aria-label', state.playing ? 'Pause' : 'Play');
  backButton.disabled = state.step === 0 && state.time - (timeline.steps[0]?.start ?? 0) < 1;
  aheadButton.disabled = state.finished;
  downloadButton.hidden = !state.finished;
}

// ─── Controls ───────────────────────────────────────────────────────────────

/** How far into a step the back button still restarts it, rather than going back one. */
const RESTART_SECONDS = 2;

function back() {
  const {step, time} = player.state;
  const start = timeline.steps[step]?.start ?? 0;
  player.seekStep(time - start > RESTART_SECONDS ? step : step - 1);
}

function ahead() {
  const {step} = player.state;
  if (step + 1 < score.steps.length) player.seekStep(step + 1);
  else void player.renderAt(timeline.duration);
}

function togglePlay() {
  if (player.state.playing) player.pause();
  else player.play();
}

stepList.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('button[data-step]');
  if (!button) return;
  player.seekStep(Number(button.dataset.step));
});
playButton.addEventListener('click', togglePlay);
backButton.addEventListener('click', back);
aheadButton.addEventListener('click', ahead);

speedSelect.innerHTML = SPEEDS.map((speed) => `<option value="${speed}">${speed}×</option>`).join(
  '',
);
speedSelect.value = String(
  SPEEDS.includes(Number(hash.get('speed'))) ? Number(hash.get('speed')) : 2,
);
player.setSpeed(Number(speedSelect.value));
speedSelect.addEventListener('change', () => {
  player.setSpeed(Number(speedSelect.value));
  hash.set('speed', speedSelect.value);
  history.replaceState(null, '', `#${hash}`);
});

window.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLSelectElement || event.metaKey || event.ctrlKey) return;
  if (event.key === ' ' && !(event.target instanceof HTMLButtonElement)) {
    event.preventDefault();
    togglePlay();
  } else if (event.key === 'ArrowLeft') {
    back();
  } else if (event.key === 'ArrowRight') {
    ahead();
  }
});

/** The painting as it stands, drawn at the simulation's full size, as a PNG data URL. */
function fullSizePng(): string {
  const shown = {width: canvas.width, height: canvas.height};
  canvas.width = timeline.width;
  canvas.height = timeline.height;
  gl.viewport(0, 0, canvas.width, canvas.height);
  surface.render();
  const png = canvas.toDataURL('image/png');
  canvas.width = shown.width;
  canvas.height = shown.height;
  player.redraw();
  return png;
}

downloadButton.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'fox-at-the-edge-of-the-wood.png';
  link.href = fullSizePng();
  link.click();
});

new ResizeObserver(() => {
  layout();
  player.redraw();
}).observe(frame);
layout();

// Start where the address says, playing unless the reader prefers stillness.
const startStep = Math.max(0, Math.min(score.steps.length - 1, Number(hash.get('step') ?? 1) - 1));
player.seekStep(startStep);
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) player.play();

// For the recorder and the tests: the clock, and a way to put any moment on the canvas.
Object.assign(window, {
  studio: {
    duration: timeline.duration,
    steps: timeline.steps,
    titles: score.steps.map((step) => step.title),
    renderAt: (time: number) => player.renderAt(time),
    pause: () => player.pause(),
    fullSizePng,
    get state() {
      return player.state;
    },
  },
});
