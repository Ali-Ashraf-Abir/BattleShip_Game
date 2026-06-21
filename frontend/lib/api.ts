"use client";

import type {
  CreateUserDto,
  UserResponseDto,
  CreateGameDto,
  JoinGameDto,
  GameModel,
  ReadyUpDto,
} from "@/types/api";

export const DEFAULT_BASE_URL = "http://localhost:5204";

const STORAGE_KEY = "battleship:baseUrl";

export function getBaseUrl(): string {
  if (typeof window === "undefined") return DEFAULT_BASE_URL;
  return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_BASE_URL;
}

export function setBaseUrl(url: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, url.replace(/\/+$/, ""));
}

// ---------- Request log ----------

export type LogEntry = {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  requestBody?: unknown;
  status?: number;
  ok?: boolean;
  responseBody?: unknown;
  error?: string;
  durationMs?: number;
};

type Listener = (entries: LogEntry[]) => void;

let entries: LogEntry[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l([...entries]);
}

export function subscribeToLog(listener: Listener): () => void {
  listeners.add(listener);
  listener([...entries]);
  return () => listeners.delete(listener);
}

export function clearLog() {
  entries = [];
  emit();
}

function pushLog(entry: LogEntry) {
  entries = [entry, ...entries].slice(0, 100);
  emit();
}

function updateLog(id: string, patch: Partial<LogEntry>) {
  entries = entries.map((e) => (e.id === id ? { ...e, ...patch } : e));
  emit();
}

// ---------- Core fetch wrapper ----------

export class ApiRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiRequestError";
  }
}

async function request<TResponse>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<TResponse> {
  const base = getBaseUrl();
  const url = `${base}${path}`;
  const id = crypto.randomUUID();
  const start = performance.now();

  pushLog({
    id,
    timestamp: new Date().toISOString(),
    method,
    url,
    requestBody: body,
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? `Network error: ${err.message}. Is the backend running at ${base} and CORS enabled?`
        : "Unknown network error";
    updateLog(id, { error: message, durationMs: performance.now() - start });
    throw new ApiRequestError(0, message);
  }

  const durationMs = performance.now() - start;
  const contentType = res.headers.get("content-type") || "";
  let parsed: unknown = null;

  try {
    if (contentType.includes("application/json")) {
      parsed = await res.json();
    } else {
      const text = await res.text();
      parsed = text || null;
    }
  } catch {
    parsed = null;
  }

  updateLog(id, {
    status: res.status,
    ok: res.ok,
    responseBody: parsed,
    durationMs,
  });

  if (!res.ok) {
    const message =
      typeof parsed === "string"
        ? parsed
        : (parsed as { message?: string; title?: string })?.message ||
          (parsed as { message?: string; title?: string })?.title ||
          `Request failed with status ${res.status}`;
    throw new ApiRequestError(res.status, message);
  }

  return parsed as TResponse;
}

// ---------- Typed endpoint calls ----------

export const api = {
  createUser: (dto: CreateUserDto) =>
    request<UserResponseDto>("POST", "/api/users", dto),

  createGame: (dto: CreateGameDto) =>
    request<GameModel>("POST", "/api/games", dto),

  joinGame: (dto: JoinGameDto) =>
    request<GameModel>("POST", "/api/games/join", dto),

  getAvailableGames: () =>
    request<GameModel[]>("GET", "/api/games/available-games"),

  readyUp: (dto: ReadyUpDto) =>
    request<void>("POST", "/api/ship/ready", dto),
  
  getGame: (gameId: string) =>
  request<GameModel>("GET", `/api/games/${gameId}`),
};
