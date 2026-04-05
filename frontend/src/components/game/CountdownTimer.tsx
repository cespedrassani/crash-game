"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { formatCountdown } from "@/utils/formatCountdown";

export function CountdownTimer() {
  const phase = useGameStore((s) => s.phase);
  const timeLeft = useGameStore((s) => s.timeLeft);

  const [display, setDisplay] = useState<number | null>(null);
  const endTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase === "betting" && timeLeft !== null && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft;
    } else if (phase !== "betting") {
      endTimeRef.current = null;
      setDisplay(null);
    }
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase !== "betting") return;

    const tick = () => {
      if (endTimeRef.current === null) return;
      setDisplay(Math.max(0, endTimeRef.current - Date.now()));
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase]);

  if (phase === "running" || phase === "crashed") return null;

  return (
    <div className="flex items-center gap-2 text-sm text-foreground-muted">
      {phase === "betting" && display !== null && display > 0 ? (
        <>
          <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          <span>
            Fase de apostas — início em{" "}
            <span className="font-mono font-bold text-warning">
              {formatCountdown(display)}
            </span>
          </span>
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-muted animate-pulse" />
          <span>Aguardando próxima rodada...</span>
        </>
      )}
    </div>
  );
}
