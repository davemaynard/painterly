// The tools, drawn from above as they move over the painting. Each is drawn
// in its own frame, in inches: the point of contact at the origin, the hand's
// end of the tool toward +y. The brushes' tips are painted with the colors the
// GPU says are actually on them, so a brush visibly picks up the drops it
// spreads.
//
// A sprite is drawn once into a scratch canvas and stamped onto the overlay
// with a single soft shadow, which grows and drifts as the tool is lifted.
import type {Pose} from './timeline.ts';
import type {ToolName} from './tools.ts';

/** Where the painting sits on the overlay. */
export type View = {
  /** CSS pixels per inch of canvas. */
  scale: number;
  /** The painting's top left corner on the overlay, in CSS pixels. */
  left: number;
  top: number;
};

/** The paint along a tool's working edge: one CSS color per sample, alpha for how loaded. */
export type Load = string[];

type Ink = CanvasRenderingContext2D;

const WOOD = ['#c98f55', '#a8693a'];
const BLUE_LACQUER = ['#2f4f8f', '#1c3263'];
const STEEL = ['#e9ecef', '#9aa1a8', '#d5d9dd'];

const linear = (ink: Ink, x0: number, y0: number, x1: number, y1: number, stops: string[]) => {
  const gradient = ink.createLinearGradient(x0, y0, x1, y1);
  for (const [i, color] of stops.entries()) {
    gradient.addColorStop(i / Math.max(1, stops.length - 1), color);
  }
  return gradient;
};

function roundRect(ink: Ink, x: number, y: number, w: number, h: number, r: number) {
  ink.beginPath();
  ink.roundRect(x, y, w, h, r);
}

/** A tapered handle running from y0 to y1, `w0` wide at the ferrule and `w1` at its end. */
function handle(ink: Ink, y0: number, y1: number, w0: number, w1: number, colors: string[]) {
  ink.beginPath();
  ink.moveTo(-w0 / 2, y0);
  ink.lineTo(w0 / 2, y0);
  ink.quadraticCurveTo(w1 * 0.7, (y0 + y1) / 2, w1 / 2, y1 - w1 / 2);
  ink.arc(0, y1 - w1 / 2, w1 / 2, 0, Math.PI);
  ink.quadraticCurveTo(-w1 * 0.7, (y0 + y1) / 2, -w0 / 2, y0);
  ink.closePath();
  ink.fillStyle = linear(ink, -w0 / 2, 0, w0 / 2, 0, [
    colors[1] ?? '#000',
    colors[0] ?? '#000',
    colors[1] ?? '#000',
  ]);
  ink.fill();
}

/** A metal band: the ferrule that clamps a brush's bristles. */
function ferrule(ink: Ink, y0: number, y1: number, w0: number, w1: number) {
  ink.beginPath();
  ink.moveTo(-w0 / 2, y0);
  ink.lineTo(w0 / 2, y0);
  ink.lineTo(w1 / 2, y1);
  ink.lineTo(-w1 / 2, y1);
  ink.closePath();
  ink.fillStyle = linear(ink, -w0 / 2, 0, w0 / 2, 0, STEEL);
  ink.fill();
  ink.strokeStyle = 'rgba(60,64,70,0.45)';
  ink.lineWidth = 0.012;
  for (const t of [0.25, 0.35]) {
    const y = y0 + (y1 - y0) * t;
    const w = w0 + (w1 - w0) * t;
    ink.beginPath();
    ink.moveTo(-w / 2, y);
    ink.lineTo(w / 2, y);
    ink.stroke();
  }
}

/**
 * Bristles from the tip (y = 0) back to the ferrule, `width` across, with
 * the paint the tool carries laid over their tips in bands across the head.
 */
function bristles(ink: Ink, width: number, length: number, bare: string, load: Load | undefined) {
  ink.save();
  ink.beginPath();
  ink.moveTo(-width / 2, length);
  ink.lineTo(-width / 2, length * 0.18);
  ink.quadraticCurveTo(-width / 2, 0, -width * 0.38, 0);
  ink.lineTo(width * 0.38, 0);
  ink.quadraticCurveTo(width / 2, 0, width / 2, length * 0.18);
  ink.lineTo(width / 2, length);
  ink.closePath();
  ink.fillStyle = bare;
  ink.fill();
  ink.clip();
  if (load?.length) {
    const band = width / load.length;
    load.forEach((color, i) => {
      const gradient = ink.createLinearGradient(0, 0, 0, length * 0.75);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ink.fillStyle = gradient;
      ink.fillRect(-width / 2 + i * band - 0.002, 0, band + 0.004, length);
    });
  }
  // Hair lines along the bristles.
  ink.strokeStyle = 'rgba(40,30,20,0.18)';
  ink.lineWidth = 0.008;
  for (let x = -width / 2 + 0.02; x < width / 2; x += 0.045) {
    ink.beginPath();
    ink.moveTo(x, length);
    ink.lineTo(x + 0.01 * Math.sin(x * 40), 0.02);
    ink.stroke();
  }
  ink.restore();
}

function flatBrush(ink: Ink, width: number, load: Load | undefined, handleColors: string[]) {
  const head = width * 0.55 + 0.25;
  bristles(ink, width, head, '#a49377', load);
  ferrule(ink, head, head + 0.55, width * 1.04, width * 0.9);
  handle(ink, head + 0.55, head + 0.55 + 4.2, Math.min(0.42, width * 0.6), 0.22, handleColors);
}

function liner(ink: Ink, load: Load | undefined) {
  bristles(ink, 0.06, 0.32, '#c9b18a', load);
  ferrule(ink, 0.3, 0.75, 0.08, 0.1);
  handle(ink, 0.75, 6, 0.1, 0.16, WOOD);
}

function knife(ink: Ink) {
  // The blade, pointing away from the hand, and its cranked neck.
  ink.beginPath();
  ink.moveTo(0, -0.95);
  ink.quadraticCurveTo(0.34, -0.55, 0.31, 0.1);
  ink.quadraticCurveTo(0.26, 0.42, 0.05, 0.48);
  ink.lineTo(-0.05, 0.48);
  ink.quadraticCurveTo(-0.26, 0.42, -0.31, 0.1);
  ink.quadraticCurveTo(-0.34, -0.55, 0, -0.95);
  ink.closePath();
  ink.fillStyle = linear(ink, -0.32, 0, 0.32, 0, STEEL);
  ink.fill();
  ink.strokeStyle = 'rgba(90,95,100,0.5)';
  ink.lineWidth = 0.015;
  ink.stroke();
  ink.fillStyle = linear(ink, -0.04, 0, 0.04, 0, STEEL);
  ink.fillRect(-0.035, 0.46, 0.07, 0.9);
  ferrule(ink, 1.3, 1.6, 0.14, 0.2);
  handle(ink, 1.6, 5.2, 0.2, 0.3, BLUE_LACQUER);
}

function scrubber(ink: Ink) {
  // The steel pad shows round the edge of the jar lid it is glued to.
  ink.fillStyle = '#7d8287';
  ink.beginPath();
  ink.arc(0, 0, 1.3, 0, Math.PI * 2);
  ink.fill();
  ink.strokeStyle = 'rgba(225,230,235,0.7)';
  ink.lineWidth = 0.025;
  for (let i = 0; i < 46; i++) {
    const angle = (i / 46) * Math.PI * 2;
    ink.beginPath();
    ink.arc(
      Math.cos(angle) * 1.12,
      Math.sin(angle) * 1.12,
      0.16 + 0.05 * Math.sin(i * 2.3),
      angle,
      angle + 2.6,
    );
    ink.stroke();
  }
  ink.fillStyle = linear(ink, -1, -1, 1, 1, ['#e8dcf2', '#c4b2d9', '#a996c4']);
  ink.beginPath();
  ink.arc(0, 0, 1.02, 0, Math.PI * 2);
  ink.fill();
  ink.strokeStyle = 'rgba(255,255,255,0.6)';
  ink.lineWidth = 0.04;
  ink.beginPath();
  ink.arc(0, 0, 0.86, Math.PI * 1.05, Math.PI * 1.6);
  ink.stroke();
}

function comb(ink: Ink) {
  ink.fillStyle = 'rgba(28,28,32,0.92)';
  roundRect(ink, -0.62, 0.06, 1.24, 0.34, 0.06);
  ink.fill();
  ink.strokeStyle = 'rgba(28,28,32,0.85)';
  ink.lineWidth = 0.018;
  for (let x = -0.56; x <= 0.56; x += 0.066) {
    ink.beginPath();
    ink.moveTo(x, 0.08);
    ink.lineTo(x, -0.02);
    ink.stroke();
  }
  ink.fillStyle = 'rgba(255,255,255,0.12)';
  ink.fillRect(-0.6, 0.1, 1.2, 0.04);
}

function cottonBall(ink: Ink, load: Load | undefined) {
  // The clothespin, holding the cotton, angled back toward the hand.
  ink.save();
  ink.rotate(-0.35);
  ink.fillStyle = linear(ink, -0.18, 0, 0.18, 0, ['#d9b47c', '#b8894f']);
  roundRect(ink, -0.17, 0.25, 0.34, 2.9, 0.05);
  ink.fill();
  ink.strokeStyle = 'rgba(80,50,20,0.5)';
  ink.lineWidth = 0.02;
  ink.beginPath();
  ink.moveTo(0, 0.3);
  ink.lineTo(0, 3.1);
  ink.stroke();
  ink.fillStyle = linear(ink, -0.2, 0, 0.2, 0, STEEL);
  ink.fillRect(-0.2, 1.4, 0.4, 0.14);
  ink.restore();
  const tint = load?.[Math.floor(load.length / 2)];
  for (const [x, y, r] of [
    [0, 0, 0.36],
    [-0.2, -0.08, 0.22],
    [0.2, -0.05, 0.22],
    [0.05, 0.2, 0.24],
    [-0.12, 0.16, 0.2],
  ] as const) {
    ink.fillStyle = ink.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    (ink.fillStyle as CanvasGradient).addColorStop(0, '#ffffff');
    (ink.fillStyle as CanvasGradient).addColorStop(1, '#dcdad3');
    ink.beginPath();
    ink.arc(x, y, r, 0, Math.PI * 2);
    ink.fill();
  }
  if (tint) {
    ink.fillStyle = tint;
    ink.beginPath();
    ink.arc(0, -0.02, 0.3, 0, Math.PI * 2);
    ink.fill();
  }
}

function swabStick(ink: Ink, tip: string | undefined, angle: number, length: number) {
  ink.save();
  ink.rotate(angle);
  ink.fillStyle = '#f3f1ea';
  ink.fillRect(-0.03, 0.08, 0.06, length);
  ink.fillStyle = ink.createRadialGradient(-0.03, -0.04, 0.01, 0, 0, 0.12);
  (ink.fillStyle as CanvasGradient).addColorStop(0, '#ffffff');
  (ink.fillStyle as CanvasGradient).addColorStop(1, '#d6d3ca');
  ink.beginPath();
  ink.ellipse(0, 0, 0.1, 0.14, 0, 0, Math.PI * 2);
  ink.fill();
  if (tip) {
    ink.fillStyle = tip;
    ink.beginPath();
    ink.ellipse(0, -0.01, 0.085, 0.11, 0, 0, Math.PI * 2);
    ink.fill();
  }
  ink.restore();
}

function bundle(ink: Ink, load: Load | undefined) {
  // Tips fanned out in front; the sticks gather into a rubber band behind.
  const tips: [number, number][] = [];
  for (const row of [
    {count: 8, radius: 0.66, spread: 1.05},
    {count: 7, radius: 0.44, spread: 0.95},
    {count: 4, radius: 0.23, spread: 0.8},
  ]) {
    for (let i = 0; i < row.count; i++) {
      const angle = -Math.PI / 2 + (i / (row.count - 1) - 0.5) * 2 * row.spread;
      tips.push([Math.cos(angle) * row.radius, Math.sin(angle) * row.radius + 0.3]);
    }
  }
  const band = {x: 0, y: 1.9};
  ink.strokeStyle = '#f1efe8';
  ink.lineWidth = 0.05;
  for (const [x, y] of tips) {
    ink.beginPath();
    ink.moveTo(x, y);
    ink.lineTo(band.x + x * 0.12, band.y);
    ink.lineTo(band.x + x * 0.1, band.y + 1.6);
    ink.stroke();
  }
  ink.fillStyle = '#c0392b';
  ink.fillRect(-0.16, band.y - 0.05, 0.32, 0.1);
  tips.forEach(([x, y], i) => {
    ink.fillStyle = '#ffffff';
    ink.beginPath();
    ink.ellipse(x, y, 0.07, 0.09, 0, 0, Math.PI * 2);
    ink.fill();
    const tint = load?.[i % (load?.length || 1)];
    if (tint) {
      ink.fillStyle = tint;
      ink.beginPath();
      ink.ellipse(x, y - 0.01, 0.06, 0.075, 0, 0, Math.PI * 2);
      ink.fill();
    }
  });
}

function tube(ink: Ink, paint: string | undefined) {
  ink.save();
  ink.rotate(-0.6);
  ink.fillStyle = linear(ink, -0.06, 0, 0.06, 0, ['#ddd', '#fff', '#bbb']);
  ink.fillRect(-0.06, 0, 0.12, 0.22);
  ink.fillStyle = linear(ink, -0.28, 0, 0.28, 0, ['#c8ccd0', '#f4f6f7', '#aab0b6']);
  ink.beginPath();
  ink.moveTo(-0.14, 0.22);
  ink.lineTo(0.14, 0.22);
  ink.lineTo(0.3, 0.5);
  ink.lineTo(0.3, 2.3);
  ink.lineTo(-0.3, 2.3);
  ink.lineTo(-0.3, 0.5);
  ink.closePath();
  ink.fill();
  ink.fillStyle = paint ?? '#888';
  ink.fillRect(-0.3, 1.0, 0.6, 0.75);
  ink.fillStyle = '#9aa0a6';
  ink.fillRect(-0.32, 2.3, 0.64, 0.12);
  ink.restore();
}

function dryer(ink: Ink, time: number) {
  // Held a hand's width above the canvas, aimed down at the spot being dried.
  ink.save();
  ink.translate(-1.6, -1.9);
  ink.rotate(0.7);
  ink.fillStyle = linear(ink, -0.8, 0, 0.8, 0, ['#fafafa', '#e2e2e2']);
  roundRect(ink, -0.8, -0.2, 1.6, 2.4, 0.7);
  ink.fill();
  ink.fillStyle = '#d4d4d4';
  roundRect(ink, -0.45, 2.1, 0.9, 0.7, 0.2);
  ink.fill();
  ink.fillStyle = linear(ink, -0.3, 0, 0.3, 0, ['#e9e9e9', '#cfcfcf']);
  roundRect(ink, -0.32, 2.5, 0.64, 2.0, 0.18);
  ink.fill();
  ink.strokeStyle = 'rgba(120,120,120,0.5)';
  ink.lineWidth = 0.03;
  for (let i = 0; i < 6; i++) {
    ink.beginPath();
    ink.moveTo(-0.5, 0.2 + i * 0.22);
    ink.lineTo(0.5, 0.2 + i * 0.22);
    ink.stroke();
  }
  ink.restore();
  // Moving air, toward the spot.
  ink.strokeStyle = 'rgba(255,255,255,0.35)';
  ink.lineWidth = 0.03;
  for (let i = 0; i < 4; i++) {
    const phase = (time * 2.5 + i / 4) % 1;
    ink.beginPath();
    ink.arc(-1.6 + 1.6 * phase, -1.9 + 1.9 * phase, 0.4 + 0.5 * phase, 0.2, 1.4);
    ink.stroke();
  }
}

function spatterBrushes(ink: Ink, load: Load | undefined, pressure: number) {
  // The loaded brush, and the handle it is tapped against.
  ink.save();
  ink.rotate(0.55);
  liner(ink, load);
  ink.restore();
  ink.save();
  ink.translate(0.6, 0.4);
  ink.rotate(-0.75);
  handle(ink, 0, 5, 0.16, 0.24, WOOD);
  ink.restore();
  if (pressure > 0.5) {
    ink.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 14; i++) {
      const angle = i * 2.4;
      const out = 0.25 + (i % 5) * 0.12;
      ink.beginPath();
      ink.arc(
        Math.cos(angle) * out,
        Math.sin(angle) * out - 0.2,
        0.02 + (i % 3) * 0.01,
        0,
        Math.PI * 2,
      );
      ink.fill();
    }
  }
}

/** Draw `tool` in its own frame, in inches, contact at the origin. */
function drawInFrame(ink: Ink, pose: Pose, load: Load | undefined, time: number) {
  switch (pose.tool) {
    case 'wideBrush':
      return flatBrush(ink, 2, load, WOOD);
    case 'flatBrush':
      return flatBrush(ink, 1, load, WOOD);
    case 'trunkBrush':
      return flatBrush(ink, 0.42, load, BLUE_LACQUER);
    case 'liner':
      return liner(ink, load);
    case 'knife':
      return knife(ink);
    case 'scrubber':
      return scrubber(ink);
    case 'comb':
      return comb(ink);
    case 'cotton':
      return cottonBall(ink, load);
    case 'swab':
      return swabStick(ink, load?.[Math.floor((load?.length ?? 0) / 2)], -0.5, 3);
    case 'bundle':
      return bundle(ink, load);
    case 'tube':
      return tube(ink, pose.paint);
    case 'dryer':
      return dryer(ink, time);
    case 'spatter':
      return spatterBrushes(ink, load, pose.pressure);
  }
}

/**
 * How a tool is turned on screen. Brushes, the knife and the comb trail their
 * handles behind the way they move; pads and swabs are held from the lower
 * right whatever they do.
 */
function turnOf(tool: ToolName, pose: Pose): number {
  switch (tool) {
    case 'wideBrush':
    case 'flatBrush':
    case 'trunkBrush':
    case 'liner':
    case 'comb':
      return pose.angle + Math.PI / 2;
    case 'knife':
      return pose.angle - Math.PI / 2;
    default:
      return -0.5;
  }
}

/** Reach of each sprite from its contact point, in inches, for sizing the scratch canvas. */
const REACH = 7;

export function createSprites(overlay: HTMLCanvasElement) {
  const scratch = document.createElement('canvas');
  const ink = overlay.getContext('2d');
  const scratchInk = scratch.getContext('2d');
  if (!ink || !scratchInk) throw new Error('no 2d context for the tools');

  return {
    /** Clear the overlay and draw the tool at `pose`. */
    draw(pose: Pose, view: View, load: Load | undefined, time: number) {
      const ratio = overlay.width / overlay.getBoundingClientRect().width || 1;
      ink.setTransform(1, 0, 0, 1, 0, 0);
      ink.clearRect(0, 0, overlay.width, overlay.height);

      // Draw the tool alone at the overlay's resolution, then stamp it with one shadow.
      const pixelsPerInch = view.scale * ratio * (1 + 0.07 * pose.lift);
      const size = Math.ceil(REACH * 2 * pixelsPerInch);
      if (scratch.width !== size) {
        scratch.width = size;
        scratch.height = size;
      }
      scratchInk.setTransform(1, 0, 0, 1, 0, 0);
      scratchInk.clearRect(0, 0, size, size);
      scratchInk.setTransform(pixelsPerInch, 0, 0, pixelsPerInch, size / 2, size / 2);
      scratchInk.rotate(turnOf(pose.tool, pose));
      drawInFrame(scratchInk, pose, load, time);

      const x = (view.left + pose.x * view.scale) * ratio;
      const y = (view.top + pose.y * view.scale) * ratio;
      const lift = 0.06 + 0.32 * pose.lift;
      ink.save();
      ink.shadowColor = `rgba(10, 14, 24, ${0.42 - 0.14 * pose.lift})`;
      ink.shadowBlur = (0.06 + 0.3 * pose.lift) * view.scale * ratio;
      ink.shadowOffsetX = lift * view.scale * ratio * 0.8;
      ink.shadowOffsetY = lift * view.scale * ratio;
      ink.drawImage(scratch, x - size / 2, y - size / 2);
      ink.restore();
    },
    clear() {
      ink.setTransform(1, 0, 0, 1, 0, 0);
      ink.clearRect(0, 0, overlay.width, overlay.height);
    },
  };
}
