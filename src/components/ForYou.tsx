"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PosterCard from "./PosterCard";
import { getMyList } from "../lib/mylist";
import { getContinueWatching } from "../lib/progress";
import type { SearchResult } from "../lib/allanime/types";

export default function ForYou() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = Array.from(
      new Set([
        ...getMyList().map((s) => s.id),
        ...getContinueWatching().map((e) => e.showId),
      ]),
    );
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    fetch("/api/foryou", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((r) => r.json())
      .then((d) => {
        setResults(d.results ?? []);
        setGenres(d.genres ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  // nothing to recommend (no list yet) — render nothing
  if (!loading && results.length === 0) return null;

  return (
    <section className="pt-[26px]">
      <div className="flex items-end justify-between px-[22px] pb-3 md:px-8">
        <div>
          <h2 className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-text">
            For You
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent"
            >
              picked for you
            </motion.span>
          </h2>
          {genres.length > 0 && (
            <p className="mt-0.5 text-[12px] text-muted">
              Because you like {genres.slice(0, 2).join(" & ")}
            </p>
          )}
        </div>
      </div>

      <div className="no-scrollbar flex gap-3 overflow-x-auto px-[22px] md:px-8">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] w-[120px] shrink-0 animate-pulse rounded-[12px] bg-surface sm:w-[140px] md:w-[156px]" />
            ))
          : results.map((s) => (
              <div key={s.id} className="w-[120px] shrink-0 sm:w-[140px] md:w-[156px]">
                <PosterCard id={s.id} name={s.name} thumbnail={s.thumbnail} score={s.score} type={s.type} />
              </div>
            ))}
      </div>
    </section>
  );
}
