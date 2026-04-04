"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { gameService } from "@/services/gameService";
import { useGameStore } from "@/store/gameStore";

export function useCurrentRound() {
  const syncFromRest = useGameStore((s) => s.syncFromRest);

  const query = useQuery({
    queryKey: ["rounds", "current"],
    queryFn: () => gameService.getCurrentRound(),
    refetchInterval: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!query.data) return;
    const round = query.data;
    syncFromRest({
      roundId: round.id,
      phase: round.phase,
      seedHash: round.seedHash,
      bets: round.bets.map((b) => ({
        playerId: b.playerId,
        username: b.username,
        amount: b.amount,
        status: b.status,
        cashoutMultiplier: b.cashoutMultiplier,
        payout: b.payout,
      })),
    });
  }, [query.data, syncFromRest]);

  return query;
}
