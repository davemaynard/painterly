// The GPU half of the paint engine, as GLSL. surface.ts runs these passes;
// what each one means is written above it.
//
// The canvas is five textures, all half-float, one texel per 1/128 inch at
// the default size. Wet paint is two layers, because fresh paint sits on top
// of what is already there until a tool churns the two together:
//   pigment, scatter        the older wet paint, underneath
//   topPigment, topScatter  fresh paint on top of it
//   dry                     rgb = reflectance of the dried layers, a = their thickness
// In each wet pair, pigment is rgb = absorption × thickness, a = thickness,
// and scatter is rgb = scattering × thickness, a = how wet it is, 0..1.
// Thickness is in units of 0.1 mm. Absorption and scattering are stored
// multiplied by thickness so that putting paint together is addition: a mix
// is the sum of what went in, and its color is worked out only when shown.
//
// A tool carries paint the same way, in two textures of its own laid out in
// the tool's frame: x across the tool, y along it, both −1..1. Paint picked up
// at one end of a stroke is carried in that frame and put down further on,
// which is all smearing is.

/** Shared by every pass: hashing, noise, Kubelka-Munk and the weave of the canvas. */
const COMMON = /* glsl */ `
precision highp float;
precision highp int;

const float PI = 3.14159265;
const float TAU = 6.28318531;

// Integer hashing, so a seed paints the same marks on every GPU.
uint hash(uint x) {
  x ^= x >> 16u;
  x *= 0x7feb352du;
  x ^= x >> 15u;
  x *= 0x846ca68bu;
  x ^= x >> 16u;
  return x;
}
uint hash(uint a, uint b) { return hash(a ^ hash(b + 0x9e3779b9u)); }
uint hash(ivec2 cell, uint seed) { return hash(hash(uint(cell.x), uint(cell.y)), seed); }

/** A uniform number in [0, 1) from a hash. */
float unit(uint h) { return float(h >> 8u) / 16777216.0; }
float random(uint seed, uint salt) { return unit(hash(seed, salt)); }

float noise1(float x, uint seed) {
  float cell = floor(x);
  float f = fract(x);
  float a = unit(hash(uint(int(cell)), seed));
  float b = unit(hash(uint(int(cell) + 1), seed));
  return mix(a, b, f * f * (3.0 - 2.0 * f));
}

float noise2(vec2 p, uint seed) {
  ivec2 cell = ivec2(floor(p));
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = unit(hash(cell, seed));
  float b = unit(hash(cell + ivec2(1, 0), seed));
  float c = unit(hash(cell + ivec2(0, 1), seed));
  float d = unit(hash(cell + ivec2(1, 1), seed));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p, uint seed) {
  return 0.55 * noise2(p, seed) + 0.3 * noise2(p * 2.03, seed + 1u) + 0.15 * noise2(p * 4.11, seed + 2u);
}

// Kubelka-Munk: the reflectance of a layer of paint with absorption K and
// scattering S per unit thickness, 'thickness' deep, over a ground that
// reflects 'under'. Written with tanh so thick paint settles on its masstone.
vec3 paintOver(vec3 K, vec3 S, float thickness, vec3 under) {
  S = max(S, vec3(1e-4));
  vec3 a = 1.0 + K / S;
  vec3 b = sqrt(max(a * a - 1.0, vec3(1e-8)));
  vec3 t = tanh(b * S * thickness);
  return (t * (1.0 - under * a) + under * b) / (t * (a - under) + b);
}

// A plain-woven cotton duck, as a height 0..1. The threads cross over and
// under in a checkerboard, each arching across its own width, and each
// thread varies a little in thickness along the bolt.
uniform float uWeavePitch;
float weave(vec2 p) {
  vec2 q = p / uWeavePitch;
  vec2 cell = floor(q);
  vec2 f = fract(q);
  float warp = sqrt(sin(PI * f.x)) * (0.55 + 0.45 * sin(PI * f.y));
  float weft = sqrt(sin(PI * f.y)) * (0.55 + 0.45 * sin(PI * f.x));
  float warpOnTop = mod(cell.x + cell.y, 2.0);
  float thread = mix(noise1(cell.y * 0.73, 101u), noise1(cell.x * 0.61, 202u), warpOnTop);
  return mix(weft, warp, warpOnTop) * (0.8 + 0.4 * thread);
}

// How much the weave stands out through paint 'paint' thick: fully on bare
// gesso, filled in under a couple of tenths of a millimeter.
float weaveRelief(vec2 p, float paint) {
  return 0.2 * weave(p) * (1.0 - smoothstep(0.0, 1.5, paint));
}
`;

/**
 * Where a tool touches. Each kind of tool is a function of a point in the
 * tool's frame returning how hard the tool presses paint there, 0..1. The same
 * function runs in both directions of every exchange, canvas to tool and tool
 * to canvas, so the two agree on where contact was.
 */
const FOOTPRINT = /* glsl */ `
const int FLAT = 0;
const int ROUND = 1;
const int KNIFE = 2;
const int SCRUBBER = 3;
const int COMB = 4;
const int SWAB = 5;
const int BUNDLE = 6;
const int COTTON = 7;

uniform int uKind;
/** Fixed for the life of a tool: which bristles clump, which comb teeth hold paint. */
uniform float uToolSeed;
/** Fixed for one stroke: how the bristles have regrouped since the last one. */
uniform float uStrokeSeed;
/** New for every touch: which coils of the scrubber land, how the cotton splays. */
uniform float uDabSeed;
uniform float uPressure;
/** Per kind; see each footprint below. */
uniform vec4 uShape;
/** How far the tool is turned while pressed, for the cotton ball's rays. */
uniform float uTwist;
/** Swab tips of a bundle in the tool's frame: x, y and radius. */
uniform vec3 uSwabs[24];
uniform int uSwabCount;

// Bristles gather into clumps across the head of a brush. Seen from the paint,
// that is a fixed pattern of wetter and drier lines that runs the length of
// every stroke the brush makes, and shifts a little each time it is reloaded.
float bristles(float x, float clumps) {
  uint tool = uint(uToolSeed);
  uint stroke = uint(uStrokeSeed);
  float coarse = noise1(x * clumps, tool);
  float hairs = noise1(x * clumps * 2.9, tool + 17u);
  float single = noise1(x * clumps * 6.3, tool + 29u);
  float regrouped = noise1(x * clumps * 0.8, stroke + 5u);
  float density = 0.42 * coarse + 0.22 * hairs + 0.16 * single + 0.2 * regrouped;
  return smoothstep(0.24, 0.66, density);
}

// A flat brush pulled flat: x runs across the bristles, y along the stroke.
// uShape.x is the number of clumps across the head.
float flatBrush(vec2 q) {
  float splay = 0.9 + 0.08 * noise1(q.y * 2.0, uint(uStrokeSeed) + 3u);
  float across = 1.0 - smoothstep(splay, 1.0, abs(q.x));
  float along = 1.0 - smoothstep(0.45, 1.0, abs(q.y));
  float loaded = mix(bristles(q.x, uShape.x), 1.0, 0.3 * uPressure);
  return across * along * loaded;
}

// A round brush or a liner: an oval of bristles that streaks along the
// stroke. uShape.y is how solid the mark is: a fine liner holds its point and
// leaves an unbroken line.
float roundBrush(vec2 q) {
  float body = 1.0 - smoothstep(mix(0.5, 0.78, uShape.y), 1.0, length(q));
  return body * mix(bristles(q.x, uShape.x), 1.0, max(0.45, uShape.y));
}

// A painting knife, as a trowel-shaped blade pressed flat: round at the heel,
// pointed at the tip (y = 1). Paint is lifted from under the blade and left in
// a ridge along its edge, which is where a knife mark gets its crisp lip.
float knifeEdge(vec2 q) {
  float halfWidth = sqrt(max(0.0, 1.0 - q.y * q.y)) * mix(1.0, 0.22, smoothstep(-0.25, 1.0, q.y));
  return halfWidth - abs(q.x);
}

// The part of the blade in contact. Held at an angle and pressed lightly, only
// the tip meets the canvas; leaned on, the whole flat of the blade does.
float knifeBlade(vec2 q) {
  float from = mix(0.35, -1.0, uPressure);
  return smoothstep(0.0, 0.05, knifeEdge(q)) * smoothstep(from - 0.12, from + 0.12, q.y);
}

// A pad of coiled steel ribbon. The space under the pad is cut into cells and
// each cell holds one loop of ribbon: an arc with its own center, radius,
// sweep and width. Every press lands a fresh set of loops, turned at random.
// uShape.x is how many cells span the pad.
float ribbons(vec2 q, uint seed) {
  vec2 g = q * uShape.x;
  ivec2 cell = ivec2(floor(g));
  float touch = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      ivec2 c = cell + ivec2(i, j);
      uint h = hash(c, seed);
      vec2 center = vec2(c) + vec2(unit(hash(h, 1u)), unit(hash(h, 2u)));
      float radius = mix(0.25, 0.95, unit(hash(h, 3u)));
      float width = mix(0.05, 0.12, unit(hash(h, 4u)));
      float start = unit(hash(h, 5u)) * TAU;
      float sweep = mix(1.2, 4.5, unit(hash(h, 6u)));
      vec2 d = g - center;
      float angle = mod(atan(d.y, d.x) - start, TAU);
      float onLoop = step(angle, sweep);
      // Steel ribbon is crinkled: along a loop it meets the paint in short
      // runs. Pressed harder, more of each loop touches and it flattens wider.
      float crinkle = step(mix(0.62, 0.3, uPressure), noise1(angle * radius * 7.0, h + 9u));
      float wobble = 0.12 * (noise1(angle * 3.0, h + 13u) - 0.5);
      float off = abs(length(d) - radius - wobble);
      float pressed = width * (0.6 + 0.9 * uPressure);
      touch = max(touch, onLoop * crinkle * (1.0 - smoothstep(pressed * 0.45, pressed, off)));
    }
  }
  return touch;
}

float scrubber(vec2 q) {
  uint seed = uint(uDabSeed);
  float turn = random(seed, 7u) * TAU;
  vec2 r = mat2(cos(turn), sin(turn), -sin(turn), cos(turn)) * q;
  float dome = 1.0 - smoothstep(0.5 + 0.35 * uPressure, 1.0, length(q));
  float coils = max(ribbons(r, seed), 0.7 * ribbons(r * 1.6 + 3.1, seed + 11u));
  return dome * coils;
}

// A comb dragged on its teeth: x along the spine, y along the drag.
// uShape.x is the number of teeth, uShape.y a tooth's half-width as a
// fraction of the gap between teeth.
float comb(vec2 q) {
  float x = (q.x * 0.5 + 0.5) * uShape.x;
  float tooth = floor(x);
  float off = abs(fract(x) - 0.5);
  float tip = 1.0 - smoothstep(0.3, 1.0, abs(q.y));
  uint seed = hash(uint(int(tooth)), uint(uStrokeSeed));
  float held = 0.35 + 0.65 * unit(seed);
  // As the comb lifts, each tooth leaves the canvas at its own moment, so the
  // blades come out different lengths.
  float stays = smoothstep(0.0, 0.08, uPressure - mix(0.12, 0.7, unit(hash(seed, 3u))));
  float width = uShape.y * (0.35 + 0.65 * uPressure);
  return (1.0 - smoothstep(width * 0.5, width, off)) * tip * held * stays;
}

// The cotton tip of a swab: a dome with a fuzzy rim.
float swabTip(vec2 q, uint seed) {
  float r = length(q);
  float around = atan(q.y, q.x) / TAU;
  float fuzz = 0.14 * (noise1(around * 14.0, seed) - 0.5);
  float body = 1.0 - smoothstep(0.72 + fuzz, 0.98 + fuzz, r);
  return body * (0.78 + 0.22 * noise2(q * 5.0, seed + 3u));
}

// A bundle of swabs held together and fanned out at the tips. Each tip flexes
// a little differently every time the bundle is pressed.
float bundle(vec2 q) {
  uint seed = uint(uDabSeed);
  float touch = 0.0;
  for (int i = 0; i < 24; i++) {
    if (i >= uSwabCount) break;
    vec3 swab = uSwabs[i];
    vec2 flex = (vec2(random(seed, uint(i) * 2u), random(seed, uint(i) * 2u + 1u)) - 0.5) * 0.06;
    float lands = step(0.35, random(seed, uint(i) + 100u));
    touch = max(touch, lands * swabTip((q - swab.xy - flex) / swab.z, seed + uint(i)));
  }
  return touch;
}

// A ball of cotton wool pinched in a clothespin. Pressed, it prints a soft
// lumpy disk of fibers; twisted while pressed (uTwist > 0), the fibers drag
// paint out from the middle in fine curving rays.
float cotton(vec2 q) {
  uint seed = uint(uDabSeed);
  float r = length(q);
  float lumps = fbm(q * 2.5, seed);
  float body = 1.0 - smoothstep(0.3, 0.9, r + 0.35 * (lumps - 0.5));
  float fibers = smoothstep(0.3, 0.75, fbm(q * 9.0, seed + 9u));
  float touch = body * mix(0.4, 1.0, fibers);
  if (uTwist > 0.0) {
    float around = (atan(q.y, q.x) + r * uTwist * 2.0) / TAU;
    float rays = pow(noise1(around * 60.0, seed + 21u), 5.0) * 1.6;
    float reach = 1.0 - smoothstep(0.15, 1.0, r);
    touch = max(touch * 0.7, min(1.0, rays) * reach);
  }
  return touch;
}

/**
 * The outline of the contact without its texture: everywhere the tool's body
 * reaches. Paint standing proud of the surface meets the whole body, not just
 * the bristle tips, which is how a brush plows through a fresh drop.
 */
float reach(vec2 q) {
  if (abs(q.x) > 1.0 || abs(q.y) > 1.0) return 0.0;
  if (uKind == FLAT) return (1.0 - smoothstep(0.9, 1.0, abs(q.x))) * (1.0 - smoothstep(0.45, 1.0, abs(q.y)));
  if (uKind == ROUND) return 1.0 - smoothstep(0.5, 1.0, length(q));
  if (uKind == KNIFE) return knifeBlade(q);
  if (uKind == SCRUBBER) return 1.0 - smoothstep(0.5 + 0.35 * uPressure, 1.0, length(q));
  return 0.0;
}

/** How hard the tool presses paint at q, before the canvas's own relief is considered. */
float footprint(vec2 q) {
  if (abs(q.x) > 1.0 || abs(q.y) > 1.0) return 0.0;
  if (uKind == FLAT) return flatBrush(q);
  if (uKind == ROUND) return roundBrush(q);
  if (uKind == KNIFE) return knifeBlade(q) * (0.85 + 0.15 * noise2(q * 6.0, uint(uDabSeed)));
  if (uKind == SCRUBBER) return scrubber(q);
  if (uKind == COMB) return comb(q);
  if (uKind == SWAB) return swabTip(q, uint(uDabSeed));
  if (uKind == BUNDLE) return bundle(q);
  if (uKind == COTTON) return cotton(q);
  return 0.0;
}
`;

/**
 * Reading the canvas: both wet layers at a point, and the arithmetic of
 * taking paint off a layer and putting it on, shared by every pass.
 */
const CANVAS = /* glsl */ `
uniform sampler2D uPigment;
uniform sampler2D uScatter;
uniform sampler2D uTopPigment;
uniform sampler2D uTopScatter;
uniform sampler2D uDry;

/** One wet layer at a point. k and s are absorption and scattering times thickness. */
struct Layer { vec3 k; vec3 s; float v; float wet; };

Layer layer(vec4 pigment, vec4 scatter) { return Layer(pigment.rgb, scatter.rgb, pigment.a, scatter.a); }
Layer underLayer(ivec2 texel) { return layer(texelFetch(uPigment, texel, 0), texelFetch(uScatter, texel, 0)); }
Layer topLayer(ivec2 texel) { return layer(texelFetch(uTopPigment, texel, 0), texelFetch(uTopScatter, texel, 0)); }
Layer underLayerAt(vec2 uv) { return layer(texture(uPigment, uv), texture(uScatter, uv)); }
Layer topLayerAt(vec2 uv) { return layer(texture(uTopPigment, uv), texture(uTopScatter, uv)); }

const Layer EMPTY = Layer(vec3(0.0), vec3(0.0), 0.0, 0.0);

/** The layer with 'amount' of its paint taken away; what remains keeps its mix. */
Layer take(Layer l, float amount) {
  if (l.v <= 1e-6) return EMPTY;
  float kept = max(0.0, l.v - amount) / l.v;
  return Layer(l.k * kept, l.s * kept, l.v * kept, kept > 0.0 ? l.wet : 0.0);
}

/** The layer with 'amount' of paint of mix 'from' added, at wetness 'wet'. */
Layer add(Layer l, Layer from, float amount, float wet) {
  if (amount <= 1e-6 || from.v <= 1e-6) return l;
  float share = amount / from.v;
  float v = l.v + amount;
  return Layer(l.k + from.k * share, l.s + from.s * share, v, (l.wet * l.v + wet * amount) / v);
}

void writeLayer(Layer l, out vec4 pigment, out vec4 scatter) {
  if (l.v <= 1e-5) {
    pigment = vec4(0.0);
    scatter = vec4(0.0);
    return;
  }
  pigment = vec4(l.k, l.v);
  scatter = vec4(l.s, l.wet);
}

/** What a stack of wet paint over the dry layers reflects. */
vec3 colorOf(Layer below, Layer fresh, vec3 dry) {
  vec3 color = dry;
  if (below.v > 1e-4) color = paintOver(below.k / below.v, below.s / below.v, below.v, color);
  if (fresh.v > 1e-4) color = paintOver(fresh.k / fresh.v, fresh.s / fresh.v, fresh.v, color);
  return color;
}
`;

/**
 * The exchange at one point under the tool, shared by the canvas pass and the
 * tool pass so both sides move the same amount of paint.
 */
const EXCHANGE = /* glsl */ `
uniform vec2 uCanvas;
uniform vec2 uCenter;
uniform vec2 uAxis;
uniform vec2 uHalf;
/** Of the paint on the tool at a point, the share it lets go of in one touch. */
uniform float uDeposit;
/** Of the wet paint on the canvas at a point, the share the tool lifts in one touch. */
uniform float uPickup;
/** How thick a coat the tool can hold before it lifts no more. */
uniform float uCapacity;
/** 0 presses into the paint; toward 1 the tool only catches the canvas's high points. */
uniform float uSkim;
/** The thickness a pressed tool levels paint to; paint above it is scraped off. Below 0, no leveling. */
uniform float uLevel;
/** Of the paint above that level, the share scraped off per touch. */
uniform float uScrape;
/** Of the fresh paint under the tool, the share it stirs into the paint beneath per touch. */
uniform float uChurn;
/** How strongly the tool, lifting away, draws wet paint up into peaks where it touched. */
uniform float uPull;

/** A canvas point in the tool's frame. */
vec2 toolFrame(vec2 p) {
  vec2 d = p - uCenter;
  vec2 along = vec2(-uAxis.y, uAxis.x);
  return vec2(dot(d, uAxis), dot(d, along)) / uHalf;
}

/** A point in the tool's frame, on the canvas. */
vec2 canvasPoint(vec2 q) {
  vec2 along = vec2(-uAxis.y, uAxis.x);
  return uCenter + uAxis * (q.x * uHalf.x) + along * (q.y * uHalf.y);
}

/** Total height of the surface at a canvas point, in paint units. */
float surfaceHeight(vec2 p) {
  vec2 uv = p / uCanvas;
  float paint = texture(uDry, uv).a + texture(uPigment, uv).a + texture(uTopPigment, uv).a;
  return paint + weaveRelief(p, paint);
}

// A tool skimming the surface only meets what stands proud of it: the weave
// of bare canvas, the peaks of paint stippled by the scrubber. On smooth paint
// a lifting brush still breaks up, because its fullest bristles and the grain
// of the paint decide which spots it reaches last.
float relief(vec2 p, float press) {
  if (uSkim <= 0.0) return 1.0;
  float here = surfaceHeight(p);
  float around = 0.25 * (surfaceHeight(p + vec2(3.0, 0.0)) + surfaceHeight(p - vec2(3.0, 0.0))
    + surfaceHeight(p + vec2(0.0, 3.0)) + surfaceHeight(p - vec2(0.0, 3.0)));
  float grain = noise2(p * 0.4, uint(uStrokeSeed) + 31u) - 0.5;
  float proud = here - around + 0.45 * grain + 0.6 * (press - 0.5);
  float level = mix(-0.55, 0.65, uSkim);
  return smoothstep(level - 0.18, level + 0.18, proud);
}

struct Touch { float lay; float lift; float reach; };

/** How strongly the tool lays paint down and lifts it, at a point of contact. */
Touch touchAt(vec2 q, vec2 p) {
  float press = footprint(q);
  press *= relief(p, press);
  Touch touch = Touch(press, press, max(press, reach(q)));
  if (uKind == KNIFE) {
    // Under the flat of the blade paint is lifted; at its edge it is left behind.
    float rim = 1.0 - smoothstep(0.0, 0.18, knifeEdge(q));
    touch.lay = press * (0.45 + 1.4 * rim);
    touch.lift = press * (1.0 - 0.6 * rim);
  }
  return touch;
}

/**
 * How much paint moves at one point: laid from the tool onto the top layer,
 * lifted off the canvas (fresh paint first, then what is beneath, and only
 * as much as is still wet), and stirred from the top layer into the one below.
 */
struct Exchange { float laid; float fromTop; float fromUnder; float churned; };

Exchange exchange(Touch touch, float onTool, Layer below, Layer fresh) {
  float room = clamp(1.0 - onTool / uCapacity, 0.0, 1.0);
  float wetTop = fresh.v * fresh.wet;
  float wetUnder = below.v * below.wet;
  float wet = wetTop + wetUnder;
  float lifted = clamp(touch.lift * uPickup, 0.0, 1.0) * wet * room;
  if (uLevel >= 0.0) {
    float thickness = fresh.v + below.v;
    float excess = max(0.0, thickness - uLevel);
    float wetShare = thickness > 1e-6 ? wet / thickness : 0.0;
    lifted = max(lifted, clamp(touch.reach * uScrape, 0.0, 1.0) * excess * wetShare);
  }
  lifted = min(lifted, wet);
  float fromTop = min(lifted, wetTop);
  float fromUnder = min(lifted - fromTop, wetUnder);
  float laid = clamp(touch.lay * uDeposit, 0.0, 1.0) * onTool;
  float churned = clamp(touch.lift * uChurn, 0.0, 1.0);
  return Exchange(laid, fromTop, fromUnder, churned);
}
`;

const HEADER = '#version 300 es\n';

/**
 * The canvas side of a touch. Drawn over the rectangle the tool covers; for
 * each texel there, take paint from the tool and give some of what was there.
 */
export const DAB = `${HEADER}
${COMMON}
${CANVAS}
uniform sampler2D uToolPigment;
uniform sampler2D uToolScatter;
${FOOTPRINT}
${EXCHANGE}
layout(location = 0) out vec4 outPigment;
layout(location = 1) out vec4 outScatter;
layout(location = 2) out vec4 outTopPigment;
layout(location = 3) out vec4 outTopScatter;

void main() {
  ivec2 texel = ivec2(gl_FragCoord.xy);
  Layer below = underLayer(texel);
  Layer fresh = topLayer(texel);
  writeLayer(below, outPigment, outScatter);
  writeLayer(fresh, outTopPigment, outTopScatter);

  vec2 q = toolFrame(gl_FragCoord.xy);
  if (abs(q.x) > 1.0 || abs(q.y) > 1.0) return;
  Touch touch = touchAt(q, gl_FragCoord.xy);
  if (touch.lay <= 0.0 && touch.reach <= 0.0) return;

  vec2 toolUv = q * 0.5 + 0.5;
  Layer onTool = layer(texture(uToolPigment, toolUv), vec4(texture(uToolScatter, toolUv).rgb, 1.0));
  Exchange moved = exchange(touch, onTool.v, below, fresh);

  below = take(below, moved.fromUnder);
  fresh = take(fresh, moved.fromTop);
  fresh = add(fresh, onTool, moved.laid, 1.0);
  // Working wet paint stirs the fresh coat into what lies beneath it.
  float stirred = moved.churned * fresh.v * fresh.wet;
  below = add(below, fresh, stirred, fresh.wet);
  fresh = take(fresh, stirred);
  // A pad lifting off wet paint pulls it up where its coils were and leaves
  // it thinner between them: the paint does not move far, it stands up.
  if (uPull > 0.0) {
    float raise = 1.0 + uPull * reach(q) * (touch.lift - 0.35);
    below = Layer(below.k * mix(1.0, raise, below.wet), below.s * mix(1.0, raise, below.wet), below.v * mix(1.0, raise, below.wet), below.wet);
    fresh = Layer(fresh.k * mix(1.0, raise, fresh.wet), fresh.s * mix(1.0, raise, fresh.wet), fresh.v * mix(1.0, raise, fresh.wet), fresh.wet);
  }
  writeLayer(below, outPigment, outScatter);
  writeLayer(fresh, outTopPigment, outTopScatter);
}
`;

/**
 * The tool side of the same touch, run over the tool's own textures: give up
 * what was laid, take on what was lifted, and let neighboring bristles share
 * a little of their paint, the way paint creeps through a brush.
 */
export const TOOL = `${HEADER}
${COMMON}
${CANVAS}
uniform sampler2D uToolPigment;
uniform sampler2D uToolScatter;
/** How much paint each point of the tool shares with its neighbors per touch. */
uniform float uShare;
${FOOTPRINT}
${EXCHANGE}
in vec2 vUv;
layout(location = 0) out vec4 outPigment;
layout(location = 1) out vec4 outScatter;

void main() {
  ivec2 texel = ivec2(gl_FragCoord.xy);
  ivec2 size = textureSize(uToolPigment, 0);
  vec4 toolPigment = texelFetch(uToolPigment, texel, 0);
  vec4 toolScatter = texelFetch(uToolScatter, texel, 0);
  if (uShare > 0.0) {
    ivec2 left = ivec2(max(texel.x - 1, 0), texel.y);
    ivec2 right = ivec2(min(texel.x + 1, size.x - 1), texel.y);
    toolPigment = mix(toolPigment, 0.5 * (texelFetch(uToolPigment, left, 0) + texelFetch(uToolPigment, right, 0)), uShare);
    toolScatter = mix(toolScatter, 0.5 * (texelFetch(uToolScatter, left, 0) + texelFetch(uToolScatter, right, 0)), uShare);
  }
  outPigment = toolPigment;
  outScatter = toolScatter;

  vec2 q = vUv * 2.0 - 1.0;
  vec2 p = canvasPoint(q);
  if (p.x < 0.0 || p.y < 0.0 || p.x >= uCanvas.x || p.y >= uCanvas.y) return;
  Touch touch = touchAt(q, p);
  if (touch.lay <= 0.0 && touch.reach <= 0.0) return;

  vec2 uv = p / uCanvas;
  Layer below = underLayerAt(uv);
  Layer fresh = topLayerAt(uv);
  Layer onTool = layer(toolPigment, vec4(toolScatter.rgb, 1.0));
  Exchange moved = exchange(touch, onTool.v, below, fresh);

  onTool = take(onTool, moved.laid);
  onTool = add(onTool, fresh, moved.fromTop, 1.0);
  onTool = add(onTool, below, moved.fromUnder, 1.0);
  outPigment = vec4(onTool.k, onTool.v);
  outScatter = vec4(onTool.s, 0.0);
}
`;

/**
 * Charge a tool with paint: dipped, wiped, or loaded on a palette. A brush
 * takes paint unevenly, more on some clumps of bristles than others and less
 * toward the ferrule; `uKeep` is how much of what it held before stays mixed in.
 */
export const LOAD = `${HEADER}
${COMMON}
uniform sampler2D uToolPigment;
uniform sampler2D uToolScatter;
uniform vec3 uAbsorption;
uniform vec3 uScattering;
uniform float uAmount;
uniform float uKeep;
uniform float uUneven;
uniform float uLoadSeed;
${FOOTPRINT}
in vec2 vUv;
layout(location = 0) out vec4 outPigment;
layout(location = 1) out vec4 outScatter;

void main() {
  ivec2 texel = ivec2(gl_FragCoord.xy);
  vec4 oldPigment = texelFetch(uToolPigment, texel, 0) * uKeep;
  vec4 oldScatter = texelFetch(uToolScatter, texel, 0) * uKeep;
  vec2 q = vUv * 2.0 - 1.0;
  bool bristled = uKind == FLAT || uKind == ROUND;
  float clumps = bristled ? bristles(q.x, max(uShape.x, 4.0)) : 1.0;
  float speckle = noise2(q * 7.0, uint(uLoadSeed));
  float heel = bristled ? smoothstep(-1.0, -0.2, q.y) : 1.0;
  float share = mix(1.0, (0.45 + 0.75 * clumps) * (0.75 + 0.5 * speckle), uUneven) * heel;
  float thickness = uAmount * share;
  outPigment = oldPigment + vec4(uAbsorption * thickness, thickness);
  outScatter = vec4(oldScatter.rgb + uScattering * thickness, 0.0);
}
`;

/**
 * Paint put down without a tool touching it: a drop squeezed from the tube,
 * or a speck flicked off a brush. It lands on top. Whatever fresh paint was
 * already there is pressed into the layer below first, so the new paint sits
 * on it instead of mixing through.
 */
export const DEPOSIT = `${HEADER}
${COMMON}
${CANVAS}
uniform vec2 uCenter;
uniform vec2 uAxis;
uniform vec2 uHalf;
uniform int uShapeKind;
uniform float uThickness;
uniform vec3 uAbsorption;
uniform vec3 uScattering;
uniform float uSeed;
layout(location = 0) out vec4 outPigment;
layout(location = 1) out vec4 outScatter;
layout(location = 2) out vec4 outTopPigment;
layout(location = 3) out vec4 outTopScatter;

// A squeezed drop: a round body, and a peak drawn up toward the tip (y = 1)
// where the nozzle lifted away.
float drop(vec2 q) {
  vec2 body = (q - vec2(0.0, -0.3)) / 0.7;
  float dome = 1.0 - dot(body, body);
  float rise = clamp((q.y + 0.3) / 1.3, 0.0, 1.0);
  float width = mix(0.7, 0.04, rise);
  float peak = (1.0 - (q.x * q.x) / (width * width)) * (1.0 - rise) * step(-0.3, q.y);
  float h = max(dome, peak * 1.15);
  float wobble = 0.92 + 0.08 * noise2(q * 3.0, uint(uSeed));
  return pow(max(h, 0.0), 0.55) * wobble;
}

// A flicked speck: a small oval, heavier at the leading end, with a ragged rim.
float speck(vec2 q) {
  float r = length(q * vec2(1.0, 0.85 + 0.15 * q.y));
  float rim = 0.85 + 0.15 * noise1(atan(q.y, q.x) * 2.0, uint(uSeed));
  return pow(max(1.0 - (r * r) / (rim * rim), 0.0), 0.5);
}

void main() {
  ivec2 texel = ivec2(gl_FragCoord.xy);
  Layer below = underLayer(texel);
  Layer fresh = topLayer(texel);
  vec2 d = gl_FragCoord.xy - uCenter;
  vec2 along = vec2(-uAxis.y, uAxis.x);
  vec2 q = vec2(dot(d, uAxis), dot(d, along)) / uHalf;
  float added = uThickness * (uShapeKind == 0 ? drop(q) : speck(q));
  if (added > 1e-4) {
    below = add(below, fresh, fresh.v, fresh.wet);
    fresh = Layer(uAbsorption * added, uScattering * added, added, 1.0);
  }
  writeLayer(below, outPigment, outScatter);
  writeLayer(fresh, outTopPigment, outTopScatter);
}
`;

/**
 * Drying. Warm air over the canvas takes the water out of the paint; once a
 * layer is dry its paint can no longer be moved, so it is folded into the dry
 * layer as a color and a height, and anything painted later sits over it.
 * Thin paint dries first, and fresh paint only once what is under it has.
 *
 * Two passes share these rules, because one draw cannot write all five
 * textures everywhere: one works out the new dry color, the other the wet
 * layers that are left.
 */
const DRYING = /* glsl */ `
uniform vec2 uCenter;
uniform float uRadius;
uniform float uAmount;

struct Drying { Layer below; Layer fresh; bool belowSets; bool freshSets; };

Drying drying(ivec2 texel) {
  Layer below = underLayer(texel);
  Layer fresh = topLayer(texel);
  float reach = 1.0 - smoothstep(0.55, 1.0, distance(gl_FragCoord.xy, uCenter) / uRadius);
  below.wet = max(0.0, below.wet - uAmount * reach * (0.35 + 1.0 / (0.6 + below.v)));
  fresh.wet = max(0.0, fresh.wet - uAmount * reach * (0.35 + 1.0 / (0.6 + fresh.v)));
  bool belowSets = below.v <= 1e-5 || below.wet < 0.02;
  bool freshSets = belowSets && (fresh.v <= 1e-5 || fresh.wet < 0.02);
  return Drying(below, fresh, belowSets, freshSets);
}
`;

export const DRY_COLOR = `${HEADER}
${COMMON}
${CANVAS}
${DRYING}
out vec4 outDry;

void main() {
  ivec2 texel = ivec2(gl_FragCoord.xy);
  vec4 dry = texelFetch(uDry, texel, 0);
  Drying d = drying(texel);
  if (d.belowSets && d.below.v > 1e-5) {
    dry = vec4(paintOver(d.below.k / d.below.v, d.below.s / d.below.v, d.below.v, dry.rgb), dry.a + d.below.v);
  }
  if (d.freshSets && d.fresh.v > 1e-5) {
    dry = vec4(paintOver(d.fresh.k / d.fresh.v, d.fresh.s / d.fresh.v, d.fresh.v, dry.rgb), dry.a + d.fresh.v);
  }
  outDry = dry;
}
`;

export const DRY_WET = `${HEADER}
${COMMON}
${CANVAS}
${DRYING}
layout(location = 0) out vec4 outPigment;
layout(location = 1) out vec4 outScatter;
layout(location = 2) out vec4 outTopPigment;
layout(location = 3) out vec4 outTopScatter;

void main() {
  Drying d = drying(ivec2(gl_FragCoord.xy));
  // A layer that has set has gone into the dry texture; nothing of it stays wet.
  Layer below = d.below;
  Layer fresh = d.fresh;
  if (d.belowSets) below = EMPTY;
  if (d.freshSets) fresh = EMPTY;
  writeLayer(below, outPigment, outScatter);
  writeLayer(fresh, outTopPigment, outTopScatter);
}
`;

/** A blank canvas, primed with gesso. (The wet layers are cleared beside this pass.) */
export const PRIME = `${HEADER}
${COMMON}
uniform vec3 uGesso;
out vec4 outDry;

void main() {
  // Gesso fills the weave without hiding it, a little irregularly.
  float sizing = noise2(gl_FragCoord.xy / 40.0, 7u);
  outDry = vec4(uGesso * (0.985 + 0.03 * sizing), 0.0);
}
`;

/**
 * The painting as a photograph of it would show: the color of the wet paint
 * over the dry, lit by one soft light from the upper left so every ridge of
 * paint and thread of canvas casts its small shadow, with wet paint shining.
 */
export const DISPLAY = `${HEADER}
${COMMON}
${CANVAS}
uniform vec2 uCanvas;
uniform vec3 uLight;
uniform float uRelief;
in vec2 vUv;
out vec4 outColor;

float heightAt(vec2 uv) {
  float paint = texture(uDry, uv).a + texture(uPigment, uv).a + texture(uTopPigment, uv).a;
  return paint + weaveRelief(uv * uCanvas, paint);
}

vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

void main() {
  Layer below = underLayerAt(vUv);
  Layer fresh = topLayerAt(vUv);
  vec3 color = colorOf(below, fresh, texture(uDry, vUv).rgb);
  float wet = max(below.wet * smoothstep(0.0, 0.4, below.v), fresh.wet * smoothstep(0.0, 0.4, fresh.v));

  vec2 texel = 1.0 / uCanvas;
  float h = heightAt(vUv);
  float left = heightAt(vUv - vec2(texel.x, 0.0));
  float right = heightAt(vUv + vec2(texel.x, 0.0));
  float down = heightAt(vUv - vec2(0.0, texel.y));
  float up = heightAt(vUv + vec2(0.0, texel.y));
  vec3 normal = normalize(vec3((left - right) * uRelief, (down - up) * uRelief, 1.0));

  // Lambert, normalized so flat paint shows its true color, plus a little
  // darkening in the hollows between ridges.
  float facing = dot(normal, uLight) / uLight.z;
  float shade = mix(1.0, facing, 0.85);
  float hollow = clamp(1.0 + 0.35 * (h - 0.25 * (left + right + down + up)), 0.88, 1.06);
  vec3 lit = color * clamp(shade, 0.25, 1.6) * hollow;

  // Acrylic dries to a satin finish; wet, it shines.
  vec3 halfway = normalize(uLight + vec3(0.0, 0.0, 1.0));
  float facingHalf = max(dot(normal, halfway), 0.0);
  float sheen = pow(facingHalf, mix(40.0, 90.0, wet)) * mix(0.06, 0.5, wet);
  lit += vec3(sheen);
  outColor = vec4(toSrgb(lit), 1.0);
}
`;

/**
 * The colors on a tool, for drawing it: a strip across the tool, each pixel
 * the paint on one part of its working edge, laid over the bare tool's own
 * color, with alpha for how loaded it is.
 */
export const PROBE = `${HEADER}
${COMMON}
uniform sampler2D uToolPigment;
uniform sampler2D uToolScatter;
uniform vec3 uBare;
in vec2 vUv;
out vec4 outColor;

vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

void main() {
  vec4 pigment = vec4(0.0);
  vec4 scatter = vec4(0.0);
  for (int i = 0; i < 8; i++) {
    vec2 uv = vec2(vUv.x, 0.3 + 0.4 * float(i) / 7.0);
    pigment += texture(uToolPigment, uv);
    scatter += texture(uToolScatter, uv);
  }
  pigment /= 8.0;
  scatter /= 8.0;
  vec3 color = uBare;
  if (pigment.a > 1e-4) color = paintOver(pigment.rgb / pigment.a, scatter.rgb / pigment.a, pigment.a, uBare);
  outColor = vec4(toSrgb(color), clamp(pigment.a / 2.0, 0.0, 1.0));
}
`;
