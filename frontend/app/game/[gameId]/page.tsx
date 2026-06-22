"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiRequestError } from "@/lib/api";
import type { GameStateDto } from "@/types/api";
import ReadyUpPanel from "@/components/ReadyUpPanel";
import BattlePanel from "@/components/BattlePanel";
import GameOverPanel from "@/components/GameOverPanel";


type Phase = "loading" | "error" | "ready-up" | "battle" | "game-over";

export default function GamePage() {
  const params = useParams<{ gameId: string }>();
  const gameId = params.gameId;

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    setUserId(window.localStorage.getItem("userId") || "");
  }, []);

  const [phase, setPhase] = useState<Phase>("loading");
  const [state, setState] = useState<GameStateDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadAndDeriveStage(currentUserId: string) {
    try {
      const s = await api.getGameState(gameId, currentUserId);
      setState(s);

      if (s.winnerId) {
        setPhase("game-over");
        return;
      }

      const iHaveFullFleet = s.myShips.length === 5;
      const opponentHasFullFleet = s.opponentShipSummary.length === 5;

      setPhase(iHaveFullFleet && opponentHasFullFleet ? "battle" : "ready-up");
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Unexpected error");
      setPhase("error");
    }
  }

  useEffect(() => {
    if (userId === null) return; 
    if (!userId) {
      setLoadError("No user found in this browser. Create a user first.");
      setPhase("error");
      return;
    }
    loadAndDeriveStage(userId);
   
  }, [gameId, userId]);

  if (phase === "loading" || userId === null) {
    return <p className="text-xs text-slate-500">Loading game…</p>;
  }

  if (phase === "error" || !state || !userId) {
    return <p className="text-xs text-rose-400">{loadError || "Could not load game."}</p>;
  }

  if (phase === "ready-up") {
    return (
      <ReadyUpPanel
        gameId={gameId}
        onMatchStarted={() => loadAndDeriveStage(userId)}
      />
    );
  }

  if (phase === "battle") {
    return (
      <BattlePanel
        gameId={gameId}
        gridSize={state.gridSize}
        myShips={state.myShips}
        opponentShipSummary={state.opponentShipSummary}
        initialAttacks={state.attacks}
        initialCurrentTurnPlayerId={state.currentTurnPlayerId}
        onGameOver={() => loadAndDeriveStage(userId)}
      />
    );
  }

  return <GameOverPanel didWin={state.winnerId === userId} gameId={gameId} />;
}