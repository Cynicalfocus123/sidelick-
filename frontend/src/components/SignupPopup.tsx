"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/home/Icon";
import { SIGNUP_EVENT } from "@/lib/signup-popup";

// Sign-up popup (F121): following, paying or messaging while signed out opens this instead.
// Bottom sheet on phone, centred box on tablet +. Mounted once in the root layout.
export default function SignupPopup() {
  const [action, setAction] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onAsk = (e: Event) => setAction((e as CustomEvent<string>).detail);
    window.addEventListener(SIGNUP_EVENT, onAsk);
    return () => window.removeEventListener(SIGNUP_EVENT, onAsk);
  }, []);

  useEffect(() => {
    if (!action) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAction(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [action]);

  if (!action) return null;
  return (
    <div onClick={() => setAction(null)} className="fixed inset-0 z-50 grid items-end bg-black/45 sm:place-items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign up to continue"
        onClick={(e) => e.stopPropagation()}
        className="relative grid w-full gap-3 rounded-t-3xl bg-surface p-5 pb-7 text-center sm:max-w-[440px] sm:rounded-3xl sm:p-8"
      >
        <button ref={closeRef} type="button" aria-label="Close" onClick={() => setAction(null)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full hover:bg-bg">
          <Icon name="close" className="h-4.5 w-4.5" />
        </button>
        <h2 className="mt-2 text-2xl font-bold">Sign up to {action}</h2>
        <p className="text-muted">Create a free account to follow creators, unlock posts and send messages.</p>
        <Link href="/register" className="mt-2 grid h-12 place-items-center rounded-full bg-accent font-semibold text-white">
          Sign up free
        </Link>
        <Link href="/login" className="grid h-12 place-items-center rounded-full border border-border font-semibold">
          Log in
        </Link>
        <p className="text-xs text-muted">18+ only. Free to join.</p>
      </div>
    </div>
  );
}
