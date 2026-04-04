import { DomainEvent } from "./domain-event";

export class BetCashedOutEvent implements DomainEvent {
  readonly occurredAt = new Date();

  constructor(
    readonly aggregateId: string,
    readonly betId: string,
    readonly playerId: string,
    readonly username: string,
    readonly multiplierX100: number,
    readonly payoutCents: bigint,
  ) {}
}
