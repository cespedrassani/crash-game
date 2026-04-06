import { Injectable, Inject } from "@nestjs/common";
import { Round } from "../../domain/round/round.entity";
import type { RoundRepository } from "../../domain/round/round.repository";
import { ROUND_REPOSITORY } from "../../domain/round/round.repository.token";
import { GameEngineService } from "../services/game-engine.service";

@Injectable()
export class GetCurrentRoundHandler {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
    private readonly gameEngine: GameEngineService,
  ) {}

  async execute(): Promise<{ round: Round; currentMultiplierX100: number } | null> {
    const round = await this.roundRepository.findCurrent();
    if (!round) return null;
    return {
      round,
      currentMultiplierX100: this.gameEngine.getCurrentMultiplierX100(),
    };
  }
}
