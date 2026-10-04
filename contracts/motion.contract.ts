/**
 * motion.contract
 *
 * Shared language for intent, state, and motion/interaction.
 * Runtimes and application code both depend on this — never the reverse.
 */

import type { OpaqueId, Point, Velocity } from '../shared/types';

export type MotionState = 'ambient' | 'hold' | 'guided' | 'idle';

export type MotionIntent =
  | 'idle'
  | 'approach'
  | 'orbit'
  | 'point'
  | 'follow'
  | 'retreat'
  | 'hold'
  | 'ping'
  | 'activate'
  | 'dismiss';

export interface IntentSignal {
  intent: MotionIntent;
  targetId?: OpaqueId;
  confidence: number; // 0–1
  intensity?: number; // 0–1
  timestamp: number;
}

export interface MotionSnapshot {
  state: MotionState;
  intent: IntentSignal | null;
  position?: Point;
  velocity?: Velocity;
  timestamp: number;
}

export interface MotionConfig {
  defaultState?: MotionState;
  permittedActions?: MotionIntent[];
  maxSpeed?: number;
  damping?: number;
  holdTimeoutMs?: number;
  /** Opaque visual / profile refs — runtime does not interpret */
  profileRef?: string;
}

/** Events the motion runtime may emit */
export type MotionEventType =
  | 'motion.snapshot'
  | 'motion.intent'
  | 'motion.state-change';

export interface MotionEvent {
  type: MotionEventType;
  payload: MotionSnapshot | IntentSignal | { from: MotionState; to: MotionState };
  timestamp: number;
}
