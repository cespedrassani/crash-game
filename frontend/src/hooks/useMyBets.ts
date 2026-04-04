"use client";

import { useQuery } from "@tanstack/react-query";
import { gameService } from "@/services/gameService";

export function useMyBets(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["bets", "me", page, limit],
    queryFn: () => gameService.getMyBets(page, limit),
    staleTime: 5_000,
  });
}
