// Rendering configuration — bloom, tone mapping, and post-processing settings
export const RENDERING_CONFIG = {
  toneMapping: 'ACESFilmic',
  toneMappingExposure: 1.0,
  bloom: {
    strength: 0.6,
    radius: 1.5,
    threshold: 0.1,
  },
  crt: {
    enabled: true,
    scanlineIntensity: 0.35,
    scanlineCount: 800,
    chromaticAberration: 0.003,
    vignetteIntensity: 0.4,
  },
  fxaa: true,
} as const;
