import { DomainEvent } from "./domain-event";

export class RoundFinishedEvent implements DomainEvent {
  readonly occurredAt = new Date();

  constructor(readonly aggregateId: string) {}
}
