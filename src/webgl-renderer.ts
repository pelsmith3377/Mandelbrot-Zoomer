import { initShaderProgram } from "./webgl-utils";

// Vertex shader: Renders a full-screen quad
const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Fragment shader: GPU-accelerated smooth Mandelbrot Set rendering
const FRAGMENT_SHADER_SOURCE = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_center;
  uniform float u_zoom;
  uniform float u_hue_shift;

  // Cosine palette parameters: color = a + b * cos(6.28318 * (c * t + d))
  uniform vec3 u_palette_a;
  uniform vec3 u_palette_b;
  uniform vec3 u_palette_c;
  uniform vec3 u_palette_d;

  void main() {
    // Normalize coordinates: center is (0,0), scale by aspect ratio
    vec2 st = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);

    // Calculate complex coordinate standard mapping
    // Scale by zoom. Zoom level 1.0 has a radius of roughly 1.5
    vec2 c = u_center + st * (1.5 / u_zoom);

    // Mandelbrot Iteration Loop
    // 250 iterations provides deep, high-frequency structures without killing fill-rate
    const float max_iterations = 250.0;
    vec2 z = vec2(0.0, 0.0);
    float n = 0.0;
    bool escaped = false;

    for (float i = 0.0; i < max_iterations; i += 1.0) {
      if (dot(z, z) > 4.0) {
        n = i;
        escaped = true;
        break;
      }
      // z = z^2 + c
      z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    }

    if (!escaped) {
      // Inside set is solid velvet black
      gl_FragColor = vec4(0.01, 0.01, 0.01, 1.0);
    } else {
      // Mathematically correct smooth, continuous coloring formula (removes banding)
      float log_zn = log(dot(z, z)) / 2.0;
      float nu = log(log_zn / 0.69314718) / 0.69314718;
      float iter = n + 1.0 - nu;

      // Map iterations to cycle cleanly
      float t = iter / 60.0;

      // Color computation based on the active dynamic palette and the running overall hue shift
      float hue = mod(t + u_hue_shift, 1.0);
      vec3 cos_wave = cos(6.283185 * (u_palette_c * hue + u_palette_d));
      vec3 color = u_palette_a + u_palette_b * cos_wave;

      // Soft vignette based on screen edges for high-end digital frame look
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
      vignette = clamp(pow(16.0 * vignette, 0.15), 0.0, 1.0);
      
      gl_FragColor = vec4(color * vignette, 1.0);
    }
  }
`;

export interface RenderParams {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  zoom: number;
  hueShift: number;
  paletteA: [number, number, number];
  paletteB: [number, number, number];
  paletteC: [number, number, number];
  paletteD: [number, number, number];
}

export class MandelbrotRenderer {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private positionBuffer: WebGLBuffer | null = null;

  // Attribute and Uniform Locations
  private positionLoc = -1;
  private resolutionLoc: WebGLUniformLocation | null = null;
  private centerLoc: WebGLUniformLocation | null = null;
  private zoomLoc: WebGLUniformLocation | null = null;
  private hueShiftLoc: WebGLUniformLocation | null = null;
  private paletteALoc: WebGLUniformLocation | null = null;
  private paletteBLoc: WebGLUniformLocation | null = null;
  private paletteCLoc: WebGLUniformLocation | null = null;
  private paletteDLoc: WebGLUniformLocation | null = null;

  constructor(canvas: HTMLCanvasElement) {
    const gl =
      canvas.getContext("webgl", { antialias: false, powerPreference: "high-performance" }) ||
      canvas.getContext("experimental-webgl", { antialias: false, powerPreference: "high-performance" });

    if (!gl) {
      throw new Error("WebGL is not supported on this browser/device.");
    }

    this.gl = gl as WebGLRenderingContext;
    this.initialize();
  }

  private initialize() {
    const gl = this.gl!;

    // Compile and link shaders
    const program = initShaderProgram(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
    if (!program) {
      throw new Error("Failed to compile or link shader program.");
    }
    this.program = program;

    // Set up attribute coordinates for full-screen quad (two triangles covering the clip space)
    const vertices = new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1,
    ]);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Look up shader locations
    this.positionLoc = gl.getAttribLocation(program, "a_position");
    this.resolutionLoc = gl.getUniformLocation(program, "u_resolution");
    this.centerLoc = gl.getUniformLocation(program, "u_center");
    this.zoomLoc = gl.getUniformLocation(program, "u_zoom");
    this.hueShiftLoc = gl.getUniformLocation(program, "u_hue_shift");
    this.paletteALoc = gl.getUniformLocation(program, "u_palette_a");
    this.paletteBLoc = gl.getUniformLocation(program, "u_palette_b");
    this.paletteCLoc = gl.getUniformLocation(program, "u_palette_c");
    this.paletteDLoc = gl.getUniformLocation(program, "u_palette_d");
  }

  public render(params: RenderParams) {
    const gl = this.gl;
    const program = this.program;
    if (!gl || !program) return;

    // Viewport configuration and cleaning
    gl.viewport(0, 0, params.width, params.height);
    gl.clearColor(0.01, 0.01, 0.01, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    // Bind full-screen quad vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.positionLoc);
    gl.vertexAttribPointer(this.positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Feed uniform variables
    gl.uniform2f(this.resolutionLoc, params.width, params.height);
    gl.uniform2f(this.centerLoc, params.centerX, params.centerY);
    gl.uniform1f(this.zoomLoc, params.zoom);
    gl.uniform1f(this.hueShiftLoc, params.hueShift);

    gl.uniform3fv(this.paletteALoc, params.paletteA);
    gl.uniform3fv(this.paletteBLoc, params.paletteB);
    gl.uniform3fv(this.paletteCLoc, params.paletteC);
    gl.uniform3fv(this.paletteDLoc, params.paletteD);

    // Draw full-screen quad (6 vertices forming two triangles)
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  public destroy() {
    const gl = this.gl;
    if (gl) {
      if (this.positionBuffer) {
        gl.deleteBuffer(this.positionBuffer);
      }
      if (this.program) {
        gl.deleteProgram(this.program);
      }
    }
    this.gl = null;
    this.program = null;
    this.positionBuffer = null;
  }
}
