import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { Wallet } from "../../domain/wallet/wallet.entity";
import { WalletRepositoryPort, WALLET_REPOSITORY } from "../ports/wallet-repository.port";

export interface GetMyWalletQuery {
  playerId: string;
}

@Injectable()
export class GetMyWalletHandler {
  constructor(
    @Inject(WALLET_REPOSITORY) private readonly walletRepository: WalletRepositoryPort,
  ) {}

  async execute(query: GetMyWalletQuery): Promise<Wallet> {
    const wallet = await this.walletRepository.findByPlayerId(query.playerId);
    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }
    return wallet;
  }
}
