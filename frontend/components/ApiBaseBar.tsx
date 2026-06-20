"use client";

import { useState } from "react";
import { getBaseUrl, setBaseUrl } from "@/lib/api";

export default function ApiBaseBar() {
  // Lazy initializer runs once on mount, after hydration, avoiding the
  // server/client mismatch without needing a setState-in-effect.
  const [value, setValue] = useState(() => getBaseUrl());
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setBaseUrl(value);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-900/60 px-4 py-3">
      <span className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
        Target
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        placeholder="http://localhost:5000"
        className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
      />
      <button
        onClick={handleSave}
        className="rounded-md bg-amber-500/90 px-3 py-1.5 text-sm font-medium text-slate-950 transition hover:bg-amber-400 active:bg-amber-500"
      >
        {saved ? "Saved" : "Set"}
      </button>
    </div>
  );
}
