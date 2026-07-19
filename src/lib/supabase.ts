// Supabase over plain REST (PostgREST + Storage) — no client dependency.
// Server-side only: uses the service-role key.

const URL_ = process.env.SUPABASE_URL?.replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_KEY;

export function supabaseConfigured(): boolean {
  return !!URL_ && !!KEY;
}

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: KEY!,
    Authorization: `Bearer ${KEY}`,
    ...extra,
  };
}

export interface LoungePost {
  id: number;
  author: string;
  avatar: string | null;
  text: string;
  image_url: string | null;
  show_id: string | null;
  show_name: string | null;
  created_at: string;
}

export async function listPosts(limit = 100): Promise<LoungePost[]> {
  const res = await fetch(
    `${URL_}/rest/v1/lounge_posts?select=*&order=created_at.desc&limit=${limit}`,
    { headers: headers(), cache: "no-store" },
  );
  if (!res.ok) throw new Error(`supabase list ${res.status}`);
  return res.json();
}

export async function createPost(
  post: Omit<LoungePost, "id" | "created_at">,
): Promise<LoungePost> {
  const res = await fetch(`${URL_}/rest/v1/lounge_posts`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json", Prefer: "return=representation" }),
    body: JSON.stringify(post),
  });
  if (!res.ok) throw new Error(`supabase insert ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  return rows[0];
}

/** Upload an image to the public "lounge" bucket; returns its public URL. */
export async function uploadImage(
  bytes: ArrayBuffer,
  contentType: string,
  ext: string,
): Promise<string> {
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const res = await fetch(`${URL_}/storage/v1/object/lounge/${name}`, {
    method: "POST",
    headers: headers({ "Content-Type": contentType }),
    body: bytes,
  });
  if (!res.ok) throw new Error(`supabase upload ${res.status}: ${await res.text()}`);
  return `${URL_}/storage/v1/object/public/lounge/${name}`;
}
