"use client";

import { useState } from "react";
import { api, ApiRequestError } from "@/lib/api";
import { useSessionGames } from "@/lib/session";
import type { ShipPlacementDto } from "@/types/api";
import {
  Panel,
  Field,
  inputClass,
  PrimaryButton,
  ErrorText,
  SuccessText,
} from "@/components/ui";
import ShipPlacementGrid from "@/components/ShipPlacementGrid";

export default function ReadyUpPanel() {
  const { games } = useSessionGames();

  const [gameId, setGameId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [gridSize, setGridSize] = useState(10);
  const [ships, setShips] = useState<ShipPlacementDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedGame = games.find((g) => g.id === gameId);

  function handleSelectGame(id: string) {
    setGameId(id);
    const game = games.find((g) => g.id === id);
    if (game) setGridSize(game.gridSize);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.readyUp({ gameId, playerId, ships });
      setSuccess("Fleet submitted. Player is ready.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  const fleetComplete = ships.length === 5;

  return (
    <Panel title="Place ships &amp; ready up" step="03">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Field label="Game ID">
          <input
            value={gameId}
            onChange={(e) => handleSelectGame(e.target.value)}
            className={inputClass}
            placeholder="paste a game id"
            list="known-games"
          />
        </Field>
        <Field label="Player ID">
          <input
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className={inputClass}
            placeholder="host or opponent id"
            list="known-users"
          />
        </Field>
        <Field label="Grid size">
          <input
            type="number"
            min={5}
            max={20}
            value={gridSize}
            onChange={(e) => {
              setGridSize(Number(e.target.value));
              setShips([]);
            }}
            disabled={!!selectedGame}
            className={`${inputClass} disabled:opacity-60`}
          />
        </Field>
      </div>

      {selectedGame && (
        <p className="mb-4 text-xs text-slate-500">
          Host: <span className="text-slate-300">{selectedGame.hostId}</span>
          {selectedGame.opponentId && (
            <>
              {" "}· Opponent: <span className="text-slate-300">{selectedGame.opponentId}</span>
            </>
          )}
        </p>
      )}

      <ShipPlacementGrid gridSize={gridSize} ships={ships} onChange={setShips} />

      <div className="mt-4 flex items-center gap-3">
        <PrimaryButton
          onClick={handleSubmit}
          loading={loading}
          disabled={!fleetComplete || !gameId.trim() || !playerId.trim()}
        >
          Submit fleet (ready up)
        </PrimaryButton>
        <span className="text-xs text-slate-500">
          {ships.length}/5 ships placed
        </span>
      </div>

      <ErrorText message={error} />
      <SuccessText message={success} />
    </Panel>
  );
}
