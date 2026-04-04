import { Wallet } from "../../domain/wallet/wallet.entity";

export const WALLET_REPOSITORY = "WALLET_REPOSITORY";

export interface WalletRepositoryPort {
  findById(id: string): Promise<Wallet | null>;
  findByPlayerId(playerId: string): Promise<Wallet | null>;
  save(wallet: Wallet): Promise<void>;
}
