/**
 * EventBus — Typed pub/sub event system for decoupled communication.
 *
 * Entities and systems communicate through typed events rather than
 * direct imports. Generic type parameter ensures type safety for all events.
 *
 * Created by: Story 2-2 (replacing placeholder)
 */

type EventCallback<T> = (data: T) => void;

export class EventBus<TEvents extends object> {
  private listeners = new Map<keyof TEvents, Set<EventCallback<unknown>>>();

  on<K extends keyof TEvents>(event: K, callback: EventCallback<TEvents[K]>): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback as EventCallback<unknown>);
  }

  off<K extends keyof TEvents>(event: K, callback: EventCallback<TEvents[K]>): void {
    this.listeners.get(event)?.delete(callback as EventCallback<unknown>);
  }

  emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }
}
