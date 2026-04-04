import { DomainEvent } from "./domain-event";

export class RoundCrashedEvent implements DomainEvent {
  readonly occurredAt = new Date();

  constructor(
    readonly aggregateId: string,
    readonly crashPointX100: number,
    readonly serverSeed: string,
  ) {}
}
