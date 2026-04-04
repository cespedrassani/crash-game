"use client";

import { useGameState } from "@/hooks/useGameState";
import { cn } from "@/utils/cn";

interface GameShellProps {
  graph: React.ReactNode;
  controls: React.ReactNode;
  betList: React.ReactNode;
  history: React.ReactNode;
  header: React.ReactNode;
}

export function GameShell({
  graph,
  controls,
  betList,
  history,
  header,
}: GameShellProps) {
  const { phase } = useGameState();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-white tracking-tight">
            🚀 CrashGame
          </span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-bold border",
              phase === "running"
                ? "bg-accent/10 text-accent border-accent/30"
                : phase === "betting"
                  ? "bg-warning/10 text-warning border-warning/30"
                  : phase === "crashed"
                    ? "bg-danger/10 text-danger border-danger/30"
                    : "bg-surface-2 text-muted border-border",
            )}
          >
            {phase === "running"
              ? "AO VIVO"
              : phase === "betting"
                ? "APOSTAS"
                : phase === "crashed"
                  ? "CRASHED"
                  : "AGUARDANDO"}
          </span>
        </div>
        {header}
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        <div className="flex-1 flex flex-col gap-0 min-h-0">
          <div className="flex-1 relative min-h-70 lg:min-h-0 bg-surface border-b border-border">
            {graph}
          </div>
          <div className="px-4 py-3 bg-surface border-b border-border lg:border-b-0">
            {history}
          </div>
        </div>

        <div className="w-full lg:w-96 flex flex-col border-l border-border bg-surface">
          <div className="p-4 border-b border-border">{controls}</div>
          <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">
              Apostas da rodada
            </span>
            <div className="flex-1 overflow-y-auto">{betList}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
