import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..', '..');

describe('Electron Main Process', () => {
  const mainPath = resolve(ROOT, 'electron/main.ts');

  it('electron/main.ts should exist', () => {
    expect(existsSync(mainPath)).toBe(true);
  });

  it('should define a createWindow function', () => {
    const content = readFileSync(mainPath, 'utf-8');

    expect(content).toContain('createWindow');
    expect(content).toMatch(/function createWindow/);
  });

  it('should create BrowserWindow with correct configuration', () => {
    const content = readFileSync(mainPath, 'utf-8');

    expect(content).toContain('BrowserWindow');
    expect(content).toContain('1280');
    expect(content).toContain('800');
    expect(content).toContain("backgroundColor: '#000000'");
  });

  it('should disable nodeIntegration and enable contextIsolation', () => {
    const content = readFileSync(mainPath, 'utf-8');

    expect(content).toContain('nodeIntegration: false');
    expect(content).toContain('contextIsolation: true');
  });

  it('should load dist/index.html', () => {
    const content = readFileSync(mainPath, 'utf-8');

    expect(content).toContain('dist/index.html');
    expect(content).toContain('loadFile');
  });

  it('should remove default menu bar', () => {
    const content = readFileSync(mainPath, 'utf-8');

    expect(content).toContain('Menu.setApplicationMenu(null)');
  });

  it('should quit when all windows are closed', () => {
    const content = readFileSync(mainPath, 'utf-8');

    expect(content).toContain("'window-all-closed'");
    expect(content).toContain('app.quit()');
  });

  it('should handle macOS activate event', () => {
    const content = readFileSync(mainPath, 'utf-8');

    expect(content).toContain("'activate'");
    expect(content).toContain('getAllWindows');
  });

  it('should use preload script', () => {
    const content = readFileSync(mainPath, 'utf-8');

    expect(content).toContain('preload');
    expect(content).toContain('preload.js');
  });
});

describe('Electron Preload Script', () => {
  const preloadPath = resolve(ROOT, 'electron/preload.ts');

  it('electron/preload.ts should exist', () => {
    expect(existsSync(preloadPath)).toBe(true);
  });

  it('should use contextBridge', () => {
    const content = readFileSync(preloadPath, 'utf-8');

    expect(content).toContain('contextBridge');
    expect(content).toContain('exposeInMainWorld');
  });

  it('should expose electronAPI with isElectron flag', () => {
    const content = readFileSync(preloadPath, 'utf-8');

    expect(content).toContain('electronAPI');
    expect(content).toContain('isElectron: true');
  });

  it('should NOT expose Node.js APIs', () => {
    const content = readFileSync(preloadPath, 'utf-8');

    // Should not expose dangerous Node.js APIs
    expect(content).not.toContain('require');
    expect(content).not.toContain('process.env');
    expect(content).not.toContain('child_process');
    expect(content).not.toContain('fs');
  });
});

describe('Electron TypeScript Configuration', () => {
  const tsconfigPath = resolve(ROOT, 'tsconfig.electron.json');

  it('tsconfig.electron.json should exist', () => {
    expect(existsSync(tsconfigPath)).toBe(true);
  });

  it('should be valid JSON', () => {
    const content = readFileSync(tsconfigPath, 'utf-8');
    const parsed = JSON.parse(content);

    expect(parsed).toBeDefined();
    expect(parsed.compilerOptions).toBeDefined();
  });

  it('should target CommonJS for Node.js compatibility', () => {
    const content = readFileSync(tsconfigPath, 'utf-8');
    const parsed = JSON.parse(content);

    expect(parsed.compilerOptions.module).toBe('CommonJS');
  });

  it('should output to electron-dist directory', () => {
    const content = readFileSync(tsconfigPath, 'utf-8');
    const parsed = JSON.parse(content);

    expect(parsed.compilerOptions.outDir).toBe('electron-dist');
  });

  it('should include only electron directory', () => {
    const content = readFileSync(tsconfigPath, 'utf-8');
    const parsed = JSON.parse(content);

    expect(parsed.include).toContain('electron/**/*.ts');
  });
});

describe('Package.json Electron Configuration', () => {
  const packagePath = resolve(ROOT, 'package.json');

  it('should have electron:dev script', () => {
    const content = readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(content);

    expect(pkg.scripts['electron:dev']).toBeDefined();
    expect(pkg.scripts['electron:dev']).toContain('electron');
  });

  it('should have electron:build script', () => {
    const content = readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(content);

    expect(pkg.scripts['electron:build']).toBeDefined();
    expect(pkg.scripts['electron:build']).toContain('electron-builder');
  });

  it('should have electron-builder config with appId', () => {
    const content = readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(content);

    expect(pkg.build).toBeDefined();
    expect(pkg.build.appId).toBe('com.vectorwars.app');
  });

  it('should have electron-builder config with productName', () => {
    const content = readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(content);

    expect(pkg.build.productName).toBe('Vector Wars');
  });

  it('should configure Windows portable target', () => {
    const content = readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(content);

    expect(pkg.build.win).toBeDefined();
    expect(pkg.build.win.target).toBe('portable');
  });

  it('should configure Mac dmg target', () => {
    const content = readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(content);

    expect(pkg.build.mac).toBeDefined();
    expect(pkg.build.mac.target).toBe('dmg');
  });

  it('should set main entry to electron-dist/main.js', () => {
    const content = readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(content);

    expect(pkg.main).toBe('electron-dist/main.js');
  });

  it('should include electron-dist and dist in build files', () => {
    const content = readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(content);

    expect(pkg.build.files).toContain('electron-dist/**/*');
    expect(pkg.build.files).toContain('dist/**/*');
  });

  it('should preserve existing scripts unchanged', () => {
    const content = readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(content);

    expect(pkg.scripts.dev).toBe('vite');
    expect(pkg.scripts.build).toBe('tsc && vite build');
    expect(pkg.scripts.test).toBe('vitest run');
    expect(pkg.scripts.preview).toBe('vite preview');
    expect(pkg.scripts['test:watch']).toBe('vitest');
  });
});

describe('Electron Build GitHub Actions Workflow', () => {
  const workflowPath = resolve(ROOT, '.github/workflows/electron-build.yml');

  it('.github/workflows/electron-build.yml should exist', () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  it('should be valid YAML with expected structure', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('name:');
    expect(content).toContain('on:');
    expect(content).toContain('jobs:');
  });

  it('should trigger on workflow_dispatch only', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('workflow_dispatch');
    // Should NOT trigger on push (that is the deploy.yml workflow)
    expect(content).not.toContain('push:');
  });

  it('should use matrix strategy for windows and macos', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('matrix:');
    expect(content).toContain('windows-latest');
    expect(content).toContain('macos-latest');
  });

  it('should build web app before electron', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('npm run build');
  });

  it('should compile Electron TypeScript', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('tsc -p tsconfig.electron.json');
  });

  it('should run electron-builder with --publish never', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('electron-builder --publish never');
  });

  it('should upload artifacts', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('actions/upload-artifact@v4');
    expect(content).toContain('electron-out');
  });

  it('should use Node 20', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('node-version: "20"');
  });

  it('should use npm ci for clean dependency install', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('npm ci');
  });
});
