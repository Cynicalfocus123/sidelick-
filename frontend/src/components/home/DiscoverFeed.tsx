"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DiscoverEngine, type DiscoverPage } from "@/lib/discover";
import { CreatorRow, PlaceholderRow, VideoRow } from "./Rows";

const VIDEO_TITLES = ["Discover", "More to discover"];
const CREATOR_TITLES = ["Creators you may like", "More creators you may like"];
const LOAD_DELAY_MS = 350; // sample data is instant; mimics the network so the placeholders are visible

// Discover tab: video row -> "Creators you may like" row -> new video row (different creators) -> ...
// Continuous scroll: the next block loads by itself 1.5 screens before the bottom (owner 2026-10-28).
export default function DiscoverFeed({ followingIds, onFollow, onSubscribedTab }: { followingIds: Set<string>; onFollow: (id: string) => void; onSubscribedTab: () => void }) {
  const engine = useRef<DiscoverEngine | null>(null);
  const loading = useRef(false);
  const [pages, setPages] = useState<DiscoverPage[]>([]);
  const [busy, setBusy] = useState(true);
  const [caughtUp, setCaughtUp] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadNext = useCallback(() => {
    if (loading.current || !engine.current) return;
    loading.current = true;
    setBusy(true);
    setTimeout(() => {
      const page = engine.current!.nextPage();
      if (page.videos.length) setPages((p) => [...p, page]);
      else setCaughtUp(true);
      loading.current = false;
      setBusy(false);
    }, LOAD_DELAY_MS);
  }, []);

  // made in the browser only (random mix per visit)
  useEffect(() => {
    engine.current = new DiscoverEngine(new Set(followingIds));
    loadNext();
    // followingIds is read once here; later changes go through setFollowing below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadNext]);

  useEffect(() => {
    engine.current?.setFollowing(new Set(followingIds));
  }, [followingIds]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || caughtUp) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && loadNext(), { rootMargin: "0px 0px 150% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadNext, caughtUp, pages.length]);

  const moreSideways = (index: number) => {
    const row = pages.find((p) => p.index === index);
    if (!row || !engine.current || row.videos.length >= 48) return;
    const more = engine.current.moreForRow(index, row.videos.map((v) => v.creatorId));
    if (more.length) setPages((all) => all.map((p) => (p.index === index ? { ...p, videos: [...p.videos, ...more] } : p)));
  };

  return (
    <div data-testid="discover-feed" className="grid gap-3.5 sm:gap-4.5 lg:gap-5 desk:gap-6">
      {pages.map((p) => (
        <div key={p.index} className="contents">
          <VideoRow
            testId="video-row"
            title={VIDEO_TITLES[p.index] ?? "Keep exploring"}
            items={p.videos}
            onNearEnd={() => moreSideways(p.index)}
          />
          <CreatorRow title={CREATOR_TITLES[p.index] ?? "Creators you may like"} items={p.creators} followingIds={followingIds} onFollow={onFollow} />
        </div>
      ))}
      {busy ? <PlaceholderRow /> : null}
      {caughtUp ? (
        <div className="grid justify-items-center gap-2 rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="font-semibold">You&apos;re all caught up</p>
          <button type="button" onClick={onSubscribedTab} className="text-sm font-semibold underline">
            See your Subscribed tab
          </button>
        </div>
      ) : null}
      <div ref={sentinel} data-testid="feed-sentinel" className="h-px" />
    </div>
  );
}
