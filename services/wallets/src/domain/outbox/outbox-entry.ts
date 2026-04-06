export interface OutboxEntry {
  routingKey: string;
  payload: Record<string, unknown>;
}
