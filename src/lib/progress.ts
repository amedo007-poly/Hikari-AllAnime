"use client";

// Watch progress + continue-watching, persisted to localStorage (no DB).

export interface WatchEntry {
  showId: string;
  name: string;
  thumbnail: string | null;
  ep: string; // last/current episode number
  fraction: number; // 0..1 playback position of that episode
  totalEps: number;
  mode: "sub" | "dub";
  updatedAt: number;
}

const KEY = "hikari:progress:v1";

function readAll(): Record<string, WatchEntry> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, WatchEntry>) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function getProgress(showId: string): WatchEntry | null {
  return readAll()[showId] ?? null;
}

export function saveProgress(entry: Omit<WatchEntry, "updatedAt">) {
  const map = readAll();
  map[entry.showId] = { ...entry, updatedAt: Date.now() };
  writeAll(map);
}

/** Continue-watching list, newest first, skipping near-finished episodes. */
export function getContinueWatching(): WatchEntry[] {
  return Object.values(readAll())
    .filter((e) => e.fraction < 0.95)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function clearProgress(showId: string) {
  const map = readAll();
  delete map[showId];
  writeAll(map);
}
