/**
 * PerformanceMonitor — Tracks renderer performance metrics (draw calls, triangles, memory).
 *
 * In dev builds, periodically logs metrics via Logger.debug and warns when
 * draw calls exceed the 500-call budget.
 *
 * Created by: Story 6-4
 */

import type * as THREE from 'three';
import { Logger } from './Logger.ts';

export class PerformanceMonitor {
  private renderer: THREE.WebGLRenderer;
  private logInterval: number;
  private elapsed = 0;

  constructor(renderer: THREE.WebGLRenderer, logInterval = 5.0) {
    this.renderer = renderer;
    this.logInterval = logInterval;
  }

  getDrawCalls(): number {
    return this.renderer.info.render.calls;
  }

  getTriangles(): number {
    return this.renderer.info.render.triangles;
  }

  getMemoryMB(): number {
    const mem = this.renderer.info.memory;
    return mem.geometries + mem.textures;
  }

  update(dt: number): void {
    this.elapsed += dt;
    if (this.elapsed >= this.logInterval) {
      this.elapsed -= this.logInterval;
      const calls = this.getDrawCalls();
      Logger.debug('Perf', 'Frame metrics', {
        drawCalls: calls,
        triangles: this.getTriangles(),
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures,
      });
      if (calls > 500) {
        Logger.warn('Perf', 'Draw calls exceed budget', { calls });
      }
    }
  }
}
