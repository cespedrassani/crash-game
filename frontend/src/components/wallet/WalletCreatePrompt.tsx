"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { walletService } from "@/services/walletService";

export function WalletCreatePrompt() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => walletService.createWallet(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "me"] });
      toast.success("Carteira criada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar carteira.");
    },
  });

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-xs text-muted uppercase tracking-wide">Saldo</span>
      <button
        onClick={() => mutate()}
        disabled={isPending}
        className="text-xs text-primary hover:underline disabled:opacity-50"
      >
        {isPending ? "Criando..." : "Criar carteira"}
      </button>
    </div>
  );
}
