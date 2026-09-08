// The page. Wires the controls to a player, keeps the choice of photo, seed,
// style and brush in the URL, and turns what the player reports into words.
// The decisions live in plan/, the look in paint/, the pacing in schedule.ts,
// the play loop and the copies in player.ts, and planning runs on its own
// thread through planning.ts.
//
// The controls promise only what the painting can do. Strokes go down over
// one another and cannot be lifted, so there is no going backwards a frame at
// a time. The transport is a DVD player's: back a brush, play or pause, on a
// brush. The stages beside the buttons show where the painting has got to.
import {type BrushName, brushes, createSchedule} from '../paint';
import {defaultRadii, isStyleName, type StyleName, styles} from '../plan';
import type {Plan} from '../types';
import {type Photo, photos} from './photos';
import {createPlanning, type PlanSource} from './planning';
import {createPlayer, type Player, type PlayerState} from './player';

/**
 * How long each style plays, whatever the photo. The underpainting has a few
 * hundred strokes; watching each one land is the point.
 */
const DURATION_MS: Record<StyleName, number> = {painting: 45_000, underpainting: 20_000};
/** The brush each style starts with. The visitor can still change it. */
const DEFAULT_BRUSH: Record<StyleName, BrushName> = {painting: 'bristle', underpainting: 'ribbon'};
/**
 * Longest side the photo is planned at. Phones get a smaller canvas so planning
 * stays under a few seconds. `NARROW_PX` is the 55rem the stylesheet unfolds the
 * bench at, so the two agree on which screens are phones.
 */
const NARROW_PX = 880;
const PLAN_SIDE = window.innerWidth < NARROW_PX ? 900 : 1400;
/** How long into a brush the back button still restarts it rather than going back one. */
const RESTART_MS = 1_500;

const $ = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`missing ${selector}`);
  return element;
};

/** Give up, as an expression, so a value can be required where it is read. */
const orFail = (message: string): never => {
  throw new Error(message);
};

const viewer = $<HTMLElement>('.viewer');
const frame = $<HTMLElement>('.frame');
const canvas = $<HTMLCanvasElement>('#canvas');
const context = canvas.getContext('2d', {alpha: false}) ?? orFail('no 2d context');
const playButton = $<HTMLButtonElement>('#play');
const backButton = $<HTMLButtonElement>('#back');
const aheadButton = $<HTMLButtonElement>('#ahead');
const againButton = $<HTMLButtonElement>('#again');
const downloadButton = $<HTMLButtonElement>('#download');
const brushSelect = $<HTMLSelectElement>('#brush');
const styleSelect = $<HTMLSelectElement>('#style');
const photoList = $<HTMLElement>('#photos');
const ownTile = $<HTMLElement>('#own');
const fileInput = $<HTMLInputElement>('#file');
const status = $<HTMLElement>('#status');
const stageStrip = $<HTMLElement>('#stages');
const caption = $<HTMLElement>('#caption');

type State = {
  photo: Photo | {id: 'own'; file: string; caption: string; credit: null};
  seed: number;
  style: StyleName;
  brush: BrushName;
};

/** One brush's stretch of the painting: its mark on the strip, and where it runs. */
type Stage = {mark: HTMLElement; start: number; from: number; to: number};

let state: State = readHash();
const planning = createPlanning();
/** Each photo's row in the picker, to mark once its plan is on the shelf. */
const rows = new Map<string, HTMLLabelElement>();
let painting: Plan | null = null;
let stages: Stage[] = [];
/** How long the planner took, kept for the line shown when the painting finishes. */
let plannedIn = 0;
let player: Player | null = null;
/** Counts the loads, so a photo swapped mid-load does not paint the old one. */
let loading = 0;

// ---- photo picker -----------------------------------------------------------

for (const photo of photos) {
  const label = document.createElement('label');
  label.className = 'photo';
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = 'photo';
  input.value = photo.id;
  input.checked = photo.id === state.photo.id;
  const thumb = document.createElement('img');
  thumb.className = 'thumb';
  thumb.src = photo.file;
  thumb.alt = '';
  thumb.loading = 'lazy';
  const text = document.createElement('span');
  text.textContent = photo.caption;
  label.append(input, thumb, text);
  ownTile.before(label);
  rows.set(photo.id, label);
  input.addEventListener('change', () => {
    if (!input.checked) return;
    state = {...state, photo, seed: 1};
    start();
  });
}

/** Paint a photo of the visitor's own, however it arrived: picked, or dropped on the picture. */
function useOwnPhoto(file: File): void {
  for (const input of photoList.querySelectorAll<HTMLInputElement>('input[type="radio"]')) {
    input.checked = false;
  }
  // A replaced own photo has nothing left pointing at its blob.
  if (state.photo.id === 'own') URL.revokeObjectURL(state.photo.file);
  state = {
    ...state,
    photo: {id: 'own', file: URL.createObjectURL(file), caption: file.name, credit: null},
    seed: 1,
  };
  start();
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) useOwnPhoto(file);
});

// Dropping a photo on the picture is the shortest way in, so the picture takes one.
viewer.addEventListener('dragover', (event) => {
  if (!event.dataTransfer?.types.includes('Files')) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  viewer.setAttribute('data-dropping', '');
});

// Moving over a child fires dragleave too, so only a leave that lands outside counts.
viewer.addEventListener('dragleave', (event) => {
  if (!viewer.contains(event.relatedTarget as Node | null)) viewer.removeAttribute('data-dropping');
});

viewer.addEventListener('drop', (event) => {
  viewer.removeAttribute('data-dropping');
  const file = event.dataTransfer?.files?.[0];
  if (!file?.type.startsWith('image/')) return;
  event.preventDefault();
  useOwnPhoto(file);
});

// ---- controls ---------------------------------------------------------------

playButton.addEventListener('click', () => {
  if (!player) return;
  if (player.state.playing) player.pause();
  else player.play();
});

// Back restarts the brush being painted, or, if it has barely begun, goes to
// the one before: what pressing back on a DVD player does with a chapter.
backButton.addEventListener('click', () => {
  if (!player) return;
  const here = stages[stageAt(player.state.position)];
  const justStarted = !here || player.state.elapsed - here.from < RESTART_MS;
  const target = justStarted ? stages[stageAt(player.state.position) - 1] : here;
  player.seek(target?.start ?? 0);
});

// On to the next brush, and from the last one to the finished picture.
aheadButton.addEventListener('click', () => {
  if (!player) return;
  const next = stages[stageAt(player.state.position) + 1];
  player.seek(next ? next.start : player.total);
});

againButton.addEventListener('click', () => {
  state = {...state, seed: state.seed + 1};
  start();
});

styleSelect.value = state.style;
styleSelect.addEventListener('change', () => {
  const style = styleSelect.value;
  if (!isStyleName(style)) return;
  state = {...state, style, brush: DEFAULT_BRUSH[style]};
  brushSelect.value = state.brush;
  start();
});

brushSelect.value = state.brush;
brushSelect.addEventListener('change', () => {
  state = {...state, brush: brushSelect.value as BrushName};
  writeHash();
  player?.useBrush(brushes[state.brush]);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== ' ' || event.target !== document.body || !player) return;
  event.preventDefault();
  if (player.state.playing) player.pause();
  else player.play();
});

downloadButton.addEventListener('click', () => {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `painterly-${state.photo.id}-${state.seed}.png`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, 'image/png');
});

// ---- the stages -------------------------------------------------------------

/**
 * One mark per brush, each as wide as the time its brush takes. The widths come
 * from the schedule, which paces by brush count alone, so they are known before
 * the strokes are.
 */
function buildStages(count: number): void {
  // The widths depend on the brush count alone, so the same count keeps the
  // same marks: switching photos must not blank the strip and draw it again.
  if (stages.length === count) {
    resetStages();
    return;
  }
  const pacing = createSchedule(standIn(count), DURATION_MS[state.style]);
  stages = [];
  stageStrip.replaceChildren();
  for (let i = 0; i < count; i++) {
    const mark = document.createElement('span');
    mark.className = 'stage';
    const from = pacing.timeOf(i);
    const to = pacing.timeOf(i + 1);
    mark.style.setProperty('--share', String(to - from));
    stages.push({mark, start: 0, from, to});
    stageStrip.append(mark);
  }
}

/** Back to an unplanned, unpainted strip: the state a photo starts in. */
function resetStages(): void {
  for (const {mark} of stages) {
    mark.style.setProperty('--fill', '0');
    delete mark.dataset.planned;
    delete mark.dataset.planning;
  }
}

/** A plan of `count` brushes with one stroke each: enough for the schedule to pace. */
function standIn(count: number): Plan {
  return {
    seed: 0,
    width: 0,
    height: 0,
    ground: [0, 0, 0],
    strokes: [],
    layerSizes: Array(count).fill(1),
  };
}

/** Once the strokes are known: where each brush begins, and the time it really spans. */
function placeStages(plan: Plan, duration: number): void {
  const sizes = plan.layerSizes.filter((size) => size > 0);
  if (sizes.length !== stages.length) buildStages(sizes.length);
  const pacing = createSchedule(plan, duration);
  let start = 0;
  stages.forEach((stage, i) => {
    stage.start = start;
    stage.from = pacing.timeOf(start);
    start += sizes[i] as number;
    stage.to = pacing.timeOf(start);
  });
}

/** The stage `position` falls in. */
function stageAt(position: number): number {
  let at = 0;
  stages.forEach((stage, i) => {
    if (position >= stage.start) at = i;
  });
  return at;
}

// ---- loading and planning ---------------------------------------------------

/**
 * Load and play, and say so if the photo cannot be read at all — a HEIC, a
 * renamed PDF, something far too big. Every entry point goes through here, so
 * nothing is left waiting on a status line that will never change.
 */
function start(): void {
  load().catch(() => {
    render(null);
    setStatus('That photo could not be read. Try another one.');
  });
}

async function load(): Promise<void> {
  const token = ++loading;
  player?.destroy();
  player = null;
  painting = null;
  writeHash();
  render(null);
  setStatus('Loading the photo…');
  caption.replaceChildren(...captionFor(state.photo));
  canvas.setAttribute('aria-label', `The painting: ${state.photo.caption}`);

  const image = await loadImage(state.photo.file);
  if (token !== loading) return;
  const {width, height} = fitted(image);
  canvas.width = width;
  canvas.height = height;
  showGhost(image);

  const options = styles[state.style].options(width, height);
  const brushCount = (options.radii ?? defaultRadii(width, height)).length;
  buildStages(brushCount);
  const key = planKey(state.photo, state.seed, state.style);
  if (!planning.has(key)) showPlanning(0, brushCount);
  const started = performance.now();
  painting = await planning.plan(
    {
      key,
      source: () => pixelsOf(image, width, height),
      options: () => ({...options, seed: state.seed}),
    },
    (planned, of) => {
      if (token === loading) showPlanning(planned, of);
    },
  );
  if (token !== loading) return;
  plannedIn = Math.round(performance.now() - started);
  placeStages(painting, DURATION_MS[state.style]);
  hidePlanning();

  player = createPlayer({
    canvas,
    context,
    painting,
    brush: brushes[state.brush],
    duration: DURATION_MS[state.style],
    onChange: render,
  });
  window.painterly = {
    seek: player.seek,
    total: player.total,
    duration: player.duration,
    layers: painting.layerSizes,
  };
  render(player.state);
  // Autoplay is the point of the page, unless the visitor has asked for less motion.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) setStatus('Ready. Press play.');
  else player.play();
  planAhead();
}

/** Plan the other photos behind the one playing, so choosing one later starts at once. */
function planAhead(): void {
  const others = photos.filter((photo) => photo.id !== state.photo.id);
  for (const photo of others) {
    rows.get(photo.id)?.toggleAttribute('data-ready', planning.has(planKey(photo, 1, state.style)));
  }
  planning.preload(
    others.map((photo) => ({
      key: planKey(photo, 1, state.style),
      source: async () => {
        const image = await loadImage(photo.file);
        const {width, height} = fitted(image);
        return pixelsOf(image, width, height);
      },
      options: (width, height) => ({...styles[state.style].options(width, height), seed: 1}),
      ready: () => rows.get(photo.id)?.setAttribute('data-ready', ''),
    })),
  );
}

/** Photo, seed and style name a plan; the size does too, since phones plan smaller. */
function planKey(photo: State['photo'], seed: number, style: StyleName): string {
  return `${photo.id}:${photo.file}|${seed}|${style}|${PLAN_SIDE}`;
}

/** The photo's size on the canvas: scaled down to PLAN_SIDE, never up. */
function fitted(image: HTMLImageElement): {width: number; height: number} {
  const scale = Math.min(1, PLAN_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  return {
    width: Math.round(image.naturalWidth * scale),
    height: Math.round(image.naturalHeight * scale),
  };
}

/** The photo's pixels at that size, for the planner. */
function pixelsOf(image: HTMLImageElement, width: number, height: number): PlanSource {
  const scratch = new OffscreenCanvas(width, height);
  const scratchContext = scratch.getContext('2d') ?? orFail('no 2d context');
  scratchContext.drawImage(image, 0, 0, width, height);
  return {width, height, pixels: scratchContext.getImageData(0, 0, width, height).data};
}

// ---- while the planner works ------------------------------------------------

/**
 * The photo itself, faint and grey, stands in for the painting while its
 * strokes are planned: the picture about to be painted, before any paint.
 */
function showGhost(image: HTMLImageElement): void {
  context.fillStyle = getComputedStyle(document.body).backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.globalAlpha = 0.3;
  context.filter = 'grayscale(1)';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  context.restore();
}

/** The rule under each brush darkens as its strokes are planned, and the words keep count. */
function showPlanning(planned: number, of: number): void {
  frame.setAttribute('aria-busy', 'true');
  stages.forEach((stage, i) => {
    stage.mark.toggleAttribute('data-planned', i < planned);
    stage.mark.toggleAttribute('data-planning', i === planned);
  });
  setStatus(`Planning brush ${Math.min(planned + 1, of)} of ${of}…`);
}

/** Planned, all of it. The rule stays where planning left it and the ink fills over it. */
function hidePlanning(): void {
  frame.removeAttribute('aria-busy');
  for (const {mark} of stages) {
    mark.toggleAttribute('data-planned', true);
    mark.removeAttribute('data-planning');
  }
}

// ---- what the page says -----------------------------------------------------

/**
 * The controls, drawn from the player's state. The only place that decides how
 * they look, so they cannot drift from it: `null` is the state before there is
 * a player, when there is nothing yet to play.
 */
function render(view: PlayerState | null): void {
  playButton.disabled = !view;
  playButton.setAttribute('aria-label', view?.playing ? 'Pause' : 'Play');
  playButton.toggleAttribute('data-playing', Boolean(view?.playing));
  setDisabled(backButton, !view || view.position === 0);
  setDisabled(aheadButton, !view || view.finished);
  downloadButton.hidden = !view?.finished;
  // The stages and the words belong to whatever is loading until it hands over.
  if (!view) return;
  const at = stageAt(view.position);
  for (const stage of stages) {
    const filled = (view.elapsed - stage.from) / (stage.to - stage.from);
    stage.mark.style.setProperty('--fill', String(Math.min(1, Math.max(0, filled))));
  }
  // Where the player is and where the canvas has got to, for tooling that waits on them.
  stageStrip.dataset.position = String(view.position);
  stageStrip.dataset.painted = String(view.painted);
  setStatus(view.finished ? finishedText() : `Brush ${at + 1} of ${stages.length}`);
}

/**
 * Disabling the button under the visitor's finger would drop focus to the
 * document, so hand it to Play first — the one control that stays alive for as
 * long as there is anything to play.
 */
function setDisabled(button: HTMLButtonElement, off: boolean): void {
  if (off && document.activeElement === button && !playButton.disabled) playButton.focus();
  button.disabled = off;
}

/** The one number worth keeping, shown once the picture is finished. */
function finishedText(): string {
  if (!painting) return '';
  const strokes = painting.strokes.length.toLocaleString();
  return `${strokes} strokes, planned in ${(plannedIn / 1000).toFixed(1)} s`;
}

function setStatus(text: string): void {
  // render() runs every frame; a live region rewritten at that rate is never read out.
  if (status.textContent === text) return;
  status.textContent = text;
}

/** The photo's own row already names it, so the caption carries only the credit. */
function captionFor(photo: State['photo']): (string | Node)[] {
  if (!photo.credit) return [];
  const link = document.createElement('a');
  link.href = photo.credit.url;
  link.textContent = photo.credit.name;
  link.rel = 'noopener';
  return ['Photo by ', link, ' on Unsplash.'];
}

/** Loaded and decoded: drawing an undecoded photo decodes it then, on the main thread. */
async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = src;
  try {
    await image.decode();
  } catch {
    throw new Error(`could not load ${src}`);
  }
  return image;
}

// ---- the URL ----------------------------------------------------------------

function readHash(): State {
  const params = new URLSearchParams(location.hash.slice(1));
  const photo = photos.find((p) => p.id === params.get('photo')) ?? (photos[0] as Photo);
  // The planner truncates the seed, so #seed=1.5 and #seed=1 would otherwise be
  // two URLs for one painting. Whole numbers only, and never zero.
  const asked = Math.trunc(Number(params.get('seed')));
  const seed = Number.isFinite(asked) && asked > 0 ? asked : 1;
  const style = params.get('style');
  const brush = params.get('brush');
  const chosenStyle: StyleName = isStyleName(style) ? style : 'painting';
  return {
    photo,
    seed,
    style: chosenStyle,
    brush: brush && brush in brushes ? (brush as BrushName) : DEFAULT_BRUSH[chosenStyle],
  };
}

function writeHash(): void {
  if (state.photo.id === 'own') return;
  const params = new URLSearchParams({
    photo: state.photo.id,
    seed: String(state.seed),
    style: state.style,
    brush: state.brush,
  });
  history.replaceState(null, '', `#${params}`);
}

declare global {
  interface Window {
    /** Exact positions the controls do not offer, for the recorder and the tests. */
    painterly?: {
      seek(count: number): void;
      total: number;
      duration: number;
      layers: number[];
    };
  }
}

start();
