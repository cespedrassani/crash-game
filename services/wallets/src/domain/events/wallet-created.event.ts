import { DomainEvent } from "./domain-event";

export class WalletCreatedEvent implements DomainEvent {
  readonly occurredAt = new Date();

  constructor(
    readonly aggregateId: string,
    readonly playerId: string,
    readonly username: string,
  ) {}
}
