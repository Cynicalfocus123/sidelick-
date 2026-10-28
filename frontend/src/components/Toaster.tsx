"use client";

import { useEffect, useState } from "react";
import { TOAST_EVENT, TOAST_PENDING_KEY, type ToastItem } from "@/lib/toast";

const ICON: Record<ToastItem["kind"], { bg: string; mark: string }> = {
  ok: { bg: "bg-ok", mark: "✓" },
  bad: { bg: "bg-bad", mark: "!" },
  info: { bg: "bg-sky-600", mark: "i" },
};

// F7: dark rounded box at the top centre, icon + short text, closes itself after about 3 seconds, several stack.
export default function Toaster() {
  const [items, setItems] = useState<(ToastItem & { id: number })[]>([]);

  useEffect(() => {
    const add = (t: ToastItem) => {
      const id = Date.now() + Math.random();
      setItems((all) => [...all, { ...t, id }]);
      setTimeout(() => setItems((all) => all.filter((x) => x.id !== id)), 3000);
    };
    const onEvent = (e: Event) => add((e as CustomEvent<ToastItem>).detail);
    window.addEventListener(TOAST_EVENT, onEvent);
    try {
      const pending = sessionStorage.getItem(TOAST_PENDING_KEY); // toast sent just before a page change
      if (pending) {
        sessionStorage.removeItem(TOAST_PENDING_KEY);
        add(JSON.parse(pending));
      }
    } catch {}
    return () => window.removeEventListener(TOAST_EVENT, onEvent);
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-3 top-3 z-[60] flex flex-col items-center gap-2 sm:inset-x-0">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          data-testid="toast"
          className="flex w-full items-center gap-2.5 rounded-xl bg-text px-4 py-3 text-sm text-white shadow-lg motion-safe:animate-[toast-in_.25s_ease-out] sm:w-auto sm:max-w-md"
        >
          <span aria-hidden="true" className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold ${ICON[t.kind].bg}`}>
            {ICON[t.kind].mark}
          </span>
          {t.text}
        </div>
      ))}
    </div>
  );
}
