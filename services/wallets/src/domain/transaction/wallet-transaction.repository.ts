export interface WalletTransactionRepository {
  existsByIdempotencyKey(idempotencyKey: string): Promise<boolean>;
}
