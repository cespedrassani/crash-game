import { TransactionType } from "./transaction-type.enum";

export class WalletTransaction {
  constructor(
    readonly id: string,
    readonly walletId: string,
    readonly type: TransactionType,
    readonly amountCents: bigint,
    readonly balanceAfterCents: bigint,
    readonly idempotencyKey: string,
    readonly description: string,
    readonly referenceId: string,
    readonly createdAt: Date,
  ) {}
}
