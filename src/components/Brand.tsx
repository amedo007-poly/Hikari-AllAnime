"use client";

import { useState } from "react";

/**
 * Brand mark + wordmark. Uses /public/logo-mark.png and /logo-wordmark.png
 * if present; otherwise falls back to the built-in mint glyph / "Hikari" text.
 * Drop the image files in to swap the logo with zero code changes.
 */

export function BrandMark({ size = 32 }: { size?: number }) {
  const [ok, setOk] = useState(true);
  return (
    <span
      className="group/mark relative inline-grid place-items-center"
      style={{ width: size, height: size }}
    >
      {ok ? (
        // The "Steel Ball" — spins on hover (SBR easter egg).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo-mark.png"
          alt="Hikari"
          onError={() => setOk(false)}
          className="h-full w-full object-contain drop-shadow-[0_0_10px_rgba(6,214,160,.5)] transition-transform duration-700 ease-out group-hover/mark:rotate-[360deg]"
        />
      ) : (
        <span
          className="grid h-full w-full place-items-center rounded-[9px] bg-accent shadow-[0_0_18px_rgba(6,214,160,.45)] transition-transform duration-700 group-hover/mark:rotate-[360deg]"
        >
          <span className="rounded-full bg-accent-ink" style={{ width: size * 0.25, height: size * 0.25 }} />
        </span>
      )}
      {/* easter-egg tooltip */}
      <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[10px] font-semibold text-accent opacity-0 ring-1 ring-accent/30 backdrop-blur transition-opacity duration-200 group-hover/mark:opacity-100">
        Tusk · Act 4
      </span>
    </span>
  );
}

export function BrandWordmark({ className = "" }: { className?: string }) {
  const [ok, setOk] = useState(true);
  if (ok) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/logo-wordmark.png"
        alt="Hikari"
        onError={() => setOk(false)}
        className={`h-6 w-auto object-contain ${className}`}
      />
    );
  }
  return (
    <span className={`text-[20px] font-extrabold tracking-tight text-text ${className}`}>
      Hikari
    </span>
  );
}

export function Brand({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <BrandMark size={size} />
      <BrandWordmark />
    </div>
  );
}
