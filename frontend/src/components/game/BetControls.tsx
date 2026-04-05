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
  const [inputValue, setInputValue] = useState("10,00");
  const { canBet, canCashout, potentialPayout, multiplier, isBettingPhase } = useGameState();
  const { balance } = useWallet();
  const bet = useBet();
  const cashout = useCashout();

  function parseInput(): number {
    const normalized = inputValue.replace(",", ".");
    const float = parseFloat(normalized);
    if (isNaN(float)) return 0;
    return Math.round(float * 100);
  }

  function handleBet() {
    const cents = parseInput();
    if (cents < MIN_BET_CENTS || cents > MAX_BET_CENTS) return;
    if (balance !== null && cents > balance) return;
    bet.mutate(cents);
  }

  const cents = parseInput();
  const isValidAmount =
    cents >= MIN_BET_CENTS &&
    cents <= MAX_BET_CENTS &&
    (balance === null || cents <= balance);

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
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!isBettingPhase || bet.isPending}
          placeholder="10,00"
          className={cn(
            "flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm font-mono text-white",
            "focus:outline-none focus:border-primary",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        />
        {[500, 1000, 5000].map((v) => (
          <button
            key={v}
            onClick={() => setInputValue((v / 100).toFixed(2).replace(".", ","))}
            disabled={!isBettingPhase}
            className="px-2 py-1 rounded text-xs bg-surface border border-border text-foreground-muted hover:border-primary disabled:opacity-40"
          >
            {v / 100}
          </button>
        ))}
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
