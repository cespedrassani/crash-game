import { DomainEvent } from "./domain-event";

export class WalletDebitedEvent implements DomainEvent {
  readonly occurredAt = new Date();

  constructor(
    readonly aggregateId: string,
    readonly playerId: string,
    readonly amountCents: bigint,
    readonly balanceAfterCents: bigint,
    readonly idempotencyKey: string,
    readonly referenceId: string,
  ) {}
}
