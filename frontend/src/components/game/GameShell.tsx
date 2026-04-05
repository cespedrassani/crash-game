"use client";

import { useGameState } from "@/hooks/useGameState";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";

interface GameShellProps {
  graph: React.ReactNode;
  controls: React.ReactNode;
  betList: React.ReactNode;
  history: React.ReactNode;
  header: React.ReactNode;
}

export function GameShell({ graph, controls, betList, history, header }: GameShellProps) {
  const { phase } = useGameState();
  const { user, logout } = useAuth();

  const phaseBadge = (
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
      {phase === "running" ? "AO VIVO"
        : phase === "betting" ? "APOSTAS"
        : phase === "crashed" ? "CRASHED"
        : "AGUARDANDO"}
    </span>
  );

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {/* Header — fixed height */}
      <header className="flex items-center justify-between px-3 sm:px-5 py-2.5 border-b border-border bg-surface shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base sm:text-lg font-black text-white tracking-tight shrink-0">
            🚀 <span className="hidden sm:inline">CrashGame</span>
          </span>
          {phaseBadge}
        </div>

        {/* Desktop centre: full header (WalletBalance + PlayerInfo) */}
        <div className="hidden sm:flex items-center gap-4">{header}</div>

        {/* Mobile right: avatar + logout */}
        <div className="flex sm:hidden items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary select-none">
            {user?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <button
            onClick={logout}
            title="Sair"
            className="text-muted hover:text-danger transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main — fills remaining height, never overflows viewport */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">

        {/* ── Left column ── */}
        <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">

          {/*
            Graph:
            - Mobile: fixed height (h-56 / h-64)
            - Desktop: flex-1 so it fills whatever space remains after history
          */}
          <div className="relative shrink-0 h-52 sm:h-64 lg:h-auto lg:flex-1 lg:min-h-0 bg-surface border-b border-border overflow-hidden">
            {graph}
          </div>

          {/* History — always fixed/shrink-0 so it never gets cut */}
          <div className="shrink-0 px-3 sm:px-4 py-2 bg-surface border-b border-border overflow-hidden">
            {history}
          </div>

          {/* Controls + bets — mobile only, fills remaining height */}
          <div className="flex-1 min-h-0 flex flex-col lg:hidden overflow-hidden">
            <div className="shrink-0 px-3 py-3 border-b border-border">{controls}</div>
            <div className="flex-1 min-h-0 flex flex-col p-3 gap-2 overflow-hidden">
              <span className="shrink-0 text-xs font-semibold text-muted uppercase tracking-wide">
                Apostas da rodada
              </span>
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none">{betList}</div>
            </div>
          </div>
        </div>

        {/* ── Right sidebar — desktop only ── */}
        <div className="hidden lg:flex flex-col w-[440px] xl:w-[500px] shrink-0 border-l border-border bg-surface overflow-hidden">
          <div className="shrink-0 p-4 border-b border-border">{controls}</div>
          <div className="flex-1 min-h-0 flex flex-col p-4 gap-3 overflow-hidden">
            <span className="shrink-0 text-xs font-semibold text-muted uppercase tracking-wide">
              Apostas da rodada
            </span>
            <div className="flex-1 min-h-0 overflow-y-auto">{betList}</div>
          </div>
        </div>

      </main>
    </div>
  );
}
