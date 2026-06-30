// Tiny password gate. Cookie holds sha256(SITE_PASSWORD); middleware compares.
// Web Crypto so it runs in both the edge middleware and node routes.

export const AUTH_COOKIE = "hikari_auth";

export async function tokenFor(password: string): Promise<string> {
  const data = new TextEncoder().encode(`hikari:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Expected cookie value for the configured password, or null if gate is off. */
export async function expectedToken(): Promise<string | null> {
  const pw = process.env.SITE_PASSWORD;
  if (!pw) return null; // no password set => gate disabled (dev)
  return tokenFor(pw);
}
