"use client";

import { useState } from "react";
import { useGameState } from "@/hooks/useGameState";
import { useWallet } from "@/hooks/useWallet";
import { useBet } from "@/hooks/useBet";
import { useCashout } from "@/hooks/useCashout";
import { formatMoney } from "@/utils/formatMoney";
import { formatMultiplier } from "@/utils/formatMultiplier";
import { cn } from "@/utils/cn";

const MIN_BET_CENTS = 100;
const MAX_BET_CENTS = 100_000;

export function BetControls() {
  const [amountCents, setAmountCents] = useState(1000);
  const { canBet, canCashout, potentialPayout, multiplier, isBettingPhase } =
    useGameState();
  const { balance } = useWallet();
  const bet = useBet();
  const cashout = useCashout();

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleBet();
      return;
    }
    if (e.key === "Backspace") {
      setAmountCents((prev) => Math.floor(prev / 10));
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    const next = amountCents * 10 + parseInt(e.key);
    if (next > MAX_BET_CENTS * 100) return;
    setAmountCents(next);
  }

  function handleBet() {
    if (amountCents < MIN_BET_CENTS || amountCents > MAX_BET_CENTS) return;
    if (balance !== null && amountCents > balance) return;
    bet.mutate(amountCents);
  }

  const isValidAmount =
    amountCents >= MIN_BET_CENTS &&
    amountCents <= MAX_BET_CENTS &&
    (balance === null || amountCents <= balance);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-surface-2 border border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted uppercase tracking-wide">
          Valor da aposta
        </span>
        {balance !== null && (
          <span className="text-xs text-foreground-muted">
            Saldo: R$ {formatMoney(balance)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">R$</span>
        <input
          type="text"
          inputMode="none"
          value={formatMoney(amountCents)}
          onKeyDown={handleKeyDown}
          onChange={() => {}}
          disabled={!isBettingPhase || bet.isPending}
          className={cn(
            "flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm font-mono text-white",
            "focus:outline-none focus:border-primary",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        />
        <div className="overflow-auto flex items-center scrollbar-none">
          {[500, 1000, 5000].map((v) => (
            <button
              key={v}
              onClick={() => setAmountCents(v)}
              disabled={!isBettingPhase}
              className="px-2 py-1 rounded text-xs bg-surface border border-border text-foreground-muted hover:border-primary disabled:opacity-40"
            >
              {v / 100}
            </button>
          ))}
        </div>
      </div>

      {canCashout ? (
        <button
          onClick={() => cashout.mutate()}
          disabled={cashout.isPending}
          className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-bold text-sm transition-colors disabled:opacity-60"
        >
          {cashout.isPending
            ? "Sacando..."
            : `Cash Out — ${formatMultiplier(multiplier)} · R$ ${potentialPayout ? formatMoney(potentialPayout) : "—"}`}
        </button>
      ) : (
        <button
          onClick={handleBet}
          disabled={!canBet || !isValidAmount || bet.isPending}
          className={cn(
            "w-full py-3 rounded-lg font-bold text-sm transition-colors",
            canBet && isValidAmount
              ? "bg-primary hover:bg-primary-hover text-white"
              : "bg-surface text-muted cursor-not-allowed",
          )}
        >
          {bet.isPending
            ? "Registrando..."
            : !isBettingPhase
              ? "Aguardando fase de apostas"
              : "Apostar"}
        </button>
      )}
    </div>
  );
}
