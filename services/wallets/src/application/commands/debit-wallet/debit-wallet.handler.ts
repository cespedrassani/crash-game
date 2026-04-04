import { Injectable, Inject } from "@nestjs/common";
import { Money } from "../../../domain/value-objects/money.vo";
import { WalletRepositoryPort, WALLET_REPOSITORY } from "../../ports/wallet-repository.port";
import {
  WalletTransactionRepositoryPort,
  WALLET_TRANSACTION_REPOSITORY,
} from "../../ports/wallet-transaction-repository.port";
import {
  WalletEventPublisherPort,
  WALLET_EVENT_PUBLISHER,
} from "../../ports/wallet-event-publisher.port";
import { WalletNotFoundError } from "../../../domain/errors/wallet-not-found.error";
import { InsufficientFundsError } from "../../../domain/errors/insufficient-funds.error";
import { DebitFailedReason } from "@crash/events";

export interface DebitWalletCommand {
  betId: string;
  playerId: string;
  amountCents: number;
}

export interface DebitWalletResult {
  success: boolean;
  balanceCents: bigint;
  reason?: DebitFailedReason;
}

@Injectable()
export class DebitWalletHandler {
  constructor(
    @Inject(WALLET_REPOSITORY) private readonly walletRepository: WalletRepositoryPort,
    @Inject(WALLET_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: WalletTransactionRepositoryPort,
    @Inject(WALLET_EVENT_PUBLISHER) private readonly publisher: WalletEventPublisherPort,
  ) {}

  async execute(command: DebitWalletCommand): Promise<DebitWalletResult> {
    const idempotencyKey = `debit:${command.betId}`;

    const alreadyProcessed = await this.transactionRepository.existsByIdempotencyKey(
      idempotencyKey,
    );
    if (alreadyProcessed) {
      const wallet = await this.walletRepository.findByPlayerId(command.playerId);
      return { success: true, balanceCents: wallet?.balanceCents ?? 0n };
    }

    const wallet = await this.walletRepository.findByPlayerId(command.playerId);
    if (!wallet) {
      await this.publisher.publishDebitFailed(
        command.betId,
        command.playerId,
        DebitFailedReason.WALLET_NOT_FOUND,
        0n,
      );
      return { success: false, balanceCents: 0n, reason: DebitFailedReason.WALLET_NOT_FOUND };
    }

    try {
      wallet.debit(
        Money.of(BigInt(command.amountCents)),
        idempotencyKey,
        `Bet #${command.betId}`,
        command.betId,
      );
      await this.walletRepository.save(wallet);
      await this.publisher.publishDebitConfirmed(
        command.betId,
        command.playerId,
        BigInt(command.amountCents),
        wallet.balanceCents,
      );
      return { success: true, balanceCents: wallet.balanceCents };
    } catch (err) {
      if (err instanceof InsufficientFundsError) {
        await this.publisher.publishDebitFailed(
          command.betId,
          command.playerId,
          DebitFailedReason.INSUFFICIENT_FUNDS,
          wallet.balanceCents,
        );
        return {
          success: false,
          balanceCents: wallet.balanceCents,
          reason: DebitFailedReason.INSUFFICIENT_FUNDS,
        };
      }
      throw err;
    }
  }
}
