"use client";

import { ShipType, type ShipPlacementDto, SHIP_LENGTHS } from "@/types/api";
import type { Ref, ReactNode, TouchEvent } from "react";


export const SHIP_COLOR: Record<ShipType, { primary: string; dark: string }> = {
  [ShipType.Carrier]:    { primary: "#f59e0b", dark: "#78350f" },
  [ShipType.Battleship]: { primary: "#38bdf8", dark: "#0c4a6e" },
  [ShipType.Cruiser]:    { primary: "#34d399", dark: "#065f46" },
  [ShipType.Submarine]:  { primary: "#a78bfa", dark: "#3b1fa8" },
  [ShipType.Destroyer]:  { primary: "#f87171", dark: "#7f1d1d" },
};

export function lighten(hex: string, amt: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const rr = Math.min(255, Math.round(r + (255 - r) * amt));
  const gg = Math.min(255, Math.round(g + (255 - g) * amt));
  const bb = Math.min(255, Math.round(b + (255 - b) * amt));
  return `#${rr.toString(16).padStart(2, "0")}${gg.toString(16).padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`;
}

export function cellsFor(ship: ShipPlacementDto): Array<[number, number]> {
  const len = SHIP_LENGTHS[ship.shipType];
  return Array.from({ length: len }, (_, i) => [
    ship.isVertical ? ship.startX : ship.startX + i,
    ship.isVertical ? ship.startY + i : ship.startY,
  ]);
}

export function ShipCellSVG({
  color,
  dark,
  orient,
  idx,
  total,
}: {
  color: string;
  dark: string;
  orient: "h" | "v";
  idx: number;
  total: number;
}) {
  const deck = lighten(color, 0.3);
  const mid = Math.floor(total / 2);
  const isH = orient === "h";

  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
      {isH ? (
        <>
          {idx === 0 && <path d="M100,28 L85,22 L5,22 L5,78 L85,78 L100,72 Z" fill={color} />}
          {idx === total - 1 && <rect x="0" y="22" width="95" height="56" fill={color} />}
          {idx !== 0 && idx !== total - 1 && <rect x="0" y="22" width="100" height="56" fill={color} />}
          <rect x="0" y="68" width="100" height="6" fill={dark} opacity="0.5" />
          <rect x="0" y="22" width="100" height="4" fill="white" opacity="0.1" />
          {idx === total - 1 && <rect x="0" y="22" width="4" height="56" fill={dark} opacity="0.6" />}
          {idx === 0 && <line x1="100" y1="28" x2="100" y2="72" stroke="white" strokeWidth="2" opacity="0.15" />}
          {idx === mid && (
            <>
              <rect x="22" y="8" width="56" height="18" fill={deck} rx="3" opacity="0.95" />
              <rect x="34" y="2" width="32" height="9" fill={deck} rx="2" opacity="0.8" />
              <rect x="28" y="11" width="9" height="7" fill={dark} rx="1" opacity="0.85" />
              <rect x="41" y="11" width="9" height="7" fill={dark} rx="1" opacity="0.85" />
              <rect x="54" y="11" width="9" height="7" fill={dark} rx="1" opacity="0.85" />
              <line x1="50" y1="0" x2="50" y2="8" stroke={deck} strokeWidth="2" opacity="0.8" />
              <line x1="30" y1="1" x2="70" y2="1" stroke={deck} strokeWidth="1.5" opacity="0.5" />
            </>
          )}
          {idx === 1 && total >= 4 && (
            <>
              <rect x="18" y="13" width="44" height="12" fill={deck} rx="2" opacity="0.85" />
              <rect x="36" y="4" width="9" height="11" fill={dark} rx="1" opacity="0.75" />
            </>
          )}
          {idx === total - 2 && total >= 4 && (
            <>
              <rect x="28" y="10" width="22" height="15" fill={dark} rx="2" opacity="0.75" />
              <rect x="36" y="2" width="8" height="11" fill={dark} rx="1" opacity="0.85" />
              <ellipse cx="40" cy="2" rx="5" ry="3" fill="white" opacity="0.06" />
            </>
          )}
        </>
      ) : (
        <>
          {idx === 0 && <path d="M28,100 L22,85 L22,5 L78,5 L78,85 L72,100 Z" fill={color} />}
          {idx === total - 1 && <rect x="22" y="5" width="56" height="95" fill={color} />}
          {idx !== 0 && idx !== total - 1 && <rect x="22" y="0" width="56" height="100" fill={color} />}
          <rect x="68" y="0" width="6" height="100" fill={dark} opacity="0.5" />
          <rect x="22" y="0" width="4" height="100" fill="white" opacity="0.1" />
          {idx === total - 1 && <rect x="22" y="5" width="56" height="4" fill={dark} opacity="0.6" />}
          {idx === 0 && <line x1="28" y1="100" x2="72" y2="100" stroke="white" strokeWidth="2" opacity="0.15" />}
          {idx === mid && (
            <>
              <rect x="8" y="22" width="18" height="56" fill={deck} rx="3" opacity="0.95" />
              <rect x="2" y="34" width="9" height="32" fill={deck} rx="2" opacity="0.8" />
              <rect x="11" y="28" width="7" height="9" fill={dark} rx="1" opacity="0.85" />
              <rect x="11" y="41" width="7" height="9" fill={dark} rx="1" opacity="0.85" />
              <rect x="11" y="54" width="7" height="9" fill={dark} rx="1" opacity="0.85" />
              <line x1="0" y1="50" x2="8" y2="50" stroke={deck} strokeWidth="2" opacity="0.8" />
            </>
          )}
          {idx === 1 && total >= 4 && (
            <>
              <rect x="13" y="18" width="12" height="44" fill={deck} rx="2" opacity="0.85" />
              <rect x="4" y="36" width="11" height="9" fill={dark} rx="1" opacity="0.75" />
            </>
          )}
          {idx === total - 2 && total >= 4 && (
            <>
              <rect x="10" y="28" width="15" height="22" fill={dark} rx="2" opacity="0.75" />
              <rect x="2" y="36" width="11" height="8" fill={dark} rx="1" opacity="0.85" />
              <ellipse cx="2" cy="40" rx="3" ry="5" fill="white" opacity="0.06" />
            </>
          )}
        </>
      )}
    </svg>
  );
}

export function BoardShell({
  gridSize,
  boardRef,
  size,
  className = "",
  onMouseLeave,
  onTouchMove,
  onTouchEnd,
  children,
}: {
  gridSize: number;
  boardRef?: Ref<HTMLDivElement>;
  size: string;
  className?: string;
  onMouseLeave?: () => void;
  onTouchMove?: (e: TouchEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
  children: ReactNode;
}) {
  return (

    <div
      ref={boardRef}
      className={`relative overflow-hidden rounded-xl border border-slate-700/60 ${className}`}
      style={{
        background: "linear-gradient(180deg, #061525 0%, #0a2040 60%, #0d3060 100%)",
        aspectRatio: "1 / 1",
        width: "100%",
        maxWidth: size,
        maxHeight: size,
      }}
      onMouseLeave={onMouseLeave}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 30% 20%, rgba(30,90,200,0.13) 0%, transparent 60%)",
          animation: "shimmer 8s ease-in-out infinite",
        }}
      />

      <svg className="pointer-events-none absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {Array.from({ length: gridSize - 1 }, (_, i) => (
          <g key={i}>
            <line x1={`${((i + 1) / gridSize) * 100}%`} y1="0" x2={`${((i + 1) / gridSize) * 100}%`} y2="100%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <line x1="0" y1={`${((i + 1) / gridSize) * 100}%`} x2="100%" y2={`${((i + 1) / gridSize) * 100}%`} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          </g>
        ))}
      </svg>

      {children}

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 overflow-hidden">
        <div className="absolute bottom-0 h-8" style={{ width: "200%", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 32'%3E%3Cpath d='M0 16 Q150 0 300 16 Q450 32 600 16 Q750 0 900 16 Q1050 32 1200 16 L1200 32 L0 32Z' fill='%23ffffff06'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat-x", animation: "waveMove 8s linear infinite" }} />
        <div className="absolute bottom-0 h-8 opacity-50" style={{ width: "200%", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 32'%3E%3Cpath d='M0 16 Q150 0 300 16 Q450 32 600 16 Q750 0 900 16 Q1050 32 1200 16 L1200 32 L0 32Z' fill='%23ffffff06'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat-x", animation: "waveMove 12s linear infinite reverse" }} />
      </div>
    </div>
  );
}


export function BoardKeyframes() {
  return (
    <style>{`
      @keyframes shimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      @keyframes waveMove { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    `}</style>
  );
}


export function BoardWithLabels({
  gridSize,
  boardRef,
  size,
  onMouseLeave,
  onTouchMove,
  onTouchEnd,
  children,
}: {
  gridSize: number;
  boardRef?: Ref<HTMLDivElement>;
  size: string;
  onMouseLeave?: () => void;
  onTouchMove?: (e: TouchEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
  children: ReactNode;
}) {
  const colLabels = Array.from({ length: gridSize }, (_, i) => String.fromCharCode(65 + i));
  const rowLabels = Array.from({ length: gridSize }, (_, i) => String(i + 1));

  return (
    <div className=" flex flex-col" style={{ width: "100%", maxWidth: size }}>
      <div className="mb-0.5 grid pl-4" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
        {colLabels.map((l) => (
          <div key={l} className="flex h-4 items-center justify-center text-[9px] text-slate-600 select-none">
            {l}
          </div>
        ))}
      </div>

      <div className="flex min-w-0 gap-1.5">
        <div className="flex w-4 shrink-0 flex-col">
          {rowLabels.map((l) => (
            <div key={l} className="flex flex-1 items-center justify-center text-[9px] text-slate-600 select-none">
              {l}
            </div>
          ))}
        </div>

        <BoardShell
          gridSize={gridSize}
          boardRef={boardRef}
          size={size}
          className="min-w-0 flex-1"
          onMouseLeave={onMouseLeave}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {children}
        </BoardShell>
      </div>
    </div>
  );
}