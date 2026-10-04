/**
 * application/adapters
 *
 * Wires domain knowledge into the generic runtimes.
 * This is where selectors, API clients, product routes, and
 * real provider SDKs are allowed.
 *
 * Runtimes must NEVER import from here.
 * Application bootstrap imports runtimes + these adapters.
 */

import type { FrontendMotionRuntime } from '../../frontend/motion';
import type { BackendGovernanceRuntime } from '../../backend/governance';
import { productConfig } from '../config';

/**
 * Example: push DOM-measured targets into a motion runtime.
 * Replace selectors and IDs with your product's.
 */
export function wireDomTargets(
  motion: FrontendMotionRuntime,
  // In a real app you might also pass MotionRuntime here
): void {
  // Product-specific: query your own markers
  if (typeof document === 'undefined') return;
  const nodes = document.querySelectorAll('[data-app-target]');
  // Measure and signal — example only
  nodes.forEach((el) => {
    const id = el.getAttribute('data-app-target') || 'unknown';
    // Host measures geometry and feeds generic runtime
    motion.signal('approach', id, 0.7);
  });
}

/**
 * Example: record a product decision into governance evidence.
 */
export function recordProductDecision(
  governance: BackendGovernanceRuntime,
  subjectId: string,
  decision: string,
  meta?: Record<string, unknown>,
): void {
  governance.record({
    id: `ev-${Date.now()}`,
    kind: 'decision',
    subjectId,
    actionToken: decision,
    payload: meta ?? {},
    createdAt: new Date().toISOString(),
  });
}

/**
 * Bootstrap helper: apply product config to runtimes.
 * Call once at app start.
 */
export function applyProductConfig(runtimes: {
  motion?: { updateConfig: (c: typeof productConfig.motion) => void };
  cognition?: { updateConfig: (c: typeof productConfig.cognition) => void };
  communications?: { updateConfig: (c: typeof productConfig.communications) => void };
  governance?: {
    updateAuthorityConfig: (c: typeof productConfig.authority) => void;
    updateEvidenceConfig: (c: typeof productConfig.evidence) => void;
  };
}): void {
  runtimes.motion?.updateConfig(productConfig.motion);
  runtimes.cognition?.updateConfig(productConfig.cognition);
  runtimes.communications?.updateConfig(productConfig.communications);
  runtimes.governance?.updateAuthorityConfig(productConfig.authority);
  runtimes.governance?.updateEvidenceConfig(productConfig.evidence);
}
