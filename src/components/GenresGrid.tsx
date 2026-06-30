import Link from "next/link";

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy",
  "Horror", "Mahou Shoujo", "Mecha", "Music", "Mystery", "Psychological",
  "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller",
];

// Soft cycling tints (enma gives each chip its own color).
const COLORS = [
  "#A4B389", "#06D6A0", "#935C5F", "#AD92BC", "#ABCCD8", "#D8B2AB",
];

export default function GenresGrid() {
  return (
    <section className="px-[22px] pt-[26px] md:px-8">
      <h2 className="pb-3 text-[17px] font-bold tracking-tight text-text">Genres</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {GENRES.map((g, i) => (
          <Link
            key={g}
            href={`/genre/${encodeURIComponent(g)}`}
            className="rounded-[8px] bg-surface2 px-3 py-2.5 text-[13px] font-bold ring-1 ring-hair transition-colors hover:bg-surface"
            style={{ color: COLORS[i % COLORS.length] }}
          >
            {g}
          </Link>
        ))}
      </div>
    </section>
  );
}
