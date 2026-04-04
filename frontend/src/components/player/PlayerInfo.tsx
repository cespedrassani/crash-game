"use client";

import { useAuth } from "@/hooks/useAuth";

export function PlayerInfo() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end">
        <span className="text-xs text-muted">Jogador</span>
        <span className="text-sm font-semibold text-white">
          {user?.username ?? "—"}
        </span>
      </div>
      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary">
        {user?.username?.[0]?.toUpperCase() ?? "?"}
      </div>
      <button
        onClick={logout}
        className="text-xs text-muted hover:text-danger transition-colors"
        title="Sair"
      >
        Sair
      </button>
    </div>
  );
}
