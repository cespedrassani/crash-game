export const WALLET_TRANSACTION_REPOSITORY = "WALLET_TRANSACTION_REPOSITORY";

export interface WalletTransactionRepositoryPort {
  existsByIdempotencyKey(idempotencyKey: string): Promise<boolean>;
}
