"use client";

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
  return (
    <div
      className="inline-grid gap-px rounded-md border border-slate-700 bg-slate-700/60 p-px"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
        width: "min(420px, 100%)",
        aspectRatio: "1 / 1",
      }}
    >
      {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
        const x = idx % gridSize;
        const y = Math.floor(idx / gridSize);
        const state = cellStates.get(`${x},${y}`) ?? "unknown";

        let bg = "bg-slate-950 hover:bg-slate-800/80";
        if (state === "hit") bg = "bg-rose-500/80";
        if (state === "miss") bg = "bg-slate-600/60";

        const alreadyFired = state !== "unknown";

        return (
          <button
            key={idx}
            onClick={() => !alreadyFired && !disabled && onFire(x, y)}
            disabled={disabled || alreadyFired}
            className={`aspect-square ${bg} transition-colors disabled:cursor-not-allowed`}
            aria-label={`fire at ${x},${y}`}
          >
            {state === "hit" && (
              <span className="flex h-full items-center justify-center text-[10px] text-white">
                ✕
              </span>
            )}
            {state === "miss" && (
              <span className="flex h-full items-center justify-center text-[10px] text-slate-300">
                •
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}