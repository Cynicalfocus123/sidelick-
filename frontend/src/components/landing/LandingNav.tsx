"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/home/Icon";
import LogoSlot from "@/components/LogoSlot";
import { toast } from "@/lib/toast";

// Menu on top of the header video (F121).
// Laptop + desktop: all links. Tablet: Login + Signup + menu button (4 links inside). Phone: menu button only (all 6 inside).
const LINKS = ["Features", "Partnership", "About", "Blog"] as const;
export const soon = (label: string) => toast(`${label} comes in a later step`, "info");

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    menuButtonRef.current?.focus();
  };
  const pill = "grid h-9 place-items-center rounded-full border-[1.5px] border-white px-4 text-sm font-semibold lg:h-10 lg:px-5";

  return (
    <>
      <nav aria-label="Main" className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-4 py-3.5 text-white sm:px-8 sm:py-4.5 lg:px-12 lg:py-5 desk:px-20">
        <LogoSlot />
        <div data-testid="nav-links" className="hidden gap-8 text-sm font-semibold lg:flex desk:gap-10 desk:text-[15px]">
          {LINKS.map((l) => (
            <button key={l} type="button" onClick={() => soon(l)} className="hover:opacity-80">
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className={`${pill} hidden hover:bg-white/10 sm:grid`}>
            Login
          </Link>
          <Link href="/register" className={`${pill} hidden bg-white text-[#0f172a] hover:bg-white/90 sm:grid`}>
            Signup
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="landing-menu"
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#0f172a] lg:hidden"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* phone + tablet menu: slides in from the right */}
      <div
        onClick={close}
        className={`fixed inset-0 z-50 bg-black/45 transition-opacity duration-300 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        id="landing-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-y-0 right-0 z-50 grid w-[min(80vw,320px)] content-start gap-1 bg-surface p-5 shadow-[-6px_0_24px_rgba(0,0,0,.25)] transition-transform duration-300 lg:hidden ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <button ref={closeRef} type="button" aria-label="Close menu" onClick={close} className="mb-2 grid h-10 w-10 place-items-center justify-self-end rounded-full hover:bg-bg">
          <Icon name="close" />
        </button>
        {LINKS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => {
              close();
              soon(l);
            }}
            className="rounded-xl px-3 py-3 text-left text-lg font-bold hover:bg-bg"
          >
            {l}
          </button>
        ))}
        <div className="mt-4 grid gap-2.5 sm:hidden">
          <Link href="/login" className="grid h-11 place-items-center rounded-full border border-border font-semibold">
            Login
          </Link>
          <Link href="/register" className="grid h-11 place-items-center rounded-full bg-accent font-semibold text-white">
            Signup
          </Link>
        </div>
      </aside>
    </>
  );
}
