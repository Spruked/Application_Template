/**
 * application/config
 *
 * ALL domain-specific configuration lives here.
 * Product names, permitted actions, profile refs, policy packs, branding.
 * Runtimes receive these values as opaque config — they never import this module.
 */

import type { MotionConfig } from '../../contracts/motion.contract';
import type { CognitionConfig } from '../../contracts/cognition.contract';
import type { CommunicationsConfig } from '../../contracts/communications.contract';
import type { AuthorityConfig } from '../../contracts/authority.contract';
import type { EvidenceConfig } from '../../contracts/evidence.contract';

/**
 * Example product config. Replace with your real product values.
 * This is the only place product language is allowed.
 */
export const productMotionConfig: MotionConfig = {
  defaultState: 'ambient',
  permittedActions: [
    'idle',
    'approach',
    'orbit',
    'point',
    'follow',
    'retreat',
    'hold',
    'ping',
    'activate',
    'dismiss',
  ],
  maxSpeed: 420,
  damping: 0.86,
  holdTimeoutMs: 2500,
  profileRef: 'product-default-motion',
};

export const productCognitionConfig: CognitionConfig = {
  maxMemoryEntries: 500,
  defaultLimit: 10,
  modelRef: 'product-default-model',
};

export const productCommunicationsConfig: CommunicationsConfig = {
  defaultChannel: 'realtime',
  maxPayloadBytes: 256_000,
  gatewayRef: 'product-default-gateway',
};

export const productAuthorityConfig: AuthorityConfig = {
  policyPackRef: 'product-default-policies',
  defaultDeny: true,
};

export const productEvidenceConfig: EvidenceConfig = {
  retentionDays: 365,
  storeRef: 'product-default-evidence-store',
  requireIntegrity: false,
};

/** Aggregate for convenience when bootstrapping */
export const productConfig = {
  motion: productMotionConfig,
  cognition: productCognitionConfig,
  communications: productCommunicationsConfig,
  authority: productAuthorityConfig,
  evidence: productEvidenceConfig,
};
