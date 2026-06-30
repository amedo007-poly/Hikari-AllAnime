"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import PosterCard from "../../../components/PosterCard";
import { ChevronLeft } from "../../../components/icons";
import type { SearchResult } from "../../../lib/allanime/types";

export default function GenrePage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const genre = decodeURIComponent(name);
  const router = useRouter();
  const [results, setResults] = useState<SearchResult[] | null>(null);

  useEffect(() => {
    setResults(null);
    fetch(`/api/genre?name=${encodeURIComponent(genre)}`)
      .then((r) => r.json())
      .then((d) => setResults(d.results ?? []))
      .catch(() => setResults([]));
  }, [genre]);

  return (
    <main className="mx-auto max-w-[1180px] px-[22px] pb-16 pt-[max(20px,env(safe-area-inset-top))] md:px-8 md:pt-10">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="grid h-9 w-9 place-items-center rounded-full bg-surface text-text ring-1 ring-hair"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[24px] font-extrabold tracking-tight text-text">{genre}</h1>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {!results
          ? Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-[12px] bg-surface" />
            ))
          : results.map((s) => (
              <PosterCard key={s.id} id={s.id} name={s.name} thumbnail={s.thumbnail} score={s.score} type={s.type} />
            ))}
        {results && results.length === 0 && (
          <p className="col-span-full py-10 text-center text-[14px] text-muted">No shows found.</p>
        )}
      </div>
    </main>
  );
}
