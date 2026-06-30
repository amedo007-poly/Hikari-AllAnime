import { createHash, createDecipheriv } from "node:crypto";
import { KEY_SEED } from "./config";

// 2-char hex pair -> character. Ported from ani-cli's provider_init sed table.
const DECODE_TABLE: Record<string, string> = {
  "79": "A", "7a": "B", "7b": "C", "7c": "D", "7d": "E", "7e": "F", "7f": "G",
  "70": "H", "71": "I", "72": "J", "73": "K", "74": "L", "75": "M", "76": "N",
  "77": "O", "68": "P", "69": "Q", "6a": "R", "6b": "S", "6c": "T", "6d": "U",
  "6e": "V", "6f": "W", "60": "X", "61": "Y", "62": "Z", "59": "a", "5a": "b",
  "5b": "c", "5c": "d", "5d": "e", "5e": "f", "5f": "g", "50": "h", "51": "i",
  "52": "j", "53": "k", "54": "l", "55": "m", "56": "n", "57": "o", "48": "p",
  "49": "q", "4a": "r", "4b": "s", "4c": "t", "4d": "u", "4e": "v", "4f": "w",
  "40": "x", "41": "y", "42": "z", "08": "0", "09": "1", "0a": "2", "0b": "3",
  "0c": "4", "0d": "5", "0e": "6", "0f": "7", "00": "8", "01": "9", "15": "-",
  "16": ".", "67": "_", "46": "~", "02": ":", "17": "/", "07": "?", "1b": "#",
  "63": "[", "65": "]", "78": "@", "19": "!", "1c": "$", "1e": "&", "10": "(",
  "11": ")", "12": "*", "13": "+", "14": ",", "03": ";", "05": "=", "1d": "%",
};

/**
 * Decode an obfuscated sourceUrl into an AllAnime path.
 * Obfuscated ids start with "--"; plain ones (e.g. youtube) are returned as-is.
 * After decoding, "/clock" is rewritten to "/clock.json" (the JSON embed endpoint).
 */
export function decodeProviderId(sourceUrl: string): string {
  if (!sourceUrl.startsWith("--")) return sourceUrl;

  const body = sourceUrl.slice(2); // drop the leading "--"
  const pairs = body.match(/../g) ?? [];
  const decoded = pairs.map((p) => DECODE_TABLE[p] ?? "").join("");
  // sed "s/\/clock/\/clock\.json/" — first occurrence only.
  return decoded.replace("/clock", "/clock.json");
}

let cachedKey: Buffer | null = null;
function aesKey(): Buffer {
  if (!cachedKey) cachedKey = createHash("sha256").update(KEY_SEED).digest();
  return cachedKey;
}

/**
 * Mirror of ani-cli's process_response: if the API wrapped its payload in a
 * "tobeparsed" base64 blob, decrypt it (AES-256-CTR). Otherwise return as-is.
 * Layout of the decoded blob: [1 junk byte][12 byte IV][ciphertext][16 trailing bytes].
 * Counter IV = IV || 0x00000002.
 */
export function processResponse(raw: string): string {
  const m = raw.match(/"tobeparsed":"([^"]*)"/);
  if (!m) return raw;

  const buf = Buffer.from(m[1], "base64");
  const iv = buf.subarray(1, 13); // skip 1, take 12
  const ctr = Buffer.concat([iv, Buffer.from([0x00, 0x00, 0x00, 0x02])]);
  const ct = buf.subarray(13, buf.length - 16); // drop trailing 16 bytes

  const decipher = createDecipheriv("aes-256-ctr", aesKey(), ctr);
  decipher.setAutoPadding(false);
  const out = Buffer.concat([decipher.update(ct), decipher.final()]);
  return out.toString("utf8");
}
