"use client";

import type { SearchResult } from "./allanime/types";

export type SavedShow = Pick<SearchResult, "id" | "name" | "thumbnail" | "score">;

const KEY = "hikari:mylist:v1";

function read(): SavedShow[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}
function write(list: SavedShow[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getMyList(): SavedShow[] {
  return read();
}
export function isSaved(id: string): boolean {
  return read().some((s) => s.id === id);
}
export function toggleSaved(show: SavedShow): boolean {
  const list = read();
  const idx = list.findIndex((s) => s.id === show.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    write(list);
    return false;
  }
  write([show, ...list]);
  return true;
}
