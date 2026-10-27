// Small shared pieces for the home page.
import Link from "next/link";
import { TONES, type Creator } from "@/lib/sample-data";

export function Avatar({ creator, size = "h-9 w-9", ring = "" }: { creator: Creator; size?: string; ring?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-muted ${size} ${ring}`}
      style={{ background: TONES[creator.tone] }}
    >
      {creator.name[0]}
    </span>
  );
}

// Tap avatar / name = creator profile.
export function CreatorLink({ creator, className = "", children }: { creator: Creator; className?: string; children: React.ReactNode }) {
  return (
    <Link href={`/c/${creator.handle}`} className={className} data-testid="creator-link">
      {children}
    </Link>
  );
}

export function ArrowButton({ dir, onClick, label }: { dir: "left" | "right"; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-text hover:bg-bg"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
