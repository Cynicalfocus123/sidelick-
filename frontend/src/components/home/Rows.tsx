"use client";

import { useRef } from "react";
import { compact, creatorById, posts, TONES, type Creator, type Video } from "@/lib/sample-data";
import Icon from "./Icon";
import { ArrowButton, Avatar, CreatorLink } from "./parts";

// item widths per size: phone ~2.4, tablet ~3.3, laptop ~4.4, desktop ~6.4 videos visible
const VIDEO_W = "w-[42%] sm:w-[30%] lg:w-[22.5%] desk:w-[15.5%]";
const CREATOR_W = "w-[78%] sm:w-[46%] lg:w-[31%] desk:w-[23.5%]";

function useRowScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const by = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.9, behavior: "smooth" });
  return { ref, by };
}

function RowHead({ title, by }: { title: string; by: (d: 1 | -1) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
      <div className="hidden gap-2 lg:flex">
        <ArrowButton dir="left" label={`Scroll ${title} left`} onClick={() => by(-1)} />
        <ArrowButton dir="right" label={`Scroll ${title} right`} onClick={() => by(1)} />
      </div>
    </div>
  );
}

export function VideoTile({ video }: { video: Video }) {
  const c = creatorById.get(video.creatorId)!;
  return (
    <div data-testid="video" data-video={video.id} data-creator={c.id} className={`relative aspect-[9/16] shrink-0 snap-start overflow-hidden rounded-2xl ${VIDEO_W}`} style={{ background: TONES[video.tone] }}>
      <button type="button" aria-label={`Play video by ${c.name}`} className="absolute inset-0 grid place-items-center text-white/90">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-black/30">
          <Icon name="play" className="h-6 w-6" filled />
        </span>
      </button>
      <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white">{compact(video.views)} views</span>
      <CreatorLink creator={c} className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-full bg-surface/95 p-1 pr-3 text-xs hover:bg-surface">
        <Avatar creator={c} size="h-7 w-7 text-xs" />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{c.name}</span>
          <span className="block truncate text-[10px] text-muted">@{c.handle}</span>
        </span>
      </CreatorLink>
    </div>
  );
}

export function VideoRow({ title, items, onNearEnd, testId }: { title: string; items: Video[]; onNearEnd: () => void; testId: string }) {
  const { ref, by } = useRowScroll();
  // keeps loading sideways: near the right end, ask for more (new creators only)
  const onScroll = () => {
    const el = ref.current;
    if (el && el.scrollLeft + el.clientWidth > el.scrollWidth - el.clientWidth * 0.5) onNearEnd();
  };
  return (
    <section data-testid={testId} className="grid min-w-0 gap-3 rounded-2xl border border-border bg-surface p-3 sm:p-4">
      <RowHead title={title} by={by} />
      <div ref={ref} onScroll={onScroll} className="no-scrollbar flex snap-x gap-2.5 overflow-x-auto sm:gap-3.5 desk:gap-4">
        {items.map((v) => (
          <VideoTile key={v.id} video={v} />
        ))}
      </div>
    </section>
  );
}

export function CreatorCard({ creator, following, onFollow }: { creator: Creator; following: boolean; onFollow: (id: string) => void }) {
  const peek = posts.filter((p) => p.creatorId === creator.id).slice(0, 3);
  return (
    <div data-testid="creator-card" data-creator={creator.id} className={`grid shrink-0 snap-start gap-2.5 rounded-2xl border border-border bg-bg p-3 ${CREATOR_W}`}>
      <CreatorLink creator={creator} className="flex min-w-0 items-center gap-2.5">
        <Avatar creator={creator} size="h-11 w-11" ring="ring-2 ring-accent/40" />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{creator.name}</span>
          <span className="block truncate text-xs text-muted">@{creator.handle} · {compact(creator.fans)} fans</span>
        </span>
      </CreatorLink>
      <div className="grid grid-cols-3 gap-1.5">
        {peek.map((p) => (
          <div key={p.id} className="relative grid aspect-[3/4] place-items-center rounded-lg text-white/90" style={{ background: TONES[p.tone] }}>
            {p.kind === "free" ? <Icon name="play" className="h-4 w-4" filled /> : <Icon name="lock" className="h-4 w-4 text-muted" />}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onFollow(creator.id)}
        className={`h-9 justify-self-start rounded-full px-4 text-sm font-semibold ${following ? "border border-border bg-surface text-text" : "bg-accent text-white"}`}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

export function CreatorRow({ title, items, followingIds, onFollow }: { title: string; items: Creator[]; followingIds: Set<string>; onFollow: (id: string) => void }) {
  const { ref, by } = useRowScroll();
  if (!items.length) return null;
  return (
    <section data-testid="creator-row" className="grid min-w-0 gap-3 rounded-2xl border border-border bg-surface p-3 sm:p-4">
      <RowHead title={title} by={by} />
      <div ref={ref} className="no-scrollbar flex snap-x gap-2.5 overflow-x-auto sm:gap-3.5 desk:gap-4">
        {items.map((c) => (
          <CreatorCard key={c.id} creator={c} following={followingIds.has(c.id)} onFollow={onFollow} />
        ))}
      </div>
    </section>
  );
}

// grey tiles while the next rows load, so a row never looks cut off
export function PlaceholderRow() {
  return (
    <div data-testid="placeholder-row" aria-hidden="true" className="grid min-w-0 gap-3 rounded-2xl border border-border bg-surface p-3 sm:p-4">
      <div className="h-5 w-40 rounded bg-border/70" />
      <div className="flex gap-2.5 overflow-hidden sm:gap-3.5 desk:gap-4">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className={`aspect-[9/16] shrink-0 animate-pulse rounded-2xl bg-border/60 ${VIDEO_W}`} />
        ))}
      </div>
    </div>
  );
}
