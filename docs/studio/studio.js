"use strict";(()=>{var yo=Object.create;var ct=Object.defineProperty;var xo=Object.getOwnPropertyDescriptor;var wo=Object.getOwnPropertyNames;var go=Object.getPrototypeOf,vo=Object.prototype.hasOwnProperty;var To=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var So=(e,t,o,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of wo(t))!vo.call(e,n)&&n!==o&&ct(e,n,{get:()=>t[n],enumerable:!(r=xo(t,n))||r.enumerable});return e};var Po=(e,t,o)=>(o=e!=null?yo(go(e)):{},So(t||!e||!e.__esModule?ct(o,"default",{value:e,enumerable:!0}):o,e));var Ct=To((rr,Bt)=>{"use strict";var te=function(e){e==null&&(e=new Date().getTime()),this.N=624,this.M=397,this.MATRIX_A=2567483615,this.UPPER_MASK=2147483648,this.LOWER_MASK=2147483647,this.mt=new Array(this.N),this.mti=this.N+1,e.constructor==Array?this.init_by_array(e,e.length):this.init_seed(e)};te.prototype.init_seed=function(e){for(this.mt[0]=e>>>0,this.mti=1;this.mti<this.N;this.mti++){var e=this.mt[this.mti-1]^this.mt[this.mti-1]>>>30;this.mt[this.mti]=(((e&4294901760)>>>16)*1812433253<<16)+(e&65535)*1812433253+this.mti,this.mt[this.mti]>>>=0}};te.prototype.init_by_array=function(e,t){var o,r,n;for(this.init_seed(19650218),o=1,r=0,n=this.N>t?this.N:t;n;n--){var s=this.mt[o-1]^this.mt[o-1]>>>30;this.mt[o]=(this.mt[o]^(((s&4294901760)>>>16)*1664525<<16)+(s&65535)*1664525)+e[r]+r,this.mt[o]>>>=0,o++,r++,o>=this.N&&(this.mt[0]=this.mt[this.N-1],o=1),r>=t&&(r=0)}for(n=this.N-1;n;n--){var s=this.mt[o-1]^this.mt[o-1]>>>30;this.mt[o]=(this.mt[o]^(((s&4294901760)>>>16)*1566083941<<16)+(s&65535)*1566083941)-o,this.mt[o]>>>=0,o++,o>=this.N&&(this.mt[0]=this.mt[this.N-1],o=1)}this.mt[0]=2147483648};te.prototype.random_int=function(){var e,t=new Array(0,this.MATRIX_A);if(this.mti>=this.N){var o;for(this.mti==this.N+1&&this.init_seed(5489),o=0;o<this.N-this.M;o++)e=this.mt[o]&this.UPPER_MASK|this.mt[o+1]&this.LOWER_MASK,this.mt[o]=this.mt[o+this.M]^e>>>1^t[e&1];for(;o<this.N-1;o++)e=this.mt[o]&this.UPPER_MASK|this.mt[o+1]&this.LOWER_MASK,this.mt[o]=this.mt[o+(this.M-this.N)]^e>>>1^t[e&1];e=this.mt[this.N-1]&this.UPPER_MASK|this.mt[0]&this.LOWER_MASK,this.mt[this.N-1]=this.mt[this.M-1]^e>>>1^t[e&1],this.mti=0}return e=this.mt[this.mti++],e^=e>>>11,e^=e<<7&2636928640,e^=e<<15&4022730752,e^=e>>>18,e>>>0};te.prototype.random_int31=function(){return this.random_int()>>>1};te.prototype.random_incl=function(){return this.random_int()*(1/4294967295)};te.prototype.random=function(){return this.random_int()*(1/4294967296)};te.prototype.random_excl=function(){return(this.random_int()+.5)*(1/4294967296)};te.prototype.random_long=function(){var e=this.random_int()>>>5,t=this.random_int()>>>6;return(e*67108864+t)*(1/9007199254740992)};Bt.exports=te});function ht(e){let t=e.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!0});if(!t)throw new Error("This browser has no WebGL2, which the paint simulation needs.");if(!t.getExtension("EXT_color_buffer_float"))throw new Error("This GPU cannot render to float textures, which the paint simulation needs.");return t}var Mo={rgba16f:WebGL2RenderingContext.RGBA16F,rgba8:WebGL2RenderingContext.RGBA8};function se(e,t,o,r="rgba16f"){let n=e.createTexture();e.bindTexture(e.TEXTURE_2D,n),e.texStorage2D(e.TEXTURE_2D,1,Mo[r],t,o),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);let s=e.createFramebuffer();e.bindFramebuffer(e.FRAMEBUFFER,s),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,n,0);let i=e.checkFramebufferStatus(e.FRAMEBUFFER);if(e.bindFramebuffer(e.FRAMEBUFFER,null),i!==e.FRAMEBUFFER_COMPLETE)throw new Error(`A ${t}\xD7${o} ${r} render target is incomplete (0x${i.toString(16)}).`);return{texture:n,framebuffer:s,width:t,height:o}}function ue(e,t){e.deleteFramebuffer(t.framebuffer),e.deleteTexture(t.texture)}function Pe(e,t){let o=e.createFramebuffer();e.bindFramebuffer(e.FRAMEBUFFER,o),t.forEach((n,s)=>{e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+s,e.TEXTURE_2D,n.texture,0)}),e.drawBuffers(t.map((n,s)=>e.COLOR_ATTACHMENT0+s));let r=e.checkFramebufferStatus(e.FRAMEBUFFER);if(e.bindFramebuffer(e.FRAMEBUFFER,null),r!==e.FRAMEBUFFER_COMPLETE)throw new Error(`A ${t.length}-target framebuffer is incomplete (0x${r.toString(16)}).`);return o}function Ne(e,t,o,r,n,s,i){e.bindFramebuffer(e.READ_FRAMEBUFFER,t.framebuffer),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,o.framebuffer),e.blitFramebuffer(r,n,r+s,n+i,r,n,r+s,n+i,e.COLOR_BUFFER_BIT,e.NEAREST),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null)}var Eo=`#version 300 es
in vec2 aCorner;
out vec2 vUv;
void main() {
  vUv = aCorner * 0.5 + 0.5;
  gl_Position = vec4(aCorner, 0.0, 1.0);
}
`;function Q(e,t,o=Eo){let r=(h,c)=>{let d=e.createShader(h);if(!d)throw new Error("could not create a shader");if(e.shaderSource(d,c),e.compileShader(d),!e.getShaderParameter(d,e.COMPILE_STATUS)){let w=e.getShaderInfoLog(d)??"";throw e.deleteShader(d),new Error(`${h===e.VERTEX_SHADER?"Vertex":"Fragment"} shader:
${w}
${Ro(c)}`)}return d},n=e.createProgram(),s=r(e.VERTEX_SHADER,o),i=r(e.FRAGMENT_SHADER,t);if(e.attachShader(n,s),e.attachShader(n,i),e.bindAttribLocation(n,0,"aCorner"),e.linkProgram(n),!e.getProgramParameter(n,e.LINK_STATUS))throw new Error(`Program link:
${e.getProgramInfoLog(n)??""}`);e.deleteShader(s),e.deleteShader(i);let l=new Map,u=h=>(l.has(h)||l.set(h,e.getUniformLocation(n,h)),l.get(h)??null);return{handle:n,use:()=>e.useProgram(n),set(h,c){let d=u(h);if(!d)return;if(typeof c=="number"){e.uniform1f(d,c);return}let w=c instanceof Float32Array?c:new Float32Array(c);w.length===2?e.uniform2fv(d,w):w.length===3?e.uniform3fv(d,w):w.length===4?e.uniform4fv(d,w):e.uniform1fv(d,w)},setInt(h,c){let d=u(h);d&&(typeof c=="number"?e.uniform1i(d,c):c.length===2?e.uniform2iv(d,c):e.uniform1iv(d,c))},texture(h,c,d){e.activeTexture(e.TEXTURE0+c),e.bindTexture(e.TEXTURE_2D,d);let w=u(h);w&&e.uniform1i(w,c)}}}var Ro=e=>e.split(`
`).map((t,o)=>`${String(o+1).padStart(4)}  ${t}`).join(`
`);function ft(e){let t=e.createVertexArray(),o=e.createBuffer();return e.bindVertexArray(t),e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindVertexArray(null),()=>{e.bindVertexArray(t),e.drawArrays(e.TRIANGLE_STRIP,0,4)}}var He={titaniumWhite:{name:"Titanium white",masstone:"#f6f5f0",scattering:1},skyBlue:{name:"Sky blue",masstone:"#4aa6dc",scattering:.8},cobaltBlue:{name:"Cobalt blue",masstone:"#1f4fb4",scattering:.35},prussianBlue:{name:"Prussian blue",masstone:"#0f1d4c",scattering:.12},cadmiumYellow:{name:"Cadmium yellow",masstone:"#f7c41a",scattering:.5},yellowOchre:{name:"Yellow ochre",masstone:"#c8961e",scattering:.6},burntSienna:{name:"Burnt sienna",masstone:"#9a3a16",scattering:.35},sapGreen:{name:"Sap green",masstone:"#1f6b2c",scattering:.25},phthaloGreen:{name:"Phthalo green",masstone:"#0d3c39",scattering:.1},burntUmber:{name:"Burnt umber",masstone:"#3a2416",scattering:.3},marsBlack:{name:"Mars black",masstone:"#121212",scattering:.35}},We=e=>e<=.04045?e/12.92:((e+.055)/1.055)**2.4,Ao=e=>e<=.0031308?e*12.92:1.055*e**(1/2.4)-.055;function Me(e){let t=Number.parseInt(e.replace("#",""),16);return[We((t>>16&255)/255),We((t>>8&255)/255),We((t&255)/255)]}function Ee(e){let t=o=>Math.round(Math.min(1,Math.max(0,Ao(o)))*255).toString(16).padStart(2,"0");return`#${t(e[0])}${t(e[1])}${t(e[2])}`}function Lo(e){let t=e.scattering*4;return{absorption:Me(e.masstone).map(n=>{let s=Math.min(.999,Math.max(.001,n));return(1-s)**2/(2*s)*t}),scattering:[t,t,t]}}function Re(e){let t=[0,0,0],o=[0,0,0],r=0,n=(s,i,l)=>[s[0]+l*i[0],s[1]+l*i[1],s[2]+l*i[2]];for(let[s,i]of Object.entries(e)){if(!i)continue;let l=Lo(He[s]);t=n(t,l.absorption,i),o=n(o,l.scattering,i),r+=i}if(r===0)throw new Error("a mix needs at least one paint");return{absorption:t.map(s=>s/r),scattering:o.map(s=>s/r)}}function ko(e,t,o){return[0,1,2].map(r=>{let n=e.absorption[r],s=Math.max(1e-4,e.scattering[r]),i=o[r],l=1+n/s,u=Math.sqrt(l*l-1),h=Math.tanh(u*s*t);return(h*(1-i*l)+i*u)/(h*(l-i)+u)})}var Ae=e=>ko(Re(e),1e3,[0,0,0]);var Z=`
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
`,$e=`
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
`,de=`
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
`,dt=`
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
`,ee=`#version 300 es
`,pt=`${ee}
${Z}
${de}
uniform sampler2D uToolPigment;
uniform sampler2D uToolScatter;
${$e}
${dt}
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
`,mt=`${ee}
${Z}
${de}
uniform sampler2D uToolPigment;
uniform sampler2D uToolScatter;
/** How much paint each point of the tool shares with its neighbors per touch. */
uniform float uShare;
${$e}
${dt}
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
`,bt=`${ee}
${Z}
uniform sampler2D uToolPigment;
uniform sampler2D uToolScatter;
uniform vec3 uAbsorption;
uniform vec3 uScattering;
uniform float uAmount;
uniform float uKeep;
uniform float uUneven;
uniform float uLoadSeed;
${$e}
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
`,yt=`${ee}
${Z}
${de}
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
`,xt=`
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
`,wt=`${ee}
${Z}
${de}
${xt}
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
`,gt=`${ee}
${Z}
${de}
${xt}
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
`,vt=`${ee}
${Z}
uniform vec3 uGesso;
out vec4 outDry;

void main() {
  // Gesso fills the weave without hiding it, a little irregularly.
  float sizing = noise2(gl_FragCoord.xy / 40.0, 7u);
  outDry = vec4(uGesso * (0.985 + 0.03 * sizing), 0.0);
}
`,Tt=`${ee}
${Z}
${de}
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
`,St=`${ee}
${Z}
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
`;var Pt={flat:0,round:1,knife:2,scrubber:3,comb:4,swab:5,bundle:6,cotton:7},ye=["pigment","scatter","topPigment","topScatter"],Le=[...ye,"dry"],Bo="#eeece6",Co=18,_o=(()=>{let e=[-.42,.5,.76],t=Math.hypot(...e);return e.map(o=>o/t)})();function Mt(e,t,o,r){let n=ft(e),s={dab:Q(e,pt),tool:Q(e,mt),load:Q(e,bt),deposit:Q(e,yt),dryColor:Q(e,wt),dryWet:Q(e,gt),prime:Q(e,vt),display:Q(e,Tt),probe:Q(e,St)},i=r/Co,l=()=>({pigment:se(e,t,o),scatter:se(e,t,o),topPigment:se(e,t,o),topScatter:se(e,t,o),dry:se(e,t,o)}),u=l(),h=l(),c=Pe(e,ye.map(a=>h[a])),d=null,w=(a,m,f,b)=>{let x=Math.max(0,Math.floor(a)-2),E=Math.max(0,Math.floor(m)-2),P=Math.min(t,Math.ceil(f)+2),H=Math.min(o,Math.ceil(b)+2);return P<=x||H<=E?null:{x,y:E,w:P-x,h:H-E}},y=(a,m,f,b,x,E)=>{let P=Math.abs(f)*x+Math.abs(b)*E,H=Math.abs(b)*x+Math.abs(f)*E;return w(a-P,m-H,a+P,m+H)},v=(a,m)=>{for(let f of m)Ne(e,h[f],u[f],a.x,a.y,a.w,a.h)},L=(a,m)=>{e.bindFramebuffer(e.FRAMEBUFFER,a),e.viewport(0,0,t,o),e.enable(e.SCISSOR_TEST),e.scissor(m.x,m.y,m.w,m.h),n(),e.disable(e.SCISSOR_TEST),e.bindFramebuffer(e.FRAMEBUFFER,null)},k=a=>{a.texture("uPigment",0,u.pigment.texture),a.texture("uScatter",1,u.scatter.texture),a.texture("uTopPigment",2,u.topPigment.texture),a.texture("uTopScatter",3,u.topScatter.texture),a.texture("uDry",4,u.dry.texture)},C=(a,m,f)=>{let{body:b}=m;a.setInt("uKind",Pt[b.kind]),a.set("uToolSeed",b.seed%16777216),a.set("uStrokeSeed",f.strokeSeed%16777216),a.set("uDabSeed",f.dabSeed%16777216),a.set("uPressure",f.pressure),a.set("uTwist",f.twist??0),a.set("uShape",b.shape),_(a,b),a.set("uCanvas",[t,o]),a.set("uCenter",[f.x,f.y]),a.set("uAxis",[f.axisX,f.axisY]),a.set("uHalf",[f.halfAcross,f.halfAlong]),a.set("uDeposit",f.deposit??b.deposit),a.set("uPickup",f.pickup??b.pickup),a.set("uCapacity",b.capacity),a.set("uSkim",f.skim),a.set("uLevel",f.level??b.level??-1),a.set("uScrape",f.scrape??b.scrape??0),a.set("uChurn",b.churn),a.set("uPull",b.pull??0),a.set("uWeavePitch",i)},_=(a,m)=>{let f=m.swabs??[];if(a.setInt("uSwabCount",f.length),!f.length)return;let b=e.getUniformLocation(a.handle,"uSwabs");b&&e.uniform3fv(b,new Float32Array(f.flat()))},p=()=>{e.disable(e.SCISSOR_TEST);for(let a of ye)e.bindFramebuffer(e.FRAMEBUFFER,u[a].framebuffer),e.clearBufferfv(e.COLOR,0,[0,0,0,0]);e.bindFramebuffer(e.FRAMEBUFFER,u.dry.framebuffer),e.viewport(0,0,t,o),s.prime.use(),s.prime.set("uGesso",Me(Bo)),s.prime.set("uWeavePitch",i),n(),e.bindFramebuffer(e.FRAMEBUFFER,null)},g=a=>{let[m,f]=a.resolution,b=()=>se(e,m,f),x=b(),E=b(),P=b(),H=b(),fe={body:a,pigment:x,scatter:E,nextPigment:P,nextScatter:H,framebuffer:Pe(e,[x,E]),nextFramebuffer:Pe(e,[P,H])};return B(fe),fe},T=a=>{[a.pigment,a.nextPigment]=[a.nextPigment,a.pigment],[a.scatter,a.nextScatter]=[a.nextScatter,a.scatter],[a.framebuffer,a.nextFramebuffer]=[a.nextFramebuffer,a.framebuffer]},B=a=>{e.disable(e.SCISSOR_TEST),e.bindFramebuffer(e.FRAMEBUFFER,a.framebuffer),e.viewport(0,0,a.pigment.width,a.pigment.height),e.clearBufferfv(e.COLOR,0,[0,0,0,0]),e.clearBufferfv(e.COLOR,1,[0,0,0,0]),e.bindFramebuffer(e.FRAMEBUFFER,null)},S=(a,m,f,b={})=>{let{absorption:x,scattering:E}=Re(m),P=s.load;e.disable(e.SCISSOR_TEST),e.bindFramebuffer(e.FRAMEBUFFER,a.nextFramebuffer),e.viewport(0,0,a.pigment.width,a.pigment.height),P.use(),P.texture("uToolPigment",5,a.pigment.texture),P.texture("uToolScatter",6,a.scatter.texture),P.set("uAbsorption",x),P.set("uScattering",E),P.set("uAmount",f),P.set("uKeep",b.keep??0),P.set("uUneven",b.uneven??.6),P.set("uLoadSeed",(b.seed??1)%16777216),P.setInt("uKind",Pt[a.body.kind]),P.set("uToolSeed",a.body.seed%16777216),P.set("uStrokeSeed",(b.seed??1)%16777216),P.set("uShape",a.body.shape),n(),e.bindFramebuffer(e.FRAMEBUFFER,null),T(a)},A=(a,m)=>{let f=y(m.x,m.y,m.axisX,m.axisY,m.halfAcross,m.halfAlong);if(!f)return;let b=s.dab;b.use(),k(b),b.texture("uToolPigment",5,a.pigment.texture),b.texture("uToolScatter",6,a.scatter.texture),C(b,a,m),L(c,f),e.bindFramebuffer(e.FRAMEBUFFER,a.nextFramebuffer),e.viewport(0,0,a.pigment.width,a.pigment.height);let x=s.tool;x.use(),k(x),x.texture("uToolPigment",5,a.pigment.texture),x.texture("uToolScatter",6,a.scatter.texture),x.set("uShare",a.body.share),C(x,a,m),n(),e.bindFramebuffer(e.FRAMEBUFFER,null),v(f,ye),T(a)},R=a=>{let m=y(a.x,a.y,a.axisX,a.axisY,a.halfAcross,a.halfAlong);if(!m)return;let{absorption:f,scattering:b}=Re(a.mix),x=s.deposit;x.use(),k(x),x.set("uCenter",[a.x,a.y]),x.set("uAxis",[a.axisX,a.axisY]),x.set("uHalf",[a.halfAcross,a.halfAlong]),x.setInt("uShapeKind",a.shape==="drop"?0:1),x.set("uThickness",a.thickness),x.set("uAbsorption",f),x.set("uScattering",b),x.set("uSeed",a.seed%16777216),L(c,m),v(m,ye)},O=(a,m,f,b)=>{let x=w(a-f,m-f,a+f,m+f);if(!x)return;let E=[[s.dryColor,h.dry.framebuffer],[s.dryWet,c]];for(let[P,H]of E)P.use(),k(P),P.set("uCenter",[a,m]),P.set("uRadius",f),P.set("uAmount",b),L(H,x);v(x,Le)},q=(a={})=>{let m=s.display;m.use(),k(m),m.set("uCanvas",[t,o]),m.set("uLight",_o),m.set("uRelief",a.relief??.9),m.set("uWeavePitch",i),n()},I=(a,m)=>{(!d||d.width!==m)&&(d&&ue(e,d),d=se(e,m,1,"rgba8")),e.bindFramebuffer(e.FRAMEBUFFER,d.framebuffer),e.viewport(0,0,m,1),e.disable(e.SCISSOR_TEST);let f=s.probe;f.use(),f.texture("uToolPigment",5,a.pigment.texture),f.texture("uToolScatter",6,a.scatter.texture),f.set("uBare",Me(a.body.bare)),n();let b=new Uint8Array(m*4);return e.readPixels(0,0,m,1,e.RGBA,e.UNSIGNED_BYTE,b),e.bindFramebuffer(e.FRAMEBUFFER,null),b},M=(a,m)=>{for(let f of Le)Ne(e,a[f],m[f],0,0,t,o)};return{width:t,height:o,prime:p,createTool:g,load:S,clean:B,touch:A,deposit:R,dry:O,render:q,probe:I,snapshot(){let a=l();return M(u,a),a},restore(a){M(a,u)},release(a){for(let m of Le)ue(e,a[m])},releaseTool(a){for(let m of[a.pigment,a.scatter,a.nextPigment,a.nextScatter])ue(e,m);e.deleteFramebuffer(a.framebuffer),e.deleteFramebuffer(a.nextFramebuffer)},destroy(){for(let a of Le)ue(e,u[a]),ue(e,h[a]);d&&ue(e,d),e.deleteFramebuffer(c);for(let a of Object.values(s))e.deleteProgram(a.handle)}}}var Do=(()=>{let e=[],t=[{count:8,radius:.78,spread:1.05},{count:7,radius:.52,spread:.95},{count:4,radius:.27,spread:.8}];for(let o of t)for(let r=0;r<o.count;r++){let n=Math.PI/2+(r/(o.count-1)-.5)*2*o.spread;e.push([Math.cos(n)*o.radius,Math.sin(n)*o.radius-.35,.075])}return e})(),ae={tube:{name:"tube",label:"Paint, straight from the tube",width:.52,depth:.72,lightDepth:1,spacing:1,speed:6},wideBrush:{name:"wideBrush",label:"Two-inch flat brush",body:{kind:"flat",seed:2101,shape:[26,0,0,0],deposit:.09,pickup:.18,capacity:36,level:2,scrape:.6,churn:.3,share:.05,bare:"#9a8c74",resolution:[256,48]},width:2,depth:.42,lightDepth:.55,spacing:.22,speed:9},knife:{name:"knife",label:"Painting knife",body:{kind:"knife",seed:3301,shape:[0,0,0,0],deposit:.2,pickup:.25,capacity:40,level:1.6,scrape:.55,churn:.25,share:0,bare:"#b9bcc0",resolution:[80,160]},width:.62,depth:1.35,lightDepth:.8,spacing:.06,speed:4},flatBrush:{name:"flatBrush",label:"One-inch flat brush",body:{kind:"flat",seed:1102,shape:[15,0,0,0],deposit:.1,pickup:.16,capacity:30,level:2,scrape:.55,churn:.3,share:.05,bare:"#a39377",resolution:[160,40]},width:1,depth:.3,lightDepth:.6,spacing:.22,speed:7},scrubber:{name:"scrubber",label:"Steel-wool scrubber on a jar lid",body:{kind:"scrubber",seed:4401,shape:[12,0,0,0],deposit:.3,pickup:.1,capacity:3,churn:.3,pull:.5,share:0,bare:"#8f9396",resolution:[192,192]},width:2.6,depth:2.6,lightDepth:.9,spacing:1,speed:30},trunkBrush:{name:"trunkBrush",label:"Half-inch flat brush",body:{kind:"flat",seed:5502,shape:[8,0,0,0],deposit:.05,pickup:.03,capacity:30,churn:.04,share:.04,bare:"#8e8068",resolution:[96,40]},width:.42,depth:.2,lightDepth:.6,spacing:.25,speed:7},spatter:{name:"spatter",label:"Round brush, tapped on a handle",width:.3,depth:.3,lightDepth:1,spacing:1,speed:10},comb:{name:"comb",label:"Fine-tooth comb",body:{kind:"comb",seed:6601,shape:[16,.22,0,0],deposit:.28,pickup:.05,capacity:6,churn:.02,share:0,bare:"#2a2a2c",resolution:[192,16]},width:1.05,depth:.07,lightDepth:.7,spacing:.5,speed:6},liner:{name:"liner",label:"Liner brush",body:{kind:"round",seed:7702,shape:[3,.9,0,0],deposit:.3,pickup:.03,capacity:8,churn:0,share:.05,bare:"#c9b18a",resolution:[24,24]},width:.07,depth:.07,lightDepth:.45,spacing:.3,speed:3.5},dryer:{name:"dryer",label:"Hair dryer",width:5,depth:5,lightDepth:1,spacing:.08,speed:4},cotton:{name:"cotton",label:"Cotton ball in a clothespin",body:{kind:"cotton",seed:8801,shape:[0,0,0,0],deposit:.34,pickup:.05,capacity:8,churn:.05,share:0,bare:"#f2f0ea",resolution:[96,96]},width:.8,depth:.8,lightDepth:.8,spacing:1,speed:12},swab:{name:"swab",label:"Cotton swab",body:{kind:"swab",seed:9901,shape:[0,0,0,0],deposit:.7,pickup:.03,capacity:8,churn:0,share:0,bare:"#f4f2ec",resolution:[32,32]},width:.19,depth:.19,lightDepth:.85,spacing:1,speed:12},bundle:{name:"bundle",label:"Bundle of cotton swabs",body:{kind:"bundle",seed:9911,shape:[0,0,0,0],swabs:Do,deposit:.65,pickup:.03,capacity:8,churn:0,share:0,bare:"#f4f2ec",resolution:[160,160]},width:1.7,depth:1.7,lightDepth:1,spacing:1,speed:12}};function Et(e){let t=new Map,o=r=>{let n=t.get(r);if(!n){let s=ae[r].body;if(!s)throw new Error(`${r} does not touch the canvas`);n=e.createTool(s),t.set(r,n)}return n};return{apply(r){switch(r.kind){case"touch":e.touch(o(r.tool),r.touch);return;case"load":e.load(o(r.tool),r.mix,r.amount,{keep:r.keep,seed:r.seed});return;case"clean":e.clean(o(r.tool));return;case"deposit":e.deposit(r.deposit);return;case"dry":e.dry(r.x,r.y,r.radius,r.amount);return}},held:r=>t.get(r),reset(){e.prime();for(let r of t.values())e.clean(r)}}}var Rt=.8,Oo=32,Ke=.07,At=.3,Uo=.25,Lt={x:2.5,y:2};function ke(...e){let t=2166136261;for(let o of e)t^=o>>>0,t=Math.imul(t,16777619),t^=t>>>13;return(t>>>0)%16777216}function kt(e,t){let o=Math.round(e.width*t),r=Math.round(e.height*t),n=[],s=[],i=[],l={x:e.width+Lt.x,y:e.height+Lt.y},u=0,h=0,c={time:0,tool:"tube",...l,angle:0,lift:1,pressure:0},d=p=>({x:p.x*t,y:(e.height-p.y)*t}),w=(p,g=u)=>n.push({...p,time:g,step:h}),y=p=>{c={...c,...p,time:u},s.push(c)},v=(p,g)=>{c.lift<1&&(u+=Ke/g,y({lift:1,pressure:0}));let T=Math.hypot(p.x-c.x,p.y-c.y);T>.001&&(u+=Math.min(.6,.05+T/Oo)/g,y({x:p.x,y:p.y}))},L=(p,g)=>{u+=Ke/p,y({lift:0,pressure:g})};for(let[p,g]of e.steps.entries()){h=p;let T=u,B=ae[g.tool],S=g.pace??1;c.tool!==g.tool&&(u+=Rt/2,y({...l,lift:1}),c={...c,tool:g.tool},y({}));for(let[A,R]of g.gestures.entries()){let O=ke(p,A,1);k(R,B,S,O)}c.lift<1&&(u+=Ke/S,y({lift:1,pressure:0})),u+=Uo,y({}),i.push({start:T,end:u})}u+=Rt/2,y({...l,lift:1});function k(p,g,T,B){switch(p.kind){case"load":u+=At/T,y({lift:1}),w({kind:"load",tool:g.name,mix:p.mix,amount:p.amount,keep:p.keep??0,seed:B});return;case"clean":u+=At/T,y({lift:1}),w({kind:"clean",tool:g.name});return;case"drop":{y({paint:Ee(Ae(p.mix))}),v(p.at,T),L(T,1);let S=d(p.at),A=p.size,R=p.angle??0;w({kind:"deposit",deposit:{shape:"drop",...S,axisX:Math.cos(R),axisY:Math.sin(R),halfAcross:g.width/2*A*t,halfAlong:g.depth/2*A*t,thickness:22*Math.sqrt(A),mix:p.mix,seed:B}}),u+=.12/T,y({});return}case"flick":{v(p.from,T),u+=.1/T,y({pressure:1});for(let S of p.specks){let A=d(S),R=Math.hypot(S.x-p.from.x,S.y-p.from.y);w({kind:"deposit",deposit:{shape:"speck",...A,axisX:Math.cos(-S.angle),axisY:Math.sin(-S.angle),halfAcross:S.radius*t,halfAlong:S.radius*1.1*t,thickness:4,mix:p.mix,seed:ke(B,Math.round(S.x*1e3),Math.round(S.y*1e3))}},u+R/40/T)}u+=.2/T,y({pressure:0});return}case"dry":{let[S,...A]=p.path;if(!S)return;v(S,T),y({lift:1});let R=S;for(let O of A){let q=Math.hypot(O.x-R.x,O.y-R.y),I=Math.max(1,Math.ceil(q/(g.width*g.spacing)));for(let M=1;M<=I;M++){let a={x:R.x+(O.x-R.x)*M/I,y:R.y+(O.y-R.y)*M/I};u+=q/I/g.speed/T,y({x:a.x,y:a.y,angle:Math.atan2(O.y-R.y,O.x-R.x)});let m=d(a);w({kind:"dry",...m,radius:g.width*.5*t,amount:.22})}R=O}return}case"press":{v(p.at,T),L(T,p.pressure);let S=d(p.at),A=p.angle??0,R=g.lightDepth+(1-g.lightDepth)*p.pressure;y({angle:A}),w({kind:"touch",tool:g.name,touch:{...S,axisX:Math.cos(A),axisY:-Math.sin(A),halfAcross:g.width/2*R*t,halfAlong:g.depth/2*R*t,pressure:p.pressure,skim:p.skim??0,strokeSeed:B,dabSeed:ke(B,7),deposit:p.deposit,pickup:p.pickup,level:p.level,scrape:p.scrape,twist:p.twist}}),u+=.05/T,y({});return}case"stroke":C(p,g,T,B);return}}function C(p,g,T,B){let S=p.points,A=S[0];if(!A||S.length<2)return;let R=g.body?.kind;v(A,T),L(T,A.pressure);let O=0;for(let I=0;I<S.length-1;I++){let M=S[I],a=S[I+1],m=Math.hypot(a.x-M.x,a.y-M.y);if(m<1e-4)continue;let f=Math.atan2(a.y-M.y,a.x-M.x),b=(a.x-M.x)/m,x=-(a.y-M.y)/m,E=(M.pressure+a.pressure)/2,P=g.depth*(g.lightDepth+(1-g.lightDepth)*E),H=Math.max(.004,P*g.spacing),fe=Math.max(1,Math.ceil(m/H));for(let Ie=0;Ie<fe;Ie++){let Ge=Ie/fe,qe={x:M.x+(a.x-M.x)*Ge,y:M.y+(a.y-M.y)*Ge},lt=M.pressure+(a.pressure-M.pressure)*Ge;u+=m/fe/g.speed/T,y({x:qe.x,y:qe.y,angle:f,lift:0,pressure:lt}),w({kind:"touch",tool:g.name,touch:_(g,d(qe),b,x,lt,p,B,O++,R)})}}let q=S[S.length-1];y({x:q.x,y:q.y})}function _(p,g,T,B,S,A,R,O,q){let I=p.lightDepth+(1-p.lightDepth)*S,M=p.width/2*t,a=p.depth/2*I*t;q==="round"&&(M*=.35+.65*S),q==="flat"&&(M*=.7+.3*S),A.edge&&([M,a]=[Math.max(a*.6,1.5),M]);let m=q==="flat"||q==="round"?Math.min(1,Math.max(0,(.45-S)/.35))*.8:0,f=A.tilt??0,b=B*Math.cos(f)+T*Math.sin(f),x=-T*Math.cos(f)+B*Math.sin(f);return{...g,axisX:b,axisY:x,halfAcross:M,halfAlong:a,pressure:S,skim:Math.max(A.skim??0,m),strokeSeed:R,dabSeed:ke(R,O),deposit:A.deposit,pickup:A.pickup,level:A.level,scrape:A.scrape}}return n.sort((p,g)=>p.time-g.time),{duration:u,steps:i,events:n,poses:s,width:o,height:r,texelsPerInch:t}}function Ye(e,t){let{poses:o}=e,r=0,n=o.length-1;if(n<0)throw new Error("a timeline with no poses");if(t<=o[0].time)return o[0];if(t>=o[n].time)return o[n];for(;n-r>1;){let d=r+n>>1;o[d].time<=t?r=d:n=d}let s=o[r],i=o[n],l=i.time-s.time,u=l>0?(t-s.time)/l:1,h=s.lift>.5&&i.lift>.5?u*u*(3-2*u):u,c=((i.angle-s.angle)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI;return{time:t,tool:u<1?s.tool:i.tool,paint:u<1?s.paint:i.paint,x:s.x+(i.x-s.x)*h,y:s.y+(i.y-s.y)*h,angle:s.angle+c*h,lift:s.lift+(i.lift-s.lift)*u,pressure:s.pressure+(i.pressure-s.pressure)*u}}function Fe(e,t){let{events:o}=e,r=0,n=o.length;for(;r<n;){let s=r+n>>1;o[s].time<t?r=s+1:n=s}return r}function Xe(e,t){let o=e.steps.findIndex(r=>t<r.end);return o===-1?e.steps.length-1:o}var Io=2,Go=240,qo=24;function Ft(e){let{timeline:t,surface:o,performer:r,present:n,drawTool:s,onChange:i}=e,{events:l,steps:u}=t,h=t.duration,c=0,d=0,w=!1,y=1,v=null,L=0,k=Go,C=0,_=0,p=!0,g="",T=new Map,B=[];r.reset();let S=()=>c<l.length?Math.min(d,(l[c]?.time??h)-1e-6):d,A=()=>({time:S(),step:Xe(t,S()),playing:w,speed:y,seeking:v===null?null:Math.min(1,(S()-L)/Math.max(1e-6,v-L)),finished:c>=l.length&&d>=h-.5}),R=()=>{let f=A(),b=`${f.step} ${f.playing} ${f.speed} ${f.seeking?.toFixed(2)} ${f.finished} ${Math.floor(f.time)}`;b!==g&&(g=b,i(f))},O=f=>{if(f===0||T.has(f))return;T.set(f,o.snapshot());let b=[...T.keys()].sort((x,E)=>x-E);for(;b.length>Io;){let x=b.shift();o.release(T.get(x)),T.delete(x)}},q=(f,b)=>{let x=0;for(;c<l.length;){let E=l[c];if(!E||E.time>f)return!0;if(x>=b)return!1;let P=l[c-1];P&&P.step!==E.step&&O(E.step),r.apply(E),c++,x++}return!0},I=f=>{_=0;let b=C?f-C:16;if(C=f,b>qo?k=Math.max(16,k*.8):k=Math.min(6e3,k*1.08+4),v!==null){let x=q(v,Math.round(k*4));d=x?v:l[c]?.time??v,x&&(v=null),p=!0}else if(w){let x=Math.min(h,d+Math.min(b,50)/1e3*y);d=q(x,Math.round(k))?x:Math.max(d,(l[c]?.time??x)-1e-6),d>=h&&c>=l.length&&(w=!1),p=!0}p&&(n(),s(Ye(t,S())),p=!1);for(let x=B.length-1;x>=0;x--){let E=B[x];E&&v===null&&c>=Fe(t,E.time)&&d>=E.time-1e-6&&(B.splice(x,1),E.done())}R(),w||v!==null||B.length?_=requestAnimationFrame(I):C=0},M=()=>{_||(_=requestAnimationFrame(I))},a=f=>{let b=[...T.keys()].filter(P=>P<=f).sort((P,H)=>H-P)[0],x=b??0;b!==void 0?o.restore(T.get(b)):r.reset();let E=u[x].start;c=Fe(t,E),d=E},m=f=>{Fe(t,f)<c&&a(Xe(t,f)),L=S(),v=f,p=!0,M()};return{play(){w||(c>=l.length&&d>=h&&m(0),w=!0,R(),M())},pause(){w&&(w=!1,R())},seekStep(f){let b=Math.max(0,Math.min(u.length-1,f));m(u[b].start)},setSpeed(f){y=f,R()},renderAt(f){return m(Math.max(0,Math.min(h,f))),new Promise(b=>{B.push({time:Math.max(0,Math.min(h,f)),done:b}),M()})},redraw(){p=!0,M()},get state(){return A()},get pose(){return Ye(t,S())},destroy(){w=!1,cancelAnimationFrame(_),_=0;for(let f of T.values())o.release(f);T.clear()}}}var _t=Po(Ct(),1);function Dt(e){let t=new _t.default(e>>>0),o=()=>t.random_long();return{next:o,between:(r,n)=>r+(n-r)*o(),index:r=>Math.floor(o()*r),shuffle(r){for(let n=r.length-1;n>0;n--){let s=Math.floor(o()*(n+1)),i=r[n];r[n]=r[s],r[s]=i}return r}}}function ze(e,t,o,r){return{bounds:{left:e,top:t,right:o,bottom:r},contains:({x:n,y:s})=>n>=e&&n<=o&&s>=t&&s<=r}}function xe(e){let t=e.map(r=>r.x),o=e.map(r=>r.y);return{bounds:{left:Math.min(...t),top:Math.min(...o),right:Math.max(...t),bottom:Math.max(...o)},contains({x:r,y:n}){let s=!1;for(let i=0,l=e.length-1;i<e.length;l=i++){let u=e[i],h=e[l];u.y>n!=h.y>n&&r<(h.x-u.x)*(n-u.y)/(h.y-u.y)+u.x&&(s=!s)}return s}}}function we(e,t,o,r=0){let{left:n,top:s,right:i,bottom:l}=t.bounds,u=[],h=0;for(;u.length<o&&h<o*60;){h++;let c={x:e.between(n,i),y:e.between(s,l)};if(!t.contains(c))continue;let d=r*Math.max(0,1-h/(o*30));d>0&&u.some(w=>Math.hypot(w.x-c.x,w.y-c.y)<d)||u.push(c)}return u}function J(e,t,o){let r=[...t],n=[],s=o;for(;r.length;){let i=0,l=Number.POSITIVE_INFINITY;for(let u=0;u<r.length;u++){let h=r[u],c=Math.hypot(h.x-s.x,h.y-s.y)*e.between(.8,1.25);c<l&&(l=c,i=u)}s=r.splice(i,1)[0],n.push(s)}return n}function je(e,t=.1){if(e.length<3)return e;let o=[];for(let r=0;r<e.length-1;r++){let n=e[Math.max(0,r-1)],s=e[r],i=e[r+1],l=e[Math.min(e.length-1,r+2)],u=Math.hypot(i.x-s.x,i.y-s.y),h=Math.max(1,Math.ceil(u/t));for(let c=0;c<h;c++){let d=c/h,w=d*d,y=w*d,v=(L,k,C,_)=>.5*(2*k+(-L+C)*d+(2*L-5*k+4*C-_)*w+(-L+3*k-3*C+_)*y);o.push({x:v(n.x,s.x,i.x,l.x),y:v(n.y,s.y,i.y,l.y),pressure:s.pressure+(i.pressure-s.pressure)*d})}}return o.push(e[e.length-1]),o}function Ve(e,t,o,r,n){let s=Math.cos(t),i=Math.sin(t),l=[];for(let u=0;u<=6;u++){let h=u/6,c=(h-.5)*o,d=r*4*h*(1-h),w=h<.5?n[0]+(n[1]-n[0])*(h/.5):n[1]+(n[2]-n[1])*((h-.5)/.5);l.push({x:e.x+s*c-i*d,y:e.y+i*c+s*d,pressure:w})}return l}function Ot(e,t,o){let r=o.avoid??[],n=l=>r.every(({at:u,distance:h})=>Math.hypot(u.x-l.x,u.y-l.y)>h),s=J(e,we(e,t,o.count,.35).filter(n),o.start),i=[];return s.forEach((l,u)=>{let h=(u%2?1:-1)*(Math.PI/4)+e.between(-.35,.35)+(e.next()<.5?Math.PI:0),c=e.between(...o.length),d=Ve(l,h,c,e.between(-.18,.18),o.pressure??[.55,.9,.6]);je(d,.1).every(n)&&i.push({kind:"stroke",points:d,...o.handling})}),i}function Ut(e,t,o,r){let n=[];for(let s=0;s<r;s++){let i=o*Math.sqrt((s+1)/r),l=e.between(0,Math.PI*2),u=e.between(0,i),h={x:t.x+Math.cos(l)*u,y:t.y+Math.sin(l)*u},c=e.between(0,Math.PI*2),d=e.between(.12,.38),w=[{...h,pressure:e.between(.6,.9)},{x:h.x+Math.cos(c)*d*.6,y:h.y+Math.sin(c)*d*.6,pressure:e.between(.5,.75)},{x:h.x+Math.cos(c)*d,y:h.y+Math.sin(c)*d,pressure:.25}];n.push({kind:"stroke",points:w})}return n}function Qe(e,t,o){return t.map(r=>({kind:"press",at:r,pressure:e.between(...o)}))}function It(e,t,o,r){let n=[];for(let s=0;s<r.passes;s++){let i=(s-(r.passes-1)/2)*r.width,l=e.between(-.08,.08),u=e.between(0,Math.PI*2),h=[];for(let c=0;c<=10;c++){let d=c/10,w=r.fade??.25,y=.02*Math.sin(d*9+u);h.push({x:t.x+i*(1-.45*d)+r.lean*o*d+l*Math.sin(d*Math.PI)+y,y:t.y-o*d,pressure:1-(1-w)*d**1.3})}n.push({kind:"stroke",points:h,edge:r.edge})}return n}function Gt(e,t,o,r,n,s){let i=[],l=e.between(0,Math.PI*2);for(let u=0;u<r;u++){let h=n*Math.sqrt(-2*Math.log(Math.max(1e-6,e.next())))*.6,c=e.between(0,Math.PI*2);i.push({x:t.x+Math.cos(c)*h,y:t.y+Math.sin(c)*h,radius:e.between(...s)*(e.next()<.12?1.8:1),angle:l+e.between(-.4,.4)})}return{kind:"flick",from:t,mix:o,specks:i}}function Je(e,t,o,r=0){let n=[];for(let s=0;s<=5;s++){let i=s/5;n.push({x:e.x+o*t*i*i,y:e.y-t*i,pressure:.95-.8*i})}return{kind:"stroke",points:n,tilt:r}}var W=16,ne=12,$={x:5.6,y:2.05,radius:.48},j={x:8.8,y:8.95},z={x:7.65,y:9.62,scale:1.8},re=e=>9.15+.15*Math.sin(e*.75+1.1)+.08*Math.sin(e*1.9)-.25*Math.exp(-((e-j.x)**2)/3);function ie(e){let t={x:12.4,y:12.4},o={x:12.9,y:10.9},r={x:9.8,y:10.1},n=j,s=1-e;return{at:{x:s**3*t.x+3*s*s*e*o.x+3*s*e*e*r.x+e**3*n.x,y:s**3*t.y+3*s*s*e*o.y+3*s*e*e*r.y+e**3*n.y},width:3.2*(1-e)+.4*e}}var ge=e=>Array.from({length:21},(t,o)=>{let r=o/20,n=ie(r),s=ie(Math.min(1,r+.02)),i=ie(Math.max(0,r-.02)),l=s.at.x-i.at.x,u=s.at.y-i.at.y,h=Math.hypot(l,u)||1;return{x:n.at.x-u/h*e*n.width*.5,y:n.at.y+l/h*e*n.width*.5}}),Ze=xe([...ge(-1),...ge(1).reverse()]),No=xe([{x:-.2,y:-.2},{x:W+.2,y:-.2},...Array.from({length:33},(e,t)=>{let o=W+.2-t/32*(W+.4);return{x:o,y:re(o)+.1}})]),Wo=ze(-.3,-.3,W+.3,6.2),Ho=xe([...Array.from({length:33},(e,t)=>{let o=-.2+t/32*(W+.4);return{x:o,y:re(o)-.05}}),{x:W+.2,y:ne+.2},{x:-.2,y:ne+.2}]),he=(e,t,o)=>Math.hypot(e.x-t.x,e.y-t.y)<o,N="titaniumWhite",F="skyBlue",qt="cobaltBlue",G="prussianBlue",$o=[[.7,[[.6,qt],[2.2,F],[3.8,F],[5.6,N],[7.2,F],[8.8,F],[10.4,F],[12,F],[13.6,F],[15.3,qt]]],[2,[[1.4,G],[3,F],[4.6,N],[5.6,N],[6.6,N],[8.2,F],[10,G],[11.8,F],[13.4,G],[15,F]]],[3.3,[[.6,G],[2.2,G],[3.8,F],[5.3,N],[6.8,N],[8.4,F],[10.2,F],[12,G],[13.8,G],[15.3,G]]],[4.6,[[1.4,G],[3,F],[4.6,F],[6.3,N],[7.6,N],[9,F],[10.6,G],[12.4,F],[14.2,G]]],[5.9,[[.6,F],[2.2,G],[3.8,F],[5.6,F],[7.3,N],[8.5,N],[9.8,F],[11.2,G],[12.8,F],[14.6,F]]]],Ko=Array.from({length:18},(e,t)=>{let o=.5+t*.885,r=Math.abs(o-j.x)<.9;return{at:{x:o,y:7.45},paint:r?N:F,size:.72}}),oe="sapGreen",le="phthaloGreen",ce="yellowOchre",Nt="burntSienna",Be="marsBlack",Yo=[[9.65,[[.5,le],[2.2,oe],[4,Nt],[6,ce],[8.7,N],[9.8,ce],[11.3,ce],[12.9,Nt],[14.4,oe],[15.6,le]]],[10.65,[[.5,Be],[2,le],[3.6,le],[5.2,oe],[7,oe],[8.6,oe],[10.6,N],[11.7,ce],[12.9,ce],[14.2,oe],[15.5,Be]]],[11.55,[[.5,Be],[2,le],[3.6,oe],[5.2,le],[7,oe],[8.8,le],[10.5,oe],[11.9,ce],[12.9,N],[14,ce],[15.5,Be]]]],Wt=[[.05,"yellowOchre"],[.15,"titaniumWhite"],[.25,"yellowOchre"],[.35,"titaniumWhite"],[.45,"yellowOchre"],[.55,"titaniumWhite"],[.65,"cadmiumYellow"],[.74,"titaniumWhite"],[.83,"titaniumWhite"],[.92,"titaniumWhite"]].map(([e,t])=>({at:ie(e).at,paint:t})),_e=[...$o.flatMap(([e,t])=>t.map(([o,r])=>({at:{x:o,y:e},paint:r,size:r===N?1.3:1}))),...Ko,...Yo.flatMap(([e,t])=>t.map(([o,r])=>({at:{x:o,y:e},paint:r}))).filter(e=>Wt.every(t=>!he(t.at,e.at,.6))),...Wt],$t=_e.filter(e=>e.paint===G).map(e=>e.at),Xo=_e.filter(e=>e.paint===G||e.at.y>7).map(e=>e.at),zo=[{x:.3,depth:"middle"},{x:1.05,depth:"near"},{x:1.75,depth:"far"},{x:2.05,depth:"far"},{x:2.85,depth:"middle"},{x:3.75,depth:"near"},{x:4.2,depth:"far"},{x:4.6,depth:"middle"},{x:6.3,depth:"far"},{x:6.75,depth:"middle"},{x:9.9,depth:"far"},{x:10.45,depth:"middle"},{x:10.8,depth:"far"},{x:11.7,depth:"middle"},{x:12.6,depth:"far"},{x:12.95,depth:"middle"},{x:13.3,depth:"far"},{x:14.1,depth:"near"},{x:14.95,depth:"middle"},{x:15.3,depth:"far"},{x:15.85,depth:"near"}],Kt={far:{mix:{prussianBlue:2,burntUmber:1,skyBlue:1},amount:7,passes:1,spacing:0,width:.2},middle:{mix:{burntUmber:2,marsBlack:1,prussianBlue:1},amount:14,passes:1,spacing:0,width:.42},near:{mix:{burntUmber:2,marsBlack:2},amount:16,passes:2,spacing:.34,width:.76}};function jo(e){return zo.map(t=>{let o=t.depth==="near"?{x:t.x,y:ne+.3}:t.depth==="middle"?{x:t.x,y:re(t.x)+e.between(.6,1.4)}:{x:t.x,y:re(t.x)+e.between(.05,.3)};return{...t,base:o,lean:e.between(-.045,.045),width:Kt[t.depth].width}})}var Yt=(e,t)=>e.base.x+e.lean*(e.base.y-t),Ce=[[-.26,0],[-.31,-.08],[-.32,-.18],[-.29,-.28],[-.22,-.37],[-.14,-.45],[-.07,-.55],[-.03,-.64],[-.01,-.72],[.02,-.79],[.07,-.835],[.13,-.84],[.19,-.815],[.27,-.78],[.36,-.755],[.33,-.735],[.24,-.72],[.17,-.7],[.13,-.67],[.12,-.6],[.14,-.5],[.15,-.4],[.15,-.3],[.15,-.12],[.19,-.03],[.19,0],[.08,0]],Vo=[[[-.005,-.8],[.015,-.99],[.06,-.835]],[[.06,-.84],[.11,-1],[.15,-.83]]],Qo=[[-.3,-.04,.06],[-.26,.03,.09],[-.12,.07,.1],[.04,.08,.1],[.18,.07,.085],[.3,.045,.06],[.4,.015,.03],[.45,0,.01]],Jo=[.17,-.795],Zo=[.355,-.75];function en(){let e=([y,v])=>({x:z.x+y*z.scale,y:z.y+v*z.scale}),t=y=>vn(y,3,{titaniumWhite:1},9),o=(y,v)=>({kind:"stroke",points:je(y.map((L,k)=>({...e(L),pressure:v[0]+(v[1]-v[0])*(k/Math.max(1,y.length-1))})),.03)}),r=[],n=xe(Ce.map(e)),{left:s,right:i,top:l,bottom:u}=n.bounds;for(let y=s+.01;y<i;y+=.018){let v=null;for(let L=u+.01;L>=l-.02;L-=.008){let k=n.contains({x:y,y:L});if(k&&v===null&&(v=L),!k&&v!==null){let C=Math.max(1,Math.ceil((v-L)/.4)),_=(v-L)/C;for(let p=0;p<C;p++){let g=v-p*_+(p>0?.03:0),T=v-(p+1)*_;g-T<.03||r.push({kind:"stroke",points:[{x:y,y:g,pressure:.85},{x:y+.004,y:(g+T)/2,pressure:.9},{x:y+.003,y:T+.004,pressure:.75}]})}v=null}}}let h=[o(Ce.slice(0,15),[.55,.5]),o([...Ce.slice(14),Ce[0]],[.5,.6])],c=Vo.flatMap(([y,v,L])=>{let[k,C]=y,[_,p]=L;return[.15,.4,.65,.85].map(g=>o([[k+(_-k)*g,C+(p-C)*g],v],[.7,.2]))}),d=[-.85,-.55,-.25,0,.25,.55,.85].map(y=>o(Qo.map(([v,L,k])=>[v,L+y*k*.5]),[.85,.3])),w=[{kind:"clean"},{kind:"load",mix:{prussianBlue:1,marsBlack:1},amount:3},{kind:"press",at:e(Jo),pressure:.35},{kind:"press",at:e(Zo),pressure:.3}];return[...t([...r,...h,...c,...d]),...w]}function tn(){return{title:"Drop the paint",tool:"tube",paints:["titaniumWhite","skyBlue","cobaltBlue","prussianBlue","yellowOchre","burntSienna","sapGreen","phthaloGreen","marsBlack"],note:"Every paint goes straight onto the canvas as a drop, near where it will end up: white along the path of the light, Prussian blue where the woods go dark, earths and greens below.",gestures:_e.map(e=>({kind:"drop",at:e.at,mix:{[e.paint]:1},size:e.size??1})),pace:2}}function on(e){let t=Xo.map(n=>({at:n,distance:1.25})),o=Ot(e,Wo,{start:$,count:230,length:[1,1.7],avoid:t,pressure:[.5,.95,.55]}),r=n=>o.some(s=>s.kind==="stroke"&&s.points.some(i=>he(i,n,.55)));for(let n of _e){if(n.paint===G||n.at.y>7||r(n.at))continue;let s=$t.reduce((l,u)=>Math.hypot(u.x-n.at.x,u.y-n.at.y)<Math.hypot(l.x-n.at.x,l.y-n.at.y)?u:l),i=Math.atan2(n.at.y-s.y,n.at.x-s.x);o.push({kind:"stroke",points:Ve(n.at,i+Math.PI/2,.9,.1,[.55,.85,.5])})}return{title:"Spread the sky",tool:"wideBrush",paints:["titaniumWhite","skyBlue","cobaltBlue"],note:"A dry two-inch brush works out from the moon in short crossing strokes, picking up the drops it meets and laying them down again further on. It leaves the dark drops alone.",gestures:o}}function nn(e){let t=[];for(let o of $t)t.push(...Ut(e,o,1.3,24));return{title:"Knife in the dark woods",tool:"knife",paints:["prussianBlue"],note:"The painting knife pats each Prussian blue drop outward into a ragged mass. Every pat lifts the paint under the blade and leaves a crisp ridge along its edge.",gestures:t}}function rn(e){let t=[];for(let o=.4;o<W;o+=e.between(.45,.7)){let r=e.between(5.6,6.1),n=re(o)+.15,s=e.next()<.6,i=[{x:o+e.between(-.05,.05),y:s?r:n,pressure:.55},{x:o,y:(r+n)/2,pressure:.85},{x:o+e.between(-.05,.05),y:s?n:r,pressure:.5}];t.push({kind:"stroke",points:i})}return{title:"Pull down the mist",tool:"wideBrush",paints:["skyBlue","titaniumWhite"],note:"The same brush, turned, pulls the row of small blue drops into vertical streaks: a band of mist where the far trees stand.",gestures:t}}function sn(e){let t=[],o=0;for(let r=9.05;r<ne+.2;r+=.36,o++){let n=[];for(let s=-.4;s<W+.4;s+=e.between(1.2,1.9)){let i=e.between(1.4,2.2),l=e.between(-.12,.12),u={x:s,y:Math.max(r,re(s)+.05)},h=[{...u,pressure:.6},{x:s+i/2,y:u.y+l,pressure:.9},{x:s+i,y:u.y+l*.3,pressure:.55}];h.some(c=>Ze.contains(c))||n.push({kind:"stroke",points:h})}t.push(...o%2?n.reverse():n)}for(let r=.02;r<.97;r+=.055){let n=ie(r),s=ie(Math.min(1,r+.07)).at,i=s.x-n.at.x,l=s.y-n.at.y,u=Math.hypot(i,l)||1,h=Math.max(1,Math.min(4,Math.round(n.width/.8)));for(let c=0;c<h;c++){let d=h===1?0:(c/(h-1)-.5)*n.width*.7,w=n.at.x-l/u*d,y=n.at.y+i/u*d,v=e.between(.7,1);t.push({kind:"stroke",points:[{x:w,y,pressure:.65},{x:w+i/u*v*.5,y:y+l/u*v*.5,pressure:.85},{x:w+i/u*v,y:y+l/u*v,pressure:.5}]})}}return{title:"Lay in the ground",tool:"flatBrush",paints:["yellowOchre","burntSienna","sapGreen","phthaloGreen","marsBlack"],note:"A one-inch brush spreads the ground drops sideways: warm ochre and white where the path will catch the light, greens and black toward the edges.",gestures:t}}function an(e){let t=J(e,we(e,No,330,.45),$),o=J(e,we(e,Ho,110,.5),j);return{title:"Pounce the scrubber",tool:"scrubber",paints:[],note:"A steel-wool scrubber glued to a jar lid is pounced over everything while it is wet, from the light outward. It lifts paint and drops it again a pad-width away, breaking every brushstroke into a glittering stipple.",gestures:[...Qe(e,t,[.72,.95]),...Qe(e,o,[.72,.95])],pace:2.2}}function un(e,t){let o=[],r=[...t].sort((n,s)=>Ht(n.depth)-Ht(s.depth));for(let n of r){let s=Kt[n.depth];o.push({kind:"load",mix:s.mix,amount:s.amount,keep:.2}),o.push(...It(e,n.base,n.base.y+.4,{lean:n.lean,passes:s.passes,width:s.spacing,edge:n.depth==="far",fade:n.depth==="far"?.12:.3}))}return{title:"Pull up the trunks",tool:"trunkBrush",paints:["burntUmber","marsBlack","prussianBlue"],note:"Umber and black on a half-inch brush, pulled up from the ground in one stroke per trunk and easing off as it climbs. The far trunks go first and thinnest; the brush drags up streaks of the wet blue beneath.",gestures:o}}var Ht=e=>e==="far"?0:e==="middle"?1:2;function ln(e,t){let o=[];for(let s of t){if(s.depth==="far"&&e.next()<.5)continue;let i=s.depth==="near"?2:1;for(let l=0;l<i;l++){let u=e.between(-.5,s.depth==="near"?2:1.4);o.push({x:Yt(s,u)+e.between(-.6,.6),y:u})}}let r=o.filter(s=>!he(s,$,1.8)),n=[];return J(e,r,{x:0,y:0}).forEach((s,i)=>{i%2===0&&n.push({kind:"load",mix:{marsBlack:2,phthaloGreen:1,prussianBlue:1},amount:2.2,keep:.2}),n.push({kind:"press",at:s,pressure:e.between(.55,.8)}),n.push({kind:"press",at:{x:s.x+e.between(-.3,.3),y:s.y+e.between(-.25,.25)},pressure:e.between(.4,.6)})}),{title:"Pounce the leaves",tool:"scrubber",paints:["marsBlack","phthaloGreen","prussianBlue"],note:"The scrubber again, now loaded with black and dark green, pounced at the tops of the trunks. Each press prints a clump of foliage, lighter where it barely touches.",gestures:n,pace:1.6}}function cn(e){return{title:"Spatter",tool:"spatter",paints:["titaniumWhite"],note:"A round brush loaded with white, tapped against the handle of another: a shower of specks, the first of the night\u2019s lights.",gestures:[{x:3.2,y:2.6},{x:7.6,y:3.4},{x:11.4,y:2.2},{x:13.8,y:5.2},{x:9.6,y:6.2},{x:2.4,y:6.4}].map(o=>Gt(e,o,{titaniumWhite:1},46,1.5,[.008,.024]))}}function hn(e){let t=[{kind:"load",mix:{phthaloGreen:1,marsBlack:1},amount:5}],o=0;for(let r=-.4;r<W+.4;r+=e.between(.45,.8))for(let n=0;n<3;n++){let s=re(r)+e.between(.15,.6)+n*e.between(.7,1.1);s>ne+.1||[-.7,0,.7].some(i=>Ze.contains({x:r+i,y:s}))||(o++%4===0&&t.push({kind:"load",mix:{phthaloGreen:1,marsBlack:1},amount:5,keep:.4}),t.push(Je({x:r,y:s},e.between(.35,.5+n*.3),e.between(-.35,.35),e.between(-.4,.4))))}t.push({kind:"clean"});for(let r=.1;r<1;r+=.11)for(let n of[-1,1]){let s=ge(n)[Math.round(r*20)];o++%3===0&&t.push({kind:"load",mix:{sapGreen:1,yellowOchre:1,titaniumWhite:1},amount:4,keep:.2}),t.push(Je({x:s.x,y:s.y+.15},e.between(.3,.55),e.between(-.25,.25),e.between(-.4,.4)))}return{title:"Comb the grass",tool:"comb",paints:["phthaloGreen","marsBlack","sapGreen","yellowOchre"],note:"A fine comb with paint on its teeth, set down along the ground and flicked upward: a dozen blades of grass at a time. Dark first, then a paler mix where the path catches the light.",gestures:t}}function fn(e){let t=[{kind:"load",mix:{titaniumWhite:3,skyBlue:1},amount:6}];for(let o=0;o<18;o++){let r=e.between(.5,W-.5);if(Math.abs(r-$.x)<.8)continue;let n=re(r)+e.between(-.1,.2),s=e.between(2,5.2),i=e.between(-.04,.04);o%3===0&&t.push({kind:"load",mix:{titaniumWhite:3,skyBlue:1},amount:6,keep:.3}),t.push({kind:"stroke",points:[{x:r,y:n,pressure:.55},{x:r+i*s*.5,y:n-s*.5,pressure:.4},{x:r+i*s,y:n-s,pressure:.12}],skim:.15})}for(let o=0;o<26;o++){let r=e.next()<.5?-1:1,n=ge(r)[2+e.index(18)],s=n.x+e.between(-.3,.3),i=n.y+e.between(-.1,.2);o%5===0&&t.push({kind:"load",mix:{titaniumWhite:2,sapGreen:1,cadmiumYellow:1},amount:5,keep:.3}),t.push({kind:"stroke",points:[{x:s,y:i,pressure:.6},{x:s+e.between(-.08,.08),y:i-e.between(.25,.5),pressure:.1}]})}return{title:"Saplings in the mist",tool:"liner",paints:["titaniumWhite","skyBlue","sapGreen"],note:"A liner brush draws thin pale lines into the mist, far-off saplings with the moon on them, and flicks a few light blades of grass along the path.",gestures:t}}function dn(){let e=[];for(let t=0;t<7;t++){let o=.6+t*1.8;e.push(t%2?{x:W+.5,y:o}:{x:-.5,y:o}),e.push(t%2?{x:-.5,y:o}:{x:W+.5,y:o})}return{title:"Dry it",tool:"dryer",paints:[],note:"Everything so far has been painted wet into wet. A hair dryer sets it, so what comes next sits on top, crisp, instead of blending in. Watch the shine go.",gestures:[{kind:"dry",path:e}]}}function pn(e){let t=[{kind:"load",mix:{titaniumWhite:1},amount:7}];for(let o=0;o<16;o++){let r=e.between(0,Math.PI*2),n=e.between(0,$.radius*.4);t.push({kind:"press",at:{x:$.x+Math.cos(r)*n,y:$.y+Math.sin(r)*n},pressure:e.between(.8,.95),angle:e.between(0,6.28)}),o===7&&t.push({kind:"load",mix:{titaniumWhite:1},amount:6,keep:.4})}for(let o=0;o<36;o++){o%9===0&&t.push({kind:"load",mix:{titaniumWhite:1},amount:1.3,keep:.5});let r=e.between(0,Math.PI*2),n=e.between($.radius*1.1,$.radius*2.8);t.push({kind:"press",at:{x:$.x+Math.cos(r)*n,y:$.y+Math.sin(r)*n},pressure:e.between(.3,.45),angle:e.between(0,6.28),skim:.5})}return{title:"Dab the moon",tool:"cotton",paints:["titaniumWhite","cadmiumYellow"],note:"A ball of cotton wool in a clothespin, dipped in white and dabbed over and over in one spot until the moon is solid; then, nearly dry, dabbed lightly around it for the glow.",gestures:t}}function et(e,t,o=!0){let r=[];for(;r.length<t;){let n=e.next(),s;if(n<.35){let i=e.between(0,1),l=ie(i);s={x:l.at.x+e.between(-1,1)*l.width*.7,y:l.at.y+e.between(-.5,.3)}}else if(n<.6){let i=e.between(0,Math.PI*2),l=Math.sqrt(e.next())*3.2;s={x:j.x+Math.cos(i)*l*1.3,y:j.y-1.2+Math.sin(i)*l*.9}}else s={x:e.between(.3,W-.3),y:e.between(2.4,ne-.3)};s.x<.2||s.x>W-.2||s.y<.2||s.y>ne-.2||o&&he(s,{x:z.x,y:z.y-.55*z.scale},.6*z.scale)||he(s,$,$.radius*2)||r.push(s)}return r}function mn(e){let t=[],o=s=>Array.from({length:s},()=>{let i=e.next()<.5?-1:1,l=2+e.index(17),u=ge(i)[l],h=ie(l/20).at,c=u.x-h.x,d=u.y-h.y,w=Math.hypot(c,d)||1,y=e.between(.1,.55);return{x:u.x+c/w*y,y:u.y+d/w*y}}).filter(i=>i.y<ne-.1&&!Ze.contains(i)&&!he(i,{x:z.x,y:z.y-.5},1.3)),r=we(e,ze(8.2,9,10.6,9.9),4).filter(s=>!he(s,z,1.3));return J(e,[...o(14),...r],j).forEach((s,i)=>{i%3===0&&t.push({kind:"load",mix:{cadmiumYellow:4,titaniumWhite:1},amount:5,keep:.2}),t.push({kind:"press",at:s,pressure:e.between(.6,.9),angle:e.between(-.6,.6)})}),t.push({kind:"clean"}),J(e,o(6),j).forEach((s,i)=>{i%3===0&&t.push({kind:"load",mix:{titaniumWhite:1},amount:5,keep:.1}),t.push({kind:"press",at:s,pressure:e.between(.5,.8),angle:e.between(-.6,.6)})}),{title:"Stamp the flowers",tool:"bundle",paints:["cadmiumYellow","titaniumWhite"],note:"Twenty cotton swabs held in a rubber band and fanned out, dipped in yellow and stamped along the path: a scatter of small flowers with every press. Then a few in white.",gestures:t,pace:1.4}}function bn(e){let t=[];return J(e,et(e,110),j).forEach((r,n)=>{let s=n%5<2;n%2===0&&t.push({kind:"load",mix:s?{cadmiumYellow:5,sapGreen:1,titaniumWhite:2}:{titaniumWhite:1},amount:5,keep:.1}),t.push({kind:"press",at:r,pressure:e.between(.55,.9),angle:e.between(0,6.28)})}),{title:"Dot the fireflies",tool:"swab",paints:["titaniumWhite","cadmiumYellow","sapGreen"],note:"One swab, one dot at a time: white ones, and yellow-green ones, thickest where the light is.",gestures:t,pace:1.5}}function yn(){return{title:"Draw the fox",tool:"liner",paints:["titaniumWhite"],note:"The liner again, with pure white: a fox sitting at the edge of the clearing, filled in with short strokes, then outlined, ears and tail last.",gestures:[{kind:"load",mix:{titaniumWhite:1},amount:9},...en()]}}function xn(e,t){let o=[],r=t.filter(n=>n.depth!=="far"&&Math.abs(n.x-7.5)<6);for(let n of r){let s=n.x>$.x?-1:1,i=c=>Yt(n,c)+s*(n.width/2-.03),l=Math.min(n.base.y-.2,n.depth==="near"?e.between(8.5,10):re(n.x)+e.between(.2,.8)),u=l-e.between(2.5,5),h=(l+u)/2;o.push({kind:"load",mix:{titaniumWhite:3,skyBlue:1},amount:6,keep:.2}),o.push({kind:"stroke",points:[{x:i(l),y:l,pressure:.35},{x:i(h)+e.between(-.02,.02),y:h,pressure:.55},{x:i(u),y:u,pressure:.15}],skim:.25})}return{title:"Light the trunks",tool:"liner",paints:["titaniumWhite","skyBlue"],note:"A broken line of pale blue down the side of each trunk that faces the moon.",gestures:o}}function wn(e){let t=[];return e.forEach((o,r)=>{r%2===0&&t.push({kind:"load",mix:{titaniumWhite:1},amount:3,keep:.2}),t.push({kind:"press",at:o,pressure:.5+.1*Math.sin(r*2.3),angle:r*1.7,skim:.3,twist:1})}),{title:"Twist the glows",tool:"cotton",paints:["titaniumWhite"],note:"The cotton ball, with a little white, pressed and twisted: the fibers drag the paint out in fine rays, and the brightest fireflies get a halo.",gestures:t}}function gn(e,t){let o=[];return[...t,...J(e,et(e,28),j)].forEach((n,s)=>{s%3===0&&o.push({kind:"load",mix:{titaniumWhite:1},amount:5,keep:.1}),o.push({kind:"press",at:n,pressure:e.between(.35,.6),angle:e.between(0,6.28)})}),{title:"Last sparkles",tool:"swab",paints:["titaniumWhite"],note:"A clean swab and small dots of white, here and there, to finish.",gestures:o,pace:1.5}}function vn(e,t,o,r){let n=[];return e.forEach((s,i)=>{i>0&&i%t===0&&n.push({kind:"load",mix:o,amount:r,keep:.3}),n.push(s)}),n}function Xt(e=11){let t=Dt(e),o=jo(t),r=J(t,et(t,16),j);return{title:"Fox at the edge of the wood",width:W,height:ne,steps:[tn(),on(t),nn(t),rn(t),sn(t),an(t),un(t,o),ln(t,o),cn(t),hn(t),fn(t),dn(),pn(t),mn(t),bn(t),yn(),xn(t,o),wn(r),gn(t,r)]}}var De=["#c98f55","#a8693a"],zt=["#2f4f8f","#1c3263"],Oe=["#e9ecef","#9aa1a8","#d5d9dd"],V=(e,t,o,r,n,s)=>{let i=e.createLinearGradient(t,o,r,n);for(let[l,u]of s.entries())i.addColorStop(l/Math.max(1,s.length-1),u);return i};function ve(e,t,o,r,n,s){e.beginPath(),e.roundRect(t,o,r,n,s)}function Ue(e,t,o,r,n,s){e.beginPath(),e.moveTo(-r/2,t),e.lineTo(r/2,t),e.quadraticCurveTo(n*.7,(t+o)/2,n/2,o-n/2),e.arc(0,o-n/2,n/2,0,Math.PI),e.quadraticCurveTo(-n*.7,(t+o)/2,-r/2,t),e.closePath(),e.fillStyle=V(e,-r/2,0,r/2,0,[s[1]??"#000",s[0]??"#000",s[1]??"#000"]),e.fill()}function ot(e,t,o,r,n){e.beginPath(),e.moveTo(-r/2,t),e.lineTo(r/2,t),e.lineTo(n/2,o),e.lineTo(-n/2,o),e.closePath(),e.fillStyle=V(e,-r/2,0,r/2,0,Oe),e.fill(),e.strokeStyle="rgba(60,64,70,0.45)",e.lineWidth=.012;for(let s of[.25,.35]){let i=t+(o-t)*s,l=r+(n-r)*s;e.beginPath(),e.moveTo(-l/2,i),e.lineTo(l/2,i),e.stroke()}}function jt(e,t,o,r,n){if(e.save(),e.beginPath(),e.moveTo(-t/2,o),e.lineTo(-t/2,o*.18),e.quadraticCurveTo(-t/2,0,-t*.38,0),e.lineTo(t*.38,0),e.quadraticCurveTo(t/2,0,t/2,o*.18),e.lineTo(t/2,o),e.closePath(),e.fillStyle=r,e.fill(),e.clip(),n?.length){let s=t/n.length;n.forEach((i,l)=>{let u=e.createLinearGradient(0,0,0,o*.75);u.addColorStop(0,i),u.addColorStop(1,"rgba(0,0,0,0)"),e.fillStyle=u,e.fillRect(-t/2+l*s-.002,0,s+.004,o)})}e.strokeStyle="rgba(40,30,20,0.18)",e.lineWidth=.008;for(let s=-t/2+.02;s<t/2;s+=.045)e.beginPath(),e.moveTo(s,o),e.lineTo(s+.01*Math.sin(s*40),.02),e.stroke();e.restore()}function tt(e,t,o,r){let n=t*.55+.25;jt(e,t,n,"#a49377",o),ot(e,n,n+.55,t*1.04,t*.9),Ue(e,n+.55,n+.55+4.2,Math.min(.42,t*.6),.22,r)}function Vt(e,t){jt(e,.06,.32,"#c9b18a",t),ot(e,.3,.75,.08,.1),Ue(e,.75,6,.1,.16,De)}function Tn(e){e.beginPath(),e.moveTo(0,-.95),e.quadraticCurveTo(.34,-.55,.31,.1),e.quadraticCurveTo(.26,.42,.05,.48),e.lineTo(-.05,.48),e.quadraticCurveTo(-.26,.42,-.31,.1),e.quadraticCurveTo(-.34,-.55,0,-.95),e.closePath(),e.fillStyle=V(e,-.32,0,.32,0,Oe),e.fill(),e.strokeStyle="rgba(90,95,100,0.5)",e.lineWidth=.015,e.stroke(),e.fillStyle=V(e,-.04,0,.04,0,Oe),e.fillRect(-.035,.46,.07,.9),ot(e,1.3,1.6,.14,.2),Ue(e,1.6,5.2,.2,.3,zt)}function Sn(e){e.fillStyle="#7d8287",e.beginPath(),e.arc(0,0,1.3,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(225,230,235,0.7)",e.lineWidth=.025;for(let t=0;t<46;t++){let o=t/46*Math.PI*2;e.beginPath(),e.arc(Math.cos(o)*1.12,Math.sin(o)*1.12,.16+.05*Math.sin(t*2.3),o,o+2.6),e.stroke()}e.fillStyle=V(e,-1,-1,1,1,["#e8dcf2","#c4b2d9","#a996c4"]),e.beginPath(),e.arc(0,0,1.02,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(255,255,255,0.6)",e.lineWidth=.04,e.beginPath(),e.arc(0,0,.86,Math.PI*1.05,Math.PI*1.6),e.stroke()}function Pn(e){e.fillStyle="rgba(28,28,32,0.92)",ve(e,-.62,.06,1.24,.34,.06),e.fill(),e.strokeStyle="rgba(28,28,32,0.85)",e.lineWidth=.018;for(let t=-.56;t<=.56;t+=.066)e.beginPath(),e.moveTo(t,.08),e.lineTo(t,-.02),e.stroke();e.fillStyle="rgba(255,255,255,0.12)",e.fillRect(-.6,.1,1.2,.04)}function Mn(e,t){e.save(),e.rotate(-.35),e.fillStyle=V(e,-.18,0,.18,0,["#d9b47c","#b8894f"]),ve(e,-.17,.25,.34,2.9,.05),e.fill(),e.strokeStyle="rgba(80,50,20,0.5)",e.lineWidth=.02,e.beginPath(),e.moveTo(0,.3),e.lineTo(0,3.1),e.stroke(),e.fillStyle=V(e,-.2,0,.2,0,Oe),e.fillRect(-.2,1.4,.4,.14),e.restore();let o=t?.[Math.floor(t.length/2)];for(let[r,n,s]of[[0,0,.36],[-.2,-.08,.22],[.2,-.05,.22],[.05,.2,.24],[-.12,.16,.2]])e.fillStyle=e.createRadialGradient(r-s*.3,n-s*.3,s*.1,r,n,s),e.fillStyle.addColorStop(0,"#ffffff"),e.fillStyle.addColorStop(1,"#dcdad3"),e.beginPath(),e.arc(r,n,s,0,Math.PI*2),e.fill();o&&(e.fillStyle=o,e.beginPath(),e.arc(0,-.02,.3,0,Math.PI*2),e.fill())}function En(e,t,o,r){e.save(),e.rotate(o),e.fillStyle="#f3f1ea",e.fillRect(-.03,.08,.06,r),e.fillStyle=e.createRadialGradient(-.03,-.04,.01,0,0,.12),e.fillStyle.addColorStop(0,"#ffffff"),e.fillStyle.addColorStop(1,"#d6d3ca"),e.beginPath(),e.ellipse(0,0,.1,.14,0,0,Math.PI*2),e.fill(),t&&(e.fillStyle=t,e.beginPath(),e.ellipse(0,-.01,.085,.11,0,0,Math.PI*2),e.fill()),e.restore()}function Rn(e,t){let o=[];for(let n of[{count:8,radius:.66,spread:1.05},{count:7,radius:.44,spread:.95},{count:4,radius:.23,spread:.8}])for(let s=0;s<n.count;s++){let i=-Math.PI/2+(s/(n.count-1)-.5)*2*n.spread;o.push([Math.cos(i)*n.radius,Math.sin(i)*n.radius+.3])}let r={x:0,y:1.9};e.strokeStyle="#f1efe8",e.lineWidth=.05;for(let[n,s]of o)e.beginPath(),e.moveTo(n,s),e.lineTo(r.x+n*.12,r.y),e.lineTo(r.x+n*.1,r.y+1.6),e.stroke();e.fillStyle="#c0392b",e.fillRect(-.16,r.y-.05,.32,.1),o.forEach(([n,s],i)=>{e.fillStyle="#ffffff",e.beginPath(),e.ellipse(n,s,.07,.09,0,0,Math.PI*2),e.fill();let l=t?.[i%(t?.length||1)];l&&(e.fillStyle=l,e.beginPath(),e.ellipse(n,s-.01,.06,.075,0,0,Math.PI*2),e.fill())})}function An(e,t){e.save(),e.rotate(-.6),e.fillStyle=V(e,-.06,0,.06,0,["#ddd","#fff","#bbb"]),e.fillRect(-.06,0,.12,.22),e.fillStyle=V(e,-.28,0,.28,0,["#c8ccd0","#f4f6f7","#aab0b6"]),e.beginPath(),e.moveTo(-.14,.22),e.lineTo(.14,.22),e.lineTo(.3,.5),e.lineTo(.3,2.3),e.lineTo(-.3,2.3),e.lineTo(-.3,.5),e.closePath(),e.fill(),e.fillStyle=t??"#888",e.fillRect(-.3,1,.6,.75),e.fillStyle="#9aa0a6",e.fillRect(-.32,2.3,.64,.12),e.restore()}function Ln(e,t){e.save(),e.translate(-1.6,-1.9),e.rotate(.7),e.fillStyle=V(e,-.8,0,.8,0,["#fafafa","#e2e2e2"]),ve(e,-.8,-.2,1.6,2.4,.7),e.fill(),e.fillStyle="#d4d4d4",ve(e,-.45,2.1,.9,.7,.2),e.fill(),e.fillStyle=V(e,-.3,0,.3,0,["#e9e9e9","#cfcfcf"]),ve(e,-.32,2.5,.64,2,.18),e.fill(),e.strokeStyle="rgba(120,120,120,0.5)",e.lineWidth=.03;for(let o=0;o<6;o++)e.beginPath(),e.moveTo(-.5,.2+o*.22),e.lineTo(.5,.2+o*.22),e.stroke();e.restore(),e.strokeStyle="rgba(255,255,255,0.35)",e.lineWidth=.03;for(let o=0;o<4;o++){let r=(t*2.5+o/4)%1;e.beginPath(),e.arc(-1.6+1.6*r,-1.9+1.9*r,.4+.5*r,.2,1.4),e.stroke()}}function kn(e,t,o){if(e.save(),e.rotate(.55),Vt(e,t),e.restore(),e.save(),e.translate(.6,.4),e.rotate(-.75),Ue(e,0,5,.16,.24,De),e.restore(),o>.5){e.fillStyle="rgba(255,255,255,0.85)";for(let r=0;r<14;r++){let n=r*2.4,s=.25+r%5*.12;e.beginPath(),e.arc(Math.cos(n)*s,Math.sin(n)*s-.2,.02+r%3*.01,0,Math.PI*2),e.fill()}}}function Fn(e,t,o,r){switch(t.tool){case"wideBrush":return tt(e,2,o,De);case"flatBrush":return tt(e,1,o,De);case"trunkBrush":return tt(e,.42,o,zt);case"liner":return Vt(e,o);case"knife":return Tn(e);case"scrubber":return Sn(e);case"comb":return Pn(e);case"cotton":return Mn(e,o);case"swab":return En(e,o?.[Math.floor((o?.length??0)/2)],-.5,3);case"bundle":return Rn(e,o);case"tube":return An(e,t.paint);case"dryer":return Ln(e,r);case"spatter":return kn(e,o,t.pressure)}}function Bn(e,t){switch(e){case"wideBrush":case"flatBrush":case"trunkBrush":case"liner":case"comb":return t.angle+Math.PI/2;case"knife":return t.angle-Math.PI/2;default:return-.5}}var Cn=7;function Qt(e){let t=document.createElement("canvas"),o=e.getContext("2d"),r=t.getContext("2d");if(!o||!r)throw new Error("no 2d context for the tools");return{draw(n,s,i,l){let u=e.width/e.getBoundingClientRect().width||1;o.setTransform(1,0,0,1,0,0),o.clearRect(0,0,e.width,e.height);let h=s.scale*u*(1+.07*n.lift),c=Math.ceil(Cn*2*h);t.width!==c&&(t.width=c,t.height=c),r.setTransform(1,0,0,1,0,0),r.clearRect(0,0,c,c),r.setTransform(h,0,0,h,c/2,c/2),r.rotate(Bn(n.tool,n)),Fn(r,n,i,l);let d=(s.left+n.x*s.scale)*u,w=(s.top+n.y*s.scale)*u,y=.06+.32*n.lift;o.save(),o.shadowColor=`rgba(10, 14, 24, ${.42-.14*n.lift})`,o.shadowBlur=(.06+.3*n.lift)*s.scale*u,o.shadowOffsetX=y*s.scale*u*.8,o.shadowOffsetY=y*s.scale*u,o.drawImage(t,d-c/2,w-c/2),o.restore()},clear(){o.setTransform(1,0,0,1,0,0),o.clearRect(0,0,e.width,e.height)}}}var _n=880,be=new URLSearchParams(location.hash.slice(1)),no=Number(be.get("detail"))||(window.innerWidth<_n?72:128),ro=[1,2,4,8],Dn=6,X=e=>{let t=document.querySelector(e);if(!t)throw new Error(`missing ${e}`);return t},nt=X(".frame"),U=X("#painting"),rt=X("#tools"),it=X("#steps"),ut=X("#stages"),st=X("#status"),On=X("#caption"),at=X("#play"),so=X("#back"),ao=X("#ahead"),pe=X("#speed"),io=X("#download"),Y=Xt(),K=kt(Y,no),me;try{me=ht(U)}catch(e){throw st.textContent=e instanceof Error?e.message:String(e),e}var Se=Mt(me,K.width,K.height,no),uo=Et(Se),Jt=Qt(rt),lo={scale:1,left:0,top:0};function co(){let e=nt.getBoundingClientRect(),t=getComputedStyle(nt),o=Number.parseFloat(t.paddingLeft)+Number.parseFloat(t.paddingRight),r=Number.parseFloat(t.paddingTop)+Number.parseFloat(t.paddingBottom),n={width:Math.max(1,e.width-o),height:Math.max(1,e.height-r)},s=Math.min(n.width/Y.width,n.height/Y.height),i=Math.round(Y.width*s),l=Math.round(Y.height*s),u=Math.min(2,window.devicePixelRatio||1);U.style.width=`${i}px`,U.style.height=`${l}px`,U.width=Math.min(K.width,Math.round(i*u)),U.height=Math.min(K.height,Math.round(l*u)),rt.width=Math.round(e.width*u),rt.height=Math.round(e.height*u);let h=U.getBoundingClientRect();lo={scale:s,left:h.left-e.left,top:h.top-e.top}}var ho=0,Zt,eo;function Un(e){let t=ae[e.tool].body?uo.held(e.tool):void 0;if(t){if(eo!==e.tool||ho%Dn===0){let o=Se.probe(t,8);Zt=Array.from({length:8},(r,n)=>{let[s,i,l,u]=o.subarray(n*4,n*4+4);return`rgba(${s}, ${i}, ${l}, ${((u??0)/255).toFixed(2)})`}),eo=e.tool}return Zt}}var D=Ft({timeline:K,surface:Se,performer:uo,present(){me.bindFramebuffer(me.FRAMEBUFFER,null),me.viewport(0,0,U.width,U.height),Se.render()},drawTool(e){if(ho++,e.x>Y.width+1.5||e.y>Y.height+1.5){Jt.clear();return}Jt.draw(e,lo,Un(e),performance.now()/1e3)},onChange:Nn}),In=e=>`<span class="chip" style="--paint: ${Ee(Ae({[e]:1}))}" title="${He[e].name}"></span>`;it.innerHTML=Y.steps.map((e,t)=>`
    <li>
      <button type="button" data-step="${t}">
        <span class="number">${String(t+1).padStart(2,"0")}</span>
        <span class="what">
          <span class="title">${e.title}</span>
          <span class="tool">${ae[e.tool].label}</span>
        </span>
        <span class="paints" aria-hidden="true">${e.paints.map(In).join("")}</span>
      </button>
    </li>`).join("");ut.innerHTML=K.steps.map(({start:e,end:t})=>`<span class="stage" data-planned style="--share: ${(t-e).toFixed(2)}"></span>`).join("");var to=[...it.querySelectorAll("button")],Gn=[...ut.querySelectorAll(".stage")],oo=-1,Te=X(".rail");function qn(e){if(!e||Te.scrollHeight<=Te.clientHeight)return;let t=e.getBoundingClientRect(),o=Te.getBoundingClientRect();t.top<o.top+24?Te.scrollBy({top:t.top-o.top-24}):t.bottom>o.bottom-24&&Te.scrollBy({top:t.bottom-o.bottom+24})}function Nn(e){let t=Y.steps[e.step];if(!t)return;e.step!==oo&&(oo=e.step,to.forEach((r,n)=>{n===e.step?r.setAttribute("aria-current","step"):r.removeAttribute("aria-current"),r.toggleAttribute("data-done",n<e.step)}),On.textContent=t.note,qn(to[e.step]));let o=e.seeking!==null?`Painting up to step ${e.step+1}\u2026`:e.finished?"Finished":`Step ${e.step+1} of ${Y.steps.length} \xB7 ${ae[t.tool].label}`;st.textContent!==o&&(st.textContent=o),K.steps.forEach(({start:r,end:n},s)=>{let i=Math.min(1,Math.max(0,(e.time-r)/(n-r)));Gn[s]?.style.setProperty("--fill",i.toFixed(3))}),ut.dataset.time=e.time.toFixed(2),at.toggleAttribute("data-playing",e.playing),at.setAttribute("aria-label",e.playing?"Pause":"Play"),so.disabled=e.step===0&&e.time-(K.steps[0]?.start??0)<1,ao.disabled=e.finished,io.hidden=!e.finished}var Wn=2;function fo(){let{step:e,time:t}=D.state,o=K.steps[e]?.start??0;D.seekStep(t-o>Wn?e:e-1)}function po(){let{step:e}=D.state;e+1<Y.steps.length?D.seekStep(e+1):D.renderAt(K.duration)}function mo(){D.state.playing?D.pause():D.play()}it.addEventListener("click",e=>{let t=e.target.closest("button[data-step]");t&&D.seekStep(Number(t.dataset.step))});at.addEventListener("click",mo);so.addEventListener("click",fo);ao.addEventListener("click",po);pe.innerHTML=ro.map(e=>`<option value="${e}">${e}\xD7</option>`).join("");pe.value=String(ro.includes(Number(be.get("speed")))?Number(be.get("speed")):2);D.setSpeed(Number(pe.value));pe.addEventListener("change",()=>{D.setSpeed(Number(pe.value)),be.set("speed",pe.value),history.replaceState(null,"",`#${be}`)});window.addEventListener("keydown",e=>{e.target instanceof HTMLSelectElement||e.metaKey||e.ctrlKey||(e.key===" "&&!(e.target instanceof HTMLButtonElement)?(e.preventDefault(),mo()):e.key==="ArrowLeft"?fo():e.key==="ArrowRight"&&po())});function bo(){let e={width:U.width,height:U.height};U.width=K.width,U.height=K.height,me.viewport(0,0,U.width,U.height),Se.render();let t=U.toDataURL("image/png");return U.width=e.width,U.height=e.height,D.redraw(),t}io.addEventListener("click",()=>{let e=document.createElement("a");e.download="fox-at-the-edge-of-the-wood.png",e.href=bo(),e.click()});new ResizeObserver(()=>{co(),D.redraw()}).observe(nt);co();var Hn=Math.max(0,Math.min(Y.steps.length-1,Number(be.get("step")??1)-1));D.seekStep(Hn);matchMedia("(prefers-reduced-motion: reduce)").matches||D.play();Object.assign(window,{studio:{duration:K.duration,steps:K.steps,titles:Y.steps.map(e=>e.title),renderAt:e=>D.renderAt(e),pause:()=>D.pause(),fullSizePng:bo,get state(){return D.state}}});})();
