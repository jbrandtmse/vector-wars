/**
 * RenderPipeline — Two-composer selective bloom rendering pipeline.
 *
 * Implements the selective bloom pattern:
 * 1. Bloom composer renders ONLY objects on BLOOM_LAYER with UnrealBloomPass
 * 2. Final composer renders the full scene and additively blends the bloom texture
 *
 * Pipeline order in final composer:
 *   RenderPass (full scene) -> ShaderPass (bloom mix) -> ShaderPass (CRT) -> OutputPass -> FXAA
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { BLOOM_LAYER } from '../config/constants.ts';
import { RENDERING_CONFIG } from '../config/rendering.ts';
import { CRTShader } from './shaders/CRTShader.ts';

/**
 * Additive bloom mix shader.
 * Blends the bloom texture onto the base scene render.
 */
function createBloomMixShader(bloomTexture: THREE.Texture) {
  return {
    uniforms: {
      baseTexture: { value: null as THREE.Texture | null },
      bloomTexture: { value: bloomTexture },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D baseTexture;
      uniform sampler2D bloomTexture;
      varying vec2 vUv;
      void main() {
        gl_FragColor = texture2D(baseTexture, vUv) + texture2D(bloomTexture, vUv);
      }
    `,
  };
}

export class RenderPipeline {
  private bloomComposer: EffectComposer;
  private finalComposer: EffectComposer;
  private fxaaPass: ShaderPass;
  private crtPass: ShaderPass;
  private camera: THREE.Camera;
  private cameraLayersCache: THREE.Layers;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
  ) {
    this.camera = camera;
    this.cameraLayersCache = new THREE.Layers();

    const width = renderer.domElement.clientWidth;
    const height = renderer.domElement.clientHeight;
    const resolution = new THREE.Vector2(width, height);

    // --- Bloom Composer (renders to texture, not screen) ---
    this.bloomComposer = new EffectComposer(renderer);
    this.bloomComposer.renderToScreen = false;

    const bloomRenderPass = new RenderPass(scene, camera);
    this.bloomComposer.addPass(bloomRenderPass);

    const bloomPass = new UnrealBloomPass(
      resolution,
      RENDERING_CONFIG.bloom.strength,
      RENDERING_CONFIG.bloom.radius,
      RENDERING_CONFIG.bloom.threshold,
    );
    this.bloomComposer.addPass(bloomPass);

    // --- Final Composer (renders to screen) ---
    this.finalComposer = new EffectComposer(renderer);

    // 1. Full scene render pass
    const finalRenderPass = new RenderPass(scene, camera);
    this.finalComposer.addPass(finalRenderPass);

    // 2. Bloom mix shader pass (additive blend of bloom)
    const bloomMixShader = createBloomMixShader(
      this.bloomComposer.renderTarget2.texture,
    );
    const bloomMixPass = new ShaderPass(bloomMixShader, 'baseTexture');
    this.finalComposer.addPass(bloomMixPass);

    // 3. CRT shader pass (scanlines, chromatic aberration, vignette)
    this.crtPass = new ShaderPass(CRTShader);
    this.crtPass.material.uniforms['scanlineIntensity'].value =
      RENDERING_CONFIG.crt.scanlineIntensity;
    this.crtPass.material.uniforms['scanlineCount'].value =
      RENDERING_CONFIG.crt.scanlineCount;
    this.crtPass.material.uniforms['chromaticAberration'].value =
      RENDERING_CONFIG.crt.chromaticAberration;
    this.crtPass.material.uniforms['vignetteIntensity'].value =
      RENDERING_CONFIG.crt.vignetteIntensity;
    this.crtPass.material.uniforms['enabled'].value = RENDERING_CONFIG.crt
      .enabled
      ? 1.0
      : 0.0;
    if (!RENDERING_CONFIG.crt.enabled) {
      this.crtPass.enabled = false;
    }
    this.finalComposer.addPass(this.crtPass);

    // 4. OutputPass (tone mapping + color space conversion)
    const outputPass = new OutputPass();
    this.finalComposer.addPass(outputPass);

    // 5. FXAA (anti-aliasing AFTER OutputPass)
    this.fxaaPass = new ShaderPass(FXAAShader);
    this.fxaaPass.material.uniforms['resolution'].value.set(
      1 / width,
      1 / height,
    );
    this.finalComposer.addPass(this.fxaaPass);
  }

  /**
   * Renders one frame using the selective bloom pipeline.
   *
   * 1. Save camera layers state
   * 2. Set camera to BLOOM_LAYER only -> bloom composer renders bloom objects
   * 3. Restore camera layers
   * 4. Final composer renders full scene + bloom mix + output + FXAA
   */
  render(): void {
    // Save camera layers
    this.cameraLayersCache.mask = this.camera.layers.mask;

    // Bloom pass: camera sees ONLY bloom layer
    this.camera.layers.set(BLOOM_LAYER);
    this.bloomComposer.render();

    // Restore camera layers for full scene render
    this.camera.layers.mask = this.cameraLayersCache.mask;
    this.finalComposer.render();
  }

  /**
   * Toggles the CRT post-processing effect on or off.
   * When disabled, the CRT ShaderPass is skipped entirely (zero GPU cost).
   */
  setCRTEnabled(enabled: boolean): void {
    this.crtPass.enabled = enabled;
  }

  /**
   * Scales all CRT parameters proportionally from their configured defaults.
   * 0.0 = invisible (GPU-side early exit), 1.0 = full config values.
   * Useful for smooth fade-in/fade-out and per-level intensity variation.
   */
  setCRTIntensity(intensity: number): void {
    const crt = RENDERING_CONFIG.crt;
    this.crtPass.material.uniforms['scanlineIntensity'].value =
      crt.scanlineIntensity * intensity;
    this.crtPass.material.uniforms['chromaticAberration'].value =
      crt.chromaticAberration * intensity;
    this.crtPass.material.uniforms['vignetteIntensity'].value =
      crt.vignetteIntensity * intensity;
    this.crtPass.material.uniforms['enabled'].value = intensity > 0 ? 1.0 : 0.0;
  }

  /**
   * Updates both composers, FXAA uniforms, and CRT scanline count on window resize.
   */
  resize(width: number, height: number): void {
    this.bloomComposer.setSize(width, height);
    this.finalComposer.setSize(width, height);
    this.fxaaPass.material.uniforms['resolution'].value.set(
      1 / width,
      1 / height,
    );
    this.crtPass.material.uniforms['scanlineCount'].value = height;
  }
}
