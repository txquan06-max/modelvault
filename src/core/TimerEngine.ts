export type TimerState = 'Idle' | 'Running' | 'Paused';

export interface SessionResult {
  startedAt: number;
  endedAt: number;
  activeSeconds: number;
}

export class TimerEngine {
  private state: TimerState = 'Idle';
  private runningSince: number | null = null;
  private accumulatedMs = 0;
  private startedAtWall: number | null = null;

  start() {
    if (this.state !== 'Idle') return;
    this.state = 'Running';
    this.runningSince = performance.now();
    this.startedAtWall = Date.now();
    this.accumulatedMs = 0;
  }

  pause() {
    if (this.state !== 'Running' || this.runningSince === null) return;
    this.accumulatedMs += performance.now() - this.runningSince;
    this.runningSince = null;
    this.state = 'Paused';
  }

  resume() {
    if (this.state !== 'Paused') return;
    this.runningSince = performance.now();
    this.state = 'Running';
  }

  complete(): SessionResult | null {
    if (this.state === 'Idle') return null;

    if (this.state === 'Running' && this.runningSince !== null) {
      this.accumulatedMs += performance.now() - this.runningSince;
    }

    const endedAt = Date.now();
    const result: SessionResult = {
      startedAt: this.startedAtWall ?? endedAt,
      endedAt,
      activeSeconds: Math.floor(this.accumulatedMs / 1000),
    };

    this.state = 'Idle';
    this.runningSince = null;
    this.startedAtWall = null;
    this.accumulatedMs = 0;

    return result;
  }

  getActiveSeconds(): number {
    let totalMs = this.accumulatedMs;
    if (this.state === 'Running' && this.runningSince !== null) {
      totalMs += performance.now() - this.runningSince;
    }
    return Math.floor(totalMs / 1000);
  }

  getState(): TimerState {
    return this.state;
  }
}