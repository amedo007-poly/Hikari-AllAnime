"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShuffleIcon } from "./icons";

export default function RandomButton({ label = "Random" }: { label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function go() {
    if (busy) return;
    setBusy(true);
    try {
      const d = await fetch("/api/random").then((r) => r.json());
      if (d.showId) router.push(`/show/${d.showId}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={go}
      disabled={busy}
      className="flex shrink-0 items-center gap-2 rounded-full bg-accent px-4 py-2 text-[13px] font-bold text-accent-ink shadow-[0_8px_20px_rgba(6,214,160,.25)] disabled:opacity-60"
    >
      <ShuffleIcon className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
      {busy ? "Rolling…" : label}
    </button>
  );
}
