"use client";

import { useWallet } from "@/hooks/useWallet";
import { formatMoney } from "@/utils/formatMoney";
import { WalletCreatePrompt } from "./WalletCreatePrompt";

export function WalletBalance() {
  const { balance, isLoading, error } = useWallet();

  if (!isLoading && error) return <WalletCreatePrompt />;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-xs text-muted uppercase tracking-wide">Saldo</span>
      {isLoading && balance === null ? (
        <div className="w-20 h-5 rounded bg-surface-2 animate-pulse" />
      ) : (
        <span className="text-lg font-bold font-mono text-white">
          R$ {balance !== null ? formatMoney(balance) : "—"}
        </span>
      )}
    </div>
  );
}
