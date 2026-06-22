"use client";

import { useMemo, useState } from "react";
import {
  ShipType,
  SHIP_LENGTHS,
  SHIP_LABELS,
  type ShipPlacementDto,
} from "@/types/api";

const ALL_SHIP_TYPES: ShipType[] = [
  ShipType.Carrier,
  ShipType.Battleship,
  ShipType.Cruiser,
  ShipType.Submarine,
  ShipType.Destroyer,
];


const SHIP_CELL: Record<ShipType, string> = {
  [ShipType.Carrier]:    "bg-amber-500/75   border-amber-400/70",
  [ShipType.Battleship]: "bg-sky-500/75     border-sky-400/70",
  [ShipType.Cruiser]:    "bg-emerald-500/75 border-emerald-400/70",
  [ShipType.Submarine]:  "bg-violet-500/75  border-violet-400/70",
  [ShipType.Destroyer]:  "bg-rose-500/75    border-rose-400/70",
};


const SHIP_ACCENT: Record<ShipType, string> = {
  [ShipType.Carrier]:    "text-amber-300",
  [ShipType.Battleship]: "text-sky-300",
  [ShipType.Cruiser]:    "text-emerald-300",
  [ShipType.Submarine]:  "text-violet-300",
  [ShipType.Destroyer]:  "text-rose-300",
};


const SHIP_SWATCH: Record<ShipType, string> = {
  [ShipType.Carrier]:    "bg-amber-500/80   border-amber-400",
  [ShipType.Battleship]: "bg-sky-500/80     border-sky-400",
  [ShipType.Cruiser]:    "bg-emerald-500/80 border-emerald-400",
  [ShipType.Submarine]:  "bg-violet-500/80  border-violet-400",
  [ShipType.Destroyer]:  "bg-rose-500/80    border-rose-400",
};


function cellsFor(ship: ShipPlacementDto): Array<[number, number]> {
  const len = SHIP_LENGTHS[ship.shipType];
  return Array.from({ length: len }, (_, i) => [
    ship.isVertical ? ship.startX : ship.startX + i,
    ship.isVertical ? ship.startY + i : ship.startY,
  ]);
}

function overlaps(a: ShipPlacementDto, b: ShipPlacementDto): boolean {
  const aCells = new Set(cellsFor(a).map(([x, y]) => `${x},${y}`));
  return cellsFor(b).some(([x, y]) => aCells.has(`${x},${y}`));
}

function inBounds(ship: ShipPlacementDto, gridSize: number): boolean {
  return cellsFor(ship).every(
    ([x, y]) => x >= 0 && y >= 0 && x < gridSize && y < gridSize
  );
}


export default function ShipPlacementGrid({
  gridSize,
  ships,
  onChange,
}: {
  gridSize: number;
  ships: ShipPlacementDto[];
  onChange: (ships: ShipPlacementDto[]) => void;
}) {
  const [selectedType, setSelectedType] = useState<ShipType>(ShipType.Carrier);
  const [isVertical, setIsVertical]     = useState(false);
  const [hoverCell, setHoverCell]       = useState<[number, number] | null>(null);

  const placedTypes = useMemo(
    () => new Set(ships.map((s) => s.shipType)),
    [ships]
  );
  const remainingTypes = ALL_SHIP_TYPES.filter((t) => !placedTypes.has(t));

  const cellOwner = useMemo(() => {
    const map = new Map<string, ShipType>();
    for (const ship of ships) {
      for (const [x, y] of cellsFor(ship)) map.set(`${x},${y}`, ship.shipType);
    }
    return map;
  }, [ships]);

  const previewShip: ShipPlacementDto | null = useMemo(() => {
    if (!hoverCell || placedTypes.has(selectedType)) return null;
    return { shipType: selectedType, startX: hoverCell[0], startY: hoverCell[1], isVertical };
  }, [hoverCell, selectedType, isVertical, placedTypes]);

  const previewCellSet = useMemo(() => {
    if (!previewShip) return new Set<string>();
    return new Set(cellsFor(previewShip).map(([x, y]) => `${x},${y}`));
  }, [previewShip]);

  const previewValid =
    previewShip &&
    inBounds(previewShip, gridSize) &&
    !ships.some((s) => overlaps(s, previewShip));

  function handlePlace(x: number, y: number) {
    if (placedTypes.has(selectedType)) return;
    const candidate: ShipPlacementDto = { shipType: selectedType, startX: x, startY: y, isVertical };
    if (!inBounds(candidate, gridSize)) return;
    if (ships.some((s) => overlaps(s, candidate))) return;

    const next = [...ships, candidate];
    onChange(next);

    const still = ALL_SHIP_TYPES.filter((t) => !next.some((s) => s.shipType === t));
    if (still.length > 0) setSelectedType(still[0]);
  }

  function handleRemove(shipType: ShipType) {
    onChange(ships.filter((s) => s.shipType !== shipType));
    setSelectedType(shipType);
  }

  function handleRandomize() {
    const placed: ShipPlacementDto[] = [];
    for (const shipType of ALL_SHIP_TYPES) {
      let attempts = 0;
      while (attempts < 200) {
        attempts++;
        const vertical = Math.random() < 0.5;
        const length   = SHIP_LENGTHS[shipType];
        const maxX     = vertical ? gridSize - 1 : gridSize - length;
        const maxY     = vertical ? gridSize - length : gridSize - 1;
        const candidate: ShipPlacementDto = {
          shipType,
          startX: Math.floor(Math.random() * (maxX + 1)),
          startY: Math.floor(Math.random() * (maxY + 1)),
          isVertical: vertical,
        };
        if (!placed.some((s) => overlaps(s, candidate))) {
          placed.push(candidate);
          break;
        }
      }
    }
    onChange(placed);
  }

 
  const colLabels = Array.from({ length: gridSize }, (_, i) =>
    String.fromCharCode(65 + i)
  );
  const rowLabels = Array.from({ length: gridSize }, (_, i) => String(i + 1));


  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">


      <div className="flex flex-col gap-2 lg:w-48">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Fleet
        </p>

        {ALL_SHIP_TYPES.map((type) => {
          const placed = placedTypes.has(type);
          const active = selectedType === type && !placed;
          const len    = SHIP_LENGTHS[type];

          return (
            <button
              key={type}
              onClick={() => (placed ? handleRemove(type) : setSelectedType(type))}
              className={`
                group relative flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs
                transition-all duration-150
                ${placed
                  ? "border-slate-700/50 bg-slate-900/60 opacity-80 hover:border-rose-700/50 hover:opacity-100"
                  : active
                    ? "border-amber-500/50 bg-amber-500/8 shadow-sm shadow-amber-500/10"
                    : "border-slate-700/70 bg-slate-900/40 hover:border-slate-600"
                }
              `}
            >

              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-amber-400" />
              )}

              <div className="flex gap-0.5 shrink-0">
                {Array.from({ length: len }).map((_, i) => (
                  <span
                    key={i}
                    className={`
                      h-2 w-1.5 rounded-[2px] border transition-opacity
                      ${SHIP_SWATCH[type]}
                      ${placed ? "opacity-40" : "opacity-90"}
                    `}
                  />
                ))}
              </div>

              <span className={`flex-1 font-medium ${placed ? "text-slate-500" : SHIP_ACCENT[type]}`}>
                {SHIP_LABELS[type]}
              </span>

     
              {placed ? (
                <span className="rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide
                  bg-slate-800 text-slate-500 group-hover:bg-rose-900/50 group-hover:text-rose-400 transition-colors">
                  Remove
                </span>
              ) : (
                <span className="text-[10px] tabular-nums text-slate-600">
                  {len}
                </span>
              )}
            </button>
          );
        })}

        <div className="mt-1 flex flex-col gap-2">

          <button
            onClick={() => setIsVertical((v) => !v)}
            className="flex items-center justify-between rounded-lg border border-slate-700/70
              bg-slate-900/40 px-3 py-2 text-xs text-slate-400
              hover:border-amber-500/40 hover:text-amber-300 transition-colors"
          >
            <span>Orientation</span>
            <span className="font-medium text-slate-300">
              {isVertical ? "Vertical ↕" : "Horizontal ↔"}
            </span>
          </button>

    
          <button
            onClick={handleRandomize}
            className="rounded-lg border border-slate-700/70 bg-slate-900/40
              px-3 py-2 text-xs text-slate-400
              hover:border-amber-500/40 hover:text-amber-300 transition-colors"
          >
            ⚄ Randomize fleet
          </button>


          {ships.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="rounded-lg border border-slate-700/70 bg-slate-900/40
                px-3 py-2 text-xs text-slate-500
                hover:border-rose-700/50 hover:text-rose-400 transition-colors"
            >
              ✕ Clear fleet
            </button>
          )}
        </div>

  
        {remainingTypes.length === 0 && (
          <div className="mt-1 rounded-lg border border-emerald-500/30 bg-emerald-500/8
            px-3 py-2 text-[11px] text-emerald-300 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Fleet complete — ready to deploy.
          </div>
        )}
      </div>


      <div className="flex gap-1.5 sm:gap-2 flex-1">

        <div
          className="flex flex-col justify-around shrink-0"
          style={{ width: "1.1rem" }}
        >
          {rowLabels.map((label) => (
            <span
              key={label}
              className="flex items-center justify-center text-[9px] leading-none
                text-slate-600 select-none"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-0">

          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
          >
            {colLabels.map((label) => (
              <span
                key={label}
                className="flex items-center justify-center text-[9px] leading-none
                  text-slate-600 select-none"
              >
                {label}
              </span>
            ))}
          </div>

  
          <div
            className="inline-grid gap-[1px] w-full rounded-lg border border-slate-700/80
              bg-slate-700/40 p-[1px] shadow-inner shadow-black/40"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              aspectRatio: "1 / 1",
            }}
            onMouseLeave={() => setHoverCell(null)}
          >
            {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
              const x   = idx % gridSize;
              const y   = Math.floor(idx / gridSize);
              const key = `${x},${y}`;
              const owner     = cellOwner.get(key);
              const inPreview = previewCellSet.has(key);

              let cellCls: string;
              if (inPreview) {
                cellCls = previewValid
                  ? "bg-emerald-500/45 border border-emerald-400/60"
                  : "bg-rose-500/45 border border-rose-400/60";
              } else if (owner !== undefined) {
                cellCls = `${SHIP_CELL[owner]} border`;
              } else {
                cellCls = "bg-slate-900/90 hover:bg-slate-800/70 border border-slate-800/20";
              }

              return (
                <button
                  key={idx}
                  onMouseEnter={() => setHoverCell([x, y])}
                  onClick={() => handlePlace(x, y)}
                  className={`aspect-square transition-colors duration-75 ${cellCls}`}
                  aria-label={`${colLabels[x]}${rowLabels[y]}${owner !== undefined ? ` — ${SHIP_LABELS[owner]}` : ""}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}