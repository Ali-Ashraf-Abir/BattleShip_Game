"use client";

import { useEffect, useState } from "react";
import { api, ApiRequestError } from "@/lib/api";
import { useSessionGames } from "@/lib/session";
import { GAME_STATUS_LABELS, type GameModel } from "@/types/api";
import {
  Panel,
  Field,
  inputClass,
  PrimaryButton,
  CopyableId,
  ErrorText,
} from "@/components/ui";

export default function GamePanel() {
  const { games, upsertGame, clearGames } = useSessionGames();

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(window.localStorage.getItem("userId") || "");
  }, []);

  const [gridSize, setGridSize] = useState(10);
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
      const list = await api.getAvailableGames();
      setAvailableGames(list);
    } catch (err) {
      setAvailableError(err instanceof ApiRequestError ? err.message : "Unexpected error");
    } finally {
      setAvailableLoading(false);
    }
  }

  useEffect(() => {
    loadAvailableGames();
  }, []);

  async function handleCreate() {
    if (!userId) {
      setCreateError("No user found in this browser. Create a user first.");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const game = await api.createGame({ hostId: userId, gridSize: Number(gridSize) });
      upsertGame(game);
      loadAvailableGames();
    } catch (err) {
      setCreateError(err instanceof ApiRequestError ? err.message : "Unexpected error");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleJoin(gameId: string) {
    if (!userId) {
      setJoinError("No user found in this browser. Create a user first.");
      return;
    }
    setJoiningGameId(gameId);
    setJoinError(null);
    try {
      const game = await api.joinGame({ playerId: userId, gameId });
      upsertGame(game);
      loadAvailableGames();
    } catch (err) {
      setJoinError(err instanceof ApiRequestError ? err.message : "Unexpected error");
    } finally {
      setJoiningGameId(null);
    }
  }

  return (
    <Panel title="Create &amp; join game" step="02">
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Create */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Host a new game
          </p>
          <Field label="Host (you)">
            {userId ? (
              <CopyableId value={userId} label="you" />
            ) : (
              <p className="text-xs text-amber-400">
                No user id found in this browser. Create a user first.
              </p>
            )}
          </Field>
          <Field label="Grid size">
            <input
              type="number"
              min={5}
              max={20}
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <PrimaryButton onClick={handleCreate} loading={createLoading} disabled={!userId}>
            Create game
          </PrimaryButton>
          <ErrorText message={createError} />
        </div>

        {/* Join */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Join an existing game
            </p>
            <button
              onClick={loadAvailableGames}
              className="text-xs text-slate-500 hover:text-amber-400"
            >
              Refresh
            </button>
          </div>

          {availableLoading && (
            <p className="text-xs text-slate-500">Loading available games…</p>
          )}
          <ErrorText message={availableError} />
          <ErrorText message={joinError} />

          {!availableLoading && availableGames.length === 0 && !availableError && (
            <p className="text-xs text-slate-500">No open games right now.</p>
          )}

          <ul className="flex flex-col gap-1.5">
            {availableGames.map((g) => {
              const isOwnGame = g.hostId === userId;
              return (
                <li
                  key={g.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-950/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <CopyableId value={g.id} label="game" />
                    <span className="text-xs text-slate-500">
                      grid {g.gridSize}×{g.gridSize}
                    </span>
                    {g.host?.displayName && (
                      <span className="text-xs text-slate-400">
                        host: {g.host.displayName}
                      </span>
                    )}
                  </div>
                  <PrimaryButton
                    onClick={() => handleJoin(g.id)}
                    loading={joiningGameId === g.id}
                    disabled={!userId || isOwnGame}
                  >
                    {isOwnGame ? "Your game" : "Join"}
                  </PrimaryButton>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {games.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Games this session
            </span>
            <button
              onClick={clearGames}
              className="text-xs text-slate-500 hover:text-amber-400"
            >
              Clear
            </button>
          </div>
          <ul className="flex flex-col gap-1.5">
            {games.map((g) => (
              <li
                key={g.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-950/50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <CopyableId value={g.id} label="game" />
                  <span className="text-xs text-slate-500">grid {g.gridSize}×{g.gridSize}</span>
                </div>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                  {GAME_STATUS_LABELS[g.status] ?? `status ${g.status}`}
                </span>
                <div className="flex items-center gap-2">
                  <CopyableId value={g.hostId} label="host" />
                  {g.opponentId && <CopyableId value={g.opponentId} label="opp" />}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}