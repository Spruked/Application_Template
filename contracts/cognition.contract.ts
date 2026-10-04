/**
 * cognition.contract
 *
 * Shared language for attention, ranking, memory, and local/server inference.
 * No model names, no product-specific prompts — those live in application/.
 */

import type { OpaqueId, OpaqueToken } from '../shared/types';

export type AttentionFocus = {
  targetId?: OpaqueId;
  score: number; // 0–1
  reason?: string; // generic token, not product copy
};

export interface RankingItem {
  id: OpaqueId;
  score: number;
  features?: Record<string, number>;
}

export interface CognitionQuery {
  /** Opaque query token supplied by application */
  queryToken: OpaqueToken;
  contextIds?: OpaqueId[];
  limit?: number;
}

export interface CognitionResult {
  items: RankingItem[];
  focus: AttentionFocus | null;
  confidence: number;
  timestamp: number;
}

export interface MemoryEntry {
  id: OpaqueId;
  /** Opaque payload — cognition runtime stores/retrieves, does not interpret domain keys */
  payload: Record<string, unknown>;
  createdAt: number;
  expiresAt?: number;
}

export interface CognitionConfig {
  maxMemoryEntries?: number;
  defaultLimit?: number;
  /** Opaque model / profile reference */
  modelRef?: string;
}

export type CognitionEventType =
  | 'cognition.result'
  | 'cognition.focus'
  | 'cognition.memory-write';

export interface CognitionEvent {
  type: CognitionEventType;
  payload: CognitionResult | AttentionFocus | MemoryEntry;
  timestamp: number;
}
