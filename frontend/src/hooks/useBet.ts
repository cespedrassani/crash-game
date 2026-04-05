"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gameService } from "@/services/gameService";

export function useBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => gameService.placeBet(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bets", "me"] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Erro ao registrar aposta.");
    },
  });
}
