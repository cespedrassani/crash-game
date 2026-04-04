import { Injectable, BadRequestException } from "@nestjs/common";
import { RoundRepository } from "../../../domain/round/round.repository";
import { RoundPhase } from "../../../domain/round/round-phase.enum";
import { Bet } from "../../../domain/bet/bet.entity";
import { WalletCommandsPublisher } from "../../../infrastructure/messaging/wallet-commands.publisher";
import { GameGateway } from "../../../infrastructure/websocket/game.gateway";
import { GameEngineService } from "../../services/game-engine.service";
import { RoundNotRunningError } from "../../../domain/errors/round-not-running.error";
import { BetNotFoundError } from "../../../domain/errors/bet-not-found.error";
import { PlayerAlreadyCashedOutError } from "../../../domain/errors/player-already-cashed-out.error";

export interface CashoutCommand {
  playerId: string;
}

@Injectable()
export class CashoutHandler {
  constructor(
    private readonly roundRepository: RoundRepository,
    private readonly publisher: WalletCommandsPublisher,
    private readonly gateway: GameGateway,
    private readonly gameEngine: GameEngineService,
  ) {}

  async execute(command: CashoutCommand): Promise<Bet> {
    const round = await this.roundRepository.findCurrent();
    if (!round || round.phase !== RoundPhase.RUNNING) {
      throw new BadRequestException("No active round to cash out from");
    }

    const currentMultiplierX100 = this.gameEngine.getCurrentMultiplierX100();

    let bet: Bet;
    try {
      bet = round.cashOut(command.playerId, currentMultiplierX100);
    } catch (err) {
      if (err instanceof RoundNotRunningError) {
        throw new BadRequestException("Round is not running");
      }
      if (err instanceof BetNotFoundError) {
        throw new BadRequestException("You have no bet in this round");
      }
      if (err instanceof PlayerAlreadyCashedOutError) {
        throw new BadRequestException("You have already cashed out");
      }
      throw err;
    }

    await this.roundRepository.save(round);

    this.gateway.emitBetCashedOut({
      betId: bet.id,
      playerId: command.playerId,
      username: bet.username,
      multiplierX100: currentMultiplierX100,
      payoutCents: bet.payoutCents!.toString(),
    });

    await this.publisher.publishCreditRequested({
      betId: bet.id,
      roundId: round.id,
      playerId: command.playerId,
      amountCents: Number(bet.payoutCents!),
      multiplierX100: currentMultiplierX100,
    });

    return bet;
  }
}
