import { Injectable, NotFoundException } from "@nestjs/common";
import { RoundRepository } from "../../domain/round/round.repository";
import { ProvalyFairService, CrashPointDerivation } from "../../domain/provably-fair/provably-fair.service";
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
  constructor(private readonly roundRepository: RoundRepository) {}

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

    const derivation = ProvalyFairService.deriveDetails(round.serverSeed, round.clientSeed);

    return {
      roundId: round.id,
      verified: derivation.crashPointX100 === round.crashPoint.valueX100,
      serverSeed: round.serverSeed,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      crashPointX100: round.crashPoint.valueX100,
      derivation,
    };
  }
}
