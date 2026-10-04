/**
 * evidence.contract
 *
 * What was observed, decided, or proven.
 * Used by governance for audit, compliance, and replay.
 */

import type { OpaqueId, OpaqueToken, ISODateTime } from '../shared/types';

export type EvidenceKind =
  | 'observation'
  | 'decision'
  | 'action'
  | 'consent'
  | 'error'
  | 'metric';

export interface EvidenceRecord {
  id: OpaqueId;
  kind: EvidenceKind;
  /** Opaque actor / subject */
  subjectId?: OpaqueId;
  /** Opaque action or event token */
  actionToken?: OpaqueToken;
  payload: Record<string, unknown>;
  createdAt: ISODateTime;
  /** Optional cryptographic or integrity hash (opaque) */
  integrityRef?: string;
  correlationId?: OpaqueId;
}

export interface EvidenceQuery {
  subjectId?: OpaqueId;
  kind?: EvidenceKind;
  from?: ISODateTime;
  to?: ISODateTime;
  limit?: number;
  correlationId?: OpaqueId;
}

export interface EvidenceConfig {
  retentionDays?: number;
  /** Opaque store / sink reference */
  storeRef?: string;
  requireIntegrity?: boolean;
}

export type EvidenceEventType =
  | 'evidence.recorded'
  | 'evidence.queried';

export interface EvidenceEvent {
  type: EvidenceEventType;
  payload: EvidenceRecord | { count: number; query: EvidenceQuery };
  timestamp: number;
}
