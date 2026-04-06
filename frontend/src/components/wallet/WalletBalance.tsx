"use client";

import { useWallet } from "@/hooks/useWallet";
import { formatMoney } from "@/utils/formatMoney";
import { WalletCreatePrompt } from "./WalletCreatePrompt";
import { DepositModal } from "./DepositModal";

export function WalletBalance() {
  const { balance, isLoading, error } = useWallet();

  if (!isLoading && error) return <WalletCreatePrompt />;

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end gap-0.5">
        {isLoading && balance === null ? (
          <div className="w-20 h-5 rounded bg-surface-2 animate-pulse" />
        ) : (
          <span className="text-lg font-bold font-mono text-white">
            R$ {balance !== null ? formatMoney(balance) : "—"}
          </span>
        )}
      </div>

      {!isLoading && !error && (
        <DepositModal>
          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-2 border border-border text-foreground-muted hover:border-primary hover:text-foreground transition-colors">
            + Depositar
          </button>
        </DepositModal>
      )}
    </div>
  );
}
