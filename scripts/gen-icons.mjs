import sharp from "sharp";
import { mkdirSync } from "node:fs";
mkdirSync("public/icons", { recursive: true });

// Hikari mark: navy bg, mint rounded square, ink dot. SVG -> PNG.
function svg(size, maskable) {
  const pad = maskable ? size * 0.18 : size * 0.12; // safe zone for maskable
  const m = size - pad * 2;          // mark size
  const r = m * 0.28;                // mark corner radius
  const dot = m * 0.16;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#0A0E17"/>
  <rect x="${pad}" y="${pad}" width="${m}" height="${m}" rx="${r}" fill="#06D6A0"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${dot}" fill="#04140F"/>
</svg>`;
}

const jobs = [
  ["public/icons/icon-192.png", 192, false],
  ["public/icons/icon-512.png", 512, false],
  ["public/icons/maskable-512.png", 512, true],
  ["public/apple-touch-icon.png", 180, false],
];
for (const [out, size, mask] of jobs) {
  await sharp(Buffer.from(svg(size, mask))).png().toFile(out);
  console.log("wrote", out);
}
