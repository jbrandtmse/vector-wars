import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..', '..');

describe('Project Directory Structure', () => {
  const requiredDirs = [
    'src/core',
    'src/config',
    'src/state/states',
    'src/state/phases',
    'src/entities/player',
    'src/entities/enemies',
    'src/entities/bosses',
    'src/entities/projectiles',
    'src/entities/effects',
    'src/ai/states',
    'src/systems',
    'src/rendering/shaders',
    'src/audio',
    'src/narrative',
    'src/ui/hud',
    'src/ui/screens/styles',
    'src/debug',
    'src/types',
    'assets/levels',
    'assets/bosses',
    'assets/dialogue',
    'public/audio/sfx',
    'public/audio/voice',
    'public/audio/ambient',
    'public/audio/music',
    'public/fonts',
  ];

  for (const dir of requiredDirs) {
    it(`should have directory: ${dir}`, () => {
      expect(existsSync(resolve(ROOT, dir))).toBe(true);
    });
  }
});

describe('Placeholder Files', () => {
  const requiredFiles = [
    'src/core/EventBus.ts',
    'src/core/GameEvents.ts',
    'src/core/InputManager.ts',
    'src/core/Logger.ts',
    'src/core/ErrorHandler.ts',
    'src/core/ObjectPool.ts',
    'src/config/constants.ts',
    'src/config/rendering.ts',
    'src/config/input.ts',
    'src/types/game.ts',
    'src/types/three-extensions.d.ts',
    'src/global.d.ts',
  ];

  for (const file of requiredFiles) {
    it(`should have file: ${file}`, () => {
      expect(existsSync(resolve(ROOT, file))).toBe(true);
    });
  }
});

describe('Core Application Files', () => {
  const coreFiles = [
    'index.html',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'src/main.ts',
  ];

  for (const file of coreFiles) {
    it(`should have file: ${file}`, () => {
      expect(existsSync(resolve(ROOT, file))).toBe(true);
    });
  }
});
