"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChatIcon, CloseIcon, ImageIcon } from "../../../components/icons";

interface Post {
  id: number;
  author: string;
  avatar: string | null;
  text: string;
  image_url: string | null;
  show_id: string | null;
  show_name: string | null;
  created_at: string;
}

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function LoungePage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const d = await fetch("/api/lounge").then((r) => r.json());
      if (d.error === "not_configured") setError("not_configured");
      else if (d.error) setError(String(d.error));
      else setError(null);
      setPosts(d.posts ?? []);
    } catch {
      setError("network");
      setPosts([]);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // keep the room fresh
    return () => clearInterval(t);
  }, []);

  function pick(f: File | null) {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function send() {
    if (sending || (!text.trim() && !file)) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.set("text", text.trim());
      if (file) fd.set("image", file);
      const d = await fetch("/api/lounge", { method: "POST", body: fd }).then((r) => r.json());
      if (d.post) {
        setPosts((p) => [d.post, ...(p ?? [])]);
        setText("");
        pick(null);
        if (fileInput.current) fileInput.current.value = "";
      } else if (d.error) {
        alert(`Couldn't post: ${d.error}`);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-[680px] px-[22px] pb-6 pt-[max(20px,env(safe-area-inset-top))] md:px-8 md:pt-10">
      <div className="flex items-center gap-2">
        <ChatIcon className="h-6 w-6 text-accent" />
        <h1 className="text-[24px] font-extrabold tracking-tight text-text md:text-[26px]">Lounge</h1>
      </div>
      <p className="mt-1 text-[13px] text-text2">
        The group chat. Drop takes, screenshots, panels — everyone signed in can see it.
      </p>

      {error === "not_configured" && (
        <div className="mt-8 rounded-[14px] bg-surface p-5 text-[14px] text-text2 ring-1 ring-hair">
          The Lounge isn&apos;t set up yet. Add <code className="text-accent">SUPABASE_URL</code> and{" "}
          <code className="text-accent">SUPABASE_SERVICE_KEY</code> to the env, create the{" "}
          <code className="text-accent">lounge_posts</code> table and a public{" "}
          <code className="text-accent">lounge</code> storage bucket, then reload.
        </div>
      )}

      {error !== "not_configured" && (
        <>
          {/* composer */}
          <div className="mt-5 rounded-[16px] bg-surface2 p-3.5 ring-1 ring-hair">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
              }}
              rows={2}
              placeholder="What are you watching? (Ctrl+Enter to post)"
              className="w-full resize-none bg-transparent text-[14px] text-text placeholder:text-muted outline-none"
            />
            {preview && (
              <div className="relative mt-2 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="" className="max-h-48 rounded-[12px]" />
                <button
                  onClick={() => pick(null)}
                  className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between">
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={(e) => pick(e.target.files?.[0] ?? null)}
              />
              <button
                onClick={() => fileInput.current?.click()}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-muted transition hover:text-accent"
              >
                <ImageIcon className="h-5 w-5" /> Image
              </button>
              <button
                onClick={send}
                disabled={sending || (!text.trim() && !file)}
                className="rounded-full bg-accent px-5 py-2 text-[13px] font-bold text-accent-ink transition disabled:opacity-40"
              >
                {sending ? "Posting…" : "Post"}
              </button>
            </div>
          </div>

          {/* feed */}
          <div className="mt-6 flex flex-col gap-4">
            {!posts &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-[16px] bg-surface" />
              ))}
            {posts?.length === 0 && !error && (
              <p className="py-12 text-center text-[14px] text-muted">
                Nothing here yet. Start the conversation.
              </p>
            )}
            {posts?.map((p, i) => (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3), type: "spring", stiffness: 220, damping: 24 }}
                className="rounded-[16px] bg-surface2 p-4 ring-1 ring-hair"
              >
                <div className="flex items-center gap-2.5">
                  {p.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-accent/40" />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-[13px] font-extrabold text-accent-ink">
                      {p.author.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="text-[13px] font-bold text-text">{p.author}</span>
                  <span className="text-[11px] text-muted">· {timeAgo(p.created_at)}</span>
                </div>
                {p.text && <p className="mt-2.5 whitespace-pre-wrap text-[14px] leading-[1.5] text-text2">{p.text}</p>}
                {p.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt="" loading="lazy" className="mt-3 max-h-[420px] rounded-[12px]" />
                )}
              </motion.article>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
