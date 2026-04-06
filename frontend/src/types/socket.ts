import type { LiveBet } from "./bet";
import type { RoundPhase } from "./round";

export interface SocketRoundBettingPayload {
  roundId: string;
  timeLeft: number;
  seedHash: string;
}

export interface SocketRoundStartedPayload {
  roundId: string;
}

export interface SocketRoundTickPayload {
  multiplier: number;
  elapsedMs: number;
}

export interface SocketRoundCrashedPayload {
  roundId: string;
  crashPoint: number;
  serverSeed: string;
}

export interface SocketBetPlacedPayload {
  playerId: string;
  username: string;
  amount: number;
}

export interface SocketCashoutPayload {
  playerId: string;
  username: string;
  multiplier: number;
  payout: number;
}

export interface SocketWalletUpdatedPayload {
  balance: number;
}

export interface SocketRoundStatePayload {
  roundId: string;
  phase: RoundPhase;
  multiplier: number;
  elapsedMs: number;
  timeLeft: number | null;
  seedHash: string;
  bets: LiveBet[];
}

export type SocketEventMap = {
  "round:betting": SocketRoundBettingPayload;
  "round:started": SocketRoundStartedPayload;
  "round:tick": SocketRoundTickPayload;
  "round:crashed": SocketRoundCrashedPayload;
  "round:bet": SocketBetPlacedPayload;
  "round:cashout": SocketCashoutPayload;
  "wallet:updated": SocketWalletUpdatedPayload;
  "round:state": SocketRoundStatePayload;
};
