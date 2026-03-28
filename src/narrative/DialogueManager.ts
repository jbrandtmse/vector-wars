/**
 * DialogueManager — Trigger evaluation, priority queuing, and display orchestrator.
 *
 * Subscribes to game events via EventBus, maps events to trigger IDs,
 * looks up matching dialogue entries from loaded scripts, and manages
 * a priority queue. Displays dialogue through CommOverlay.
 *
 * Created by: Story 4-1
 */

import { eventBus } from '../core/GameEvents.ts';
import type {
  PhaseStartEvent,
  PhaseEndEvent,
  BossHealthChangedEvent,
  BossVulnerableEvent,
  BossDefeatedEvent,
  BossPhaseChangedEvent,
  LevelCompleteEvent,
  DialogueTriggerEvent,
} from '../core/GameEvents.ts';
import type { Enemy } from '../entities/enemies/Enemy.ts';
import type { CommOverlay } from '../ui/screens/CommOverlay.ts';
import type { DialogueEntry, DialogueScript, DialogueSpeakerConfig } from './DialogueTypes.ts';
import { COMM_DEFAULT_DURATION } from '../config/constants.ts';
import { Logger } from '../core/Logger.ts';

/** Static speaker configuration — all green for Level 1 */
const SPEAKER_CONFIGS: Record<string, DialogueSpeakerConfig> = {
  handler: { label: 'HANDLER', color: '#00ff41' },
  gatekeeper: { label: 'GATEKEEPER', color: '#00ff41' },
  avenger: { label: 'AVENGER', color: '#00ff41' },
  coreIntelligence: { label: 'CORE INTELLIGENCE', color: '#00ff41' },
};

export class DialogueManager {
  private commOverlay: CommOverlay;
  private triggerMap = new Map<string, DialogueEntry[]>();
  private queue: DialogueEntry[] = [];
  private currentEntry: DialogueEntry | null = null;
  private displayTimer = 0;

  // State tracking for one-shot triggers
  private firstEnemyKilled = false;
  private bossBelow75Fired = false;
  private bossBelow50Fired = false;
  private bossBelow25Fired = false;

  // Store bound callbacks for cleanup
  private onDialogueTrigger: (e: DialogueTriggerEvent) => void;
  private onPhaseStart: (e: PhaseStartEvent) => void;
  private onPhaseEnd: (e: PhaseEndEvent) => void;
  private onBossHealthChanged: (e: BossHealthChangedEvent) => void;
  private onBossVulnerable: (e: BossVulnerableEvent) => void;
  private onBossDefeated: (e: BossDefeatedEvent) => void;
  private onBossPhaseChanged: (e: BossPhaseChangedEvent) => void;
  private onEnemyDestroyed: (e: { enemy: Enemy; position: { x: number; y: number; z: number } }) => void;
  private onLevelComplete: (e: LevelCompleteEvent) => void;

  constructor(commOverlay: CommOverlay) {
    this.commOverlay = commOverlay;

    // Bind event handlers
    this.onDialogueTrigger = (e) => this.handleTrigger(e.triggerId);

    this.onPhaseStart = (e) => {
      // Reset per-phase state
      this.firstEnemyKilled = false;
      this.bossBelow75Fired = false;
      this.bossBelow50Fired = false;
      this.bossBelow25Fired = false;

      const triggerId = `phaseStart:${e.phase}:${e.level}`;
      Logger.debug('Narrative', 'Phase start trigger', { triggerId });
      this.handleTrigger(triggerId);
    };

    this.onPhaseEnd = (e) => {
      const triggerId = `phaseEnd:${e.phase}:${e.level}`;
      Logger.debug('Narrative', 'Phase end trigger', { triggerId });
      this.handleTrigger(triggerId);
    };

    this.onBossHealthChanged = (e) => {
      const pct = (e.health / e.maxHealth) * 100;
      if (pct < 75 && !this.bossBelow75Fired) {
        this.bossBelow75Fired = true;
        this.handleTrigger('bossHealthChanged:below75');
      }
      if (pct < 50 && !this.bossBelow50Fired) {
        this.bossBelow50Fired = true;
        this.handleTrigger('bossHealthChanged:below50');
      }
      if (pct < 25 && !this.bossBelow25Fired) {
        this.bossBelow25Fired = true;
        this.handleTrigger('bossHealthChanged:below25');
      }
    };

    this.onBossVulnerable = (e) => {
      if (e.vulnerable) {
        this.handleTrigger('bossVulnerable');
      }
    };

    this.onBossDefeated = () => {
      Logger.debug('Narrative', 'Boss defeated trigger', { triggerId: 'bossDefeated' });
      this.handleTrigger('bossDefeated');
    };

    this.onBossPhaseChanged = (e) => {
      const triggerId = `bossPhaseChanged:${e.phase}`;
      Logger.debug('Narrative', 'Boss phase changed trigger', { triggerId });
      this.handleTrigger(triggerId);
    };

    this.onEnemyDestroyed = () => {
      if (!this.firstEnemyKilled) {
        this.firstEnemyKilled = true;
        this.handleTrigger('firstEnemyDestroyed');
      }
    };

    this.onLevelComplete = (e) => {
      const triggerId = `levelComplete:${e.level}`;
      Logger.debug('Narrative', 'Level complete trigger', { triggerId });
      this.handleTrigger(triggerId);
    };

    // Subscribe to events
    eventBus.on('dialogueTrigger', this.onDialogueTrigger);
    eventBus.on('phaseStart', this.onPhaseStart);
    eventBus.on('phaseEnd', this.onPhaseEnd);
    eventBus.on('bossHealthChanged', this.onBossHealthChanged);
    eventBus.on('bossVulnerable', this.onBossVulnerable);
    eventBus.on('bossDefeated', this.onBossDefeated);
    eventBus.on('bossPhaseChanged', this.onBossPhaseChanged);
    eventBus.on('enemyDestroyed', this.onEnemyDestroyed);
    eventBus.on('levelComplete', this.onLevelComplete);

    Logger.info('Narrative', 'DialogueManager initialized');
  }

  loadScript(script: DialogueScript): void {
    for (const entry of script.entries) {
      const existing = this.triggerMap.get(entry.trigger);
      if (existing) {
        existing.push(entry);
      } else {
        this.triggerMap.set(entry.trigger, [entry]);
      }
    }
    Logger.info('Narrative', 'Script loaded', { entryCount: script.entries.length });
  }

  update(dt: number): void {
    // If nothing showing and queue empty, nothing to do
    if (this.currentEntry === null && this.queue.length === 0) return;

    // If nothing showing but queue has entries, show next
    if (this.currentEntry === null && this.queue.length > 0) {
      this.showNext();
      return;
    }

    // Current line is showing
    if (this.currentEntry !== null) {
      this.displayTimer += dt;
      this.commOverlay.update(dt);

      // Check if higher-priority entry is waiting
      if (this.queue.length > 0 && this.queue[0].priority > this.currentEntry.priority) {
        // Preempt current line
        this.commOverlay.hide();
        this.currentEntry = null;
        this.showNext();
        return;
      }

      // Check if current line has expired
      const duration = this.currentEntry.duration ?? COMM_DEFAULT_DURATION;
      if (this.displayTimer >= duration) {
        this.commOverlay.hide();
        this.currentEntry = null;
        // Next frame will pick up queue if anything is waiting
      }
    }
  }

  clearQueue(): void {
    this.queue = [];
    this.currentEntry = null;
    this.displayTimer = 0;
    this.commOverlay.hide();
  }

  dispose(): void {
    eventBus.off('dialogueTrigger', this.onDialogueTrigger);
    eventBus.off('phaseStart', this.onPhaseStart);
    eventBus.off('phaseEnd', this.onPhaseEnd);
    eventBus.off('bossHealthChanged', this.onBossHealthChanged);
    eventBus.off('bossVulnerable', this.onBossVulnerable);
    eventBus.off('bossDefeated', this.onBossDefeated);
    eventBus.off('bossPhaseChanged', this.onBossPhaseChanged);
    eventBus.off('enemyDestroyed', this.onEnemyDestroyed);
    eventBus.off('levelComplete', this.onLevelComplete);
    this.clearQueue();
    Logger.info('Narrative', 'DialogueManager disposed');
  }

  private handleTrigger(triggerId: string): void {
    const entries = this.triggerMap.get(triggerId);
    if (!entries || entries.length === 0) {
      Logger.debug('Narrative', 'No dialogue entries for trigger', { triggerId });
      return;
    }

    for (const entry of entries) {
      this.enqueue(entry);
    }
  }

  private enqueue(entry: DialogueEntry): void {
    // Insert into queue sorted by priority descending (highest first)
    let inserted = false;
    for (let i = 0; i < this.queue.length; i++) {
      if (entry.priority > this.queue[i].priority) {
        this.queue.splice(i, 0, entry);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      this.queue.push(entry);
    }
    Logger.debug('Narrative', 'Dialogue enqueued', { id: entry.id, priority: entry.priority });
  }

  private showNext(): void {
    if (this.queue.length === 0) return;

    const entry = this.queue.shift()!;
    this.currentEntry = entry;
    this.displayTimer = 0;

    const config = SPEAKER_CONFIGS[entry.speaker];
    if (config) {
      this.commOverlay.show(config.label, entry.text, config.color);
    } else {
      // Fallback for unknown speakers
      Logger.warn('Narrative', 'Unknown speaker, using default', { speaker: entry.speaker });
      this.commOverlay.show(entry.speaker.toUpperCase(), entry.text);
    }
  }
}
