import { Injectable } from "@nestjs/common";
import { Round } from "../../domain/round/round.entity";
import { RoundRepository } from "../../domain/round/round.repository";
import { GameEngineService } from "../services/game-engine.service";

@Injectable()
export class GetCurrentRoundHandler {
  constructor(
    private readonly roundRepository: RoundRepository,
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
