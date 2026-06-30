// AllAnime API config — ground truth: ani-cli shell source.
// These drift over time; ani-cli is the maintained reference, re-sync if requests start failing.

export const AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0";

export const ALLANIME_REFERER = "https://youtu-chan.com";
export const ALLANIME_BASE = "allanime.day";
export const ALLANIME_API = `https://api.${ALLANIME_BASE}`;

// AES-256 key = sha256("Xot36i3lK3:v1"), used to decrypt "tobeparsed" payloads.
export const KEY_SEED = "Xot36i3lK3:v1";

// Persisted-query hash for the episode-sources call.
export const SOURCES_QUERY_HASH =
  "d405d0edd690624b66baba3068e0edc3ac90f1597d898a1ec8db4e5c43c00fec";

export type TranslationType = "sub" | "dub";

// Common headers for every request to the AllAnime API / CDN.
export function baseHeaders(): Record<string, string> {
  return {
    "User-Agent": AGENT,
    Referer: ALLANIME_REFERER,
    Origin: ALLANIME_REFERER,
  };
}

// ---- GraphQL documents (copied verbatim from ani-cli) ----

export const SEARCH_GQL =
  "query( $search: SearchInput $limit: Int $page: Int $translationType: VaildTranslationTypeEnumType $countryOrigin: VaildCountryOriginEnumType ) { shows( search: $search limit: $limit page: $page translationType: $translationType countryOrigin: $countryOrigin ) { edges { _id name englishName thumbnail score type malId aniListId availableEpisodes __typename } }}";

export const POPULAR_GQL =
  "query( $type: VaildPopularTypeEnumType! $size: Int! $dateRange: Int $page: Int ) { queryPopular( type: $type size: $size dateRange: $dateRange page: $page ) { recommendations { anyCard { _id name englishName thumbnail score availableEpisodes } } }}";

export const SHOW_DETAIL_GQL =
  "query ($showId: String!) { show( _id: $showId ) { _id name englishName thumbnail banner description score genres status episodeDuration availableEpisodes season airedStart studios malId aniListId }}";

export const EPISODES_LIST_GQL =
  "query ($showId: String!) { show( _id: $showId ) { _id availableEpisodesDetail }}";

export const EPISODE_INFOS_GQL =
  "query ($showId: String!, $start: Float!, $end: Float!) { episodeInfos( showId: $showId episodeNumStart: $start episodeNumEnd: $end ) { episodeIdNum notes thumbnails }}";

// Episode-thumbnail CDN (paths from episodeInfos.thumbnails are relative to this).
export const EP_THUMB_BASE = "https://wp.youtube-anime.com/aln.youtube-anime.com";

export const EPISODE_SOURCES_GQL =
  "query ($showId: String!, $translationType: VaildTranslationTypeEnumType!, $episodeString: String!) { episode( showId: $showId translationType: $translationType episodeString: $episodeString ) { episodeString sourceUrls }}";
