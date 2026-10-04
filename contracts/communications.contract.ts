/**
 * communications.contract
 *
 * Shared language for channels, presence, messages, and notifications.
 * Transport details and product copy live in application/adapters.
 */

import type { OpaqueId, OpaqueToken, ISODateTime } from '../shared/types';

export type ChannelKind = 'realtime' | 'notification' | 'email' | 'webhook' | 'internal';

export type PresenceStatus = 'online' | 'away' | 'offline' | 'unknown';

export interface Presence {
  subjectId: OpaqueId;
  status: PresenceStatus;
  lastSeen: number;
  meta?: Record<string, unknown>;
}

export interface MessageEnvelope {
  id: OpaqueId;
  channel: ChannelKind;
  /** Opaque routing token — runtime does not parse product routes */
  routeToken: OpaqueToken;
  payload: Record<string, unknown>;
  createdAt: ISODateTime;
  correlationId?: OpaqueId;
}

export interface NotificationRequest {
  recipientId: OpaqueId;
  channel: ChannelKind;
  /** Opaque template / content ref */
  contentRef: string;
  data?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
}

export interface CommunicationsConfig {
  defaultChannel?: ChannelKind;
  maxPayloadBytes?: number;
  /** Opaque gateway / provider refs */
  gatewayRef?: string;
}

export type CommunicationsEventType =
  | 'comms.message'
  | 'comms.presence'
  | 'comms.delivered'
  | 'comms.failed';

export interface CommunicationsEvent {
  type: CommunicationsEventType;
  payload: MessageEnvelope | Presence | { messageId: OpaqueId; error?: string };
  timestamp: number;
}
