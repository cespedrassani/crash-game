"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { walletService } from "@/services/walletService";
import { DepositModal } from "./DepositModal";

interface WalletCreatePromptProps {
  variant?: "text" | "icon";
}

export function WalletCreatePrompt({ variant = "text" }: WalletCreatePromptProps) {
  const queryClient = useQueryClient();
  const [depositOpen, setDepositOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => walletService.createWallet(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "me"] });
      setDepositOpen(true);
    },
    onError: () => {
      toast.error("Erro ao criar carteira.");
    },
  });

  return (
    <>
      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />

      {variant === "icon" ? (
        <button
          onClick={() => mutate()}
          disabled={isPending}
          title="Criar carteira"
          className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <span className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 12V22H4V12" />
              <path d="M22 7H2v5h20V7z" />
              <path d="M12 22V7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          )}
        </button>
      ) : (
        <div className="flex flex-col items-end gap-0.5">
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="text-xs text-primary hover:underline disabled:opacity-50"
          >
            {isPending ? "Criando..." : "Criar carteira"}
          </button>
        </div>
      )}
    </>
  );
}
