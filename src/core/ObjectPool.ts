/**
 * ObjectPool<T> -- Generic object pool for zero-GC entity management.
 *
 * Pre-warms a fixed number of instances at construction.
 * acquire() returns an available instance or auto-expands if exhausted.
 * release() resets and returns the instance for reuse.
 *
 * Uses a free-list (stack) pattern internally so active/available tracking
 * does not conflict with existing entity `isActive`/`setActive` patterns.
 *
 * Created by: Story 1-1 (placeholder)
 * Implemented by: Story 2-9
 */

import { Logger } from './Logger.ts';

/**
 * Contract for objects managed by ObjectPool<T>.
 * Every pooled entity type must implement reset().
 */
export interface Poolable {
  /** Reset all state for reuse. Called by pool on release. */
  reset(): void;
}

export class ObjectPool<T extends Poolable> {
  private items: T[] = [];
  private available: T[] = []; // stack of released items ready for reuse
  private availableSet = new Set<T>(); // O(1) duplicate detection for release guard
  private factory: () => T;

  constructor(factory: () => T, initialSize: number = 0) {
    this.factory = factory;
    if (initialSize > 0) {
      this.prewarm(initialSize);
    }
  }

  prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      const obj = this.factory();
      this.items.push(obj);
      this.available.push(obj);
      this.availableSet.add(obj);
    }
  }

  acquire(): T | undefined {
    if (this.available.length > 0) {
      const obj = this.available.pop()!;
      this.availableSet.delete(obj);
      return obj;
    }
    // Pool exhausted -- expand by one (with warning)
    Logger.warn('Pool', 'Pool exhausted, expanding', { total: this.items.length });
    const obj = this.factory();
    this.items.push(obj);
    return obj;
  }

  release(obj: T): void {
    // O(1) guard against double-release (Story 6-4)
    if (this.availableSet.has(obj)) {
      return;
    }
    obj.reset();
    this.available.push(obj);
    this.availableSet.add(obj);
  }

  get activeCount(): number {
    return this.items.length - this.available.length;
  }

  get availableCount(): number {
    return this.available.length;
  }

  get totalCount(): number {
    return this.items.length;
  }

  forEach(callback: (obj: T) => void): void {
    for (const obj of this.items) {
      callback(obj);
    }
  }
}
