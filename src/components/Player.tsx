"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface PlayerProps {
  src: string; // already proxied
  isM3u8: boolean;
  poster?: string;
  onTimeUpdate?: (current: number, duration: number) => void;
}

export default function Player({ src, isM3u8, poster, onTimeUpdate }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (isM3u8 && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      // native HLS (Safari/iOS) or progressive MP4
      video.src = src;
    }

    return () => {
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, isM3u8]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls
      playsInline
      autoPlay
      className="h-full w-full bg-black"
      onTimeUpdate={(e) => {
        const v = e.currentTarget;
        onTimeUpdate?.(v.currentTime, v.duration || 0);
      }}
    />
  );
}
