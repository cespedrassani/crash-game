import { RoundPhase } from "../round/round-phase.enum";

export class RoundNotInBettingPhaseError extends Error {
  constructor(currentPhase: RoundPhase) {
    super(`Round is not in betting phase. Current phase: ${currentPhase}`);
    this.name = "RoundNotInBettingPhaseError";
  }
}
