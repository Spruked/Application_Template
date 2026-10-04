/**
 * backend/cognition
 *
 * Server-side cognition: ranking, retrieval, memory, inference orchestration.
 * Model endpoints and product prompts live in application/adapters.
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

export class BackendCognitionRuntime {
  private config: CognitionConfig;
  private memory = new Map<OpaqueId, MemoryEntry>();
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

  rank(items: RankingItem[], limit?: number): CognitionResult {
    const lim = limit ?? this.config.defaultLimit ?? 20;
    const sorted = [...items].sort((a, b) => b.score - a.score).slice(0, lim);
    const focus: AttentionFocus | null =
      sorted.length > 0
        ? { targetId: sorted[0].id, score: sorted[0].score }
        : null;
    const result: CognitionResult = {
      items: sorted,
      focus,
      confidence: sorted[0]?.score ?? 0,
      timestamp: Date.now(),
    };
    this.emit({ type: 'cognition.result', payload: result, timestamp: result.timestamp });
    return result;
  }

  /**
   * Opaque query. Adapter supplies real retrieval; this runtime
   * normalizes the result shape.
   */
  async query(q: CognitionQuery): Promise<Outcome<CognitionResult>> {
    // Placeholder: adapters override / pipe real backends
    return ok({
      items: [],
      focus: null,
      confidence: 0,
      timestamp: Date.now(),
    });
  }

  remember(entry: MemoryEntry): void {
    const max = this.config.maxMemoryEntries ?? 10_000;
    if (this.memory.size >= max) {
      const first = this.memory.keys().next().value;
      if (first) this.memory.delete(first);
    }
    this.memory.set(entry.id, entry);
    this.emit({
      type: 'cognition.memory-write',
      payload: entry,
      timestamp: Date.now(),
    });
  }

  recall(id: OpaqueId): MemoryEntry | null {
    return this.memory.get(id) ?? null;
  }

  private emit(event: CognitionEvent): void {
    this.listeners.forEach((h) => h(event));
  }
}
