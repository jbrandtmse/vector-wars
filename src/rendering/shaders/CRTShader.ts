/**
 * CRTShader — Custom CRT scanline/chromatic aberration/vignette shader.
 *
 * Produces a subtle retro CRT monitor effect:
 * - Scanline darkening (horizontal bands simulating cathode ray tube)
 * - Chromatic aberration (RGB channel separation at screen edges)
 * - Vignette (corner darkening)
 *
 * Designed for use with Three.js ShaderPass. The `tDiffuse` uniform
 * receives the previous pass output automatically.
 *
 * NO curvature, NO animation, NO color grading — static and color-neutral.
 */
export const CRTShader = {
  uniforms: {
    tDiffuse: { value: null },
    scanlineIntensity: { value: 0.15 },
    scanlineCount: { value: 800.0 },
    chromaticAberration: { value: 0.002 },
    vignetteIntensity: { value: 0.25 },
    enabled: { value: 1.0 },
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float scanlineIntensity;
    uniform float scanlineCount;
    uniform float chromaticAberration;
    uniform float vignetteIntensity;
    uniform float enabled;

    varying vec2 vUv;

    void main() {
      // Passthrough when disabled — zero visual effect
      if (enabled < 0.5) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }

      // --- Chromatic Aberration ---
      // Offset direction is radial from screen center, strength scales with distance
      vec2 center = vec2(0.5, 0.5);
      vec2 dir = vUv - center;
      float dist = length(dir);
      vec2 offset = dir * chromaticAberration;

      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;

      vec3 color = vec3(r, g, b);

      // --- Scanlines ---
      // Subtle horizontal banding: 1.0 - intensity * (0.5 - 0.5 * sin(...))
      float scanline = 1.0 - scanlineIntensity * (0.5 - 0.5 * sin(vUv.y * scanlineCount * 3.14159));
      color *= scanline;

      // --- Vignette ---
      // Smooth darkening at screen edges
      float vignette = smoothstep(1.0, 0.3, dist * 2.0 * vignetteIntensity);
      color *= vignette;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};
