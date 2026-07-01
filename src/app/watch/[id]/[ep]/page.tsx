"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useMemo, useRef, useState } from "react";
import VideoPlayer, { type QualityOption } from "../../../../components/VideoPlayer";
import { buildProxyUrl } from "../../../../lib/proxy";
import { saveProgress } from "../../../../lib/progress";
import type { StreamLink } from "../../../../lib/allanime/types";

interface StreamGroup {
  source: { name: string; priority: number };
  links: StreamLink[];
}

// Hosts that return an HTML embed page (not a direct stream) — skip them.
const IFRAME_HOSTS = [
  "mp4upload.com/embed",
  "ok.ru",
  "streamwish",
  "vidnest",
  "bysekoze",
  "uns.bio",
  "strmup",
];
const playable = (l: StreamLink) => !IFRAME_HOSTS.some((h) => l.url.includes(h));
const qNum = (q: string) => parseInt(q, 10) || 0;

export default function WatchPage({
  params,
}: {
  params: Promise<{ id: string; ep: string }>;
}) {
  const { id, ep } = use(params);
  const router = useRouter();
  const sp = useSearchParams();
  const mode = (sp.get("mode") as "sub" | "dub") ?? "sub";

  const [links, setLinks] = useState<StreamLink[]>([]);
  const [picked, setPicked] = useState<StreamLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ name: string; thumbnail: string | null; eps: string[]; malId: string | null }>({
    name: "",
    thumbnail: null,
    eps: [],
    malId: null,
  });
  const [skips, setSkips] = useState<{ type: string; start: number; end: number }[]>([]);
  const savedFrac = useRef(0);
  // MAL auto-sync: highest episode already counted on the user's list (guards rewatch)
  const malConnected = useRef(false);
  const malWatched = useRef(0);
  const malOnList = useRef(false);
  const malSyncing = useRef(false);
  const malEnsuring = useRef(false);

  useEffect(() => {
    setLinks([]);
    setPicked(null);
    setError(null);
    fetch(`/api/sources?showId=${id}&ep=${ep}&mode=${mode}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        const groups: StreamGroup[] = d.streams ?? [];
        const flat = groups.flatMap((g) => g.links).filter(playable);
        flat.sort((a, b) => Number(b.isM3u8) - Number(a.isM3u8) || qNum(b.quality) - qNum(a.quality));
        setLinks(flat);
        setPicked(flat[0] ?? null);
        if (flat.length === 0 && !d.error) setError("No playable source for this episode.");
      })
      .catch((e) => setError(String(e)));
  }, [id, ep, mode]);

  useEffect(() => {
    fetch(`/api/show?showId=${id}`)
      .then((r) => r.json())
      .then((d) => {
        const list: string[] = (mode === "dub" ? d.episodes?.dub : d.episodes?.sub) ?? [];
        setMeta({
          name: d.detail?.name ?? "",
          thumbnail: d.detail?.thumbnail ?? null,
          eps: list,
          malId: d.detail?.malId ?? null,
        });
      })
      .catch(() => {});
  }, [id, mode]);

  // AniSkip op/ed timestamps (needs the show's MAL id)
  useEffect(() => {
    setSkips([]);
    if (!meta.malId) return;
    fetch(`/api/aniskip?malId=${meta.malId}&ep=${ep}`)
      .then((r) => r.json())
      .then((d) => setSkips(d.skips ?? []))
      .catch(() => {});
  }, [meta.malId, ep]);

  // Pull current MAL watched count so auto-sync never lowers progress on a rewatch
  useEffect(() => {
    malConnected.current = false;
    malWatched.current = 0;
    malOnList.current = false;
    if (!meta.malId) return;
    fetch(`/api/mal/entry?malId=${meta.malId}`)
      .then((r) => r.json())
      .then((e) => {
        malConnected.current = !!e.connected;
        malWatched.current = e.watched ?? 0;
        malOnList.current = !!e.onList;
      })
      .catch(() => {});
  }, [meta.malId]);

  const proxiedSrc = useMemo(
    () => (picked ? buildProxyUrl(picked.url, picked.referer) : null),
    [picked],
  );

  const idx = meta.eps.indexOf(ep);
  const prevEp = idx > 0 ? meta.eps[idx - 1] : null;
  const nextEp = idx >= 0 && idx < meta.eps.length - 1 ? meta.eps[idx + 1] : null;

  const qualities: QualityOption[] = links.map((l, i) => ({
    label:
      l.quality !== "auto"
        ? `${l.quality}p`
        : l.isM3u8
          ? "Auto (HLS)"
          : `Source ${i + 1}`,
    active: l === picked,
    select: () => setPicked(l),
  }));

  function onTime(cur: number, dur: number) {
    if (!dur) return;
    const frac = cur / dur;
    if (Math.abs(frac - savedFrac.current) < 0.02) return;
    savedFrac.current = frac;
    saveProgress({
      showId: id,
      name: meta.name,
      thumbnail: meta.thumbnail,
      ep,
      fraction: frac,
      totalEps: meta.eps.length,
      mode,
    });
    maybeSyncMal(frac);
  }

  function maybeSyncMal(frac: number) {
    if (!malConnected.current || !meta.malId) return;
    // Early: as soon as you actually start the episode, put the show on
    // MAL as "Watching" (status only — doesn't touch the episode count).
    if (frac > 0.03 && !malOnList.current && !malEnsuring.current) {
      malEnsuring.current = true;
      malOnList.current = true; // optimistic; blocks re-fire
      fetch("/api/mal/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: Number(meta.malId), status: "watching" }),
      })
        .catch(() => {})
        .finally(() => {
          malEnsuring.current = false;
        });
    }
    // Later: count the episode as watched once ~90% through (once per episode,
    // never lowering the count on a rewatch).
    const epNum = Number(ep);
    if (
      !Number.isFinite(epNum) ||
      epNum <= malWatched.current ||
      frac < 0.9 ||
      malSyncing.current
    )
      return;
    malSyncing.current = true;
    malWatched.current = epNum; // optimistic; blocks re-fire
    const finished = meta.eps.length > 0 && epNum >= Number(meta.eps[meta.eps.length - 1]);
    fetch("/api/mal/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        animeId: Number(meta.malId),
        episodes: epNum,
        status: finished ? "completed" : "watching",
      }),
    })
      .catch(() => {})
      .finally(() => {
        malSyncing.current = false;
      });
  }

  const go = (target: string) => router.push(`/watch/${id}/${target}?mode=${mode}`);

  return (
    <main className="fixed inset-0 z-50 bg-black">
      {proxiedSrc ? (
        <VideoPlayer
          key={proxiedSrc}
          src={proxiedSrc}
          isM3u8={picked!.isM3u8}
          title={meta.name || "Loading…"}
          subtitle={`Episode ${ep} · ${mode.toUpperCase()}`}
          qualities={qualities}
          skips={skips}
          onBack={() => router.push(`/show/${id}`)}
          onPrev={prevEp ? () => go(prevEp) : undefined}
          onNext={nextEp ? () => go(nextEp) : undefined}
          onTimeUpdate={onTime}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="text-[14px] text-neutral-400">{error ?? "Resolving stream…"}</p>
          <button
            onClick={() => router.push(`/show/${id}`)}
            className="rounded-[10px] bg-white/10 px-4 py-2 text-[13px] font-semibold text-white"
          >
            Back to show
          </button>
        </div>
      )}
    </main>
  );
}
