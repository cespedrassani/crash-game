export interface EventMetadata {
  eventId: string;
  eventType: string;
  correlationId: string;
  idempotencyKey: string;
  occurredAt: string;
  version: number;
}

export interface EventEnvelope<T> {
  metadata: EventMetadata;
  payload: T;
}
