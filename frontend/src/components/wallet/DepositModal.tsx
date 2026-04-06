"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { walletService } from "@/services/walletService";
import { formatMoney } from "@/utils/formatMoney";
import { cn } from "@/utils/cn";

const PRESETS = [1000, 5000, 10000, 50000];
const MIN_DEPOSIT_CENTS = 100;
const MAX_DEPOSIT_CENTS = 100_000_00; // R$ 100.000,00

interface DepositModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DepositModal({
  children,
  open: controlledOpen,
  onOpenChange,
}: DepositModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;
  const [amountCents, setAmountCents] = useState(10000); // R$ 100,00
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (cents: number) => walletService.deposit(cents),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "me"] });
      setOpen(false);
      setAmountCents(10000);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Erro ao realizar depósito.");
    },
  });

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSubmit();
      return;
    }
    if (e.key === "Backspace") {
      setAmountCents((prev) => Math.floor(prev / 10));
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    const next = amountCents * 10 + parseInt(e.key);
    if (next > MAX_DEPOSIT_CENTS) return;
    setAmountCents(next);
  }

  function handleSubmit() {
    if (amountCents < MIN_DEPOSIT_CENTS || isPending) return;
    mutate(amountCents);
  }

  const isValid = amountCents >= MIN_DEPOSIT_CENTS;

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
                  onClick={() => setAmountCents(v)}
                  className="py-1.5 rounded-lg text-xs font-medium bg-surface border border-border text-foreground-muted hover:border-primary hover:text-foreground transition-colors"
                >
                  R$ {v / 100 >= 1000 ? `${v / 100000}k` : (v / 100).toFixed(0)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 focus-within:border-primary transition-colors">
              <span className="text-sm text-muted shrink-0">R$</span>
              <input
                type="text"
                inputMode="none"
                value={formatMoney(amountCents)}
                onKeyDown={handleKeyDown}
                onChange={() => {}}
                autoFocus
                className="flex-1 bg-transparent text-sm font-mono text-white focus:outline-none"
              />
            </div>

            {!isValid && amountCents > 0 && (
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
