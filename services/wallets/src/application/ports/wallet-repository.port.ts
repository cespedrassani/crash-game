import { Wallet } from "../../domain/wallet/wallet.entity";
import { OutboxEntry } from "../../domain/outbox/outbox-entry";

export const WALLET_REPOSITORY = "WALLET_REPOSITORY";

export interface WalletRepositoryPort {
  findById(id: string): Promise<Wallet | null>;
  findByPlayerId(playerId: string): Promise<Wallet | null>;
  save(wallet: Wallet, outbox?: OutboxEntry[]): Promise<void>;
}
