"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import {
  BookmarkIcon,
  ChevronLeft,
  ChevronRight,
  PlayIcon,
  ShareIcon,
  StarIcon,
} from "../../../components/icons";
import { heroGradient, posterGradient } from "../../../lib/poster";
import { buildProxyUrl } from "../../../lib/proxy";
import { getProgress } from "../../../lib/progress";
import type { EpisodeInfo, EpisodesDetail, ShowDetail } from "../../../lib/allanime/types";

type Mode = "sub" | "dub";

function stripHtml(s: string | null): string {
  if (!s) return "";
  return s.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").trim();
}

export default function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [detail, setDetail] = useState<ShowDetail | null>(null);
  const [eps, setEps] = useState<EpisodesDetail>({ sub: [], dub: [], raw: [] });
  const [mode, setMode] = useState<Mode>("sub");
  const [saved, setSaved] = useState(false);
  const [savingList, setSavingList] = useState(false);
  const [resumeEp, setResumeEp] = useState<string | null>(null);
  const [infos, setInfos] = useState<Record<string, EpisodeInfo>>({});

  useEffect(() => {
    fetch(`/api/show?showId=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.detail) setDetail(d.detail);
        if (d.episodes) setEps(d.episodes);
        if (d.infos) setInfos(d.infos);
        // reflect whether this show is on the user's MAL list
        const malId = d.detail?.malId;
        if (malId) {
          fetch(`/api/mal/entry?malId=${malId}`)
            .then((r) => r.json())
            .then((e) => setSaved(!!e.onList))
            .catch(() => {});
        }
      });
    setResumeEp(getProgress(id)?.ep ?? null);
  }, [id]);

  async function toggleList() {
    if (!detail?.malId || savingList) return;
    const next = !saved;
    setSaved(next); // optimistic
    setSavingList(true);
    try {
      const res = await fetch(next ? "/api/mal/update" : "/api/mal/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          next
            ? { animeId: detail.malId, status: "plan_to_watch" }
            : { animeId: detail.malId },
        ),
      });
      if (!res.ok) setSaved(!next); // revert on failure
    } catch {
      setSaved(!next);
    } finally {
      setSavingList(false);
    }
  }

  const list = mode === "dub" ? eps.dub : eps.sub;
  const hasDub = eps.dub.length > 0;
  const firstEp = list[0] ?? "1";
  const playEp = resumeEp && list.includes(resumeEp) ? resumeEp : firstEp;
  const durationMin = useMemo(
    () => (detail?.episodeDuration ? Math.round(detail.episodeDuration / 60) : null),
    [detail],
  );

  return (
    <main className="mx-auto max-w-[920px] pb-12">
      {/* key visual hero */}
      <div
        className="relative h-[330px] md:h-[420px] md:overflow-hidden md:rounded-b-[28px]"
        style={{ background: heroGradient(id) }}
      >
        {detail?.banner || detail?.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={detail.banner ?? detail.thumbnail!} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="mono-tag absolute left-4 top-20 text-[10px] text-white/40">// KEY VISUAL</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-bg" />
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-[max(16px,env(safe-area-inset-top))] grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="absolute inset-x-0 bottom-0 px-[22px] pb-4">
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-white">
            {detail?.name ?? "…"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-text2">
            {typeof detail?.score === "number" && detail.score > 0 && (
              <span className="flex items-center gap-1 text-accent">
                <StarIcon className="h-3.5 w-3.5" /> {detail.score.toFixed(1)}
              </span>
            )}
            {detail?.year && <span>· {detail.year}</span>}
            {detail?.status && <span>· {detail.status}</span>}
            <span>· {list.length} episodes</span>
            <span className="rounded-[6px] bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white">HD</span>
          </div>
        </div>
      </div>

      <div className="px-[22px]">
        {/* play */}
        <Link
          href={`/watch/${id}/${playEp}?mode=${mode}`}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] bg-accent py-3.5 text-[15px] font-bold text-accent-ink shadow-[0_10px_26px_rgba(6,214,160,.25)]"
        >
          <PlayIcon className="h-5 w-5" />
          {resumeEp ? `Resume Episode ${playEp}` : "Play Episode 1"}
        </Link>

        {/* genre chips */}
        {detail && detail.genres.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {detail.genres.slice(0, 6).map((g) => (
              <span
                key={g}
                className="rounded-[20px] bg-surface2 px-3 py-1 text-[12px] font-medium text-text2 ring-1 ring-hair"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* synopsis */}
        {detail?.description && (
          <p className="mt-4 text-[14px] leading-[1.55] text-text2">
            {stripHtml(detail.description)}
          </p>
        )}

        {/* studio / season */}
        {detail && (detail.studios.length > 0 || detail.season) && (
          <p className="mt-3 text-[12px] text-muted">
            {detail.studios.length > 0 && <>Studio: {detail.studios.join(", ")}</>}
            {detail.studios.length > 0 && detail.season && " · "}
            {detail.season}
          </p>
        )}

        {/* actions */}
        <div className="mt-4 flex gap-6">
          <button
            onClick={toggleList}
            disabled={!detail?.malId || savingList}
            title={detail?.malId ? "Sync to your MyAnimeList" : "Not linked to MyAnimeList"}
            className="flex flex-col items-center gap-1 text-[11px] text-text2 transition disabled:opacity-40"
            style={{ color: saved ? "var(--color-accent)" : undefined }}
          >
            <BookmarkIcon className="h-6 w-6" /> {saved ? "In My List" : "My List"}
          </button>
          <button className="flex flex-col items-center gap-1 text-[11px] text-text2">
            <ShareIcon className="h-6 w-6" /> Share
          </button>
        </div>

        {/* episodes header + sub/dub */}
        <div className="flex items-center justify-between pb-3 pt-[26px]">
          <h2 className="text-[17px] font-bold tracking-tight text-text">Episodes</h2>
          <div className="flex rounded-[10px] bg-surface2 p-0.5 ring-1 ring-hair">
            {(["sub", "dub"] as Mode[]).map((m) => (
              <button
                key={m}
                disabled={m === "dub" && !hasDub}
                onClick={() => setMode(m)}
                className="rounded-[8px] px-3.5 py-1 text-[12px] font-bold uppercase transition disabled:opacity-30"
                style={
                  mode === m
                    ? { background: "var(--color-accent)", color: "var(--color-accent-ink)" }
                    : { color: "var(--color-muted)" }
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* episode rows */}
        <ul className="flex flex-col gap-2 pb-4">
          {list.map((ep) => (
            <EpisodeRow key={ep} showId={id} ep={ep} mode={mode} duration={durationMin} info={infos[ep]} />
          ))}
          {list.length === 0 && (
            <li className="py-8 text-center text-[13px] text-muted">No episodes available.</li>
          )}
        </ul>
      </div>
    </main>
  );
}

function EpisodeRow({
  showId,
  ep,
  mode,
  duration,
  info,
}: {
  showId: string;
  ep: string;
  mode: Mode;
  duration: number | null;
  info?: EpisodeInfo;
}) {
  const [frac, setFrac] = useState(0);
  const [imgOk, setImgOk] = useState(true);
  useEffect(() => {
    const p = getProgress(showId);
    if (p && p.ep === ep) setFrac(p.fraction);
  }, [showId, ep]);

  const title = info?.title ? `${ep}. ${info.title}` : `Episode ${ep}`;

  return (
    <li>
      <Link href={`/watch/${showId}/${ep}?mode=${mode}`} className="flex items-center gap-3">
        <div
          className="relative h-[60px] w-[104px] shrink-0 overflow-hidden rounded-[11px]"
          style={{ background: posterGradient(`${showId}-${ep}`) }}
        >
          {info?.thumbnail && imgOk && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={buildProxyUrl(info.thumbnail, "https://allanime.day")}
              alt=""
              loading="lazy"
              onError={() => setImgOk(false)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 grid place-items-center bg-black/25">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20 backdrop-blur">
              <PlayIcon className="h-3.5 w-3.5 text-white" />
            </span>
          </div>
          {frac > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25">
              <div className="h-full bg-accent" style={{ width: `${Math.round(frac * 100)}%` }} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-text">{title}</p>
          {duration && <p className="text-[12px] text-muted">{duration} min</p>}
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-chevron" />
      </Link>
    </li>
  );
}
