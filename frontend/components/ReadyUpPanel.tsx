"use client";

import { useEffect, useState } from "react";
import { api, ApiRequestError } from "@/lib/api";
import { joinGameGroup, onBothPlayersReady, onPlayerReady } from "@/lib/gameHub";
import type { GameModel, ShipPlacementDto } from "@/types/api";
import {
  Panel,
  Field,
  PrimaryButton,
  ErrorText,
  SuccessText,
} from "@/components/ui";
import ShipPlacementGrid from "@/components/ShipPlacementGrid";

function shipsStorageKey(gameId: string) {
  return `battleship:ships:${gameId}`;
}

export default function ReadyUpPanel({
  gameId,
  onMatchStarted,
}: {
  gameId: string;

  onMatchStarted?: () => void;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    setUserId(window.localStorage.getItem("userId") || "");
  }, []);

  const [game, setGame] = useState<GameModel | null>(null);
  const [gameLoading, setGameLoading] = useState(true);
  const [gameError, setGameError] = useState<string | null>(null);

  const [ships, setShips] = useState<ShipPlacementDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selfReady, setSelfReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [matchStarted, setMatchStarted] = useState(false);

  useEffect(() => {
    const unsubscribe = onBothPlayersReady(({ gameId: incomingGameId }) => {
      if (incomingGameId !== gameId) return;
      setMatchStarted(true);

      setTimeout(() => onMatchStarted?.(), 700);
    });
    return unsubscribe;
  }, [gameId, onMatchStarted]);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setGameLoading(true);
      setGameError(null);
      try {
        const g = await api.getGame(gameId);
        if (cancelled) return;
        setGame(g);
        await joinGameGroup(gameId);
      } catch (err) {
        if (!cancelled) {
          setGameError(err instanceof ApiRequestError ? err.message : "Unexpected error");
        }
      } finally {
        if (!cancelled) setGameLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  useEffect(() => {
    const unsubscribe = onPlayerReady(({ gameId: incomingGameId, playerId }) => {
      if (incomingGameId !== gameId) return;
      if (playerId === userId) {
        setSelfReady(true);
      } else {
        setOpponentReady(true);
      }
    });
    return unsubscribe;
  }, [gameId, userId]);

  async function handleSubmit() {
    if (!userId || !game) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.readyUp({ gameId, playerId: userId, ships });
      window.sessionStorage.setItem(shipsStorageKey(gameId), JSON.stringify(ships));
      setSelfReady(true);
      setSuccess("Fleet submitted. Waiting for the other player…");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  const fleetComplete = ships.length === 5;

  if (gameLoading || userId === null) {
    return (
      <Panel title="Place ships &amp; ready up" step="03">
        <p className="text-xs text-slate-500">Loading game…</p>
      </Panel>
    );
  }

  if (gameError || !game) {
    return (
      <Panel title="Place ships &amp; ready up" step="03">
        <ErrorText message={gameError || "Game not found."} />
      </Panel>
    );
  }

  return (
    <Panel title="Place ships &amp; ready up" step="03">
      <p className="mb-4 text-xs text-slate-500">
        Host: <span className="text-slate-300">{game.host?.displayName ?? game.hostId}</span>
        {game.opponentId && (
          <>
            {" "}· Opponent:{" "}
            <span className="text-slate-300">{game.opponent?.displayName ?? game.opponentId}</span>
          </>
        )}
      </p>

      <div className="mb-4 flex gap-3">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] ${selfReady ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
            }`}
        >
          You: {selfReady ? "Ready" : "Placing ships…"}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] ${opponentReady ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
            }`}
        >
          Opponent: {opponentReady ? "Ready" : "Placing ships…"}
        </span>
      </div>
      {matchStarted && (
        <p className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          Both fleets are in. The battle begins…
        </p>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <ShipPlacementGrid gridSize={game.gridSize} ships={ships} onChange={setShips} />
        </div>

        <div className="flex items-center gap-3 lg:flex-col lg:items-stretch lg:gap-2 lg:pt-5 lg:w-48 lg:shrink-0">
          <PrimaryButton
            onClick={handleSubmit}
            loading={loading}
            disabled={!fleetComplete || selfReady}
          >
            {selfReady ? "Fleet submitted" : "Submit fleet (ready up)"}
          </PrimaryButton>
          <span className="text-xs text-slate-500 lg:text-center">
            {ships.length}/5 ships placed
          </span>
        </div>
      </div>

      <ErrorText message={error} />
      <SuccessText message={success} />
    </Panel>
  );
}