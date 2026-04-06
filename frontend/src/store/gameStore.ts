import { create } from "zustand";
import type { LiveBet } from "@/types/bet";
import type { RoundPhase } from "@/types/round";

export interface GameState {
  roundId: string | null;
  phase: RoundPhase;
  multiplier: number;
  elapsedMs: number;
  crashPoint: number | null;
  serverSeed: string | null;
  seedHash: string | null;
  timeLeft: number | null;
  bets: LiveBet[];
  walletBalance: number | null;
}

interface GameActions {
  setPhase: (phase: RoundPhase) => void;
  setMultiplier: (multiplier: number, elapsedMs: number) => void;
  setRound: (roundId: string, seedHash: string) => void;
  setTimeLeft: (timeLeft: number) => void;
  setCrashed: (crashPoint: number, serverSeed: string) => void;
  addBet: (bet: LiveBet) => void;
  updateBetCashout: (playerId: string, multiplier: number, payout: number) => void;
  setWalletBalance: (balance: number) => void;
  syncFromRest: (state: Partial<GameState>) => void;
  reset: () => void;
}

const INITIAL_STATE: GameState = {
  roundId: null,
  phase: "waiting",
  multiplier: 1.0,
  elapsedMs: 0,
  crashPoint: null,
  serverSeed: null,
  seedHash: null,
  timeLeft: null,
  bets: [],
  walletBalance: null,
};

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...INITIAL_STATE,

  setPhase: (phase) => set({ phase }),

  setMultiplier: (multiplier, elapsedMs) => set({ multiplier, elapsedMs }),

  setRound: (roundId, seedHash) =>
    set({ roundId, seedHash, crashPoint: null, serverSeed: null, bets: [], multiplier: 1.0, elapsedMs: 0 }),

  setTimeLeft: (timeLeft) => set({ timeLeft }),

  setCrashed: (crashPoint, serverSeed) =>
    set({ phase: "crashed", crashPoint, serverSeed }),

  addBet: (bet) =>
    set((s) => ({
      bets: s.bets.some((b) => b.playerId === bet.playerId)
        ? s.bets
        : [...s.bets, bet],
    })),

  updateBetCashout: (playerId, multiplier, payout) =>
    set((s) => ({
      bets: s.bets.map((b) =>
        b.playerId === playerId
          ? { ...b, status: "won" as const, cashoutMultiplier: multiplier, payout }
          : b
      ),
    })),

  setWalletBalance: (balance) => set({ walletBalance: balance }),

  syncFromRest: (state) => set(state),

  reset: () => set(INITIAL_STATE),
}));
