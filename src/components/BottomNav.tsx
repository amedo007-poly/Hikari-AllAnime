"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  HomeIcon,
  SearchIcon,
  BookmarkIcon,
  BarsIcon,
  CloseIcon,
  FilmIcon,
  TvIcon,
  StarIcon,
  ListIcon,
  GridIcon,
  SparkleIcon,
} from "./icons";
import { Brand } from "./Brand";
import RandomButton from "./RandomButton";

const ALL = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/ai", label: "Hikari AI", Icon: SparkleIcon },
  { href: "/search", label: "Search", Icon: SearchIcon },
  { href: "/browse", label: "Browse", Icon: GridIcon },
  { href: "/movie", label: "Movies", Icon: FilmIcon },
  { href: "/tv", label: "TV Series", Icon: TvIcon },
  { href: "/popular", label: "Popular", Icon: StarIcon },
  { href: "/mal", label: "Anime List", Icon: ListIcon },
  { href: "/list", label: "My List", Icon: BookmarkIcon },
];

export default function BottomNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const tabs = [
    { href: "/", label: "Home", Icon: HomeIcon },
    { href: "/search", label: "Search", Icon: SearchIcon },
    { href: "/list", label: "My List", Icon: BookmarkIcon },
  ];

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[84px] max-w-[480px] items-start justify-around border-t border-hair bg-bg/80 px-4 pt-3 backdrop-blur-xl md:hidden">
        {tabs.map(({ href, label, Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex w-16 flex-col items-center gap-1"
              style={{ color: active ? "var(--color-accent)" : "var(--color-muted)" }}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className="flex w-16 flex-col items-center gap-1 text-muted"
        >
          <BarsIcon className="h-6 w-6" />
          <span className="text-[10px] font-semibold">Menu</span>
        </button>
      </nav>

      {/* drawer */}
      <div
        className={`fixed inset-0 z-[60] md:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/60 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[80%] max-w-[300px] flex-col bg-bg p-5 shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <Brand size={44} />
            <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-surface text-text">
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <nav className="mt-6 flex flex-col gap-1">
            {ALL.map(({ href, label, Icon }) => {
              const active = path === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-[12px] px-3 py-3 text-[15px] font-semibold"
                  style={{
                    color: active ? "var(--color-accent)" : "var(--color-text2)",
                    background: active ? "rgba(6,214,160,.12)" : "transparent",
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 px-3" onClick={() => setOpen(false)}>
            <RandomButton label="Surprise me" />
          </div>
        </aside>
      </div>
    </>
  );
}
