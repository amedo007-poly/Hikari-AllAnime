"use client";

import { useEffect, useState } from "react";
import PosterCard from "./PosterCard";
import type { SearchResult } from "../lib/allanime/types";

const TABS = [
  { label: "Today", range: 1 },
  { label: "This Week", range: 7 },
  { label: "This Month", range: 30 },
];

export default function PopularTabs() {
  const [tab, setTab] = useState(1);
  const [cache, setCache] = useState<Record<number, SearchResult[]>>({});
  const items = cache[tab];

  useEffect(() => {
    if (cache[tab]) return;
    fetch(`/api/popular?dateRange=${tab}`)
      .then((r) => r.json())
      .then((d) => setCache((c) => ({ ...c, [tab]: d.results ?? [] })))
      .catch(() => {});
  }, [tab, cache]);

  return (
    <section className="pt-[26px]">
      <div className="flex items-center gap-2 px-[22px] pb-3 md:px-8">
        <h2 className="mr-1 text-[17px] font-bold tracking-tight text-text">Popular</h2>
        <div className="flex rounded-[10px] bg-surface2 p-0.5 ring-1 ring-hair">
          {TABS.map((t) => (
            <button
              key={t.range}
              onClick={() => setTab(t.range)}
              className="rounded-[8px] px-3 py-1 text-[12px] font-bold transition"
              style={
                tab === t.range
                  ? { background: "var(--color-accent)", color: "var(--color-accent-ink)" }
                  : { color: "var(--color-muted)" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-[22px] sm:grid-cols-4 md:grid-cols-6 md:px-8">
        {!items
          ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-[12px] bg-surface" />
            ))
          : items
              .slice(0, 12)
              .map((s) => (
                <PosterCard key={s.id} id={s.id} name={s.name} thumbnail={s.thumbnail} score={s.score} type={s.type} />
              ))}
      </div>
    </section>
  );
}
