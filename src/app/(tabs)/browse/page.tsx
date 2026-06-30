"use client";

import { useEffect, useState } from "react";
import PosterCard from "../../../components/PosterCard";
import RandomButton from "../../../components/RandomButton";
import { ChevronLeft, ChevronRight } from "../../../components/icons";
import type { SearchResult } from "../../../lib/allanime/types";

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror",
  "Mahou Shoujo", "Mecha", "Music", "Mystery", "Psychological", "Romance",
  "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller",
];
const TYPES = ["TV", "Movie", "ONA", "OVA", "Special"];
const SORTS = [
  { v: "Top", label: "Top Rated" },
  { v: "Popular", label: "Most Popular" },
  { v: "Recent", label: "Recently Updated" },
  { v: "Name_ASC", label: "A → Z" },
];
const YEARS = Array.from({ length: 2026 - 1960 + 1 }, (_, i) => 2026 - i);

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-[10px] bg-surface2 px-3 py-2 text-[13px] font-semibold text-text2 ring-1 ring-hair outline-none focus:ring-accent/50"
    >
      {children}
    </select>
  );
}

export default function BrowsePage() {
  const [genre, setGenre] = useState("");
  const [type, setType] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState("Top");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<SearchResult[] | null>(null);

  useEffect(() => setPage(1), [genre, type, year, sort]);

  useEffect(() => {
    setResults(null);
    const p = new URLSearchParams({ sort, page: String(page) });
    if (genre) p.set("genre", genre);
    if (type) p.set("type", type);
    if (year) p.set("year", year);
    fetch(`/api/catalog?${p}`)
      .then((r) => r.json())
      .then((d) => setResults(d.results ?? []))
      .catch(() => setResults([]));
  }, [genre, type, year, sort, page]);

  return (
    <main className="px-[22px] pb-4 pt-[max(20px,env(safe-area-inset-top))] md:px-8 md:pt-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[24px] font-extrabold tracking-tight text-text md:text-[26px]">Browse</h1>
        <RandomButton />
      </div>

      {/* filters */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        <Select value={genre} onChange={setGenre}>
          <option value="">All Genres</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </Select>
        <Select value={type} onChange={setType}>
          <option value="">All Types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Select value={year} onChange={setYear}>
          <option value="">Any Year</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Select value={sort} onChange={setSort}>
          {SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
        </Select>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {!results
          ? Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-[12px] bg-surface" />
            ))
          : results.map((s) => (
              <PosterCard key={s.id} id={s.id} name={s.name} thumbnail={s.thumbnail} score={s.score} type={s.type} />
            ))}
        {results && results.length === 0 && (
          <p className="col-span-full py-10 text-center text-[14px] text-muted">No shows match these filters.</p>
        )}
      </div>

      {results && results.length > 0 && (
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
