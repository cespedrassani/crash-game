export type RoundPhase = "waiting" | "betting" | "running" | "crashed";

export interface Round {
  id: string;
  phase: RoundPhase;
  seedHash: string;
  crashPoint?: number;
  serverSeed?: string;
  startedAt?: string;
  endedAt?: string;
  bets: import("./bet").Bet[];
}

export interface RoundHistoryItem {
  id: string;
  crashPoint: number;
  endedAt: string;
  seedHash: string;
}
