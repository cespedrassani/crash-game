"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { walletService } from "@/services/walletService";
import { cn } from "@/utils/cn";

const PRESETS = [1000, 5000, 10000, 50000];

interface DepositModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DepositModal({ children, open: controlledOpen, onOpenChange }: DepositModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;
  const [inputValue, setInputValue] = useState("100,00");
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (amountCents: number) => walletService.deposit(amountCents),
    onSuccess: (wallet) => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "me"] });
      setOpen(false);
      setInputValue("100,00");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Erro ao realizar depósito.");
    },
  });

  function parseInput(): number {
    const normalized = inputValue.replace(",", ".");
    const float = parseFloat(normalized);
    if (isNaN(float)) return 0;
    return Math.round(float * 100);
  }

  function handleSubmit() {
    const cents = parseInput();
    if (cents < 100) return;
    mutate(cents);
  }

  const cents = parseInput();
  const isValid = cents >= 100;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {children && <Dialog.Trigger asChild>{children}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40 animate-in fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
            "w-full max-w-sm rounded-xl bg-surface-2 border border-border p-6 shadow-xl",
            "focus:outline-none",
          )}
        >
          <Dialog.Title className="text-base font-semibold text-foreground mb-1">
            Depositar
          </Dialog.Title>
          <Dialog.Description className="text-xs text-muted mb-5">
            Simule a inserção de dinheiro na sua carteira.
          </Dialog.Description>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((v) => (
                <button
                  key={v}
                  onClick={() =>
                    setInputValue((v / 100).toFixed(2).replace(".", ","))
                  }
                  className="py-1.5 rounded-lg text-xs font-medium bg-surface border border-border text-foreground-muted hover:border-primary hover:text-foreground transition-colors"
                >
                  R$ {v / 100 >= 1000 ? `${v / 10000}k` : (v / 100).toFixed(0)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 focus-within:border-primary transition-colors">
              <span className="text-sm text-muted shrink-0">R$</span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="0,00"
                className="flex-1 bg-transparent text-sm font-mono text-white focus:outline-none"
                autoFocus
              />
            </div>

            {!isValid && inputValue !== "" && (
              <p className="text-xs text-danger -mt-2">Valor mínimo: R$ 1,00</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!isValid || isPending}
              className={cn(
                "w-full py-2.5 rounded-lg font-semibold text-sm transition-colors",
                isValid && !isPending
                  ? "bg-primary hover:bg-primary-hover text-white"
                  : "bg-surface text-muted cursor-not-allowed",
              )}
            >
              {isPending ? "Depositando..." : "Confirmar depósito"}
            </button>
          </div>

          <Dialog.Close className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors text-lg leading-none">
            ✕
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
