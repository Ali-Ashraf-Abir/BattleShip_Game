"use client";

import { useMemo } from "react";
import { ShipType, SHIP_LENGTHS, SHIP_LABELS, type ShipPlacementDto } from "@/types/api";
import { SHIP_COLOR, cellsFor, ShipCellSVG, BoardWithLabels, BoardKeyframes } from "./BoardShared";

const ALL_SHIP_TYPES: ShipType[] = [
  ShipType.Carrier,
  ShipType.Battleship,
  ShipType.Cruiser,
  ShipType.Submarine,
  ShipType.Destroyer,
];

function shipHealthPercent(ship: ShipPlacementDto, hits: Set<string>): number {
  const cells = cellsFor(ship);
  const sunk = cells.filter(([x, y]) => hits.has(`${x},${y}`)).length;
  return 1 - sunk / cells.length;
}

export default function OwnFleetGrid({
  gridSize,
  ships,
  incomingHits,
  incomingMisses,
}: {
  gridSize: number;
  ships: ShipPlacementDto[];
  incomingHits: Set<string>;
  incomingMisses: Set<string>;
}) {
  const cellOwner = useMemo(() => {
    const map = new Map<string, { ship: ShipPlacementDto; idx: number; total: number }>();
    for (const ship of ships) {
      const cs = cellsFor(ship);
      cs.forEach(([x, y], i) => map.set(`${x},${y}`, { ship, idx: i, total: cs.length }));
    }
    return map;
  }, [ships]);

  const totalCells = ships.reduce((n, s) => n + SHIP_LENGTHS[s.shipType], 0);
  const hitCount = incomingHits.size;
  const healthPct = totalCells > 0 ? Math.max(0, 1 - hitCount / totalCells) : 1;

  const healthColor =
    healthPct > 0.6 ? "bg-emerald-500" : healthPct > 0.3 ? "bg-amber-500" : "bg-rose-500";

  return (

    <div className="flex w-full flex-col gap-2">
      <div className=" flex w-full flex-col gap-1.5" style={{ maxWidth: "var(--board-size)" }}>
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium tracking-wide text-slate-500 uppercase">Fleet integrity</span>
          <span
            className={`font-semibold tabular-nums ${
              healthPct > 0.6 ? "text-emerald-400" : healthPct > 0.3 ? "text-amber-400" : "text-rose-400"
            }`}
          >
            {Math.round(healthPct * 100)}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${healthColor}`}
            style={{ width: `${healthPct * 100}%` }}
          />
        </div>
      </div>

      <BoardWithLabels gridSize={gridSize} size="var(--board-size)">
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
          {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
            const x = idx % gridSize;
            const y = Math.floor(idx / gridSize);
            const key = `${x},${y}`;
            const ownerInfo = cellOwner.get(key);
            const wasHit = incomingHits.has(key);
            const wasMissed = incomingMisses.has(key);

            return (
              <div key={idx} className="relative">
                {ownerInfo &&
                  (() => {
                    const { primary, dark } = SHIP_COLOR[ownerInfo.ship.shipType];
                    const orient = ownerInfo.ship.isVertical ? "v" : "h";
                    return (
                      <>
                        <div
                          className="absolute inset-0"
                          style={{ background: dark + "55", borderTop: `1px solid ${primary}40`, borderLeft: `1px solid ${primary}40` }}
                        />
                        <ShipCellSVG color={primary} dark={dark} orient={orient} idx={ownerInfo.idx} total={ownerInfo.total} />
                      </>
                    );
                  })()}

                {wasMissed && (
                  <>
                    <div className="absolute inset-0 bg-slate-900/30" />
                    <svg viewBox="0 0 10 10" className="absolute inset-[28%] w-[44%] h-[44%] opacity-50" aria-hidden>
                      <circle cx="5" cy="5" r="2.3" fill="currentColor" className="text-slate-300" />
                    </svg>
                  </>
                )}

                {wasHit && (
                  <>
                    <div className="absolute inset-0" style={{ background: "rgba(244,63,94,0.32)" }} />
                    <svg viewBox="0 0 10 10" className="absolute inset-[14%] w-[72%] h-[72%]" aria-hidden>
                      <line x1="1" y1="1" x2="9" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                      <line x1="9" y1="1" x2="1" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </BoardWithLabels>

      <div
        className="mx-auto flex w-full flex-wrap gap-1.5 pt-0.5"
        style={{ maxWidth: "var(--board-size)" }}
      >
        {ALL_SHIP_TYPES.map((type) => {
          const ship = ships.find((s) => s.shipType === type);
          if (!ship) return null;
          const health = shipHealthPercent(ship, incomingHits);
          const isSunk = health === 0;
          const { primary } = SHIP_COLOR[type];

          return (
            <span
              key={type}
              className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] ${
                isSunk ? "bg-rose-950/60 text-rose-400 line-through" : "bg-slate-900/60 text-slate-400"
              }`}
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: isSunk ? undefined : primary }}
              />
              {SHIP_LABELS[type]}
            </span>
          );
        })}
      </div>

      <BoardKeyframes />
    </div>
  );
}