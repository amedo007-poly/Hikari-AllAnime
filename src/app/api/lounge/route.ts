import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  callWithAuth,
  getMe,
} from "../../../lib/mal";
import {
  createPost,
  listPosts,
  supabaseConfigured,
  uploadImage,
} from "../../../lib/supabase";

export const runtime = "nodejs";

const MAX_IMAGE = 5 * 1024 * 1024; // 5 MB
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function GET() {
  if (!supabaseConfigured())
    return NextResponse.json({ error: "not_configured", posts: [] }, { status: 503 });
  try {
    return NextResponse.json({ posts: await listPosts() });
  } catch (e) {
    return NextResponse.json({ error: String(e), posts: [] }, { status: 502 });
  }
}

// POST multipart/form-data: text, image?, showId?, showName?
// Author identity = the signed-in MAL profile.
export async function POST(req: NextRequest) {
  if (!supabaseConfigured())
    return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const access = req.cookies.get(COOKIE_ACCESS)?.value;
  const refresh = req.cookies.get(COOKIE_REFRESH)?.value;
  let author: { name: string; picture: string | null };
  try {
    author = (await callWithAuth(access, refresh, (t) => getMe(t))).result;
  } catch {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "bad form" }, { status: 400 });

  const text = String(form.get("text") ?? "").trim().slice(0, 2000);
  const image = form.get("image");
  if (!text && !(image instanceof File))
    return NextResponse.json({ error: "empty" }, { status: 400 });

  let imageUrl: string | null = null;
  if (image instanceof File && image.size > 0) {
    const ext = IMAGE_TYPES[image.type];
    if (!ext) return NextResponse.json({ error: "unsupported image type" }, { status: 400 });
    if (image.size > MAX_IMAGE)
      return NextResponse.json({ error: "image too large (max 5 MB)" }, { status: 400 });
    imageUrl = await uploadImage(await image.arrayBuffer(), image.type, ext);
  }

  try {
    const post = await createPost({
      author: author.name,
      avatar: author.picture,
      text,
      image_url: imageUrl,
      show_id: (form.get("showId") as string) || null,
      show_name: (form.get("showName") as string) || null,
    });
    return NextResponse.json({ post });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
