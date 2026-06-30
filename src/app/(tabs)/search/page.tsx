"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import PosterCard from "../../../components/PosterCard";
import { SearchIcon } from "../../../components/icons";
import type { SearchResult } from "../../../lib/allanime/types";

const CHIPS = ["Action", "Mecha", "Mystery", "Sci-Fi", "Fantasy", "Samurai"];

function SearchInner() {
  const sp = useSearchParams();
  const urlQ = sp.get("q") ?? "";
  const [query, setQuery] = useState(urlQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // seed/update from URL (?q=) — footer A–Z, links, etc.
  useEffect(() => {
    setQuery(urlQ);
  }, [urlQ]);

  useEffect(() => {
    const q = query.trim();
    if (timer.current) clearTimeout(timer.current);
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}&mode=sub`)
        .then((r) => r.json())
        .then((d) => setResults(d.results ?? []))
        .finally(() => setLoading(false));
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  return (
    <main className="px-[22px] pt-[max(20px,env(safe-area-inset-top))] md:px-8 md:pt-10">
      <h1 className="text-[26px] font-extrabold tracking-tight text-text">Search</h1>

      <div className="relative mt-4">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search anime…"
          className="h-12 w-full rounded-[14px] bg-surface pl-11 pr-4 text-[15px] text-text placeholder:text-muted outline-none ring-1 ring-hair focus:ring-accent/50"
        />
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => setQuery(c)}
            className="shrink-0 rounded-[20px] bg-surface2 px-3.5 py-1.5 text-[13px] font-medium text-text2 ring-1 ring-hair active:bg-accent/15"
          >
            {c}
          </button>
        ))}
      </div>

      {query.trim() && (
        <p className="mt-5 text-[11px] font-medium uppercase tracking-wider text-muted">
          {loading ? "Searching…" : `${results.length} results`}
        </p>
      )}

      <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {results.map((s) => (
          <PosterCard key={s.id} id={s.id} name={s.name} thumbnail={s.thumbnail} score={s.score} type={s.type} />
        ))}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-text">Loading…</div>}>
      <SearchInner />
    </Suspense>
  );
}
