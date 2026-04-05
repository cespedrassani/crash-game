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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      drawFrame(canvas, pointsRef.current, phase, crashPoint ?? null);
    });
    ro.observe(canvas.parentElement ?? canvas);
    return () => ro.disconnect();
  }, [phase, crashPoint]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full block" />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-1">
          <span
            className={cn(
              "font-black font-mono tracking-tight transition-all duration-150",
              phase === "crashed"
                ? "text-danger drop-shadow-[0_0_16px_rgba(239,68,68,0.7)]"
                : phase === "running"
                  ? "text-accent drop-shadow-[0_0_16px_rgba(16,185,129,0.7)]"
                  : "text-muted",
              multiplier >= 10
                ? "text-7xl sm:text-8xl"
                : multiplier >= 5
                  ? "text-6xl sm:text-7xl"
                  : "text-5xl sm:text-6xl",
            )}
          >
            {phase === "crashed" && crashPoint
              ? formatMultiplier(crashPoint)
              : formatMultiplier(multiplier)}
          </span>
          {phase === "betting" && (
            <span className="text-xs text-muted font-medium tracking-wider uppercase">
              Próxima rodada
            </span>
          )}
        </div>
      </div>

      {phase === "crashed" && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full bg-danger/20 text-danger text-xs font-bold border border-danger/40 animate-pulse tracking-widest uppercase">
            Crashed
          </span>
        </div>
      )}

      {phase === "running" && (
        <div className="absolute inset-0 pointer-events-none rounded-none border border-accent/20 animate-pulse" />
      )}
    </div>
  );
}

function getGridValues(maxY: number): number[] {
  const candidates = [
    1, 1.5, 2, 3, 5, 7, 10, 15, 20, 30, 50, 75, 100, 150, 200,
  ];
  const visible = candidates.filter((v) => v <= maxY * 1.05);
  if (visible.length === 0) return [1];
  const max = 6;
  if (visible.length <= max) return visible;
  const step = Math.ceil(visible.length / max);
  return visible.filter((_, i) => i % step === 0);
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

  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  if (W === 0 || H === 0) return;

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const PAD = W < 480
    ? { top: 12, right: 12, bottom: 24, left: 8 }
    : { top: 16, right: 16, bottom: 36, left: 52 };
  const showYLabels = W >= 480;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const isCrashed = phase === "crashed";
  const lineColor = isCrashed ? "#ef4444" : "#10b981";
  const glowColor = isCrashed ? "rgba(239,68,68,0.7)" : "rgba(16,185,129,0.7)";

  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "rgba(42,42,61,0.25)";
  const gridSpacing = 28;
  for (let gx = PAD.left; gx <= W - PAD.right; gx += gridSpacing) {
    for (let gy = PAD.top; gy <= H - PAD.bottom; gy += gridSpacing) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = "rgba(42,42,61,0.8)";
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top + plotH);
  ctx.lineTo(W - PAD.right, PAD.top + plotH);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top);
  ctx.lineTo(PAD.left, PAD.top + plotH);
  ctx.stroke();

  if (points.length < 2) {
    if (showYLabels) {
      ctx.fillStyle = "rgba(107,114,128,0.4)";
      ctx.font = `12px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("1.00x", PAD.left, PAD.top + plotH - 6);
    }
    return;
  }

  const maxX = Math.max(...points.map((p) => p.x), 1);
  const maxY = Math.max(...points.map((p) => p.y), 2);

  const toX = (x: number) => PAD.left + (x / maxX) * plotW;
  const toY = (y: number) =>
    PAD.top + plotH - ((y - 1) / (maxY - 1 || 1)) * plotH;

  const gridVals = getGridValues(maxY);
  if (showYLabels) {
    gridVals.forEach((v) => {
      const cy = toY(v);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(42,42,61,0.9)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.moveTo(PAD.left, cy);
      ctx.lineTo(W - PAD.right, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(107,114,128,0.85)";
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.fillText(
        v < 10 ? `${v.toFixed(1)}x` : `${v.toFixed(0)}x`,
        PAD.left - 6,
        cy + 4,
      );
    });
  } else {
    gridVals.forEach((v) => {
      const cy = toY(v);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(42,42,61,0.9)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.moveTo(PAD.left, cy);
      ctx.lineTo(W - PAD.right, cy);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  const gradient = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + plotH);
  if (isCrashed) {
    gradient.addColorStop(0, "rgba(239,68,68,0.35)");
    gradient.addColorStop(0.5, "rgba(239,68,68,0.12)");
    gradient.addColorStop(1, "rgba(239,68,68,0.01)");
  } else {
    gradient.addColorStop(0, "rgba(16,185,129,0.28)");
    gradient.addColorStop(0.5, "rgba(16,185,129,0.08)");
    gradient.addColorStop(1, "rgba(16,185,129,0.01)");
  }

  ctx.beginPath();
  ctx.moveTo(toX(points[0].x), toY(points[0].y));
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(toX(points[i].x), toY(points[i].y));
  }
  const last = points[points.length - 1];
  ctx.lineTo(toX(last.x), PAD.top + plotH);
  ctx.lineTo(toX(points[0].x), PAD.top + plotH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(toX(points[0].x), toY(points[0].y));
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(toX(points[i].x), toY(points[i].y));
  }
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();

  const lx = toX(last.x);
  const ly = toY(last.y);

  if (!isCrashed) {
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(lx, ly, 9, 0, Math.PI * 2);
    ctx.fillStyle = lineColor.replace(")", ", 0.25)").replace("rgb", "rgba");
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(lx, ly, 5, 0, Math.PI * 2);
  ctx.fillStyle = lineColor;
  ctx.fill();
  ctx.restore();

  if (phase === "running" && points.length > 1) {
    const label = `${last.y.toFixed(2)}x`;
    const labelX = Math.min(lx + 10, W - PAD.right - 40);
    const labelY = Math.max(ly - 10, PAD.top + 14);
    ctx.font = "bold 12px monospace";
    ctx.fillStyle = lineColor;
    ctx.textAlign = "left";
    ctx.fillText(label, labelX, labelY);
  }
}
