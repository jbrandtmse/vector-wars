/**
 * PhaseTransitionShader — Full-screen fade-to-black overlay for phase transitions.
 *
 * Mixes the scene render with black based on transitionProgress uniform.
 * 0.0 = no overlay (passthrough), 1.0 = fully black.
 * Inserted in RenderPipeline AFTER DamageFlash pass, BEFORE OutputPass.
 *
 * Created by: Story 3-10
 */

export const PhaseTransitionShader = {
  name: 'PhaseTransitionShader',
  uniforms: {
    tDiffuse: { value: null },
    transitionProgress: { value: 0.0 },
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
    uniform float transitionProgress;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 result = mix(texel.rgb, vec3(0.0), transitionProgress);
      gl_FragColor = vec4(result, texel.a);
    }
  `,
};
