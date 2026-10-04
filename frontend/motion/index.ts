/**
 * frontend/motion
 *
 * Client-side motion runtime.
 * Understands generic intent, state, position.
 * Domain knowledge enters only via MotionConfig + host inputs.
 */

import type {
  MotionConfig,
  MotionEvent,
  MotionSnapshot,
  MotionIntent,
  MotionState,
  IntentSignal,
} from '../../contracts/motion.contract';
import type { Point, Velocity } from '../../shared/types';

type Handler = (event: MotionEvent) => void;

export class FrontendMotionRuntime {
  private config: MotionConfig;
  private state: MotionState = 'idle';
  private intent: IntentSignal | null = null;
  private position: Point = { x: 0, y: 0 };
  private velocity: Velocity = { vx: 0, vy: 0 };
  private listeners = new Set<Handler>();
  private running = false;

  constructor(config: MotionConfig = {}) {
    this.config = config;
    if (config.defaultState) this.state = config.defaultState;
  }

  updateConfig(config: MotionConfig): void {
    this.config = { ...this.config, ...config };
  }

  start(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  on(handler: Handler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  /** Host or cognition pushes an intent signal */
  signal(intent: MotionIntent, targetId?: string, confidence = 0.8): void {
    if (this.config.permittedActions && !this.config.permittedActions.includes(intent)) {
      return;
    }
    const prev = this.state;
    this.intent = {
      intent,
      targetId,
      confidence,
      intensity: confidence,
      timestamp: performance.now(),
    };
    if (intent === 'hold') this.state = 'hold';
    else if (intent === 'idle') this.state = 'ambient';
    else this.state = 'guided';

    this.emit({
      type: 'motion.intent',
      payload: this.intent,
      timestamp: performance.now(),
    });
    if (prev !== this.state) {
      this.emit({
        type: 'motion.state-change',
        payload: { from: prev, to: this.state },
        timestamp: performance.now(),
      });
    }
  }

  setPosition(p: Point, v?: Velocity): void {
    this.position = { ...p };
    if (v) this.velocity = { ...v };
  }

  getSnapshot(): MotionSnapshot {
    return {
      state: this.state,
      intent: this.intent,
      position: { ...this.position },
      velocity: { ...this.velocity },
      timestamp: performance.now(),
    };
  }

  private emit(event: MotionEvent): void {
    this.listeners.forEach((h) => h(event));
  }
}
