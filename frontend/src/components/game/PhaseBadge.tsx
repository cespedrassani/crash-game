"use client";

import { useGameStore } from "@/store/gameStore";
import { cn } from "@/utils/cn";

export function PhaseBadge() {
  const phase = useGameStore((s) => s.phase);

  const label =
    phase === "running"
      ? "AO VIVO"
      : phase === "betting"
        ? "APOSTAS"
        : phase === "crashed"
          ? "CRASHED"
          : "AGUARDANDO";

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-xs font-bold border shrink-0",
        phase === "running"
          ? "bg-accent/10 text-accent border-accent/30"
          : phase === "betting"
            ? "bg-warning/10 text-warning border-warning/30"
            : phase === "crashed"
              ? "bg-danger/10 text-danger border-danger/30"
              : "bg-surface-2 text-muted border-border",
      )}
    >
      {label}
    </span>
  );
}
