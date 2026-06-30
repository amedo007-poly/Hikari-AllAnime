"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PosterCard from "../../../components/PosterCard";
import { SparkleIcon } from "../../../components/icons";
import { getMyList } from "../../../lib/mylist";
import type { SearchResult } from "../../../lib/allanime/types";

interface Pick {
  show: SearchResult;
  reason: string;
}

const CHIPS = [
  "Something cozy to relax to",
  "Mind-bending psychological",
  "Peak action & fights",
  "Made me cry",
  "Underrated hidden gems",
  "Dark and mature",
];

export default function AiPage() {
  const [vibe, setVibe] = useState("");
  const [picks, setPicks] = useState<Pick[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function recommend(text: string) {
    const v = text.trim();
    if (!v || loading) return;
    setLoading(true);
    setError(null);
    setPicks(null);
    const seeds = getMyList().slice(0, 12).map((s) => s.name);
    try {
      const d = await fetch("/api/ai-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vibe: v, seeds }),
      }).then((r) => r.json());
      if (d.error === "not_configured") setError("AI isn't configured (missing OPENROUTER_API_KEY).");
      else if (d.error) setError("Couldn't reach the AI. Try again.");
      else setPicks(d.picks ?? []);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="px-[22px] pb-6 pt-[max(20px,env(safe-area-inset-top))] md:px-8 md:pt-10">
      <div className="flex items-center gap-2">
        <SparkleIcon className="h-6 w-6 text-accent" />
        <h1 className="text-[24px] font-extrabold tracking-tight text-text md:text-[26px]">Hikari AI</h1>
      </div>
      <p className="mt-1 text-[13px] text-text2">
        Describe a mood, a vibe, or what you&apos;re in the mood for — get picks tuned to it (and your list).
      </p>

      {/* input */}
      <div className="mt-4 flex gap-2">
        <input
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && recommend(vibe)}
          placeholder="e.g. a slow-burn romance with gorgeous animation…"
          className="h-12 flex-1 rounded-[14px] bg-surface px-4 text-[15px] text-text placeholder:text-muted outline-none ring-1 ring-hair focus:ring-accent/50"
        />
        <button
          onClick={() => recommend(vibe)}
          disabled={loading || !vibe.trim()}
          className="flex items-center gap-2 rounded-[14px] bg-accent px-5 text-[14px] font-bold text-accent-ink disabled:opacity-50"
        >
          <SparkleIcon className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
          {loading ? "Thinking…" : "Recommend"}
        </button>
      </div>

      {/* quick vibes */}
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => { setVibe(c); recommend(c); }}
            className="shrink-0 rounded-[20px] bg-surface2 px-3.5 py-1.5 text-[13px] font-medium text-text2 ring-1 ring-hair active:bg-accent/15"
          >
            {c}
          </button>
        ))}
      </div>

      {error && <p className="mt-6 text-[14px] text-red-400">{error}</p>}

      {/* results */}
      {loading && (
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-[12px] bg-surface" />
          ))}
        </div>
      )}

      {picks && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {picks.map((p, i) => (
            <motion.div
              key={p.show.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 240, damping: 22 }}
            >
              <PosterCard id={p.show.id} name={p.show.name} thumbnail={p.show.thumbnail} score={p.show.score} type={p.show.type} />
              <p className="mt-1.5 text-[12px] italic leading-snug text-text2">“{p.reason}”</p>
            </motion.div>
          ))}
          {picks.length === 0 && <p className="col-span-full py-8 text-center text-[14px] text-muted">No picks — try another vibe.</p>}
        </div>
      )}
    </main>
  );
}
