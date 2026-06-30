# Deploying Hikari

## Vercel (recommended)
1. Push `hikari/` to a GitHub repo.
2. On vercel.com → **Add New Project** → import the repo. Framework auto-detects Next.js.
3. **Settings → Environment Variables**: add `SITE_PASSWORD` = your password. This locks the site to you.
4. Deploy. You get `https://<name>.vercel.app`.
5. On iPhone Safari: open the URL, enter the password once, then **Share → Add to Home Screen** for the fullscreen app.

## Notes
- **No DB** — watch progress + My List live in the browser's localStorage (per device).
- **Bandwidth:** the stream proxy (`/api/proxy`) pushes video bytes through Vercel. Range requests keep this chunked, but heavy binging can hit the hobby-tier ceiling. If it does, move `/api/proxy` to a Cloudflare Worker (same logic, cheaper egress).
- **API drift:** if search/sources break, re-sync `src/lib/allanime/config.ts` (endpoints, persisted-query hash) and `decode.ts` against the current ani-cli source.
- **Private use only.** Keep `SITE_PASSWORD` set so it's not publicly indexed.

## Local dev
```bash
npm run dev        # http://localhost:3000 (gate off when SITE_PASSWORD unset)
npx tsx scripts/test-allanime.ts frieren   # prove the AllAnime client in isolation
```
