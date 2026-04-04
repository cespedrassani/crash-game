"use client";

import { useGameStore } from "@/store/gameStore";
import { useAuthStore } from "@/store/authStore";

export function useGameState() {
  const phase = useGameStore((s) => s.phase);
  const multiplier = useGameStore((s) => s.multiplier);
  const crashPoint = useGameStore((s) => s.crashPoint);
  const serverSeed = useGameStore((s) => s.serverSeed);
  const seedHash = useGameStore((s) => s.seedHash);
  const timeLeft = useGameStore((s) => s.timeLeft);
  const bets = useGameStore((s) => s.bets);
  const roundId = useGameStore((s) => s.roundId);

  const currentUser = useAuthStore((s) => s.user);
  const myBet = bets.find((b) => b.playerId === currentUser?.sub);

  const isBettingPhase = phase === "betting";
  const isRunning = phase === "running";
  const isCrashed = phase === "crashed";
  const canBet = isBettingPhase && !myBet;
  const canCashout = isRunning && !!myBet && myBet.status === "pending";

  const potentialPayout = myBet ? Math.floor(myBet.amount * multiplier) : null;

  return {
    phase,
    multiplier,
    crashPoint,
    serverSeed,
    seedHash,
    timeLeft,
    bets,
    roundId,
    myBet,
    isBettingPhase,
    isRunning,
    isCrashed,
    canBet,
    canCashout,
    potentialPayout,
  };
}
