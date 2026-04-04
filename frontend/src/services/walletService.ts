import { apiClient } from "@/lib/apiClient";
import type { Wallet } from "@/types/wallet";

export const walletService = {
  getMyWallet: () => apiClient.get<Wallet>("/wallets/me"),
  createWallet: () => apiClient.post<Wallet>("/wallets"),
};
