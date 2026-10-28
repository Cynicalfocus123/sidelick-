// Simple line icons for the home page (not a logo - rule 12 is about the brand logo only).
const PATHS: Record<string, string> = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm10 17l-5-5",
  messages: "M4 5h16v11H8l-4 4z",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zm4 4h4",
  plus: "M12 5v14M5 12h14",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  wallet: "M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm0 0l13-3v3m1 7h.01",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 10a7 7 0 0 1 14 0m1-10a3 3 0 1 0 0-6m5 16a6 6 0 0 0-4-5.7",
  bookmark: "M6 3h12v18l-6-4-6 4z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  megaphone: "M3 10v4h4l8 5V5L7 10zm15-2a5 5 0 0 1 0 8",
  gift: "M3 8h18v4H3zm2 4h14v9H5zm7-4v13M12 8S10 3 7.5 4.5 9 8 12 8zm0 0s2-5 4.5-3.5S15 8 12 8z",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8-3l2-1-2-4-2 .5-1.5-1.2L16 4h-4l-.5 2.3L10 7.5 8 7 6 11l2 1-2 1 2 4 2-.5 1.5 1.2.5 2.3h4l.5-2.3 1.5-1.2 2 .5 2-4z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  play: "M8 5v14l11-7z",
  heart: "M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z",
  comment: "M4 5h16v11H9l-5 4z",
  dollar: "M12 3v18m4-14H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H7",
  lock: "M6 11h12v10H6zm2 0V8a4 4 0 0 1 8 0v3",
  left: "M15 5l-7 7 7 7",
  right: "M9 5l7 7-7 7",
  up: "M5 15l7-7 7 7",
  close: "M6 6l12 12M18 6L6 18",
  coins: "M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.5 3.7 5.5 3.7 9s-1.2 6.5-3.7 9M12 3C9.5 5.5 8.3 8.5 8.3 12s1.2 6.5 3.7 9",
  chart: "M5 20V10m5 10V5m5 15v-8m5 8V8M3 20h18",
  pie: "M12 3a9 9 0 1 0 9 9h-9zm3-0.5V9h6.5A7 7 0 0 0 15 2.5z",
  check: "M4 12.5l5 5L20 6.5",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
};

export type IconName = keyof typeof PATHS;

export default function Icon({ name, className = "h-5 w-5", filled = false }: { name: IconName; className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}
