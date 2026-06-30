// Deterministic gradient fallback for posters/key-visuals (design handoff formula).
// Used as the loading/fallback state behind real AllAnime cover art.

function hashIndex(seed: string | number): number {
  if (typeof seed === "number") return seed;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function posterGradient(seed: string | number): string {
  const i = hashIndex(seed);
  const h = (i * 43 + 18) % 360;
  return `linear-gradient(155deg, hsl(${h} 44% 32%), hsl(${(h + 52) % 360} 56% 13%))`;
}

export function heroGradient(seed: string | number): string {
  const i = hashIndex(seed);
  const h = (i * 43 + 18) % 360;
  return `linear-gradient(160deg, hsl(${h} 42% 26%) 0%, hsl(${(h + 52) % 360} 50% 12%) 70%, #0A0E17 100%)`;
}
