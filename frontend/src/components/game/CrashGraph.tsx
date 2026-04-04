"use client";

import { useEffect, useRef } from "react";
import { useGameState } from "@/hooks/useGameState";
import { formatMultiplier } from "@/utils/formatMultiplier";
import { cn } from "@/utils/cn";

export function CrashGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const { phase, multiplier, crashPoint } = useGameState();

  useEffect(() => {
    if (phase === "betting" || phase === "waiting") {
      pointsRef.current = [];
      startTimeRef.current = null;
      drawFrame(canvasRef.current, [], phase, crashPoint ?? null);
    }
  }, [phase, crashPoint]);

  useEffect(() => {
    if (phase !== "running" && phase !== "crashed") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!startTimeRef.current) startTimeRef.current = Date.now();

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    pointsRef.current.push({ x: elapsed, y: multiplier });

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      drawFrame(canvas, pointsRef.current, phase, crashPoint ?? null);
    });
  }, [multiplier, phase, crashPoint]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className={cn(
            "text-6xl font-black font-mono tracking-tight transition-colors",
            phase === "crashed"
              ? "text-danger"
              : phase === "running"
                ? "text-accent"
                : "text-muted",
          )}
        >
          {phase === "crashed" && crashPoint
            ? formatMultiplier(crashPoint)
            : phase === "running"
              ? formatMultiplier(multiplier)
              : phase === "betting"
                ? "Aguardando..."
                : "—"}
        </span>
      </div>
      {phase === "crashed" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full bg-danger/20 text-danger text-sm font-bold border border-danger/40 animate-pulse">
            CRASHED
          </span>
        </div>
      )}
    </div>
  );
}

function drawFrame(
  canvas: HTMLCanvasElement | null,
  points: { x: number; y: number }[],
  phase: string,
  crashPoint: number | null,
) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  canvas.width = W;
  canvas.height = H;

  ctx.clearRect(0, 0, W, H);

  if (points.length < 2) {
    ctx.strokeStyle = "rgba(107,114,128,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H - 40);
    ctx.lineTo(W, H - 40);
    ctx.stroke();
    return;
  }

  const maxX = Math.max(...points.map((p) => p.x), 1);
  const maxY = Math.max(...points.map((p) => p.y), 2);

  const toCanvasX = (x: number) => (x / maxX) * (W - 40) + 20;
  const toCanvasY = (y: number) => H - 40 - ((y - 1) / (maxY - 1)) * (H - 80);

  const isCrashed = phase === "crashed";
  const lineColor = isCrashed ? "#ef4444" : "#10b981";
  const gradientTop = isCrashed
    ? "rgba(239,68,68,0.3)"
    : "rgba(16,185,129,0.2)";

  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, gradientTop);
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  ctx.beginPath();
  ctx.moveTo(toCanvasX(points[0].x), toCanvasY(points[0].y));
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(toCanvasX(points[i].x), toCanvasY(points[i].y));
  }
  ctx.lineTo(toCanvasX(points[points.length - 1].x), H - 40);
  ctx.lineTo(toCanvasX(points[0].x), H - 40);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(toCanvasX(points[0].x), toCanvasY(points[0].y));
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(toCanvasX(points[i].x), toCanvasY(points[i].y));
  }
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.stroke();

  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(toCanvasX(last.x), toCanvasY(last.y), 5, 0, Math.PI * 2);
  ctx.fillStyle = lineColor;
  ctx.fill();

  ctx.strokeStyle = "rgba(107,114,128,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, H - 40);
  ctx.lineTo(W - 20, H - 40);
  ctx.stroke();
}
