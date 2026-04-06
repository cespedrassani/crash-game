import { Injectable, BadRequestException, HttpException, HttpStatus, Inject } from "@nestjs/common";
import { DebitFailedReason } from "@crash/events";
import type { RoundRepository } from "../../../domain/round/round.repository";
import { ROUND_REPOSITORY } from "../../../domain/round/round.repository.token";
import { Bet } from "../../../domain/bet/bet.entity";
import { WalletCommandsPublisher } from "../../../infrastructure/messaging/wallet-commands.publisher";
import { GameGateway } from "../../../infrastructure/websocket/game.gateway";
import { PendingDebitRegistry } from "../../services/pending-debit.registry";
import { RoundNotInBettingPhaseError } from "../../../domain/errors/round-not-in-betting-phase.error";
import { PlayerAlreadyBetError } from "../../../domain/errors/player-already-bet.error";
import { InvalidAmountError } from "../../../domain/errors/invalid-amount.error";

export interface PlaceBetCommand {
  playerId: string;
  username: string;
  amountCents: bigint;
}

@Injectable()
export class PlaceBetHandler {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
    private readonly publisher: WalletCommandsPublisher,
    private readonly gateway: GameGateway,
    private readonly pendingDebits: PendingDebitRegistry,
  ) {}

  async execute(command: PlaceBetCommand): Promise<Bet> {
    const round = await this.roundRepository.findCurrent();
    if (!round) {
      throw new BadRequestException("No active betting phase");
    }

    let bet: Bet;
    try {
      bet = round.placeBet(command.playerId, command.username, command.amountCents);
    } catch (err) {
      if (err instanceof RoundNotInBettingPhaseError) {
        throw new BadRequestException("Betting phase is not active");
      }
      if (err instanceof PlayerAlreadyBetError) {
        throw new BadRequestException("You already have a bet in this round");
      }
      if (err instanceof InvalidAmountError) {
        throw new BadRequestException((err as Error).message);
      }
      throw err;
    }

    const debitReply = this.pendingDebits.wait(bet.id);

    await this.publisher.publishDebitRequested({
      betId: bet.id,
      roundId: round.id,
      playerId: command.playerId,
      amountCents: Number(command.amountCents),
    });

    const result = await debitReply;

    if (!result.success) {
      if (result.reason === DebitFailedReason.INSUFFICIENT_FUNDS) {
        throw new BadRequestException("Insufficient funds");
      }
      if (result.reason === DebitFailedReason.WALLET_NOT_FOUND) {
        throw new BadRequestException("Wallet not found — create your wallet first");
      }
      throw new HttpException("Debit failed", HttpStatus.PAYMENT_REQUIRED);
    }

    await this.roundRepository.save(round);

    this.gateway.emitBetPlaced({
      betId: bet.id,
      playerId: command.playerId,
      username: command.username,
      amountCents: command.amountCents.toString(),
    });

    return bet;
  }
}
