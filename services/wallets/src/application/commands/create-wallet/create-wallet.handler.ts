import { Injectable, Inject, ConflictException } from "@nestjs/common";
import { Wallet } from "../../../domain/wallet/wallet.entity";
import { WalletRepositoryPort, WALLET_REPOSITORY } from "../../ports/wallet-repository.port";

export interface CreateWalletCommand {
  playerId: string;
  username: string;
}

@Injectable()
export class CreateWalletHandler {
  constructor(
    @Inject(WALLET_REPOSITORY) private readonly walletRepository: WalletRepositoryPort,
  ) {}

  async execute(command: CreateWalletCommand): Promise<Wallet> {
    const existing = await this.walletRepository.findByPlayerId(command.playerId);
    if (existing) {
      throw new ConflictException("Wallet already exists for this player");
    }

    const wallet = Wallet.create(command.playerId, command.username);
    await this.walletRepository.save(wallet);
    return wallet;
  }
}
