"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import {
  ShipType,
  SHIP_LENGTHS,
  SHIP_LABELS,
  type ShipPlacementDto,
} from "@/types/api";
import { SHIP_COLOR, lighten, cellsFor, ShipCellSVG, BoardShell, BoardKeyframes, BoardWithLabels } from "./BoardShared";

const ALL_SHIP_TYPES: ShipType[] = [
  ShipType.Carrier,
  ShipType.Battleship,
  ShipType.Cruiser,
  ShipType.Submarine,
  ShipType.Destroyer,
];

function overlaps(a: ShipPlacementDto, b: ShipPlacementDto): boolean {
  const aSet = new Set(cellsFor(a).map(([x, y]) => `${x},${y}`));
  return cellsFor(b).some(([x, y]) => aSet.has(`${x},${y}`));
}

function inBounds(ship: ShipPlacementDto, gridSize: number): boolean {
  return cellsFor(ship).every(
    ([x, y]) => x >= 0 && y >= 0 && x < gridSize && y < gridSize
  );
}

function MiniShipPreview({ shipType }: { shipType: ShipType }) {
  const len = SHIP_LENGTHS[shipType];
  const { primary, dark } = SHIP_COLOR[shipType];
  const deck = lighten(primary, 0.3);
  const w = len * 14 + 6;
  return (
    <svg width={w} height={18} viewBox={`0 0 ${w} 18`} xmlns="http://www.w3.org/2000/svg">
      <path d={`M${w},7 L${w - 6},3 L2,3 L2,15 L${w - 6},15 L${w},11 Z`} fill={primary} opacity="0.9" />
      <rect x="2" y="12" width={w - 8} height="2" fill={dark} opacity="0.5" />
      <rect x={Math.floor(w / 2) - 8} y="0" width="16" height="5" fill={deck} rx="1" opacity="0.9" />
      <rect x={Math.floor(w / 2) - 5} y="1.5" width="3" height="3" fill={dark} rx="0.5" opacity="0.8" />
      <rect x={Math.floor(w / 2)} y="1.5" width="3" height="3" fill={dark} rx="0.5" opacity="0.8" />
    </svg>
  );
}

export default function ShipPlacementGrid({
  gridSize,
  ships = [],
  onChange,
}: {
  gridSize: number;
  ships?: ShipPlacementDto[];
  onChange: (ships: ShipPlacementDto[]) => void;
}) {

  const [selectedType, setSelectedType] = useState<ShipType>(ShipType.Carrier);
  const [isVertical, setIsVertical] = useState(false);
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const placedTypes = useMemo(() => new Set(ships.map((s) => s.shipType)), [ships]);
  const remainingTypes = ALL_SHIP_TYPES.filter((t) => !placedTypes.has(t));

  const cellOwner = useMemo(() => {
    const map = new Map<string, { ship: ShipPlacementDto; idx: number; total: number }>();
    for (const ship of ships) {
      const cs = cellsFor(ship);
      cs.forEach(([x, y], i) => map.set(`${x},${y}`, { ship, idx: i, total: cs.length }));
    }
    return map;
  }, [ships]);

  const previewShip = useMemo((): ShipPlacementDto | null => {
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
      while (attempts++ < 300) {
        const vertical = Math.random() < 0.5;
        const len = SHIP_LENGTHS[shipType];
        const sx = Math.floor(Math.random() * (vertical ? gridSize : gridSize - len + 1));
        const sy = Math.floor(Math.random() * (vertical ? gridSize - len + 1 : gridSize));
        const candidate: ShipPlacementDto = { shipType, startX: sx, startY: sy, isVertical: vertical };
        if (!placed.some((s) => overlaps(s, candidate))) { placed.push(candidate); break; }
      }
    }
    onChange(placed);
  }

  const getCellFromPoint = useCallback(
    (clientX: number, clientY: number): [number, number] | null => {
      const grid = gridRef.current;
      if (!grid) return null;
      const rect = grid.getBoundingClientRect();
      const x = Math.floor((clientX - rect.left) / (rect.width / gridSize));
      const y = Math.floor((clientY - rect.top) / (rect.height / gridSize));
      if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) return null;
      return [x, y];
    },
    [gridSize]
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setHoverCell(getCellFromPoint(e.touches[0].clientX, e.touches[0].clientY));
  }, [getCellFromPoint]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const cell = getCellFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    if (cell) handlePlace(cell[0], cell[1]);
    setHoverCell(null);
  }, [getCellFromPoint, handlePlace]);

  const colLabels = Array.from({ length: gridSize }, (_, i) => String.fromCharCode(65 + i));
  const rowLabels = Array.from({ length: gridSize }, (_, i) => String(i + 1));

  return (
    <div className="flex w-full flex-col p-3 gap-3 lg:flex-row lg:p-4 lg:gap-4 lg:items-start">

      <div className="flex flex-col gap-1.5 lg:w-48 lg:shrink-0 lg:pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Fleet</p>

        {ALL_SHIP_TYPES.map((type) => {
          const placed = placedTypes.has(type);
          const active = selectedType === type && !placed;
          const { primary } = SHIP_COLOR[type];
          return (
            <button
              key={type}
              onClick={() => (placed ? handleRemove(type) : setSelectedType(type))}
              className={[
                "group relative flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all duration-150",
                placed
                  ? "border-slate-700/40 bg-slate-900/50 opacity-60 hover:opacity-90 hover:border-rose-700/40"
                  : active
                    ? "border-yellow-500/40 bg-yellow-500/6 shadow-sm"
                    : "border-slate-700/60 bg-slate-900/30 hover:border-slate-600",
              ].join(" ")}
            >
              {active && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-yellow-400" />}
              <span className="shrink-0 opacity-80"><MiniShipPreview shipType={type} /></span>
              <span className="flex-1 font-medium truncate" style={{ color: placed ? "rgba(100,120,150,1)" : primary }}>
                {SHIP_LABELS[type]}
              </span>
              {placed ? (
                <span className="rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-slate-800 text-slate-500 group-hover:bg-rose-900/40 group-hover:text-rose-400 transition-colors">
                  Remove
                </span>
              ) : (
                <span className="text-[10px] tabular-nums text-slate-600">{SHIP_LENGTHS[type]}</span>
              )}
            </button>
          );
        })}

        <div className="mt-1 flex flex-col gap-1.5">
          <button
            onClick={() => setIsVertical((v) => !v)}
            className={[
              "flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
              isVertical
                ? "border-yellow-500/40 bg-yellow-500/8 text-yellow-300"
                : "border-slate-700/60 bg-slate-900/30 text-slate-400 hover:border-yellow-500/30 hover:text-yellow-300",
            ].join(" ")}
          >
            <span>Orientation</span>
            <span className="font-medium">{isVertical ? "Vertical ↕" : "Horizontal ↔"}</span>
          </button>

          <button
            onClick={handleRandomize}
            className="rounded-lg border border-slate-700/60 bg-slate-900/30 px-2.5 py-1.5 text-xs text-slate-400 hover:border-yellow-500/30 hover:text-yellow-300 transition-colors"
          >
            ⚄ Randomize fleet
          </button>

          {ships.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="rounded-lg border border-slate-700/60 bg-slate-900/30 px-2.5 py-1.5 text-xs text-slate-500 hover:border-rose-700/40 hover:text-rose-400 transition-colors"
            >
              ✕ Clear fleet
            </button>
          )}
        </div>

        {remainingTypes.length === 0 && (
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/6 px-2.5 py-1.5 text-[11px] text-emerald-300">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
            Fleet complete — ready to deploy.
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 lg:max-w-[40vw]">


        <div className="flex min-w-0 gap-1.5">



          <BoardWithLabels
            gridSize={gridSize}
            boardRef={gridRef}
            size="min(calc(100vh - 2rem), 100vw)"  // or whatever max size fits your layout
            onMouseLeave={() => setHoverCell(null)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
              {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
                const x = idx % gridSize;
                const y = Math.floor(idx / gridSize);
                const key = `${x},${y}`;
                const ownerInfo = cellOwner.get(key);
                const inPreview = previewCellSet.has(key);

                return (
                  <button
                    key={idx}
                    className="relative focus:outline-none"
                    onMouseEnter={() => setHoverCell([x, y])}
                    onClick={() => handlePlace(x, y)}
                    aria-label={`${colLabels[x]}${rowLabels[y]}`}
                  >
                    {inPreview && (
                      <div
                        className="absolute inset-0"
                        style={{
                          background: previewValid ? "rgba(40,200,110,0.22)" : "rgba(220,60,60,0.22)",
                          border: `1px solid ${previewValid ? "rgba(40,200,110,0.55)" : "rgba(220,60,60,0.55)"}`,
                        }}
                      />
                    )}
                    {ownerInfo && (() => {
                      const { primary, dark } = SHIP_COLOR[ownerInfo.ship.shipType];
                      const orient = ownerInfo.ship.isVertical ? "v" : "h";
                      return (
                        <>
                          <div className="absolute inset-0" style={{ background: dark + "55", borderTop: `1px solid ${primary}40`, borderLeft: `1px solid ${primary}40` }} />
                          <ShipCellSVG color={primary} dark={dark} orient={orient} idx={ownerInfo.idx} total={ownerInfo.total} />
                        </>
                      );
                    })()}
                    {!ownerInfo && !inPreview && hoverCell?.[0] === x && hoverCell?.[1] === y && (
                      <div className="absolute inset-0" style={{ background: "rgba(255,255,255,0.04)" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </BoardWithLabels>
        </div>
      </div>

      <BoardKeyframes />
    </div>
  );
}