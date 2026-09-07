// The page. Loads a photo, plans the painting, and plays it on a fixed clock
// with a timeline you can scrub. Everything here is wiring; the decisions live
// in plan/, the look in paint/, the pacing in schedule.ts.
import {rasterFromImageData} from '../image';
import {
  type Brush,
  type BrushName,
  brushes,
  createPainter,
  createSchedule,
  type Painter,
  type Schedule,
} from '../paint';
import {isStyleName, plan, type StyleName, styles} from '../plan';
import type {Plan} from '../types';
import {type Photo, photos} from './photos';

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
/**
 * How much memory the scrubbing snapshots may take. Each one is a copy of the
 * canvas, and the more of them there are the less a backward seek has to
 * repaint, so this is the whole trade: memory against the wait after a drag.
 */
const SNAPSHOT_BUDGET_BYTES = 64 * 1024 * 1024;
/** Never keep more than this many, however small the canvas is. */
const MOST_SNAPSHOTS = 12;

const $ = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`missing ${selector}`);
  return element;
};

const canvas = $<HTMLCanvasElement>('#canvas');
const context = canvas.getContext('2d', {alpha: false});
if (!context) throw new Error('no 2d context');
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
let painter: Painter | null = null;
let schedule: Schedule | null = null;
/** The canvas as it stood after `count` strokes, to seek from without repainting. */
type Snapshot = {count: number; image: ImageBitmap};
let snapshots: Snapshot[] = [];
/** How many strokes apart those snapshots are taken. */
let snapshotEvery = Number.POSITIVE_INFINITY;
let playing = false;
let startedAt = 0;
let elapsedAtPause = 0;
let frame = 0;
/** Where the timeline was dragged to, waiting for the next frame to be painted. */
let pendingSeek: number | null = null;
let seekFrame = 0;

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

playButton.addEventListener('click', () => (playing ? pause() : play()));
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
  if (!painting || !schedule) return;
  const count = painter?.painted ?? 0;
  startPainter(painting);
  seek(count);
});
timeline.addEventListener('input', () => {
  if (!schedule) return;
  pause();
  // A drag fires an event per mouse move, and repainting for each one is work
  // the visitor never sees. Keep the newest position and paint it once a frame.
  pendingSeek = Number(timeline.value);
  if (!seekFrame) seekFrame = requestAnimationFrame(flushSeek);
});
// Letting go picks the painting up from where you dropped it: the timeline is a
// way to move through the painting, not a way to stop it.
timeline.addEventListener('change', () => {
  flushSeek();
  if (!painting || !painter || painter.painted >= painting.strokes.length) return;
  play();
});
document.addEventListener('keydown', (event) => {
  if (event.key === ' ' && event.target === document.body) {
    event.preventDefault();
    playing ? pause() : play();
  }
});

/** Paint the position the timeline is sitting at, if it has moved since the last frame. */
function flushSeek(): void {
  cancelAnimationFrame(seekFrame);
  seekFrame = 0;
  if (pendingSeek === null) return;
  const to = pendingSeek;
  pendingSeek = null;
  seek(to);
}

// ---- loading and planning ---------------------------------------------------

async function load(): Promise<void> {
  pause();
  writeHash();
  painting = null;
  painter = null;
  schedule = null;
  for (const {image} of snapshots) image.close();
  snapshots = [];
  downloadButton.hidden = true;
  setStatus('Loading the photo…');
  // Every painting takes the same time whatever the photo, so the clock is
  // right before a single stroke has been planned.
  showClock(0);
  caption.replaceChildren(...captionFor(state.photo));

  const image = await loadImage(state.photo.file);
  const scale = Math.min(1, PLAN_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);
  canvas.width = width;
  canvas.height = height;

  setStatus('Mixing the palette…');
  // Let the status paint before the planner takes the thread.
  await new Promise((resolve) => setTimeout(resolve, 30));
  const reference = new OffscreenCanvas(width, height);
  const refContext = reference.getContext('2d');
  if (!refContext) throw new Error('no 2d context');
  refContext.drawImage(image, 0, 0, width, height);
  const source = rasterFromImageData(refContext.getImageData(0, 0, width, height));

  const started = performance.now();
  painting = plan(source, {...styles[state.style].options(width, height), seed: state.seed});
  plannedIn = Math.round(performance.now() - started);
  schedule = createSchedule(painting, DURATION_MS[state.style]);
  timeline.max = String(painting.strokes.length);
  timeline.value = '0';
  // Where each brush hands over, for tooling that wants to pace itself like the page does.
  timeline.dataset.layers = painting.layerSizes.join(',');
  timeline.disabled = false;
  const affordable = Math.floor(SNAPSHOT_BUDGET_BYTES / (width * height * 4));
  const most = Math.max(4, Math.min(MOST_SNAPSHOTS, affordable));
  snapshotEvery = Math.max(1000, Math.ceil(painting.strokes.length / most));
  startPainter(painting);
  playButton.disabled = false;
  updateClock();
  // Autoplay is the point of the page, unless the visitor has asked for less motion.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) setStatus('Ready. Press play.');
  else play();
}

function startPainter(current: Plan): void {
  const brush: Brush = brushes[state.brush];
  if (!context) return;
  painter = createPainter(context, current, brush);
  for (const {image} of snapshots) image.close();
  snapshots = [];
}

// ---- playing ----------------------------------------------------------------

function play(): void {
  if (!painting || !schedule || !painter) return;
  if (painter.painted >= painting.strokes.length) {
    seek(0);
  }
  playing = true;
  playButton.textContent = 'Pause';
  playButton.setAttribute('aria-pressed', 'true');
  elapsedAtPause = schedule.timeOf(painter.painted);
  startedAt = performance.now();
  frame = requestAnimationFrame(tick);
}

function pause(): void {
  playing = false;
  cancelAnimationFrame(frame);
  playButton.textContent = 'Play';
  playButton.setAttribute('aria-pressed', 'false');
}

function tick(now: number): void {
  if (!playing || !painting || !schedule || !painter) return;
  const elapsed = elapsedAtPause + (now - startedAt);
  const target = schedule.strokesAt(elapsed);
  paintForwardTo(target);
  timeline.value = String(painter.painted);
  updateClock();
  if (painter.painted >= painting.strokes.length) {
    finish();
    return;
  }
  setStatus(progressText(painter.painted));
  frame = requestAnimationFrame(tick);
}

/** Paint forward, stopping at each place worth keeping a snapshot of. */
function paintForwardTo(target: number): void {
  if (!painting || !painter) return;
  for (const mark of marksBetween(painter.painted, target)) {
    painter.paintTo(mark);
    if (snapshots.some((s) => s.count === mark)) continue;
    // createImageBitmap copies the canvas as it is now, so the painting may
    // carry on before the copy arrives.
    void createImageBitmap(canvas).then((image) => snapshots.push({count: mark, image}));
  }
  painter.paintTo(target);
}

/**
 * The stroke counts between `from` and `to` worth a snapshot: an even grid, so
 * that a seek backwards repaints at most one interval. Layer boundaries are not
 * enough on their own, since the last brush can hold two thirds of the painting
 * and a seek behind it would repaint every one of those strokes.
 */
function marksBetween(from: number, to: number): number[] {
  const marks: number[] = [];
  if (!Number.isFinite(snapshotEvery)) return marks;
  for (let n = Math.floor(from / snapshotEvery) + 1; n * snapshotEvery <= to; n++) {
    marks.push(n * snapshotEvery);
  }
  return marks;
}

function seek(count: number): void {
  if (!painting || !painter || !schedule) return;
  // Start from the nearest snapshot at or before the target, whichever side of
  // the playhead it sits on. Jumping forward across one costs exactly as much
  // as scrubbing back behind it: both repaint every stroke in between.
  let nearest: Snapshot | undefined;
  for (const snapshot of snapshots) {
    if (snapshot.count <= count && (!nearest || snapshot.count > nearest.count)) nearest = snapshot;
  }
  const from = nearest?.count ?? 0;
  if (from > painter.painted || count < painter.painted) {
    if (nearest) painter.resume(nearest.image, nearest.count);
    else painter.reset();
  }
  paintForwardTo(count);
  timeline.value = String(painter.painted);
  updateClock();
  downloadButton.hidden = painter.painted < painting.strokes.length;
  setStatus(
    painter.painted >= painting.strokes.length ? finishedText() : progressText(painter.painted),
  );
}

function finish(): void {
  pause();
  updateClock();
  setStatus(finishedText());
  downloadButton.hidden = false;
}

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

// ---- small helpers ----------------------------------------------------------

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

/** How far into the painting we are, against what the whole of it takes. */
function updateClock(): void {
  if (!schedule || !painter) return;
  showClock(schedule.timeOf(painter.painted));
}

function showClock(elapsed: number): void {
  const total = schedule?.duration ?? DURATION_MS[state.style];
  clock.textContent = `${asMinutes(elapsed)} / ${asMinutes(total)}`;
}

function asMinutes(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** The one number worth keeping, shown once the picture is finished. */
function finishedText(): string {
  if (!painting) return '';
  return `${painting.strokes.length.toLocaleString()} strokes, planned in ${(plannedIn / 1000).toFixed(1)} s`;
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
