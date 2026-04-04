"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gameService } from "@/services/gameService";

export function useCashout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => gameService.cashout(),
    onSuccess: (bet) => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "me"] });
      queryClient.invalidateQueries({ queryKey: ["bets", "me"] });
      const mult = bet.cashoutMultiplier?.toFixed(2) ?? "?";
      toast.success(`Cashout realizado a ${mult}x! 🎉`);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Erro ao realizar cashout.");
    },
  });
}
