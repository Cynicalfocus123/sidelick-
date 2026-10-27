"use client";

import { useMemo, useState } from "react";
import { compact, creatorById, creators, posts, TONES, type Post } from "@/lib/sample-data";
import Icon from "./Icon";
import { Avatar, CreatorLink } from "./parts";
import { CreatorRow } from "./Rows";

function PostCard({ post, onSoon, promoted = false }: { post: Post; onSoon: (label: string) => void; promoted?: boolean }) {
  const c = creatorById.get(post.creatorId)!;
  const [liked, setLiked] = useState(false);
  const locked = post.kind !== "free";
  return (
    <article data-testid="post" data-creator={c.id} className="grid content-start gap-2.5 rounded-2xl border border-border bg-surface p-3">
      {promoted ? <span className="text-xs text-muted">Promoted</span> : null}
      <CreatorLink creator={c} className="flex min-w-0 items-center gap-2.5">
        <Avatar creator={c} />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{c.name}</span>
          <span className="block truncate text-xs text-muted">@{c.handle} · {post.ageHours < 24 ? `${post.ageHours || 1}h` : `${Math.floor(post.ageHours / 24)}d`}</span>
        </span>
      </CreatorLink>
      <div
        className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-xl"
        style={{ background: locked ? `repeating-linear-gradient(45deg, ${TONES[post.tone]}, ${TONES[post.tone]} 10px, #e4e4e7 10px, #e4e4e7 20px)` : TONES[post.tone] }}
      >
        {post.photos > 1 && !locked ? <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white">1/{post.photos}</span> : null}
        {locked ? (
          <button type="button" onClick={() => onSoon(post.kind === "paid" ? "Unlock post" : "Subscribe")} className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">
            <Icon name="lock" className="h-4 w-4" />
            {post.kind === "paid" ? `Unlock $${post.price}` : "Subscribe to see"}
          </button>
        ) : (
          <span className="text-sm text-muted">Photo / video</span>
        )}
      </div>
      {promoted ? (
        <CreatorLink creator={c} className="justify-self-start rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">
          View profile
        </CreatorLink>
      ) : (
        <div className="flex items-center gap-1 text-muted">
          <button type="button" aria-label="Like" aria-pressed={liked} onClick={() => setLiked(!liked)} className={`grid h-9 w-9 place-items-center rounded-full hover:bg-bg ${liked ? "text-bad" : ""}`}>
            <Icon name="heart" filled={liked} />
          </button>
          <button type="button" aria-label="Comment" onClick={() => onSoon("Comments")} className="grid h-9 w-9 place-items-center rounded-full hover:bg-bg">
            <Icon name="comment" />
          </button>
          <button type="button" aria-label="Tip" onClick={() => onSoon("Tips")} className="grid h-9 w-9 place-items-center rounded-full hover:bg-bg">
            <Icon name="dollar" />
          </button>
          <span className="ml-auto text-xs">
            {compact(post.likes + (liked ? 1 : 0))} likes · {post.comments} comments
          </span>
        </div>
      )}
    </article>
  );
}

// Subscribed tab: only posts from creators the fan subscribes to / follows, newest first.
export default function SubscribedFeed({ followingIds, onFollow, onDiscover, onSoon }: { followingIds: Set<string>; onFollow: (id: string) => void; onDiscover: () => void; onSoon: (label: string) => void }) {
  const feed = useMemo(() => posts.filter((p) => followingIds.has(p.creatorId)).sort((a, b) => a.ageHours - b.ageHours), [followingIds]);
  const suggestions = useMemo(() => creators.filter((c) => !followingIds.has(c.id)).slice(10, 18), [followingIds]);
  const promoted = posts.find((p) => p.creatorId === "c30" && p.kind === "free")!;

  if (!feed.length) {
    return (
      <section data-testid="subscribed-empty" className="grid justify-items-center gap-3 rounded-3xl border border-border bg-surface px-4 py-10 text-center sm:py-14">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-bg text-muted">
          <Icon name="star" className="h-6 w-6" />
        </span>
        <h2 className="text-2xl font-semibold sm:text-3xl desk:text-4xl">No subscriptions yet</h2>
        <p className="text-muted">Creators you subscribe to or follow show up here.</p>
        <button type="button" onClick={onDiscover} className="h-11 rounded-full bg-accent px-7 font-semibold text-white">
          Go to Discover
        </button>
      </section>
    );
  }

  const first = feed.slice(0, 6);
  const rest = feed.slice(6);
  return (
    <div data-testid="subscribed-feed" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4.5 desk:grid-cols-3 desk:gap-6">
      {first.map((p) => (
        <PostCard key={p.id} post={p} onSoon={onSoon} />
      ))}
      <div className="col-span-full">
        <CreatorRow title="Creators you might like" items={suggestions} followingIds={followingIds} onFollow={onFollow} />
      </div>
      {promoted ? <PostCard post={promoted} onSoon={onSoon} promoted /> : null}
      {rest.map((p) => (
        <PostCard key={p.id} post={p} onSoon={onSoon} />
      ))}
      <div className="col-span-full flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-4">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-bg text-muted">
          <Icon name="gift" />
        </span>
        <span className="min-w-[180px] flex-1">
          <b className="block">Know a creator? Earn 5%</b>
          <span className="text-sm text-muted">Share your link - you earn when they earn</span>
        </span>
        <button type="button" onClick={() => onSoon("Refer & Earn")} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">
          Get my link
        </button>
      </div>
    </div>
  );
}
