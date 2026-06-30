/**
 * Standalone Phase-1 proof. No UI, no Next.
 *   npx tsx scripts/test-allanime.ts "frieren"
 * Walks: search -> episodes -> sources -> resolved stream links.
 */
import {
  searchAnime,
  listEpisodes,
  getSources,
  getEpisodeStreams,
} from "../src/lib/allanime/client";

const mode = "sub" as const;

async function main() {
  const query = process.argv[2] ?? "frieren";
  console.log(`\n[1] search "${query}" (${mode})`);
  const results = await searchAnime(query, mode);
  if (!results.length) throw new Error("no search results");
  for (const r of results.slice(0, 5)) {
    console.log(`    ${r.id}  ${r.name}  eps=${JSON.stringify(r.availableEpisodes)}`);
  }

  const show = results[0];
  console.log(`\n[2] episodes for "${show.name}" (${show.id})`);
  const eps = await listEpisodes(show.id);
  console.log(`    sub=${eps.sub.length} dub=${eps.dub.length} raw=${eps.raw.length}`);
  console.log(`    first sub eps: ${eps.sub.slice(0, 8).join(", ")}`);

  const epNo = eps.sub[0] ?? "1";
  console.log(`\n[3] sources for episode ${epNo}`);
  const sources = await getSources(show.id, epNo, mode);
  for (const s of sources) {
    console.log(`    [${s.priority}] ${s.name.padEnd(10)} ${s.url.slice(0, 70)}`);
  }

  console.log(`\n[4] resolved stream links for episode ${epNo}`);
  const streams = await getEpisodeStreams(show.id, epNo, mode);
  for (const { source, links } of streams) {
    for (const l of links) {
      console.log(
        `    ${source.name.padEnd(10)} ${l.quality.padEnd(6)} ${l.isM3u8 ? "HLS" : "MP4"}  ${l.url.slice(0, 80)}`,
      );
    }
  }

  if (!streams.length) throw new Error("FAIL: no playable links resolved");
  console.log(`\nOK — ${streams.reduce((n, s) => n + s.links.length, 0)} link(s) resolved.\n`);
}

main().catch((e) => {
  console.error("\nERROR:", e);
  process.exit(1);
});
