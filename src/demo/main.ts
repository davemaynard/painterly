// The page. Wires the controls to a player, keeps the choice of photo, seed,
// style and brush in the URL, and turns what the player reports into words.
// The decisions live in plan/, the look in paint/, the pacing in schedule.ts,
// the play loop and the scrubbing cache in player.ts and snapshots.ts.
import {rasterFromImageData} from '../image';
import {type BrushName, brushes} from '../paint';
import {isStyleName, plan, type StyleName, styles} from '../plan';
import type {Plan} from '../types';
import {type Photo, photos} from './photos';
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
 * stays under a few seconds.
 */
const PLAN_SIDE = window.innerWidth < 600 ? 900 : 1400;

const $ = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`missing ${selector}`);
  return element;
};

/** Give up, as an expression, so a value can be required where it is read. */
const orFail = (message: string): never => {
  throw new Error(message);
};

const canvas = $<HTMLCanvasElement>('#canvas');
const context = canvas.getContext('2d', {alpha: false}) ?? orFail('no 2d context');
const playButton = $<HTMLButtonElement>('#play');
const againButton = $<HTMLButtonElement>('#again');
const downloadButton = $<HTMLButtonElement>('#download');
const timeline = $<HTMLInputElement>('#timeline');
const brushSelect = $<HTMLSelectElement>('#brush');
const styleSelect = $<HTMLSelectElement>('#style');
const photoList = $<HTMLElement>('#photos');
const ownTile = $<HTMLElement>('#own');
const fileInput = $<HTMLInputElement>('#file');
const status = $<HTMLElement>('#status');
const clock = $<HTMLElement>('#clock');
const caption = $<HTMLElement>('#caption');

type State = {
  photo: Photo | {id: 'own'; file: string; caption: string; credit: null};
  seed: number;
  style: StyleName;
  brush: BrushName;
};

let state: State = readHash();
let painting: Plan | null = null;
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
  input.addEventListener('change', () => {
    if (!input.checked) return;
    state = {...state, photo, seed: 1};
    void load();
  });
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (!file) return;
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
  void load();
});

// ---- controls ---------------------------------------------------------------

playButton.addEventListener('click', () => {
  if (!player) return;
  if (player.state.playing) player.pause();
  else player.play();
});

againButton.addEventListener('click', () => {
  state = {...state, seed: state.seed + 1};
  void load();
});

styleSelect.value = state.style;
styleSelect.addEventListener('change', () => {
  const style = styleSelect.value;
  if (!isStyleName(style)) return;
  state = {...state, style, brush: DEFAULT_BRUSH[style]};
  brushSelect.value = state.brush;
  void load();
});

brushSelect.value = state.brush;
brushSelect.addEventListener('change', () => {
  state = {...state, brush: brushSelect.value as BrushName};
  writeHash();
  player?.useBrush(brushes[state.brush]);
});

timeline.addEventListener('input', () => {
  if (!player) return;
  // Move before pausing. Pausing reports a state, and the report would put the
  // thumb back where the painting was, throwing away the position the visitor
  // just chose; the browser then sees no change to commit on release, and the
  // painting would stay paused as well.
  player.seek(Number(timeline.value));
  player.pause();
});

// Letting go picks the painting up from where you dropped it: the timeline is a
// way to move through the painting, not a way to stop it.
timeline.addEventListener('change', () => {
  if (!player || player.state.finished) return;
  player.play();
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

// ---- loading and planning ---------------------------------------------------

async function load(): Promise<void> {
  const token = ++loading;
  player?.destroy();
  player = null;
  painting = null;
  writeHash();
  playButton.disabled = true;
  timeline.disabled = true;
  downloadButton.hidden = true;
  setStatus('Loading the photo…');
  // Every painting takes the same time whatever the photo, so the clock is
  // right before a single stroke has been planned.
  showClock(0, DURATION_MS[state.style]);
  caption.replaceChildren(...captionFor(state.photo));

  const image = await loadImage(state.photo.file);
  if (token !== loading) return;
  const scale = Math.min(1, PLAN_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);
  canvas.width = width;
  canvas.height = height;

  setStatus('Mixing the palette…');
  // Let the status paint before the planner takes the thread.
  await new Promise((resolve) => setTimeout(resolve, 30));
  if (token !== loading) return;
  const reference = new OffscreenCanvas(width, height);
  const refContext = reference.getContext('2d') ?? orFail('no 2d context');
  refContext.drawImage(image, 0, 0, width, height);
  const source = rasterFromImageData(refContext.getImageData(0, 0, width, height));

  const started = performance.now();
  painting = plan(source, {...styles[state.style].options(width, height), seed: state.seed});
  plannedIn = Math.round(performance.now() - started);
  timeline.max = String(painting.strokes.length);
  timeline.value = '0';
  // Where each brush hands over, for tooling that wants to pace itself like the page does.
  timeline.dataset.layers = painting.layerSizes.join(',');
  timeline.disabled = false;

  player = createPlayer({
    canvas,
    context,
    painting,
    brush: brushes[state.brush],
    duration: DURATION_MS[state.style],
    onChange: render,
  });
  playButton.disabled = false;
  render(player.state);
  // Autoplay is the point of the page, unless the visitor has asked for less motion.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) setStatus('Ready. Press play.');
  else player.play();
}

// ---- what the page says -----------------------------------------------------

function render(view: PlayerState): void {
  // Written only when it differs, so a report during a drag never touches the
  // control the visitor is holding.
  const at = String(view.position);
  if (timeline.value !== at) timeline.value = at;
  // Where the canvas actually is, for tooling that has to wait for it to catch up.
  timeline.dataset.painted = String(view.painted);
  playButton.textContent = view.playing ? 'Pause' : 'Play';
  playButton.setAttribute('aria-pressed', String(view.playing));
  downloadButton.hidden = !view.finished;
  showClock(view.elapsed, player?.duration ?? DURATION_MS[state.style]);
  setStatus(view.finished ? finishedText() : progressText(view.position));
}

/** Which brush is working. How far along the painting is, the timeline already shows. */
function progressText(count: number): string {
  if (!painting) return '';
  let layer = 0;
  let boundary = 0;
  for (const size of painting.layerSizes) {
    boundary += size;
    if (count < boundary) break;
    layer++;
  }
  const layers = brushCount(painting);
  return `Brush ${Math.min(layer + 1, layers)} of ${layers}`;
}

/** The one number worth keeping, shown once the picture is finished. */
function finishedText(): string {
  if (!painting) return '';
  const strokes = painting.strokes.length.toLocaleString();
  return `${strokes} strokes, planned in ${(plannedIn / 1000).toFixed(1)} s`;
}

function showClock(elapsed: number, total: number): void {
  clock.textContent = `${asMinutes(elapsed)} / ${asMinutes(total)}`;
}

function asMinutes(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function brushCount(current: Plan): number {
  return current.layerSizes.filter((n) => n > 0).length;
}

function setStatus(text: string): void {
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`could not load ${src}`));
    image.src = src;
  });
}

// ---- the URL ----------------------------------------------------------------

function readHash(): State {
  const params = new URLSearchParams(location.hash.slice(1));
  const photo = photos.find((p) => p.id === params.get('photo')) ?? (photos[0] as Photo);
  const seed = Number(params.get('seed')) || 1;
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

void load();
