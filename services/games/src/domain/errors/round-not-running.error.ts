import { RoundPhase } from "../round/round-phase.enum";

export class RoundNotRunningError extends Error {
  constructor(currentPhase: RoundPhase) {
    super(`Round is not in running phase. Current phase: ${currentPhase}`);
    this.name = "RoundNotRunningError";
  }
}
