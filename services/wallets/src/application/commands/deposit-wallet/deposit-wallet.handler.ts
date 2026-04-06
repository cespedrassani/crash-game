import { Injectable, Inject } from "@nestjs/common";
import { Money } from "../../../domain/value-objects/money.vo";
import { type WalletRepositoryPort, WALLET_REPOSITORY } from "../../ports/wallet-repository.port";
import {
  type WalletTransactionRepositoryPort,
  WALLET_TRANSACTION_REPOSITORY,
} from "../../ports/wallet-transaction-repository.port";
import { WalletNotFoundError } from "../../../domain/errors/wallet-not-found.error";
import { Wallet } from "../../../domain/wallet/wallet.entity";

export interface DepositWalletCommand {
  playerId: string;
  amountCents: number;
  idempotencyKey: string;
}

@Injectable()
export class DepositWalletHandler {
  constructor(
    @Inject(WALLET_REPOSITORY) private readonly walletRepository: WalletRepositoryPort,
    @Inject(WALLET_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: WalletTransactionRepositoryPort,
  ) {}

  async execute(command: DepositWalletCommand): Promise<Wallet> {
    const alreadyProcessed = await this.transactionRepository.existsByIdempotencyKey(
      command.idempotencyKey,
    );
    if (alreadyProcessed) {
      const wallet = await this.walletRepository.findByPlayerId(command.playerId);
      if (!wallet) throw new WalletNotFoundError(command.playerId);
      return wallet;
    }

    const wallet = await this.walletRepository.findByPlayerId(command.playerId);
    if (!wallet) throw new WalletNotFoundError(command.playerId);

    wallet.credit(
      Money.of(BigInt(command.amountCents)),
      command.idempotencyKey,
      "Depósito",
      "deposit",
    );

    await this.walletRepository.save(wallet);
    return wallet;
  }
}
