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
    refetchInterval: 15_000,
    retry: (failureCount, error: unknown) => {
      if ((error as { status?: number })?.status === 404) return false;
      return failureCount < 2;
    },
  });

  const httpBalance =
    query.data?.balanceCents != null ? Number(query.data.balanceCents) : null;

  const balance = wsBalance ?? httpBalance ?? null;
  const hasNoWallet =
    query.isError && (query.error as { status?: number })?.status === 404;

  return { ...query, balance, hasNoWallet };
}
