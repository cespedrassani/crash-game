import { AppHeader } from "@/components/layout/AppHeader";

interface GameShellProps {
  graph: React.ReactNode;
  controls: React.ReactNode;
  betList: React.ReactNode;
  history: React.ReactNode;
}

export function GameShell({
  graph,
  controls,
  betList,
  history,
}: GameShellProps) {
  return (
    <div className="bg-background flex flex-col lg:h-dvh lg:overflow-hidden">
      <AppHeader />

      <main className="flex flex-col lg:flex-row lg:flex-1 lg:min-h-0 lg:overflow-hidden">
        <div className="flex flex-col lg:flex-1 lg:min-h-0 lg:min-w-0 lg:overflow-hidden">
          <div className="relative h-52 sm:h-64 lg:h-auto lg:flex-1 lg:min-h-0 bg-surface border-b border-border overflow-hidden">
            {graph}
          </div>

          <div className="shrink-0 px-3 sm:px-4 py-2 bg-surface border-b border-border overflow-hidden">
            {history}
          </div>

          <div className="flex flex-col lg:hidden">
            <div className="shrink-0 px-3 py-3 border-b border-border">
              {controls}
            </div>
            <div className="flex-1 min-h-0 flex flex-col p-3 gap-2 overflow-hidden">
              <span className="shrink-0 text-xs font-semibold text-muted uppercase tracking-wide">
                Apostas da rodada
              </span>
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none">
                {betList}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-col w-110 xl:w-125 shrink-0 border-l border-border bg-surface overflow-hidden">
          <div className="shrink-0 p-4 border-b border-border">{controls}</div>
          <div className="flex-1 min-h-0 flex flex-col p-4 gap-3 overflow-hidden">
            <span className="shrink-0 text-xs font-semibold text-muted uppercase tracking-wide">
              Apostas da rodada
            </span>
            <div className="flex-1 min-h-0 overflow-y-auto">{betList}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
