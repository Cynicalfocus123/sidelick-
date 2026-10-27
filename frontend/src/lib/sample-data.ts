// SAMPLE data for Step 1A (home page). No real users, uploads or payments exist yet.
// Replaced by the real API later (B110 Discover feed, B40 Subscribed feed). Fixed seed = same data every load.

export type Creator = {
  id: string;
  handle: string;
  name: string;
  joinedDaysAgo: number;
  fans: number;
  tags: string[];
  tone: number; // grey shade for the placeholder picture (no real images yet)
};

export type Video = {
  id: string;
  creatorId: string;
  views: number;
  ageHours: number;
  watchRate: number; // 0..1 share of viewers who watch to the end
  likeRate: number; // likes per view
  tone: number;
};

export type Post = {
  id: string;
  creatorId: string;
  ageHours: number;
  kind: "free" | "subscribers" | "paid";
  price?: number;
  photos: number;
  likes: number;
  comments: number;
  tone: number;
};

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Ava", "Mia", "Luna", "Zoe", "Ivy", "Nora", "Ruby", "Skye", "Jade", "Cleo", "Remy", "Kai", "Nina", "Tess", "Lola", "Vera", "Rose", "Faye", "Leni", "Juno"];
const LAST = ["Rae", "Moon", "Lane", "Fox", "Bloom", "Vale", "Hart", "Wren", "Sol", "Grey"];
const TAGS = ["cosplay", "fitness", "gaming", "music", "fashion", "travel", "art", "comedy", "lifestyle"];

const rand = rng(20261028);

export const creators: Creator[] = Array.from({ length: 80 }, (_, i) => {
  const first = FIRST[i % FIRST.length];
  const last = LAST[Math.floor(i / FIRST.length) % LAST.length];
  return {
    id: `c${i + 1}`,
    handle: `${first}${last}${i + 1}`.toLowerCase(),
    name: `${first} ${last}`,
    joinedDaysAgo: Math.floor(rand() * 400),
    fans: Math.floor(rand() * rand() * 90000) + 40,
    tags: [TAGS[i % TAGS.length], TAGS[(i * 7 + 3) % TAGS.length]],
    tone: Math.floor(rand() * 6),
  };
});

export const creatorById = new Map(creators.map((c) => [c.id, c]));
export const creatorByHandle = new Map(creators.map((c) => [c.handle, c]));

export const videos: Video[] = creators.flatMap((c) =>
  Array.from({ length: 6 }, (_, j) => ({
    id: `${c.id}-v${j + 1}`,
    creatorId: c.id,
    views: Math.floor(rand() * rand() * 60000) + 120,
    ageHours: Math.floor(rand() * 24 * 20),
    watchRate: 0.2 + rand() * 0.7,
    likeRate: rand() * 0.12,
    tone: Math.floor(rand() * 6),
  })),
);

export const posts: Post[] = creators.flatMap((c) =>
  Array.from({ length: 4 }, (_, j): Post => {
    const kind = j === 1 ? "subscribers" : j === 3 ? "paid" : "free";
    return {
      id: `${c.id}-p${j + 1}`,
      creatorId: c.id,
      ageHours: Math.floor(rand() * 24 * 10),
      kind,
      price: kind === "paid" ? 3 + Math.floor(rand() * 8) : undefined,
      photos: 1 + Math.floor(rand() * 4),
      likes: Math.floor(rand() * 900),
      comments: Math.floor(rand() * 60),
      tone: Math.floor(rand() * 6),
    };
  }),
);

// 12 creators "live now" with viewer counts (sample).
export const liveNow = creators
  .slice(40, 52)
  .map((c, i) => ({ creator: c, viewers: [24, 18, 9, 8, 5, 3, 2, 1, 1, 1, 1, 1][i] }));

export function compact(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return String(n);
}

// Placeholder picture shades (neutral greys) until real media exists.
export const TONES = ["#d4d4d8", "#c8c8cf", "#babac3", "#dedee3", "#cfcfd6", "#c2c2ca"];
