import { randomBytes } from "node:crypto";

// MyAnimeList API v2 (OAuth2 PKCE, plain method — MAL only supports "plain").
export const MAL_AUTH = "https://myanimelist.net/v1/oauth2/authorize";
export const MAL_TOKEN = "https://myanimelist.net/v1/oauth2/token";
export const MAL_API = "https://api.myanimelist.net/v2";

export const COOKIE_ACCESS = "mal_at";
export const COOKIE_REFRESH = "mal_rt";
export const COOKIE_VERIFIER = "mal_cv";

export function malClientId(): string | undefined {
  return process.env.MAL_CLIENT_ID;
}
export function malConfigured(): boolean {
  return !!process.env.MAL_CLIENT_ID;
}

/** PKCE code verifier (MAL uses it directly as the challenge — "plain"). */
export function makeVerifier(): string {
  return randomBytes(48).toString("base64url"); // 64 chars, URL-safe
}

export function authUrl(redirectUri: string, verifier: string): string {
  const p = new URLSearchParams({
    response_type: "code",
    client_id: malClientId() ?? "",
    code_challenge: verifier, // plain method
    code_challenge_method: "plain",
    redirect_uri: redirectUri,
  });
  return `${MAL_AUTH}?${p}`;
}

export interface MalTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

async function tokenRequest(body: Record<string, string>): Promise<MalTokens> {
  const params = new URLSearchParams({
    client_id: malClientId() ?? "",
    ...(process.env.MAL_CLIENT_SECRET ? { client_secret: process.env.MAL_CLIENT_SECRET } : {}),
    ...body,
  });
  const res = await fetch(MAL_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!res.ok) throw new Error(`MAL token ${res.status}: ${await res.text()}`);
  return res.json();
}

export function exchangeCode(code: string, verifier: string, redirectUri: string) {
  return tokenRequest({
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri,
  });
}

export function refreshTokens(refreshToken: string) {
  return tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken });
}

/**
 * Run an authed MAL call, transparently refreshing on a 401.
 * Returns the result and, if a refresh happened, the new tokens to re-cookie.
 */
export async function callWithAuth<T>(
  access: string | undefined,
  refresh: string | undefined,
  fn: (token: string) => Promise<T>,
): Promise<{ result: T; tokens?: MalTokens }> {
  if (access) {
    try {
      return { result: await fn(access) };
    } catch (e) {
      if (!/\b401\b/.test(String(e)) || !refresh) throw e;
    }
  }
  if (!refresh) throw new Error("not_connected");
  const tokens = await refreshTokens(refresh);
  return { result: await fn(tokens.access_token), tokens };
}

// ---- API ----

export interface MalListEntry {
  malId: number;
  title: string;
  picture: string | null;
  totalEpisodes: number;
  watched: number;
  score: number;
  mediaType: string;
}

export async function getAnimeList(
  accessToken: string,
  status: string,
  limit = 200,
): Promise<MalListEntry[]> {
  const fields = "list_status,num_episodes,media_type,main_picture";
  const p = new URLSearchParams({ status, limit: String(limit), fields, sort: "list_updated_at", nsfw: "true" });
  const res = await fetch(`${MAL_API}/users/@me/animelist?${p}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`MAL list ${res.status}`);
  const json = await res.json();
  type Node = {
    node: { id: number; title: string; num_episodes?: number; media_type?: string; main_picture?: { large?: string; medium?: string } };
    list_status?: { num_episodes_watched?: number; score?: number };
  };
  return (json.data ?? []).map((d: Node) => ({
    malId: d.node.id,
    title: d.node.title,
    picture: d.node.main_picture?.large ?? d.node.main_picture?.medium ?? null,
    totalEpisodes: d.node.num_episodes ?? 0,
    watched: d.list_status?.num_episodes_watched ?? 0,
    score: d.list_status?.score ?? 0,
    mediaType: d.node.media_type ?? "",
  }));
}

/** Write back: set status / watched episodes / score on the user's MAL list. */
export async function updateAnimeStatus(
  accessToken: string,
  animeId: number,
  fields: { status?: string; num_watched_episodes?: number; score?: number },
): Promise<void> {
  const body = new URLSearchParams();
  if (fields.status) body.set("status", fields.status);
  if (fields.num_watched_episodes != null)
    body.set("num_watched_episodes", String(fields.num_watched_episodes));
  if (fields.score != null) body.set("score", String(fields.score));

  const res = await fetch(`${MAL_API}/anime/${animeId}/my_list_status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) throw new Error(`MAL update ${res.status}: ${await res.text()}`);
}
