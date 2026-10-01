// The small amount of WebGL2 the paint engine needs, named for what it does:
// a context that can render to half-float textures, programs that report
// their compile errors in full, textures paired with the framebuffers that
// write them, and a single quad to draw every pass with.
//
// Nothing here knows about paint. surface.ts owns what the textures mean.

export type Gl = WebGL2RenderingContext;

/**
 * A WebGL2 context on `canvas`, or a readable reason there is none. The engine
 * keeps paint in half-float textures and renders into them, which WebGL2 only
 * allows with EXT_color_buffer_float.
 */
export function createContext(canvas: HTMLCanvasElement | OffscreenCanvas): Gl {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    // The recorder and the tests read the picture back after it is shown.
    preserveDrawingBuffer: true,
  }) as Gl | null;
  if (!gl) throw new Error('This browser has no WebGL2, which the paint simulation needs.');
  if (!gl.getExtension('EXT_color_buffer_float')) {
    throw new Error('This GPU cannot render to float textures, which the paint simulation needs.');
  }
  return gl;
}

/** A texture and the framebuffer that renders into it. */
export type Target = {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
};

export type TargetFormat = 'rgba16f' | 'rgba8';

const FORMATS: Record<TargetFormat, number> = {
  rgba16f: WebGL2RenderingContext.RGBA16F,
  rgba8: WebGL2RenderingContext.RGBA8,
};

export function createTarget(
  gl: Gl,
  width: number,
  height: number,
  format: TargetFormat = 'rgba16f',
): Target {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texStorage2D(gl.TEXTURE_2D, 1, FORMATS[format], width, height);
  // Linear, so a rotated tool can sample the canvas between texels and the
  // display can be drawn at any size. Edges clamp: paint does not wrap.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(
      `A ${width}×${height} ${format} render target is incomplete (0x${status.toString(16)}).`,
    );
  }
  return {texture, framebuffer, width, height};
}

export function deleteTarget(gl: Gl, target: Target) {
  gl.deleteFramebuffer(target.framebuffer);
  gl.deleteTexture(target.texture);
}

/**
 * One framebuffer writing several targets at once, for the passes that update
 * more than one property of the paint in a single draw.
 */
export function createMultiTarget(gl: Gl, targets: Target[]): WebGLFramebuffer {
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  targets.forEach((target, i) => {
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0 + i,
      gl.TEXTURE_2D,
      target.texture,
      0,
    );
  });
  gl.drawBuffers(targets.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(
      `A ${targets.length}-target framebuffer is incomplete (0x${status.toString(16)}).`,
    );
  }
  return framebuffer;
}

/**
 * Copy one rectangle of `from` into `to`. Both must share a size and format.
 * The paint passes write a dab's rectangle into a scratch texture and copy it
 * back, rather than redraw the whole canvas for every touch of a brush.
 */
export function copyRect(
  gl: Gl,
  from: Target,
  to: Target,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, from.framebuffer);
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, to.framebuffer);
  gl.blitFramebuffer(
    x,
    y,
    x + width,
    y + height,
    x,
    y,
    x + width,
    y + height,
    gl.COLOR_BUFFER_BIT,
    gl.NEAREST,
  );
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
}

export type UniformValue = number | readonly number[] | Float32Array | Int32Array;

/** A linked program, with its uniforms set by name. */
export type Program = {
  use(): void;
  /** Set a float, vec2/3/4 or float array uniform. Unknown names are ignored. */
  set(name: string, value: UniformValue): void;
  /** Set an int or ivec uniform, including the texture unit of a sampler. */
  setInt(name: string, value: number | readonly number[]): void;
  /** Bind `texture` to `unit` and point the sampler `name` at it. */
  texture(name: string, unit: number, texture: WebGLTexture): void;
  readonly handle: WebGLProgram;
};

/** The vertex stage every pass shares: one quad, and its corner in 0..1. */
export const QUAD_VERTEX = `#version 300 es
in vec2 aCorner;
out vec2 vUv;
void main() {
  vUv = aCorner * 0.5 + 0.5;
  gl_Position = vec4(aCorner, 0.0, 1.0);
}
`;

export function createProgram(gl: Gl, fragmentSource: string, vertexSource = QUAD_VERTEX): Program {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('could not create a shader');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) ?? '';
      gl.deleteShader(shader);
      throw new Error(
        `${type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment'} shader:\n${log}\n${numbered(source)}`,
      );
    }
    return shader;
  };

  const handle = gl.createProgram();
  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(handle, vertex);
  gl.attachShader(handle, fragment);
  gl.bindAttribLocation(handle, 0, 'aCorner');
  gl.linkProgram(handle);
  if (!gl.getProgramParameter(handle, gl.LINK_STATUS)) {
    throw new Error(`Program link:\n${gl.getProgramInfoLog(handle) ?? ''}`);
  }
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  const locations = new Map<string, WebGLUniformLocation | null>();
  const location = (name: string) => {
    if (!locations.has(name)) locations.set(name, gl.getUniformLocation(handle, name));
    return locations.get(name) ?? null;
  };

  return {
    handle,
    use: () => gl.useProgram(handle),
    set(name, value) {
      const at = location(name);
      if (!at) return;
      if (typeof value === 'number') {
        gl.uniform1f(at, value);
        return;
      }
      const values = value instanceof Float32Array ? value : new Float32Array(value);
      if (values.length === 2) gl.uniform2fv(at, values);
      else if (values.length === 3) gl.uniform3fv(at, values);
      else if (values.length === 4) gl.uniform4fv(at, values);
      else gl.uniform1fv(at, values);
    },
    setInt(name, value) {
      const at = location(name);
      if (!at) return;
      if (typeof value === 'number') gl.uniform1i(at, value);
      else if (value.length === 2) gl.uniform2iv(at, value);
      else gl.uniform1iv(at, value);
    },
    texture(name, unit, texture) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      const at = location(name);
      if (at) gl.uniform1i(at, unit);
    },
  };
}

/** Prefix each line with its number, so a compile error's line can be found. */
const numbered = (source: string) =>
  source
    .split('\n')
    .map((line, i) => `${String(i + 1).padStart(4)}  ${line}`)
    .join('\n');

/** The quad every pass is drawn with: two triangles covering clip space. */
export function createQuad(gl: Gl): () => void {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return () => {
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
}
