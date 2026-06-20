"use client";

import { useSyncExternalStore } from "react";
import type { UserResponseDto, GameModel } from "@/types/api";

const USERS_KEY = "battleship:session:users";
const GAMES_KEY = "battleship:session:games";
const EMPTY_ARRAY: readonly unknown[] = [];

function createListStore<T extends { id: string }>(key: string) {
  let cache: T[] = [];
  let hydrated = false;
  const listeners = new Set<() => void>();

  function hydrate() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      cache = [];
    }
  }

  function persist() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(cache));
  }

  function emit() {
    for (const l of listeners) l();
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      hydrate();
      return cache;
    },
    getServerSnapshot() {
      return EMPTY_ARRAY as T[];
    },
    upsert(item: T, max = 20) {
      hydrate();
      cache = [item, ...cache.filter((existing) => existing.id !== item.id)].slice(0, max);
      persist();
      emit();
    },
    clear() {
      hydrate();
      cache = [];
      persist();
      emit();
    },
  };
}

const usersStore = createListStore<UserResponseDto>(USERS_KEY);
const gamesStore = createListStore<GameModel>(GAMES_KEY);

export function useSessionUsers() {
  const users = useSyncExternalStore(
    usersStore.subscribe,
    usersStore.getSnapshot,
    usersStore.getServerSnapshot
  );

  return {
    users,
    addUser: (user: UserResponseDto) => usersStore.upsert(user),
    clearUsers: () => usersStore.clear(),
  };
}

export function useSessionGames() {
  const games = useSyncExternalStore(
    gamesStore.subscribe,
    gamesStore.getSnapshot,
    gamesStore.getServerSnapshot
  );

  return {
    games,
    upsertGame: (game: GameModel) => gamesStore.upsert(game),
    clearGames: () => gamesStore.clear(),
  };
}