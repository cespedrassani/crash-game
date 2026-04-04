import { DomainEvent } from "./domain-event";

export class BetPlacedEvent implements DomainEvent {
  readonly occurredAt = new Date();

  constructor(
    readonly aggregateId: string,
    readonly betId: string,
    readonly playerId: string,
    readonly username: string,
    readonly amountCents: bigint,
  ) {}
}
