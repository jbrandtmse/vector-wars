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

export interface EMPBurstActivatedEvent {
  position: { x: number; y: number; z: number };
  radius: number;
}

export interface BossHealthChangedEvent {
  health: number;
  maxHealth: number;
}

export interface BossPhaseChangedEvent {
  phase: 'barrage' | 'sweep' | 'vulnerable';
}

export interface BossAttackEvent {
  positions: Array<{ x: number; y: number; z: number }>;
  targetPosition: { x: number; y: number; z: number };
  speed: number;
  damage: number;
}

export interface BossVulnerableEvent {
  vulnerable: boolean;
}

export interface BossDefeatedEvent {
  position: { x: number; y: number; z: number };
  scoreValue: number;
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
  empBurstActivated: EMPBurstActivatedEvent;
  bossHealthChanged: BossHealthChangedEvent;
  bossPhaseChanged: BossPhaseChangedEvent;
  bossAttack: BossAttackEvent;
  bossVulnerable: BossVulnerableEvent;
  bossDefeated: BossDefeatedEvent;
}

/** Module-level singleton event bus */
export const eventBus = new EventBus<GameEvents>();
