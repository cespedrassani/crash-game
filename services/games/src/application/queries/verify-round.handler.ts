import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import type { RoundRepository } from "../../domain/round/round.repository";
import { ROUND_REPOSITORY } from "../../domain/round/round.repository.token";
import { ProvablyFairService, CrashPointDerivation } from "../../domain/provably-fair/provably-fair.service";
import { RoundPhase } from "../../domain/round/round-phase.enum";

export interface VerifyRoundQuery {
  roundId: string;
}

export type VerifyRoundResult =
  | {
      roundId: string;
      verified: true;
      serverSeed: string;
      serverSeedHash: string;
      clientSeed: string;
      crashPointX100: number;
      derivation: CrashPointDerivation;
    }
  | {
      roundId: string;
      verified: false;
      reason: string;
      serverSeedHash: string;
      clientSeed: string;
    };

const VERIFIABLE_PHASES: RoundPhase[] = [RoundPhase.CRASHED, RoundPhase.FINISHED];

@Injectable()
export class VerifyRoundHandler {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
  ) {}

  async execute(query: VerifyRoundQuery): Promise<VerifyRoundResult> {
    const round = await this.roundRepository.findById(query.roundId);
    if (!round) {
      throw new NotFoundException(`Round ${query.roundId} not found`);
    }

    if (!VERIFIABLE_PHASES.includes(round.phase)) {
      return {
        roundId: round.id,
        verified: false,
        reason: "Round has not crashed yet. Server seed is not revealed until after crash.",
        serverSeedHash: round.serverSeedHash,
        clientSeed: round.clientSeed,
      };
    }

    const derivation = ProvablyFairService.deriveDetails(round.serverSeed, round.clientSeed);

    const isVerified = derivation.crashPointX100 === round.crashPoint.valueX100;
    if (!isVerified) {
      return {
        roundId: round.id,
        verified: false,
        reason: "Verification failed: derived crash point does not match stored value.",
        serverSeedHash: round.serverSeedHash,
        clientSeed: round.clientSeed,
      };
    }

    return {
      roundId: round.id,
      verified: true,
      serverSeed: round.serverSeed,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      crashPointX100: round.crashPoint.valueX100,
      derivation,
    };
  }
}
