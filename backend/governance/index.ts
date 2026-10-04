/**
 * backend/governance
 *
 * Server-side authority decisions and durable evidence store.
 * Policy packs and product roles are injected via AuthorityConfig / adapters.
 */

import type {
  AuthorityConfig,
  AuthorityDecision,
  AuthorityEvent,
  PermissionCheck,
} from '../../contracts/authority.contract';
import type {
  EvidenceConfig,
  EvidenceEvent,
  EvidenceQuery,
  EvidenceRecord,
} from '../../contracts/evidence.contract';
import type { OpaqueId } from '../../shared/types';
import { ok, type Outcome } from '../../shared/types';

type AuthHandler = (event: AuthorityEvent) => void;
type EvidHandler = (event: EvidenceEvent) => void;

export class BackendGovernanceRuntime {
  private authorityConfig: AuthorityConfig;
  private evidenceConfig: EvidenceConfig;
  private evidence: EvidenceRecord[] = [];
  private authListeners = new Set<AuthHandler>();
  private evidListeners = new Set<EvidHandler>();

  constructor(
    authorityConfig: AuthorityConfig = {},
    evidenceConfig: EvidenceConfig = {},
  ) {
    this.authorityConfig = { defaultDeny: true, ...authorityConfig };
    this.evidenceConfig = evidenceConfig;
  }

  updateAuthorityConfig(config: AuthorityConfig): void {
    this.authorityConfig = { ...this.authorityConfig, ...config };
    this.authListeners.forEach((h) =>
      h({
        type: 'authority.policy-change',
        payload: { policyPackRef: config.policyPackRef ?? '' },
        timestamp: Date.now(),
      }),
    );
  }

  updateEvidenceConfig(config: EvidenceConfig): void {
    this.evidenceConfig = { ...this.evidenceConfig, ...config };
  }

  onAuthority(handler: AuthHandler): () => void {
    this.authListeners.add(handler);
    return () => this.authListeners.delete(handler);
  }

  onEvidence(handler: EvidHandler): () => void {
    this.evidListeners.add(handler);
    return () => this.evidListeners.delete(handler);
  }

  /**
   * Evaluate permission. Real policy engines plug in via adapters;
   * this default is fail-closed when defaultDeny is true.
   */
  check(permission: PermissionCheck): AuthorityDecision {
    const decision: AuthorityDecision = {
      allowed: !(this.authorityConfig.defaultDeny ?? true),
      reason: this.authorityConfig.defaultDeny ? 'default_deny' : 'default_allow',
      policyRef: this.authorityConfig.policyPackRef,
      timestamp: Date.now(),
    };
    this.authListeners.forEach((h) =>
      h({ type: 'authority.decision', payload: decision, timestamp: decision.timestamp }),
    );
    return decision;
  }

  record(evidence: EvidenceRecord): Outcome<EvidenceRecord> {
    this.evidence.push(evidence);
    // Retention trim (simple)
    const maxDays = this.evidenceConfig.retentionDays ?? 365;
    // In production an adapter would enforce real retention; here we cap length
    if (this.evidence.length > 50_000) {
      this.evidence = this.evidence.slice(-40_000);
    }
    this.evidListeners.forEach((h) =>
      h({ type: 'evidence.recorded', payload: evidence, timestamp: Date.now() }),
    );
    return ok(evidence);
  }

  query(q: EvidenceQuery): EvidenceRecord[] {
    let results = [...this.evidence];
    if (q.subjectId) results = results.filter((e) => e.subjectId === q.subjectId);
    if (q.kind) results = results.filter((e) => e.kind === q.kind);
    if (q.correlationId) {
      results = results.filter((e) => e.correlationId === q.correlationId);
    }
    if (q.from) results = results.filter((e) => e.createdAt >= q.from!);
    if (q.to) results = results.filter((e) => e.createdAt <= q.to!);
    const limit = q.limit ?? 100;
    results = results.slice(-limit);
    this.evidListeners.forEach((h) =>
      h({
        type: 'evidence.queried',
        payload: { count: results.length, query: q },
        timestamp: Date.now(),
      }),
    );
    return results;
  }
}
