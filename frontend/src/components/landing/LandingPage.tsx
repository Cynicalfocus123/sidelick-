import Link from "next/link";
import Icon, { type IconName } from "@/components/home/Icon";
import { Avatar } from "@/components/home/parts";
import { compact, creators, TONES, type Creator } from "@/lib/sample-data";
import HeaderVideo from "./HeaderVideo";
import LandingNav from "./LandingNav";
import SoonButton from "./SoonButton";

// Main page "/" for signed-out visitors (F121, approved wireframe v3 + 4 hero boxes).
// Every band is full width; only the inside padding grows: 16 / 32 / 48 / 80 px phone / tablet / laptop / desktop.
// Creators are SAMPLE data until the real creators API exists.
const BAND = "px-4 sm:px-8 lg:px-12 desk:px-20";

const byFans = [...creators].sort((a, b) => b.fans - a.fans);
const popular = byFans.slice(0, 12);
const heroCreators = byFans.slice(12, 16);

const STEPS = [
  { title: "Follow for free", text: "Follow the creators you like and see their free posts and videos." },
  { title: "Subscribe or unlock", text: "Subscribe for everything a creator posts, or unlock single posts and videos." },
  { title: "Chat and tip", text: "Message creators directly, tip to say thanks and join their live streams." },
];

const POINTS: { icon: IconName; text: string }[] = [
  { icon: "coins", text: "Keep more of what you earn" },
  { icon: "chart", text: "Analytics built to grow your income" },
  { icon: "check", text: "Verified fast. Earning faster" },
];

const FOOTER = ["Terms", "Privacy", "Acceptable Use", "Help", "Contact"];

function HeroTile({ creator, index }: { creator: Creator; index: number }) {
  return (
    <div
      data-testid="hero-tile"
      // phone shows 3 boxes, tablet + laptop + desktop 4 (wireframe)
      className={`relative aspect-[3/4] overflow-hidden rounded-2xl ${index === 3 ? "hidden sm:block" : ""}`}
      style={{ background: `linear-gradient(160deg, ${TONES[creator.tone]}, ${TONES[(creator.tone + 3) % TONES.length]})` }}
    >
      <span aria-hidden="true" className="absolute left-1/2 top-[22%] aspect-square w-[38%] -translate-x-1/2 rounded-full bg-white/45" />
      <span aria-hidden="true" className="absolute left-1/2 top-[56%] h-[40%] w-[74%] -translate-x-1/2 rounded-t-[48%] bg-white/35" />
      <span className="absolute inset-x-2 bottom-2 flex items-center gap-1.5 rounded-xl bg-black/45 p-1.5 text-xs font-semibold text-white sm:inset-x-2.5 sm:bottom-2.5 sm:gap-2 sm:p-2 sm:text-sm">
        <Avatar creator={creator} size="h-5 w-5 text-[10px] sm:h-7 sm:w-7 sm:text-xs" />
        <span className="truncate">{creator.name}</span>
      </span>
    </div>
  );
}

function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <article
      data-testid="popular-card"
      className="grid w-[46%] shrink-0 snap-start justify-items-center gap-1.5 rounded-2xl border border-border bg-surface p-2.5 text-center sm:w-[calc((100%-24px)/3)] lg:w-[calc((100%-48px)/5)] desk:w-[calc((100%-60px)/6)]"
    >
      <div className="aspect-[4/3] w-full rounded-xl" style={{ background: TONES[(creator.tone + 2) % TONES.length] }} />
      <span className="-mt-8 rounded-full border-[3px] border-surface">
        <Avatar creator={creator} size="h-12 w-12 text-base" />
      </span>
      <h3 className="w-full truncate font-semibold">{creator.name}</h3>
      <p className="-mt-1.5 w-full truncate text-xs text-muted">
        @{creator.handle} · {compact(creator.fans)} fans
      </p>
      <Link href={`/c/${creator.handle}`} className="mt-1 grid h-9 w-full place-items-center rounded-full border border-border text-sm font-semibold hover:bg-bg">
        View profile
      </Link>
    </article>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-surface">
      <header data-testid="header-video-band" className="relative h-[88svh] overflow-hidden rounded-b-3xl sm:h-[62svh] lg:h-[80svh]">
        <HeaderVideo />
        <LandingNav />
        <a href="#hero" className="absolute bottom-3.5 left-1/2 z-10 grid -translate-x-1/2 justify-items-center text-xs font-medium text-white/85 hover:text-white">
          <span>scroll</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 animate-bounce motion-reduce:animate-none" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
      </header>

      <main>
        <section
          id="hero"
          data-testid="hero"
          className={`${BAND} grid gap-6 py-8 text-center sm:gap-8 sm:py-10 lg:grid-cols-[minmax(0,600px)_minmax(0,820px)] lg:items-center lg:gap-14 lg:py-14 lg:text-left desk:py-16`}
        >
          <div data-testid="hero-text" className="grid gap-4">
            <h1 className="text-[32px] font-extrabold leading-[1.1] sm:text-[44px] lg:text-[52px] desk:text-[60px]">Get closer to the creators you love</h1>
            <p className="text-[15px] text-muted sm:text-lg">Follow for free, unlock exclusive posts and videos, and chat with creators directly.</p>
            <div className="grid gap-2.5 sm:flex sm:justify-center lg:justify-start">
              <Link href="/register" className="grid h-12 place-items-center rounded-full bg-accent px-6 font-semibold text-white hover:bg-text sm:w-[200px]">
                Sign up free
              </Link>
              <Link href="/login" className="grid h-12 place-items-center rounded-full border border-border px-6 font-semibold hover:bg-bg sm:w-[200px]">
                Log in
              </Link>
            </div>
            <p className="text-xs text-muted">18+ only. Free to join.</p>
          </div>
          <div data-testid="hero-pictures" className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:gap-3.5">
            {heroCreators.map((c, i) => (
              <HeroTile key={c.id} creator={c} index={i} />
            ))}
          </div>
        </section>

        <section data-testid="popular" aria-labelledby="popular-title" className={`${BAND} bg-bg py-8 sm:py-10 lg:py-12`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="popular-title" className="text-lg font-bold sm:text-xl lg:text-2xl">Popular creators</h2>
            <Link href="/register" className="text-sm text-muted hover:text-text">
              Sign up to see more ›
            </Link>
          </div>
          <div className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1">
            {popular.map((c) => (
              <CreatorCard key={c.id} creator={c} />
            ))}
          </div>
        </section>

        <section data-testid="how" aria-labelledby="how-title" className={`${BAND} py-8 sm:py-10 lg:py-12`}>
          <h2 id="how-title" className="mb-4 text-lg font-bold sm:text-xl lg:text-2xl">How Side Licks works</h2>
          <ol className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3 rounded-2xl border border-border p-4 sm:flex-col lg:p-6">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent font-bold text-white">{i + 1}</span>
                <span>
                  <b className="block font-semibold sm:text-lg">{s.title}</b>
                  <span className="text-sm text-muted sm:text-[15px]">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section
          data-testid="for-creators"
          aria-labelledby="creators-title"
          className={`${BAND} grid gap-6 bg-text py-10 text-center text-white sm:py-12 lg:grid-cols-2 lg:items-center lg:py-14 lg:text-left`}
        >
          <div className="grid gap-3">
            <h2 id="creators-title" className="text-2xl font-bold sm:text-3xl lg:text-4xl">Are you a creator?</h2>
            <p className="text-white/70 sm:text-lg">Earn from your fans with subscriptions, tips, paid posts and live streams.</p>
            <Link href="/register" className="mt-1 grid h-12 w-full max-w-[260px] place-items-center justify-self-center rounded-full bg-white font-semibold text-text hover:bg-white/90 lg:justify-self-start">
              Become a creator
            </Link>
          </div>
          <ul className="grid gap-3 text-left sm:grid-cols-3 lg:grid-cols-1">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-center gap-3 rounded-2xl bg-white/8 p-3.5 sm:p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15">
                  <Icon name={p.icon} />
                </span>
                <span className="font-medium">{p.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className={`${BAND} grid gap-3 bg-bg py-6 text-sm sm:grid-cols-[1fr_auto] sm:items-center sm:py-8`}>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
          {FOOTER.map((l) => (
            <SoonButton key={l} label={l} className="text-muted hover:text-text hover:underline" />
          ))}
        </nav>
        <span className="font-bold">18+ only</span>
      </footer>
    </div>
  );
}
