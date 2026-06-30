"use client";

import { useEffect, useState } from "react";

interface Me {
  configured: boolean;
  connected: boolean;
  name?: string;
  picture?: string | null;
}

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    fetch("/api/mal/me").then((r) => r.json()).then(setMe).catch(() => setMe({ configured: false, connected: false }));
  }, []);
  return me;
}

function Avatar({ name, picture, size }: { name?: string; picture?: string | null; size: number }) {
  if (picture)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={picture} alt={name ?? ""} className="rounded-full object-cover ring-2 ring-accent/40" style={{ width: size, height: size }} />;
  return (
    <span
      className="grid place-items-center rounded-full bg-accent text-accent-ink ring-2 ring-accent/40"
      style={{ width: size, height: size, fontSize: size * 0.4, fontWeight: 800 }}
    >
      {(name ?? "?").charAt(0).toUpperCase()}
    </span>
  );
}

/** Full profile row for the sidebar. */
export default function Profile() {
  const me = useMe();
  if (!me) return <div className="h-12 animate-pulse rounded-[12px] bg-surface" />;

  if (me.connected) {
    return (
      <div className="flex items-center gap-3 rounded-[12px] bg-surface2 p-2.5 ring-1 ring-hair">
        <Avatar name={me.name} picture={me.picture} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-text">{me.name}</p>
          <p className="text-[10px] text-muted">via MyAnimeList</p>
        </div>
        <button
          onClick={async () => { await fetch("/api/mal/logout", { method: "POST" }); location.href = "/login"; }}
          className="text-[11px] font-semibold text-muted hover:text-text"
        >
          Log out
        </button>
      </div>
    );
  }
  if (me.configured) {
    return (
      <a href="/api/mal/login" className="block rounded-[12px] bg-accent px-3 py-2.5 text-center text-[13px] font-bold text-accent-ink">
        Sign in with MyAnimeList
      </a>
    );
  }
  return null;
}

/** Compact avatar (mobile header). Links to the Anime List / sign-in. */
export function ProfileAvatar() {
  const me = useMe();
  const href = me?.connected ? "/mal" : "/login";
  return (
    <a href={href} aria-label="Account">
      {me?.connected ? (
        <Avatar name={me.name} picture={me.picture} size={34} />
      ) : (
        <span className="block h-[34px] w-[34px] rounded-full bg-surface ring-1 ring-hair" />
      )}
    </a>
  );
}
