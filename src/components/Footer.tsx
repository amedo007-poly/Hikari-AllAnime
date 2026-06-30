import Link from "next/link";
import { Brand } from "./Brand";

const AZ = [..."0123456789".split(""), ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Browse",
    links: [
      { label: "Home", href: "/" },
      { label: "Most Popular", href: "/popular" },
      { label: "Movies", href: "/movie" },
      { label: "TV Series", href: "/tv" },
      { label: "Latest", href: "/latest" },
    ],
  },
  {
    title: "Genres",
    links: [
      { label: "Action", href: "/genre/Action" },
      { label: "Romance", href: "/genre/Romance" },
      { label: "Comedy", href: "/genre/Comedy" },
      { label: "Fantasy", href: "/genre/Fantasy" },
    ],
  },
  {
    title: "Types",
    links: [
      { label: "ONA", href: "/ona" },
      { label: "OVA", href: "/ova" },
      { label: "Special", href: "/special" },
      { label: "Movie", href: "/movie" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-hair bg-black/40 px-[22px] pb-10 pt-8 md:px-8">
      <div className="mx-auto max-w-[1180px]">
        {/* A-Z */}
        <div className="border-b border-hair pb-6">
          <p className="text-[18px] font-extrabold text-text">A–Z LIST</p>
          <p className="mb-3 border-l-2 border-muted pl-3 text-[12px] text-muted">
            Search anime alphabetically
          </p>
          <div className="flex flex-wrap gap-1.5">
            {AZ.map((l) => (
              <Link
                key={l}
                href={`/search?q=${encodeURIComponent(l)}`}
                className="rounded-md bg-surface2 px-2.5 py-1 text-[13px] font-bold text-text2 ring-1 ring-hair transition-colors hover:bg-accent hover:text-accent-ink"
              >
                {l}
              </Link>
            ))}
          </div>
        </div>

        {/* columns */}
        <div className="grid grid-cols-2 gap-6 border-b border-hair py-6 md:grid-cols-3">
          {COLS.map((c) => (
            <div key={c.title}>
              <h3 className="mb-3 text-[14px] font-bold text-accent">{c.title}</h3>
              <ul className="space-y-2 text-[13px] text-text2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="transition-colors hover:text-text">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* logo + disclaimer */}
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <Brand size={28} />
          <p className="max-w-3xl text-[12px] leading-relaxed text-muted">
            Hikari does not host any files; it pulls streams from third-party services.
            For private use only.
          </p>
        </div>
      </div>
    </footer>
  );
}
