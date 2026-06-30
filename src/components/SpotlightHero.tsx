"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, PlayIcon, StarIcon } from "./icons";
import { heroGradient } from "../lib/poster";
import type { ShowDetail } from "../lib/allanime/types";

function stripHtml(s: string | null): string {
  if (!s) return "";
  return s.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").trim();
}
function epCount(s: ShowDetail): number {
  const a = s.availableEpisodes ?? {};
  return Math.max(a.sub ?? 0, a.dub ?? 0, 0);
}

export default function SpotlightHero({ items }: { items: ShowDetail[] }) {
  const [i, setI] = useState(0);
  const n = items.length;

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n]);

  if (n === 0) {
    return <div className="mx-4 mt-4 h-[260px] animate-pulse rounded-[22px] bg-surface md:mx-8 md:h-[460px]" />;
  }

  const s = items[i];
  const eps = epCount(s);

  return (
    <section className="relative mt-3 h-[300px] overflow-hidden md:h-[480px]">
      {/* slides (cross-fade) */}
      {items.map((item, idx) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            idx === i ? "opacity-100" : "opacity-0"
          }`}
          style={{ background: heroGradient(item.id) }}
          aria-hidden={idx !== i}
        >
          {(item.banner || item.thumbnail) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.banner ?? item.thumbnail!}
              alt=""
              className="absolute right-0 top-0 h-full w-full object-cover md:w-[70%]"
            />
          )}
          {/* scrims: bottom + left for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-transparent md:via-bg/30" />
        </div>
      ))}

      {/* content (re-animates on each slide) */}
      <motion.div
        key={s.id}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 26, delay: 0.05 }}
        className="absolute inset-0 flex flex-col justify-end px-[22px] pb-7 md:max-w-[60%] md:px-12 md:pb-12"
      >
        <span className="mono-tag text-[11px] font-semibold text-accent md:text-[13px]">
          #{i + 1} SPOTLIGHT
        </span>
        <h1 className="mt-2 line-clamp-2 text-[26px] font-extrabold leading-tight tracking-tight text-white md:text-[44px]">
          {s.englishName || s.name}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-text2 md:text-[14px]">
          {typeof s.score === "number" && s.score > 0 && (
            <span className="flex items-center gap-1 text-accent">
              <StarIcon className="h-3.5 w-3.5" /> {s.score.toFixed(1)}
            </span>
          )}
          {s.year && <span>{s.year}</span>}
          {eps > 0 && <span>{eps} eps</span>}
          <span className="rounded-[6px] bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white">HD</span>
          {s.genres.slice(0, 2).map((g) => (
            <span key={g} className="hidden md:inline">· {g}</span>
          ))}
        </div>

        <p className="mt-3 hidden max-w-[560px] text-[14px] leading-[1.5] text-text2 md:line-clamp-3">
          {stripHtml(s.description)}
        </p>

        <div className="mt-5 flex gap-3">
          <Link
            href={`/show/${s.id}`}
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[13px] font-bold text-accent-ink shadow-[0_10px_26px_rgba(6,214,160,.25)] md:text-[15px]"
          >
            <PlayIcon className="h-4 w-4" /> Watch Now
          </Link>
          <Link
            href={`/show/${s.id}`}
            className="rounded-full bg-white/10 px-5 py-2.5 text-[13px] font-bold text-white ring-1 ring-white/15 backdrop-blur md:text-[15px]"
          >
            Details
          </Link>
        </div>
      </motion.div>

      {/* arrows */}
      {n > 1 && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={() => setI((p) => (p - 1 + n) % n)}
            className="grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setI((p) => (p + 1) % n)}
            className="grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* dots */}
      {n > 1 && (
        <div className="absolute bottom-5 left-[22px] flex gap-1.5 md:left-12">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: idx === i ? 22 : 6,
                background: idx === i ? "var(--color-accent)" : "rgba(255,255,255,.4)",
              }}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
