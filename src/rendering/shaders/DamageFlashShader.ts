/**
 * DamageFlashShader — Full-screen damage flash overlay.
 *
 * Blends a damage color onto the rendered scene based on damageIntensity uniform.
 * 0.0 = no flash (passthrough), 1.0 = full color overlay.
 * Inserted in RenderPipeline AFTER CRT pass, BEFORE OutputPass.
 *
 * Created by: Story 2-7
 */

import { DAMAGE_FLASH_COLOR } from '../../config/constants.ts';

export const DamageFlashShader = {
  name: 'DamageFlashShader',
  uniforms: {
    tDiffuse: { value: null },
    damageIntensity: { value: 0.0 },
    damageColor: { value: { x: DAMAGE_FLASH_COLOR.r, y: DAMAGE_FLASH_COLOR.g, z: DAMAGE_FLASH_COLOR.b } },
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
    uniform float damageIntensity;
    uniform vec3 damageColor;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 result = mix(texel.rgb, damageColor, damageIntensity);
      gl_FragColor = vec4(result, texel.a);
    }
  `,
};
