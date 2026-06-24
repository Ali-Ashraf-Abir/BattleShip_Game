"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { api, ApiRequestError } from "@/lib/api";
import {
  joinGameGroup,
  onAttackResult,
  onShipSunk,
  onGameOver as onGameOverEvent,
  type AttackResultPayload,
} from "@/lib/gameHub";
import type {
  AttackLogDto,
  OpponentShipSummaryDto,
  ShipDto,
  ShipType,
  ShipTypeName,
} from "@/types/api";
import { SHIP_LABELS, shipTypeFromApi } from "@/types/api";
import { Panel, ErrorText, SuccessText } from "@/components/ui";
import AttackGrid from "@/components/AttackGrid";
import OwnFleetGrid from "@/components/OwnFleetGrid";

function normalizeShipType(value: ShipTypeName | null): ShipType | null {
  if (value === null) return null;
  const resolved = shipTypeFromApi(value);
  if (resolved === undefined) {

    console.error(`Unrecognized ship type from server: ${JSON.stringify(value)}`);
    return null;
  }
  return resolved;
}

type CellState = "unknown" | "hit" | "miss";

export default function BattlePanel({
  gameId,
  gridSize,
  myShips,
  opponentShipSummary,
  initialAttacks,
  initialCurrentTurnPlayerId,
  onGameOver,
}: {
  gameId: string;
  gridSize: number;
  myShips: ShipDto[];

  opponentShipSummary: OpponentShipSummaryDto[];
  initialAttacks: AttackLogDto[];
  initialCurrentTurnPlayerId: string | null;

  onGameOver: () => void;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    setUserId(window.localStorage.getItem("userId") || "");
  }, []);


  const initialMyShots = useMemo(() => {
    const map = new Map<string, CellState>();
    if (!userId) return map;
    for (const a of initialAttacks) {
      if (a.attackerId === userId) {
        map.set(`${a.x},${a.y}`, a.isHit ? "hit" : "miss");
      }
    }
    return map;
  }, [initialAttacks, userId]);

  const initialIncoming = useMemo(() => {
    const hits = new Set<string>();
    const misses = new Set<string>();
    if (!userId) return { hits, misses };
    for (const a of initialAttacks) {
      if (a.attackerId !== userId) {
        const key = `${a.x},${a.y}`;
        if (a.isHit) hits.add(key);
        else misses.add(key);
      }
    }
    return { hits, misses };
  }, [initialAttacks, userId]);

  const [myShots, setMyShots] = useState<Map<string, CellState>>(new Map());
  const [incomingHits, setIncomingHits] = useState<Set<string>>(new Set());
  const [incomingMisses, setIncomingMisses] = useState<Set<string>>(new Set());


  useEffect(() => {
    if (!userId) return;
    setMyShots(initialMyShots);
    setIncomingHits(initialIncoming.hits);
    setIncomingMisses(initialIncoming.misses);

  }, [userId, gameId]);

  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState<string | null>(
    initialCurrentTurnPlayerId
  );
  const [firing, setFiring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [sunkOpponentTypes, setSunkOpponentTypes] = useState<Set<ShipType>>(
    new Set(
      opponentShipSummary
        .filter((s) => s.isSunk)
        .map((s) => shipTypeFromApi(s.shipType))
    )
  );

  const [hubJoinError, setHubJoinError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if(!userId){
      return;
    }
    joinGameGroup(gameId,userId).catch((err) => {
      if (!cancelled) {
        setHubJoinError(
          err instanceof Error
            ? `Could not join live updates: ${err.message}`
            : "Could not join live updates."
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [gameId,userId]);

  useEffect(() => {
    const unsubscribe = onAttackResult((payload: AttackResultPayload) => {
      if (payload.gameId !== gameId) return;

      const key = `${payload.x},${payload.y}`;
      const iWasAttacker = payload.attackerId === userId;

      if (iWasAttacker) {
        setMyShots((prev) => {
          const next = new Map(prev);
          next.set(key, payload.isHit ? "hit" : "miss");
          return next;
        });
        setLastResult(
          payload.isHit
            ? `Hit at (${payload.x}, ${payload.y})!`
            : `Miss at (${payload.x}, ${payload.y}).`
        );
      } else {
        if (payload.isHit) {
          setIncomingHits((prev) => new Set(prev).add(key));
          setLastResult(`Opponent hit you at (${payload.x}, ${payload.y})!`);
        } else {
          setIncomingMisses((prev) => new Set(prev).add(key));
          setLastResult(`Opponent missed at (${payload.x}, ${payload.y}).`);
        }
      }

      if (!payload.isGameOver) {
        setCurrentTurnPlayerId(payload.nextTurnPlayerId);
      }
    });
    return unsubscribe;
  }, [gameId, userId]);

  useEffect(() => {
    const unsubscribe = onShipSunk((payload) => {
      if (payload.gameId !== gameId) return;
      const shipType = normalizeShipType(payload.shipType);
      const label = shipType !== null ? SHIP_LABELS[shipType] : "A ship";
      const wasMyShip = payload.defenderId === userId;
      setLastResult(`${wasMyShip ? "Your" : "Opponent's"} ${label} was sunk!`);
      if (!wasMyShip && shipType !== null) {
        setSunkOpponentTypes((prev) => new Set(prev).add(shipType));
      }
    });
    return unsubscribe;
  }, [gameId, userId]);

  useEffect(() => {
    const unsubscribe = onGameOverEvent((payload) => {
      if (payload.gameId !== gameId) return;

      onGameOver();
    });
    return unsubscribe;
  }, [gameId, onGameOver]);

  async function handleFire(x: number, y: number) {
    if (!userId) return;
    setFiring(true);
    setError(null);
    try {
      await api.attack({ gameId, attackerId: userId, x, y });

    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unexpected error");
    } finally {
      setFiring(false);
    }
  }

  if (userId === null) {
    return (
      <Panel title="Battle" step="04">
        <p className="text-xs text-slate-500">Loading…</p>
      </Panel>
    );
  }

  const isMyTurn = currentTurnPlayerId === userId;

  return (
    <Panel title="Battle" step="04">
      <div
        className={`mb-3 rounded-md border px-3 py-2 text-xs ${isMyTurn
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
          : "border-slate-700 bg-slate-950/40 text-slate-400"
          }`}
      >
        {isMyTurn ? "Your turn — fire at the opponent's grid." : "Waiting for opponent's move…"}
      </div>

      <div
        className="grid gap-6 sm:grid-cols-2 items-start justify-start"
        style={{
          "--board-size": "min(90vw, 480px)",
        } as CSSProperties}
      >
        <div className="flex flex-col gap-2 mt-8 ">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Opponent&apos;s waters
          </p>
          <AttackGrid
            gridSize={gridSize}
            cellStates={myShots}
            onFire={handleFire}
            disabled={!isMyTurn || firing}
          />
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {opponentShipSummary.map((s) => {
              const type = shipTypeFromApi(s.shipType);
              return (
                <li
                  key={s.shipType}
                  className={`rounded-full px-2 py-0.5 text-[11px] ${sunkOpponentTypes.has(type)
                    ? "bg-rose-500/20 text-rose-300 line-through"
                    : "bg-slate-800 text-slate-400"
                    }`}
                >
                  {SHIP_LABELS[type]}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Your fleet
          </p>
          <OwnFleetGrid
            gridSize={gridSize}
            ships={myShips.map((s) => ({
              shipType: shipTypeFromApi(s.shipType),
              startX: s.startX,
              startY: s.startY,
              isVertical: s.isVertical,
            }))}
            incomingHits={incomingHits}
            incomingMisses={incomingMisses}
          />
        </div>
      </div>

      <ErrorText message={error} />
      <ErrorText message={hubJoinError} />
      <SuccessText message={lastResult} />
    </Panel>
  );
}