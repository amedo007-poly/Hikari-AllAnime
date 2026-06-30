"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { posterGradient } from "../lib/poster";
import type { SearchResult } from "../lib/allanime/types";

export default function TrendingTop10() {
  const [items, setItems] = useState<SearchResult[]>([]);

  useEffect(() => {
    fetch("/api/popular?dateRange=1")
      .then((r) => r.json())
      .then((d) => setItems((d.results ?? []).slice(0, 10)))
      .catch(() => {});
  }, []);

  return (
    <section className="pt-[26px]">
      <div className="flex items-baseline gap-2 px-[22px] pb-3 md:px-8">
        <h2 className="text-[17px] font-bold tracking-tight text-text">Trending</h2>
        <span className="text-[13px] font-extrabold text-accent">TOP 10</span>
      </div>

      <div className="no-scrollbar flex gap-4 overflow-x-auto px-[22px] pb-2 md:px-8">
        {items.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[170px] w-[200px] shrink-0 animate-pulse rounded-[12px] bg-surface" />
            ))
          : items.map((s, idx) => (
              <Link
                key={s.id}
                href={`/show/${s.id}`}
                className="group flex shrink-0 items-end gap-1"
              >
                <span
                  className="select-none font-extrabold leading-[0.8]"
                  style={{
                    fontSize: 76,
                    color: "transparent",
                    WebkitTextStroke: "2px rgba(255,255,255,0.35)",
                  }}
                >
                  {idx + 1}
                </span>
                <div className="w-[118px]">
                  <div
                    className="relative aspect-[2/3] overflow-hidden rounded-[11px] ring-0 ring-accent/60 transition-all duration-300 group-hover:ring-2"
                    style={{ background: posterGradient(s.id) }}
                  >
                    {s.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.thumbnail}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-1 text-[12px] font-semibold text-text transition-colors group-hover:text-accent">
                    {s.name}
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
