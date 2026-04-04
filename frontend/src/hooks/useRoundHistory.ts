"use client";

import { useQuery } from "@tanstack/react-query";
import { gameService } from "@/services/gameService";

export function useRoundHistory(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["rounds", "history", page, limit],
    queryFn: () => gameService.getRoundHistory(page, limit),
    staleTime: 5_000,
  });
}
