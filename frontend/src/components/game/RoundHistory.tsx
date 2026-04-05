"use client";

import { useRoundHistory } from "@/hooks/useRoundHistory";
import { formatMultiplier } from "@/utils/formatMultiplier";
import { cn } from "@/utils/cn";

export function RoundHistory() {
  const { data, isLoading } = useRoundHistory(1, 30);

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="hidden sm:inline text-xs font-semibold text-muted uppercase tracking-wide shrink-0">
        Histórico
      </span>
      <div className="flex gap-1 overflow-x-auto scrollbar-none flex-nowrap min-w-0 py-0.5">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="w-14 h-7 shrink-0 rounded bg-surface-2 animate-pulse"
              />
            ))
          : data?.data.map((round) => (
              <RoundHistoryBadge key={round.id} crashPoint={round.crashPoint} />
            ))}
      </div>
    </div>
  );
}

function RoundHistoryBadge({ crashPoint }: { crashPoint: number }) {
  const isHigh = crashPoint >= 2;
  const isMid = crashPoint >= 1.5 && crashPoint < 2;

  return (
    <span
      className={cn(
        "shrink-0 px-2 py-1 rounded text-xs font-mono font-bold border",
        isHigh
          ? "bg-accent/10 text-accent border-accent/30"
          : isMid
            ? "bg-warning/10 text-warning border-warning/30"
            : "bg-danger/10 text-danger border-danger/30",
      )}
    >
      {formatMultiplier(crashPoint)}
    </span>
  );
}
