"use client";

import { useState, useEffect, useRef } from "react";
import { useGameState } from "@/hooks/useGameState";
import { useWallet } from "@/hooks/useWallet";
import { useBet } from "@/hooks/useBet";
import { useCashout } from "@/hooks/useCashout";
import { formatMoney } from "@/utils/formatMoney";
import { formatMultiplier } from "@/utils/formatMultiplier";
import { cn } from "@/utils/cn";

const MIN_BET_CENTS = 100;
const MAX_BET_CENTS = 100_000;

const MIN_AUTO_X100 = 101;
const MAX_AUTO_X100 = 100_000;

function formatAutoCashout(x100: number): string {
  const int = Math.floor(x100 / 100);
  const dec = (x100 % 100).toString().padStart(2, "0");
  return `${int}.${dec}`;
}

export function BetControls() {
  const [amountCents, setAmountCents] = useState(1000);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(false);
  const [autoCashoutX100, setAutoCashoutX100] = useState(200); // 2.00x
  const hasTriggeredRef = useRef(false);

  const {
    canBet,
    canCashout,
    potentialPayout,
    multiplier,
    isBettingPhase,
    isRunning,
  } = useGameState();
  const { balance, hasNoWallet } = useWallet();
  const bet = useBet();
  const cashout = useCashout();

  useEffect(() => {
    if (isBettingPhase) {
      hasTriggeredRef.current = false;
    }
  }, [isBettingPhase]);

  useEffect(() => {
    if (!autoCashoutEnabled) return;
    if (!isRunning || !canCashout) return;
    if (cashout.isPending || hasTriggeredRef.current) return;
    if (autoCashoutX100 < MIN_AUTO_X100) return;

    const targetMultiplier = autoCashoutX100 / 100;
    if (multiplier >= targetMultiplier) {
      hasTriggeredRef.current = true;
      cashout.mutate();
    }
  }, [
    multiplier,
    autoCashoutEnabled,
    autoCashoutX100,
    isRunning,
    canCashout,
    cashout,
  ]);

  function handleAmountKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
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

  function handleAutoKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      setAutoCashoutX100((prev) => Math.max(0, Math.floor(prev / 10)));
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    const next = autoCashoutX100 * 10 + parseInt(e.key);
    if (next > MAX_AUTO_X100) return;
    setAutoCashoutX100(next);
  }

  function handleBet() {
    if (
      hasNoWallet ||
      amountCents < MIN_BET_CENTS ||
      amountCents > MAX_BET_CENTS
    )
      return;
    if (balance !== null && amountCents > balance) return;
    bet.mutate(amountCents);
  }

  const isValidAmount =
    !hasNoWallet &&
    amountCents >= MIN_BET_CENTS &&
    amountCents <= MAX_BET_CENTS &&
    (balance === null || amountCents <= balance);

  const isValidAutoTarget = autoCashoutX100 >= MIN_AUTO_X100;

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
          onKeyDown={handleAmountKeyDown}
          onChange={() => {}}
          disabled={!isBettingPhase || bet.isPending}
          className={cn(
            "flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm font-mono text-white",
            "focus:outline-none focus:border-primary",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        />
        <div className="flex items-center gap-1">
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

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={autoCashoutEnabled}
          onClick={() => setAutoCashoutEnabled((v) => !v)}
          disabled={!isBettingPhase}
          className={cn(
            "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
            "transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed",
            autoCashoutEnabled ? "bg-primary" : "bg-surface-3",
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow",
              "transition-transform duration-200",
              autoCashoutEnabled ? "translate-x-4" : "translate-x-0",
            )}
          />
        </button>

        <span className="text-xs text-muted whitespace-nowrap">
          Auto cashout em
        </span>

        <div className="flex items-center gap-1 flex-1 min-w-0">
          <input
            type="text"
            inputMode="none"
            value={formatAutoCashout(autoCashoutX100)}
            onKeyDown={handleAutoKeyDown}
            onChange={() => {}}
            disabled={!autoCashoutEnabled || !isBettingPhase}
            className={cn(
              "w-full bg-surface border rounded-lg px-2 py-1.5 text-sm font-mono text-white text-right",
              "focus:outline-none focus:border-primary",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              autoCashoutEnabled && isValidAutoTarget
                ? "border-primary/60"
                : "border-border",
            )}
          />
          <span className="text-xs text-muted shrink-0">x</span>
        </div>
      </div>

      {autoCashoutEnabled && isValidAutoTarget && isRunning && canCashout && (
        <p className="text-xs text-center text-primary/80 animate-pulse">
          Auto cashout ativo em {formatMultiplier(autoCashoutX100 / 100)}
        </p>
      )}

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
            : hasNoWallet
              ? "Configurando carteira..."
              : !isBettingPhase
                ? "Aguardando fase de apostas"
                : "Apostar"}
        </button>
      )}
    </div>
  );
}
