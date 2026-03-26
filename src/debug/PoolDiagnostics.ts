/**
 * PoolDiagnostics -- Collects and logs pool stats from all game systems.
 *
 * In debug mode, logs pool utilization and draw call counts once per second.
 * Accessible via window.debug.pools() for on-demand diagnostics.
 *
 * Created by: Story 2-9
 */

import { Logger } from '../core/Logger.ts';
import type { ObjectPool, Poolable } from '../core/ObjectPool.ts';
import type * as THREE from 'three';

export interface PoolStatsSource {
  getPoolStats(): { active: number; total: number };
}

export class PoolDiagnostics {
  private sources: Map<string, PoolStatsSource> = new Map();
  private genericPools: Map<string, ObjectPool<Poolable>> = new Map();
  private renderer: THREE.WebGLRenderer | null = null;
  private elapsed = 0;
  private logIntervalSeconds = 1.0;

  registerSource(name: string, source: PoolStatsSource): void {
    this.sources.set(name, source);
  }

  registerGenericPool(name: string, pool: ObjectPool<Poolable>): void {
    this.genericPools.set(name, pool);
  }

  setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
  }

  update(dt: number): void {
    this.elapsed += dt;
    if (this.elapsed >= this.logIntervalSeconds) {
      this.elapsed = 0;
      this.logStats();
    }
  }

  getStats(): Record<string, { active: number; total: number }> {
    const stats: Record<string, { active: number; total: number }> = {};
    for (const [name, source] of this.sources) {
      stats[name] = source.getPoolStats();
    }
    for (const [name, pool] of this.genericPools) {
      stats[name] = { active: pool.activeCount, total: pool.totalCount };
    }
    return stats;
  }

  getDrawCalls(): number {
    return this.renderer ? this.renderer.info.render.calls : -1;
  }

  private logStats(): void {
    const stats = this.getStats();
    const drawCalls = this.getDrawCalls();
    Logger.info('Pool', 'Pool diagnostics', { ...stats, drawCalls });
  }
}
