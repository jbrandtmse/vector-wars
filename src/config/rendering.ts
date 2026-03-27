// Rendering configuration — bloom, tone mapping, and post-processing settings
export const RENDERING_CONFIG = {
  toneMapping: 'ACESFilmic',
  toneMappingExposure: 1.0,
  bloom: {
    strength: 1.2,
    radius: 1.5,
    threshold: 0.1,
  },
  crt: {
    enabled: true,
    scanlineIntensity: 0.7,
    scanlineCount: 180,
    chromaticAberration: 0.004,
    vignetteIntensity: 0.5,
  },
  fxaa: true,
} as const;
