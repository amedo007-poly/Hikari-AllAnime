export interface SearchResult {
  id: string;
  name: string;
  englishName: string | null;
  thumbnail: string | null;
  score: number | null;
  type: string | null; // "TV" | "Movie" | "ONA" | "OVA" | ...
  malId: string | null; // MyAnimeList id (for list sync)
  aniListId: string | null;
  // episode counts per translation type (whatever the API returns)
  availableEpisodes: Record<string, number> | null;
}

export interface ShowDetail extends SearchResult {
  banner: string | null;
  description: string | null; // may contain <br> HTML
  genres: string[];
  status: string | null;
  episodeDuration: number | null; // seconds
  year: number | null;
  season: string | null; // e.g. "Fall 2023"
  studios: string[];
}

// Per-episode metadata from episodeInfos (title + thumbnail).
export interface EpisodeInfo {
  number: string; // episode number as string key
  title: string | null;
  thumbnail: string | null;
}

export interface EpisodesDetail {
  sub: string[];
  dub: string[];
  raw: string[];
}

// A raw source entry from episode.sourceUrls, after de-obfuscation.
export interface Source {
  name: string; // sourceName, e.g. "Default", "Yt-mp4", "S-mp4"
  url: string; // de-obfuscated path or absolute url
  priority: number;
}

// A concrete playable link resolved from a source's embed (clock.json).
export interface StreamLink {
  url: string;
  quality: string; // e.g. "1080", "auto", resolutionStr
  isM3u8: boolean;
  referer?: string; // referer the CDN wants (for the proxy)
}
