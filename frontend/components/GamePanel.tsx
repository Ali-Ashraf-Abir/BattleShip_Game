"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiRequestError } from "@/lib/api";
import { useSessionGames } from "@/lib/session";
import { joinGameGroup, onPlayerJoined } from "@/lib/gameHub";
import { GAME_STATUS_LABELS, type GameModel } from "@/types/api";
import {
  Panel,
  PrimaryButton,
  ErrorText,
  useToast,
} from "@/components/ui";

const GRID_SIZE = 10;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="h-px w-full bg-slate-800/80" />;
}

function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-500" />
    </span>
  );
}

function StatusPill({ label }: { label: string }) {
  const isActive =
    label.toLowerCase().includes("waiting") ||
    label.toLowerCase().includes("active");
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium
        ${
          isActive
            ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-300"
            : "border border-slate-700/50 bg-slate-800 text-slate-400"
        }`}
    >
      {isActive && <LiveDot />}
      {label}
    </span>
  );
}

function PlayerAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-900/60 text-[13px] font-semibold text-cyan-200">
      {initials}
    </div>
  );
}

function SonarIcon() {
  return (
    <div className="relative h-9 w-9 shrink-0">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full border border-cyan-400 opacity-0"
          style={{ animation: `sonar 2.4s ease-out ${i * 0.8}s infinite` }}
        />
      ))}
      <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500" />
      <style>{`@keyframes sonar{0%{transform:scale(.2);opacity:.8}100%{transform:scale(1.8);opacity:0}}`}</style>
    </div>
  );
}

export default function GamePanel() {
  const router = useRouter();
  const { games, upsertGame } = useSessionGames();
  const { showToast, ToastElement } = useToast();

  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    setUserId(window.localStorage.getItem("userId") || "");
    setDisplayName(window.localStorage.getItem("displayName") || "You");
  }, []);

  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [availableGames, setAvailableGames] = useState<GameModel[]>([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [availableError, setAvailableError] = useState<string | null>(null);
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  async function loadAvailableGames() {
    setAvailableLoading(true);
    setAvailableError(null);
    try {
      setAvailableGames(await api.getAvailableGames());
    } catch (err) {
      setAvailableError(
        err instanceof ApiRequestError ? err.message : "Unexpected error"
      );
    } finally {
      setAvailableLoading(false);
    }
  }

  useEffect(() => {
    loadAvailableGames();
  }, []);

  useEffect(() => {
    const unsubscribe = onPlayerJoined(({ gameId }) => {
      const hostedGame = games.find(
        (g) => g.id === gameId && g.hostId === userId
      );
      if (!hostedGame) return;
      showToast("A player joined your game — heading to the board…");
      setTimeout(() => router.push(`/game/${gameId}`), 800);
    });
    return unsubscribe;
  }, [games, userId, router, showToast]);

  async function handleCreate() {
    if (!userId) {
      setCreateError("No user found. Create a user first.");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const game = await api.createGame({ hostId: userId, gridSize: GRID_SIZE });
      upsertGame(game);
      await joinGameGroup(game.id);
      loadAvailableGames();
    } catch (err) {
      setCreateError(
        err instanceof ApiRequestError ? err.message : "Unexpected error"
      );
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleJoin(gameId: string) {
    if (!userId) {
      setJoinError("No user found. Create a user first.");
      return;
    }
    setJoiningGameId(gameId);
    setJoinError(null);
    try {
      const game = await api.joinGame({ playerId: userId, gameId });
      upsertGame(game);
      await joinGameGroup(game.id);
      showToast("Joined! Heading to the board…");
      setTimeout(() => router.push(`/game/${game.id}`), 600);
    } catch (err) {
      setJoinError(
        err instanceof ApiRequestError ? err.message : "Unexpected error"
      );
      setJoiningGameId(null);
    }
  }

  return (
    <Panel title="Lobby" step="02">
      <div className="flex flex-col gap-6">


        <div className="flex items-center gap-3">
          <SonarIcon />
          <div>
            <p className="text-base font-semibold text-slate-100">Battle Lobby</p>
            <p className="text-xs text-slate-500">
              Host a game or join an open one — all matches are 10×10.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">

          <div className="flex flex-col gap-4 rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
            <SectionLabel>Host a new game</SectionLabel>

            <div className="flex items-center gap-3 rounded-lg bg-slate-800/60 px-3 py-2.5">
              {displayName ? (
                <PlayerAvatar name={displayName} />
              ) : (
                <div className="h-9 w-9 shrink-0 rounded-full bg-slate-700/60" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-100">
                  {displayName || "Loading…"}
                </p>
                <p className="text-[11px] text-slate-500">Playing as you</p>
              </div>
            </div>

            <Divider />

    
            <div className="flex items-center justify-between rounded-lg border border-slate-700/40 bg-slate-950/40 px-3 py-2.5">
              <div>
                <p className="text-xs font-medium text-slate-300">Grid size</p>
                <p className="text-[11px] text-slate-500">Standard — balanced play</p>
              </div>
              <span className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm font-semibold tabular-nums text-cyan-300">
                10×10
              </span>
            </div>

            <PrimaryButton
              onClick={handleCreate}
              loading={createLoading}
              disabled={!userId}
            >
              Deploy fleet
            </PrimaryButton>
            <ErrorText message={createError} />
          </div>

    
          <div className="flex flex-col gap-3 rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <SectionLabel>Open games</SectionLabel>
              <button
                onClick={loadAvailableGames}
                disabled={availableLoading}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-slate-500
                  transition-colors hover:bg-slate-800 hover:text-cyan-400 disabled:opacity-40"
              >
                {availableLoading ? (
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                ) : (
                  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" strokeLinecap="round" />
                    <polyline points="11,1 13.5,2.5 12,5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                Refresh
              </button>
            </div>

            <ErrorText message={availableError} />
            <ErrorText message={joinError} />

            <div className="flex min-h-[8rem] flex-col gap-2">
              {availableLoading && (
                <div className="flex flex-1 items-center justify-center py-8">
                  <svg className="h-5 w-5 animate-spin text-slate-600" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                </div>
              )}

              {!availableLoading && availableGames.length === 0 && !availableError && (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
                  <span className="text-2xl">⚓</span>
                  <p className="text-xs font-medium text-slate-400">No open games right now.</p>
                  <p className="text-[11px] text-slate-600">Host one and wait for a challenger.</p>
                </div>
              )}

              {availableGames.map((g) => {
                const isOwnGame = g.hostId === userId;
                const hostName = g.host?.displayName ?? "Unknown";
                return (
                  <div
                    key={g.id}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors
                      ${
                        isOwnGame
                          ? "border-cyan-500/20 bg-cyan-500/5"
                          : "border-slate-700/50 bg-slate-950/40 hover:border-slate-600/70"
                      }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <PlayerAvatar name={hostName} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isOwnGame && (
                            <span className="shrink-0 rounded border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-cyan-400">
                              Yours
                            </span>
                          )}
                          <p className="truncate text-sm font-semibold text-slate-100">
                            {hostName}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500">10×10 grid</p>
                      </div>
                    </div>

                    <PrimaryButton
                      onClick={() => handleJoin(g.id)}
                      loading={joiningGameId === g.id}
                      disabled={!userId || isOwnGame}
                    >
                      {isOwnGame ? "Waiting…" : "Join"}
                    </PrimaryButton>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {ToastElement}
    </Panel>
  );
}