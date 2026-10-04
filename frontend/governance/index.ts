/**
 * frontend/governance
 *
 * Client-side governance: local policy checks, consent flags, evidence hooks.
 * Full authority and evidence store live on the backend; this layer is a mirror + gate.
 */

import type {
  AuthorityConfig,
  AuthorityDecision,
  PermissionCheck,
} from '../../contracts/authority.contract';
import type {
  EvidenceConfig,
  EvidenceRecord,
} from '../../contracts/evidence.contract';
import { ok, fail, type Outcome } from '../../shared/types';

export class FrontendGovernanceRuntime {
  private authorityConfig: AuthorityConfig;
  private evidenceConfig: EvidenceConfig;
  private localConsent = new Map<string, boolean>();
  private localEvidence: EvidenceRecord[] = [];

  constructor(
    authorityConfig: AuthorityConfig = {},
    evidenceConfig: EvidenceConfig = {},
  ) {
    this.authorityConfig = authorityConfig;
    this.evidenceConfig = evidenceConfig;
  }

  updateAuthorityConfig(config: AuthorityConfig): void {
    this.authorityConfig = { ...this.authorityConfig, ...config };
  }

  updateEvidenceConfig(config: EvidenceConfig): void {
    this.evidenceConfig = { ...this.evidenceConfig, ...config };
  }

  /**
   * Local optimistic check. Source of truth is backend governance.
   * defaultDeny controls fail-closed vs fail-open when no local policy matches.
   */
  check(permission: PermissionCheck): AuthorityDecision {
    const defaultDeny = this.authorityConfig.defaultDeny ?? true;
    // Host/adapters can pre-seed decisions; runtime stays generic.
    const decision: AuthorityDecision = {
      allowed: !defaultDeny,
      reason: defaultDeny ? 'default_deny' : 'default_allow',
      policyRef: this.authorityConfig.policyPackRef,
      timestamp: performance.now(),
    };
    return decision;
  }

  setConsent(key: string, granted: boolean): void {
    this.localConsent.set(key, granted);
  }

  hasConsent(key: string): boolean {
    return this.localConsent.get(key) === true;
  }

  record(evidence: EvidenceRecord): Outcome<EvidenceRecord> {
    this.localEvidence.push(evidence);
    const retention = this.evidenceConfig.retentionDays ?? 30;
    // Simple client-side cap; durable store is backend
    if (this.localEvidence.length > 500) {
      this.localEvidence = this.localEvidence.slice(-400);
    }
    return ok(evidence);
  }

  listEvidence(limit = 50): EvidenceRecord[] {
    return this.localEvidence.slice(-limit);
  }
}
