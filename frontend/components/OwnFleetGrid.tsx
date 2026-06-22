"use client";

import { useMemo } from "react";
import { ShipType, SHIP_LENGTHS, SHIP_LABELS, type ShipPlacementDto } from "@/types/api";

const SHIP_BASE: Record<ShipType, string> = {
  [ShipType.Carrier]:    "bg-amber-500/70   border-amber-400/60",
  [ShipType.Battleship]: "bg-sky-500/70     border-sky-400/60",
  [ShipType.Cruiser]:    "bg-emerald-500/70 border-emerald-400/60",
  [ShipType.Submarine]:  "bg-violet-500/70  border-violet-400/60",
  [ShipType.Destroyer]:  "bg-rose-500/70    border-rose-400/60",
};


const SHIP_HIT: Record<ShipType, string> = {
  [ShipType.Carrier]:    "bg-amber-700/90   border-amber-600",
  [ShipType.Battleship]: "bg-sky-700/90     border-sky-600",
  [ShipType.Cruiser]:    "bg-emerald-700/90 border-emerald-600",
  [ShipType.Submarine]:  "bg-violet-700/90  border-violet-600",
  [ShipType.Destroyer]:  "bg-rose-700/90    border-rose-600",
};

const ALL_SHIP_TYPES: ShipType[] = [
  ShipType.Carrier,
  ShipType.Battleship,
  ShipType.Cruiser,
  ShipType.Submarine,
  ShipType.Destroyer,
];

const SHIP_ACCENT: Record<ShipType, string> = {
  [ShipType.Carrier]:    "text-amber-300",
  [ShipType.Battleship]: "text-sky-300",
  [ShipType.Cruiser]:    "text-emerald-300",
  [ShipType.Submarine]:  "text-violet-300",
  [ShipType.Destroyer]:  "text-rose-300",
};


function cellsFor(ship: ShipPlacementDto): Array<[number, number]> {
  const len = SHIP_LENGTHS[ship.shipType];
  return Array.from({ length: len }, (_, i) => [
    ship.isVertical ? ship.startX : ship.startX + i,
    ship.isVertical ? ship.startY + i : ship.startY,
  ]);
}

function shipHealthPercent(
  ship: ShipPlacementDto,
  hits: Set<string>
): number {
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
    const map = new Map<string, ShipType>();
    for (const ship of ships) {
      for (const [x, y] of cellsFor(ship)) {
        map.set(`${x},${y}`, ship.shipType);
      }
    }
    return map;
  }, [ships]);


  const totalCells = ships.reduce((n, s) => n + SHIP_LENGTHS[s.shipType], 0);
  const hitCount   = incomingHits.size;
  const healthPct  = totalCells > 0 ? Math.max(0, 1 - hitCount / totalCells) : 1;

  const healthColor =
    healthPct > 0.6 ? "bg-emerald-500"
    : healthPct > 0.3 ? "bg-amber-500"
    : "bg-rose-500";

  const colLabels = Array.from({ length: gridSize }, (_, i) =>
    String.fromCharCode(65 + i)
  );
  const rowLabels = Array.from({ length: gridSize }, (_, i) => String(i + 1));

  return (
    <div className="flex flex-col gap-4 w-full">

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium tracking-wide text-slate-400 uppercase">
            Fleet integrity
          </span>
          <span className={`font-semibold tabular-nums ${healthPct > 0.6 ? "text-emerald-400" : healthPct > 0.3 ? "text-amber-400" : "text-rose-400"}`}>
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


      <div className="flex gap-1.5 sm:gap-2">

        <div
          className="flex flex-col justify-around pr-0.5"
          style={{ width: "1.25rem" }}
        >
          {rowLabels.map((label) => (
            <span
              key={label}
              className="flex items-center justify-center text-[9px] leading-none text-slate-600 select-none"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-1 flex-1">

          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
          >
            {colLabels.map((label) => (
              <span
                key={label}
                className="flex items-center justify-center text-[9px] leading-none text-slate-600 select-none"
              >
                {label}
              </span>
            ))}
          </div>


          <div
            className="inline-grid gap-[1px] w-full rounded-lg border border-slate-700/80 bg-slate-700/40 p-[1px] shadow-inner shadow-black/40"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              aspectRatio: "1 / 1",
            }}
          >
            {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
              const x = idx % gridSize;
              const y = Math.floor(idx / gridSize);
              const key = `${x},${y}`;
              const owner  = cellOwner.get(key);
              const wasHit    = incomingHits.has(key);
              const wasMissed = incomingMisses.has(key);

      
              let cellCls: string;
              if (wasHit && owner !== undefined) {
                cellCls = `${SHIP_HIT[owner]} border`;
              } else if (wasHit) {

                cellCls = "bg-rose-900/80 border border-rose-700";
              } else if (wasMissed) {
                cellCls = "bg-slate-800/60 border border-slate-700/40";
              } else if (owner !== undefined) {
                cellCls = `${SHIP_BASE[owner]} border`;
              } else {
                cellCls = "bg-slate-900/80 border border-slate-800/20";
              }

              const isGuideCol = x > 0 && x % 5 === 0;
              const isGuideRow = y > 0 && y % 5 === 0;

              return (
                <div
                  key={idx}
                  aria-label={`${colLabels[x]}${rowLabels[y]}${owner !== undefined ? ` — ${SHIP_LABELS[owner]}` : ""}${wasHit ? " (hit)" : ""}${wasMissed ? " (miss)" : ""}`}
                  className={`
                    aspect-square relative transition-colors duration-200
                    ${cellCls}
                    ${isGuideCol ? "border-l-slate-600/60" : ""}
                    ${isGuideRow ? "border-t-slate-600/60" : ""}
                  `}
                >
      
                  {wasHit && (
                    <svg
                      viewBox="0 0 10 10"
                      className="absolute inset-[10%] w-[80%] h-[80%] opacity-90"
                      aria-hidden
                    >
                      <line x1="1" y1="1" x2="9" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                      <line x1="9" y1="1" x2="1" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  )}
                   
                  {wasMissed && (
                    <svg
                      viewBox="0 0 10 10"
                      className="absolute inset-[20%] w-[60%] h-[60%] opacity-50"
                      aria-hidden
                    >
                      <circle cx="5" cy="5" r="2.5" fill="currentColor" className="text-slate-300" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {ALL_SHIP_TYPES.map((type) => {
          const ship = ships.find((s) => s.shipType === type);
          if (!ship) return null;

          const len    = SHIP_LENGTHS[type];
          const health = shipHealthPercent(ship, incomingHits);
          const isSunk = health === 0;
          const hitsOnShip = Math.round((1 - health) * len);

          return (
            <div
              key={type}
              className={`flex items-center gap-2.5 rounded-md border px-2.5 py-1.5 transition-colors ${
                isSunk
                  ? "border-rose-800/50 bg-rose-950/40"
                  : "border-slate-700/60 bg-slate-900/50"
              }`}
            >
              
              <span
                className={`h-2 w-2 shrink-0 rounded-sm border ${SHIP_BASE[type]}`}
              />

              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-[11px] font-medium truncate ${
                      isSunk ? "text-slate-500 line-through" : SHIP_ACCENT[type]
                    }`}
                  >
                    {SHIP_LABELS[type]}
                  </span>
                  <span className="text-[10px] tabular-nums text-slate-500 shrink-0">
                    {hitsOnShip}/{len}
                  </span>
                </div>

                <div className="flex gap-0.5">
                  {Array.from({ length: len }).map((_, i) => {
                    const cellKey = cellsFor(ship)
                      .map(([x, y]) => `${x},${y}`)[i];
                    const hit = cellKey ? incomingHits.has(cellKey) : false;
                    return (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-[1px] transition-colors ${
                          hit ? "bg-rose-500" : isSunk ? "bg-slate-700" : SHIP_BASE[type].split(" ")[0]
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

        
              {isSunk && (
                <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-rose-900/60 text-rose-400">
                  Sunk
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}