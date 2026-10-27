"use client";

import Link from "next/link";
import { useState } from "react";
import LogoSlot from "@/components/LogoSlot";
import Icon, { type IconName } from "./Icon";

type Item = { label: string; icon: IconName; badge?: number; href?: string };

const MAIN: Item[] = [
  { label: "Home", icon: "home", href: "/home" },
  { label: "Search", icon: "search" },
  { label: "Messages", icon: "messages", badge: 2 },
  { label: "Notifications", icon: "bell", badge: 5 },
];
const MID: Item[] = [
  { label: "Subscriptions", icon: "star" },
  { label: "Wallet", icon: "wallet" },
];
// laptop + desktop list these; phone + tablet put them under "More"
const EXTRA: Item[] = [
  { label: "Following", icon: "users" },
  { label: "My Collection", icon: "bookmark" },
  { label: "Become a Creator", icon: "sparkle" },
  { label: "Promotions", icon: "megaphone" },
  { label: "Refer & Earn", icon: "gift" },
  { label: "Settings", icon: "gear" },
];

function MenuItem({ item, active, onSoon }: { item: Item; active?: boolean; onSoon: (label: string) => void }) {
  const cls = `relative flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[10px] lg:flex-row lg:gap-3 lg:px-3 lg:py-2.5 lg:text-sm ${
    active ? "bg-accent/10 font-semibold text-text" : "text-muted hover:bg-bg hover:text-text"
  }`;
  const inner = (
    <>
      <span className="relative">
        <Icon name={item.icon} className="h-6 w-6 lg:h-5 lg:w-5" />
        {item.badge ? (
          <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-bad px-1 text-[9px] font-bold text-white">
            {item.badge}
          </span>
        ) : null}
      </span>
      <span className="hidden sm:block">{item.label}</span>
    </>
  );
  return item.href ? (
    <Link href={item.href} aria-label={item.label} aria-current={active ? "page" : undefined} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" aria-label={item.label} className={cls} onClick={() => onSoon(item.label)}>
      {inner}
    </button>
  );
}

// LEFT MENU on every size (owner 2026-10-27): phone icon rail, tablet rail with words, laptop/desktop sidebar.
export default function SideMenu({ onSoon }: { onSoon: (label: string) => void }) {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <nav
      aria-label="Main menu"
      data-testid="side-menu"
      className="sticky top-0 z-30 flex h-dvh flex-col items-center gap-1 overflow-y-auto border-r border-border bg-surface px-1.5 py-3 sm:px-2 lg:items-stretch lg:px-3 lg:py-5 desk:px-4"
    >
      <div className="mb-3 hidden lg:block">
        <LogoSlot />
      </div>
      {MAIN.map((it) => (
        <MenuItem key={it.label} item={it} active={it.label === "Home"} onSoon={onSoon} />
      ))}
      <button
        type="button"
        onClick={() => onSoon("Create")}
        aria-label="Create"
        className="my-2 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-white shadow-md hover:opacity-90 lg:flex lg:h-11 lg:w-full lg:items-center lg:justify-center lg:gap-2 lg:rounded-full"
      >
        <Icon name="plus" className="h-6 w-6 lg:h-5 lg:w-5" />
        <span className="hidden font-semibold lg:inline">Create</span>
      </button>
      {MID.map((it) => (
        <MenuItem key={it.label} item={it} onSoon={onSoon} />
      ))}
      <div className="my-2 hidden h-px bg-border lg:block" />
      <div className="hidden lg:contents">
        {EXTRA.map((it) => (
          <MenuItem key={it.label} item={it} onSoon={onSoon} />
        ))}
      </div>
      <div className="flex-1" />
      <div className="w-full lg:hidden">
        <MenuItem item={{ label: "More", icon: "more" }} onSoon={() => setMoreOpen(true)} />
      </div>
      <div className="hidden items-center gap-3 rounded-2xl border border-border p-2.5 lg:flex">
        <span className="h-9 w-9 shrink-0 rounded-full bg-border" />
        <span className="min-w-0 text-sm">
          <span className="block truncate font-semibold">My account</span>
          <span className="block truncate text-xs text-muted">Fan</span>
        </span>
      </div>

      {moreOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-start" onClick={() => setMoreOpen(false)}>
          <div
            role="dialog"
            aria-label="More"
            className="w-full rounded-t-3xl bg-surface p-4 sm:ml-24 sm:w-72 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold">More</span>
              <button type="button" aria-label="Close" onClick={() => setMoreOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-bg">
                <Icon name="close" />
              </button>
            </div>
            {EXTRA.map((it) => (
              <button
                key={it.label}
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  onSoon(it.label);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-bg"
              >
                <Icon name={it.icon} />
                {it.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
