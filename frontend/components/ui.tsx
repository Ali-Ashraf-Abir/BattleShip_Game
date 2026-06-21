"use client";

import { useEffect, useState, type ReactNode } from "react";

export function Panel({
  title,
  step,
  children,
}: {
  title: string;
  step: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-5">
      <div className="mb-4 flex items-baseline gap-2">
        <span className="font-mono text-xs text-amber-500/80">{step}</span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40";

export function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex items-center gap-2 rounded-md bg-amber-500/90 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
    >
      {loading && (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
      )}
      {children}
    </button>
  );
}

export function CopyableId({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="group inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-950/60 px-2 py-1 font-mono text-xs text-slate-300 transition hover:border-amber-500/50 hover:text-amber-300"
    >
      {label && <span className="text-slate-500">{label}</span>}
      <span>{value.length > 13 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value}</span>
      <span className="text-slate-500 group-hover:text-amber-400">
        {copied ? "✓" : "⧉"}
      </span>
    </button>
  );
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {message}
    </p>
  );
}

export function SuccessText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
      {message}
    </p>
  );
}



type ToastState = { id: number; message: string } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);

  function showToast(message: string) {
    setToast({ id: Date.now(), message });
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const ToastElement = toast ? (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-slate-800 px-4 py-2 text-sm text-slate-100 shadow-lg ring-1 ring-slate-700">
      {toast.message}
    </div>
  ) : null;

  return { showToast, ToastElement };
}