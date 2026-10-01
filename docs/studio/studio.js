"use strict";(()=>{var Pn=Object.create;var dt=Object.defineProperty;var Mn=Object.getOwnPropertyDescriptor;var En=Object.getOwnPropertyNames;var An=Object.getPrototypeOf,Rn=Object.prototype.hasOwnProperty;var Ln=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var Fn=(e,t,n,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of En(t))!Rn.call(e,o)&&o!==n&&dt(e,o,{get:()=>t[o],enumerable:!(r=Mn(t,o))||r.enumerable});return e};var kn=(e,t,n)=>(n=e!=null?Pn(An(e)):{},Fn(t||!e||!e.__esModule?dt(n,"default",{value:e,enumerable:!0}):n,e));var Ot=Ln((fr,_t)=>{"use strict";var se=function(e){e==null&&(e=new Date().getTime()),this.N=624,this.M=397,this.MATRIX_A=2567483615,this.UPPER_MASK=2147483648,this.LOWER_MASK=2147483647,this.mt=new Array(this.N),this.mti=this.N+1,e.constructor==Array?this.init_by_array(e,e.length):this.init_seed(e)};se.prototype.init_seed=function(e){for(this.mt[0]=e>>>0,this.mti=1;this.mti<this.N;this.mti++){var e=this.mt[this.mti-1]^this.mt[this.mti-1]>>>30;this.mt[this.mti]=(((e&4294901760)>>>16)*1812433253<<16)+(e&65535)*1812433253+this.mti,this.mt[this.mti]>>>=0}};se.prototype.init_by_array=function(e,t){var n,r,o;for(this.init_seed(19650218),n=1,r=0,o=this.N>t?this.N:t;o;o--){var s=this.mt[n-1]^this.mt[n-1]>>>30;this.mt[n]=(this.mt[n]^(((s&4294901760)>>>16)*1664525<<16)+(s&65535)*1664525)+e[r]+r,this.mt[n]>>>=0,n++,r++,n>=this.N&&(this.mt[0]=this.mt[this.N-1],n=1),r>=t&&(r=0)}for(o=this.N-1;o;o--){var s=this.mt[n-1]^this.mt[n-1]>>>30;this.mt[n]=(this.mt[n]^(((s&4294901760)>>>16)*1566083941<<16)+(s&65535)*1566083941)-n,this.mt[n]>>>=0,n++,n>=this.N&&(this.mt[0]=this.mt[this.N-1],n=1)}this.mt[0]=2147483648};se.prototype.random_int=function(){var e,t=new Array(0,this.MATRIX_A);if(this.mti>=this.N){var n;for(this.mti==this.N+1&&this.init_seed(5489),n=0;n<this.N-this.M;n++)e=this.mt[n]&this.UPPER_MASK|this.mt[n+1]&this.LOWER_MASK,this.mt[n]=this.mt[n+this.M]^e>>>1^t[e&1];for(;n<this.N-1;n++)e=this.mt[n]&this.UPPER_MASK|this.mt[n+1]&this.LOWER_MASK,this.mt[n]=this.mt[n+(this.M-this.N)]^e>>>1^t[e&1];e=this.mt[this.N-1]&this.UPPER_MASK|this.mt[0]&this.LOWER_MASK,this.mt[this.N-1]=this.mt[this.M-1]^e>>>1^t[e&1],this.mti=0}return e=this.mt[this.mti++],e^=e>>>11,e^=e<<7&2636928640,e^=e<<15&4022730752,e^=e>>>18,e>>>0};se.prototype.random_int31=function(){return this.random_int()>>>1};se.prototype.random_incl=function(){return this.random_int()*(1/4294967295)};se.prototype.random=function(){return this.random_int()*(1/4294967296)};se.prototype.random_excl=function(){return(this.random_int()+.5)*(1/4294967296)};se.prototype.random_long=function(){var e=this.random_int()>>>5,t=this.random_int()>>>6;return(e*67108864+t)*(1/9007199254740992)};_t.exports=se});function pt(e){let t=e.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!0});if(!t)throw new Error("This browser has no WebGL2, which the paint simulation needs.");if(!t.getExtension("EXT_color_buffer_float"))throw new Error("This GPU cannot render to float textures, which the paint simulation needs.");return t}var Cn={rgba16f:WebGL2RenderingContext.RGBA16F,rgba8:WebGL2RenderingContext.RGBA8};function ue(e,t,n,r="rgba16f"){let o=e.createTexture();e.bindTexture(e.TEXTURE_2D,o),e.texStorage2D(e.TEXTURE_2D,1,Cn[r],t,n),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);let s=e.createFramebuffer();e.bindFramebuffer(e.FRAMEBUFFER,s),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,o,0);let u=e.checkFramebufferStatus(e.FRAMEBUFFER);if(e.bindFramebuffer(e.FRAMEBUFFER,null),u!==e.FRAMEBUFFER_COMPLETE)throw new Error(`A ${t}\xD7${n} ${r} render target is incomplete (0x${u.toString(16)}).`);return{texture:o,framebuffer:s,width:t,height:n}}function le(e,t){e.deleteFramebuffer(t.framebuffer),e.deleteTexture(t.texture)}function Ee(e,t){let n=e.createFramebuffer();e.bindFramebuffer(e.FRAMEBUFFER,n),t.forEach((o,s)=>{e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+s,e.TEXTURE_2D,o.texture,0)}),e.drawBuffers(t.map((o,s)=>e.COLOR_ATTACHMENT0+s));let r=e.checkFramebufferStatus(e.FRAMEBUFFER);if(e.bindFramebuffer(e.FRAMEBUFFER,null),r!==e.FRAMEBUFFER_COMPLETE)throw new Error(`A ${t.length}-target framebuffer is incomplete (0x${r.toString(16)}).`);return n}function Ke(e,t,n,r,o,s,u){e.bindFramebuffer(e.READ_FRAMEBUFFER,t.framebuffer),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,n.framebuffer),e.blitFramebuffer(r,o,r+s,o+u,r,o,r+s,o+u,e.COLOR_BUFFER_BIT,e.NEAREST),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null)}var Bn=`#version 300 es
in vec2 aCorner;
out vec2 vUv;
void main() {
  vUv = aCorner * 0.5 + 0.5;
  gl_Position = vec4(aCorner, 0.0, 1.0);
}
`;function ee(e,t,n=Bn){let r=(h,c)=>{let f=e.createShader(h);if(!f)throw new Error("could not create a shader");if(e.shaderSource(f,c),e.compileShader(f),!e.getShaderParameter(f,e.COMPILE_STATUS)){let x=e.getShaderInfoLog(f)??"";throw e.deleteShader(f),new Error(`${h===e.VERTEX_SHADER?"Vertex":"Fragment"} shader:
${x}
${Dn(c)}`)}return f},o=e.createProgram(),s=r(e.VERTEX_SHADER,n),u=r(e.FRAGMENT_SHADER,t);if(e.attachShader(o,s),e.attachShader(o,u),e.bindAttribLocation(o,0,"aCorner"),e.linkProgram(o),!e.getProgramParameter(o,e.LINK_STATUS))throw new Error(`Program link:
${e.getProgramInfoLog(o)??""}`);e.deleteShader(s),e.deleteShader(u);let l=new Map,i=h=>(l.has(h)||l.set(h,e.getUniformLocation(o,h)),l.get(h)??null);return{handle:o,use:()=>e.useProgram(o),set(h,c){let f=i(h);if(!f)return;if(typeof c=="number"){e.uniform1f(f,c);return}let x=c instanceof Float32Array?c:new Float32Array(c);x.length===2?e.uniform2fv(f,x):x.length===3?e.uniform3fv(f,x):x.length===4?e.uniform4fv(f,x):e.uniform1fv(f,x)},setInt(h,c){let f=i(h);f&&(typeof c=="number"?e.uniform1i(f,c):c.length===2?e.uniform2iv(f,c):e.uniform1iv(f,c))},texture(h,c,f){e.activeTexture(e.TEXTURE0+c),e.bindTexture(e.TEXTURE_2D,f);let x=i(h);x&&e.uniform1i(x,c)}}}var Dn=e=>e.split(`
`).map((t,n)=>`${String(n+1).padStart(4)}  ${t}`).join(`
`);function mt(e){let t=e.createVertexArray(),n=e.createBuffer();return e.bindVertexArray(t),e.bindBuffer(e.ARRAY_BUFFER,n),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindVertexArray(null),()=>{e.bindVertexArray(t),e.drawArrays(e.TRIANGLE_STRIP,0,4)}}var ze={titaniumWhite:{name:"Titanium white",masstone:"#f6f5f0",scattering:1},skyBlue:{name:"Sky blue",masstone:"#4aa6dc",scattering:.8},cobaltBlue:{name:"Cobalt blue",masstone:"#1f4fb4",scattering:.35},prussianBlue:{name:"Prussian blue",masstone:"#0f1d4c",scattering:.12},cadmiumYellow:{name:"Cadmium yellow",masstone:"#f7c41a",scattering:.5},yellowOchre:{name:"Yellow ochre",masstone:"#c8961e",scattering:.6},burntSienna:{name:"Burnt sienna",masstone:"#9a3a16",scattering:.35},sapGreen:{name:"Sap green",masstone:"#1f6b2c",scattering:.25},phthaloGreen:{name:"Phthalo green",masstone:"#0d3c39",scattering:.1},burntUmber:{name:"Burnt umber",masstone:"#3a2416",scattering:.3},marsBlack:{name:"Mars black",masstone:"#121212",scattering:.35}},Ye=e=>e<=.04045?e/12.92:((e+.055)/1.055)**2.4,_n=e=>e<=.0031308?e*12.92:1.055*e**(1/2.4)-.055;function Ae(e){let t=Number.parseInt(e.replace("#",""),16);return[Ye((t>>16&255)/255),Ye((t>>8&255)/255),Ye((t&255)/255)]}function Re(e){let t=n=>Math.round(Math.min(1,Math.max(0,_n(n)))*255).toString(16).padStart(2,"0");return`#${t(e[0])}${t(e[1])}${t(e[2])}`}function On(e){let t=e.scattering*4;return{absorption:Ae(e.masstone).map(o=>{let s=Math.min(.999,Math.max(.001,o));return(1-s)**2/(2*s)*t}),scattering:[t,t,t]}}function Le(e){let t=[0,0,0],n=[0,0,0],r=0,o=(s,u,l)=>[s[0]+l*u[0],s[1]+l*u[1],s[2]+l*u[2]];for(let[s,u]of Object.entries(e)){if(!u)continue;let l=On(ze[s]);t=o(t,l.absorption,u),n=o(n,l.scattering,u),r+=u}if(r===0)throw new Error("a mix needs at least one paint");return{absorption:t.map(s=>s/r),scattering:n.map(s=>s/r)}}function In(e,t,n){return[0,1,2].map(r=>{let o=e.absorption[r],s=Math.max(1e-4,e.scattering[r]),u=n[r],l=1+o/s,i=Math.sqrt(l*l-1),h=Math.tanh(i*s*t);return(h*(1-u*l)+u*i)/(h*(l-u)+i)})}var Fe=e=>In(Le(e),1e3,[0,0,0]);var oe=`
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
`,Xe=`
const int FLAT = 0;
const int ROUND = 1;
const int KNIFE = 2;
const int SCRUBBER = 3;
const int COMB = 4;
const int SWAB = 5;
const int BUNDLE = 6;
const int COTTON = 7;
const int PEN = 8;

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
  // Paint clings to some teeth and not others; a dry tooth leaves no blade.
  float held = step(0.25, unit(seed)) * (0.45 + 0.55 * unit(hash(seed, 7u)));
  // The comb meets the canvas a little tilted, so its teeth touch down one by
  // one, and as it lifts each leaves at its own moment: the blades start at
  // different heights and come out different lengths.
  float lands = smoothstep(0.0, 0.06, mix(0.82, 1.05, unit(hash(seed, 5u))) - uPressure);
  float stays = smoothstep(0.0, 0.08, uPressure - mix(0.12, 0.7, unit(hash(seed, 3u))));
  float width = uShape.y * (0.35 + 0.65 * uPressure);
  return (1.0 - smoothstep(width * 0.5, width, off)) * tip * held * lands * stays;
}

// The cotton tip of a swab: a dome with a fuzzy rim.
float swabTip(vec2 q, uint seed) {
  float r = length(q);
  float around = atan(q.y, q.x) / TAU;
  float fuzz = 0.14 * (noise1(around * 14.0, seed) - 0.5);
  float body = 1.0 - smoothstep(0.72 + fuzz, 0.98 + fuzz, r);
  return body * (0.78 + 0.22 * noise2(q * 5.0, seed + 3u));
}

// A bundle of swabs held together and fanned out at the tips. Every time the
// bundle is pressed the tips splay differently, and squash flatter or less,
// so no two stamps print the same pattern.
float bundle(vec2 q) {
  uint seed = uint(uDabSeed);
  float touch = 0.0;
  for (int i = 0; i < 24; i++) {
    if (i >= uSwabCount) break;
    vec3 swab = uSwabs[i];
    vec2 flex = (vec2(random(seed, uint(i) * 2u), random(seed, uint(i) * 2u + 1u)) - 0.5) * 0.24;
    float squash = mix(0.75, 1.2, random(seed, uint(i) + 200u));
    float lands = step(0.35, random(seed, uint(i) + 100u));
    touch = max(touch, lands * swabTip((q - swab.xy - flex) / (swab.z * squash), seed + uint(i)));
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

// The felt nib of a paint pen: a firm round point, the same width however
// hard it is pressed, wet all the way across.
float penNib(vec2 q) {
  return 1.0 - smoothstep(0.8, 1.0, length(q));
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
  if (uKind == PEN) return penNib(q);
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
  if (uKind == PEN) return penNib(q);
  return 0.0;
}
`,me=`
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
`,bt=`
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
/** Of the wet paint under a brush's bristles, the share they carry forward with each touch. */
uniform float uDrag;

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

/** Height of the dry paint and canvas at a point, without anything still wet on it. */
float dryHeight(vec2 p) {
  float paint = texture(uDry, p / uCanvas).a;
  return paint + weaveRelief(p, paint);
}

/**
 * How thick a pen's film is at p. Its paint is fluid and settles: it runs
 * into the hollows of the dry paint beneath and thins over the ridges, so
 * the film's top comes out smooth however textured the ground under it.
 */
float penFilm(vec2 p) {
  float around = 0.25 * (dryHeight(p + vec2(4.0, 0.0)) + dryHeight(p - vec2(4.0, 0.0))
    + dryHeight(p + vec2(0.0, 4.0)) + dryHeight(p - vec2(0.0, 4.0)));
  return max(0.3 * uLevel, uLevel + around - dryHeight(p));
}

/**
 * The thickness the tool levels paint to at q. A blade is flat and leaves a
 * plateau. A brush is not: its clumps of bristles scrape deeper than the gaps
 * between them, and a lighter touch rides higher, so a blob of paint under a
 * brush is dragged out in ridges along the stroke instead of shaved flat to
 * its own outline.
 */
float levelAt(vec2 q, vec2 p) {
  if (uKind == PEN) return penFilm(p);
  if (uKind != FLAT && uKind != ROUND) return uLevel;
  float clumps = bristles(q.x, max(uShape.x, 4.0));
  return uLevel * mix(1.3, 0.75, clumps) * mix(1.2, 0.9, uPressure);
}

struct Touch { float lay; float lift; float reach; float level; };

/** How strongly the tool lays paint down and lifts it, at a point of contact. */
Touch touchAt(vec2 q, vec2 p) {
  float press = footprint(q);
  press *= relief(p, press);
  Touch touch = Touch(press, press, max(press, reach(q)), levelAt(q, p));
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
  if (uKind == PEN) {
    // A paint pen's nib is fed from the barrel as fast as it lets paint go,
    // and wets the canvas to an even film wherever its face touches; only the
    // very rim of the nib is soft. Where the film is already full, another
    // pass adds nothing. It lifts nothing.
    float film = max(0.0, touch.level - (fresh.v + below.v));
    float wets = smoothstep(0.2, 0.7, touch.lay);
    return Exchange(clamp(wets * uDeposit, 0.0, 1.0) * film, 0.0, 0.0, 0.0);
  }
  float room = clamp(1.0 - onTool / uCapacity, 0.0, 1.0);
  float wetTop = fresh.v * fresh.wet;
  float wetUnder = below.v * below.wet;
  float wet = wetTop + wetUnder;
  float lifted = clamp(touch.lift * uPickup, 0.0, 1.0) * wet * room;
  if (uLevel >= 0.0) {
    float thickness = fresh.v + below.v;
    float excess = max(0.0, thickness - touch.level);
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
`,re=`#version 300 es
`,qn=`
/**
 * How far one touch carries paint, in texels: about half the contact's
 * depth, never quite the same twice, so what a stroke carries smears out
 * instead of landing in a row of copies.
 */
vec2 carried() {
  float distance = 0.5 * uHalf.y * mix(0.55, 1.45, random(uint(uDabSeed), 41u));
  return vec2(-uAxis.y, uAxis.x) * distance;
}

/** A layer with a share of its wet paint carried off, and a share of 'behind's brought in. */
Layer dragLayer(Layer here, Layer behind, float gives, float takes) {
  Layer kept = take(here, gives * here.v * here.wet);
  return add(kept, behind, takes * behind.v * behind.wet, behind.wet);
}

// The whole body of the brush carries paint, not just its fullest bristles,
// so a stroke shifts the paint under it evenly rather than plowing furrows.
void drag(vec2 p, float body, inout Layer below, inout Layer fresh) {
  if (uDrag <= 0.0) return;
  vec2 from = p - carried();
  float gives = clamp(body * uDrag, 0.0, 1.0);
  float takes = clamp(reach(toolFrame(from)) * uDrag, 0.0, 1.0);
  if (gives <= 0.0 && takes <= 0.0) return;
  vec2 uv = from / uCanvas;
  below = dragLayer(below, underLayerAt(uv), gives, takes);
  fresh = dragLayer(fresh, topLayerAt(uv), gives, takes);
}
`,yt=`${re}
${oe}
${me}
uniform sampler2D uToolPigment;
uniform sampler2D uToolScatter;
${Xe}
${bt}
${qn}
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
  // Dragged paint can land just past the front of the contact.
  if (abs(q.x) > 1.0 || abs(q.y) > (uDrag > 0.0 ? 1.5 : 1.0)) return;
  Touch touch = touchAt(q, gl_FragCoord.xy);
  if (touch.lay <= 0.0 && touch.reach <= 0.0) {
    drag(gl_FragCoord.xy, 0.0, below, fresh);
    writeLayer(below, outPigment, outScatter);
    writeLayer(fresh, outTopPigment, outTopScatter);
    return;
  }

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
  drag(gl_FragCoord.xy, reach(q), below, fresh);
  writeLayer(below, outPigment, outScatter);
  writeLayer(fresh, outTopPigment, outTopScatter);
}
`,xt=`${re}
${oe}
${me}
uniform sampler2D uToolPigment;
uniform sampler2D uToolScatter;
/** How much paint each point of the tool shares with its neighbors per touch. */
uniform float uShare;
${Xe}
${bt}
in vec2 vUv;
layout(location = 0) out vec4 outPigment;
layout(location = 1) out vec4 outScatter;

void main() {
  ivec2 texel = ivec2(gl_FragCoord.xy);
  ivec2 size = textureSize(uToolPigment, 0);
  vec4 toolPigment = texelFetch(uToolPigment, texel, 0);
  vec4 toolScatter = texelFetch(uToolScatter, texel, 0);
  if (uShare > 0.0) {
    // Across to the neighboring bristles, and along each bristle's length, so
    // a shape the brush picks up blurs into its load instead of being printed
    // again at every touch.
    ivec2 left = ivec2(max(texel.x - 1, 0), texel.y);
    ivec2 right = ivec2(min(texel.x + 1, size.x - 1), texel.y);
    ivec2 back = ivec2(texel.x, max(texel.y - 1, 0));
    ivec2 front = ivec2(texel.x, min(texel.y + 1, size.y - 1));
    vec4 nearPigment = 0.25 * (texelFetch(uToolPigment, left, 0) + texelFetch(uToolPigment, right, 0)
      + texelFetch(uToolPigment, back, 0) + texelFetch(uToolPigment, front, 0));
    vec4 nearScatter = 0.25 * (texelFetch(uToolScatter, left, 0) + texelFetch(uToolScatter, right, 0)
      + texelFetch(uToolScatter, back, 0) + texelFetch(uToolScatter, front, 0));
    toolPigment = mix(toolPigment, nearPigment, uShare);
    toolScatter = mix(toolScatter, nearScatter, uShare);
  }
  outPigment = toolPigment;
  outScatter = toolScatter;
  // A pen's barrel refills its nib as fast as the nib lets paint go.
  if (uKind == PEN) return;

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
`,wt=`${re}
${oe}
uniform sampler2D uToolPigment;
uniform sampler2D uToolScatter;
uniform vec3 uAbsorption;
uniform vec3 uScattering;
uniform float uAmount;
uniform float uKeep;
uniform float uUneven;
uniform float uLoadSeed;
${Xe}
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
  // A pen's nib is soaked evenly from the barrel.
  float uneven = uKind == PEN ? 0.0 : uUneven;
  float share = mix(1.0, (0.45 + 0.75 * clumps) * (0.75 + 0.5 * speckle), uneven) * heel;
  float thickness = uAmount * share;
  outPigment = oldPigment + vec4(uAbsorption * thickness, thickness);
  outScatter = vec4(oldScatter.rgb + uScattering * thickness, 0.0);
}
`,gt=`${re}
${oe}
${me}
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
`,vt=`
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
`,Tt=`${re}
${oe}
${me}
${vt}
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
`,St=`${re}
${oe}
${me}
${vt}
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
`,Pt=`${re}
${oe}
uniform vec3 uGesso;
out vec4 outDry;

void main() {
  // Gesso fills the weave without hiding it, a little irregularly.
  float sizing = noise2(gl_FragCoord.xy / 40.0, 7u);
  outDry = vec4(uGesso * (0.985 + 0.03 * sizing), 0.0);
}
`,Mt=`${re}
${oe}
${me}
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
`,Et=`${re}
${oe}
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
`;var At={flat:0,round:1,knife:2,scrubber:3,comb:4,swab:5,bundle:6,cotton:7,pen:8},ve=["pigment","scatter","topPigment","topScatter"],ke=[...ve,"dry"],Un="#eeece6",Gn=18,Wn=(()=>{let e=[-.42,.5,.76],t=Math.hypot(...e);return e.map(n=>n/t)})();function Rt(e,t,n,r){let o=mt(e),s={dab:ee(e,yt),tool:ee(e,xt),load:ee(e,wt),deposit:ee(e,gt),dryColor:ee(e,Tt),dryWet:ee(e,St),prime:ee(e,Pt),display:ee(e,Mt),probe:ee(e,Et)},u=r/Gn,l=()=>({pigment:ue(e,t,n),scatter:ue(e,t,n),topPigment:ue(e,t,n),topScatter:ue(e,t,n),dry:ue(e,t,n)}),i=l(),h=l(),c=Ee(e,ve.map(a=>h[a])),f=null,x=(a,d,b,y)=>{let p=Math.max(0,Math.floor(a)-2),A=Math.max(0,Math.floor(d)-2),w=Math.min(t,Math.ceil(b)+2),C=Math.min(n,Math.ceil(y)+2);return w<=p||C<=A?null:{x:p,y:A,w:w-p,h:C-A}},M=(a,d,b,y,p,A)=>{let w=Math.abs(b)*p+Math.abs(y)*A,C=Math.abs(y)*p+Math.abs(b)*A;return x(a-w,d-C,a+w,d+C)},k=(a,d)=>{for(let b of d)Ke(e,h[b],i[b],a.x,a.y,a.w,a.h)},N=(a,d)=>{e.bindFramebuffer(e.FRAMEBUFFER,a),e.viewport(0,0,t,n),e.enable(e.SCISSOR_TEST),e.scissor(d.x,d.y,d.w,d.h),o(),e.disable(e.SCISSOR_TEST),e.bindFramebuffer(e.FRAMEBUFFER,null)},_=a=>{a.texture("uPigment",0,i.pigment.texture),a.texture("uScatter",1,i.scatter.texture),a.texture("uTopPigment",2,i.topPigment.texture),a.texture("uTopScatter",3,i.topScatter.texture),a.texture("uDry",4,i.dry.texture)},W=(a,d,b)=>{let{body:y}=d;a.setInt("uKind",At[y.kind]),a.set("uToolSeed",y.seed%16777216),a.set("uStrokeSeed",b.strokeSeed%16777216),a.set("uDabSeed",b.dabSeed%16777216),a.set("uPressure",b.pressure),a.set("uTwist",b.twist??0),a.set("uShape",y.shape),U(a,y),a.set("uCanvas",[t,n]),a.set("uCenter",[b.x,b.y]),a.set("uAxis",[b.axisX,b.axisY]),a.set("uHalf",[b.halfAcross,b.halfAlong]),a.set("uDeposit",b.deposit??y.deposit),a.set("uPickup",b.pickup??y.pickup),a.set("uCapacity",y.capacity),a.set("uSkim",b.skim),a.set("uLevel",b.level??y.level??-1),a.set("uScrape",b.scrape??y.scrape??0),a.set("uChurn",y.churn),a.set("uPull",y.pull??0),a.set("uDrag",y.drag??0),a.set("uWeavePitch",u)},U=(a,d)=>{let b=d.swabs??[];if(a.setInt("uSwabCount",b.length),!b.length)return;let y=e.getUniformLocation(a.handle,"uSwabs");y&&e.uniform3fv(y,new Float32Array(b.flat()))},m=()=>{e.disable(e.SCISSOR_TEST);for(let a of ve)e.bindFramebuffer(e.FRAMEBUFFER,i[a].framebuffer),e.clearBufferfv(e.COLOR,0,[0,0,0,0]);e.bindFramebuffer(e.FRAMEBUFFER,i.dry.framebuffer),e.viewport(0,0,t,n),s.prime.use(),s.prime.set("uGesso",Ae(Un)),s.prime.set("uWeavePitch",u),o(),e.bindFramebuffer(e.FRAMEBUFFER,null)},g=a=>{let[d,b]=a.resolution,y=()=>ue(e,d,b),p=y(),A=y(),w=y(),C=y(),z={body:a,pigment:p,scatter:A,nextPigment:w,nextScatter:C,framebuffer:Ee(e,[p,A]),nextFramebuffer:Ee(e,[w,C])};return F(z),z},E=a=>{[a.pigment,a.nextPigment]=[a.nextPigment,a.pigment],[a.scatter,a.nextScatter]=[a.nextScatter,a.scatter],[a.framebuffer,a.nextFramebuffer]=[a.nextFramebuffer,a.framebuffer]},F=a=>{e.disable(e.SCISSOR_TEST),e.bindFramebuffer(e.FRAMEBUFFER,a.framebuffer),e.viewport(0,0,a.pigment.width,a.pigment.height),e.clearBufferfv(e.COLOR,0,[0,0,0,0]),e.clearBufferfv(e.COLOR,1,[0,0,0,0]),e.bindFramebuffer(e.FRAMEBUFFER,null)},T=(a,d,b,y={})=>{let{absorption:p,scattering:A}=Le(d),w=s.load;e.disable(e.SCISSOR_TEST),e.bindFramebuffer(e.FRAMEBUFFER,a.nextFramebuffer),e.viewport(0,0,a.pigment.width,a.pigment.height),w.use(),w.texture("uToolPigment",5,a.pigment.texture),w.texture("uToolScatter",6,a.scatter.texture),w.set("uAbsorption",p),w.set("uScattering",A),w.set("uAmount",b),w.set("uKeep",y.keep??0),w.set("uUneven",y.uneven??.6),w.set("uLoadSeed",(y.seed??1)%16777216),w.setInt("uKind",At[a.body.kind]),w.set("uToolSeed",a.body.seed%16777216),w.set("uStrokeSeed",(y.seed??1)%16777216),w.set("uShape",a.body.shape),o(),e.bindFramebuffer(e.FRAMEBUFFER,null),E(a)},L=(a,d)=>{let b=M(d.x,d.y,d.axisX,d.axisY,d.halfAcross,d.halfAlong*(a.body.drag?1.5:1));if(!b)return;let y=s.dab;y.use(),_(y),y.texture("uToolPigment",5,a.pigment.texture),y.texture("uToolScatter",6,a.scatter.texture),W(y,a,d),N(c,b),e.bindFramebuffer(e.FRAMEBUFFER,a.nextFramebuffer),e.viewport(0,0,a.pigment.width,a.pigment.height);let p=s.tool;p.use(),_(p),p.texture("uToolPigment",5,a.pigment.texture),p.texture("uToolScatter",6,a.scatter.texture),p.set("uShare",a.body.share),W(p,a,d),o(),e.bindFramebuffer(e.FRAMEBUFFER,null),k(b,ve),E(a)},R=a=>{let d=M(a.x,a.y,a.axisX,a.axisY,a.halfAcross,a.halfAlong);if(!d)return;let{absorption:b,scattering:y}=Le(a.mix),p=s.deposit;p.use(),_(p),p.set("uCenter",[a.x,a.y]),p.set("uAxis",[a.axisX,a.axisY]),p.set("uHalf",[a.halfAcross,a.halfAlong]),p.setInt("uShapeKind",a.shape==="drop"?0:1),p.set("uThickness",a.thickness),p.set("uAbsorption",b),p.set("uScattering",y),p.set("uSeed",a.seed%16777216),N(c,d),k(d,ve)},v=(a,d,b,y)=>{let p=x(a-b,d-b,a+b,d+b);if(!p)return;let A=[[s.dryColor,h.dry.framebuffer],[s.dryWet,c]];for(let[w,C]of A)w.use(),_(w),w.set("uCenter",[a,d]),w.set("uRadius",b),w.set("uAmount",y),N(C,p);k(p,ke)},P=(a={})=>{let d=s.display;d.use(),_(d),d.set("uCanvas",[t,n]),d.set("uLight",Wn),d.set("uRelief",a.relief??.9),d.set("uWeavePitch",u),o()},B=(a,d)=>{(!f||f.width!==d)&&(f&&le(e,f),f=ue(e,d,1,"rgba8")),e.bindFramebuffer(e.FRAMEBUFFER,f.framebuffer),e.viewport(0,0,d,1),e.disable(e.SCISSOR_TEST);let b=s.probe;b.use(),b.texture("uToolPigment",5,a.pigment.texture),b.texture("uToolScatter",6,a.scatter.texture),b.set("uBare",Ae(a.body.bare)),o();let y=new Uint8Array(d*4);return e.readPixels(0,0,d,1,e.RGBA,e.UNSIGNED_BYTE,y),e.bindFramebuffer(e.FRAMEBUFFER,null),y},S=(a,d)=>{for(let b of ke)Ke(e,a[b],d[b],0,0,t,n)};return{width:t,height:n,prime:m,createTool:g,load:T,clean:F,touch:L,deposit:R,dry:v,render:P,probe:B,snapshot(a){let d=a??l();return S(i,d),d},restore(a){S(a,i)},release(a){for(let d of ke)le(e,a[d])},releaseTool(a){for(let d of[a.pigment,a.scatter,a.nextPigment,a.nextScatter])le(e,d);e.deleteFramebuffer(a.framebuffer),e.deleteFramebuffer(a.nextFramebuffer)},destroy(){for(let a of ke)le(e,i[a]),le(e,h[a]);f&&le(e,f),e.deleteFramebuffer(c);for(let a of Object.values(s))e.deleteProgram(a.handle)}}}var Hn=(()=>{let e=[],t=[{count:8,radius:.78,spread:1.05},{count:7,radius:.52,spread:.95},{count:4,radius:.27,spread:.8}];for(let n of t)for(let r=0;r<n.count;r++){let o=Math.PI/2+(r/(n.count-1)-.5)*2*n.spread;e.push([Math.cos(o)*n.radius,Math.sin(o)*n.radius-.35,.075])}return e})(),te={tube:{name:"tube",label:"Paint, straight from the tube",width:.52,depth:.72,lightDepth:1,spacing:1,speed:6},wideBrush:{name:"wideBrush",label:"Two-inch flat brush",body:{kind:"flat",seed:2101,shape:[26,0,0,0],deposit:.09,pickup:.18,capacity:36,level:2,scrape:.6,churn:.3,drag:.35,share:.05,bare:"#9a8c74",resolution:[256,48]},width:2,depth:.42,lightDepth:.55,spacing:.22,speed:9},knife:{name:"knife",label:"Painting knife",body:{kind:"knife",seed:3301,shape:[0,0,0,0],deposit:.2,pickup:.25,capacity:40,level:1.6,scrape:.55,churn:.25,share:0,bare:"#b9bcc0",resolution:[80,160]},width:.62,depth:1.35,lightDepth:.8,spacing:.06,speed:4},flatBrush:{name:"flatBrush",label:"One-inch flat brush",body:{kind:"flat",seed:1102,shape:[15,0,0,0],deposit:.1,pickup:.16,capacity:30,level:2,scrape:.55,churn:.3,drag:.3,share:.05,bare:"#a39377",resolution:[160,40]},width:1,depth:.3,lightDepth:.6,spacing:.22,speed:7},scrubber:{name:"scrubber",label:"Steel-wool scrubber on a jar lid",body:{kind:"scrubber",seed:4401,shape:[12,0,0,0],deposit:.3,pickup:.1,capacity:3,churn:.3,pull:.5,share:0,bare:"#8f9396",resolution:[192,192]},width:2.6,depth:2.6,lightDepth:.9,spacing:1,speed:30},trunkBrush:{name:"trunkBrush",label:"Half-inch flat brush",body:{kind:"flat",seed:5502,shape:[8,0,0,0],deposit:.05,pickup:.03,capacity:30,churn:.04,drag:.2,share:.04,bare:"#8e8068",resolution:[96,40]},width:.42,depth:.2,lightDepth:.6,spacing:.25,speed:7},spatter:{name:"spatter",label:"Round brush, tapped on a handle",width:.3,depth:.3,lightDepth:1,spacing:1,speed:10},comb:{name:"comb",label:"Fine-tooth comb",body:{kind:"comb",seed:6601,shape:[16,.22,0,0],deposit:.28,pickup:.05,capacity:6,churn:.02,share:0,bare:"#2a2a2c",resolution:[192,16]},width:1.05,depth:.07,lightDepth:.7,spacing:.5,speed:6},liner:{name:"liner",label:"Liner brush",body:{kind:"round",seed:7702,shape:[3,.9,0,0],deposit:.3,pickup:.03,capacity:8,churn:0,share:.05,bare:"#c9b18a",resolution:[24,24]},width:.07,depth:.07,lightDepth:.45,spacing:.3,speed:3.5},dryer:{name:"dryer",label:"Hair dryer",width:5,depth:5,lightDepth:1,spacing:.08,speed:4},cotton:{name:"cotton",label:"Cotton ball in a clothespin",body:{kind:"cotton",seed:8801,shape:[0,0,0,0],deposit:.34,pickup:.05,capacity:8,churn:.05,share:0,bare:"#f2f0ea",resolution:[96,96]},width:.8,depth:.8,lightDepth:.8,spacing:1,speed:12},swab:{name:"swab",label:"Cotton swab",body:{kind:"swab",seed:9901,shape:[0,0,0,0],deposit:.7,pickup:.03,capacity:8,churn:0,share:0,bare:"#f4f2ec",resolution:[32,32]},width:.19,depth:.19,lightDepth:.85,spacing:1,speed:12},bundle:{name:"bundle",label:"Bundle of cotton swabs",body:{kind:"bundle",seed:9911,shape:[0,0,0,0],swabs:Hn,deposit:.65,pickup:.03,capacity:8,churn:0,share:0,bare:"#f4f2ec",resolution:[160,160]},width:1.7,depth:1.7,lightDepth:1,spacing:1,speed:12},pen:{name:"pen",label:"White paint pen",body:{kind:"pen",seed:1203,shape:[0,0,0,0],deposit:.85,pickup:0,capacity:1,level:2.6,churn:0,share:0,bare:"#f4f3ef",resolution:[16,16]},width:.075,depth:.075,lightDepth:1,spacing:.3,speed:2.5}};function Lt(e){let t=new Map;for(let r of Object.values(te))r.body&&t.set(r.name,e.createTool(r.body));let n=r=>{let o=t.get(r);if(!o)throw new Error(`${r} does not touch the canvas`);return o};return{apply(r){switch(r.kind){case"touch":e.touch(n(r.tool),r.touch);return;case"load":e.load(n(r.tool),r.mix,r.amount,{keep:r.keep,seed:r.seed});return;case"clean":e.clean(n(r.tool));return;case"deposit":e.deposit(r.deposit);return;case"dry":e.dry(r.x,r.y,r.radius,r.amount);return}},held:r=>t.get(r),reset(){e.prime();for(let r of t.values())e.clean(r)}}}var Ft=.8,$n=32,je=.07,kt=.3,Kn=.25,Ct={x:2.5,y:2};function Ce(...e){let t=2166136261;for(let n of e)t^=n>>>0,t=Math.imul(t,16777619),t^=t>>>13;return(t>>>0)%16777216}function Bt(e,t){let n=Math.round(e.width*t),r=Math.round(e.height*t),o=[],s=[],u=[],l={x:e.width+Ct.x,y:e.height+Ct.y},i=0,h=0,c={time:0,tool:"tube",...l,angle:0,lift:1,pressure:0},f=m=>({x:m.x*t,y:(e.height-m.y)*t}),x=(m,g=i)=>o.push({...m,time:g,step:h}),M=m=>{c={...c,...m,time:i},s.push(c)},k=(m,g)=>{c.lift<1&&(i+=je/g,M({lift:1,pressure:0}));let E=Math.hypot(m.x-c.x,m.y-c.y);E>.001&&(i+=Math.min(.6,.05+E/$n)/g,M({x:m.x,y:m.y}))},N=(m,g)=>{i+=je/m,M({lift:0,pressure:g})};for(let[m,g]of e.steps.entries()){h=m;let E=i,F=te[g.tool],T=g.pace??1;c.tool!==g.tool&&(i+=Ft/2,M({...l,lift:1}),c={...c,tool:g.tool},M({}));for(let[L,R]of g.gestures.entries()){let v=Ce(m,L,1);_(R,F,T,v)}c.lift<1&&(i+=je/T,M({lift:1,pressure:0})),i+=Kn,M({}),u.push({start:E,end:i})}i+=Ft/2,M({...l,lift:1});function _(m,g,E,F){switch(m.kind){case"load":i+=kt/E,M({lift:1}),x({kind:"load",tool:g.name,mix:m.mix,amount:m.amount,keep:m.keep??0,seed:F});return;case"clean":i+=kt/E,M({lift:1}),x({kind:"clean",tool:g.name});return;case"drop":{M({paint:Re(Fe(m.mix))}),k(m.at,E),N(E,1);let T=f(m.at),L=m.size,R=m.angle??0;x({kind:"deposit",deposit:{shape:"drop",...T,axisX:Math.cos(R),axisY:Math.sin(R),halfAcross:g.width/2*L*t,halfAlong:g.depth/2*L*t,thickness:22*Math.sqrt(L),mix:m.mix,seed:F}}),i+=.12/E,M({});return}case"flick":{k(m.from,E),i+=.1/E,M({pressure:1});for(let T of m.specks){let L=f(T),R=Math.hypot(T.x-m.from.x,T.y-m.from.y);x({kind:"deposit",deposit:{shape:"speck",...L,axisX:Math.cos(-T.angle),axisY:Math.sin(-T.angle),halfAcross:T.radius*t,halfAlong:T.radius*1.1*t,thickness:4,mix:m.mix,seed:Ce(F,Math.round(T.x*1e3),Math.round(T.y*1e3))}},i+R/40/E)}i+=.2/E,M({pressure:0});return}case"dry":{let[T,...L]=m.path;if(!T)return;k(T,E),M({lift:1});let R=T;for(let v of L){let P=Math.hypot(v.x-R.x,v.y-R.y),B=Math.max(1,Math.ceil(P/(g.width*g.spacing)));for(let S=1;S<=B;S++){let a={x:R.x+(v.x-R.x)*S/B,y:R.y+(v.y-R.y)*S/B};i+=P/B/g.speed/E,M({x:a.x,y:a.y,angle:Math.atan2(v.y-R.y,v.x-R.x)});let d=f(a);x({kind:"dry",...d,radius:g.width*.5*t,amount:.22})}R=v}return}case"press":{k(m.at,E),N(E,m.pressure);let T=f(m.at),L=m.angle??0,R=(g.lightDepth+(1-g.lightDepth)*m.pressure)*(m.size??1);M({angle:L}),x({kind:"touch",tool:g.name,touch:{...T,axisX:Math.cos(L),axisY:-Math.sin(L),halfAcross:g.width/2*R*t,halfAlong:g.depth/2*R*t,pressure:m.pressure,skim:m.skim??0,strokeSeed:F,dabSeed:Ce(F,7),deposit:m.deposit,pickup:m.pickup,level:m.level,scrape:m.scrape,twist:m.twist}}),i+=.05/E,M({});return}case"stroke":W(m,g,E,F);return}}function W(m,g,E,F){let T=m.points,L=T[0];if(!L||T.length<2)return;let R=g.body?.kind;k(L,E),N(E,L.pressure);let v=0;for(let B=0;B<T.length-1;B++){let S=T[B],a=T[B+1],d=Math.hypot(a.x-S.x,a.y-S.y);if(d<1e-4)continue;let b=Math.atan2(a.y-S.y,a.x-S.x),y=(a.x-S.x)/d,p=-(a.y-S.y)/d,A=(S.pressure+a.pressure)/2,w=g.depth*(g.lightDepth+(1-g.lightDepth)*A),C=Math.max(.004,w*g.spacing),z=Math.max(1,Math.ceil(d/C));for(let ge=0;ge<z;ge++){let He=ge/z,$e={x:S.x+(a.x-S.x)*He,y:S.y+(a.y-S.y)*He},ft=S.pressure+(a.pressure-S.pressure)*He;i+=d/z/g.speed/E,M({x:$e.x,y:$e.y,angle:b,lift:0,pressure:ft}),x({kind:"touch",tool:g.name,touch:U(g,f($e),y,p,ft,m,F,v++,R)})}}let P=T[T.length-1];M({x:P.x,y:P.y})}function U(m,g,E,F,T,L,R,v,P){let B=m.lightDepth+(1-m.lightDepth)*T,S=m.width/2*t,a=m.depth/2*B*t;P==="round"&&(S*=.35+.65*T),P==="flat"&&(S*=.7+.3*T),L.edge&&([S,a]=[Math.max(a*.6,1.5),S]);let d=P==="flat"||P==="round"?Math.min(1,Math.max(0,(.45-T)/.35))*.8:0,b=L.tilt??0,y=F*Math.cos(b)+E*Math.sin(b),p=-E*Math.cos(b)+F*Math.sin(b);return{...g,axisX:y,axisY:p,halfAcross:S,halfAlong:a,pressure:T,skim:Math.max(L.skim??0,d),strokeSeed:R,dabSeed:Ce(R,v),deposit:L.deposit,pickup:L.pickup,level:L.level,scrape:L.scrape}}return o.sort((m,g)=>m.time-g.time),{duration:i,steps:u,events:o,poses:s,width:n,height:r,texelsPerInch:t}}function Ve(e,t){let{poses:n}=e,r=0,o=n.length-1;if(o<0)throw new Error("a timeline with no poses");if(t<=n[0].time)return n[0];if(t>=n[o].time)return n[o];for(;o-r>1;){let f=r+o>>1;n[f].time<=t?r=f:o=f}let s=n[r],u=n[o],l=u.time-s.time,i=l>0?(t-s.time)/l:1,h=s.lift>.5&&u.lift>.5?i*i*(3-2*i):i,c=((u.angle-s.angle)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI;return{time:t,tool:i<1?s.tool:u.tool,paint:i<1?s.paint:u.paint,x:s.x+(u.x-s.x)*h,y:s.y+(u.y-s.y)*h,angle:s.angle+c*h,lift:s.lift+(u.lift-s.lift)*i,pressure:s.pressure+(u.pressure-s.pressure)*i}}function Be(e,t){let{events:n}=e,r=0,o=n.length;for(;r<o;){let s=r+o>>1;n[s].time<t?r=s+1:o=s}return r}function Qe(e,t){let n=e.steps.findIndex(r=>t<r.end);return n===-1?e.steps.length-1:n}var Yn=2,zn=240,Xn=24;function Dt(e){let{timeline:t,surface:n,performer:r,present:o,drawTool:s,onChange:u}=e,{events:l,steps:i}=t,h=t.duration,c=0,f=0,x=!1,M=1,k=null,N=0,_=zn,W=0,U=0,m=!0,g="",E=e.copies??Yn,F=new Map,T=Array.from({length:E},()=>n.snapshot()),L=[];r.reset();let R=()=>c<l.length?Math.min(f,(l[c]?.time??h)-1e-6):f,v=()=>({time:R(),step:Qe(t,R()),playing:x,speed:M,seeking:k===null?null:Math.min(1,(R()-N)/Math.max(1e-6,k-N)),finished:c>=l.length&&f>=h-.5}),P=()=>{let p=v(),A=`${p.step} ${p.playing} ${p.speed} ${p.seeking?.toFixed(2)} ${p.finished} ${Math.floor(p.time)}`;A!==g&&(g=A,u(p))},B=p=>{if(p===0||E===0||F.has(p))return;let A=T.pop();if(!A){let w=Math.min(...F.keys());A=F.get(w),F.delete(w)}F.set(p,n.snapshot(A))},S=(p,A)=>{let w=0;for(;c<l.length;){let C=l[c];if(!C||C.time>p)return!0;if(w>=A)return!1;let z=l[c-1];z&&z.step!==C.step&&B(C.step),r.apply(C),c++,w++}return!0},a=p=>{U=0;let A=W?p-W:16;if(W=p,A>Xn?_=Math.max(16,_*.8):_=Math.min(6e3,_*1.08+4),k!==null){let w=S(k,Math.round(_*4));f=w?k:l[c]?.time??k,w&&(k=null),m=!0}else if(x){let w=Math.min(h,f+Math.min(A,50)/1e3*M);f=S(w,Math.round(_))?w:Math.max(f,(l[c]?.time??w)-1e-6),f>=h&&c>=l.length&&(x=!1),m=!0}m&&(o(),s(Ve(t,R())),m=!1);for(let w=L.length-1;w>=0;w--){let C=L[w];C&&k===null&&c>=Be(t,C.time)&&f>=C.time-1e-6&&(L.splice(w,1),C.done())}P(),x||k!==null||L.length?U=requestAnimationFrame(a):W=0},d=()=>{U||(U=requestAnimationFrame(a))},b=p=>{let A=[...F.keys()].filter(z=>z<=p).sort((z,ge)=>ge-z)[0],w=A??0;A!==void 0?n.restore(F.get(A)):r.reset();let C=i[w].start;c=Be(t,C),f=C},y=p=>{Be(t,p)<c&&b(Qe(t,p)),N=R(),k=p,m=!0,d()};return{play(){x||(c>=l.length&&f>=h&&y(0),x=!0,P(),d())},pause(){x&&(x=!1,P())},seekStep(p){let A=Math.max(0,Math.min(i.length-1,p));y(i[A].start)},setSpeed(p){M=p,P()},renderAt(p){return y(Math.max(0,Math.min(h,p))),new Promise(A=>{L.push({time:Math.max(0,Math.min(h,p)),done:A}),d()})},redraw(){m=!0,d()},get state(){return v()},get pose(){return Ve(t,R())},destroy(){x=!1,cancelAnimationFrame(U),U=0;for(let p of[...F.values(),...T])n.release(p);F.clear(),T.length=0}}}var It=kn(Ot(),1);function Je(e){let t=new It.default(e>>>0),n=()=>t.random_long();return{next:n,between:(r,o)=>r+(o-r)*n(),index:r=>Math.floor(n()*r),shuffle(r){for(let o=r.length-1;o>0;o--){let s=Math.floor(n()*(o+1)),u=r[o];r[o]=r[s],r[s]=u}return r}}}function qt(e,t,n,r){return{bounds:{left:e,top:t,right:n,bottom:r},contains:({x:o,y:s})=>o>=e&&o<=n&&s>=t&&s<=r}}function Te(e){let t=e.map(r=>r.x),n=e.map(r=>r.y);return{bounds:{left:Math.min(...t),top:Math.min(...n),right:Math.max(...t),bottom:Math.max(...n)},contains({x:r,y:o}){let s=!1;for(let u=0,l=e.length-1;u<e.length;l=u++){let i=e[u],h=e[l];i.y>o!=h.y>o&&r<(h.x-i.x)*(o-i.y)/(h.y-i.y)+i.x&&(s=!s)}return s}}}function Se(e,t,n,r=0){let{left:o,top:s,right:u,bottom:l}=t.bounds,i=[],h=0;for(;i.length<n&&h<n*60;){h++;let c={x:e.between(o,u),y:e.between(s,l)};if(!t.contains(c))continue;let f=r*Math.max(0,1-h/(n*30));f>0&&i.some(x=>Math.hypot(x.x-c.x,x.y-c.y)<f)||i.push(c)}return i}function Q(e,t,n){let r=[...t],o=[],s=n;for(;r.length;){let u=0,l=Number.POSITIVE_INFINITY;for(let i=0;i<r.length;i++){let h=r[i],c=Math.hypot(h.x-s.x,h.y-s.y)*e.between(.8,1.25);c<l&&(l=c,u=i)}s=r.splice(u,1)[0],o.push(s)}return o}function Ze(e,t=.1){if(e.length<3)return e;let n=[];for(let r=0;r<e.length-1;r++){let o=e[Math.max(0,r-1)],s=e[r],u=e[r+1],l=e[Math.min(e.length-1,r+2)],i=Math.hypot(u.x-s.x,u.y-s.y),h=Math.max(1,Math.ceil(i/t));for(let c=0;c<h;c++){let f=c/h,x=f*f,M=x*f,k=(N,_,W,U)=>.5*(2*_+(-N+W)*f+(2*N-5*_+4*W-U)*x+(-N+3*_-3*W+U)*M);n.push({x:k(o.x,s.x,u.x,l.x),y:k(o.y,s.y,u.y,l.y),pressure:s.pressure+(u.pressure-s.pressure)*f})}}return n.push(e[e.length-1]),n}function et(e,t,n,r,o){let s=Math.cos(t),u=Math.sin(t),l=[];for(let i=0;i<=6;i++){let h=i/6,c=(h-.5)*n,f=r*4*h*(1-h),x=h<.5?o[0]+(o[1]-o[0])*(h/.5):o[1]+(o[2]-o[1])*((h-.5)/.5);l.push({x:e.x+s*c-u*f,y:e.y+u*c+s*f,pressure:x})}return l}function Nt(e,t,n){let r=n.avoid??[],o=l=>r.every(({at:i,distance:h})=>Math.hypot(i.x-l.x,i.y-l.y)>h),s=Q(e,Se(e,t,n.count,.35).filter(o),n.start),u=[];return s.forEach((l,i)=>{let h=(i%2?1:-1)*(Math.PI/4)+e.between(-.35,.35)+(e.next()<.5?Math.PI:0),c=e.between(...n.length),f=et(l,h,c,e.between(-.18,.18),n.pressure??[.55,.9,.6]);Ze(f,.1).every(o)&&u.push({kind:"stroke",points:f,...n.handling})}),u}function Ut(e,t,n,r){let o=[];for(let s=0;s<r;s++){let u=n*Math.sqrt((s+1)/r),l=e.between(0,Math.PI*2),i=e.between(0,u),h={x:t.x+Math.cos(l)*i,y:t.y+Math.sin(l)*i},c=e.between(0,Math.PI*2),f=e.between(.12,.38),x=[{...h,pressure:e.between(.6,.9)},{x:h.x+Math.cos(c)*f*.6,y:h.y+Math.sin(c)*f*.6,pressure:e.between(.5,.75)},{x:h.x+Math.cos(c)*f,y:h.y+Math.sin(c)*f,pressure:.25}];o.push({kind:"stroke",points:x})}return o}function tt(e,t,n){return t.map(r=>({kind:"press",at:r,pressure:e.between(...n)}))}function Gt(e,t,n,r){let o=[];for(let s=0;s<r.passes;s++){let u=(s-(r.passes-1)/2)*r.width,l=e.between(-.08,.08),i=e.between(0,Math.PI*2),h=[];for(let c=0;c<=10;c++){let f=c/10,x=r.fade??.25,M=.02*Math.sin(f*9+i);h.push({x:t.x+u*(1-.45*f)+r.lean*n*f+l*Math.sin(f*Math.PI)+M,y:t.y-n*f,pressure:1-(1-x)*f**1.3})}o.push({kind:"stroke",points:h,edge:r.edge})}return o}function Wt(e,t,n,r,o,s){let u=[],l=e.between(0,Math.PI*2);for(let i=0;i<r;i++){let h=o*Math.sqrt(-2*Math.log(Math.max(1e-6,e.next())))*.6,c=e.between(0,Math.PI*2);u.push({x:t.x+Math.cos(c)*h,y:t.y+Math.sin(c)*h,radius:e.between(...s)*(e.next()<.12?1.8:1),angle:l+e.between(-.4,.4)})}return{kind:"flick",from:t,mix:n,specks:u}}function Ht(e,t,n,r){let o={x:Math.cos(t),y:Math.sin(t)},s={x:-o.y,y:o.x},{left:u,top:l,right:i,bottom:h}=e.bounds,c=[{x:u,y:l},{x:i,y:l},{x:u,y:h},{x:i,y:h}],f=(v,P)=>v.x*P.x+v.y*P.y,x=v=>{let P=c.map(B=>f(B,v));return[Math.min(...P),Math.max(...P)]},[M,k]=x(s),[N,_]=x(o),W=Array.from({length:8},(v,P)=>({x:Math.cos(P*Math.PI/4)*r,y:Math.sin(P*Math.PI/4)*r})),U=v=>e.contains(v)&&W.every(P=>e.contains({x:v.x+P.x,y:v.y+P.y})),m=(v,P)=>({x:s.x*v+o.x*P,y:s.y*v+o.y*P}),g=Math.min(.01,n/4),E=v=>M+n/2+v*n,F=[];for(let v=0;E(v)<k;v++){let P=[],B=null;for(let S=N;S<=_+g;S+=g){let a=S<=_&&U(m(E(v),S));a&&B===null&&(B=S),!a&&B!==null&&(P.push([B,S-g]),B=null)}F.push(P)}let T=F.map(v=>v.map(()=>!1)),L=(v,P,B)=>(F[v]??[]).findIndex(([S,a],d)=>{if(T[v]?.[d])return!1;let b=B?S:a;return Math.abs(b-P)<=3*n&&U(m(E(v)-n/2,(b+P)/2))}),R=[];return F.forEach((v,P)=>{v.forEach((B,S)=>{if(T[P]?.[S])return;let a=[],d=P,b=S,y=!0;for(;b>=0;){T[d][b]=!0;let[p,A]=F[d][b],[w,C]=y?[p,A]:[A,p];a.push({...m(E(d),w),pressure:.8},{...m(E(d),C),pressure:.8}),y=!y,d++,b=L(d,C,y)}R.push({kind:"stroke",points:a})})}),R}function $t(e,t,n,r=0){let o=[];for(let s=0;s<=5;s++){let u=s/5;o.push({x:e.x+n*t*u*u,y:e.y-t*u,pressure:.95-.8*u})}return{kind:"stroke",points:o,tilt:r}}var I=16,J=12,X={x:5.6,y:2.05,radius:.48},$={x:8.8,y:8.95},ne={x:7.65,y:9.62,scale:1.8},Z=e=>9.15+.15*Math.sin(e*.75+1.1)+.08*Math.sin(e*1.9)-.25*Math.exp(-((e-$.x)**2)/3);function ie(e){let t={x:12.4,y:12.4},n={x:12.9,y:10.9},r={x:9.8,y:10.1},o=$,s=1-e;return{at:{x:s**3*t.x+3*s*s*e*n.x+3*s*e*e*r.x+e**3*o.x,y:s**3*t.y+3*s*s*e*n.y+3*s*e*e*r.y+e**3*o.y},width:3.2*(1-e)+.4*e}}var nt=e=>Array.from({length:21},(t,n)=>{let r=n/20,o=ie(r),s=ie(Math.min(1,r+.02)),u=ie(Math.max(0,r-.02)),l=s.at.x-u.at.x,i=s.at.y-u.at.y,h=Math.hypot(l,i)||1;return{x:o.at.x-i/h*e*o.width*.5,y:o.at.y+l/h*e*o.width*.5}}),jt=Te([...nt(-1),...nt(1).reverse()]);function ot(e){let t=Number.POSITIVE_INFINITY;for(let n=0;n<=40;n++){let r=ie(n/40);t=Math.min(t,Math.hypot(e.x-r.at.x,e.y-r.at.y)-r.width/2)}return t}var jn=Te([{x:-.2,y:-.2},{x:I+.2,y:-.2},...Array.from({length:33},(e,t)=>{let n=I+.2-t/32*(I+.4);return{x:n,y:Z(n)-1.1}})]),Vn=qt(-.3,-.3,I+.3,6.2),Vt=Te([...Array.from({length:33},(e,t)=>{let n=-.2+t/32*(I+.4);return{x:n,y:Z(n)-.05}}),{x:I+.2,y:J+.2},{x:-.2,y:J+.2}]),be=(e,t,n)=>Math.hypot(e.x-t.x,e.y-t.y)<n,fe=(e,t,n)=>{let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)};function de(e,t,n=.25){let r={};for(let[o,s]of Object.entries(t))r[o]=s*e.between(1-n,1+n);return r}var De=Je(29),Ie=(e,t,n,r,o=.2)=>({at:{x:e+De.between(-o,o),y:t+De.between(-o,o)*.75},paint:n,size:r*De.between(.82,1.18),angle:De.between(-.45,.45)}),H="titaniumWhite",D="skyBlue",Kt="cobaltBlue",G="prussianBlue",Qn=[[.7,[[.6,Kt],[2.2,D],[3.8,D],[5.6,H],[7.2,D],[8.8,D],[10.4,D],[12,D],[13.6,D],[15.3,Kt]]],[2,[[1.4,G],[3,D],[4.6,H],[5.6,H],[6.6,H],[8.2,D],[10,G],[11.8,D],[13.4,G],[15,D]]],[3.3,[[.6,G],[2.2,G],[3.8,D],[5.3,H],[6.8,H],[8.4,D],[10.2,D],[12,G],[13.8,G],[15.3,G]]],[4.6,[[1.4,G],[3,D],[4.6,D],[6.3,H],[7.6,H],[9,D],[10.6,G],[12.4,D],[14.2,G]]],[5.9,[[.6,D],[2.2,G],[3.8,D],[5.6,D],[7.3,H],[8.5,H],[9.8,D],[11.2,G],[12.8,D],[14.6,D]]]],Jn=Array.from({length:18},(e,t)=>{let n=.5+t*.885,r=Math.abs(n-$.x)<.9;return Ie(n,7.45,r?H:D,.72,.12)}),ae="sapGreen",ce="phthaloGreen",he="yellowOchre",Yt="burntSienna",_e="marsBlack",Zn=[[9.65,[[.5,ce],[2.2,ae],[4,Yt],[6,he],[8.7,H],[9.8,he],[11.3,he],[12.9,Yt],[14.4,ae],[15.6,ce]]],[10.65,[[.5,_e],[2,ce],[3.6,ce],[5.2,ae],[7,ae],[8.6,ae],[10.6,H],[11.7,he],[12.9,he],[14.2,ae],[15.5,_e]]],[11.55,[[.5,_e],[2,ce],[3.6,ae],[5.2,ce],[7,ae],[8.8,ce],[10.5,ae],[11.9,he],[12.9,H],[14,he],[15.5,_e]]]],zt=[[.05,"yellowOchre"],[.15,"titaniumWhite"],[.25,"yellowOchre"],[.35,"titaniumWhite"],[.45,"yellowOchre"],[.55,"titaniumWhite"],[.65,"cadmiumYellow"],[.74,"titaniumWhite"],[.83,"titaniumWhite"],[.92,"titaniumWhite"]].map(([e,t])=>Ie(ie(e).at.x,ie(e).at.y,t,1,.15)),qe=[...Qn.flatMap(([e,t])=>t.map(([n,r])=>Ie(n,e,r,r===H?1.3:1))),...Jn,...Zn.flatMap(([e,t])=>t.map(([n,r])=>Ie(n,e+.09,r,1,.12))).filter(e=>zt.every(t=>!be(t.at,e.at,.6))),...zt],Qt=qe.filter(e=>e.paint===G).map(e=>e.at),eo=qe.filter(e=>e.paint===G||e.at.y>7).map(e=>e.at),to=[{x:.3,depth:"middle"},{x:1.05,depth:"near"},{x:1.75,depth:"far"},{x:2.05,depth:"far"},{x:2.85,depth:"middle"},{x:3.75,depth:"near"},{x:4.2,depth:"far"},{x:4.6,depth:"middle"},{x:6.3,depth:"far"},{x:6.75,depth:"middle"},{x:9.9,depth:"far"},{x:10.45,depth:"middle"},{x:10.8,depth:"far"},{x:11.7,depth:"middle"},{x:12.6,depth:"far"},{x:12.95,depth:"middle"},{x:13.3,depth:"far"},{x:14.1,depth:"near"},{x:14.95,depth:"middle"},{x:15.3,depth:"far"},{x:15.85,depth:"near"}],Jt={far:{mix:{prussianBlue:2,burntUmber:1,skyBlue:1},amount:7,passes:1,spacing:0,width:.2},middle:{mix:{burntUmber:2,marsBlack:1,prussianBlue:1},amount:14,passes:1,spacing:0,width:.42},near:{mix:{burntUmber:2,marsBlack:2},amount:16,passes:2,spacing:.34,width:.76}};function no(e){return to.map(t=>{let n=t.depth==="near"?{x:t.x,y:J+.3}:t.depth==="middle"?{x:t.x,y:Z(t.x)+e.between(.6,1.4)}:{x:t.x,y:Z(t.x)+e.between(.05,.3)};return{...t,base:n,lean:e.between(-.045,.045),width:Jt[t.depth].width}})}var oo=(e,t)=>e.base.x+e.lean*(e.base.y-t),Oe=[[-.26,0],[-.31,-.08],[-.32,-.18],[-.29,-.28],[-.22,-.37],[-.14,-.45],[-.07,-.55],[-.03,-.64],[-.01,-.72],[.02,-.79],[.07,-.835],[.13,-.84],[.19,-.815],[.27,-.78],[.36,-.755],[.33,-.735],[.24,-.72],[.17,-.7],[.13,-.67],[.12,-.6],[.14,-.5],[.15,-.4],[.15,-.3],[.15,-.12],[.19,-.03],[.19,0],[.08,0]],ro=[[[-.005,-.8],[.015,-.99],[.06,-.835]],[[.06,-.84],[.11,-1],[.15,-.83]]],so=[[-.3,-.04,.07],[-.26,.03,.11],[-.12,.07,.135],[.04,.08,.14],[.18,.07,.12],[.3,.045,.09],[.4,.015,.05],[.46,-.005,.015]],ao=Math.atan2(-.56,.28);function io(){let e=([l,i])=>({x:ne.x+l*ne.scale,y:ne.y+i*ne.scale}),t=l=>({kind:"stroke",points:Ze(l.map(i=>({...e(i),pressure:.8})),.03)}),n=([l,i],[h,c])=>[(l+h)/2,(i+c)/2],r=[t(Oe.slice(0,15)),t([...Oe.slice(14),Oe[0]])],o=Ht(Te(Oe.map(e)),ao,.045,te.pen.width/2),s=ro.flatMap(([l,i,h])=>{let c=[l,h],f=i;return[t([c[0],f]),t([c[1],f]),t([n(c[0],c[1]),f])]}),u=[-.75,-.5,-.25,0,.25,.5,.75].map(l=>t(so.map(([i,h,c])=>[i,h+l*c*.5])));return[...r,...o,...s,...u]}function uo(){return{title:"Drop the paint",tool:"tube",paints:["titaniumWhite","skyBlue","cobaltBlue","prussianBlue","yellowOchre","burntSienna","sapGreen","phthaloGreen","marsBlack"],note:"Every paint goes straight onto the canvas as a drop, near where it will end up: white along the path of the light, Prussian blue where the woods go dark, earths and greens below.",gestures:qe.map(e=>({kind:"drop",at:e.at,mix:{[e.paint]:1},size:e.size,angle:e.angle})),pace:2}}function lo(e){let t=eo.map(o=>({at:o,distance:1.25})),n=Nt(e,Vn,{start:X,count:230,length:[1,1.7],avoid:t,pressure:[.5,.95,.55]}),r=o=>n.some(s=>s.kind==="stroke"&&s.points.some(u=>be(u,o,.55)));for(let o of qe){if(o.paint===G||o.at.y>7||r(o.at))continue;let s=Qt.reduce((l,i)=>Math.hypot(i.x-o.at.x,i.y-o.at.y)<Math.hypot(l.x-o.at.x,l.y-o.at.y)?i:l),u=Math.atan2(o.at.y-s.y,o.at.x-s.x);n.push({kind:"stroke",points:et(o.at,u+Math.PI/2,.9,.1,[.55,.85,.5])})}return{title:"Spread the sky",tool:"wideBrush",paints:["titaniumWhite","skyBlue","cobaltBlue"],note:"A dry two-inch brush works out from the moon in short crossing strokes, picking up the drops it meets and laying them down again further on. It leaves the dark drops alone.",gestures:n}}function co(e){let t=[];for(let n of Qt)t.push(...Ut(e,n,1.3,24));return{title:"Knife in the dark woods",tool:"knife",paints:["prussianBlue"],note:"The painting knife pats each Prussian blue drop outward into a ragged mass. Every pat lifts the paint under the blade and leaves a crisp ridge along its edge.",gestures:t}}function ho(e){let t=[];for(let n=.4;n<I;n+=e.between(.45,.7)){let r=e.between(5.6,6.1),o=Z(n)-.1,s=e.next()<.6,u=[{x:n+e.between(-.05,.05),y:s?r:o,pressure:.55},{x:n,y:(r+o)/2,pressure:.85},{x:n+e.between(-.05,.05),y:s?o:r,pressure:.5}];t.push({kind:"stroke",points:u})}return{title:"Pull down the mist",tool:"wideBrush",paints:["skyBlue","titaniumWhite"],note:"The same brush, turned, pulls the row of small blue drops into vertical streaks: a band of mist where the far trees stand.",gestures:t}}function fo(e){let t=[],n=0;for(let r=9.05;r<J+.2;r+=.36,n++){let o=[];for(let s=-.4;s<I+.4;s+=e.between(1.2,1.9)){let u=Math.min(e.between(1.4,2.2),I+.5-s),l=e.between(-.12,.12),i={x:s,y:Math.max(r,Z(s)-.08)},h=[{...i,pressure:.6},{x:s+u/2,y:i.y+l,pressure:.9},{x:s+u,y:i.y+l*.3,pressure:.55}];h.some(c=>jt.contains(c))||o.push({kind:"stroke",points:h})}t.push(...n%2?o.reverse():o)}for(let r=.02;r<.97;r+=.055){let o=ie(r),s=ie(Math.min(1,r+.07)).at,u=s.x-o.at.x,l=s.y-o.at.y,i=Math.hypot(u,l)||1,h=Math.max(1,Math.min(4,Math.round(o.width/.8)));for(let c=0;c<h;c++){let f=h===1?0:(c/(h-1)-.5)*o.width*.7,x=o.at.x-l/i*f,M=o.at.y+u/i*f,k=Math.min(e.between(.7,1),Math.hypot($.x-o.at.x,$.y-o.at.y));t.push({kind:"stroke",points:[{x,y:M,pressure:.65},{x:x+u/i*k*.5,y:M+l/i*k*.5,pressure:.85},{x:x+u/i*k,y:M+l/i*k,pressure:.5}]})}}return{title:"Lay in the ground",tool:"flatBrush",paints:["yellowOchre","burntSienna","sapGreen","phthaloGreen","marsBlack"],note:"A one-inch brush spreads the ground drops sideways: warm ochre and white where the path will catch the light, greens and black toward the edges.",gestures:t}}function po(e){let t=Q(e,Se(e,jn,330,.45),X),n=Q(e,Se(e,Vt,110,.5),$);return{title:"Pounce the scrubber",tool:"scrubber",paints:[],note:"A steel-wool scrubber glued to a jar lid is pounced over everything while it is wet, from the light outward. It lifts paint and drops it again a pad-width away, breaking every brushstroke into a glittering stipple.",gestures:[...tt(e,t,[.72,.95]),...tt(e,n,[.72,.95])],pace:2.2}}function mo(e,t){let n=[],r=[...t].sort((o,s)=>Xt(o.depth)-Xt(s.depth));for(let o of r){let s=Jt[o.depth];n.push({kind:"load",mix:de(e,s.mix),amount:s.amount*e.between(.85,1.15),keep:.2}),n.push(...Gt(e,o.base,o.base.y+.4,{lean:o.lean,passes:s.passes,width:s.spacing,edge:o.depth==="far",fade:o.depth==="far"?.12:.3}))}return{title:"Pull up the trunks",tool:"trunkBrush",paints:["burntUmber","marsBlack","prussianBlue"],note:"Umber and black on a half-inch brush, pulled up from the ground in one stroke per trunk and easing off as it climbs. The far trunks go first and thinnest; the brush drags up streaks of the wet blue beneath.",gestures:n}}var Xt=e=>e==="far"?0:e==="middle"?1:2;function bo(e){let t=Math.min(e.x,I-e.x),n=(1-fe(.6,4,t))*(1-fe(5.2,8,e.y)),r=1-fe(.3,2.4,e.y);return Math.max(n,.8*r)}function yo(e){let t=[];for(;t.length<30;){let o={x:e.between(-.3,I+.3),y:e.between(-.3,8.4)};be(o,X,2)||e.next()>bo(o)||t.push(o)}let n={marsBlack:2,phthaloGreen:1,prussianBlue:1},r=[];return Q(e,t,{x:0,y:0}).forEach((o,s)=>{s%3===0&&r.push({kind:"load",mix:de(e,n,.35),amount:e.between(1.3,2),keep:.15}),r.push({kind:"press",at:o,pressure:e.between(.45,.8)}),e.next()<.55&&r.push({kind:"press",at:{x:o.x+e.between(-.6,.6),y:o.y+e.between(-.45,.45)},pressure:e.between(.25,.45),skim:.35})}),{title:"Pounce the leaves",tool:"scrubber",paints:["marsBlack","phthaloGreen","prussianBlue"],note:"The scrubber again, now loaded with black and dark green, pounced along the top and down both sides so the trees frame the picture. Each press prints a clump of leaves, lighter where it barely touches.",gestures:r,pace:1.6}}function xo(e){return{title:"Spatter",tool:"spatter",paints:["titaniumWhite"],note:"A round brush loaded with white, tapped against the handle of another: a shower of specks, the first of the night\u2019s lights.",gestures:[{x:3.2,y:2.6},{x:7.6,y:3.4},{x:11.4,y:2.2},{x:13.8,y:5.2},{x:9.6,y:6.2},{x:2.4,y:6.4}].map(n=>Wt(e,n,{titaniumWhite:1},46,1.5,[.008,.024]))}}function wo(e){let t=Se(e,Vt,170,.3).filter(l=>l.y>Z(l.x)+.12&&l.y<J+.05&&[-.45,0,.45].every(i=>!jt.contains({x:l.x+i,y:l.y}))),n=l=>Math.max(1-fe(.2,2.6,ot(l)),1-fe(.8,3,Math.hypot(l.x-$.x,l.y-$.y))),r=t.filter(l=>n(l)<.25&&e.next()<.45),o=t.filter(l=>!r.includes(l)),s=[],u=(l,i)=>s.push($t(l,e.between(...i),e.between(-.55,.55),e.between(-.45,.45)));return Q(e,r,{x:0,y:J}).forEach((l,i)=>{i%3===0&&s.push({kind:"load",mix:de(e,{phthaloGreen:1,marsBlack:1}),amount:5,keep:.3}),u(l,[.3,.6])}),s.push({kind:"clean"}),Q(e,o,{x:0,y:J}).forEach((l,i)=>{if(i%3===0){let c=n(l)>.55?{titaniumWhite:5,sapGreen:.4,cadmiumYellow:.4}:e.next()<.5?{titaniumWhite:3,sapGreen:1}:{titaniumWhite:3,sapGreen:.7,cadmiumYellow:.8};s.push({kind:"load",mix:de(e,c),amount:5,keep:.3})}u(l,[.22,.5])}),{title:"Comb the grass",tool:"comb",paints:["titaniumWhite","sapGreen","cadmiumYellow","phthaloGreen","marsBlack"],note:"A fine comb with paint on its teeth, set down on the ground and flicked upward: a dozen blades at a time. A few dark ones in the shadows first, then pale green and white over them, palest where the light reaches.",gestures:s}}function go(e){let t=[{kind:"load",mix:{titaniumWhite:3,skyBlue:1},amount:6}];for(let n=0;n<18;n++){let r=e.between(.5,I-.5);if(Math.abs(r-X.x)<.8)continue;let o=Z(r)+e.between(-.1,.2),s=e.between(2,5.2),u=e.between(-.04,.04);n%3===0&&t.push({kind:"load",mix:{titaniumWhite:3,skyBlue:1},amount:6,keep:.3}),t.push({kind:"stroke",points:[{x:r,y:o,pressure:.55},{x:r+u*s*.5,y:o-s*.5,pressure:.4},{x:r+u*s,y:o-s,pressure:.12}],skim:.15})}for(let n=0;n<26;n++){let r=e.next()<.5?-1:1,o=nt(r)[2+e.index(18)],s=o.x+e.between(-.3,.3),u=o.y+e.between(-.1,.2);n%5===0&&t.push({kind:"load",mix:{titaniumWhite:2,sapGreen:1,cadmiumYellow:1},amount:5,keep:.3}),t.push({kind:"stroke",points:[{x:s,y:u,pressure:.6},{x:s+e.between(-.08,.08),y:u-e.between(.25,.5),pressure:.1}]})}return{title:"Saplings in the mist",tool:"liner",paints:["titaniumWhite","skyBlue","sapGreen"],note:"A liner brush draws thin pale lines into the mist, far-off saplings with the moon on them, and flicks a few light blades of grass along the path.",gestures:t}}function vo(){let e=[];for(let t=0;t<7;t++){let n=.6+t*1.8;e.push(t%2?{x:I+.5,y:n}:{x:-.5,y:n}),e.push(t%2?{x:-.5,y:n}:{x:I+.5,y:n})}return{title:"Dry it",tool:"dryer",paints:[],note:"Everything so far has been painted wet into wet. A hair dryer sets it, so what comes next sits on top, crisp, instead of blending in. Watch the shine go.",gestures:[{kind:"dry",path:e}]}}function To(e){let t=[];for(let n=0;n<20;n++){n%5===0&&t.push({kind:"load",mix:{titaniumWhite:1},amount:3,keep:.25});let r=e.between(0,Math.PI*2),o=e.between(0,X.radius*.35);t.push({kind:"press",at:{x:X.x+Math.cos(r)*o,y:X.y+Math.sin(r)*o},pressure:e.between(.75,.95),angle:e.between(0,6.28)})}t.push({kind:"load",mix:{titaniumWhite:1},amount:1.4,keep:.5});for(let n=0;n<36;n++){let r=e.next(),o=e.between(0,Math.PI*2),s=X.radius*(1+1.9*r*r);t.push({kind:"press",at:{x:X.x+Math.cos(o)*s,y:X.y+Math.sin(o)*s},pressure:e.between(.38,.48)-.15*r,angle:e.between(0,6.28),skim:.45,size:e.between(1,1.25)-.35*r})}return{title:"Dab the moon",tool:"cotton",paints:["titaniumWhite"],note:"Before a single trunk goes in, a ball of cotton wool in a clothespin, dipped in white and dabbed over and over in one spot until the moon is solid; then, nearly dry, dabbed lightly around it for the glow. The trees will stand in front of its light.",gestures:t}}function rt(e,t,n=!0){let r=[];for(;r.length<t;){let o=e.next(),s;if(o<.35){let u=e.between(0,1),l=ie(u);s={x:l.at.x+e.between(-1,1)*l.width*.7,y:l.at.y+e.between(-.5,.3)}}else if(o<.6){let u=e.between(0,Math.PI*2),l=Math.sqrt(e.next())*3.2;s={x:$.x+Math.cos(u)*l*1.3,y:$.y-1.2+Math.sin(u)*l*.9}}else s={x:e.between(.3,I-.3),y:e.between(2.4,J-.3)};s.x<.2||s.x>I-.2||s.y<.2||s.y>J-.2||n&&be(s,{x:ne.x,y:ne.y-.55*ne.scale},.6*ne.scale)||be(s,X,X.radius*2)||r.push(s)}return r}function So(e){let t=o=>{let s=[];for(;s.length<o;){let u={x:e.between(.3,I-.3),y:e.between(9,J-.2)};if(u.y<Z(u.x)+.35||ot(u)<.45||be(u,{x:ne.x,y:ne.y-.5},1.3))continue;let l=1-fe(.4,3,ot(u)),i=fe(Z(u.x),J,u.y);e.next()>.2+.45*i+.45*l||s.push(u)}return s},n=[],r=o=>n.push({kind:"press",at:o,pressure:e.between(.45,.95),angle:e.between(-.9,.9),size:e.between(.8,1.15)});return Q(e,t(20),$).forEach((o,s)=>{s%3===0&&n.push({kind:"load",mix:de(e,{cadmiumYellow:4,titaniumWhite:1},.3),amount:e.between(4,5.5),keep:.2}),r(o)}),n.push({kind:"clean"}),Q(e,t(9),$).forEach((o,s)=>{s%3===0&&n.push({kind:"load",mix:de(e,{titaniumWhite:6,cadmiumYellow:.15}),amount:e.between(4,5.5),keep:.1}),r(o)}),{title:"Stamp the flowers",tool:"bundle",paints:["cadmiumYellow","titaniumWhite"],note:"Twenty cotton swabs held in a rubber band and fanned out, dipped in yellow and stamped through the meadow: a scatter of small flowers with every press, thickest toward the light. Then a few in white.",gestures:n,pace:1.4}}function Po(e){let t=[];return Q(e,rt(e,110),$).forEach((r,o)=>{let s=o%5<2;o%2===0&&t.push({kind:"load",mix:de(e,s?{cadmiumYellow:5,sapGreen:1,titaniumWhite:2}:{titaniumWhite:1}),amount:e.between(4,5.5),keep:.1}),t.push({kind:"press",at:r,pressure:e.between(.4,.95),angle:e.between(0,6.28),size:.42+e.next()**1.8})}),{title:"Dot the fireflies",tool:"swab",paints:["titaniumWhite","cadmiumYellow","sapGreen"],note:"One swab, one dot at a time, some with just its tip and some pressed flat: white ones and yellow-green ones, thickest where the light is.",gestures:t,pace:1.5}}function Mo(){return{title:"Draw the fox",tool:"pen",paints:["titaniumWhite"],note:"A white paint pen, fed from its barrel so it never runs dry: the fox outlined first, then filled with lines back and forth until it is solid white, the ears and the curl of the tail last.",gestures:[{kind:"load",mix:{titaniumWhite:1},amount:4},...io()]}}function Eo(e,t){let n=[],r=t.filter(o=>o.depth!=="far"&&Math.abs(o.x-7.5)<6);for(let o of r){let s=o.x>X.x?-1:1,u=c=>oo(o,c)+s*(o.width/2-.03),l=Math.min(o.base.y-.2,o.depth==="near"?e.between(8.5,10):Z(o.x)+e.between(.2,.8)),i=l-e.between(2.5,5),h=(l+i)/2;n.push({kind:"load",mix:{titaniumWhite:3,skyBlue:1},amount:6,keep:.2}),n.push({kind:"stroke",points:[{x:u(l),y:l,pressure:.35},{x:u(h)+e.between(-.02,.02),y:h,pressure:.55},{x:u(i),y:i,pressure:.15}],skim:.25})}return{title:"Light the trunks",tool:"liner",paints:["titaniumWhite","skyBlue"],note:"A broken line of pale blue down the side of each trunk that faces the moon.",gestures:n}}function Ao(e,t){let n=[];return t.forEach((r,o)=>{o%2===0&&n.push({kind:"load",mix:{titaniumWhite:1},amount:e.between(2.4,3.4),keep:.2}),n.push({kind:"press",at:r,pressure:e.between(.4,.62),angle:e.between(0,6.28),skim:.3,twist:e.between(.7,1.25),size:e.between(.75,1.25)})}),{title:"Twist the glows",tool:"cotton",paints:["titaniumWhite"],note:"The cotton ball, with a little white, pressed and twisted: the fibers drag the paint out in fine rays, and the brightest fireflies get a halo.",gestures:n}}function Ro(e,t){let n=[];return[...t,...Q(e,rt(e,28),$)].forEach((o,s)=>{s%3===0&&n.push({kind:"load",mix:{titaniumWhite:1},amount:5,keep:.1}),n.push({kind:"press",at:o,pressure:e.between(.35,.6),angle:e.between(0,6.28),size:.35+.6*e.next()**1.5})}),{title:"Last sparkles",tool:"swab",paints:["titaniumWhite"],note:"A clean swab and small dots of white, here and there, to finish.",gestures:n,pace:1.5}}function Zt(e=11){let t=Je(e),n=no(t),r=Q(t,rt(t,16),$);return{title:"Fox at the edge of the wood",width:I,height:J,steps:[uo(),lo(t),co(t),ho(t),fo(t),po(t),To(t),mo(t,n),yo(t),xo(t),wo(t),go(t),vo(),So(t),Po(t),Mo(),Eo(t,n),Ao(t,r),Ro(t,r)]}}var Ne=["#c98f55","#a8693a"],en=["#2f4f8f","#1c3263"],Ue=["#e9ecef","#9aa1a8","#d5d9dd"],K=(e,t,n,r,o,s)=>{let u=e.createLinearGradient(t,n,r,o);for(let[l,i]of s.entries())u.addColorStop(l/Math.max(1,s.length-1),i);return u};function pe(e,t,n,r,o,s){e.beginPath(),e.roundRect(t,n,r,o,s)}function Ge(e,t,n,r,o,s){e.beginPath(),e.moveTo(-r/2,t),e.lineTo(r/2,t),e.quadraticCurveTo(o*.7,(t+n)/2,o/2,n-o/2),e.arc(0,n-o/2,o/2,0,Math.PI),e.quadraticCurveTo(-o*.7,(t+n)/2,-r/2,t),e.closePath(),e.fillStyle=K(e,-r/2,0,r/2,0,[s[1]??"#000",s[0]??"#000",s[1]??"#000"]),e.fill()}function at(e,t,n,r,o){e.beginPath(),e.moveTo(-r/2,t),e.lineTo(r/2,t),e.lineTo(o/2,n),e.lineTo(-o/2,n),e.closePath(),e.fillStyle=K(e,-r/2,0,r/2,0,Ue),e.fill(),e.strokeStyle="rgba(60,64,70,0.45)",e.lineWidth=.012;for(let s of[.25,.35]){let u=t+(n-t)*s,l=r+(o-r)*s;e.beginPath(),e.moveTo(-l/2,u),e.lineTo(l/2,u),e.stroke()}}function tn(e,t,n,r,o){if(e.save(),e.beginPath(),e.moveTo(-t/2,n),e.lineTo(-t/2,n*.18),e.quadraticCurveTo(-t/2,0,-t*.38,0),e.lineTo(t*.38,0),e.quadraticCurveTo(t/2,0,t/2,n*.18),e.lineTo(t/2,n),e.closePath(),e.fillStyle=r,e.fill(),e.clip(),o?.length){let s=t/o.length;o.forEach((u,l)=>{let i=e.createLinearGradient(0,0,0,n*.75);i.addColorStop(0,u),i.addColorStop(1,"rgba(0,0,0,0)"),e.fillStyle=i,e.fillRect(-t/2+l*s-.002,0,s+.004,n)})}e.strokeStyle="rgba(40,30,20,0.18)",e.lineWidth=.008;for(let s=-t/2+.02;s<t/2;s+=.045)e.beginPath(),e.moveTo(s,n),e.lineTo(s+.01*Math.sin(s*40),.02),e.stroke();e.restore()}function st(e,t,n,r){let o=t*.55+.25;tn(e,t,o,"#a49377",n),at(e,o,o+.55,t*1.04,t*.9),Ge(e,o+.55,o+.55+4.2,Math.min(.42,t*.6),.22,r)}function nn(e,t){tn(e,.06,.32,"#c9b18a",t),at(e,.3,.75,.08,.1),Ge(e,.75,6,.1,.16,Ne)}function Lo(e){e.beginPath(),e.moveTo(0,-.95),e.quadraticCurveTo(.34,-.55,.31,.1),e.quadraticCurveTo(.26,.42,.05,.48),e.lineTo(-.05,.48),e.quadraticCurveTo(-.26,.42,-.31,.1),e.quadraticCurveTo(-.34,-.55,0,-.95),e.closePath(),e.fillStyle=K(e,-.32,0,.32,0,Ue),e.fill(),e.strokeStyle="rgba(90,95,100,0.5)",e.lineWidth=.015,e.stroke(),e.fillStyle=K(e,-.04,0,.04,0,Ue),e.fillRect(-.035,.46,.07,.9),at(e,1.3,1.6,.14,.2),Ge(e,1.6,5.2,.2,.3,en)}function Fo(e){e.fillStyle="#7d8287",e.beginPath(),e.arc(0,0,1.3,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(225,230,235,0.7)",e.lineWidth=.025;for(let t=0;t<46;t++){let n=t/46*Math.PI*2;e.beginPath(),e.arc(Math.cos(n)*1.12,Math.sin(n)*1.12,.16+.05*Math.sin(t*2.3),n,n+2.6),e.stroke()}e.fillStyle=K(e,-1,-1,1,1,["#e8dcf2","#c4b2d9","#a996c4"]),e.beginPath(),e.arc(0,0,1.02,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(255,255,255,0.6)",e.lineWidth=.04,e.beginPath(),e.arc(0,0,.86,Math.PI*1.05,Math.PI*1.6),e.stroke()}function ko(e){e.fillStyle="rgba(28,28,32,0.92)",pe(e,-.62,.06,1.24,.34,.06),e.fill(),e.strokeStyle="rgba(28,28,32,0.85)",e.lineWidth=.018;for(let t=-.56;t<=.56;t+=.066)e.beginPath(),e.moveTo(t,.08),e.lineTo(t,-.02),e.stroke();e.fillStyle="rgba(255,255,255,0.12)",e.fillRect(-.6,.1,1.2,.04)}function Co(e,t){e.save(),e.rotate(-.35),e.fillStyle=K(e,-.18,0,.18,0,["#d9b47c","#b8894f"]),pe(e,-.17,.25,.34,2.9,.05),e.fill(),e.strokeStyle="rgba(80,50,20,0.5)",e.lineWidth=.02,e.beginPath(),e.moveTo(0,.3),e.lineTo(0,3.1),e.stroke(),e.fillStyle=K(e,-.2,0,.2,0,Ue),e.fillRect(-.2,1.4,.4,.14),e.restore();let n=t?.[Math.floor(t.length/2)];for(let[r,o,s]of[[0,0,.36],[-.2,-.08,.22],[.2,-.05,.22],[.05,.2,.24],[-.12,.16,.2]])e.fillStyle=e.createRadialGradient(r-s*.3,o-s*.3,s*.1,r,o,s),e.fillStyle.addColorStop(0,"#ffffff"),e.fillStyle.addColorStop(1,"#dcdad3"),e.beginPath(),e.arc(r,o,s,0,Math.PI*2),e.fill();n&&(e.fillStyle=n,e.beginPath(),e.arc(0,-.02,.3,0,Math.PI*2),e.fill())}function Bo(e,t,n,r){e.save(),e.rotate(n),e.fillStyle="#f3f1ea",e.fillRect(-.03,.08,.06,r),e.fillStyle=e.createRadialGradient(-.03,-.04,.01,0,0,.12),e.fillStyle.addColorStop(0,"#ffffff"),e.fillStyle.addColorStop(1,"#d6d3ca"),e.beginPath(),e.ellipse(0,0,.1,.14,0,0,Math.PI*2),e.fill(),t&&(e.fillStyle=t,e.beginPath(),e.ellipse(0,-.01,.085,.11,0,0,Math.PI*2),e.fill()),e.restore()}function Do(e,t){let n=[];for(let o of[{count:8,radius:.66,spread:1.05},{count:7,radius:.44,spread:.95},{count:4,radius:.23,spread:.8}])for(let s=0;s<o.count;s++){let u=-Math.PI/2+(s/(o.count-1)-.5)*2*o.spread;n.push([Math.cos(u)*o.radius,Math.sin(u)*o.radius+.3])}let r={x:0,y:1.9};e.strokeStyle="#f1efe8",e.lineWidth=.05;for(let[o,s]of n)e.beginPath(),e.moveTo(o,s),e.lineTo(r.x+o*.12,r.y),e.lineTo(r.x+o*.1,r.y+1.6),e.stroke();e.fillStyle="#c0392b",e.fillRect(-.16,r.y-.05,.32,.1),n.forEach(([o,s],u)=>{e.fillStyle="#ffffff",e.beginPath(),e.ellipse(o,s,.07,.09,0,0,Math.PI*2),e.fill();let l=t?.[u%(t?.length||1)];l&&(e.fillStyle=l,e.beginPath(),e.ellipse(o,s-.01,.06,.075,0,0,Math.PI*2),e.fill())})}function _o(e,t){e.fillStyle=K(e,-.19,0,.19,0,["#2b2e33","#5b6068","#2b2e33"]),pe(e,-.19,.42,.38,4.6,.12),e.fill(),e.fillStyle=K(e,-.19,0,.19,0,["#d9d8d2","#ffffff","#d9d8d2"]),e.fillRect(-.19,3.9,.38,.32),e.fillStyle=K(e,-.17,0,.17,0,["#9da2a8","#e3e6e9","#9da2a8"]),e.beginPath(),e.moveTo(-.05,.12),e.lineTo(.05,.12),e.lineTo(.17,.46),e.lineTo(-.17,.46),e.closePath(),e.fill(),e.fillStyle=t?.[Math.floor(t.length/2)]??"#f4f3ef",pe(e,-.04,-.01,.08,.16,.035),e.fill()}function Oo(e,t){e.save(),e.rotate(-.6),e.fillStyle=K(e,-.06,0,.06,0,["#ddd","#fff","#bbb"]),e.fillRect(-.06,0,.12,.22),e.fillStyle=K(e,-.28,0,.28,0,["#c8ccd0","#f4f6f7","#aab0b6"]),e.beginPath(),e.moveTo(-.14,.22),e.lineTo(.14,.22),e.lineTo(.3,.5),e.lineTo(.3,2.3),e.lineTo(-.3,2.3),e.lineTo(-.3,.5),e.closePath(),e.fill(),e.fillStyle=t??"#888",e.fillRect(-.3,1,.6,.75),e.fillStyle="#9aa0a6",e.fillRect(-.32,2.3,.64,.12),e.restore()}function Io(e,t){e.save(),e.translate(-1.6,-1.9),e.rotate(.7),e.fillStyle=K(e,-.8,0,.8,0,["#fafafa","#e2e2e2"]),pe(e,-.8,-.2,1.6,2.4,.7),e.fill(),e.fillStyle="#d4d4d4",pe(e,-.45,2.1,.9,.7,.2),e.fill(),e.fillStyle=K(e,-.3,0,.3,0,["#e9e9e9","#cfcfcf"]),pe(e,-.32,2.5,.64,2,.18),e.fill(),e.strokeStyle="rgba(120,120,120,0.5)",e.lineWidth=.03;for(let n=0;n<6;n++)e.beginPath(),e.moveTo(-.5,.2+n*.22),e.lineTo(.5,.2+n*.22),e.stroke();e.restore(),e.strokeStyle="rgba(255,255,255,0.35)",e.lineWidth=.03;for(let n=0;n<4;n++){let r=(t*2.5+n/4)%1;e.beginPath(),e.arc(-1.6+1.6*r,-1.9+1.9*r,.4+.5*r,.2,1.4),e.stroke()}}function qo(e,t,n){if(e.save(),e.rotate(.55),nn(e,t),e.restore(),e.save(),e.translate(.6,.4),e.rotate(-.75),Ge(e,0,5,.16,.24,Ne),e.restore(),n>.5){e.fillStyle="rgba(255,255,255,0.85)";for(let r=0;r<14;r++){let o=r*2.4,s=.25+r%5*.12;e.beginPath(),e.arc(Math.cos(o)*s,Math.sin(o)*s-.2,.02+r%3*.01,0,Math.PI*2),e.fill()}}}function No(e,t,n,r){switch(t.tool){case"wideBrush":return st(e,2,n,Ne);case"flatBrush":return st(e,1,n,Ne);case"trunkBrush":return st(e,.42,n,en);case"liner":return nn(e,n);case"knife":return Lo(e);case"scrubber":return Fo(e);case"comb":return ko(e);case"cotton":return Co(e,n);case"swab":return Bo(e,n?.[Math.floor((n?.length??0)/2)],-.5,3);case"bundle":return Do(e,n);case"pen":return _o(e,n);case"tube":return Oo(e,t.paint);case"dryer":return Io(e,r);case"spatter":return qo(e,n,t.pressure)}}function Uo(e,t){switch(e){case"wideBrush":case"flatBrush":case"trunkBrush":case"liner":case"comb":return t.angle+Math.PI/2;case"knife":return t.angle-Math.PI/2;default:return-.5}}var Go=7;function on(e){let t=document.createElement("canvas"),n=e.getContext("2d"),r=t.getContext("2d");if(!n||!r)throw new Error("no 2d context for the tools");return{draw(o,s,u,l){let i=e.width/e.getBoundingClientRect().width||1;n.setTransform(1,0,0,1,0,0),n.clearRect(0,0,e.width,e.height);let h=s.scale*i*(1+.07*o.lift),c=Math.ceil(Go*2*h);t.width!==c&&(t.width=c,t.height=c),r.setTransform(1,0,0,1,0,0),r.clearRect(0,0,c,c),r.setTransform(h,0,0,h,c/2,c/2),r.rotate(Uo(o.tool,o)),No(r,o,u,l);let f=(s.left+o.x*s.scale)*i,x=(s.top+o.y*s.scale)*i,M=.06+.32*o.lift;n.save(),n.shadowColor=`rgba(10, 14, 24, ${.42-.14*o.lift})`,n.shadowBlur=(.06+.3*o.lift)*s.scale*i,n.shadowOffsetX=M*s.scale*i*.8,n.shadowOffsetY=M*s.scale*i,n.drawImage(t,f-c/2,x-c/2),n.restore()},clear(){n.setTransform(1,0,0,1,0,0),n.clearRect(0,0,e.width,e.height)}}}var Wo=880,we=new URLSearchParams(location.hash.slice(1)),cn=window.innerWidth<Wo,hn=Number(we.get("detail"))||(cn?60:128),fn=[1,2,4,8],Ho=6,V=e=>{let t=document.querySelector(e);if(!t)throw new Error(`missing ${e}`);return t},it=V(".frame"),q=V("#painting"),ut=V("#tools"),ct=V("#steps"),ht=V("#stages"),We=V("#status"),$o=V("#caption"),lt=V("#play"),dn=V("#back"),pn=V("#ahead"),ye=V("#speed"),mn=V("#download"),j=Zt(),Y=Bt(j,hn),xe;try{xe=pt(q)}catch(e){throw We.textContent=e instanceof Error?e.message:String(e),e}q.addEventListener("webglcontextlost",e=>{e.preventDefault(),O.pause(),We.textContent="The browser took back the GPU this painting lives on. Reload to start again."});var Me=Rt(xe,Y.width,Y.height,hn),bn=Lt(Me),rn=on(ut),yn={scale:1,left:0,top:0};function xn(){let e=it.getBoundingClientRect(),t=getComputedStyle(it),n=Number.parseFloat(t.paddingLeft)+Number.parseFloat(t.paddingRight),r=Number.parseFloat(t.paddingTop)+Number.parseFloat(t.paddingBottom),o={width:Math.max(1,e.width-n),height:Math.max(1,e.height-r)},s=Math.min(o.width/j.width,o.height/j.height),u=Math.round(j.width*s),l=Math.round(j.height*s),i=Math.min(2,window.devicePixelRatio||1);q.style.width=`${u}px`,q.style.height=`${l}px`,q.width=Math.min(Y.width,Math.round(u*i)),q.height=Math.min(Y.height,Math.round(l*i)),ut.width=Math.round(e.width*i),ut.height=Math.round(e.height*i);let h=q.getBoundingClientRect();yn={scale:s,left:h.left-e.left,top:h.top-e.top}}var wn=0,sn,an;function Ko(e){let t=te[e.tool].body?bn.held(e.tool):void 0;if(t){if(an!==e.tool||wn%Ho===0){let n=Me.probe(t,8);sn=Array.from({length:8},(r,o)=>{let[s,u,l,i]=n.subarray(o*4,o*4+4);return`rgba(${s}, ${u}, ${l}, ${((i??0)/255).toFixed(2)})`}),an=e.tool}return sn}}var O=Dt({timeline:Y,surface:Me,performer:bn,copies:cn?1:2,present(){xe.bindFramebuffer(xe.FRAMEBUFFER,null),xe.viewport(0,0,q.width,q.height),Me.render()},drawTool(e){if(wn++,e.x>j.width+1.5||e.y>j.height+1.5){rn.clear();return}rn.draw(e,yn,Ko(e),performance.now()/1e3)},onChange:jo}),Yo=e=>`<span class="chip" style="--paint: ${Re(Fe({[e]:1}))}" title="${ze[e].name}"></span>`;ct.innerHTML=j.steps.map((e,t)=>`
    <li>
      <button type="button" data-step="${t}">
        <span class="number">${String(t+1).padStart(2,"0")}</span>
        <span class="what">
          <span class="title">${e.title}</span>
          <span class="tool">${te[e.tool].label}</span>
        </span>
        <span class="paints" aria-hidden="true">${e.paints.map(Yo).join("")}</span>
      </button>
    </li>`).join("");ht.innerHTML=Y.steps.map(({start:e,end:t})=>`<span class="stage" data-planned style="--share: ${(t-e).toFixed(2)}"></span>`).join("");var un=[...ct.querySelectorAll("button")],zo=[...ht.querySelectorAll(".stage")],ln=-1,Pe=V(".rail");function Xo(e){if(!e||Pe.scrollHeight<=Pe.clientHeight)return;let t=e.getBoundingClientRect(),n=Pe.getBoundingClientRect();t.top<n.top+24?Pe.scrollBy({top:t.top-n.top-24}):t.bottom>n.bottom-24&&Pe.scrollBy({top:t.bottom-n.bottom+24})}function jo(e){let t=j.steps[e.step];if(!t)return;e.step!==ln&&(ln=e.step,un.forEach((r,o)=>{o===e.step?r.setAttribute("aria-current","step"):r.removeAttribute("aria-current"),r.toggleAttribute("data-done",o<e.step)}),$o.textContent=t.note,Xo(un[e.step]));let n=e.seeking!==null?`Painting up to step ${e.step+1}\u2026`:e.finished?"Finished":`Step ${e.step+1} of ${j.steps.length} \xB7 ${te[t.tool].label}`;We.textContent!==n&&(We.textContent=n),Y.steps.forEach(({start:r,end:o},s)=>{let u=Math.min(1,Math.max(0,(e.time-r)/(o-r)));zo[s]?.style.setProperty("--fill",u.toFixed(3))}),ht.dataset.time=e.time.toFixed(2),lt.toggleAttribute("data-playing",e.playing),lt.setAttribute("aria-label",e.playing?"Pause":"Play"),dn.disabled=e.step===0&&e.time-(Y.steps[0]?.start??0)<1,pn.disabled=e.finished,mn.hidden=!e.finished}var Vo=2;function gn(){let{step:e,time:t}=O.state,n=Y.steps[e]?.start??0;O.seekStep(t-n>Vo?e:e-1)}function vn(){let{step:e}=O.state;e+1<j.steps.length?O.seekStep(e+1):O.renderAt(Y.duration)}function Tn(){O.state.playing?O.pause():O.play()}ct.addEventListener("click",e=>{let t=e.target.closest("button[data-step]");t&&O.seekStep(Number(t.dataset.step))});lt.addEventListener("click",Tn);dn.addEventListener("click",gn);pn.addEventListener("click",vn);ye.innerHTML=fn.map(e=>`<option value="${e}">${e}\xD7</option>`).join("");ye.value=String(fn.includes(Number(we.get("speed")))?Number(we.get("speed")):2);O.setSpeed(Number(ye.value));ye.addEventListener("change",()=>{O.setSpeed(Number(ye.value)),we.set("speed",ye.value),history.replaceState(null,"",`#${we}`)});window.addEventListener("keydown",e=>{e.target instanceof HTMLSelectElement||e.metaKey||e.ctrlKey||(e.key===" "&&!(e.target instanceof HTMLButtonElement)?(e.preventDefault(),Tn()):e.key==="ArrowLeft"?gn():e.key==="ArrowRight"&&vn())});function Sn(){let e={width:q.width,height:q.height};q.width=Y.width,q.height=Y.height,xe.viewport(0,0,q.width,q.height),Me.render();let t=q.toDataURL("image/png");return q.width=e.width,q.height=e.height,O.redraw(),t}mn.addEventListener("click",()=>{let e=document.createElement("a");e.download="fox-at-the-edge-of-the-wood.png",e.href=Sn(),e.click()});new ResizeObserver(()=>{xn(),O.redraw()}).observe(it);xn();var Qo=Math.max(0,Math.min(j.steps.length-1,Number(we.get("step")??1)-1));O.seekStep(Qo);matchMedia("(prefers-reduced-motion: reduce)").matches||O.play();Object.assign(window,{studio:{duration:Y.duration,steps:Y.steps,titles:j.steps.map(e=>e.title),renderAt:e=>O.renderAt(e),pause:()=>O.pause(),fullSizePng:Sn,get state(){return O.state}}});})();
