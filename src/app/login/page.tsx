"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BrandMark, BrandWordmark } from "../../components/Brand";

function LoginInner() {
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-8">
      <div className="mb-8 flex flex-col items-center gap-3">
        <BrandMark size={64} />
        <BrandWordmark className="h-7" />
      </div>

      <p className="mb-6 max-w-sm text-center text-[14px] text-text2">
        Sign in with your MyAnimeList account. Your watchlist, progress and
        ratings stay synced to your own MAL — this is your account.
      </p>

      <a
        href={`/api/mal/login?next=${encodeURIComponent(next)}`}
        className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-[15px] font-bold text-accent-ink shadow-[0_10px_26px_rgba(6,214,160,.25)]"
      >
        Sign in with MyAnimeList
      </a>

      <p className="mt-4 text-[11px] text-muted">No MAL account? Create one free at myanimelist.net.</p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
