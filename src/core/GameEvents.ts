import type { WeaponType } from '../types/game.ts';

export interface WeaponFiredEvent {
  weapon: WeaponType;
  position: { x: number; y: number; z: number };
}

export interface GameEvents {
  // Event definitions will be added as stories introduce new events
  weaponFired: WeaponFiredEvent;
}
