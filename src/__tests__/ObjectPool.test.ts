import { describe, it, expect, vi } from 'vitest';
import { ObjectPool, type Poolable } from '../core/ObjectPool.ts';

/** Test helper: a simple Poolable implementation */
class TestItem implements Poolable {
  public resetCallCount = 0;

  reset(): void {
    this.resetCallCount++;
  }
}

describe('ObjectPool exports', () => {
  it('should export ObjectPool class', () => {
    expect(ObjectPool).toBeDefined();
    expect(typeof ObjectPool).toBe('function');
  });

  it('should export Poolable interface (type-level check via usage)', () => {
    // If Poolable was not exported, this file would fail to compile
    const item: Poolable = { reset: () => {} };
    expect(item).toBeDefined();
  });
});

describe('ObjectPool constructor and prewarm', () => {
  it('should create pool with factory and prewarm specified count', () => {
    const factory = vi.fn(() => new TestItem());
    const pool = new ObjectPool<TestItem>(factory, 5);
    expect(factory).toHaveBeenCalledTimes(5);
    expect(pool.totalCount).toBe(5);
  });

  it('should create empty pool when initialSize is 0', () => {
    const factory = vi.fn(() => new TestItem());
    const pool = new ObjectPool<TestItem>(factory, 0);
    expect(factory).not.toHaveBeenCalled();
    expect(pool.totalCount).toBe(0);
  });

  it('should create empty pool when initialSize is omitted', () => {
    const factory = vi.fn(() => new TestItem());
    const pool = new ObjectPool<TestItem>(factory);
    expect(factory).not.toHaveBeenCalled();
    expect(pool.totalCount).toBe(0);
  });

  it('should prewarm additional items via prewarm()', () => {
    const factory = vi.fn(() => new TestItem());
    const pool = new ObjectPool<TestItem>(factory, 3);
    pool.prewarm(2);
    expect(factory).toHaveBeenCalledTimes(5);
    expect(pool.totalCount).toBe(5);
  });
});

describe('ObjectPool acquire', () => {
  it('should return an object from the pool', () => {
    const pool = new ObjectPool<TestItem>(() => new TestItem(), 3);
    const item = pool.acquire();
    expect(item).toBeDefined();
    expect(item).toBeInstanceOf(TestItem);
  });

  it('should return different objects on consecutive acquires', () => {
    const pool = new ObjectPool<TestItem>(() => new TestItem(), 3);
    const a = pool.acquire();
    const b = pool.acquire();
    expect(a).not.toBe(b);
  });

  it('should auto-expand when pool is exhausted', () => {
    const pool = new ObjectPool<TestItem>(() => new TestItem(), 1);
    const a = pool.acquire();
    const b = pool.acquire(); // triggers expansion
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(pool.totalCount).toBe(2);
  });
});

describe('ObjectPool release', () => {
  it('should call reset() on released object', () => {
    const pool = new ObjectPool<TestItem>(() => new TestItem(), 1);
    const item = pool.acquire()!;
    pool.release(item);
    expect(item.resetCallCount).toBe(1);
  });

  it('should make released object available for re-acquire (reuse)', () => {
    const pool = new ObjectPool<TestItem>(() => new TestItem(), 1);
    const item = pool.acquire()!;
    pool.release(item);
    const reacquired = pool.acquire();
    expect(reacquired).toBe(item);
  });

  it('should guard against double-release (no duplicate in available stack)', () => {
    const pool = new ObjectPool<TestItem>(() => new TestItem(), 2);
    const item = pool.acquire()!;
    pool.release(item);
    pool.release(item); // double-release
    // Should still have only 2 available (not 3)
    expect(pool.availableCount).toBe(2);
    expect(pool.activeCount).toBe(0);
    // reset should only have been called once (second release is no-op)
    expect(item.resetCallCount).toBe(1);
  });
});

describe('ObjectPool counts', () => {
  it('should track activeCount correctly', () => {
    const pool = new ObjectPool<TestItem>(() => new TestItem(), 3);
    expect(pool.activeCount).toBe(0);
    pool.acquire();
    expect(pool.activeCount).toBe(1);
    pool.acquire();
    expect(pool.activeCount).toBe(2);
  });

  it('should track availableCount correctly', () => {
    const pool = new ObjectPool<TestItem>(() => new TestItem(), 3);
    expect(pool.availableCount).toBe(3);
    pool.acquire();
    expect(pool.availableCount).toBe(2);
  });

  it('should update counts after release', () => {
    const pool = new ObjectPool<TestItem>(() => new TestItem(), 3);
    const item = pool.acquire()!;
    expect(pool.activeCount).toBe(1);
    expect(pool.availableCount).toBe(2);
    pool.release(item);
    expect(pool.activeCount).toBe(0);
    expect(pool.availableCount).toBe(3);
  });

  it('should have totalCount equal prewarm size plus expansions', () => {
    const pool = new ObjectPool<TestItem>(() => new TestItem(), 3);
    expect(pool.totalCount).toBe(3);
    pool.acquire();
    pool.acquire();
    pool.acquire();
    pool.acquire(); // expand
    expect(pool.totalCount).toBe(4);
  });
});

describe('ObjectPool forEach', () => {
  it('should iterate all items in the pool', () => {
    const pool = new ObjectPool<TestItem>(() => new TestItem(), 5);
    let count = 0;
    pool.forEach(() => count++);
    expect(count).toBe(5);
  });

  it('should iterate both acquired and available items', () => {
    const pool = new ObjectPool<TestItem>(() => new TestItem(), 3);
    pool.acquire();
    pool.acquire();
    let count = 0;
    pool.forEach(() => count++);
    expect(count).toBe(3);
  });
});
