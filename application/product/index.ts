/**
 * application/product
 *
 * Domain-specific product features live here.
 * This module may import runtimes, contracts, config, and adapters.
 * Runtimes must never import this module.
 *
 * Replace the example below with your real product surface.
 */

import {
  FrontendMotionRuntime,
  FrontendCognitionRuntime,
  FrontendCommunicationsRuntime,
  FrontendGovernanceRuntime,
} from '../../frontend';
import {
  BackendMotionRuntime,
  BackendCognitionRuntime,
  BackendCommunicationsRuntime,
  BackendGovernanceRuntime,
} from '../../backend';
import { applyProductConfig, wireDomTargets, recordProductDecision } from '../adapters';
import { productConfig } from '../config';

export interface AppRuntimes {
  frontend: {
    motion: FrontendMotionRuntime;
    cognition: FrontendCognitionRuntime;
    communications: FrontendCommunicationsRuntime;
    governance: FrontendGovernanceRuntime;
  };
  backend: {
    motion: BackendMotionRuntime;
    cognition: BackendCognitionRuntime;
    communications: BackendCommunicationsRuntime;
    governance: BackendGovernanceRuntime;
  };
}

/**
 * Create and wire all runtimes for this product.
 * Call once at bootstrap.
 */
export function bootstrapProduct(): AppRuntimes {
  const frontend = {
    motion: new FrontendMotionRuntime(productConfig.motion),
    cognition: new FrontendCognitionRuntime(productConfig.cognition),
    communications: new FrontendCommunicationsRuntime(productConfig.communications),
    governance: new FrontendGovernanceRuntime(
      productConfig.authority,
      productConfig.evidence,
    ),
  };

  const backend = {
    motion: new BackendMotionRuntime(productConfig.motion),
    cognition: new BackendCognitionRuntime(productConfig.cognition),
    communications: new BackendCommunicationsRuntime(productConfig.communications),
    governance: new BackendGovernanceRuntime(
      productConfig.authority,
      productConfig.evidence,
    ),
  };

  applyProductConfig({
    motion: frontend.motion,
    cognition: frontend.cognition,
    communications: frontend.communications,
    governance: frontend.governance,
  });

  applyProductConfig({
    motion: backend.motion,
    cognition: backend.cognition,
    communications: backend.communications,
    governance: backend.governance,
  });

  // Example product wiring (safe no-op when no DOM)
  if (typeof document !== 'undefined') {
    wireDomTargets(frontend.motion);
  }

  // Example: record bootstrap as evidence
  recordProductDecision(backend.governance, 'system', 'product.bootstrap', {
    at: new Date().toISOString(),
  });

  frontend.motion.start();

  return { frontend, backend };
}
