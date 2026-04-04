"use client";

import { useGameState } from "@/hooks/useGameState";
import { formatCountdown } from "@/utils/formatCountdown";
import { formatMultiplier } from "@/utils/formatMultiplier";
import { cn } from "@/utils/cn";

export function CountdownTimer() {
  const { phase, timeLeft } = useGameState();

  if (phase === "running" || phase === "crashed") return null;

  return (
    <div className="flex items-center gap-2 text-sm text-foreground-muted">
      {phase === "betting" && timeLeft !== null ? (
        <>
          <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          <span>
            Fase de apostas — início em{" "}
            <span className="font-mono font-bold text-warning">
              {formatCountdown(timeLeft)}
            </span>
          </span>
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-muted animate-pulse" />
          <span>Aguardando próxima rodada...</span>
        </>
      )}
    </div>
  );
}
