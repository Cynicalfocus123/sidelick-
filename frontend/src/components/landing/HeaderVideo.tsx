"use client";

import { useEffect, useState } from "react";

// Header video (F121): poster first; the video only starts when motion is allowed and the connection is not slow / saving data.
// Files made by scripts/make-header-video.mjs (FFmpeg): phone = its own vertical video, tablet + laptop 1280, desktop 1920.
const MEDIA = "/media/header";

type Variant = "portrait-720" | "landscape-1280" | "landscape-1920";

function pickVariant(): Variant {
  if (window.matchMedia("(max-width: 639px)").matches) return "portrait-720";
  return window.matchMedia("(min-width: 1440px)").matches ? "landscape-1920" : "landscape-1280";
}

function videoAllowed() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !(c?.saveData || c?.effectiveType === "slow-2g" || c?.effectiveType === "2g");
}

export default function HeaderVideo() {
  const [variant, setVariant] = useState<Variant | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const update = () => {
      setPlaying(false);
      setVariant(videoAllowed() ? pickVariant() : null);
    };
    update();
    const queries = ["(max-width: 639px)", "(min-width: 1440px)", "(prefers-reduced-motion: reduce)"].map((q) => window.matchMedia(q));
    for (const q of queries) q.addEventListener("change", update);
    return () => {
      for (const q of queries) q.removeEventListener("change", update);
    };
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0 bg-[#1d2430]">
      <picture>
        <source media="(max-width: 639px)" type="image/avif" srcSet={`${MEDIA}/portrait-720.avif`} />
        <source media="(max-width: 639px)" type="image/webp" srcSet={`${MEDIA}/portrait-720.webp`} />
        <source media="(max-width: 1439px)" type="image/avif" srcSet={`${MEDIA}/landscape-1280.avif`} />
        <source media="(max-width: 1439px)" type="image/webp" srcSet={`${MEDIA}/landscape-1280.webp`} />
        <source type="image/avif" srcSet={`${MEDIA}/landscape-1920.avif`} />
        {/* plain <img>: the poster is already sized + encoded by FFmpeg */}
        <img data-testid="header-poster" src={`${MEDIA}/landscape-1920.webp`} alt="" fetchPriority="high" className="h-full w-full object-cover" />
      </picture>
      {variant ? (
        <video
          key={variant}
          data-testid="header-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={`${MEDIA}/${variant}.webp`}
          onPlaying={() => setPlaying(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${playing ? "opacity-100" : "opacity-0"}`}
        >
          <source src={`${MEDIA}/${variant}.webm`} type="video/webm" />
          <source src={`${MEDIA}/${variant}.mp4`} type="video/mp4" />
        </video>
      ) : null}
      {/* darker top for the menu, darker bottom for the scroll hint */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,18,24,.6),rgba(15,18,24,.08)_32%,rgba(15,18,24,.12)_70%,rgba(15,18,24,.5))]" />
    </div>
  );
}
