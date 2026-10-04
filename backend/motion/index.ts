/**
 * backend/motion
 *
 * Server-side motion orchestration: workflows, schedules, multi-actor intents.
 * No product workflows hard-coded — those arrive via config + application adapters.
 */

import type {
  MotionConfig,
  MotionEvent,
  MotionSnapshot,
  MotionIntent,
  MotionState,
  IntentSignal,
} from '../../contracts/motion.contract';
import type { OpaqueId } from '../../shared/types';

type Handler = (event: MotionEvent) => void;

export class BackendMotionRuntime {
  private config: MotionConfig;
  private sessions = new Map<OpaqueId, { state: MotionState; intent: IntentSignal | null }>();
  private listeners = new Set<Handler>();

  constructor(config: MotionConfig = {}) {
    this.config = config;
  }

  updateConfig(config: MotionConfig): void {
    this.config = { ...this.config, ...config };
  }

  on(handler: Handler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  /** Open or update a motion session for a subject */
  signal(
    sessionId: OpaqueId,
    intent: MotionIntent,
    targetId?: OpaqueId,
    confidence = 0.8,
  ): IntentSignal {
    if (this.config.permittedActions && !this.config.permittedActions.includes(intent)) {
      const rejected: IntentSignal = {
        intent: 'idle',
        confidence: 0,
        timestamp: Date.now(),
      };
      return rejected;
    }

    const signal: IntentSignal = {
      intent,
      targetId,
      confidence,
      intensity: confidence,
      timestamp: Date.now(),
    };

    let state: MotionState = 'guided';
    if (intent === 'hold') state = 'hold';
    else if (intent === 'idle') state = 'ambient';

    this.sessions.set(sessionId, { state, intent: signal });

    this.emit({
      type: 'motion.intent',
      payload: signal,
      timestamp: signal.timestamp,
    });

    return signal;
  }

  getSnapshot(sessionId: OpaqueId): MotionSnapshot | null {
    const s = this.sessions.get(sessionId);
    if (!s) return null;
    return {
      state: s.state,
      intent: s.intent,
      timestamp: Date.now(),
    };
  }

  closeSession(sessionId: OpaqueId): void {
    this.sessions.delete(sessionId);
  }

  private emit(event: MotionEvent): void {
    this.listeners.forEach((h) => h(event));
  }
}
