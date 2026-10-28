"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LogoSlot from "@/components/LogoSlot";
import { liveNow } from "@/lib/sample-data";
import DiscoverFeed from "./DiscoverFeed";
import Icon from "./Icon";
import { ArrowButton, Avatar, CreatorLink } from "./parts";
import SideMenu from "./SideMenu";
import SubscribedFeed from "./SubscribedFeed";

type Tab = "discover" | "subscribed";
const FOLLOW_KEY = "sl-sample-following"; // sample only, until accounts exist (B25)

function Tabs({ tab, setTab, wide = false }: { tab: Tab; setTab: (t: Tab) => void; wide?: boolean }) {
  return (
    <div role="tablist" aria-label="Feed" className={`flex gap-1 rounded-full border border-border bg-surface p-1 ${wide ? "w-full" : ""}`}>
      {(["discover", "subscribed"] as const).map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={tab === t}
          onClick={() => setTab(t)}
          className={`h-9 rounded-full px-5 text-sm font-semibold sm:min-w-28 ${wide ? "flex-1" : ""} ${tab === t ? "bg-accent text-white" : "text-muted hover:text-text"}`}
        >
          {t === "discover" ? "Discover" : "Subscribed"}
        </button>
      ))}
    </div>
  );
}

// Live now: 5 rings at a time on every size (owner 2026-10-28). Arrows / swipe move to the next 5.
const LIVE_PER_VIEW = 5;

function LiveRings() {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(liveNow.length <= LIVE_PER_VIEW);
  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 4);
    setAtEnd(el.scrollLeft + el.clientWidth > el.scrollWidth - 4);
  };
  const by = (d: 1 | -1) => ref.current?.scrollBy({ left: d * ref.current.clientWidth, behavior: "smooth" });
  return (
    <section data-testid="live-now" className="grid min-w-0 gap-3 rounded-2xl border border-border bg-surface p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold sm:text-lg">Live now</h2>
        <div className="flex gap-2">
          <ArrowButton dir="left" label="Scroll live left" onClick={() => by(-1)} disabled={atStart} />
          <ArrowButton dir="right" label="Scroll live right" onClick={() => by(1)} disabled={atEnd} />
        </div>
      </div>
      <div ref={ref} onScroll={onScroll} data-testid="live-track" className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto pb-1 pt-1.5">
        {liveNow.map(({ creator, viewers }) => (
          <CreatorLink
            key={creator.id}
            creator={creator}
            className="grid w-1/5 shrink-0 snap-start justify-items-center gap-1 px-1 text-center text-[10px] leading-tight text-muted sm:text-[11px]"
          >
            <span className="relative">
              <Avatar creator={creator} size="h-[50px] w-[50px] sm:h-[68px] sm:w-[68px] lg:h-[80px] lg:w-[80px] desk:h-[92px] desk:w-[92px] text-lg" ring="ring-[3px] ring-bad ring-offset-2 ring-offset-surface" />
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded bg-bad px-1 text-[9px] font-bold text-white">LIVE</span>
            </span>
            <span className="mt-1 w-full truncate">
              <b className="font-semibold text-text">{creator.name.split(" ")[0]}</b>
              <span className="hidden sm:block">{viewers} watching</span>
              <span className="flex items-center justify-center gap-0.5 sm:hidden" aria-label={`${viewers} watching`}>
                <Icon name="eye" className="h-3 w-3" />
                {viewers}
              </span>
            </span>
          </CreatorLink>
        ))}
      </div>
    </section>
  );
}

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 2);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  if (!show) return null;
  return (
    <button
      type="button"
      aria-label="Back to top"
      data-testid="back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-4 right-4 z-40 grid h-12 w-12 place-items-center rounded-full border border-border bg-surface shadow-lg hover:bg-bg sm:bottom-6 sm:right-6"
    >
      <Icon name="up" />
    </button>
  );
}

// Home: left menu + top bar (Discover / Subscribed) + live rings + the selected feed.
export default function HomeView() {
  const [tab, setTabState] = useState<Tab>("discover"); // Discover opens first on every visit
  const [following, setFollowing] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FOLLOW_KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the browser after hydration
      if (Array.isArray(saved) && saved.length) setFollowing(new Set(saved));
    } catch {}
  }, []);

  const setTab = (t: Tab) => {
    setTabState(t);
    window.scrollTo({ top: 0 });
  };

  const toggleFollow = useCallback((id: string) => {
    setFollowing((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(FOLLOW_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  const soon = useCallback((label: string) => {
    setToast(`${label} comes in a later step`);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  return (
    <div className="grid min-h-dvh grid-cols-[60px_minmax(0,1fr)] sm:grid-cols-[88px_minmax(0,1fr)] lg:grid-cols-[232px_minmax(0,1fr)] desk:grid-cols-[264px_minmax(0,1fr)]">
      <SideMenu onSoon={soon} />
      <div className="min-w-0 pb-8">
        <header data-testid="top-bar" className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-surface/95 px-2.5 backdrop-blur sm:h-16 sm:px-5 lg:px-7 desk:h-[68px] desk:px-9">
          <div className="lg:hidden">
            <LogoSlot />
          </div>
          <div className="flex-1" />
          <div className="hidden sm:block">
            <Tabs tab={tab} setTab={setTab} />
          </div>
          <div className="flex-1" />
          <button type="button" onClick={() => soon("Wallet")} className="h-9 rounded-full border border-ok/40 bg-ok/10 px-3 text-sm font-bold text-ok">
            $0.00
          </button>
          <button type="button" aria-label="My account" onClick={() => soon("Account")} className="relative h-9 w-9 shrink-0 rounded-full bg-border">
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-surface bg-ok" />
          </button>
        </header>

        <main className="mx-auto grid max-w-[1440px] gap-3.5 px-2.5 pt-2 sm:gap-4.5 sm:px-5 sm:pt-5 lg:gap-5 lg:px-7 desk:gap-6 desk:px-9">
          <div className="sm:hidden">
            <Tabs tab={tab} setTab={setTab} wide />
          </div>
          <LiveRings />
          {tab === "discover" ? (
            <DiscoverFeed followingIds={following} onFollow={toggleFollow} onSubscribedTab={() => setTab("subscribed")} />
          ) : (
            <SubscribedFeed followingIds={following} onFollow={toggleFollow} onDiscover={() => setTab("discover")} onSoon={soon} />
          )}
        </main>
      </div>
      <BackToTop />
      {toast ? (
        <div role="status" className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-text px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
