import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hikari",
    short_name: "Hikari",
    description: "Anime, your way.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0e17",
    theme_color: "#0a0e17",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
