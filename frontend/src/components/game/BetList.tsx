"use client";

import { useGameState } from "@/hooks/useGameState";
import { formatMoney } from "@/utils/formatMoney";
import { formatMultiplier } from "@/utils/formatMultiplier";
import { cn } from "@/utils/cn";
import type { LiveBet } from "@/types/bet";

export function BetList() {
  const { bets } = useGameState();

  if (bets.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-muted">
        Nenhuma aposta ainda
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {bets.map((bet) => (
        <BetListItem key={bet.playerId} bet={bet} />
      ))}
    </div>
  );
}

function BetListItem({ bet }: { bet: LiveBet }) {
  const isCashedOut = bet.status === "won";
  const isLost = bet.status === "lost";

  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
        isCashedOut
          ? "bg-accent/10 border border-accent/20"
          : isLost
            ? "bg-danger/10 border border-danger/20"
            : "bg-surface-2 border border-border",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-bold text-muted shrink-0">
          {bet.username[0]?.toUpperCase()}
        </div>
        <span className="font-medium text-white truncate">{bet.username}</span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-foreground-muted font-mono text-xs">
          R$ {formatMoney(bet.amount)}
        </span>
        {isCashedOut && bet.cashoutMultiplier && bet.payout ? (
          <div className="flex flex-col items-end">
            <span className="text-accent font-bold text-xs">
              +R$ {formatMoney(bet.payout)}
            </span>
            <span className="text-accent/70 text-xs font-mono">
              {formatMultiplier(bet.cashoutMultiplier)}
            </span>
          </div>
        ) : isLost ? (
          <span className="text-danger text-xs font-bold">perdeu</span>
        ) : (
          <span className="text-muted text-xs">apostando</span>
        )}
      </div>
    </div>
  );
}
