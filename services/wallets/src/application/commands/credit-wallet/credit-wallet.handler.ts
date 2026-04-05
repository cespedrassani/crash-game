import { Injectable, Inject, Logger } from "@nestjs/common";
import { Money } from "../../../domain/value-objects/money.vo";
import { type WalletRepositoryPort, WALLET_REPOSITORY } from "../../ports/wallet-repository.port";
import {
  type WalletTransactionRepositoryPort,
  WALLET_TRANSACTION_REPOSITORY,
} from "../../ports/wallet-transaction-repository.port";
import {
  type WalletEventPublisherPort,
  WALLET_EVENT_PUBLISHER,
} from "../../ports/wallet-event-publisher.port";
import { CreditFailedReason } from "@crash/events";

export interface CreditWalletCommand {
  betId: string;
  playerId: string;
  amountCents: number;
  multiplierX100: number;
}

@Injectable()
export class CreditWalletHandler {
  private readonly logger = new Logger(CreditWalletHandler.name);

  constructor(
    @Inject(WALLET_REPOSITORY) private readonly walletRepository: WalletRepositoryPort,
    @Inject(WALLET_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: WalletTransactionRepositoryPort,
    @Inject(WALLET_EVENT_PUBLISHER) private readonly publisher: WalletEventPublisherPort,
  ) {}

  async execute(command: CreditWalletCommand): Promise<void> {
    const idempotencyKey = `credit:${command.betId}`;

    const alreadyProcessed = await this.transactionRepository.existsByIdempotencyKey(
      idempotencyKey,
    );
    if (alreadyProcessed) {
      return;
    }

    const wallet = await this.walletRepository.findByPlayerId(command.playerId);
    if (!wallet) {
      this.logger.error(`Wallet not found for cashout credit: playerId=${command.playerId}`);
      await this.publisher.publishCreditFailed(
        command.betId,
        command.playerId,
        CreditFailedReason.WALLET_NOT_FOUND,
      );
      return;
    }

    wallet.credit(
      Money.of(BigInt(command.amountCents)),
      idempotencyKey,
      `Cashout #${command.betId} at ${(command.multiplierX100 / 100).toFixed(2)}x`,
      command.betId,
    );
    await this.walletRepository.save(wallet);
    await this.publisher.publishCreditConfirmed(
      command.betId,
      command.playerId,
      BigInt(command.amountCents),
      wallet.balanceCents,
    );
  }
}
