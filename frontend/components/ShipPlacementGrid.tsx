"use client";

import { useMemo, useState } from "react";
import {
  ShipType,
  SHIP_LENGTHS,
  SHIP_LABELS,
  type ShipPlacementDto,
} from "@/types/api";

const ALL_SHIP_TYPES = [
  ShipType.Carrier,
  ShipType.Battleship,
  ShipType.Cruiser,
  ShipType.Submarine,
  ShipType.Destroyer,
];

const SHIP_COLORS: Record<ShipType, string> = {
  [ShipType.Carrier]: "bg-amber-500/80 border-amber-400",
  [ShipType.Battleship]: "bg-sky-500/80 border-sky-400",
  [ShipType.Cruiser]: "bg-emerald-500/80 border-emerald-400",
  [ShipType.Submarine]: "bg-violet-500/80 border-violet-400",
  [ShipType.Destroyer]: "bg-rose-500/80 border-rose-400",
};

function cellsFor(ship: ShipPlacementDto): Array<[number, number]> {
  const length = SHIP_LENGTHS[ship.shipType];
  const cells: Array<[number, number]> = [];
  for (let i = 0; i < length; i++) {
    const x = ship.isVertical ? ship.startX : ship.startX + i;
    const y = ship.isVertical ? ship.startY + i : ship.startY;
    cells.push([x, y]);
  }
  return cells;
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
  const [isVertical, setIsVertical] = useState(false);
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);

  const placedTypes = useMemo(() => new Set(ships.map((s) => s.shipType)), [ships]);
  const remainingTypes = ALL_SHIP_TYPES.filter((t) => !placedTypes.has(t));

  const cellOwner = useMemo(() => {
    const map = new Map<string, ShipType>();
    for (const ship of ships) {
      for (const [x, y] of cellsFor(ship)) {
        map.set(`${x},${y}`, ship.shipType);
      }
    }
    return map;
  }, [ships]);

  const previewShip: ShipPlacementDto | null = useMemo(() => {
    if (!hoverCell || placedTypes.has(selectedType)) return null;
    return {
      shipType: selectedType,
      startX: hoverCell[0],
      startY: hoverCell[1],
      isVertical,
    };
  }, [hoverCell, selectedType, isVertical, placedTypes]);

  const previewCells = previewShip ? cellsFor(previewShip) : [];
  const previewValid =
    previewShip &&
    inBounds(previewShip, gridSize) &&
    !ships.some((s) => overlaps(s, previewShip));

  function handlePlace(x: number, y: number) {
    if (placedTypes.has(selectedType)) return;
    const candidate: ShipPlacementDto = {
      shipType: selectedType,
      startX: x,
      startY: y,
      isVertical,
    };
    if (!inBounds(candidate, gridSize)) return;
    if (ships.some((s) => overlaps(s, candidate))) return;

    const next = [...ships, candidate];
    onChange(next);

    const stillRemaining = ALL_SHIP_TYPES.filter(
      (t) => !next.some((s) => s.shipType === t)
    );
    if (stillRemaining.length > 0) setSelectedType(stillRemaining[0]);
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
        const length = SHIP_LENGTHS[shipType];
        const maxX = vertical ? gridSize - 1 : gridSize - length;
        const maxY = vertical ? gridSize - length : gridSize - 1;
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

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Fleet selector */}
      <div className="flex flex-row gap-2 lg:w-44 lg:flex-col">
        <p className="hidden text-xs font-medium uppercase tracking-wide text-slate-500 lg:block">
          Fleet
        </p>
        {ALL_SHIP_TYPES.map((type) => {
          const placed = placedTypes.has(type);
          const active = selectedType === type;
          return (
            <button
              key={type}
              onClick={() => (placed ? handleRemove(type) : setSelectedType(type))}
              className={`flex flex-1 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-xs transition lg:flex-none ${
                active
                  ? "border-amber-500/60 bg-amber-500/10"
                  : "border-slate-700 bg-slate-950/40 hover:border-slate-600"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-sm border ${SHIP_COLORS[type]}`} />
                <span className="text-slate-200">{SHIP_LABELS[type]}</span>
              </span>
              <span className="text-slate-500">
                {placed ? "✕ remove" : `${SHIP_LENGTHS[type]} cells`}
              </span>
            </button>
          );
        })}

        <div className="mt-1 flex flex-col gap-2 lg:mt-3">
          <button
            onClick={() => setIsVertical((v) => !v)}
            className="rounded-md border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs text-slate-300 hover:border-amber-500/50"
          >
            Orientation: {isVertical ? "Vertical ↕" : "Horizontal ↔"}
          </button>
          <button
            onClick={handleRandomize}
            className="rounded-md border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs text-slate-300 hover:border-amber-500/50"
          >
            Randomize fleet
          </button>
          {ships.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="rounded-md border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs text-slate-400 hover:border-rose-500/50 hover:text-rose-300"
            >
              Clear fleet
            </button>
          )}
        </div>

        {remainingTypes.length === 0 && (
          <p className="mt-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[11px] text-emerald-300 lg:mt-3">
            Fleet complete — ready to send.
          </p>
        )}
      </div>

      {/* Grid */}
      <div
        className="inline-grid gap-px rounded-md border border-slate-700 bg-slate-700/60 p-px"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          width: "min(420px, 100%)",
          aspectRatio: "1 / 1",
        }}
        onMouseLeave={() => setHoverCell(null)}
      >
        {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
          const x = idx % gridSize;
          const y = Math.floor(idx / gridSize);
          const owner = cellOwner.get(`${x},${y}`);
          const inPreview = previewCells.some(([px, py]) => px === x && py === y);

          let bg = "bg-slate-950 hover:bg-slate-800/80";
          if (owner !== undefined) bg = SHIP_COLORS[owner];
          if (inPreview) bg = previewValid ? "bg-emerald-500/50" : "bg-rose-500/50";

          return (
            <button
              key={idx}
              onMouseEnter={() => setHoverCell([x, y])}
              onClick={() => handlePlace(x, y)}
              className={`aspect-square ${bg} transition-colors`}
              aria-label={`cell ${x},${y}`}
            />
          );
        })}
      </div>
    </div>
  );
}
