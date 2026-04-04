"use client";

import { useQuery } from "@tanstack/react-query";
import { walletService } from "@/services/walletService";
import { useGameStore } from "@/store/gameStore";

export function useWallet() {
  const wsBalance = useGameStore((s) => s.walletBalance);

  const query = useQuery({
    queryKey: ["wallet", "me"],
    queryFn: () => walletService.getMyWallet(),
    staleTime: 10_000,
  });

  const balance = wsBalance ?? query.data?.balance ?? null;

  return { ...query, balance };
}
