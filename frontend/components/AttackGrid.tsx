"use client";

import { BoardWithLabels, BoardKeyframes } from "./BoardShared";

type CellState = "unknown" | "hit" | "miss";

export default function AttackGrid({
  gridSize,
  cellStates,
  onFire,
  disabled,
}: {
  gridSize: number;
  cellStates: Map<string, CellState>;
  onFire: (x: number, y: number) => void;
  disabled: boolean;
}) {
  const colLabels = Array.from({ length: gridSize }, (_, i) => String.fromCharCode(65 + i));
  const rowLabels = Array.from({ length: gridSize }, (_, i) => String(i + 1));

  return (
    <div className="flex w-full flex-col">

      <BoardWithLabels gridSize={gridSize} size="var(--board-size)">
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
          {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
            const x = idx % gridSize;
            const y = Math.floor(idx / gridSize);
            const state = cellStates.get(`${x},${y}`) ?? "unknown";
            const alreadyFired = state !== "unknown";

            return (
              <button
                key={idx}
                onClick={() => !alreadyFired && !disabled && onFire(x, y)}
                disabled={disabled || alreadyFired}
                className="relative focus:outline-none disabled:cursor-not-allowed group"
                aria-label={`fire at ${colLabels[x]}${rowLabels[y]}`}
              >
                {!alreadyFired && !disabled && (
                  <div className="absolute inset-0 bg-white/0 transition-colors group-hover:bg-white/[0.06]" />
                )}

                {state === "miss" && (
                  <>
                    <div className="absolute inset-0 bg-slate-900/30" />
                    <svg viewBox="0 0 10 10" className="absolute inset-[28%] w-[44%] h-[44%] opacity-50" aria-hidden>
                      <circle cx="5" cy="5" r="2.3" fill="currentColor" className="text-slate-300" />
                    </svg>
                  </>
                )}

                {state === "hit" && (
                  <>
                    <div className="absolute inset-0" style={{ background: "rgba(244,63,94,0.22)" }} />
                    <svg viewBox="0 0 10 10" className="absolute inset-[14%] w-[72%] h-[72%]" aria-hidden>
                      <line x1="1" y1="1" x2="9" y2="9" stroke="#fda4af" strokeWidth="1.6" strokeLinecap="round" />
                      <line x1="9" y1="1" x2="1" y2="9" stroke="#fda4af" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </BoardWithLabels>

      <BoardKeyframes />
    </div>
  );
}