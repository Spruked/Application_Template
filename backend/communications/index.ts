/**
 * backend/communications
 *
 * Server-side communications: gateways, fan-out, delivery tracking.
 * Provider SDKs and product templates live in application/adapters.
 */

import type {
  CommunicationsConfig,
  CommunicationsEvent,
  MessageEnvelope,
  NotificationRequest,
  Presence,
  PresenceStatus,
} from '../../contracts/communications.contract';
import type { OpaqueId } from '../../shared/types';
import { ok, fail, type Outcome } from '../../shared/types';

type Handler = (event: CommunicationsEvent) => void;

export class BackendCommunicationsRuntime {
  private config: CommunicationsConfig;
  private presence = new Map<OpaqueId, Presence>();
  private outbox: MessageEnvelope[] = [];
  private listeners = new Set<Handler>();

  constructor(config: CommunicationsConfig = {}) {
    this.config = config;
  }

  updateConfig(config: CommunicationsConfig): void {
    this.config = { ...this.config, ...config };
  }

  on(handler: Handler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  setPresence(subjectId: OpaqueId, status: PresenceStatus): Presence {
    const p: Presence = {
      subjectId,
      status,
      lastSeen: Date.now(),
    };
    this.presence.set(subjectId, p);
    this.emit({ type: 'comms.presence', payload: p, timestamp: Date.now() });
    return p;
  }

  getPresence(subjectId: OpaqueId): Presence | null {
    return this.presence.get(subjectId) ?? null;
  }

  send(envelope: MessageEnvelope): Outcome<MessageEnvelope> {
    const max = this.config.maxPayloadBytes ?? 1_000_000;
    const size = JSON.stringify(envelope.payload).length;
    if (size > max) {
      this.emit({
        type: 'comms.failed',
        payload: { messageId: envelope.id, error: 'payload_too_large' },
        timestamp: Date.now(),
      });
      return fail('payload_too_large');
    }
    this.outbox.push(envelope);
    this.emit({ type: 'comms.message', payload: envelope, timestamp: Date.now() });
    this.emit({
      type: 'comms.delivered',
      payload: { messageId: envelope.id },
      timestamp: Date.now(),
    });
    return ok(envelope);
  }

  notify(req: NotificationRequest): Outcome<MessageEnvelope> {
    const envelope: MessageEnvelope = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      channel: req.channel,
      routeToken: req.recipientId,
      payload: {
        contentRef: req.contentRef,
        data: req.data,
        priority: req.priority ?? 'normal',
      },
      createdAt: new Date().toISOString(),
    };
    return this.send(envelope);
  }

  /** Drain outbox for adapters that push to real providers */
  drainOutbox(): MessageEnvelope[] {
    const batch = [...this.outbox];
    this.outbox = [];
    return batch;
  }

  private emit(event: CommunicationsEvent): void {
    this.listeners.forEach((h) => h(event));
  }
}
