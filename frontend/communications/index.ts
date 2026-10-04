/**
 * frontend/communications
 *
 * Client-side communications runtime: presence, outbound messages, notifications.
 * Transport and product copy live in application/adapters.
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

export class FrontendCommunicationsRuntime {
  private config: CommunicationsConfig;
  private presence: Presence | null = null;
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

  setPresence(subjectId: OpaqueId, status: PresenceStatus): void {
    this.presence = {
      subjectId,
      status,
      lastSeen: performance.now(),
    };
    this.emit({
      type: 'comms.presence',
      payload: this.presence,
      timestamp: performance.now(),
    });
  }

  getPresence(): Presence | null {
    return this.presence;
  }

  /**
   * Enqueue a message. Actual send is performed by an adapter
   * that listens for 'comms.message' or calls a host transport.
   */
  send(envelope: MessageEnvelope): Outcome<MessageEnvelope> {
    const max = this.config.maxPayloadBytes ?? 256_000;
    const size = JSON.stringify(envelope.payload).length;
    if (size > max) return fail('payload_too_large');

    this.emit({
      type: 'comms.message',
      payload: envelope,
      timestamp: performance.now(),
    });
    return ok(envelope);
  }

  notify(req: NotificationRequest): Outcome<NotificationRequest> {
    this.emit({
      type: 'comms.message',
      payload: {
        id: `notif-${Date.now()}`,
        channel: req.channel,
        routeToken: req.recipientId,
        payload: { contentRef: req.contentRef, data: req.data, priority: req.priority },
        createdAt: new Date().toISOString(),
      },
      timestamp: performance.now(),
    });
    return ok(req);
  }

  private emit(event: CommunicationsEvent): void {
    this.listeners.forEach((h) => h(event));
  }
}
