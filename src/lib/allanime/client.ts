import { unstable_cache } from "next/cache";
import {
  ALLANIME_API,
  ALLANIME_BASE,
  ALLANIME_REFERER,
  EPISODES_LIST_GQL,
  EPISODE_INFOS_GQL,
  EPISODE_SOURCES_GQL,
  EP_THUMB_BASE,
  POPULAR_GQL,
  SEARCH_GQL,
  SHOW_DETAIL_GQL,
  SOURCES_QUERY_HASH,
  TranslationType,
  baseHeaders,
} from "./config";
import { decodeProviderId, processResponse } from "./decode";
import type {
  EpisodeInfo,
  EpisodesDetail,
  SearchResult,
  ShowDetail,
  Source,
  StreamLink,
} from "./types";

interface RawCard {
  _id: string;
  name: string;
  englishName?: string | null;
  thumbnail?: string | null;
  score?: number | null;
  type?: string | null;
  malId?: string | number | null;
  aniListId?: string | number | null;
  availableEpisodes?: Record<string, number> | null;
}

// AllAnime mixes score scales: most shows are 0–10 (9.26) but some carry the
// AniList 0–100 average (79). Normalize everything to 0–10.
function normScore(s: number | null | undefined): number | null {
  if (s == null) return null;
  return s > 10 ? Math.round(s) / 10 : s;
}

function toResult(c: RawCard): SearchResult {
  return {
    id: c._id,
    name: c.name,
    englishName: c.englishName ?? null,
    thumbnail: c.thumbnail ?? null,
    score: normScore(c.score),
    type: c.type ?? null,
    malId: c.malId != null ? String(c.malId) : null,
    aniListId: c.aniListId != null ? String(c.aniListId) : null,
    availableEpisodes: c.availableEpisodes ?? null,
  };
}

/**
 * Resolve a MyAnimeList id to an AllAnime show id by searching the title and
 * matching malId exactly; falls back to the best title match.
 */
export async function resolveByMal(
  malId: string | number,
  title: string,
): Promise<SearchResult | null> {
  const results = await queryShows({ query: title, limit: 15 });
  const exact = results.find((r) => r.malId === String(malId));
  return exact ?? results[0] ?? null;
}

async function postGraphQLRaw(
  query: string,
  variables: Record<string, unknown>,
): Promise<string> {
  const res = await fetch(`${ALLANIME_API}/api`, {
    method: "POST",
    headers: { ...baseHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ variables, query }),
  });
  if (!res.ok) throw new Error(`AllAnime API ${res.status} ${res.statusText}`);
  return res.text();
}

// Metadata queries are cached for 5 min (keyed by query+variables) — fresh
// enough for catalog data, and collapses the N identical upstream calls per
// page view into cache hits. (POST responses skip Next's fetch cache, hence
// the explicit unstable_cache wrapper. Sources stay uncached — see getGraphQL.)
const postGraphQL = unstable_cache(postGraphQLRaw, ["allanime-gql"], {
  revalidate: 300,
});

/** Persisted-query GET — the path the API's episode resolver actually accepts. */
async function getGraphQL(
  variables: Record<string, unknown>,
  hash: string,
): Promise<string> {
  const params = new URLSearchParams({
    variables: JSON.stringify(variables),
    extensions: JSON.stringify({
      persistedQuery: { version: 1, sha256Hash: hash },
    }),
  });
  const res = await fetch(`${ALLANIME_API}/api?${params}`, {
    headers: baseHeaders(),
  });
  if (!res.ok) throw new Error(`AllAnime API ${res.status} ${res.statusText}`);
  return res.text();
}

interface ShowsQuery {
  query?: string;
  genres?: string[];
  types?: string[]; // ["Movie"], ["TV"], ...
  year?: number;
  sortBy?: string; // e.g. "Recent" | "Top" | "Popular" | "Name_ASC"
  limit?: number;
  page?: number;
  mode?: TranslationType;
}

/** Flexible shows() query — backs search, genre/type browse, and latest feeds. */
async function queryShows(opts: ShowsQuery): Promise<SearchResult[]> {
  const search: Record<string, unknown> = {
    allowAdult: false,
    allowUnknown: false,
    query: opts.query ?? "",
  };
  if (opts.genres?.length) search.genres = opts.genres;
  if (opts.types?.length) search.types = opts.types;
  if (opts.year) search.year = opts.year;
  if (opts.sortBy) search.sortBy = opts.sortBy;

  const variables = {
    search,
    limit: opts.limit ?? 40,
    page: opts.page ?? 1,
    translationType: opts.mode ?? "sub",
    countryOrigin: "ALL",
  };
  const text = await postGraphQL(SEARCH_GQL, variables);
  const json = JSON.parse(processResponse(text));
  const edges: RawCard[] = json?.data?.shows?.edges ?? [];
  return edges.map(toResult);
}

/** Browse a category by type ("Movie","TV","ONA","OVA","Special") with paging. */
export function getByType(
  types: string[],
  page = 1,
  sortBy = "Top",
): Promise<SearchResult[]> {
  return queryShows({ types, sortBy, page, limit: 30 });
}

/** Most-popular browse (paged) — uses sortBy on the shows() query. */
export function getMostPopular(page = 1): Promise<SearchResult[]> {
  return queryShows({ sortBy: "Popular", page, limit: 30 });
}

export interface CatalogFilters {
  genre?: string;
  type?: string;
  year?: number;
  sort?: string; // Top | Popular | Recent | Name_ASC
  page?: number;
}

/** The full catalog with combinable filters (genre/type/year/sort). */
export function getCatalog(f: CatalogFilters): Promise<SearchResult[]> {
  return queryShows({
    genres: f.genre ? [f.genre] : undefined,
    types: f.type ? [f.type] : undefined,
    year: f.year,
    sortBy: f.sort ?? "Top",
    page: f.page ?? 1,
    limit: 30,
  });
}

/** A random show (for the "surprise me" button). */
export async function getRandom(): Promise<SearchResult | null> {
  const page = 1 + Math.floor(Math.random() * 40);
  const list = await queryShows({ sortBy: "Top", page, limit: 30 });
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

/** Search shows by title. */
export function searchAnime(
  query: string,
  mode: TranslationType = "sub",
): Promise<SearchResult[]> {
  return queryShows({ query, mode, limit: 40 });
}

/** Browse shows by genre (e.g. "Action"). */
export function getByGenre(
  genre: string,
  limit = 30,
): Promise<SearchResult[]> {
  return queryShows({ genres: [genre], sortBy: "Top", limit });
}

/** Latest-updated shows for the "Latest Episode" feed. */
export function getLatest(limit = 18): Promise<SearchResult[]> {
  return queryShows({ sortBy: "Recent", limit });
}

/** Trending shows for the home screen (queryPopular). */
export async function getPopular(
  size = 20,
  dateRange = 7,
): Promise<SearchResult[]> {
  const text = await postGraphQL(POPULAR_GQL, {
    type: "anime",
    size,
    dateRange,
    page: 1,
  });
  const json = JSON.parse(processResponse(text));
  const recs: Array<{ anyCard?: RawCard }> =
    json?.data?.queryPopular?.recommendations ?? [];
  return recs
    .map((r) => r.anyCard)
    .filter((c): c is RawCard => !!c)
    .map(toResult);
}

/** Top trending shows enriched with banner+synopsis, for the spotlight hero. */
export async function getSpotlight(count = 6): Promise<ShowDetail[]> {
  const popular = await getPopular(count + 4);
  const top = popular.slice(0, count);
  const detailed = await Promise.all(
    top.map((p) => getShowDetail(p.id).catch(() => null)),
  );
  return detailed.filter((d): d is ShowDetail => !!d);
}

/** Full metadata for the show-detail screen. */
export async function getShowDetail(showId: string): Promise<ShowDetail> {
  const text = await postGraphQL(SHOW_DETAIL_GQL, { showId });
  const json = JSON.parse(processResponse(text));
  const s = json?.data?.show;
  if (!s) throw new Error("show not found");
  const year: number | null = s.season?.year ?? s.airedStart?.year ?? null;
  const season: string | null =
    s.season?.quarter && s.season?.year ? `${s.season.quarter} ${s.season.year}` : null;
  return {
    ...toResult(s),
    banner: s.banner ?? null,
    description: s.description ?? null,
    genres: Array.isArray(s.genres) ? s.genres : [],
    status: s.status ?? null,
    // Mixed units upstream: seconds for most shows, milliseconds for some
    // (1_440_000 ms = 24 min). Anything above 10 h can't be seconds.
    episodeDuration:
      s.episodeDuration != null
        ? s.episodeDuration > 36000
          ? Math.round(s.episodeDuration / 1000)
          : s.episodeDuration
        : null,
    year,
    season,
    studios: Array.isArray(s.studios) ? s.studios : [],
  };
}

/** Per-episode titles + thumbnails for the detail episode list. */
export async function getEpisodeInfos(
  showId: string,
  start: number,
  end: number,
): Promise<Record<string, EpisodeInfo>> {
  const text = await postGraphQL(EPISODE_INFOS_GQL, { showId, start, end });
  const json = JSON.parse(processResponse(text));
  const infos: Array<{
    episodeIdNum: number;
    notes?: string | null;
    thumbnails?: string[] | null;
  }> = json?.data?.episodeInfos ?? [];

  const map: Record<string, EpisodeInfo> = {};
  for (const info of infos) {
    const key = String(info.episodeIdNum);
    const thumb = info.thumbnails?.[0];
    map[key] = {
      number: key,
      title: info.notes?.trim() || null,
      thumbnail: thumb ? `${EP_THUMB_BASE}${thumb}` : null,
    };
  }
  return map;
}

/** List available episode numbers for a show, per translation type. */
export async function listEpisodes(showId: string): Promise<EpisodesDetail> {
  const text = await postGraphQL(EPISODES_LIST_GQL, { showId });
  const json = JSON.parse(processResponse(text));
  const detail = json?.data?.show?.availableEpisodesDetail ?? {};
  const sortNum = (a: string, b: string) => Number(a) - Number(b);
  return {
    sub: [...(detail.sub ?? [])].sort(sortNum),
    dub: [...(detail.dub ?? [])].sort(sortNum),
    raw: [...(detail.raw ?? [])].sort(sortNum),
  };
}

/** Pull the (de-obfuscated) source list for one episode. */
export async function getSources(
  showId: string,
  episodeString: string,
  mode: TranslationType = "sub",
): Promise<Source[]> {
  const variables = { showId, translationType: mode, episodeString };
  // GET persisted-query is primary (the POST resolver server-errors); POST is fallback.
  let text: string;
  try {
    text = await getGraphQL(variables, SOURCES_QUERY_HASH);
    if (!text.includes("tobeparsed") && !text.includes("sourceUrls")) {
      text = await postGraphQL(EPISODE_SOURCES_GQL, variables);
    }
  } catch {
    text = await postGraphQL(EPISODE_SOURCES_GQL, variables);
  }
  const decrypted = processResponse(text);

  let rawSources: Array<{
    sourceUrl: string;
    sourceName?: string;
    priority?: number;
  }> = [];

  try {
    const json = JSON.parse(decrypted);
    // decrypted blob is unwrapped ({episode:...}); POST returns {data:{episode:...}}.
    const episode = json?.episode ?? json?.data?.episode;
    rawSources = episode?.sourceUrls ?? [];
  } catch {
    // Fallback: regex out of a non-JSON fragment.
    const cleaned = decrypted.replace(/\\u002F/g, "/").replace(/\\/g, "");
    const re =
      /"sourceUrl":"([^"]+)"[^}]*?"sourceName":"([^"]+)"|"sourceName":"([^"]+)"[^}]*?"sourceUrl":"([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(cleaned)) !== null) {
      const url = m[1] ?? m[4];
      const name = m[2] ?? m[3];
      if (url) rawSources.push({ sourceUrl: url, sourceName: name });
    }
  }

  return rawSources
    .map((s) => ({
      name: s.sourceName ?? "unknown",
      url: decodeProviderId(s.sourceUrl),
      priority: s.priority ?? 0,
    }))
    .filter((s) => s.url.length > 0)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Resolve a single source to concrete playable links by fetching its embed
 * (the de-obfuscated path points at AllAnime's /clock.json endpoint).
 * Direct http(s) sources (youtube etc.) are returned as-is.
 */
export async function resolveStreamLinks(source: Source): Promise<StreamLink[]> {
  if (/^https?:\/\//.test(source.url)) {
    return [
      {
        url: source.url,
        quality: "auto",
        isM3u8: source.url.includes(".m3u8"),
        referer: ALLANIME_REFERER,
      },
    ];
  }

  const embedUrl = `https://${ALLANIME_BASE}${source.url}`;
  const res = await fetch(embedUrl, { headers: baseHeaders() });
  if (!res.ok) return [];
  const json = (await res.json().catch(() => null)) as {
    links?: Array<{
      link: string;
      resolutionStr?: string;
      hls?: boolean;
      mp4?: boolean;
    }>;
    headers?: { Referer?: string };
  } | null;
  if (!json?.links) return [];

  const referer = json.headers?.Referer ?? ALLANIME_REFERER;
  return json.links.map((l) => ({
    url: l.link,
    quality: l.resolutionStr ?? "auto",
    isM3u8: l.hls === true || l.link.includes(".m3u8"),
    referer,
  }));
}

/**
 * Convenience: search-independent helper that resolves the best available
 * stream links for an episode, trying sources in priority order.
 */
export async function getEpisodeStreams(
  showId: string,
  episodeString: string,
  mode: TranslationType = "sub",
): Promise<{ source: Source; links: StreamLink[] }[]> {
  const sources = await getSources(showId, episodeString, mode);
  const resolved = await Promise.all(
    sources.map(async (source) => ({
      source,
      links: await resolveStreamLinks(source).catch(() => []),
    })),
  );
  return resolved.filter((r) => r.links.length > 0);
}
