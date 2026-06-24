"use client";

import * as signalR from "@microsoft/signalr";
import { getBaseUrl } from "@/lib/api";
import { ShipTypeName } from "@/types/api";

let connection: signalR.HubConnection | null = null;
let startPromise: Promise<void> | null = null;

function getConnection(): signalR.HubConnection {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(`${getBaseUrl()}/hubs/game`)
      .withAutomaticReconnect()
      .build();
  }
  return connection;
}

export async function ensureHubStarted(): Promise<signalR.HubConnection> {
  const conn = getConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    if (!startPromise) {
      startPromise = conn.start().catch((err) => {
        startPromise = null;
        throw err;
      });
    }
    await startPromise;
  }
  return conn;
}

export async function joinGameGroup(
  gameId: string,
  playerId: string
): Promise<void> {
  const conn = await ensureHubStarted();
  await conn.invoke("JoinGameGroup", gameId, playerId);
}
export async function leaveGameGroup(gameId: string): Promise<void> {
  const conn = getConnection();
  if (conn.state === signalR.HubConnectionState.Connected) {
    await conn.invoke("LeaveGameGroup", gameId);
  }
}

export function onPlayerJoined(handler: (payload: { gameId: string; playerId: string }) => void): () => void {
  const conn = getConnection();
  conn.on("PlayerJoined", handler);
  return () => conn.off("PlayerJoined", handler);
}

export function onPlayerReady(handler: (payload: { gameId: string; playerId: string }) => void): () => void {
  const conn = getConnection();
  conn.on("PlayerReady", handler);
  return () => conn.off("PlayerReady", handler);
}

export function onBothPlayersReady(
  handler: (payload: { gameId: string; currentTurnPlayerId: string }) => void
): () => void {
  const conn = getConnection();
  conn.on("BothPlayersReady", handler);
  return () => conn.off("BothPlayersReady", handler);
}

export type AttackResultPayload = {
  gameId: string;
  attackerId: string;
  x: number;
  y: number;
  isHit: boolean;
  sunkShipType: ShipTypeName | null; // was: number | string | null
  isGameOver: boolean;
  winnerId: string | null;
  nextTurnPlayerId: string;
};

export type ShipSunkPayload = {
  gameId: string;
  defenderId: string;
  shipType: ShipTypeName; // was: number | string
};

export function onAttackResult(
  handler: (payload: AttackResultPayload) => void
): () => void {
  const conn = getConnection();
  conn.on("AttackResult", handler);
  return () => conn.off("AttackResult", handler);
}



export function onShipSunk(
  handler: (payload: ShipSunkPayload) => void
): () => void {
  const conn = getConnection();
  conn.on("ShipSunk", handler);
  return () => conn.off("ShipSunk", handler);
}

export type GameOverPayload = {
  gameId: string;
  winnerId: string;
  loserId: string;
};

export function onGameOver(
  handler: (payload: GameOverPayload) => void
): () => void {
  const conn = getConnection();
  conn.on("GameOver", handler);
  return () => conn.off("GameOver", handler);
}