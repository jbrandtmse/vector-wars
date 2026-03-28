import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..', '..');

describe('GitHub Pages Deployment Workflow', () => {
  const workflowPath = resolve(ROOT, '.github/workflows/deploy.yml');

  it('.github/workflows/deploy.yml should exist', () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  it('should be valid YAML with expected structure', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    // Verify top-level keys exist
    expect(content).toContain('name:');
    expect(content).toContain('on:');
    expect(content).toContain('permissions:');
    expect(content).toContain('concurrency:');
    expect(content).toContain('jobs:');
  });

  it('should trigger on push to main branch', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('push:');
    expect(content).toContain('branches:');
    expect(content).toContain('"main"');
  });

  it('should trigger on workflow_dispatch (manual)', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('workflow_dispatch');
  });

  it('should include type-check step (tsc --noEmit)', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('tsc --noEmit');
  });

  it('should include test step (vitest run)', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('vitest run');
  });

  it('should include build step (npm run build)', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('npm run build');
  });

  it('should use actions/deploy-pages for deployment', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('actions/deploy-pages');
  });

  it('should use actions/upload-pages-artifact for artifact upload', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('actions/upload-pages-artifact');
  });

  it('should use actions/configure-pages for pages setup', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('actions/configure-pages');
  });

  it('should set required permissions for GitHub Pages', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('contents: read');
    expect(content).toContain('pages: write');
    expect(content).toContain('id-token: write');
  });

  it('should configure concurrency to prevent parallel deployments', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('group: "pages"');
    expect(content).toContain('cancel-in-progress: true');
  });

  it('should upload dist directory as artifact', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('path: "./dist"');
  });

  it('should use Node 20', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('node-version: "20"');
  });

  it('should use npm ci for clean dependency install', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('npm ci');
  });

  it('should have separate build and deploy jobs', () => {
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('build:');
    expect(content).toContain('deploy:');
    expect(content).toContain('needs: build');
  });
});

describe('Vite Config - GitHub Pages Compatibility', () => {
  const viteConfigPath = resolve(ROOT, 'vite.config.ts');

  it('vite.config.ts should exist', () => {
    expect(existsSync(viteConfigPath)).toBe(true);
  });

  it('should set base to "./" for relative path deployment', () => {
    const content = readFileSync(viteConfigPath, 'utf-8');

    expect(content).toContain("base: './'");
  });

  it('should output to dist directory', () => {
    const content = readFileSync(viteConfigPath, 'utf-8');

    expect(content).toContain("outDir: 'dist'");
  });
});

describe('Build Output Completeness', () => {
  it('public/assets/dialogue should contain JSON data files', () => {
    const dialogueDir = resolve(ROOT, 'public/assets/dialogue');
    expect(existsSync(dialogueDir)).toBe(true);
    expect(existsSync(resolve(dialogueDir, 'handler.json'))).toBe(true);
    expect(existsSync(resolve(dialogueDir, 'bosses.json'))).toBe(true);
    expect(existsSync(resolve(dialogueDir, 'tutorial.json'))).toBe(true);
  });

  it('public/assets/briefings should contain JSON data files', () => {
    const briefingsDir = resolve(ROOT, 'public/assets/briefings');
    expect(existsSync(briefingsDir)).toBe(true);
    expect(existsSync(resolve(briefingsDir, 'level-1.json'))).toBe(true);
    expect(existsSync(resolve(briefingsDir, 'level-2.json'))).toBe(true);
    expect(existsSync(resolve(briefingsDir, 'level-3.json'))).toBe(true);
  });

  it('public/audio/manifest.json should exist', () => {
    expect(existsSync(resolve(ROOT, 'public/audio/manifest.json'))).toBe(true);
  });
});
