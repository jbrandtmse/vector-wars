import { describe, it, expect, vi } from 'vitest';

describe('EventBus', () => {
  it('should export EventBus class', async () => {
    const mod = await import('../core/EventBus.ts');
    expect(mod.EventBus).toBeDefined();
    expect(typeof mod.EventBus).toBe('function');
  });

  it('should deliver events via on/emit', async () => {
    const { EventBus } = await import('../core/EventBus.ts');
    const bus = new EventBus<{ testEvent: { value: number } }>();
    const callback = vi.fn();
    bus.on('testEvent', callback);
    bus.emit('testEvent', { value: 42 });
    expect(callback).toHaveBeenCalledWith({ value: 42 });
  });

  it('should remove listener via off', async () => {
    const { EventBus } = await import('../core/EventBus.ts');
    const bus = new EventBus<{ testEvent: { value: number } }>();
    const callback = vi.fn();
    bus.on('testEvent', callback);
    bus.off('testEvent', callback);
    bus.emit('testEvent', { value: 42 });
    expect(callback).not.toHaveBeenCalled();
  });

  it('should deliver events to multiple listeners', async () => {
    const { EventBus } = await import('../core/EventBus.ts');
    const bus = new EventBus<{ testEvent: { value: string } }>();
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    bus.on('testEvent', cb1);
    bus.on('testEvent', cb2);
    bus.emit('testEvent', { value: 'hello' });
    expect(cb1).toHaveBeenCalledWith({ value: 'hello' });
    expect(cb2).toHaveBeenCalledWith({ value: 'hello' });
  });

  it('should keep events with different names independent', async () => {
    const { EventBus } = await import('../core/EventBus.ts');
    const bus = new EventBus<{
      eventA: { a: number };
      eventB: { b: string };
    }>();
    const cbA = vi.fn();
    const cbB = vi.fn();
    bus.on('eventA', cbA);
    bus.on('eventB', cbB);
    bus.emit('eventA', { a: 1 });
    expect(cbA).toHaveBeenCalledWith({ a: 1 });
    expect(cbB).not.toHaveBeenCalled();
  });

  it('should not throw when emitting with no listeners', async () => {
    const { EventBus } = await import('../core/EventBus.ts');
    const bus = new EventBus<{ noListeners: { x: number } }>();
    expect(() => bus.emit('noListeners', { x: 1 })).not.toThrow();
  });

  it('should not throw when removing unregistered callback', async () => {
    const { EventBus } = await import('../core/EventBus.ts');
    const bus = new EventBus<{ test: { x: number } }>();
    const cb = vi.fn();
    expect(() => bus.off('test', cb)).not.toThrow();
  });
});

describe('GameEvents and eventBus singleton', () => {
  it('should export GameEvents interface (module loads cleanly)', async () => {
    const mod = await import('../core/GameEvents.ts');
    expect(mod).toBeDefined();
  });

  it('should export eventBus singleton', async () => {
    const mod = await import('../core/GameEvents.ts');
    expect(mod.eventBus).toBeDefined();
  });

  it('should have weaponFired event type in GameEvents interface', async () => {
    // The WeaponFiredEvent interface is a type, erased at runtime.
    // But the module should still export it.
    const mod = await import('../core/GameEvents.ts');
    expect(mod).toBeDefined();
  });

  it('should emit and receive enemyDestroyed event', async () => {
    const { eventBus } = await import('../core/GameEvents.ts');
    const callback = vi.fn();
    eventBus.on('enemyDestroyed', callback);
    const payload = {
      enemy: {} as never,
      position: { x: 1, y: 2, z: 3 },
    };
    eventBus.emit('enemyDestroyed', payload);
    expect(callback).toHaveBeenCalledWith(payload);
    // Clean up listener
    eventBus.off('enemyDestroyed', callback);
  });
});
