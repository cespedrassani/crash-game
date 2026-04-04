"use client";

import { useRoundHistory } from "@/hooks/useRoundHistory";
import { formatMultiplier } from "@/utils/formatMultiplier";
import { cn } from "@/utils/cn";

export function RoundHistory() {
  const { data, isLoading } = useRoundHistory(1, 20);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-muted uppercase tracking-wide">
        Histórico
      </span>
      {isLoading ? (
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="w-14 h-7 rounded bg-surface-2 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-1 flex-wrap">
          {data?.data.map((round) => (
            <RoundHistoryBadge key={round.id} crashPoint={round.crashPoint} />
          ))}
        </div>
      )}
    </div>
  );
}

function RoundHistoryBadge({ crashPoint }: { crashPoint: number }) {
  const isHigh = crashPoint >= 2;
  const isMid = crashPoint >= 1.5 && crashPoint < 2;

  return (
    <span
      className={cn(
        "px-2 py-1 rounded text-xs font-mono font-bold border",
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
