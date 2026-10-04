/**
 * frontend/cognition
 *
 * Client-side cognition runtime: attention, light ranking, local memory.
 * No model names or product prompts — those arrive via CognitionConfig / adapters.
 */

import type {
  AttentionFocus,
  CognitionConfig,
  CognitionEvent,
  CognitionQuery,
  CognitionResult,
  MemoryEntry,
  RankingItem,
} from '../../contracts/cognition.contract';
import type { OpaqueId } from '../../shared/types';
import { ok, type Outcome } from '../../shared/types';

type Handler = (event: CognitionEvent) => void;

export class FrontendCognitionRuntime {
  private config: CognitionConfig;
  private memory: Map<OpaqueId, MemoryEntry> = new Map();
  private focus: AttentionFocus | null = null;
  private listeners = new Set<Handler>();

  constructor(config: CognitionConfig = {}) {
    this.config = config;
  }

  updateConfig(config: CognitionConfig): void {
    this.config = { ...this.config, ...config };
  }

  on(handler: Handler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  /**
   * Rank opaque items. Host supplies scores/features;
   * runtime only sorts and emits.
   */
  rank(items: RankingItem[], limit?: number): CognitionResult {
    const lim = limit ?? this.config.defaultLimit ?? 10;
    const sorted = [...items].sort((a, b) => b.score - a.score).slice(0, lim);
    const focus: AttentionFocus | null =
      sorted.length > 0
        ? { targetId: sorted[0].id, score: sorted[0].score }
        : null;
    this.focus = focus;
    const result: CognitionResult = {
      items: sorted,
      focus,
      confidence: sorted[0]?.score ?? 0,
      timestamp: performance.now(),
    };
    this.emit({ type: 'cognition.result', payload: result, timestamp: result.timestamp });
    if (focus) {
      this.emit({ type: 'cognition.focus', payload: focus, timestamp: result.timestamp });
    }
    return result;
  }

  /** Opaque query — actual retrieval is host/adapter responsibility */
  query(_q: CognitionQuery): Outcome<CognitionResult> {
    return ok({
      items: [],
      focus: this.focus,
      confidence: 0,
      timestamp: performance.now(),
    });
  }

  remember(entry: MemoryEntry): void {
    const max = this.config.maxMemoryEntries ?? 200;
    if (this.memory.size >= max) {
      const oldest = this.memory.keys().next().value;
      if (oldest) this.memory.delete(oldest);
    }
    this.memory.set(entry.id, entry);
    this.emit({
      type: 'cognition.memory-write',
      payload: entry,
      timestamp: performance.now(),
    });
  }

  recall(id: OpaqueId): MemoryEntry | null {
    return this.memory.get(id) ?? null;
  }

  getFocus(): AttentionFocus | null {
    return this.focus;
  }

  private emit(event: CognitionEvent): void {
    this.listeners.forEach((h) => h(event));
  }
}
