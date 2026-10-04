/**
 * authority.contract
 *
 * Who may act, on what, under which policy.
 * Product-specific roles and permissions are supplied via config / application.
 */

import type { OpaqueId, OpaqueToken } from '../shared/types';

export type ActionVerb =
  | 'read'
  | 'write'
  | 'execute'
  | 'delete'
  | 'share'
  | 'admin'
  | 'deploy';

export interface Principal {
  id: OpaqueId;
  /** Opaque role / kind tokens */
  roles: string[];
  attributes?: Record<string, unknown>;
}

export interface ResourceRef {
  id: OpaqueId;
  /** Opaque resource kind */
  kind: string;
  ownerId?: OpaqueId;
}

export interface PermissionCheck {
  principal: Principal;
  action: ActionVerb;
  resource: ResourceRef;
  context?: Record<string, unknown>;
}

export interface AuthorityDecision {
  allowed: boolean;
  reason?: string;
  policyRef?: string;
  timestamp: number;
}

export interface AuthorityConfig {
  /** Opaque policy pack reference */
  policyPackRef?: string;
  defaultDeny?: boolean;
}

export type AuthorityEventType =
  | 'authority.decision'
  | 'authority.policy-change';

export interface AuthorityEvent {
  type: AuthorityEventType;
  payload: AuthorityDecision | { policyPackRef: string };
  timestamp: number;
}
