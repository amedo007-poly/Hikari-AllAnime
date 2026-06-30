"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PlayIcon } from "../../../components/icons";

interface MalEntry {
  malId: number;
  title: string;
  picture: string | null;
  totalEpisodes: number;
  watched: number;
  score: number;
  mediaType: string;
}

const TABS = [
  { key: "watching", label: "Watching" },
  { key: "plan_to_watch", label: "Plan to Watch" },
  { key: "completed", label: "Completed" },
  { key: "on_hold", label: "On Hold" },
  { key: "dropped", label: "Dropped" },
];

export default function MalPage() {
  const [status, setStatus] = useState<{ configured: boolean; connected: boolean } | null>(null);
  const [tab, setTab] = useState("watching");
  const [entries, setEntries] = useState<MalEntry[] | null>(null);

  useEffect(() => {
    fetch("/api/mal/status").then((r) => r.json()).then(setStatus).catch(() => setStatus({ configured: false, connected: false }));
  }, []);

  useEffect(() => {
    if (!status?.connected) return;
    setEntries(null);
    fetch(`/api/mal/list?status=${tab}`)
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => setEntries([]));
  }, [status?.connected, tab]);

  async function logout() {
    await fetch("/api/mal/logout", { method: "POST" });
    setStatus((s) => (s ? { ...s, connected: false } : s));
  }

  return (
    <main className="px-[22px] pb-4 pt-[max(20px,env(safe-area-inset-top))] md:px-8 md:pt-10">
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-extrabold tracking-tight text-text md:text-[26px]">My Anime List</h1>
        {status?.connected && (
          <button onClick={logout} className="text-[12px] font-semibold text-muted hover:text-text">
            Disconnect
          </button>
        )}
      </div>

      {/* not configured */}
      {status && !status.configured && (
        <div className="mt-10 rounded-[14px] bg-surface p-5 text-[14px] text-text2 ring-1 ring-hair">
          MyAnimeList isn&apos;t set up yet. Add <code className="text-accent">MAL_CLIENT_ID</code> to your env
          (register an app at myanimelist.net/apiconfig), then reload.
        </div>
      )}

      {/* configured, not connected */}
      {status?.configured && !status.connected && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="max-w-sm text-[14px] text-text2">
            Connect your MyAnimeList account to see your Watching, Plan to Watch and Completed lists here —
            and sync progress back as you watch.
          </p>
          <a
            href="/api/mal/login"
            className="rounded-full bg-accent px-6 py-3 text-[15px] font-bold text-accent-ink shadow-[0_10px_26px_rgba(6,214,160,.25)]"
          >
            Connect MyAnimeList
          </a>
        </div>
      )}

      {/* connected */}
      {status?.connected && (
        <>
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="shrink-0 rounded-[20px] px-3.5 py-1.5 text-[13px] font-semibold ring-1 ring-hair transition"
                style={
                  tab === t.key
                    ? { background: "var(--color-accent)", color: "var(--color-accent-ink)" }
                    : { color: "var(--color-text2)", background: "var(--color-surface2)" }
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {!entries
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] animate-pulse rounded-[12px] bg-surface" />
                ))
              : entries.map((e) => <MalCard key={e.malId} entry={e} />)}
            {entries && entries.length === 0 && (
              <p className="col-span-full py-10 text-center text-[14px] text-muted">Nothing in this list.</p>
            )}
          </div>
        </>
      )}
    </main>
  );
}

function MalCard({ entry }: { entry: MalEntry }) {
  const router = useRouter();
  const [watched, setWatched] = useState(entry.watched);
  const [busy, setBusy] = useState(false);
  const [resolving, setResolving] = useState(false);
  const frac = entry.totalEpisodes ? Math.min(1, watched / entry.totalEpisodes) : 0;

  async function open() {
    setResolving(true);
    try {
      const r = await fetch(
        `/api/mal/resolve?malId=${entry.malId}&title=${encodeURIComponent(entry.title)}`,
      ).then((x) => x.json());
      if (r.showId) router.push(`/show/${r.showId}`);
      else alert("Not found on AllAnime.");
    } finally {
      setResolving(false);
    }
  }

  async function plusOne(ev: React.MouseEvent) {
    ev.stopPropagation();
    if (busy) return;
    const next = watched + 1;
    setBusy(true);
    setWatched(next);
    const finished = entry.totalEpisodes > 0 && next >= entry.totalEpisodes;
    await fetch("/api/mal/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        animeId: entry.malId,
        episodes: next,
        status: finished ? "completed" : "watching",
      }),
    }).catch(() => setWatched(watched));
    setBusy(false);
  }

  return (
    <div className="group cursor-pointer" onClick={open}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-[12px] bg-surface ring-0 ring-accent/60 transition-all duration-300 group-hover:ring-2">
        {entry.picture && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.picture}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        {resolving && (
          <div className="absolute inset-0 grid place-items-center bg-black/50">
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-accent" />
          </div>
        )}
        {/* progress */}
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25">
          <div className="h-full bg-accent" style={{ width: `${Math.round(frac * 100)}%` }} />
        </div>
        {/* +1 */}
        <button
          onClick={plusOne}
          disabled={busy}
          title="+1 episode (syncs to MAL)"
          className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-accent text-[14px] font-bold text-accent-ink opacity-0 transition group-hover:opacity-100 disabled:opacity-40"
        >
          +
        </button>
        <span className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/50 backdrop-blur">
          <PlayIcon className="h-3 w-3 text-white" />
        </span>
      </div>
      <p className="mt-1.5 line-clamp-1 text-[13px] font-semibold text-text transition-colors group-hover:text-accent">
        {entry.title}
      </p>
      <p className="text-[11px] text-muted">
        {watched}{entry.totalEpisodes ? ` / ${entry.totalEpisodes}` : ""} ep
        {entry.score ? ` · ★ ${entry.score}` : ""}
      </p>
    </div>
  );
}
