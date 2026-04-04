export type BetStatus = "pending" | "won" | "lost";

export interface Bet {
  id: string;
  playerId: string;
  username: string;
  amount: number;
  status: BetStatus;
  cashoutMultiplier?: number;
  payout?: number;
  roundId: string;
}

export interface LiveBet {
  playerId: string;
  username: string;
  amount: number;
  status: BetStatus;
  cashoutMultiplier?: number;
  payout?: number;
}
