import { DomainEvent } from "./domain-event";

export class RoundStartedEvent implements DomainEvent {
  readonly occurredAt = new Date();

  constructor(
    readonly aggregateId: string,
    readonly serverSeedHash: string,
    readonly clientSeed: string,
  ) {}
}
