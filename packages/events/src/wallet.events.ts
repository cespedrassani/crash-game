export enum DebitFailedReason {
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  WALLET_NOT_FOUND = "WALLET_NOT_FOUND",
}

export enum CreditFailedReason {
  WALLET_NOT_FOUND = "WALLET_NOT_FOUND",
}

export interface WalletDebitRequestedPayload {
  betId: string;
  roundId: string;
  playerId: string;
  amountCents: number;
}

export interface WalletDebitConfirmedPayload {
  betId: string;
  playerId: string;
  amountCents: number;
  balanceAfterCents: string;
}

export interface WalletDebitFailedPayload {
  betId: string;
  playerId: string;
  reason: DebitFailedReason;
  balanceCents: string;
}

export interface WalletCreditRequestedPayload {
  betId: string;
  roundId: string;
  playerId: string;
  amountCents: number;
  multiplierX100: number;
}

export interface WalletCreditConfirmedPayload {
  betId: string;
  playerId: string;
  amountCents: number;
  balanceAfterCents: string;
}

export interface WalletCreditFailedPayload {
  betId: string;
  playerId: string;
  reason: CreditFailedReason;
}

export enum WalletEventTypes {
  DEBIT_REQUESTED = "wallet.debit.requested",
  DEBIT_CONFIRMED = "wallet.debit.confirmed",
  DEBIT_FAILED = "wallet.debit.failed",
  CREDIT_REQUESTED = "wallet.credit.requested",
  CREDIT_CONFIRMED = "wallet.credit.confirmed",
  CREDIT_FAILED = "wallet.credit.failed",
}

export type WalletEventType = WalletEventTypes;
