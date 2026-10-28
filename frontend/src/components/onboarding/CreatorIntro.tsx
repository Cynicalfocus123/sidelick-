"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import LogoSlot from "@/components/LogoSlot";
import Icon, { type IconName } from "@/components/home/Icon";
import { api, type ApiError, type Me } from "@/lib/api";
import { toast } from "@/lib/toast";

// "Become a creator" steps (F117, approved wireframe v2 2026-10-28): one centred column on every size -
// logo space, picture, headline under it, arrows + dots, terms line, Start earning / Close.
// Shown once right after sign-up (and on the first log-in if never seen); also opens from "Become a Creator" in the menu.

type Numbers = {
  topCreatorMonthlyUsd: number | null;
  creatorKeepPctIntro: number | null;
  creatorIntroDays: number | null;
  creatorKeepPct: number | null;
  referralPct: number | null;
};
const NO_NUMBERS: Numbers = { topCreatorMonthlyUsd: null, creatorKeepPctIntro: null, creatorIntroDays: null, creatorKeepPct: null, referralPct: null };
const AUTO_MS = 5000;

const money = (n: number) => (n >= 1000 ? `$${+(n / 1000).toFixed(1)}k` : `$${n}`);

// Numbers must be true (admin settings B15 / B109). Until they are set, the step shows the same idea without a number.
function steps(n: Numbers): { icon: IconName; text: string }[] {
  const { topCreatorMonthlyUsd: top, creatorKeepPctIntro: a, creatorIntroDays: d, creatorKeepPct: b, referralPct: r } = n;
  return [
    { icon: "coins", text: top ? `Top creators earn over ${money(top)} per month` : "Top creators earn real money every month" },
    { icon: "globe", text: "One platform. Built to make creators money" },
    { icon: "coins", text: a && d && b ? `Keep ${a}% for ${d} days after you verify. Then ${b}%` : "Keep more of what you earn" },
    { icon: "chart", text: "Analytics built to grow your income" },
    { icon: "pie", text: r ? `Refer a creator. Earn ${r}% of their income` : "Refer a creator. Earn from their income" },
    { icon: "check", text: "Verified fast. Earning faster" },
  ];
}

export default function CreatorIntro() {
  const router = useRouter();
  const [numbers, setNumbers] = useState<Numbers>(NO_NUMBERS);
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const [busy, setBusy] = useState(false);
  const touchX = useRef<number | null>(null);
  const list = steps(numbers);
  const last = list.length - 1;

  useEffect(() => {
    api<Me>("/auth/me").catch((e: ApiError) => {
      if (e.status === 401) router.replace("/login");
    });
    api<Numbers>("/settings/creator-intro").then(setNumbers, () => {});
  }, [router]);

  // moves by itself every few seconds until the person touches it
  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => setI((x) => (x === last ? 0 : x + 1)), AUTO_MS);
    return () => clearTimeout(t);
  }, [auto, i, last]);

  const go = (to: number) => {
    setAuto(false);
    setI(Math.max(0, Math.min(last, to)));
  };

  async function finish(startEarning: boolean) {
    setBusy(true);
    try {
      await api("/auth/creator-intro-seen", { method: "POST" });
    } catch {}
    if (startEarning) toast("The creator application comes in a later step", "info");
    router.push("/home");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center bg-[radial-gradient(140%_45%_at_50%_0%,color-mix(in_oklab,var(--accent)_14%,transparent),transparent_75%)] px-5 pb-7 pt-4 sm:px-8 sm:pb-10 sm:pt-7 desk:pt-10">
      <main
        aria-label="Become a creator"
        className="flex w-full max-w-[420px] flex-1 flex-col items-center justify-center gap-5 sm:max-w-[480px] sm:gap-6 lg:max-w-[520px] desk:max-w-[560px]"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(i + 1);
          if (e.key === "ArrowLeft") go(i - 1);
        }}
      >
        <div className="mb-auto">
          <LogoSlot />
        </div>

        <section
          data-testid="intro-step"
          aria-roledescription="slide"
          aria-label={`Step ${i + 1} of ${list.length}`}
          className="grid w-full touch-pan-y justify-items-center gap-5 py-4 text-center"
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX;
            setAuto(false);
          }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
            touchX.current = null;
          }}
        >
          <span
            aria-hidden="true"
            className="grid h-[140px] w-[140px] place-items-center rounded-[32px] bg-accent/10 text-accent sm:h-[180px] sm:w-[180px] lg:h-[200px] lg:w-[200px] desk:h-[240px] desk:w-[240px]"
          >
            <Icon name={list[i].icon} className="h-1/2 w-1/2" />
          </span>
          <h1 className="text-[26px] font-extrabold leading-tight sm:text-[34px] lg:text-[38px] desk:text-[42px]" aria-live={auto ? "off" : "polite"}>
            {list[i].text}
          </h1>
        </section>

        <div className="grid w-full grid-cols-[40px_1fr_40px] items-center">
          <button type="button" aria-label="Previous step" onClick={() => go(i - 1)} className={`grid h-10 w-10 place-items-center rounded-full hover:bg-border/60 ${i === 0 ? "invisible" : ""}`}>
            <Icon name="left" />
          </button>
          <div className="flex justify-center gap-1.5">
            {list.map((s, k) => (
              <button
                key={k}
                type="button"
                aria-label={`Go to step ${k + 1}`}
                aria-current={k === i ? "step" : undefined}
                onClick={() => go(k)}
                className={`h-[7px] rounded-full transition-all ${k === i ? "w-[18px] bg-text" : "w-[7px] bg-border"}`}
              />
            ))}
          </div>
          <button type="button" aria-label="Next step" onClick={() => go(i + 1)} className={`grid h-10 w-10 place-items-center rounded-full hover:bg-border/60 ${i === last ? "invisible" : ""}`}>
            <Icon name="right" />
          </button>
        </div>

        <div className="mb-auto grid w-full gap-2.5">
          <p className="text-center text-xs leading-relaxed text-muted">
            By becoming a creator on Side Licks you reconfirm your agreement to our <a href="#" className="underline">Terms &amp; Conditions</a>,{" "}
            <a href="#" className="underline">Acceptable Use Policy</a> and <a href="#" className="underline">Privacy Policy</a>.
          </p>
          <button type="button" disabled={busy} onClick={() => finish(true)} className="h-12 rounded-full bg-text font-semibold text-surface disabled:opacity-60">
            Start earning
          </button>
          <button type="button" disabled={busy} onClick={() => finish(false)} className="h-12 rounded-full bg-border/70 font-semibold hover:bg-border disabled:opacity-60">
            Close
          </button>
        </div>
      </main>
    </div>
  );
}
