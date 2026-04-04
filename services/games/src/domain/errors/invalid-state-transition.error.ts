import { RoundPhase } from "../round/round-phase.enum";

export class InvalidStateTransitionError extends Error {
  constructor(from: RoundPhase, to: RoundPhase) {
    super(`Invalid state transition from ${from} to ${to}`);
    this.name = "InvalidStateTransitionError";
  }
}
