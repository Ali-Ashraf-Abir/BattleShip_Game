"use client";

import { useEffect, useState } from "react";
import { subscribeToLog, clearLog, type LogEntry } from "@/lib/api";

function StatusBadge({ entry }: { entry: LogEntry }) {
  if (entry.error) {
    return (
      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-medium text-red-300">
        network error
      </span>
    );
  }
  if (entry.status === undefined) {
    return (
      <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-300">
        pending…
      </span>
    );
  }
  const ok = entry.ok;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
        ok ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
      }`}
    >
      {entry.status}
    </span>
  );
}

function formatBody(body: unknown): string {
  if (body === undefined || body === null) return "—";
  if (typeof body === "string") return body;
  try {
    return JSON.stringify(body, null, 2);
  } catch {
    return String(body);
  }
}

export default function RequestLogPanel() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => subscribeToLog(setEntries), []);

  return (
    <section className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs text-amber-500/80">log</span>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
            Request log
          </h2>
        </div>
        {entries.length > 0 && (
          <button
            onClick={clearLog}
            className="text-xs text-slate-500 hover:text-amber-400"
          >
            Clear
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">
          Calls you make above will show up here with full request/response bodies.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => {
            const isOpen = expanded === entry.id;
            return (
              <li
                key={entry.id}
                className="overflow-hidden rounded-md border border-slate-800 bg-slate-950/50"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : entry.id)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left"
                >
                  <span className="font-mono text-[11px] text-slate-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
                    {entry.method}
                  </span>
                  <span className="flex-1 truncate font-mono text-xs text-slate-300">
                    {entry.url.replace(/^https?:\/\/[^/]+/, "")}
                  </span>
                  {entry.durationMs !== undefined && (
                    <span className="font-mono text-[11px] text-slate-500">
                      {Math.round(entry.durationMs)}ms
                    </span>
                  )}
                  <StatusBadge entry={entry} />
                  <span className="text-slate-500">{isOpen ? "−" : "+"}</span>
                </button>

                {isOpen && (
                  <div className="grid gap-3 border-t border-slate-800 px-3 py-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        Request
                      </p>
                      <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded bg-slate-950 p-2 font-mono text-[11px] text-slate-300">
                        {formatBody(entry.requestBody)}
                      </pre>
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        Response
                      </p>
                      <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded bg-slate-950 p-2 font-mono text-[11px] text-slate-300">
                        {entry.error ?? formatBody(entry.responseBody)}
                      </pre>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
