export class ObjectPool<T> {
  // Implementation in Story 2-9
  private pool: T[] = [];

  constructor(_factory?: () => T) {
    // Placeholder — pool pre-warming happens in phase enter()
    void this.pool;
  }
}
