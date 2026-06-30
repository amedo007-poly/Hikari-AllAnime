"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { posterGradient } from "../lib/poster";
import { StarIcon } from "./icons";

interface PosterCardProps {
  id: string;
  name: string;
  thumbnail?: string | null;
  score?: number | null;
  type?: string | null;
  width?: number; // px; omit for fluid grid cell
}

export default function PosterCard({
  id,
  name,
  thumbnail,
  score,
  type,
  width,
}: PosterCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const showImg = thumbnail && !errored;

  return (
    <motion.div
      className={width ? "shrink-0" : "w-full"}
      style={width ? { width } : undefined}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      whileHover={{ y: -6 }}
    >
    <Link href={`/show/${id}`} className="group block w-full">
      <div
        className="relative aspect-[2/3] w-full overflow-hidden rounded-[12px] shadow-[0_8px_20px_rgba(0,0,0,.35)] ring-0 ring-accent/60 transition-all duration-300 group-hover:shadow-[0_12px_30px_rgba(6,214,160,.25)] group-hover:ring-2"
        style={{ background: posterGradient(id) }}
      >
        {!showImg && (
          <span className="mono-tag absolute left-2 top-2 text-[9px] text-white/40">
            // COVER ART
          </span>
        )}
        {showImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={name}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-110 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
        {/* bottom scrim + title */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2 pt-6">
          <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-white transition-colors group-hover:text-accent">
            {name}
          </p>
        </div>
        {typeof score === "number" && score > 0 && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 backdrop-blur">
            <StarIcon className="h-3 w-3 text-accent" />
            <span className="text-[11px] font-semibold text-white">
              {score.toFixed(1)}
            </span>
          </div>
        )}
        {type && (
          <span className="absolute right-2 top-2 rounded-md bg-accent/90 px-1.5 py-0.5 text-[10px] font-bold text-accent-ink">
            {type}
          </span>
        )}
      </div>
    </Link>
    </motion.div>
  );
}
