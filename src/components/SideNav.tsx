"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, SearchIcon, BookmarkIcon, FilmIcon, TvIcon, StarIcon, GridIcon, SparkleIcon, ChatIcon } from "./icons";
import { Brand } from "./Brand";
import RandomButton from "./RandomButton";
import Profile from "./Profile";

const tabs = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/ai", label: "Hikari AI", Icon: SparkleIcon },
  { href: "/search", label: "Search", Icon: SearchIcon },
  { href: "/browse", label: "Browse", Icon: GridIcon },
  { href: "/movie", label: "Movies", Icon: FilmIcon },
  { href: "/tv", label: "TV Series", Icon: TvIcon },
  { href: "/popular", label: "Popular", Icon: StarIcon },
  { href: "/mal", label: "My List", Icon: BookmarkIcon },
  { href: "/lounge", label: "Lounge", Icon: ChatIcon },
];

export default function SideNav() {
  const path = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-hair bg-bg/60 px-4 py-7 backdrop-blur-xl md:flex">
      <Link href="/" className="mb-8 flex items-center gap-2.5 px-1">
        <Brand size={64} />
      </Link>

      <nav className="flex flex-col gap-1">
        {tabs.map(({ href, label, Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[15px] font-semibold transition"
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

      <div className="mt-auto flex flex-col gap-3 px-1 pt-6">
        <RandomButton label="Surprise me" />
        <Profile />
      </div>
    </aside>
  );
}
