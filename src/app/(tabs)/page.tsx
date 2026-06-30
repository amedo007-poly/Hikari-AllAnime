"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PosterCard from "../../components/PosterCard";
import SpotlightHero from "../../components/SpotlightHero";
import TrendingTop10 from "../../components/TrendingTop10";
import PopularTabs from "../../components/PopularTabs";
import GenresGrid from "../../components/GenresGrid";
import ForYou from "../../components/ForYou";
import { Brand } from "../../components/Brand";
import { ProfileAvatar } from "../../components/Profile";
import { PlayIcon } from "../../components/icons";
import { posterGradient } from "../../lib/poster";
import { getContinueWatching, type WatchEntry } from "../../lib/progress";
import type { SearchResult, ShowDetail } from "../../lib/allanime/types";

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-end justify-between px-[22px] pb-3 pt-[26px] md:px-8">
      <h2 className="text-[17px] font-bold tracking-tight text-text">{title}</h2>
      {href && (
        <Link href={href} className="text-[12px] font-semibold text-accent">
          See all
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const [spotlight, setSpotlight] = useState<ShowDetail[]>([]);
  const [latest, setLatest] = useState<SearchResult[]>([]);
  const [cw, setCw] = useState<WatchEntry[]>([]);

  useEffect(() => {
    setCw(getContinueWatching());
    fetch("/api/spotlight").then((r) => r.json()).then((d) => setSpotlight(d.items ?? [])).catch(() => {});
    fetch("/api/latest").then((r) => r.json()).then((d) => setLatest(d.results ?? [])).catch(() => {});
  }, []);

  return (
    <main>
      {/* header (mobile only — desktop uses the sidebar) */}
      <header className="flex items-center justify-between px-[22px] pt-[max(18px,env(safe-area-inset-top))] md:hidden">
        <Brand size={56} />
        <ProfileAvatar />
      </header>

      <SpotlightHero items={spotlight} />

      {/* continue watching */}
      {cw.length > 0 && (
        <section>
          <SectionHeader title="Continue Watching" href="/list" />
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-[22px] md:px-8">
            {cw.map((e) => (
              <ContinueCard key={e.showId} entry={e} />
            ))}
          </div>
        </section>
      )}

      <ForYou />
      <TrendingTop10 />
      <PopularTabs />

      {/* latest episodes */}
      <section>
        <SectionHeader title="Latest Episodes" />
        <div className="grid grid-cols-3 gap-3 px-[22px] sm:grid-cols-4 md:grid-cols-6 md:px-8">
          {latest.length === 0
            ? Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-[12px] bg-surface" />
              ))
            : latest
                .slice(0, 12)
                .map((s) => (
                  <PosterCard key={s.id} id={s.id} name={s.name} thumbnail={s.thumbnail} score={s.score} type={s.type} />
                ))}
        </div>
      </section>

      <GenresGrid />
    </main>
  );
}

function ContinueCard({ entry }: { entry: WatchEntry }) {
  return (
    <Link href={`/watch/${entry.showId}/${entry.ep}?mode=${entry.mode}`} className="group shrink-0">
      <div
        className="relative aspect-video w-[158px] overflow-hidden rounded-[12px] md:w-[260px]"
        style={{ background: posterGradient(entry.showId) }}
      >
        {entry.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        )}
        <div className="absolute inset-0 grid place-items-center bg-black/30">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/20 backdrop-blur transition-transform group-hover:scale-110">
            <PlayIcon className="h-4 w-4 text-white" />
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25">
          <div className="h-full bg-accent shadow-[0_0_8px_var(--color-accent)]" style={{ width: `${Math.round(entry.fraction * 100)}%` }} />
        </div>
      </div>
      <p className="mt-1.5 line-clamp-1 w-[158px] text-[13px] font-semibold text-text transition-colors group-hover:text-accent md:w-[260px]">
        {entry.name}
      </p>
      <p className="text-[11px] text-muted">Episode {entry.ep} of {entry.totalEps}</p>
    </Link>
  );
}
