import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export const HomeIcon = (p: P) => (
  <svg {...base} {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>
);
export const SearchIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
);
export const BookmarkIcon = (p: P) => (
  <svg {...base} {...p}><path d="M6 4h12v17l-6-4-6 4z" /></svg>
);
export const ChevronLeft = (p: P) => (
  <svg {...base} {...p}><path d="m15 5-7 7 7 7" /></svg>
);
export const ChevronRight = (p: P) => (
  <svg {...base} {...p}><path d="m9 5 7 7-7 7" /></svg>
);
export const PlayIcon = (p: P) => (
  <svg {...base} fill="currentColor" stroke="none" viewBox="0 0 24 24" {...p}><path d="M7 4.5v15l13-7.5z" /></svg>
);
export const PauseIcon = (p: P) => (
  <svg {...base} fill="currentColor" stroke="none" viewBox="0 0 24 24" {...p}><rect x="6" y="4.5" width="4" height="15" rx="1" /><rect x="14" y="4.5" width="4" height="15" rx="1" /></svg>
);
export const PrevIcon = (p: P) => (
  <svg {...base} fill="currentColor" stroke="none" viewBox="0 0 24 24" {...p}><rect x="5" y="5" width="2.5" height="14" rx="1" /><path d="M20 5v14l-11-7z" /></svg>
);
export const NextIcon = (p: P) => (
  <svg {...base} fill="currentColor" stroke="none" viewBox="0 0 24 24" {...p}><rect x="16.5" y="5" width="2.5" height="14" rx="1" /><path d="M4 5v14l11-7z" /></svg>
);
export const CastIcon = (p: P) => (
  <svg {...base} {...p}><path d="M3 18h.01" /><path d="M3 14a7 7 0 0 1 7 7" /><path d="M3 10a11 11 0 0 1 11 11" /><path d="M3 6h18v8" /></svg>
);
export const SubtitlesIcon = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 14h4M14 14h3M7 10h3M13 10h4" /></svg>
);
export const FullscreenIcon = (p: P) => (
  <svg {...base} {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
);
export const SparkleIcon = (p: P) => (
  <svg {...base} fill="currentColor" stroke="none" viewBox="0 0 24 24" {...p}><path d="M12 2.5 13.8 8 19.5 9.8 14 12l-2 5.5L10 12 4.5 9.8 10 8z" /><path d="M18 14.5 18.8 17 21.5 17.8 19 19l-1 2.5L17 19l-2.5-1.2L17 17z" /></svg>
);
export const GridIcon = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
);
export const ShuffleIcon = (p: P) => (
  <svg {...base} {...p}><path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7M16 21h5v-5M14 14l7 7M3 3l6 6" /></svg>
);
export const BarsIcon = (p: P) => (
  <svg {...base} {...p}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base} {...p}><path d="m6 6 12 12M18 6 6 18" /></svg>
);
export const SettingsIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
);
export const RewindIcon = (p: P) => (
  <svg {...base} {...p}><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5" /></svg>
);
export const ForwardIcon = (p: P) => (
  <svg {...base} {...p}><path d="M21 12a9 9 0 1 1-2.6-6.4L21 8" /><path d="M21 3v5h-5" /></svg>
);
export const VolumeIcon = (p: P) => (
  <svg {...base} {...p}><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" /></svg>
);
export const VolumeMuteIcon = (p: P) => (
  <svg {...base} {...p}><path d="M11 5 6 9H3v6h3l5 4z" /><path d="m17 9 5 6M22 9l-5 6" /></svg>
);
export const ListIcon = (p: P) => (
  <svg {...base} {...p}><path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>
);
export const FilmIcon = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4" /></svg>
);
export const TvIcon = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M8 21h8" /></svg>
);
export const StarIcon = (p: P) => (
  <svg {...base} fill="currentColor" stroke="none" viewBox="0 0 24 24" {...p}><path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.8 6.7 19.6l1.1-6L3.4 9.4l6-.8z" /></svg>
);
export const ChatIcon = (p: P) => (
  <svg {...base} {...p}><path d="M21 12a8 8 0 0 1-8 8H4l2.5-2.9A8 8 0 1 1 21 12z" /></svg>
);
export const ImageIcon = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m5 19 5.5-5.5 3 3L17 13l4 4" /></svg>
);
export const ShareIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" /></svg>
);
