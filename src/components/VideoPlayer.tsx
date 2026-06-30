"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  ChevronLeft,
  ForwardIcon,
  FullscreenIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RewindIcon,
  SettingsIcon,
  VolumeIcon,
  VolumeMuteIcon,
} from "./icons";

export interface QualityOption {
  label: string;
  active: boolean;
  select: () => void;
}

export interface SkipInterval {
  type: string; // "op" | "ed"
  start: number;
  end: number;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface VideoPlayerProps {
  src: string; // already proxied
  isM3u8: boolean;
  title: string;
  subtitle: string;
  qualities: QualityOption[];
  skips?: SkipInterval[];
  onBack: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onTimeUpdate?: (current: number, duration: number) => void;
}

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({
  src,
  isM3u8,
  title,
  subtitle,
  qualities,
  skips = [],
  onBack,
  onPrev,
  onNext,
  onTimeUpdate,
}: VideoPlayerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [show, setShow] = useState(true);
  const [settings, setSettings] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  // HLS quality ladder (1080/720/480…) parsed from the stream
  const [levels, setLevels] = useState<{ i: number; height: number }[]>([]);
  const [curLevel, setCurLevel] = useState(-1); // -1 = Auto

  const pickLevel = (i: number) => {
    const h = hlsRef.current;
    if (!h) return;
    h.currentLevel = i;
    setCurLevel(i);
  };

  const applyVolume = (v: number) => {
    const vid = videoRef.current;
    if (vid) {
      vid.volume = v;
      vid.muted = v === 0;
    }
    setVolume(v);
    setMuted(v === 0);
  };
  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const next = !muted;
    vid.muted = next;
    setMuted(next);
    reveal();
  };

  // active skip interval (intro/outro) at the current time
  const activeSkip = skips.find((s) => cur >= s.start && cur < s.end - 0.3);

  // ── load source ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setLevels([]);
    setCurLevel(-1);
    let hls: Hls | null = null;
    if (isM3u8 && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const ls = hls!.levels
          .map((l, i) => ({ i, height: l.height || 0 }))
          .filter((l) => l.height > 0)
          .sort((a, b) => b.height - a.height);
        setLevels(ls);
        setCurLevel(-1);
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, d) => {
        setCurLevel(hls!.autoLevelEnabled ? -1 : d.level);
      });
    } else {
      video.src = src;
    }
    return () => {
      hls?.destroy();
      hlsRef.current = null;
      video.removeAttribute("src");
      video.load();
    };
  }, [src, isM3u8]);

  // ── auto-hide controls ──
  const armHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setShow(false);
    }, 3000);
  }, []);

  const reveal = useCallback(() => {
    setShow(true);
    armHide();
  }, [armHide]);

  useEffect(() => {
    armHide();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [armHide]);

  // ── transport ──
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
    reveal();
  }, [reveal]);

  const skip = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
    reveal();
  };

  const seek = (frac: number) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    v.currentTime = frac * v.duration;
  };

  const toggleFullscreen = () => {
    const wrap = wrapRef.current;
    const v = videoRef.current as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    };
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (wrap?.requestFullscreen) {
      wrap.requestFullscreen().catch(() => {});
    } else if (v?.webkitEnterFullscreen) {
      v.webkitEnterFullscreen(); // iOS native fullscreen
    }
    reveal();
  };

  // ── keyboard shortcuts ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      const v = videoRef.current;
      if (!v) return;
      const setVol = (val: number) => applyVolume(Math.max(0, Math.min(1, +val.toFixed(2))));
      const cycleSpeed = (dir: number) => {
        const i = SPEEDS.indexOf(speed);
        const ni = Math.max(0, Math.min(SPEEDS.length - 1, (i < 0 ? 2 : i) + dir));
        v.playbackRate = SPEEDS[ni];
        setSpeed(SPEEDS[ni]);
      };
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          if (v.paused) v.play().catch(() => {});
          else v.pause();
          reveal();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "ArrowLeft":
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 5);
          reveal();
          break;
        case "ArrowRight":
          e.preventDefault();
          v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
          reveal();
          break;
        case "j":
          v.currentTime = Math.max(0, v.currentTime - 10);
          reveal();
          break;
        case "l":
          v.currentTime = Math.min(v.duration || 0, v.currentTime + 10);
          reveal();
          break;
        case "ArrowUp":
          e.preventDefault();
          setVol((muted ? 0 : v.volume) + 0.1);
          reveal();
          break;
        case "ArrowDown":
          e.preventDefault();
          setVol((muted ? 0 : v.volume) - 0.1);
          reveal();
          break;
        case "m":
          v.muted = !v.muted;
          setMuted(v.muted);
          reveal();
          break;
        case "n":
          onNext?.();
          break;
        case "p":
          onPrev?.();
          break;
        case ">":
        case ".":
          cycleSpeed(1);
          reveal();
          break;
        case "<":
        case ",":
          cycleSpeed(-1);
          reveal();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNext, onPrev, speed, muted]);

  // tap on backdrop toggles controls
  const onBackdrop = () => (show ? setShow(false) : reveal());

  return (
    <div
      ref={wrapRef}
      className={`absolute inset-0 bg-black ${show ? "" : "cursor-none"}`}
      onMouseMove={reveal}
    >
      {/* video */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        className="h-full w-full object-contain"
        onClick={onBackdrop}
        onPlay={() => {
          setPlaying(true);
          armHide();
        }}
        onPause={() => {
          setPlaying(false);
          setShow(true);
        }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onCanPlay={() => setWaiting(false)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          setCur(v.currentTime);
          setDur(v.duration || 0);
          onTimeUpdate?.(v.currentTime, v.duration || 0);
        }}
      />

      {/* buffering spinner */}
      {waiting && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-accent" />
        </div>
      )}

      {/* controls layer */}
      <div
        className={`absolute inset-0 transition-opacity duration-200 ${
          show ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* top bar */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/75 to-transparent p-3 pt-[max(12px,env(safe-area-inset-top))]">
          <button onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 px-3 text-center">
            <p className="line-clamp-1 text-[13px] font-semibold text-white">{title}</p>
            <p className="text-[11px] text-white/60">{subtitle}</p>
          </div>
          <div className="relative flex items-center gap-1">
            <button
              onClick={() => setSettings((s) => !s)}
              className="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white"
              title="Settings"
            >
              <SettingsIcon className="h-5 w-5" />
            </button>
            {settings && (
              <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-[12px] bg-neutral-900/95 p-1 text-[13px] ring-1 ring-white/10 backdrop-blur">
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Quality</p>
                {levels.length > 0 ? (
                  <>
                    <button
                      onClick={() => pickLevel(-1)}
                      className="block w-full rounded-md px-3 py-1.5 text-left hover:bg-white/5"
                      style={{ color: curLevel === -1 ? "var(--color-accent)" : "#fff" }}
                    >
                      Auto
                    </button>
                    {levels.map((l) => (
                      <button
                        key={l.i}
                        onClick={() => pickLevel(l.i)}
                        className="block w-full rounded-md px-3 py-1.5 text-left hover:bg-white/5"
                        style={{ color: curLevel === l.i ? "var(--color-accent)" : "#fff" }}
                      >
                        {l.height}p
                      </button>
                    ))}
                  </>
                ) : qualities.length ? (
                  qualities.map((q, i) => (
                    <button
                      key={`${q.label}-${i}`}
                      onClick={() => { q.select(); setSettings(false); }}
                      className="block w-full rounded-md px-3 py-1.5 text-left hover:bg-white/5"
                      style={{ color: q.active ? "var(--color-accent)" : "#fff" }}
                    >
                      {q.label}
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-1.5 text-white/40">—</p>
                )}
                {/* source switch (when HLS exposes levels but multiple sources exist) */}
                {levels.length > 0 && qualities.length > 1 && (
                  <>
                    <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-white/40">Source</p>
                    {qualities.map((q, i) => (
                      <button
                        key={`src-${i}`}
                        onClick={() => { q.select(); setSettings(false); }}
                        className="block w-full rounded-md px-3 py-1.5 text-left hover:bg-white/5"
                        style={{ color: q.active ? "var(--color-accent)" : "#fff" }}
                      >
                        {q.label}
                      </button>
                    ))}
                  </>
                )}
                <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-white/40">Speed</p>
                <div className="flex flex-wrap gap-1 px-2 pb-2">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        if (videoRef.current) videoRef.current.playbackRate = s;
                        setSpeed(s);
                      }}
                      className="rounded-md px-2 py-1 text-[12px] font-semibold"
                      style={
                        s === speed
                          ? { background: "var(--color-accent)", color: "var(--color-accent-ink)" }
                          : { background: "rgba(255,255,255,.08)", color: "#fff" }
                      }
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* center transport: -10 / play / +10 */}
        <div className="absolute inset-0 flex items-center justify-center gap-8 md:gap-10" onClick={onBackdrop}>
          <button
            onClick={(e) => { e.stopPropagation(); skip(-10); }}
            className="relative grid h-12 w-12 place-items-center text-white"
            title="Back 10s"
          >
            <RewindIcon className="h-9 w-9" />
            <span className="absolute text-[9px] font-bold">10</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="grid h-[70px] w-[70px] place-items-center rounded-full bg-white/15 text-white backdrop-blur"
          >
            {playing ? <PauseIcon className="h-8 w-8" /> : <PlayIcon className="h-8 w-8" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); skip(10); }}
            className="relative grid h-12 w-12 place-items-center text-white"
            title="Forward 10s"
          >
            <ForwardIcon className="h-9 w-9" />
            <span className="absolute text-[9px] font-bold">10</span>
          </button>
        </div>

        {/* skip intro / outro (AniSkip) */}
        {activeSkip && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const v = videoRef.current;
              if (v) v.currentTime = activeSkip.end;
              reveal();
            }}
            className="absolute bottom-28 right-4 rounded-[10px] bg-accent px-4 py-2 text-[14px] font-bold text-accent-ink shadow-[0_10px_26px_rgba(6,214,160,.35)]"
          >
            Skip {activeSkip.type === "ed" ? "Outro" : "Intro"}
          </button>
        )}

        {/* bottom bar */}
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-8">
          <div className="flex items-center gap-3">
            <span className="text-[11px] tabular-nums text-white/80">{fmt(cur)}</span>
            <input
              type="range"
              min={0}
              max={1000}
              value={dur ? (cur / dur) * 1000 : 0}
              onChange={(e) => seek(Number(e.target.value) / 1000)}
              onInput={reveal}
              className="hikari-range h-1 flex-1 cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--color-accent) ${
                  dur ? (cur / dur) * 100 : 0
                }%, rgba(255,255,255,.25) ${dur ? (cur / dur) * 100 : 0}%)`,
              }}
            />
            <span className="text-[11px] tabular-nums text-white/80">{fmt(dur)}</span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            {/* volume */}
            <div className="flex items-center gap-1.5">
              <button onClick={toggleMute} className="grid h-8 w-8 place-items-center text-white" title="Mute">
                {muted || volume === 0 ? <VolumeMuteIcon className="h-5 w-5" /> : <VolumeIcon className="h-5 w-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((muted ? 0 : volume) * 100)}
                onChange={(e) => applyVolume(Number(e.target.value) / 100)}
                className="hikari-range hidden h-1 w-24 cursor-pointer sm:block"
                style={{
                  background: `linear-gradient(to right, var(--color-accent) ${
                    (muted ? 0 : volume) * 100
                  }%, rgba(255,255,255,.25) ${(muted ? 0 : volume) * 100}%)`,
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              {onPrev && (
                <button
                  onClick={onPrev}
                  className="flex items-center gap-1.5 rounded-[8px] bg-white/10 px-2.5 py-1 text-[12px] font-semibold text-white"
                >
                  <PrevIcon className="h-3.5 w-3.5" /> Prev
                </button>
              )}
              {onNext && (
                <button
                  onClick={onNext}
                  className="flex items-center gap-1.5 rounded-[8px] bg-white/10 px-3 py-1 text-[12px] font-semibold text-white"
                >
                  Next Ep <NextIcon className="h-3.5 w-3.5" />
                </button>
              )}
              <button onClick={toggleFullscreen} className="grid h-9 w-9 place-items-center rounded-full text-white">
                <FullscreenIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
