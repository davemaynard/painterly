"use strict";(()=>{var Fn=Object.create;var bt=Object.defineProperty;var kn=Object.getOwnPropertyDescriptor;var Bn=Object.getOwnPropertyNames;var Cn=Object.getPrototypeOf,Dn=Object.prototype.hasOwnProperty;var _n=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var On=(e,t,n,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of Bn(t))!Dn.call(e,r)&&r!==n&&bt(e,r,{get:()=>t[r],enumerable:!(o=kn(t,r))||o.enumerable});return e};var In=(e,t,n)=>(n=e!=null?Fn(Cn(e)):{},On(t||!e||!e.__esModule?bt(n,"default",{value:e,enumerable:!0}):n,e));var Nt=_n((gr,qt)=>{"use strict";var re=function(e){e==null&&(e=new Date().getTime()),this.N=624,this.M=397,this.MATRIX_A=2567483615,this.UPPER_MASK=2147483648,this.LOWER_MASK=2147483647,this.mt=new Array(this.N),this.mti=this.N+1,e.constructor==Array?this.init_by_array(e,e.length):this.init_seed(e)};re.prototype.init_seed=function(e){for(this.mt[0]=e>>>0,this.mti=1;this.mti<this.N;this.mti++){var e=this.mt[this.mti-1]^this.mt[this.mti-1]>>>30;this.mt[this.mti]=(((e&4294901760)>>>16)*1812433253<<16)+(e&65535)*1812433253+this.mti,this.mt[this.mti]>>>=0}};re.prototype.init_by_array=function(e,t){var n,o,r;for(this.init_seed(19650218),n=1,o=0,r=this.N>t?this.N:t;r;r--){var s=this.mt[n-1]^this.mt[n-1]>>>30;this.mt[n]=(this.mt[n]^(((s&4294901760)>>>16)*1664525<<16)+(s&65535)*1664525)+e[o]+o,this.mt[n]>>>=0,n++,o++,n>=this.N&&(this.mt[0]=this.mt[this.N-1],n=1),o>=t&&(o=0)}for(r=this.N-1;r;r--){var s=this.mt[n-1]^this.mt[n-1]>>>30;this.mt[n]=(this.mt[n]^(((s&4294901760)>>>16)*1566083941<<16)+(s&65535)*1566083941)-n,this.mt[n]>>>=0,n++,n>=this.N&&(this.mt[0]=this.mt[this.N-1],n=1)}this.mt[0]=2147483648};re.prototype.random_int=function(){var e,t=new Array(0,this.MATRIX_A);if(this.mti>=this.N){var n;for(this.mti==this.N+1&&this.init_seed(5489),n=0;n<this.N-this.M;n++)e=this.mt[n]&this.UPPER_MASK|this.mt[n+1]&this.LOWER_MASK,this.mt[n]=this.mt[n+this.M]^e>>>1^t[e&1];for(;n<this.N-1;n++)e=this.mt[n]&this.UPPER_MASK|this.mt[n+1]&this.LOWER_MASK,this.mt[n]=this.mt[n+(this.M-this.N)]^e>>>1^t[e&1];e=this.mt[this.N-1]&this.UPPER_MASK|this.mt[0]&this.LOWER_MASK,this.mt[this.N-1]=this.mt[this.M-1]^e>>>1^t[e&1],this.mti=0}return e=this.mt[this.mti++],e^=e>>>11,e^=e<<7&2636928640,e^=e<<15&4022730752,e^=e>>>18,e>>>0};re.prototype.random_int31=function(){return this.random_int()>>>1};re.prototype.random_incl=function(){return this.random_int()*(1/4294967295)};re.prototype.random=function(){return this.random_int()*(1/4294967296)};re.prototype.random_excl=function(){return(this.random_int()+.5)*(1/4294967296)};re.prototype.random_long=function(){var e=this.random_int()>>>5,t=this.random_int()>>>6;return(e*67108864+t)*(1/9007199254740992)};qt.exports=re});function yt(e){let t=e.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!0});if(!t)throw new Error("This browser has no WebGL2, which the paint simulation needs.");if(!t.getExtension("EXT_color_buffer_float"))throw new Error("This GPU cannot render to float textures, which the paint simulation needs.");return t}var qn={rgba16f:WebGL2RenderingContext.RGBA16F,rgba8:WebGL2RenderingContext.RGBA8};function ie(e,t,n,o="rgba16f"){let r=e.createTexture();e.bindTexture(e.TEXTURE_2D,r),e.texStorage2D(e.TEXTURE_2D,1,qn[o],t,n),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);let s=e.createFramebuffer();e.bindFramebuffer(e.FRAMEBUFFER,s),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,r,0);let l=e.checkFramebufferStatus(e.FRAMEBUFFER);if(e.bindFramebuffer(e.FRAMEBUFFER,null),l!==e.FRAMEBUFFER_COMPLETE)throw new Error(`A ${t}\xD7${n} ${o} render target is incomplete (0x${l.toString(16)}).`);return{texture:r,framebuffer:s,width:t,height:n}}function le(e,t){e.deleteFramebuffer(t.framebuffer),e.deleteTexture(t.texture)}function Ae(e,t){let n=e.createFramebuffer();e.bindFramebuffer(e.FRAMEBUFFER,n),t.forEach((r,s)=>{e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+s,e.TEXTURE_2D,r.texture,0)}),e.drawBuffers(t.map((r,s)=>e.COLOR_ATTACHMENT0+s));let o=e.checkFramebufferStatus(e.FRAMEBUFFER);if(e.bindFramebuffer(e.FRAMEBUFFER,null),o!==e.FRAMEBUFFER_COMPLETE)throw new Error(`A ${t.length}-target framebuffer is incomplete (0x${o.toString(16)}).`);return n}function Ke(e,t,n,o,r,s,l){e.bindFramebuffer(e.READ_FRAMEBUFFER,t.framebuffer),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,n.framebuffer),e.blitFramebuffer(o,r,o+s,r+l,o,r,o+s,r+l,e.COLOR_BUFFER_BIT,e.NEAREST),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null)}var Nn=`#version 300 es
in vec2 aCorner;
out vec2 vUv;
void main() {
  vUv = aCorner * 0.5 + 0.5;
  gl_Position = vec4(aCorner, 0.0, 1.0);
}
`;function te(e,t,n=Nn){let o=(h,c)=>{let f=e.createShader(h);if(!f)throw new Error("could not create a shader");if(e.shaderSource(f,c),e.compileShader(f),!e.getShaderParameter(f,e.COMPILE_STATUS)){let p=e.getShaderInfoLog(f)??"";throw e.deleteShader(f),new Error(`${h===e.VERTEX_SHADER?"Vertex":"Fragment"} shader:
${p}
${Un(c)}`)}return f},r=e.createProgram(),s=o(e.VERTEX_SHADER,n),l=o(e.FRAGMENT_SHADER,t);if(e.attachShader(r,s),e.attachShader(r,l),e.bindAttribLocation(r,0,"aCorner"),e.linkProgram(r),!e.getProgramParameter(r,e.LINK_STATUS))throw new Error(`Program link:
${e.getProgramInfoLog(r)??""}`);e.deleteShader(s),e.deleteShader(l);let a=new Map,i=h=>(a.has(h)||a.set(h,e.getUniformLocation(r,h)),a.get(h)??null);return{handle:r,use:()=>e.useProgram(r),set(h,c){let f=i(h);if(!f)return;if(typeof c=="number"){e.uniform1f(f,c);return}let p=c instanceof Float32Array?c:new Float32Array(c);p.length===2?e.uniform2fv(f,p):p.length===3?e.uniform3fv(f,p):p.length===4?e.uniform4fv(f,p):e.uniform1fv(f,p)},setInt(h,c){let f=i(h);f&&(typeof c=="number"?e.uniform1i(f,c):c.length===2?e.uniform2iv(f,c):e.uniform1iv(f,c))},texture(h,c,f){e.activeTexture(e.TEXTURE0+c),e.bindTexture(e.TEXTURE_2D,f);let p=i(h);p&&e.uniform1i(p,c)}}}var Un=e=>e.split(`
`).map((t,n)=>`${String(n+1).padStart(4)}  ${t}`).join(`
`);function xt(e){let t=e.createVertexArray(),n=e.createBuffer();return e.bindVertexArray(t),e.bindBuffer(e.ARRAY_BUFFER,n),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindVertexArray(null),()=>{e.bindVertexArray(t),e.drawArrays(e.TRIANGLE_STRIP,0,4)}}var ze={titaniumWhite:{name:"Titanium white",masstone:"#f6f5f0",scattering:1},skyBlue:{name:"Sky blue",masstone:"#4aa6dc",scattering:.8},cobaltBlue:{name:"Cobalt blue",masstone:"#1f4fb4",scattering:.35},prussianBlue:{name:"Prussian blue",masstone:"#0f1d4c",scattering:.12},cadmiumYellow:{name:"Cadmium yellow",masstone:"#f7c41a",scattering:.5},yellowOchre:{name:"Yellow ochre",masstone:"#c8961e",scattering:.6},burntSienna:{name:"Burnt sienna",masstone:"#9a3a16",scattering:.35},sapGreen:{name:"Sap green",masstone:"#1f6b2c",scattering:.25},phthaloGreen:{name:"Phthalo green",masstone:"#0d3c39",scattering:.1},burntUmber:{name:"Burnt umber",masstone:"#3a2416",scattering:.3},marsBlack:{name:"Mars black",masstone:"#121212",scattering:.35}},Ye=e=>e<=.04045?e/12.92:((e+.055)/1.055)**2.4,Gn=e=>e<=.0031308?e*12.92:1.055*e**(1/2.4)-.055;function Re(e){let t=Number.parseInt(e.replace("#",""),16);return[Ye((t>>16&255)/255),Ye((t>>8&255)/255),Ye((t&255)/255)]}function Le(e){let t=n=>Math.round(Math.min(1,Math.max(0,Gn(n)))*255).toString(16).padStart(2,"0");return`#${t(e[0])}${t(e[1])}${t(e[2])}`}function Wn(e){let t=e.scattering*4;return{absorption:Re(e.masstone).map(r=>{let s=Math.min(.999,Math.max(.001,r));return(1-s)**2/(2*s)*t}),scattering:[t,t,t]}}function Fe(e){let t=[0,0,0],n=[0,0,0],o=0,r=(s,l,a)=>[s[0]+a*l[0],s[1]+a*l[1],s[2]+a*l[2]];for(let[s,l]of Object.entries(e)){if(!l)continue;let a=Wn(ze[s]);t=r(t,a.absorption,l),n=r(n,a.scattering,l),o+=l}if(o===0)throw new Error("a mix needs at least one paint");return{absorption:t.map(s=>s/o),scattering:n.map(s=>s/o)}}function Hn(e,t,n){return[0,1,2].map(o=>{let r=e.absorption[o],s=Math.max(1e-4,e.scattering[o]),l=n[o],a=1+r/s,i=Math.sqrt(a*a-1),h=Math.tanh(i*s*t);return(h*(1-l*a)+l*i)/(h*(a-l)+i)})}var ke=e=>Hn(Fe(e),1e3,[0,0,0]);var ne=`
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
`,be=`
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
`,wt=`
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
  // Over a ridge it runs thinner, but never so thin that what is under it shows.
  return max(0.8 * uLevel, uLevel + around - dryHeight(p));
}

/**
 * The thickness the tool levels paint to at q. A blade is flat and leaves a
 * plateau. A brush is not: its clumps of bristles scrape deeper than the gaps
 * between them, and a lighter touch rides higher, so a blob of paint under a
 * brush is dragged out in ridges along the stroke instead of shaved flat to
 * its own outline.
 */
float levelAt(vec2 q, vec2 p) {
  // A pen's line is rounded across, full in the middle and thin at its edges,
  // so the edge of what it fills slopes rather than stands like a cut.
  if (uKind == PEN) return penFilm(p) * mix(0.35, 1.0, smoothstep(1.0, 0.55, length(q)));
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
`,oe=`#version 300 es
`,$n=`
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
`,gt=`${oe}
${ne}
${be}
uniform sampler2D uToolPigment;
uniform sampler2D uToolScatter;
${Xe}
${wt}
${$n}
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
`,vt=`${oe}
${ne}
${be}
uniform sampler2D uToolPigment;
uniform sampler2D uToolScatter;
/** How much paint each point of the tool shares with its neighbors per touch. */
uniform float uShare;
${Xe}
${wt}
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
`,Tt=`${oe}
${ne}
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
`,St=`${oe}
${ne}
${be}
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
`,Pt=`
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
`,Mt=`${oe}
${ne}
${be}
${Pt}
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
`,Et=`${oe}
${ne}
${be}
${Pt}
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
`,At=`${oe}
${ne}
uniform vec3 uGesso;
out vec4 outDry;

void main() {
  // Gesso fills the weave without hiding it, a little irregularly.
  float sizing = noise2(gl_FragCoord.xy / 40.0, 7u);
  outDry = vec4(uGesso * (0.985 + 0.03 * sizing), 0.0);
}
`,Rt=`${oe}
${ne}
${be}
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
`,Lt=`${oe}
${ne}
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
`;var Ft={flat:0,round:1,knife:2,scrubber:3,comb:4,swab:5,bundle:6,cotton:7,pen:8},ve=["pigment","scatter","topPigment","topScatter"],Be=[...ve,"dry"],Yn="#eeece6",zn=18,Xn=(()=>{let e=[-.42,.5,.76],t=Math.hypot(...e);return e.map(n=>n/t)})();function kt(e,t,n,o){let r=xt(e),s={dab:te(e,gt),tool:te(e,vt),load:te(e,Tt),deposit:te(e,St),dryColor:te(e,Mt),dryWet:te(e,Et),prime:te(e,At),display:te(e,Rt),probe:te(e,Lt)},l=o/zn,a=()=>({pigment:ie(e,t,n),scatter:ie(e,t,n),topPigment:ie(e,t,n),topScatter:ie(e,t,n),dry:ie(e,t,n)}),i=a(),h=a(),c=Ae(e,ve.map(u=>h[u])),f=null,p=(u,d,y,x)=>{let m=Math.max(0,Math.floor(u)-2),A=Math.max(0,Math.floor(d)-2),w=Math.min(t,Math.ceil(y)+2),B=Math.min(n,Math.ceil(x)+2);return w<=m||B<=A?null:{x:m,y:A,w:w-m,h:B-A}},v=(u,d,y,x,m,A)=>{let w=Math.abs(y)*m+Math.abs(x)*A,B=Math.abs(x)*m+Math.abs(y)*A;return p(u-w,d-B,u+w,d+B)},L=(u,d)=>{for(let y of d)Ke(e,h[y],i[y],u.x,u.y,u.w,u.h)},q=(u,d)=>{e.bindFramebuffer(e.FRAMEBUFFER,u),e.viewport(0,0,t,n),e.enable(e.SCISSOR_TEST),e.scissor(d.x,d.y,d.w,d.h),r(),e.disable(e.SCISSOR_TEST),e.bindFramebuffer(e.FRAMEBUFFER,null)},D=u=>{u.texture("uPigment",0,i.pigment.texture),u.texture("uScatter",1,i.scatter.texture),u.texture("uTopPigment",2,i.topPigment.texture),u.texture("uTopScatter",3,i.topScatter.texture),u.texture("uDry",4,i.dry.texture)},N=(u,d,y)=>{let{body:x}=d;u.setInt("uKind",Ft[x.kind]),u.set("uToolSeed",x.seed%16777216),u.set("uStrokeSeed",y.strokeSeed%16777216),u.set("uDabSeed",y.dabSeed%16777216),u.set("uPressure",y.pressure),u.set("uTwist",y.twist??0),u.set("uShape",x.shape),O(u,x),u.set("uCanvas",[t,n]),u.set("uCenter",[y.x,y.y]),u.set("uAxis",[y.axisX,y.axisY]),u.set("uHalf",[y.halfAcross,y.halfAlong]),u.set("uDeposit",y.deposit??x.deposit),u.set("uPickup",y.pickup??x.pickup),u.set("uCapacity",x.capacity),u.set("uSkim",y.skim),u.set("uLevel",y.level??x.level??-1),u.set("uScrape",y.scrape??x.scrape??0),u.set("uChurn",x.churn),u.set("uPull",x.pull??0),u.set("uDrag",x.drag??0),u.set("uWeavePitch",l)},O=(u,d)=>{let y=d.swabs??[];if(u.setInt("uSwabCount",y.length),!y.length)return;let x=e.getUniformLocation(u.handle,"uSwabs");x&&e.uniform3fv(x,new Float32Array(y.flat()))},b=()=>{e.disable(e.SCISSOR_TEST);for(let u of ve)e.bindFramebuffer(e.FRAMEBUFFER,i[u].framebuffer),e.clearBufferfv(e.COLOR,0,[0,0,0,0]);e.bindFramebuffer(e.FRAMEBUFFER,i.dry.framebuffer),e.viewport(0,0,t,n),s.prime.use(),s.prime.set("uGesso",Re(Yn)),s.prime.set("uWeavePitch",l),r(),e.bindFramebuffer(e.FRAMEBUFFER,null)},g=u=>{let[d,y]=u.resolution,x=()=>ie(e,d,y),m=x(),A=x(),w=x(),B=x(),V={body:u,pigment:m,scatter:A,nextPigment:w,nextScatter:B,framebuffer:Ae(e,[m,A]),nextFramebuffer:Ae(e,[w,B])};return k(V),V},E=u=>{[u.pigment,u.nextPigment]=[u.nextPigment,u.pigment],[u.scatter,u.nextScatter]=[u.nextScatter,u.scatter],[u.framebuffer,u.nextFramebuffer]=[u.nextFramebuffer,u.framebuffer]},k=u=>{e.disable(e.SCISSOR_TEST),e.bindFramebuffer(e.FRAMEBUFFER,u.framebuffer),e.viewport(0,0,u.pigment.width,u.pigment.height),e.clearBufferfv(e.COLOR,0,[0,0,0,0]),e.clearBufferfv(e.COLOR,1,[0,0,0,0]),e.bindFramebuffer(e.FRAMEBUFFER,null)},S=(u,d,y,x={})=>{let{absorption:m,scattering:A}=Fe(d),w=s.load;e.disable(e.SCISSOR_TEST),e.bindFramebuffer(e.FRAMEBUFFER,u.nextFramebuffer),e.viewport(0,0,u.pigment.width,u.pigment.height),w.use(),w.texture("uToolPigment",5,u.pigment.texture),w.texture("uToolScatter",6,u.scatter.texture),w.set("uAbsorption",m),w.set("uScattering",A),w.set("uAmount",y),w.set("uKeep",x.keep??0),w.set("uUneven",x.uneven??.6),w.set("uLoadSeed",(x.seed??1)%16777216),w.setInt("uKind",Ft[u.body.kind]),w.set("uToolSeed",u.body.seed%16777216),w.set("uStrokeSeed",(x.seed??1)%16777216),w.set("uShape",u.body.shape),r(),e.bindFramebuffer(e.FRAMEBUFFER,null),E(u)},F=(u,d)=>{let y=v(d.x,d.y,d.axisX,d.axisY,d.halfAcross,d.halfAlong*(u.body.drag?1.5:1));if(!y)return;let x=s.dab;x.use(),D(x),x.texture("uToolPigment",5,u.pigment.texture),x.texture("uToolScatter",6,u.scatter.texture),N(x,u,d),q(c,y),e.bindFramebuffer(e.FRAMEBUFFER,u.nextFramebuffer),e.viewport(0,0,u.pigment.width,u.pigment.height);let m=s.tool;m.use(),D(m),m.texture("uToolPigment",5,u.pigment.texture),m.texture("uToolScatter",6,u.scatter.texture),m.set("uShare",u.body.share),N(m,u,d),r(),e.bindFramebuffer(e.FRAMEBUFFER,null),L(y,ve),E(u)},R=u=>{let d=v(u.x,u.y,u.axisX,u.axisY,u.halfAcross,u.halfAlong);if(!d)return;let{absorption:y,scattering:x}=Fe(u.mix),m=s.deposit;m.use(),D(m),m.set("uCenter",[u.x,u.y]),m.set("uAxis",[u.axisX,u.axisY]),m.set("uHalf",[u.halfAcross,u.halfAlong]),m.setInt("uShapeKind",u.shape==="drop"?0:1),m.set("uThickness",u.thickness),m.set("uAbsorption",y),m.set("uScattering",x),m.set("uSeed",u.seed%16777216),q(c,d),L(d,ve)},T=(u,d,y,x)=>{let m=p(u-y,d-y,u+y,d+y);if(!m)return;let A=[[s.dryColor,h.dry.framebuffer],[s.dryWet,c]];for(let[w,B]of A)w.use(),D(w),w.set("uCenter",[u,d]),w.set("uRadius",y),w.set("uAmount",x),q(B,m);L(m,Be)},M=(u={})=>{let d=s.display;d.use(),D(d),d.set("uCanvas",[t,n]),d.set("uLight",Xn),d.set("uRelief",u.relief??.9),d.set("uWeavePitch",l),r()},C=(u,d)=>{(!f||f.width!==d)&&(f&&le(e,f),f=ie(e,d,1,"rgba8")),e.bindFramebuffer(e.FRAMEBUFFER,f.framebuffer),e.viewport(0,0,d,1),e.disable(e.SCISSOR_TEST);let y=s.probe;y.use(),y.texture("uToolPigment",5,u.pigment.texture),y.texture("uToolScatter",6,u.scatter.texture),y.set("uBare",Re(u.body.bare)),r();let x=new Uint8Array(d*4);return e.readPixels(0,0,d,1,e.RGBA,e.UNSIGNED_BYTE,x),e.bindFramebuffer(e.FRAMEBUFFER,null),x},P=(u,d)=>{for(let y of Be)Ke(e,u[y],d[y],0,0,t,n)};return{width:t,height:n,prime:b,createTool:g,load:S,clean:k,touch:F,deposit:R,dry:T,render:M,probe:C,snapshot(u){let d=u??a();return P(i,d),d},restore(u){P(u,i)},release(u){for(let d of Be)le(e,u[d])},releaseTool(u){for(let d of[u.pigment,u.scatter,u.nextPigment,u.nextScatter])le(e,d);e.deleteFramebuffer(u.framebuffer),e.deleteFramebuffer(u.nextFramebuffer)},destroy(){for(let u of Be)le(e,i[u]),le(e,h[u]);f&&le(e,f),e.deleteFramebuffer(c);for(let u of Object.values(s))e.deleteProgram(u.handle)}}}var jn=(()=>{let e=[],t=[{count:8,radius:.78,spread:1.05},{count:7,radius:.52,spread:.95},{count:4,radius:.27,spread:.8}];for(let n of t)for(let o=0;o<n.count;o++){let r=Math.PI/2+(o/(n.count-1)-.5)*2*n.spread;e.push([Math.cos(r)*n.radius,Math.sin(r)*n.radius-.35,.075])}return e})(),ee={tube:{name:"tube",label:"Paint, straight from the tube",width:.52,depth:.72,lightDepth:1,spacing:1,speed:6},wideBrush:{name:"wideBrush",label:"Two-inch flat brush",body:{kind:"flat",seed:2101,shape:[26,0,0,0],deposit:.09,pickup:.18,capacity:36,level:2,scrape:.6,churn:.3,drag:.35,share:.05,bare:"#9a8c74",resolution:[256,48]},width:2,depth:.42,lightDepth:.55,spacing:.22,speed:9},knife:{name:"knife",label:"Painting knife",body:{kind:"knife",seed:3301,shape:[0,0,0,0],deposit:.2,pickup:.25,capacity:40,level:1.6,scrape:.55,churn:.25,share:0,bare:"#b9bcc0",resolution:[80,160]},width:.62,depth:1.35,lightDepth:.8,spacing:.06,speed:4},flatBrush:{name:"flatBrush",label:"One-inch flat brush",body:{kind:"flat",seed:1102,shape:[15,0,0,0],deposit:.1,pickup:.16,capacity:30,level:2,scrape:.55,churn:.3,drag:.3,share:.05,bare:"#a39377",resolution:[160,40]},width:1,depth:.3,lightDepth:.6,spacing:.22,speed:7},scrubber:{name:"scrubber",label:"Steel-wool scrubber on a jar lid",body:{kind:"scrubber",seed:4401,shape:[12,0,0,0],deposit:.3,pickup:.1,capacity:3,churn:.3,pull:.5,share:0,bare:"#8f9396",resolution:[192,192]},width:2.6,depth:2.6,lightDepth:.9,spacing:1,speed:30},trunkBrush:{name:"trunkBrush",label:"Half-inch flat brush",body:{kind:"flat",seed:5502,shape:[8,0,0,0],deposit:.05,pickup:.12,capacity:30,churn:.18,drag:.3,share:.04,bare:"#8e8068",resolution:[96,40]},width:.42,depth:.2,lightDepth:.6,spacing:.25,speed:7},spatter:{name:"spatter",label:"Round brush, tapped on a handle",width:.3,depth:.3,lightDepth:1,spacing:1,speed:10},comb:{name:"comb",label:"Fine-tooth comb",body:{kind:"comb",seed:6601,shape:[16,.22,0,0],deposit:.28,pickup:.05,capacity:6,churn:.02,share:0,bare:"#2a2a2c",resolution:[192,16]},width:1.05,depth:.07,lightDepth:.7,spacing:.5,speed:6},liner:{name:"liner",label:"Liner brush",body:{kind:"round",seed:7702,shape:[3,.9,0,0],deposit:.3,pickup:.03,capacity:8,churn:0,share:.05,bare:"#c9b18a",resolution:[24,24]},width:.07,depth:.07,lightDepth:.45,spacing:.3,speed:3.5},dryer:{name:"dryer",label:"Hair dryer",width:5,depth:5,lightDepth:1,spacing:.08,speed:4},cotton:{name:"cotton",label:"Cotton ball in a clothespin",body:{kind:"cotton",seed:8801,shape:[0,0,0,0],deposit:.34,pickup:.05,capacity:8,churn:.05,share:0,bare:"#f2f0ea",resolution:[96,96]},width:.8,depth:.8,lightDepth:.8,spacing:1,speed:12},swab:{name:"swab",label:"Cotton swab",body:{kind:"swab",seed:9901,shape:[0,0,0,0],deposit:.7,pickup:.03,capacity:8,churn:0,share:0,bare:"#f4f2ec",resolution:[32,32]},width:.19,depth:.19,lightDepth:.85,spacing:1,speed:12},bundle:{name:"bundle",label:"Bundle of cotton swabs",body:{kind:"bundle",seed:9911,shape:[0,0,0,0],swabs:jn,deposit:.65,pickup:.03,capacity:8,churn:0,share:0,bare:"#f4f2ec",resolution:[160,160]},width:1.7,depth:1.7,lightDepth:1,spacing:1,speed:12},pen:{name:"pen",label:"White paint pen",body:{kind:"pen",seed:1203,shape:[0,0,0,0],deposit:.85,pickup:0,capacity:1,level:1.8,churn:0,share:0,bare:"#f4f3ef",resolution:[16,16]},width:.045,depth:.045,lightDepth:1,spacing:.3,speed:2.5}};function Bt(e){let t=new Map;for(let o of Object.values(ee))o.body&&t.set(o.name,e.createTool(o.body));let n=o=>{let r=t.get(o);if(!r)throw new Error(`${o} does not touch the canvas`);return r};return{apply(o){switch(o.kind){case"touch":e.touch(n(o.tool),o.touch);return;case"load":e.load(n(o.tool),o.mix,o.amount,{keep:o.keep,seed:o.seed});return;case"clean":e.clean(n(o.tool));return;case"deposit":e.deposit(o.deposit);return;case"dry":e.dry(o.x,o.y,o.radius,o.amount);return}},held:o=>t.get(o),reset(){e.prime();for(let o of t.values())e.clean(o)}}}var Ct=.8,Vn=32,je=.07,Dt=.3,Qn=.25,_t={x:2.5,y:2};function Ce(...e){let t=2166136261;for(let n of e)t^=n>>>0,t=Math.imul(t,16777619),t^=t>>>13;return(t>>>0)%16777216}function Ot(e,t){let n=Math.round(e.width*t),o=Math.round(e.height*t),r=[],s=[],l=[],a={x:e.width+_t.x,y:e.height+_t.y},i=0,h=0,c={time:0,tool:"tube",...a,angle:0,lift:1,pressure:0},f=b=>({x:b.x*t,y:(e.height-b.y)*t}),p=(b,g=i)=>r.push({...b,time:g,step:h}),v=b=>{c={...c,...b,time:i},s.push(c)},L=(b,g)=>{c.lift<1&&(i+=je/g,v({lift:1,pressure:0}));let E=Math.hypot(b.x-c.x,b.y-c.y);E>.001&&(i+=Math.min(.6,.05+E/Vn)/g,v({x:b.x,y:b.y}))},q=(b,g)=>{i+=je/b,v({lift:0,pressure:g})};for(let[b,g]of e.steps.entries()){h=b;let E=i,k=ee[g.tool],S=g.pace??1;c.tool!==g.tool&&(i+=Ct/2,v({...a,lift:1}),c={...c,tool:g.tool},v({}));for(let[F,R]of g.gestures.entries()){let T=Ce(b,F,1);D(R,k,S,T)}c.lift<1&&(i+=je/S,v({lift:1,pressure:0})),i+=Qn,v({}),l.push({start:E,end:i})}i+=Ct/2,v({...a,lift:1});function D(b,g,E,k){switch(b.kind){case"load":i+=Dt/E,v({lift:1}),p({kind:"load",tool:g.name,mix:b.mix,amount:b.amount,keep:b.keep??0,seed:k});return;case"clean":i+=Dt/E,v({lift:1}),p({kind:"clean",tool:g.name});return;case"drop":{v({paint:Le(ke(b.mix))}),L(b.at,E),q(E,1);let S=f(b.at),F=b.size,R=b.angle??0;p({kind:"deposit",deposit:{shape:"drop",...S,axisX:Math.cos(R),axisY:Math.sin(R),halfAcross:g.width/2*F*t,halfAlong:g.depth/2*F*t,thickness:22*Math.sqrt(F),mix:b.mix,seed:k}}),i+=.12/E,v({});return}case"flick":{L(b.from,E),i+=.1/E,v({pressure:1});for(let S of b.specks){let F=f(S),R=Math.hypot(S.x-b.from.x,S.y-b.from.y);p({kind:"deposit",deposit:{shape:"speck",...F,axisX:Math.cos(-S.angle),axisY:Math.sin(-S.angle),halfAcross:S.radius*t,halfAlong:S.radius*1.1*t,thickness:4,mix:b.mix,seed:Ce(k,Math.round(S.x*1e3),Math.round(S.y*1e3))}},i+R/40/E)}i+=.2/E,v({pressure:0});return}case"dry":{let[S,...F]=b.path;if(!S)return;L(S,E),v({lift:1});let R=S;for(let T of F){let M=Math.hypot(T.x-R.x,T.y-R.y),C=Math.max(1,Math.ceil(M/(g.width*g.spacing)));for(let P=1;P<=C;P++){let u={x:R.x+(T.x-R.x)*P/C,y:R.y+(T.y-R.y)*P/C};i+=M/C/g.speed/E,v({x:u.x,y:u.y,angle:Math.atan2(T.y-R.y,T.x-R.x)});let d=f(u);p({kind:"dry",...d,radius:g.width*.5*t,amount:.22})}R=T}return}case"press":{L(b.at,E),q(E,b.pressure);let S=f(b.at),F=b.angle??0,R=(g.lightDepth+(1-g.lightDepth)*b.pressure)*(b.size??1);v({angle:F}),p({kind:"touch",tool:g.name,touch:{...S,axisX:Math.cos(F),axisY:-Math.sin(F),halfAcross:g.width/2*R*t,halfAlong:g.depth/2*R*t,pressure:b.pressure,skim:b.skim??0,strokeSeed:k,dabSeed:Ce(k,7),deposit:b.deposit,pickup:b.pickup,level:b.level,scrape:b.scrape,twist:b.twist}}),i+=.05/E,v({});return}case"stroke":N(b,g,E,k);return}}function N(b,g,E,k){let S=b.points,F=S[0];if(!F||S.length<2)return;let R=g.body?.kind;L(F,E),q(E,F.pressure);let T=0;for(let C=0;C<S.length-1;C++){let P=S[C],u=S[C+1],d=Math.hypot(u.x-P.x,u.y-P.y);if(d<1e-4)continue;let y=Math.atan2(u.y-P.y,u.x-P.x),x=(u.x-P.x)/d,m=-(u.y-P.y)/d,A=(P.pressure+u.pressure)/2,w=g.depth*(g.lightDepth+(1-g.lightDepth)*A),B=Math.max(.004,w*g.spacing),V=Math.max(1,Math.ceil(d/B));for(let ge=0;ge<V;ge++){let He=ge/V,$e={x:P.x+(u.x-P.x)*He,y:P.y+(u.y-P.y)*He},mt=P.pressure+(u.pressure-P.pressure)*He;i+=d/V/g.speed/E,v({x:$e.x,y:$e.y,angle:y,lift:0,pressure:mt}),p({kind:"touch",tool:g.name,touch:O(g,f($e),x,m,mt,b,k,T++,R)})}}let M=S[S.length-1];v({x:M.x,y:M.y})}function O(b,g,E,k,S,F,R,T,M){let C=b.lightDepth+(1-b.lightDepth)*S,P=b.width/2*t,u=b.depth/2*C*t;M==="round"&&(P*=.35+.65*S),M==="flat"&&(P*=.7+.3*S),F.edge&&([P,u]=[Math.max(u*.6,1.5),P]);let d=M==="flat"||M==="round"?Math.min(1,Math.max(0,(.45-S)/.35))*.8:0,y=F.tilt??0,x=k*Math.cos(y)+E*Math.sin(y),m=-E*Math.cos(y)+k*Math.sin(y);return{...g,axisX:x,axisY:m,halfAcross:P,halfAlong:u,pressure:S,skim:Math.max(F.skim??0,d),strokeSeed:R,dabSeed:Ce(R,T),deposit:F.deposit,pickup:F.pickup,level:F.level,scrape:F.scrape}}return r.sort((b,g)=>b.time-g.time),{duration:i,steps:l,events:r,poses:s,width:n,height:o,texelsPerInch:t}}function Ve(e,t){let{poses:n}=e,o=0,r=n.length-1;if(r<0)throw new Error("a timeline with no poses");if(t<=n[0].time)return n[0];if(t>=n[r].time)return n[r];for(;r-o>1;){let f=o+r>>1;n[f].time<=t?o=f:r=f}let s=n[o],l=n[r],a=l.time-s.time,i=a>0?(t-s.time)/a:1,h=s.lift>.5&&l.lift>.5?i*i*(3-2*i):i,c=((l.angle-s.angle)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI;return{time:t,tool:i<1?s.tool:l.tool,paint:i<1?s.paint:l.paint,x:s.x+(l.x-s.x)*h,y:s.y+(l.y-s.y)*h,angle:s.angle+c*h,lift:s.lift+(l.lift-s.lift)*i,pressure:s.pressure+(l.pressure-s.pressure)*i}}function De(e,t){let{events:n}=e,o=0,r=n.length;for(;o<r;){let s=o+r>>1;n[s].time<t?o=s+1:r=s}return o}function Qe(e,t){let n=e.steps.findIndex(o=>t<o.end);return n===-1?e.steps.length-1:n}var Jn=2,Zn=240,eo=24;function It(e){let{timeline:t,surface:n,performer:o,present:r,drawTool:s,onChange:l}=e,{events:a,steps:i}=t,h=t.duration,c=0,f=0,p=!1,v=1,L=null,q=0,D=Zn,N=0,O=0,b=!0,g="",E=e.copies??Jn,k=new Map,S=Array.from({length:E},()=>n.snapshot()),F=[];o.reset();let R=()=>c<a.length?Math.min(f,(a[c]?.time??h)-1e-6):f,T=()=>({time:R(),step:Qe(t,R()),playing:p,speed:v,seeking:L===null?null:Math.min(1,(R()-q)/Math.max(1e-6,L-q)),finished:c>=a.length&&f>=h-.5}),M=()=>{let m=T(),A=`${m.step} ${m.playing} ${m.speed} ${m.seeking?.toFixed(2)} ${m.finished} ${Math.floor(m.time)}`;A!==g&&(g=A,l(m))},C=m=>{if(m===0||E===0||k.has(m))return;let A=S.pop();if(!A){let w=Math.min(...k.keys());A=k.get(w),k.delete(w)}k.set(m,n.snapshot(A))},P=(m,A)=>{let w=0;for(;c<a.length;){let B=a[c];if(!B||B.time>m)return!0;if(w>=A)return!1;let V=a[c-1];V&&V.step!==B.step&&C(B.step),o.apply(B),c++,w++}return!0},u=m=>{O=0;let A=N?m-N:16;if(N=m,A>eo?D=Math.max(16,D*.8):D=Math.min(6e3,D*1.08+4),L!==null){let w=P(L,Math.round(D*4));f=w?L:a[c]?.time??L,w&&(L=null),b=!0}else if(p){let w=Math.min(h,f+Math.min(A,50)/1e3*v);f=P(w,Math.round(D))?w:Math.max(f,(a[c]?.time??w)-1e-6),f>=h&&c>=a.length&&(p=!1),b=!0}b&&(r(),s(Ve(t,R())),b=!1);for(let w=F.length-1;w>=0;w--){let B=F[w];B&&L===null&&c>=De(t,B.time)&&f>=B.time-1e-6&&(F.splice(w,1),B.done())}M(),p||L!==null||F.length?O=requestAnimationFrame(u):N=0},d=()=>{O||(O=requestAnimationFrame(u))},y=m=>{let A=[...k.keys()].filter(V=>V<=m).sort((V,ge)=>ge-V)[0],w=A??0;A!==void 0?n.restore(k.get(A)):o.reset();let B=i[w].start;c=De(t,B),f=B},x=m=>{De(t,m)<c&&y(Qe(t,m)),q=R(),L=m,b=!0,d()};return{play(){p||(c>=a.length&&f>=h&&x(0),p=!0,M(),d())},pause(){p&&(p=!1,M())},seekStep(m){let A=Math.max(0,Math.min(i.length-1,m));x(i[A].start)},setSpeed(m){v=m,M()},renderAt(m){return x(Math.max(0,Math.min(h,m))),new Promise(A=>{F.push({time:Math.max(0,Math.min(h,m)),done:A}),d()})},redraw(){b=!0,d()},get state(){return T()},get pose(){return Ve(t,R())},destroy(){p=!1,cancelAnimationFrame(O),O=0;for(let m of[...k.values(),...S])n.release(m);k.clear(),S.length=0}}}var Ut=In(Nt(),1);function Je(e){let t=new Ut.default(e>>>0),n=()=>t.random_long();return{next:n,between:(o,r)=>o+(r-o)*n(),index:o=>Math.floor(n()*o),shuffle(o){for(let r=o.length-1;r>0;r--){let s=Math.floor(n()*(r+1)),l=o[r];o[r]=o[s],o[s]=l}return o}}}function Gt(e,t,n,o){return{bounds:{left:e,top:t,right:n,bottom:o},contains:({x:r,y:s})=>r>=e&&r<=n&&s>=t&&s<=o}}function ue(e){let t=e.map(o=>o.x),n=e.map(o=>o.y);return{bounds:{left:Math.min(...t),top:Math.min(...n),right:Math.max(...t),bottom:Math.max(...n)},contains({x:o,y:r}){let s=!1;for(let l=0,a=e.length-1;l<e.length;a=l++){let i=e[l],h=e[a];i.y>r!=h.y>r&&o<(h.x-i.x)*(r-i.y)/(h.y-i.y)+i.x&&(s=!s)}return s}}}function Te(e,t,n,o=0){let{left:r,top:s,right:l,bottom:a}=t.bounds,i=[],h=0;for(;i.length<n&&h<n*60;){h++;let c={x:e.between(r,l),y:e.between(s,a)};if(!t.contains(c))continue;let f=o*Math.max(0,1-h/(n*30));f>0&&i.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<f)||i.push(c)}return i}function Q(e,t,n){let o=[...t],r=[],s=n;for(;o.length;){let l=0,a=Number.POSITIVE_INFINITY;for(let i=0;i<o.length;i++){let h=o[i],c=Math.hypot(h.x-s.x,h.y-s.y)*e.between(.8,1.25);c<a&&(a=c,l=i)}s=o.splice(l,1)[0],r.push(s)}return r}function Ze(e,t=.1){if(e.length<3)return e;let n=[];for(let o=0;o<e.length-1;o++){let r=e[Math.max(0,o-1)],s=e[o],l=e[o+1],a=e[Math.min(e.length-1,o+2)],i=Math.hypot(l.x-s.x,l.y-s.y),h=Math.max(1,Math.ceil(i/t));for(let c=0;c<h;c++){let f=c/h,p=f*f,v=p*f,L=(q,D,N,O)=>.5*(2*D+(-q+N)*f+(2*q-5*D+4*N-O)*p+(-q+3*D-3*N+O)*v);n.push({x:L(r.x,s.x,l.x,a.x),y:L(r.y,s.y,l.y,a.y),pressure:s.pressure+(l.pressure-s.pressure)*f})}}return n.push(e[e.length-1]),n}function et(e,t,n,o,r){let s=Math.cos(t),l=Math.sin(t),a=[];for(let i=0;i<=6;i++){let h=i/6,c=(h-.5)*n,f=o*4*h*(1-h),p=h<.5?r[0]+(r[1]-r[0])*(h/.5):r[1]+(r[2]-r[1])*((h-.5)/.5);a.push({x:e.x+s*c-l*f,y:e.y+l*c+s*f,pressure:p})}return a}function Wt(e,t,n,o){for(let r=1;r<e.length;r++){let s=e[r-1],l=e[r],a=l.x-s.x,i=l.y-s.y,h=Math.hypot(a,i);if(h===0)continue;let c=((t.x-s.x)*a+(t.y-s.y)*i)/h,f=Math.abs((t.x-s.x)*i-(t.y-s.y)*a)/h,p=r===e.length-1?h:h+o/2;if(c>=-o/2&&c<=p&&f<=n/2*.9)return!0}return!1}function Ht(e,t,n){let o=n.avoid??[],r=a=>o.every(({at:i,distance:h})=>Math.hypot(i.x-a.x,i.y-a.y)>h),s=Q(e,Te(e,t,n.count,.35).filter(r),n.start),l=[];return s.forEach((a,i)=>{let h=(i%2?1:-1)*(Math.PI/4)+e.between(-.35,.35)+(e.next()<.5?Math.PI:0),c=e.between(...n.length),f=et(a,h,c,e.between(-.18,.18),n.pressure??[.55,.9,.6]);Ze(f,.1).every(r)&&l.push({kind:"stroke",points:f,...n.handling})}),l}function $t(e,t,n,o){let r=[];for(let s=0;s<o;s++){let l=n*Math.sqrt((s+1)/o),a=e.between(0,Math.PI*2),i=e.between(0,l),h={x:t.x+Math.cos(a)*i,y:t.y+Math.sin(a)*i},c=e.between(0,Math.PI*2),f=e.between(.12,.38),p=[{...h,pressure:e.between(.6,.9)},{x:h.x+Math.cos(c)*f*.6,y:h.y+Math.sin(c)*f*.6,pressure:e.between(.5,.75)},{x:h.x+Math.cos(c)*f,y:h.y+Math.sin(c)*f,pressure:.25}];r.push({kind:"stroke",points:p})}return r}function tt(e,t,n){return t.map(o=>({kind:"press",at:o,pressure:e.between(...n)}))}function Kt(e,t,n,o){let r=[];for(let s=0;s<o.passes;s++){let l=(s-(o.passes-1)/2)*o.width,a=e.between(-.08,.08),i=e.between(0,Math.PI*2),h=[];for(let c=0;c<=10;c++){let f=c/10,p=o.fade??.25,v=.02*Math.sin(f*9+i);h.push({x:t.x+l*(1-.45*f)+o.lean*n*f+a*Math.sin(f*Math.PI)+v,y:t.y-n*f,pressure:1-(1-p)*f**1.3})}r.push({kind:"stroke",points:h,edge:o.edge})}return r}function Yt(e,t,n,o,r,s){let l=[],a=e.between(0,Math.PI*2);for(let i=0;i<o;i++){let h=r*Math.sqrt(-2*Math.log(Math.max(1e-6,e.next())))*.6,c=e.between(0,Math.PI*2);l.push({x:t.x+Math.cos(c)*h,y:t.y+Math.sin(c)*h,radius:e.between(...s)*(e.next()<.12?1.8:1),angle:a+e.between(-.4,.4)})}return{kind:"flick",from:t,mix:n,specks:l}}function zt(e,t,n,o){let r={x:Math.cos(t),y:Math.sin(t)},s={x:-r.y,y:r.x},{left:l,top:a,right:i,bottom:h}=e.bounds,c=[{x:l,y:a},{x:i,y:a},{x:l,y:h},{x:i,y:h}],f=(T,M)=>T.x*M.x+T.y*M.y,p=T=>{let M=c.map(C=>f(C,T));return[Math.min(...M),Math.max(...M)]},[v,L]=p(s),[q,D]=p(r),N=Array.from({length:8},(T,M)=>({x:Math.cos(M*Math.PI/4)*o,y:Math.sin(M*Math.PI/4)*o})),O=T=>e.contains(T)&&N.every(M=>e.contains({x:T.x+M.x,y:T.y+M.y})),b=(T,M)=>({x:s.x*T+r.x*M,y:s.y*T+r.y*M}),g=Math.min(.01,n/4),E=T=>v+n/2+T*n,k=[];for(let T=0;E(T)<L;T++){let M=[],C=null;for(let P=q;P<=D+g;P+=g){let u=P<=D&&O(b(E(T),P));u&&C===null&&(C=P),!u&&C!==null&&(M.push([C,P-g]),C=null)}k.push(M)}let S=k.map(T=>T.map(()=>!1)),F=(T,M,C)=>(k[T]??[]).findIndex(([P,u],d)=>{if(S[T]?.[d])return!1;let y=C?P:u;return Math.abs(y-M)<=3*n&&O(b(E(T)-n/2,(y+M)/2))}),R=[];return k.forEach((T,M)=>{T.forEach((C,P)=>{if(S[M]?.[P])return;let u=[],d=M,y=P,x=!0;for(;y>=0;){S[d][y]=!0;let[m,A]=k[d][y],[w,B]=x?[m,A]:[A,m];u.push({...b(E(d),w),pressure:.8},{...b(E(d),B),pressure:.8}),x=!x,d++,y=F(d,B,x)}R.push({kind:"stroke",points:u})})}),R}function Xt(e,t,n,o=0){let r=[];for(let s=0;s<=5;s++){let l=s/5;r.push({x:e.x+n*t*l*l,y:e.y-t*l,pressure:.95-.8*l})}return{kind:"stroke",points:r,tilt:o}}var I=16,K=12,J={x:5.6,y:2.05,radius:.48},Y={x:8.8,y:8.95},fe={x:8.35,y:9.13,scale:.8},$=e=>9.15+.15*Math.sin(e*.75+1.1)+.08*Math.sin(e*1.9)-.25*Math.exp(-((e-Y.x)**2)/3);function ae(e){let t={x:12.4,y:12.4},n={x:12.9,y:10.9},o={x:9.8,y:10.1},r=Y,s=1-e;return{at:{x:s**3*t.x+3*s*s*e*n.x+3*s*e*e*o.x+e**3*r.x,y:s**3*t.y+3*s*s*e*n.y+3*s*e*e*o.y+e**3*r.y},width:3.2*(1-e)+.4*e}}var nt=e=>Array.from({length:21},(t,n)=>{let o=n/20,r=ae(o),s=ae(Math.min(1,o+.02)),l=ae(Math.max(0,o-.02)),a=s.at.x-l.at.x,i=s.at.y-l.at.y,h=Math.hypot(a,i)||1;return{x:r.at.x-i/h*e*r.width*.5,y:r.at.y+a/h*e*r.width*.5}}),en=ue([...nt(-1),...nt(1).reverse()]);function ot(e){let t=Number.POSITIVE_INFINITY;for(let n=0;n<=40;n++){let o=ae(n/40);t=Math.min(t,Math.hypot(e.x-o.at.x,e.y-o.at.y)-o.width/2)}return t}var to=ue([{x:-.2,y:-.2},{x:I+.2,y:-.2},...Array.from({length:33},(e,t)=>{let n=I+.2-t/32*(I+.4);return{x:n,y:$(n)-1.1}})]),no=Gt(-.3,-.3,I+.3,6.2),jt=ue(Array.from({length:32},(e,t)=>({x:8.6+2.2*Math.cos(t/32*Math.PI*2),y:9.9+1*Math.sin(t/32*Math.PI*2)}))),oo=ue([...Array.from({length:33},(e,t)=>{let n=-.2+t/32*(I+.4);return{x:n,y:$(n)+.55}}),{x:I+.2,y:K+.2},{x:-.2,y:K+.2}]),ro=ue([...Array.from({length:33},(e,t)=>{let n=-.2+t/32*(I+.4);return{x:n,y:$(n)-.05}}),{x:I+.2,y:K+.2},{x:-.2,y:K+.2}]),st=(e,t,n)=>Math.hypot(e.x-t.x,e.y-t.y)<n,de=(e,t,n)=>{let o=Math.min(1,Math.max(0,(n-e)/(t-e)));return o*o*(3-2*o)};function pe(e,t,n=.25){let o={};for(let[r,s]of Object.entries(t))o[r]=s*e.between(1-n,1+n);return o}var _e=Je(29),qe=(e,t,n,o,r=.2)=>({at:{x:e+_e.between(-r,r),y:t+_e.between(-r,r)*.75},paint:n,size:o*_e.between(.82,1.18),angle:_e.between(-.45,.45)}),W="titaniumWhite",_="skyBlue",Vt="cobaltBlue",H="prussianBlue",so=[[.7,[[.6,Vt],[2.2,_],[3.8,_],[5.6,W],[7.2,_],[8.8,_],[10.4,_],[12,_],[13.6,_],[15.3,Vt]]],[2,[[1.4,H],[3,_],[4.6,W],[5.6,W],[6.6,W],[8.2,_],[10,H],[11.8,_],[13.4,H],[15,_]]],[3.3,[[.6,H],[2.2,H],[3.8,_],[5.3,W],[6.8,W],[8.4,_],[10.2,_],[12,H],[13.8,H],[15.3,H]]],[4.6,[[1.4,H],[3,_],[4.6,_],[6.3,W],[7.6,W],[9,_],[10.6,H],[12.4,_],[14.2,H]]],[5.9,[[.6,_],[2.2,H],[3.8,_],[5.6,_],[7.3,W],[8.5,W],[9.8,_],[11.2,H],[12.8,_],[14.6,_]]]],ao=Array.from({length:18},(e,t)=>{let n=.5+t*.885,o=Math.abs(n-Y.x)<.9;return qe(n,7.45,o?W:_,.72,.12)}),ce="sapGreen",he="phthaloGreen",se="yellowOchre",Ie="cadmiumYellow",Qt="burntSienna",Oe="marsBlack",io=[[9.65,[[.5,he],[2.2,ce],[4,Qt],[6,se],[7.5,Ie],[8.4,W],[9.3,Ie],[10.2,se],[11.3,se],[12.9,Qt],[14.4,ce],[15.6,he]]],[10.65,[[.5,Oe],[2,he],[3.6,he],[5.2,ce],[6.9,se],[8.2,Ie],[9.2,W],[10.6,W],[11.7,se],[12.9,se],[14.2,ce],[15.5,Oe]]],[11.55,[[.5,Oe],[2,he],[3.6,ce],[5.2,he],[7,ce],[8.8,he],[10.5,ce],[11.9,se],[12.9,W],[14,se],[15.5,Oe]]]],Jt=[[.05,"yellowOchre"],[.15,"titaniumWhite"],[.25,"yellowOchre"],[.35,"titaniumWhite"],[.45,"yellowOchre"],[.55,"titaniumWhite"],[.65,"cadmiumYellow"],[.74,"titaniumWhite"],[.83,"titaniumWhite"],[.92,"titaniumWhite"]].map(([e,t])=>qe(ae(e).at.x,ae(e).at.y,t,1,.15)),Pe=[...so.flatMap(([e,t])=>t.map(([n,o])=>qe(n,e,o,o===W?1.3:1))),...ao,...io.flatMap(([e,t])=>t.map(([n,o])=>qe(n,e+.09,o,1,.12))).filter(e=>Jt.every(t=>!st(t.at,e.at,.6))),...Jt];function uo(e,t,n){let o=ee.tube.width/2*t.size;return[t.at,...Array.from({length:8},(s,l)=>({x:t.at.x+Math.cos(l*Math.PI/4)*o,y:t.at.y+Math.sin(l*Math.PI/4)*o}))].filter(s=>s.x>=0&&s.x<=I&&s.y>=0&&s.y<=K).every(s=>e.some(l=>l.kind==="stroke"&&Wt(l.points,s,n.width,n.depth)))}var tn=Pe.filter(e=>e.paint===H).map(e=>e.at),lo=Pe.filter(e=>e.paint===H||e.at.y>7).map(e=>e.at),co=[{x:.3,depth:"middle"},{x:1.05,depth:"near"},{x:1.75,depth:"far"},{x:2.05,depth:"far"},{x:2.85,depth:"middle"},{x:3.75,depth:"near"},{x:4.2,depth:"far"},{x:4.6,depth:"middle"},{x:6.3,depth:"far"},{x:6.75,depth:"middle"},{x:9.9,depth:"far"},{x:10.45,depth:"middle"},{x:10.8,depth:"far"},{x:11.7,depth:"middle"},{x:12.6,depth:"far"},{x:12.95,depth:"middle"},{x:13.3,depth:"far"},{x:14.1,depth:"near"},{x:14.95,depth:"middle"},{x:15.3,depth:"far"},{x:15.85,depth:"near"}],nn={far:{mix:{skyBlue:2,titaniumWhite:1,prussianBlue:.5},amount:7,passes:1,spacing:0,width:.2},middle:{mix:{burntUmber:1.5,prussianBlue:1.5,marsBlack:.6},amount:14,passes:1,spacing:0,width:.42},near:{mix:{burntUmber:2,marsBlack:1.5,prussianBlue:.6},amount:16,passes:2,spacing:.34,width:.76}};function ho(e){return co.map(t=>{let n=t.depth==="near"?{x:t.x,y:K+.3}:t.depth==="middle"?{x:t.x,y:$(t.x)+e.between(.6,1.4)}:{x:t.x,y:$(t.x)+e.between(.05,.3)};return{...t,base:n,lean:e.between(-.045,.045),width:nn[t.depth].width}})}var fo=(e,t)=>e.base.x+e.lean*(e.base.y-t),Se=[[-.26,0],[-.31,-.08],[-.32,-.18],[-.29,-.28],[-.22,-.37],[-.14,-.45],[-.07,-.55],[-.03,-.64],[-.01,-.72],[.02,-.79],[.07,-.835],[.13,-.84],[.19,-.815],[.27,-.78],[.36,-.755],[.33,-.735],[.24,-.72],[.17,-.7],[.13,-.67],[.12,-.6],[.14,-.5],[.15,-.4],[.15,-.3],[.15,-.12],[.19,-.03],[.19,0],[.08,0]],po=[[[-.005,-.8],[.015,-.99],[.06,-.835]],[[.06,-.84],[.11,-1],[.15,-.83]]],on=[[-.3,-.04,.07],[-.26,.03,.11],[-.12,.07,.135],[.04,.08,.14],[.18,.07,.12],[.3,.045,.09],[.4,.015,.05],[.46,-.005,.015]],rt=([e,t])=>({x:fe.x+e*fe.scale,y:fe.y+t*fe.scale});function at(e,t){let n=ue(Se.map(rt));return[{x:0,y:0},...Array.from({length:8},(r,s)=>({x:Math.cos(s*Math.PI/4)*t,y:Math.sin(s*Math.PI/4)*t}))].some(r=>n.contains({x:e.x+r.x,y:e.y+r.y}))?!0:on.some(([r,s,l])=>{let a=rt([r,s]);return Math.hypot(e.x-a.x,e.y-a.y)<l/2*fe.scale+t})}var mo=Math.atan2(-.56,.28);function bo(){let e=rt,t=i=>({kind:"stroke",points:Ze(i.map(h=>({...e(h),pressure:.8})),.03)}),n=([i,h],[c,f])=>[(i+c)/2,(h+f)/2],o=[t(Se.slice(0,15)),t([...Se.slice(14),Se[0]])],r=ee.pen.width,s=zt(ue(Se.map(e)),mo,r*.6,r/4),l=po.flatMap(([i,h,c])=>{let f=[i,c],p=h;return[t([f[0],p]),t([f[1],p]),t([n(f[0],f[1]),p])]}),a=[-.75,-.5,-.25,0,.25,.5,.75].map(i=>t(on.map(([h,c,f])=>[h,c+i*f*.5])));return[...o,...s,...l,...a]}function yo(){return{title:"Drop the paint",tool:"tube",paints:["titaniumWhite","skyBlue","cobaltBlue","prussianBlue","yellowOchre","cadmiumYellow","burntSienna","sapGreen","phthaloGreen","marsBlack"],note:"Every paint goes straight onto the canvas as a drop, near where it will end up: white along the path of the light, Prussian blue where the woods go dark, earths and greens below.",gestures:Pe.map(e=>({kind:"drop",at:e.at,mix:{[e.paint]:1},size:e.size,angle:e.angle})),pace:2}}function xo(e){let t=lo.map(o=>({at:o,distance:1.25})),n=Ht(e,no,{start:J,count:230,length:[1,1.7],avoid:t,pressure:[.5,.95,.55]});for(let o of Pe){if(o.paint===H||o.at.y>7||uo(n,o,ee.wideBrush))continue;let r=tn.reduce((l,a)=>Math.hypot(a.x-o.at.x,a.y-o.at.y)<Math.hypot(l.x-o.at.x,l.y-o.at.y)?a:l),s=Math.atan2(o.at.y-r.y,o.at.x-r.x);n.push({kind:"stroke",points:et(o.at,s+Math.PI/2,.9,.1,[.55,.85,.5])})}return{title:"Spread the sky",tool:"wideBrush",paints:["titaniumWhite","skyBlue","cobaltBlue"],note:"A dry two-inch brush works out from the moon in short crossing strokes, picking up the drops it meets and laying them down again further on. It leaves the dark drops alone.",gestures:n}}function wo(e){let t=[];for(let n of tn)t.push(...$t(e,n,1.3,24));return{title:"Knife in the dark woods",tool:"knife",paints:["prussianBlue"],note:"The painting knife pats each Prussian blue drop outward into a ragged mass. Every pat lifts the paint under the blade and leaves a crisp ridge along its edge.",gestures:t}}function go(e){let t=[];for(let n=.4;n<I;n+=e.between(.45,.7)){let o=e.between(5.6,6.1),r=$(n)-.1,s=e.next()<.6,l=[{x:n+e.between(-.05,.05),y:s?o:r,pressure:.55},{x:n,y:(o+r)/2,pressure:.85},{x:n+e.between(-.05,.05),y:s?r:o,pressure:.5}];t.push({kind:"stroke",points:l})}return{title:"Pull down the mist",tool:"wideBrush",paints:["skyBlue","titaniumWhite"],note:"The same brush, turned, pulls the row of small blue drops into vertical streaks: a band of mist where the far trees stand.",gestures:t}}function vo(e){let t=[],n=(a,i)=>t.push({kind:"stroke",points:a.map(([h,c],f)=>({x:h,y:c,pressure:i[f]??.6}))}),o=Pe.filter(a=>jt.contains(a.at)&&(a.paint===Ie||a.paint===W||a.paint===se));for(let a of Q(e,o.map(i=>i.at),{x:6,y:9.5})){n([[a.x,a.y],[a.x-.15,(a.y+$(a.x))/2],[a.x-.05,$(a.x)-.05]],[.7,.85,.5]);for(let i of[-1,1]){let h=e.between(.8,1.2);n([[a.x,a.y],[a.x+i*h*.5,a.y-.12],[a.x+i*h,a.y-e.between(0,.25)]],[.7,.9,.5])}}let r=(a,i,h,c)=>{let f=c?-1:1;for(let p=0;p<h-i-.2;p+=1.1){let v=c?h-p:i+p,L=c?Math.max(i,v-1.25):Math.min(h,v+1.25);n([[v,a],[v+f*.6,a+e.between(-.06,.06)],[L,a]],[.6,.8,.55])}};for(let a=9.15,i=0;a<10.8;a+=.32,i++){let h=2.2*Math.sqrt(Math.max(0,1-((a-9.9)/1)**2))-.2;h>.3&&r(Math.max(a,$(8.6)-.05),8.6-h,8.6+h,i%2===1)}t.push({kind:"clean"});let s=a=>!en.contains(a)&&!jt.contains(a),l=0;for(let a=9.05;a<K+.2;a+=.36,l++){let i=f=>({x:f,y:Math.max(a,$(f)-.08)}),h=[],c=-.4;for(;c<I+.4;){if(!s(i(c))){c+=.05;continue}let f=Math.min(c+e.between(1.4,2.2),I+.5),p=c;for(;p<f&&s(i(p+.05));)p+=.05;if(p-c>.3){let v=e.between(-.12,.12),L=i(c);h.push({kind:"stroke",points:[{...L,pressure:.6},{x:(c+p)/2,y:L.y+v,pressure:.9},{x:p,y:L.y+v*.3,pressure:.55}]})}c=p<f?p+.05:c+(p-c)*e.between(.65,.85)}t.push(...l%2?h.reverse():h)}t.push({kind:"clean"});for(let a=.02;a<.9;a+=.055){let i=ae(a),h=ae(Math.min(1,a+.07)).at,c=h.x-i.at.x,f=h.y-i.at.y,p=Math.hypot(c,f)||1,v=Math.min(4,Math.ceil(i.width*.7/.8)+1);for(let L=0;L<v;L++){let q=(L/(v-1)-.5)*i.width*.7,D=i.at.x-f/p*q,N=i.at.y+c/p*q,O=Math.min(e.between(.7,1),Math.hypot(Y.x-i.at.x,Y.y-i.at.y));t.push({kind:"stroke",points:[{x:D,y:N,pressure:.65},{x:D+c/p*O*.5,y:N+f/p*O*.5,pressure:.85},{x:D+c/p*O,y:N+f/p*O,pressure:.5}]})}}return{title:"Lay in the ground",tool:"flatBrush",paints:["yellowOchre","burntSienna","sapGreen","phthaloGreen","marsBlack"],note:"A one-inch brush, clean, spreads the warm drops in the clearing into a pool of light first; then, wiped, it lays the greens and black in around it, and runs the path up to the light.",gestures:t}}function To(e){let t=Q(e,Te(e,to,330,.45),J),n=Q(e,Te(e,oo,110,.5),{x:8.6,y:9.9});return{title:"Pounce the scrubber",tool:"scrubber",paints:[],note:"A steel-wool scrubber glued to a jar lid is pounced over everything while it is wet, from the light outward, and wiped before it goes from the sky to the ground. It lifts paint and drops it again a pad-width away, breaking every brushstroke into a glittering stipple.",gestures:[...tt(e,t,[.72,.95]),{kind:"clean"},...tt(e,n,[.72,.95])],pace:2.2}}function So(e,t){let n=[],o=[...t].sort((r,s)=>Zt(r.depth)-Zt(s.depth));for(let r of o){let s=nn[r.depth];n.push({kind:"load",mix:pe(e,s.mix),amount:s.amount*e.between(.85,1.15),keep:.2}),n.push(...Kt(e,r.base,r.base.y+.4,{lean:r.lean,passes:s.passes,width:s.spacing,edge:r.depth==="far",fade:r.depth==="far"?.12:.3}))}return{title:"Pull up the trunks",tool:"trunkBrush",paints:["burntUmber","marsBlack","prussianBlue"],note:"Umber and black on a half-inch brush, pulled up from the ground in one stroke per trunk and easing off as it climbs. The far trunks go first and thinnest; the brush drags up streaks of the wet blue beneath.",gestures:n}}var Zt=e=>e==="far"?0:e==="middle"?1:2;function Po(e){let t=Math.min(e.x,I-e.x),n=(1-de(.6,4,t))*(1-de(5.2,8,e.y)),o=1-de(.3,2.4,e.y);return Math.max(n,.8*o)}function Mo(e){let t=[];for(;t.length<30;){let s={x:e.between(-.3,I+.3),y:e.between(-.3,8.4)};st(s,J,2)||e.next()>Po(s)||t.push(s)}let n={prussianBlue:2,phthaloGreen:1.2,marsBlack:.8,burntUmber:.5},o={phthaloGreen:1,prussianBlue:1,skyBlue:1.2},r=[];return Q(e,t,{x:0,y:0}).forEach((s,l)=>{l%3===0&&r.push({kind:"load",mix:pe(e,l%12===9?o:n,.35),amount:e.between(1.3,2),keep:.15}),r.push({kind:"press",at:s,pressure:e.between(.45,.8),pickup:.3}),e.next()<.55&&r.push({kind:"press",at:{x:s.x+e.between(-.6,.6),y:s.y+e.between(-.45,.45)},pressure:e.between(.25,.45),skim:.35,pickup:.3})}),{title:"Pounce the leaves",tool:"scrubber",paints:["prussianBlue","phthaloGreen","marsBlack","burntUmber","skyBlue"],note:"The scrubber again, now loaded with navy and dark green, pounced along the top and down both sides so the trees frame the picture. Each press prints a clump of leaves, lighter where it barely touches.",gestures:r,pace:1.6}}function Eo(e){return{title:"Spatter",tool:"spatter",paints:["titaniumWhite"],note:"A round brush loaded with white, tapped against the handle of another: a shower of specks, the first of the night\u2019s lights.",gestures:[{x:3.2,y:2.6},{x:7.6,y:3.4},{x:11.4,y:2.2},{x:13.8,y:5.2},{x:9.6,y:6.2},{x:2.4,y:6.4}].map(n=>Yt(e,n,{titaniumWhite:1},46,1.5,[.008,.024]))}}function Ao(e){let t=Te(e,ro,170,.3).filter(a=>a.y>$(a.x)+.12&&a.y<K+.05&&[-.45,0,.45].every(i=>!en.contains({x:a.x+i,y:a.y}))),n=a=>Math.max(1-de(.2,2.6,ot(a)),1-de(.8,3,Math.hypot(a.x-Y.x,a.y-Y.y))),o=t.filter(a=>n(a)<.25&&e.next()<.45),r=t.filter(a=>!o.includes(a)),s=[],l=(a,i)=>s.push(Xt(a,e.between(...i),e.between(-.55,.55),e.between(-.45,.45)));return Q(e,o,{x:0,y:K}).forEach((a,i)=>{i%3===0&&s.push({kind:"load",mix:pe(e,{phthaloGreen:1,marsBlack:1}),amount:5,keep:.3}),l(a,[.3,.6])}),s.push({kind:"clean"}),Q(e,r,{x:0,y:K}).forEach((a,i)=>{if(i%3===0){let c=n(a)>.55?{titaniumWhite:5,sapGreen:.4,cadmiumYellow:.4}:e.next()<.5?{titaniumWhite:3,sapGreen:1}:{titaniumWhite:3,sapGreen:.7,cadmiumYellow:.8};s.push({kind:"load",mix:pe(e,c),amount:5,keep:.3})}l(a,[.22,.5])}),{title:"Comb the grass",tool:"comb",paints:["titaniumWhite","sapGreen","cadmiumYellow","phthaloGreen","marsBlack"],note:"A fine comb with paint on its teeth, set down on the ground and flicked upward: a dozen blades at a time. A few dark ones in the shadows first, then pale green and white over them, palest where the light reaches.",gestures:s}}function Ro(e){let t=[{kind:"load",mix:{titaniumWhite:3,skyBlue:1},amount:6}];for(let n=0;n<18;n++){let o=e.between(.5,I-.5);if(Math.abs(o-J.x)<.8)continue;let r=$(o)+e.between(-.1,.2),s=e.between(2,5.2),l=e.between(-.04,.04);n%3===0&&t.push({kind:"load",mix:{titaniumWhite:3,skyBlue:1},amount:6,keep:.3}),t.push({kind:"stroke",points:[{x:o,y:r,pressure:.55},{x:o+l*s*.5,y:r-s*.5,pressure:.4},{x:o+l*s,y:r-s,pressure:.12}],skim:.15})}for(let n=0;n<26;n++){let o=e.next()<.5?-1:1,r=nt(o)[2+e.index(18)],s=r.x+e.between(-.3,.3),l=r.y+e.between(-.1,.2);n%5===0&&t.push({kind:"load",mix:{titaniumWhite:2,sapGreen:1,cadmiumYellow:1},amount:5,keep:.3}),t.push({kind:"stroke",points:[{x:s,y:l,pressure:.6},{x:s+e.between(-.08,.08),y:l-e.between(.25,.5),pressure:.1}]})}return{title:"Saplings in the mist",tool:"liner",paints:["titaniumWhite","skyBlue","sapGreen"],note:"A liner brush draws thin pale lines into the mist, far-off saplings with the moon on them, and flicks a few light blades of grass along the path.",gestures:t}}function Lo(){let e=[];for(let t=0;t<7;t++){let n=.6+t*1.8;e.push(t%2?{x:I+.5,y:n}:{x:-.5,y:n}),e.push(t%2?{x:-.5,y:n}:{x:I+.5,y:n})}return{title:"Dry it",tool:"dryer",paints:[],note:"Everything so far has been painted wet into wet. A hair dryer sets it, so what comes next sits on top, crisp, instead of blending in. Watch the shine go.",gestures:[{kind:"dry",path:e}]}}function Fo(e){let t=[];for(let n=0;n<20;n++){n%5===0&&t.push({kind:"load",mix:{titaniumWhite:1},amount:3,keep:.25});let o=e.between(0,Math.PI*2),r=e.between(0,J.radius*.35);t.push({kind:"press",at:{x:J.x+Math.cos(o)*r,y:J.y+Math.sin(o)*r},pressure:e.between(.75,.95),angle:e.between(0,6.28)})}t.push({kind:"load",mix:{titaniumWhite:1},amount:1.4,keep:.5});for(let n=0;n<36;n++){let o=e.next(),r=e.between(0,Math.PI*2),s=J.radius*(1+1.9*o*o);t.push({kind:"press",at:{x:J.x+Math.cos(r)*s,y:J.y+Math.sin(r)*s},pressure:e.between(.38,.48)-.15*o,angle:e.between(0,6.28),skim:.45,size:e.between(1,1.25)-.35*o})}return{title:"Dab the moon",tool:"cotton",paints:["titaniumWhite"],note:"Before a single trunk goes in, a ball of cotton wool in a clothespin, dipped in white and dabbed over and over in one spot until the moon is solid; then, nearly dry, dabbed lightly around it for the glow. The trees will stand in front of its light.",gestures:t}}function it(e,t,n=!0){let o=[];for(;o.length<t;){let r=e.next(),s;if(r<.35){let l=e.between(0,1),a=ae(l);s={x:a.at.x+e.between(-1,1)*a.width*.7,y:a.at.y+e.between(-.5,.3)}}else if(r<.6){let l=e.between(0,Math.PI*2),a=Math.sqrt(e.next())*3.2;s={x:Y.x+Math.cos(l)*a*1.3,y:Y.y-1.2+Math.sin(l)*a*.9}}else s={x:e.between(.3,I-.3),y:e.between(2.4,K-.3)};s.x<.2||s.x>I-.2||s.y<.2||s.y>K-.2||n&&at(s,.25)||st(s,J,J.radius*2)||o.push(s)}return o}function ko(e){let t=r=>{let s=[];for(;s.length<r;){let l={x:e.between(.3,I-.3),y:e.between(9,K-.2)};if(l.y<$(l.x)+.35||ot(l)<.45||at(l,.95))continue;let a=1-de(.4,3,ot(l)),i=de($(l.x),K,l.y);e.next()>.2+.45*i+.45*a||s.push(l)}return s},n=[],o=r=>n.push({kind:"press",at:r,pressure:e.between(.45,.95),angle:e.between(-.9,.9),size:e.between(.8,1.15)});return Q(e,t(20),Y).forEach((r,s)=>{s%3===0&&n.push({kind:"load",mix:pe(e,{cadmiumYellow:4,titaniumWhite:1},.3),amount:e.between(4,5.5),keep:.2}),o(r)}),n.push({kind:"clean"}),Q(e,t(9),Y).forEach((r,s)=>{s%3===0&&n.push({kind:"load",mix:pe(e,{titaniumWhite:6,cadmiumYellow:.15}),amount:e.between(4,5.5),keep:.1}),o(r)}),{title:"Stamp the flowers",tool:"bundle",paints:["cadmiumYellow","titaniumWhite"],note:"Twenty cotton swabs held in a rubber band and fanned out, dipped in yellow and stamped through the meadow, right up to where the fox will sit: a scatter of small flowers with every press, thickest toward the light. Then a few in white.",gestures:n,pace:1.4}}function Bo(e){let t=[];return Q(e,it(e,150),Y).forEach((o,r)=>{let s=r%5<2;r%2===0&&t.push({kind:"load",mix:pe(e,s?{cadmiumYellow:5,sapGreen:1,titaniumWhite:2}:{titaniumWhite:1}),amount:e.between(4,5.5),keep:.1}),t.push({kind:"press",at:o,pressure:e.between(.4,.95),angle:e.between(0,6.28),size:.42+e.next()**1.8})}),{title:"Dot the fireflies",tool:"swab",paints:["titaniumWhite","cadmiumYellow","sapGreen"],note:"One swab, one dot at a time, some with just its tip and some pressed flat: white ones and yellow-green ones, thickest where the light is.",gestures:t,pace:1.5}}function Co(){return{title:"Draw the fox",tool:"pen",paints:["titaniumWhite"],note:"A white paint pen, fed from its barrel so it never runs dry: the fox outlined first, then filled with lines back and forth until it is solid white, the ears and the curl of the tail last.",gestures:[{kind:"load",mix:{titaniumWhite:1},amount:4},...bo()]}}function Do(e,t){let n=[],o=t.filter(r=>r.depth!=="far"&&Math.abs(r.x-7.5)<6);for(let r of o){let s=r.x>J.x?-1:1,l=c=>fo(r,c)+s*(r.width/2-.03),a=Math.min(r.base.y-.2,r.depth==="near"?e.between(8.5,10):$(r.x)+e.between(.2,.8)),i=a-e.between(2.5,5),h=(a+i)/2;n.push({kind:"load",mix:{titaniumWhite:3,skyBlue:1},amount:6,keep:.2}),n.push({kind:"stroke",points:[{x:l(a),y:a,pressure:.35},{x:l(h)+e.between(-.02,.02),y:h,pressure:.55},{x:l(i),y:i,pressure:.15}],skim:.25})}return{title:"Light the trunks",tool:"liner",paints:["titaniumWhite","skyBlue"],note:"A broken line of pale blue down the side of each trunk that faces the moon.",gestures:n}}function _o(e,t){let n=[];return t.forEach((o,r)=>{r%2===0&&n.push({kind:"load",mix:{titaniumWhite:1},amount:e.between(.9,1.4),keep:.2}),n.push({kind:"press",at:o,pressure:e.between(.45,.65),angle:e.between(0,6.28),skim:.3,twist:e.between(.9,1.3),size:e.between(.45,.75)})}),{title:"Twist the glows",tool:"cotton",paints:["titaniumWhite"],note:"The cotton ball, with a little white dabbed off on a card until it is nearly dry, pressed and twisted: the fibers drag the paint out in fine rays, and the brightest fireflies get a halo.",gestures:n}}function Oo(e,t){let n=[],o=Array.from({length:14},()=>({x:fe.x+e.between(-.6,.8),y:fe.y+e.between(-.02,.22)})).filter(s=>!at(s,.08));return[...t,...o,...Q(e,it(e,40),Y)].forEach((s,l)=>{l%3===0&&n.push({kind:"load",mix:{titaniumWhite:1},amount:5,keep:.1}),n.push({kind:"press",at:s,pressure:e.between(.35,.6),angle:e.between(0,6.28),size:.35+.6*e.next()**1.5})}),{title:"Last sparkles",tool:"swab",paints:["titaniumWhite"],note:"A clean swab and small dots of white, here and there, to finish.",gestures:n,pace:1.5}}function rn(e=11){let t=s=>Je(e*100+s),n=ho(t(0)),o=t(1),r=Q(o,it(o,24),Y);return{title:"Fox at the edge of the wood",width:I,height:K,steps:[yo(),xo(t(2)),wo(t(3)),go(t(4)),vo(t(5)),To(t(6)),Fo(t(7)),So(t(8),n),Mo(t(9)),Eo(t(10)),Ao(t(11)),Ro(t(12)),Lo(),ko(t(13)),Bo(t(14)),Co(),Do(t(15),n),_o(t(16),r),Oo(t(17),r)]}}var Ne=["#c98f55","#a8693a"],sn=["#2f4f8f","#1c3263"],Ue=["#e9ecef","#9aa1a8","#d5d9dd"],z=(e,t,n,o,r,s)=>{let l=e.createLinearGradient(t,n,o,r);for(let[a,i]of s.entries())l.addColorStop(a/Math.max(1,s.length-1),i);return l};function me(e,t,n,o,r,s){e.beginPath(),e.roundRect(t,n,o,r,s)}function Ge(e,t,n,o,r,s){e.beginPath(),e.moveTo(-o/2,t),e.lineTo(o/2,t),e.quadraticCurveTo(r*.7,(t+n)/2,r/2,n-r/2),e.arc(0,n-r/2,r/2,0,Math.PI),e.quadraticCurveTo(-r*.7,(t+n)/2,-o/2,t),e.closePath(),e.fillStyle=z(e,-o/2,0,o/2,0,[s[1]??"#000",s[0]??"#000",s[1]??"#000"]),e.fill()}function lt(e,t,n,o,r){e.beginPath(),e.moveTo(-o/2,t),e.lineTo(o/2,t),e.lineTo(r/2,n),e.lineTo(-r/2,n),e.closePath(),e.fillStyle=z(e,-o/2,0,o/2,0,Ue),e.fill(),e.strokeStyle="rgba(60,64,70,0.45)",e.lineWidth=.012;for(let s of[.25,.35]){let l=t+(n-t)*s,a=o+(r-o)*s;e.beginPath(),e.moveTo(-a/2,l),e.lineTo(a/2,l),e.stroke()}}function an(e,t,n,o,r){if(e.save(),e.beginPath(),e.moveTo(-t/2,n),e.lineTo(-t/2,n*.18),e.quadraticCurveTo(-t/2,0,-t*.38,0),e.lineTo(t*.38,0),e.quadraticCurveTo(t/2,0,t/2,n*.18),e.lineTo(t/2,n),e.closePath(),e.fillStyle=o,e.fill(),e.clip(),r?.length){let s=t/r.length;r.forEach((l,a)=>{let i=e.createLinearGradient(0,0,0,n*.75);i.addColorStop(0,l),i.addColorStop(1,"rgba(0,0,0,0)"),e.fillStyle=i,e.fillRect(-t/2+a*s-.002,0,s+.004,n)})}e.strokeStyle="rgba(40,30,20,0.18)",e.lineWidth=.008;for(let s=-t/2+.02;s<t/2;s+=.045)e.beginPath(),e.moveTo(s,n),e.lineTo(s+.01*Math.sin(s*40),.02),e.stroke();e.restore()}function ut(e,t,n,o){let r=t*.55+.25;an(e,t,r,"#a49377",n),lt(e,r,r+.55,t*1.04,t*.9),Ge(e,r+.55,r+.55+4.2,Math.min(.42,t*.6),.22,o)}function un(e,t){an(e,.06,.32,"#c9b18a",t),lt(e,.3,.75,.08,.1),Ge(e,.75,6,.1,.16,Ne)}function Io(e){e.beginPath(),e.moveTo(0,-.95),e.quadraticCurveTo(.34,-.55,.31,.1),e.quadraticCurveTo(.26,.42,.05,.48),e.lineTo(-.05,.48),e.quadraticCurveTo(-.26,.42,-.31,.1),e.quadraticCurveTo(-.34,-.55,0,-.95),e.closePath(),e.fillStyle=z(e,-.32,0,.32,0,Ue),e.fill(),e.strokeStyle="rgba(90,95,100,0.5)",e.lineWidth=.015,e.stroke(),e.fillStyle=z(e,-.04,0,.04,0,Ue),e.fillRect(-.035,.46,.07,.9),lt(e,1.3,1.6,.14,.2),Ge(e,1.6,5.2,.2,.3,sn)}function qo(e){e.fillStyle="#7d8287",e.beginPath(),e.arc(0,0,1.3,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(225,230,235,0.7)",e.lineWidth=.025;for(let t=0;t<46;t++){let n=t/46*Math.PI*2;e.beginPath(),e.arc(Math.cos(n)*1.12,Math.sin(n)*1.12,.16+.05*Math.sin(t*2.3),n,n+2.6),e.stroke()}e.fillStyle=z(e,-1,-1,1,1,["#e8dcf2","#c4b2d9","#a996c4"]),e.beginPath(),e.arc(0,0,1.02,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(255,255,255,0.6)",e.lineWidth=.04,e.beginPath(),e.arc(0,0,.86,Math.PI*1.05,Math.PI*1.6),e.stroke()}function No(e){e.fillStyle="rgba(28,28,32,0.92)",me(e,-.62,.06,1.24,.34,.06),e.fill(),e.strokeStyle="rgba(28,28,32,0.85)",e.lineWidth=.018;for(let t=-.56;t<=.56;t+=.066)e.beginPath(),e.moveTo(t,.08),e.lineTo(t,-.02),e.stroke();e.fillStyle="rgba(255,255,255,0.12)",e.fillRect(-.6,.1,1.2,.04)}function Uo(e,t){e.save(),e.rotate(-.35),e.fillStyle=z(e,-.18,0,.18,0,["#d9b47c","#b8894f"]),me(e,-.17,.25,.34,2.9,.05),e.fill(),e.strokeStyle="rgba(80,50,20,0.5)",e.lineWidth=.02,e.beginPath(),e.moveTo(0,.3),e.lineTo(0,3.1),e.stroke(),e.fillStyle=z(e,-.2,0,.2,0,Ue),e.fillRect(-.2,1.4,.4,.14),e.restore();let n=t?.[Math.floor(t.length/2)];for(let[o,r,s]of[[0,0,.36],[-.2,-.08,.22],[.2,-.05,.22],[.05,.2,.24],[-.12,.16,.2]])e.fillStyle=e.createRadialGradient(o-s*.3,r-s*.3,s*.1,o,r,s),e.fillStyle.addColorStop(0,"#ffffff"),e.fillStyle.addColorStop(1,"#dcdad3"),e.beginPath(),e.arc(o,r,s,0,Math.PI*2),e.fill();n&&(e.fillStyle=n,e.beginPath(),e.arc(0,-.02,.3,0,Math.PI*2),e.fill())}function Go(e,t,n,o){e.save(),e.rotate(n),e.fillStyle="#f3f1ea",e.fillRect(-.03,.08,.06,o),e.fillStyle=e.createRadialGradient(-.03,-.04,.01,0,0,.12),e.fillStyle.addColorStop(0,"#ffffff"),e.fillStyle.addColorStop(1,"#d6d3ca"),e.beginPath(),e.ellipse(0,0,.1,.14,0,0,Math.PI*2),e.fill(),t&&(e.fillStyle=t,e.beginPath(),e.ellipse(0,-.01,.085,.11,0,0,Math.PI*2),e.fill()),e.restore()}function Wo(e,t){let n=[];for(let r of[{count:8,radius:.66,spread:1.05},{count:7,radius:.44,spread:.95},{count:4,radius:.23,spread:.8}])for(let s=0;s<r.count;s++){let l=-Math.PI/2+(s/(r.count-1)-.5)*2*r.spread;n.push([Math.cos(l)*r.radius,Math.sin(l)*r.radius+.3])}let o={x:0,y:1.9};e.strokeStyle="#f1efe8",e.lineWidth=.05;for(let[r,s]of n)e.beginPath(),e.moveTo(r,s),e.lineTo(o.x+r*.12,o.y),e.lineTo(o.x+r*.1,o.y+1.6),e.stroke();e.fillStyle="#c0392b",e.fillRect(-.16,o.y-.05,.32,.1),n.forEach(([r,s],l)=>{e.fillStyle="#ffffff",e.beginPath(),e.ellipse(r,s,.07,.09,0,0,Math.PI*2),e.fill();let a=t?.[l%(t?.length||1)];a&&(e.fillStyle=a,e.beginPath(),e.ellipse(r,s-.01,.06,.075,0,0,Math.PI*2),e.fill())})}function Ho(e,t){e.fillStyle=z(e,-.19,0,.19,0,["#2b2e33","#5b6068","#2b2e33"]),me(e,-.19,.42,.38,4.6,.12),e.fill(),e.fillStyle=z(e,-.19,0,.19,0,["#d9d8d2","#ffffff","#d9d8d2"]),e.fillRect(-.19,3.9,.38,.32),e.fillStyle=z(e,-.17,0,.17,0,["#9da2a8","#e3e6e9","#9da2a8"]),e.beginPath(),e.moveTo(-.05,.12),e.lineTo(.05,.12),e.lineTo(.17,.46),e.lineTo(-.17,.46),e.closePath(),e.fill(),e.fillStyle=t?.[Math.floor(t.length/2)]??"#f4f3ef",me(e,-.04,-.01,.08,.16,.035),e.fill()}function $o(e,t){e.save(),e.rotate(-.6),e.fillStyle=z(e,-.06,0,.06,0,["#ddd","#fff","#bbb"]),e.fillRect(-.06,0,.12,.22),e.fillStyle=z(e,-.28,0,.28,0,["#c8ccd0","#f4f6f7","#aab0b6"]),e.beginPath(),e.moveTo(-.14,.22),e.lineTo(.14,.22),e.lineTo(.3,.5),e.lineTo(.3,2.3),e.lineTo(-.3,2.3),e.lineTo(-.3,.5),e.closePath(),e.fill(),e.fillStyle=t??"#888",e.fillRect(-.3,1,.6,.75),e.fillStyle="#9aa0a6",e.fillRect(-.32,2.3,.64,.12),e.restore()}function Ko(e,t){e.save(),e.translate(-1.6,-1.9),e.rotate(.7),e.fillStyle=z(e,-.8,0,.8,0,["#fafafa","#e2e2e2"]),me(e,-.8,-.2,1.6,2.4,.7),e.fill(),e.fillStyle="#d4d4d4",me(e,-.45,2.1,.9,.7,.2),e.fill(),e.fillStyle=z(e,-.3,0,.3,0,["#e9e9e9","#cfcfcf"]),me(e,-.32,2.5,.64,2,.18),e.fill(),e.strokeStyle="rgba(120,120,120,0.5)",e.lineWidth=.03;for(let n=0;n<6;n++)e.beginPath(),e.moveTo(-.5,.2+n*.22),e.lineTo(.5,.2+n*.22),e.stroke();e.restore(),e.strokeStyle="rgba(255,255,255,0.35)",e.lineWidth=.03;for(let n=0;n<4;n++){let o=(t*2.5+n/4)%1;e.beginPath(),e.arc(-1.6+1.6*o,-1.9+1.9*o,.4+.5*o,.2,1.4),e.stroke()}}function Yo(e,t,n){if(e.save(),e.rotate(.55),un(e,t),e.restore(),e.save(),e.translate(.6,.4),e.rotate(-.75),Ge(e,0,5,.16,.24,Ne),e.restore(),n>.5){e.fillStyle="rgba(255,255,255,0.85)";for(let o=0;o<14;o++){let r=o*2.4,s=.25+o%5*.12;e.beginPath(),e.arc(Math.cos(r)*s,Math.sin(r)*s-.2,.02+o%3*.01,0,Math.PI*2),e.fill()}}}function zo(e,t,n,o){switch(t.tool){case"wideBrush":return ut(e,2,n,Ne);case"flatBrush":return ut(e,1,n,Ne);case"trunkBrush":return ut(e,.42,n,sn);case"liner":return un(e,n);case"knife":return Io(e);case"scrubber":return qo(e);case"comb":return No(e);case"cotton":return Uo(e,n);case"swab":return Go(e,n?.[Math.floor((n?.length??0)/2)],-.5,3);case"bundle":return Wo(e,n);case"pen":return Ho(e,n);case"tube":return $o(e,t.paint);case"dryer":return Ko(e,o);case"spatter":return Yo(e,n,t.pressure)}}function Xo(e,t){switch(e){case"wideBrush":case"flatBrush":case"trunkBrush":case"liner":case"comb":return t.angle+Math.PI/2;case"knife":return t.angle-Math.PI/2;default:return-.5}}var jo=7;function ln(e){let t=document.createElement("canvas"),n=e.getContext("2d"),o=t.getContext("2d");if(!n||!o)throw new Error("no 2d context for the tools");return{draw(r,s,l,a){let i=e.width/e.getBoundingClientRect().width||1;n.setTransform(1,0,0,1,0,0),n.clearRect(0,0,e.width,e.height);let h=s.scale*i*(1+.07*r.lift),c=Math.ceil(jo*2*h);t.width!==c&&(t.width=c,t.height=c),o.setTransform(1,0,0,1,0,0),o.clearRect(0,0,c,c),o.setTransform(h,0,0,h,c/2,c/2),o.rotate(Xo(r.tool,r)),zo(o,r,l,a);let f=(s.left+r.x*s.scale)*i,p=(s.top+r.y*s.scale)*i,v=.06+.32*r.lift;n.save(),n.shadowColor=`rgba(10, 14, 24, ${.42-.14*r.lift})`,n.shadowBlur=(.06+.3*r.lift)*s.scale*i,n.shadowOffsetX=v*s.scale*i*.8,n.shadowOffsetY=v*s.scale*i,n.drawImage(t,f-c/2,p-c/2),n.restore()},clear(){n.setTransform(1,0,0,1,0,0),n.clearRect(0,0,e.width,e.height)}}}var Vo=880,we=new URLSearchParams(location.hash.slice(1)),mn=window.innerWidth<Vo,bn=Number(we.get("detail"))||(mn?60:128),yn=[1,2,4,8],Qo=6,Z=e=>{let t=document.querySelector(e);if(!t)throw new Error(`missing ${e}`);return t},ct=Z(".frame"),G=Z("#painting"),ht=Z("#tools"),dt=Z("#steps"),pt=Z("#stages"),We=Z("#status"),xn=Z("#caption"),ft=Z("#play"),wn=Z("#back"),gn=Z("#ahead"),ye=Z("#speed"),vn=Z("#download"),X=rn(),j=Ot(X,bn),xe;try{xe=yt(G)}catch(e){throw We.textContent=e instanceof Error?e.message:String(e),e}G.addEventListener("webglcontextlost",e=>{e.preventDefault(),U.pause(),We.textContent="The browser took back the GPU this painting lives on. Reload to start again."});var Ee=kt(xe,j.width,j.height,bn),Tn=Bt(Ee),cn=ln(ht),Sn={scale:1,left:0,top:0};function Pn(){let e=ct.getBoundingClientRect(),t=getComputedStyle(ct),n=Number.parseFloat(t.paddingLeft)+Number.parseFloat(t.paddingRight),o=Number.parseFloat(t.paddingTop)+Number.parseFloat(t.paddingBottom),r={width:Math.max(1,e.width-n),height:Math.max(1,e.height-o)},s=Math.min(r.width/X.width,r.height/X.height),l=Math.round(X.width*s),a=Math.round(X.height*s),i=Math.min(2,window.devicePixelRatio||1);G.style.width=`${l}px`,G.style.height=`${a}px`,G.width=Math.min(j.width,Math.round(l*i)),G.height=Math.min(j.height,Math.round(a*i)),ht.width=Math.round(e.width*i),ht.height=Math.round(e.height*i);let h=G.getBoundingClientRect();Sn={scale:s,left:h.left-e.left,top:h.top-e.top}}var Mn=0,hn,fn;function Jo(e){let t=ee[e.tool].body?Tn.held(e.tool):void 0;if(t){if(fn!==e.tool||Mn%Qo===0){let n=Ee.probe(t,8);hn=Array.from({length:8},(o,r)=>{let[s,l,a,i]=n.subarray(r*4,r*4+4);return`rgba(${s}, ${l}, ${a}, ${((i??0)/255).toFixed(2)})`}),fn=e.tool}return hn}}var U=It({timeline:j,surface:Ee,performer:Tn,copies:mn?1:2,present(){xe.bindFramebuffer(xe.FRAMEBUFFER,null),xe.viewport(0,0,G.width,G.height),Ee.render()},drawTool(e){if(Mn++,e.x>X.width+1.5||e.y>X.height+1.5){cn.clear();return}cn.draw(e,Sn,Jo(e),performance.now()/1e3)},onChange:or}),Zo=e=>`<span class="chip" style="--paint: ${Le(ke({[e]:1}))}" title="${ze[e].name}"></span>`;dt.innerHTML=X.steps.map((e,t)=>`
    <li>
      <button type="button" data-step="${t}">
        <span class="number">${String(t+1).padStart(2,"0")}</span>
        <span class="what">
          <span class="title">${e.title}</span>
          <span class="tool">${ee[e.tool].label}</span>
        </span>
        <span class="paints" aria-hidden="true">${e.paints.map(Zo).join("")}</span>
      </button>
    </li>`).join("");pt.innerHTML=j.steps.map(({start:e,end:t})=>`<span class="stage" data-planned style="--share: ${(t-e).toFixed(2)}"></span>`).join("");xn.innerHTML=X.steps.map(e=>`<span class="note">${e.note}</span>`).join("");var dn=[...dt.querySelectorAll("button")],er=[...pt.querySelectorAll(".stage")],tr=[...xn.querySelectorAll(".note")],pn=-1,Me=Z(".rail");function nr(e){if(!e||Me.scrollHeight<=Me.clientHeight)return;let t=e.getBoundingClientRect(),n=Me.getBoundingClientRect();t.top<n.top+24?Me.scrollBy({top:t.top-n.top-24}):t.bottom>n.bottom-24&&Me.scrollBy({top:t.bottom-n.bottom+24})}function or(e){let t=X.steps[e.step];if(!t)return;e.step!==pn&&(pn=e.step,dn.forEach((o,r)=>{r===e.step?o.setAttribute("aria-current","step"):o.removeAttribute("aria-current"),o.toggleAttribute("data-done",r<e.step)}),tr.forEach((o,r)=>{o.toggleAttribute("data-current",r===e.step)}),nr(dn[e.step]));let n=e.seeking!==null?`Painting up to step ${e.step+1}\u2026`:e.finished?"Finished":`Step ${e.step+1} of ${X.steps.length} \xB7 ${ee[t.tool].label}`;We.textContent!==n&&(We.textContent=n),j.steps.forEach(({start:o,end:r},s)=>{let l=Math.min(1,Math.max(0,(e.time-o)/(r-o)));er[s]?.style.setProperty("--fill",l.toFixed(3))}),pt.dataset.time=e.time.toFixed(2),ft.toggleAttribute("data-playing",e.playing),ft.setAttribute("aria-label",e.playing?"Pause":"Play"),wn.disabled=e.step===0&&e.time-(j.steps[0]?.start??0)<1,gn.disabled=e.finished,vn.hidden=!e.finished}var rr=2;function En(){let{step:e,time:t}=U.state,n=j.steps[e]?.start??0;U.seekStep(t-n>rr?e:e-1)}function An(){let{step:e}=U.state;e+1<X.steps.length?U.seekStep(e+1):U.renderAt(j.duration)}function Rn(){U.state.playing?U.pause():U.play()}dt.addEventListener("click",e=>{let t=e.target.closest("button[data-step]");t&&U.seekStep(Number(t.dataset.step))});ft.addEventListener("click",Rn);wn.addEventListener("click",En);gn.addEventListener("click",An);ye.innerHTML=yn.map(e=>`<option value="${e}">${e}\xD7</option>`).join("");ye.value=String(yn.includes(Number(we.get("speed")))?Number(we.get("speed")):2);U.setSpeed(Number(ye.value));ye.addEventListener("change",()=>{U.setSpeed(Number(ye.value)),we.set("speed",ye.value),history.replaceState(null,"",`#${we}`)});window.addEventListener("keydown",e=>{e.target instanceof HTMLSelectElement||e.metaKey||e.ctrlKey||(e.key===" "&&!(e.target instanceof HTMLButtonElement)?(e.preventDefault(),Rn()):e.key==="ArrowLeft"?En():e.key==="ArrowRight"&&An())});function Ln(){let e={width:G.width,height:G.height};G.width=j.width,G.height=j.height,xe.viewport(0,0,G.width,G.height),Ee.render();let t=G.toDataURL("image/png");return G.width=e.width,G.height=e.height,U.redraw(),t}vn.addEventListener("click",()=>{let e=document.createElement("a");e.download="fox-at-the-edge-of-the-wood.png",e.href=Ln(),e.click()});new ResizeObserver(()=>{Pn(),U.redraw()}).observe(ct);Pn();var sr=Math.max(0,Math.min(X.steps.length-1,Number(we.get("step")??1)-1));U.seekStep(sr);matchMedia("(prefers-reduced-motion: reduce)").matches||U.play();Object.assign(window,{studio:{duration:j.duration,steps:j.steps,titles:X.steps.map(e=>e.title),renderAt:e=>U.renderAt(e),pause:()=>U.pause(),fullSizePng:Ln,get state(){return U.state}}});})();
