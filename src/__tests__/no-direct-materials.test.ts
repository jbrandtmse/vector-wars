import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC_ROOT = resolve(__dirname, '..');

/**
 * Static analysis test: ensures no direct LineBasicMaterial or LineMaterial
 * construction outside of VectorMaterials.ts and test files.
 *
 * This enforces AC #2: "All line materials in the scene are created exclusively
 * through VectorMaterials.create()"
 */

function getAllTsFiles(dir: string, files: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = resolve(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      getAllTsFiles(fullPath, files);
    } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('No direct material construction (AC #2)', () => {
  const allFiles = getAllTsFiles(SRC_ROOT);
  const allowedFiles = [
    'VectorMaterials.ts',  // The singleton itself uses new LineBasicMaterial/LineMaterial
  ];

  // Filter to non-allowed, non-test files
  const filesToCheck = allFiles.filter((f) => {
    const rel = relative(SRC_ROOT, f);
    const isAllowed = allowedFiles.some((allowed) => f.endsWith(allowed));
    const isTestFile = rel.startsWith('__tests__');
    return !isAllowed && !isTestFile;
  });

  for (const filePath of filesToCheck) {
    const rel = relative(SRC_ROOT, filePath);

    it(`${rel} should not contain "new LineBasicMaterial"`, () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toMatch(/new\s+(THREE\.)?LineBasicMaterial\s*\(/);
    });

    it(`${rel} should not contain "new LineMaterial"`, () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toMatch(/new\s+LineMaterial\s*\(/);
    });
  }
});
