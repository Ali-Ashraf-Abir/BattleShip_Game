"use client";

import Link from "next/link";
import { Panel, PrimaryButton } from "@/components/ui";

export default function GameOverPanel({
  didWin,
  gameId,
}: {
  didWin: boolean;
  gameId: string;
}) {
  return (
    <Panel title="Game over" step="05">
      <div
        className={`mb-4 rounded-md border px-4 py-3 text-sm ${
          didWin
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : "border-rose-500/30 bg-rose-500/10 text-rose-300"
        }`}
      >
        {didWin ? "You won the battle! 🎉" : "Your fleet was destroyed. Defeat."}
      </div>
      <p className="mb-4 text-xs text-slate-500">Game ID: {gameId}</p>
      <Link href="/">
        <PrimaryButton onClick={() => {}}>Back to lobby</PrimaryButton>
      </Link>
    </Panel>
  );
}