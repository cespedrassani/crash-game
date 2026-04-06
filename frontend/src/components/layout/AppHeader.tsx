"use client";

import { useAuthStore } from "@/store/authStore";
import { useWallet } from "@/hooks/useWallet";
import { PhaseBadge } from "@/components/game/PhaseBadge";
import { WalletBalance } from "@/components/wallet/WalletBalance";
import { WalletCreatePrompt } from "@/components/wallet/WalletCreatePrompt";
import { DepositModal } from "@/components/wallet/DepositModal";

export function AppHeader() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isLoading: walletLoading, hasNoWallet } = useWallet();

  const hasWallet = !walletLoading && !hasNoWallet;
  const initial = user?.username?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-5 py-2.5 border-b border-border bg-surface shrink-0 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base sm:text-lg font-black text-white tracking-tight shrink-0">
          <span className="hidden sm:inline">CrashGame</span>
        </span>
        <PhaseBadge />
      </div>

      <div className="hidden sm:flex items-center gap-6">
        <WalletBalance />
        <PlayerAvatar initial={initial} username={user?.username} />
        <LogoutButton onLogout={logout} />
      </div>

      <div className="flex sm:hidden items-center gap-2 shrink-0">
        {hasWallet && (
          <DepositModal>
            <button
              title="Depositar saldo"
              className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-500 hover:bg-green-500/30 transition-colors"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </DepositModal>
        )}
        {hasNoWallet && <WalletCreatePrompt variant="icon" />}
        <PlayerAvatar initial={initial} />
        <LogoutButton onLogout={logout} />
      </div>
    </header>
  );
}

function PlayerAvatar({
  initial,
  username,
}: {
  initial: string;
  username?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary select-none">
        {initial}
      </div>
      {username && (
        <span className="text-sm font-semibold text-white hidden md:inline">
          {username}
        </span>
      )}
    </div>
  );
}

function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <button
      onClick={onLogout}
      title="Sair"
      className="text-muted hover:text-danger transition-colors"
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    </button>
  );
}
