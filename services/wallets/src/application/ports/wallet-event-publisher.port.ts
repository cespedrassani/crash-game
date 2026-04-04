import { CreditFailedReason, DebitFailedReason } from "@crash/events";

export const WALLET_EVENT_PUBLISHER = "WALLET_EVENT_PUBLISHER";

export interface WalletEventPublisherPort {
  publishDebitConfirmed(
    betId: string,
    playerId: string,
    amountCents: bigint,
    balanceAfterCents: bigint,
  ): Promise<void>;

  publishDebitFailed(
    betId: string,
    playerId: string,
    reason: DebitFailedReason,
    balanceCents: bigint,
  ): Promise<void>;

  publishCreditConfirmed(
    betId: string,
    playerId: string,
    amountCents: bigint,
    balanceAfterCents: bigint,
  ): Promise<void>;

  publishCreditFailed(
    betId: string,
    playerId: string,
    reason: CreditFailedReason,
  ): Promise<void>;
}
