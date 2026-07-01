"use client";

import { useEffect, useState } from "react";
import { BookmarkIcon, StarIcon } from "./icons";

const STATUSES = [
  { key: "watching", label: "Watching" },
  { key: "plan_to_watch", label: "Plan to Watch" },
  { key: "completed", label: "Completed" },
  { key: "on_hold", label: "On Hold" },
  { key: "dropped", label: "Dropped" },
];

interface Props {
  malId: number;
  totalEps: number;
}

/** Edit this show on the user's MyAnimeList: status, episode count, score. */
export default function MalListPanel({ malId, totalEps }: Props) {
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(true);
  const [onList, setOnList] = useState(false);
  const [status, setStatus] = useState("plan_to_watch");
  const [watched, setWatched] = useState(0);
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/mal/entry?malId=${malId}`)
      .then((r) => r.json())
      .then((e) => {
        if (!alive) return;
        setConnected(!!e.connected);
        setOnList(!!e.onList);
        if (e.onList) {
          setStatus(e.status || "watching");
          setWatched(e.watched || 0);
          setScore(e.score || 0);
        }
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [malId]);

  async function patch(fields: { status?: string; episodes?: number; score?: number }) {
    setBusy(true);
    try {
      const res = await fetch("/api/mal/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: malId, ...fields }),
      });
      if (res.ok) setOnList(true);
      return res.ok;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    setStatus("plan_to_watch");
    setOnList(true); // optimistic
    if (!(await patch({ status: "plan_to_watch" }))) setOnList(false);
  }

  async function remove() {
    setBusy(true);
    const prev = { onList, status, watched, score };
    setOnList(false);
    setStatus("plan_to_watch");
    setWatched(0);
    setScore(0);
    try {
      const res = await fetch("/api/mal/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: malId }),
      });
      if (!res.ok) {
        setOnList(prev.onList);
        setStatus(prev.status);
        setWatched(prev.watched);
        setScore(prev.score);
      }
    } finally {
      setBusy(false);
    }
  }

  function changeStatus(next: string) {
    setStatus(next);
    // completing a show fills the episode count
    if (next === "completed" && totalEps > 0) setWatched(totalEps);
    patch({ status: next, ...(next === "completed" && totalEps > 0 ? { episodes: totalEps } : {}) });
  }

  function stepEp(delta: number) {
    const max = totalEps > 0 ? totalEps : 9999;
    const next = Math.max(0, Math.min(max, watched + delta));
    if (next === watched) return;
    setWatched(next);
    const finished = totalEps > 0 && next >= totalEps;
    patch({ episodes: next, status: finished ? "completed" : status === "completed" ? "watching" : status });
    if (finished) setStatus("completed");
    else if (status === "completed") setStatus("watching");
  }

  function rate(next: number) {
    const val = next === score ? 0 : next; // tap the same star to clear
    setScore(val);
    patch({ score: val });
  }

  if (!ready) return <div className="mt-4 h-[52px] animate-pulse rounded-[14px] bg-surface" />;

  // signed out (shouldn't happen on the gated site, but be graceful)
  if (!connected) {
    return (
      <a
        href="/api/mal/login"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] bg-surface2 py-3 text-[14px] font-bold text-text ring-1 ring-hair"
      >
        <BookmarkIcon className="h-5 w-5" /> Connect MyAnimeList to track this
      </a>
    );
  }

  if (!onList) {
    return (
      <button
        onClick={add}
        disabled={busy}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] bg-surface2 py-3 text-[14px] font-bold text-text ring-1 ring-hair transition hover:ring-accent/50 disabled:opacity-50"
      >
        <BookmarkIcon className="h-5 w-5" /> Add to My List
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-[16px] bg-surface2 p-3.5 ring-1 ring-hair">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-accent">
          <BookmarkIcon className="h-4 w-4" /> On your list
        </span>
        <button onClick={remove} disabled={busy} className="text-[11px] font-semibold text-muted hover:text-red-400">
          Remove
        </button>
      </div>

      {/* status */}
      <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            onClick={() => changeStatus(s.key)}
            disabled={busy}
            className="shrink-0 rounded-[18px] px-3 py-1.5 text-[12px] font-semibold ring-1 ring-hair transition disabled:opacity-60"
            style={
              status === s.key
                ? { background: "var(--color-accent)", color: "var(--color-accent-ink)" }
                : { color: "var(--color-text2)", background: "var(--color-surface)" }
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* episodes + score */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-muted">Episodes</span>
          <div className="flex items-center gap-2 rounded-[12px] bg-surface px-2 py-1 ring-1 ring-hair">
            <button onClick={() => stepEp(-1)} disabled={busy || watched <= 0} className="grid h-6 w-6 place-items-center rounded-full text-[16px] font-bold text-text disabled:opacity-30">
              −
            </button>
            <span className="min-w-[52px] text-center text-[13px] font-bold text-text tabular-nums">
              {watched}{totalEps > 0 ? ` / ${totalEps}` : ""}
            </span>
            <button onClick={() => stepEp(1)} disabled={busy || (totalEps > 0 && watched >= totalEps)} className="grid h-6 w-6 place-items-center rounded-full text-[16px] font-bold text-text disabled:opacity-30">
              +
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-muted">Rating</span>
          <select
            value={score}
            onChange={(e) => rate(Number(e.target.value))}
            disabled={busy}
            className="rounded-[12px] bg-surface px-2.5 py-1.5 text-[13px] font-bold text-text ring-1 ring-hair outline-none disabled:opacity-60"
          >
            <option value={0}>— </option>
            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {score > 0 && <StarIcon className="h-4 w-4 text-accent" />}
        </div>
      </div>
    </div>
  );
}
