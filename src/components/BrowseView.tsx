"use client";

import { useEffect, useState } from "react";
import PosterCard from "./PosterCard";
import { ChevronLeft, ChevronRight } from "./icons";
import type { SearchResult } from "../lib/allanime/types";

export default function BrowseView({
  title,
  kind,
  paged = true,
}: {
  title: string;
  kind: string;
  paged?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<SearchResult[] | null>(null);

  useEffect(() => {
    setResults(null);
    fetch(`/api/browse?kind=${kind}&page=${page}`)
      .then((r) => r.json())
      .then((d) => setResults(d.results ?? []))
      .catch(() => setResults([]));
  }, [kind, page]);

  return (
    <main className="px-[22px] pb-4 pt-[max(20px,env(safe-area-inset-top))] md:px-8 md:pt-10">
      <h1 className="text-[24px] font-extrabold capitalize tracking-tight text-accent md:text-[26px]">
        {title}
      </h1>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {!results
          ? Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-[12px] bg-surface" />
            ))
          : results.map((s) => (
              <PosterCard key={s.id} id={s.id} name={s.name} thumbnail={s.thumbnail} score={s.score} type={s.type} />
            ))}
        {results && results.length === 0 && (
          <p className="col-span-full py-10 text-center text-[14px] text-muted">Nothing here.</p>
        )}
      </div>

      {paged && results && results.length > 0 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="grid h-10 w-10 place-items-center rounded-full bg-surface2 text-text ring-1 ring-hair disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-10 text-center text-[14px] font-bold text-text">{page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={results.length < 30}
            className="grid h-10 w-10 place-items-center rounded-full bg-surface2 text-text ring-1 ring-hair disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </main>
  );
}
