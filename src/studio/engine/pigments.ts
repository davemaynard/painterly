// Paint, as the simulation understands it: how much light a pigment absorbs
// and how much it scatters back, per color channel and per unit of thickness.
// This is the Kubelka-Munk model, the same two numbers a paint chemist uses,
// cut down from a spectrum to three channels.
//
// Mixing paints mixes those coefficients, weighted by how much of each went
// in, and the color comes out of the model afterwards. That is the whole
// reason to bother: blue and yellow make green, a little navy goes a long way
// into white, and black dirties everything, because that is what absorption
// and scattering do. Averaging RGB values makes gray mud of all three.
//
// The shaders carry the same functions (see shaders.ts). This copy exists for
// the tests, the swatches on the page and the colors drawn on a loaded brush.

/** Linear RGB, 0..1 each. */
export type Linear = [number, number, number];

/**
 * One tube of paint, described the way a painter would: its color straight
 * from the tube, laid on thick enough to hide the canvas, and how hard it
 * scatters light. Opaque paints (titanium white, the earths) scatter hard and
 * tint gently; transparent ones (phthalo, Prussian blue) barely scatter and
 * take over anything they are mixed into.
 */
export type Paint = {
  name: string;
  /** Masstone, as sRGB hex. */
  masstone: string;
  /** Scattering per unit of thickness, relative to titanium white. */
  scattering: number;
};

/** Scattering of titanium white per unit of paint thickness (0.1 mm). */
export const WHITE_SCATTERING = 4;

/** The tubes on the table, named as they would be on the label. */
export const paints = {
  titaniumWhite: {name: 'Titanium white', masstone: '#f6f5f0', scattering: 1},
  skyBlue: {name: 'Sky blue', masstone: '#4aa6dc', scattering: 0.8},
  cobaltBlue: {name: 'Cobalt blue', masstone: '#1f4fb4', scattering: 0.35},
  prussianBlue: {name: 'Prussian blue', masstone: '#0f1d4c', scattering: 0.12},
  cadmiumYellow: {name: 'Cadmium yellow', masstone: '#f7c41a', scattering: 0.5},
  yellowOchre: {name: 'Yellow ochre', masstone: '#c8961e', scattering: 0.6},
  burntSienna: {name: 'Burnt sienna', masstone: '#9a3a16', scattering: 0.35},
  sapGreen: {name: 'Sap green', masstone: '#1f6b2c', scattering: 0.25},
  phthaloGreen: {name: 'Phthalo green', masstone: '#0d3c39', scattering: 0.1},
  burntUmber: {name: 'Burnt umber', masstone: '#3a2416', scattering: 0.3},
  marsBlack: {name: 'Mars black', masstone: '#121212', scattering: 0.35},
} as const satisfies Record<string, Paint>;

export type PaintName = keyof typeof paints;

/** A mix: how many parts of each paint. Parts are relative; they need not sum to 1. */
export type Mix = Partial<Record<PaintName, number>>;

/** Absorption and scattering per unit thickness, per channel. */
export type Coefficients = {absorption: Linear; scattering: Linear};

export const srgbToLinear = (channel: number) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

export const linearToSrgb = (channel: number) =>
  channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;

export function hexToLinear(hex: string): Linear {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [
    srgbToLinear(((value >> 16) & 255) / 255),
    srgbToLinear(((value >> 8) & 255) / 255),
    srgbToLinear((value & 255) / 255),
  ];
}

export function linearToHex(color: Linear): string {
  const byte = (channel: number) =>
    Math.round(Math.min(1, Math.max(0, linearToSrgb(channel))) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${byte(color[0])}${byte(color[1])}${byte(color[2])}`;
}

/**
 * A paint's coefficients from its masstone. An infinitely thick layer reflects
 * R = 1 + K/S − sqrt((K/S)² + 2K/S), which inverts to K/S = (1 − R)² / 2R;
 * the paint's scattering then sets the scale of both.
 */
export function coefficientsOf(paint: Paint): Coefficients {
  const scattering = paint.scattering * WHITE_SCATTERING;
  const masstone = hexToLinear(paint.masstone);
  const absorption = masstone.map((reflectance) => {
    const r = Math.min(0.999, Math.max(0.001, reflectance));
    return ((1 - r) ** 2 / (2 * r)) * scattering;
  }) as Linear;
  return {absorption, scattering: [scattering, scattering, scattering]};
}

/** The coefficients of a mix: each paint's, weighted by its share. */
export function coefficientsOfMix(mix: Mix): Coefficients {
  let absorption: Linear = [0, 0, 0];
  let scattering: Linear = [0, 0, 0];
  let total = 0;
  const add = (sum: Linear, value: Linear, parts: number): Linear => [
    sum[0] + parts * value[0],
    sum[1] + parts * value[1],
    sum[2] + parts * value[2],
  ];
  for (const [name, parts] of Object.entries(mix) as [PaintName, number][]) {
    if (!parts) continue;
    const paint = coefficientsOf(paints[name]);
    absorption = add(absorption, paint.absorption, parts);
    scattering = add(scattering, paint.scattering, parts);
    total += parts;
  }
  if (total === 0) throw new Error('a mix needs at least one paint');
  return {
    absorption: absorption.map((value) => value / total) as Linear,
    scattering: scattering.map((value) => value / total) as Linear,
  };
}

/**
 * Reflectance of a layer `thickness` deep over a background of reflectance
 * `under`, channel by channel: Kubelka-Munk's finite-layer solution, written
 * with tanh so a thick layer settles on its masstone instead of overflowing.
 */
export function reflectance(coefficients: Coefficients, thickness: number, under: Linear): Linear {
  return [0, 1, 2].map((channel) => {
    const k = coefficients.absorption[channel] as number;
    const s = Math.max(1e-4, coefficients.scattering[channel] as number);
    const ground = under[channel] as number;
    const a = 1 + k / s;
    const b = Math.sqrt(a * a - 1);
    const t = Math.tanh(b * s * thickness);
    return (t * (1 - ground * a) + ground * b) / (t * (a - ground) + b);
  }) as Linear;
}

/** The color a mix shows when laid on thick: its masstone. */
export const masstoneOf = (mix: Mix): Linear => reflectance(coefficientsOfMix(mix), 1e3, [0, 0, 0]);
