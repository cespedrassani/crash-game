"use client";

import { useState } from "react";
import { useGameState } from "@/hooks/useGameState";
import { cn } from "@/utils/cn";

export function ProvablyFairInfo() {
  const { phase, seedHash, serverSeed, roundId } = useGameState();
  const [copied, setCopied] = useState(false);

  if (!seedHash) return null;

  function copy(value: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const isCrashed = phase === "crashed";

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors",
        isCrashed
          ? "bg-surface-2 border-border text-foreground-muted"
          : "bg-surface-2 border-border text-muted",
      )}
    >
      <span className="text-muted shrink-0">
        {isCrashed ? "seed:" : "hash:"}
      </span>

      {isCrashed && serverSeed ? (
        <>
          <span className="truncate max-w-35 sm:max-w-55" title={serverSeed}>
            {serverSeed.slice(0, 16)}…
          </span>
          <button
            onClick={() => copy(serverSeed)}
            className="shrink-0 text-muted hover:text-white transition-colors"
            title="Copiar server seed"
          >
            {copied ? "✓" : "⎘"}
          </button>
          {roundId && (
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/games/rounds/${roundId}/verify`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-primary hover:underline ml-1"
            >
              verificar
            </a>
          )}
        </>
      ) : (
        <>
          <span className="truncate max-w-35 sm:max-w-55" title={seedHash}>
            {seedHash.slice(0, 16)}…
          </span>
          <button
            onClick={() => copy(seedHash)}
            className="shrink-0 text-muted hover:text-white transition-colors"
            title="Copiar hash"
          >
            {copied ? "✓" : "⎘"}
          </button>
        </>
      )}
    </div>
  );
}
