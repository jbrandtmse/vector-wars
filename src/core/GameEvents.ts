/**
 * GameEvents — Typed event definitions and singleton EventBus instance.
 *
 * All game events are defined here with typed payloads.
 * Systems subscribe/emit through the exported eventBus singleton.
 *
 * Updated by: Story 2-2 (added enemySpawned event, eventBus singleton)
 */

import type { WeaponType } from '../types/game.ts';
import type { Enemy } from '../entities/enemies/Enemy.ts';
import { EventBus } from './EventBus.ts';

export interface WeaponFiredEvent {
  weapon: WeaponType;
  position: { x: number; y: number; z: number };
}

export interface PlayerHitEvent {
  damage: number;
  source: string;
}

export interface ShieldChangedEvent {
  shields: number;
  maxShields: number;
}

export interface ScoreChangedEvent {
  score: number;
  delta: number;
}

export interface LogicBombLockOnEvent {
  target: Enemy;
}

export interface GameEvents {
  weaponFired: WeaponFiredEvent;
  enemySpawned: { enemy: Enemy; position: { x: number; y: number; z: number } };
  enemyDestroyed: { enemy: Enemy; position: { x: number; y: number; z: number } };
  playerHit: PlayerHitEvent;
  shieldChanged: ShieldChangedEvent;
  scoreChanged: ScoreChangedEvent;
  playerDied: Record<string, never>;
  logicBombLockOn: LogicBombLockOnEvent;
  logicBombLockLost: Record<string, never>;
}

/** Module-level singleton event bus */
export const eventBus = new EventBus<GameEvents>();
