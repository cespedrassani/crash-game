import { Injectable, BadRequestException, Inject } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { RoundRepository } from "../../../domain/round/round.repository";
import { ROUND_REPOSITORY } from "../../../domain/round/round.repository.token";
import { RoundPhase } from "../../../domain/round/round-phase.enum";
import { Bet } from "../../../domain/bet/bet.entity";
import { OutboxEntry } from "../../../domain/outbox/outbox-entry";
import { WalletCommandsPublisher } from "../../../infrastructure/messaging/wallet-commands.publisher";
import { GameGateway } from "../../../infrastructure/websocket/game.gateway";
import { GameEngineService } from "../../services/game-engine.service";
import { RoundNotRunningError } from "../../../domain/errors/round-not-running.error";
import { BetNotFoundError } from "../../../domain/errors/bet-not-found.error";
import { PlayerAlreadyCashedOutError } from "../../../domain/errors/player-already-cashed-out.error";
import { WalletEventTypes } from "@crash/events";

export interface CashoutCommand {
  playerId: string;
}

@Injectable()
export class CashoutHandler {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
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

    const idempotencyKey = `credit:${bet.id}`;
    const outboxEntry: OutboxEntry = {
      routingKey: WalletEventTypes.CREDIT_REQUESTED,
      payload: {
        metadata: {
          eventId: randomUUID(),
          eventType: WalletEventTypes.CREDIT_REQUESTED,
          correlationId: bet.id,
          idempotencyKey,
          occurredAt: new Date().toISOString(),
          version: 1,
        },
        payload: {
          betId: bet.id,
          roundId: round.id,
          playerId: command.playerId,
          amountCents: Number(bet.payoutCents!),
          multiplierX100: currentMultiplierX100,
        },
      },
    };

    await this.roundRepository.save(round, [outboxEntry]);

    this.gateway.emitBetCashedOut({
      betId: bet.id,
      playerId: command.playerId,
      username: bet.username,
      multiplierX100: currentMultiplierX100,
      payoutCents: bet.payoutCents!.toString(),
    });

    return bet;
  }
}
