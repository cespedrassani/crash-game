import { apiClient } from "@/lib/apiClient";
import type { Round, RoundHistoryItem } from "@/types/round";
import type { Bet } from "@/types/bet";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const gameService = {
  getCurrentRound: () => apiClient.get<Round>("/games/rounds/current"),

  getRoundHistory: (page = 1, limit = 20) =>
    apiClient.get<PaginatedResponse<RoundHistoryItem>>(
      `/games/rounds/history?page=${page}&limit=${limit}`,
    ),

  getRoundVerification: (roundId: string) =>
    apiClient.get<{ seedHash: string; serverSeed: string; crashPoint: number }>(
      `/games/rounds/${roundId}/verify`,
    ),

  placeBet: (amountCents: number) =>
    apiClient.post<Bet>("/games/bet", { amount: amountCents / 100 }),

  cashout: () => apiClient.post<Bet>("/games/bet/cashout"),

  getMyBets: (page = 1, limit = 20) =>
    apiClient.get<PaginatedResponse<Bet>>(
      `/games/bets/me?page=${page}&limit=${limit}`,
    ),
};
