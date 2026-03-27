/**
 * DestructionSequence -- Sequenced animation timeline for boss destruction.
 *
 * Architecture pattern: "Boss Destruction Choreography" --
 * timed multi-stage animation with callbacks for geometry removal,
 * effects spawning, audio triggers, and event emission.
 *
 * RULE: Boss destruction is always a DestructionSequence. Never
 * hardcode timed destruction logic in update() with elapsed-time
 * counters.
 *
 * This class does NOT import any other system or entity.
 *
 * Created by: Story 3-9
 */

export interface DestructionStage {
  name: string;
  duration: number;
  onStart: () => void;
  onUpdate: (progress: number, dt: number) => void;
  onEnd: () => void;
}

export class DestructionSequence {
  private stages: DestructionStage[];
  private currentIndex: number = 0;
  private elapsed: number = 0;
  public complete: boolean = false;

  constructor(stages: DestructionStage[]) {
    this.stages = stages;
    if (stages.length > 0) {
      stages[0].onStart();
    } else {
      this.complete = true;
    }
  }

  update(dt: number): void {
    if (this.complete) return;

    const stage = this.stages[this.currentIndex];
    this.elapsed += dt;
    const progress = Math.min(this.elapsed / stage.duration, 1.0);

    stage.onUpdate(progress, dt);

    if (progress >= 1.0) {
      stage.onEnd();
      this.currentIndex++;
      this.elapsed = 0;

      if (this.currentIndex >= this.stages.length) {
        this.complete = true;
      } else {
        this.stages[this.currentIndex].onStart();
      }
    }
  }

  getCurrentStage(): string {
    if (this.complete) return '';
    return this.stages[this.currentIndex].name;
  }

  getProgress(): number {
    if (this.complete) return 1.0;
    const stage = this.stages[this.currentIndex];
    return Math.min(this.elapsed / stage.duration, 1.0);
  }
}
