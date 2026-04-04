"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
} from "@/lib/socket/socketClient";
import { useGameStore } from "@/store/gameStore";
import { useAuthStore } from "@/store/authStore";
import type {
  SocketBetPlacedPayload,
  SocketCashoutPayload,
  SocketRoundBettingPayload,
  SocketRoundCrashedPayload,
  SocketRoundStatePayload,
  SocketRoundTickPayload,
  SocketWalletUpdatedPayload,
} from "@/types/socket";

export function useSocket() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  const {
    setRound,
    setPhase,
    setTimeLeft,
    setMultiplier,
    setCrashed,
    addBet,
    updateBetCashout,
    setWalletBalance,
    syncFromRest,
  } = useGameStore();

  useEffect(() => {
    if (!accessToken) return;

    connectSocket(accessToken);
    const socket = getSocket();

    socket.on("round:state", (payload: SocketRoundStatePayload) => {
      syncFromRest({
        roundId: payload.roundId,
        phase: payload.phase,
        multiplier: payload.multiplier,
        timeLeft: payload.timeLeft,
        seedHash: payload.seedHash,
        bets: payload.bets,
      });
    });

    socket.on("round:betting", (payload: SocketRoundBettingPayload) => {
      setRound(payload.roundId, payload.seedHash);
      setPhase("betting");
      setTimeLeft(payload.timeLeft);
    });

    socket.on("round:started", () => {
      setPhase("running");
      setTimeLeft(0);
    });

    socket.on("round:tick", (payload: SocketRoundTickPayload) => {
      setMultiplier(payload.multiplier);
    });

    socket.on("round:crashed", (payload: SocketRoundCrashedPayload) => {
      setCrashed(payload.crashPoint, payload.serverSeed);
      queryClient.invalidateQueries({ queryKey: ["rounds", "history"] });
      queryClient.invalidateQueries({ queryKey: ["rounds", "current"] });
      queryClient.invalidateQueries({ queryKey: ["bets", "me"] });
    });

    socket.on("round:bet", (payload: SocketBetPlacedPayload) => {
      addBet({
        playerId: payload.playerId,
        username: payload.username,
        amount: payload.amount,
        status: "pending",
      });
    });

    socket.on("round:cashout", (payload: SocketCashoutPayload) => {
      updateBetCashout(payload.playerId, payload.multiplier, payload.payout);
    });

    socket.on("wallet:updated", (payload: SocketWalletUpdatedPayload) => {
      setWalletBalance(payload.balance);
      queryClient.invalidateQueries({ queryKey: ["wallet", "me"] });
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
    });

    return () => {
      socket.off("round:state");
      socket.off("round:betting");
      socket.off("round:started");
      socket.off("round:tick");
      socket.off("round:crashed");
      socket.off("round:bet");
      socket.off("round:cashout");
      socket.off("wallet:updated");
      socket.off("connect_error");
      disconnectSocket();
    };
  }, [
    accessToken,
    queryClient,
    setRound,
    setPhase,
    setTimeLeft,
    setMultiplier,
    setCrashed,
    addBet,
    updateBetCashout,
    setWalletBalance,
    syncFromRest,
  ]);
}
