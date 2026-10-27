// Discover feed rules (code.md "Discover feed algorithm", B110). Step 1A runs them in the browser on
// sample data; the same rules move to the backend API later. Pure logic, no React.
import { creatorById, creators, videos, type Creator, type Video } from "./sample-data";

export const VIDEO_ROW_SIZE = 12;
export const CREATOR_ROW_SIZE = 8;
const CREATOR_GAP_ROWS = 3; // a creator in a video row is not shown again for the next 3 rows
const DAILY_CAP = 3; // max Discover videos per creator per fan per day
const NEW_CREATOR_DAYS = 14;

export type DiscoverPage = { index: number; videos: Video[]; creators: Creator[] };

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class DiscoverEngine {
  private seen = new Set<string>(); // never shown twice in one session (never loosened)
  private lastRow = new Map<string, number>(); // creator -> last video row index
  private daily = new Map<string, number>(); // creator -> videos shown today
  private suggested = new Set<string>(); // creators already in a "Creators you may like" row
  private rowCount = 0;
  private random: () => number;
  private jitter = new Map<string, number>();

  constructor(
    private following: Set<string>,
    seed = Date.now(),
  ) {
    this.random = rng(seed);
  }

  setFollowing(following: Set<string>) {
    this.following = following;
  }

  private score(v: Video) {
    const c = creatorOf(v);
    const freshness = Math.pow(0.5, v.ageHours / 72); // halves every 3 days
    const quality = 0.5 * v.watchRate + 4 * v.likeRate + 0.1 * Math.log10(v.views + 10);
    const newBoost = c.joinedDaysAgo < NEW_CREATOR_DAYS || c.fans < 500 ? 0.25 : 0;
    if (!this.jitter.has(v.id)) this.jitter.set(v.id, this.random() * 0.15);
    return freshness * quality + newBoost + this.jitter.get(v.id)!;
  }

  /** Picks up to `size` videos for one row, following the repeat rules. */
  private pickVideos(size: number, rowIndex: number, inRow: Set<string>): Video[] {
    const attempt = (gap: number, allowFollowed: boolean) =>
      videos.filter((v) => {
        if (this.seen.has(v.id) || inRow.has(v.creatorId)) return false;
        if (!allowFollowed && this.following.has(v.creatorId)) return false;
        if ((this.daily.get(v.creatorId) ?? 0) >= DAILY_CAP) return false;
        const last = this.lastRow.get(v.creatorId);
        return last === undefined || rowIndex - last > gap;
      });

    // Loosen step by step when the pool runs low (rule 5 - no repeated video - is never loosened).
    let pool = attempt(CREATOR_GAP_ROWS, false);
    if (pool.length < size) pool = attempt(2, false);
    if (pool.length < size) pool = attempt(2, true);

    // best video per creator first (max 1 per creator in a row)
    const best = new Map<string, Video>();
    for (const v of pool.sort((a, b) => this.score(b) - this.score(a))) if (!best.has(v.creatorId)) best.set(v.creatorId, v);
    const ranked = [...best.values()];

    const picked: Video[] = [];
    const take = (v: Video | undefined) => {
      if (v && !picked.includes(v) && picked.length < size) picked.push(v);
    };
    ranked.slice(0, 7).forEach(take); // 7 best
    ranked.filter((v) => isNewCreator(creatorOf(v))).slice(0, 3).forEach(take); // 3 new creators
    const rest = ranked.filter((v) => !picked.includes(v));
    for (let i = 0; i < 2 && rest.length; i++) take(rest.splice(Math.floor(this.random() * rest.length), 1)[0]); // 2 random
    ranked.forEach(take); // fill if a group was short

    // light shuffle: best stay near the left
    picked.sort((a, b) => this.score(b) + this.random() * 0.2 - (this.score(a) + this.random() * 0.2));
    for (const v of picked) {
      this.seen.add(v.id);
      inRow.add(v.creatorId);
      this.lastRow.set(v.creatorId, rowIndex);
      this.daily.set(v.creatorId, (this.daily.get(v.creatorId) ?? 0) + 1);
    }
    return picked;
  }

  /** Next block: one video row + one "Creators you may like" row. Empty videos = all caught up. */
  nextPage(): DiscoverPage {
    const index = this.rowCount++;
    const inRow = new Set<string>();
    const rowVideos = this.pickVideos(VIDEO_ROW_SIZE, index, inRow);

    const rowCreators = creators
      .filter((c) => !inRow.has(c.id) && !this.following.has(c.id) && !this.suggested.has(c.id))
      .map((c) => ({ c, s: (isNewCreator(c) ? 0.3 : 0) + Math.log10(c.fans + 10) / 5 + this.random() * 0.6 }))
      .sort((a, b) => b.s - a.s)
      .slice(0, CREATOR_ROW_SIZE)
      .map((x) => x.c);
    rowCreators.forEach((c) => this.suggested.add(c.id));

    return { index, videos: rowVideos, creators: rowCreators };
  }

  /** Sideways scrolling: more videos for an existing row, new creators only. */
  moreForRow(rowIndex: number, alreadyInRow: string[]): Video[] {
    return this.pickVideos(VIDEO_ROW_SIZE, rowIndex, new Set(alreadyInRow));
  }
}

export function creatorOf(v: Video): Creator {
  return creatorById.get(v.creatorId)!;
}

function isNewCreator(c: Creator) {
  return c.joinedDaysAgo < NEW_CREATOR_DAYS || c.fans < 500;
}
