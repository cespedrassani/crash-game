"use client";

import { useSocket } from "@/hooks/useSocket";
import { useCurrentRound } from "@/hooks/useCurrentRound";
import { GameShell } from "@/components/game/GameShell";
import { CrashGraph } from "@/components/game/CrashGraph";
import { BetControls } from "@/components/game/BetControls";
import { BetList } from "@/components/game/BetList";
import { RoundHistory } from "@/components/game/RoundHistory";
import { CountdownTimer } from "@/components/game/CountdownTimer";
import { ProvablyFairInfo } from "@/components/game/ProvablyFairInfo";
import { WalletBalance } from "@/components/wallet/WalletBalance";
import { PlayerInfo } from "@/components/player/PlayerInfo";

export default function GamePage() {
  useCurrentRound();
  useSocket();

  return (
    <GameShell
      header={
        <div className="flex items-center gap-6">
          <WalletBalance />
          <PlayerInfo />
        </div>
      }
      graph={<CrashGraph />}
      controls={
        <div className="flex flex-col gap-3">
          <ProvablyFairInfo />
          <CountdownTimer />
          <BetControls />
        </div>
      }
      betList={<BetList />}
      history={<RoundHistory />}
    />
  );
}
