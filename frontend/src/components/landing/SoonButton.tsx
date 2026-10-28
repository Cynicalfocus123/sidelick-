"use client";

import { soon } from "./LandingNav";

// A link whose page is not built yet: shows the "comes in a later step" toast.
export default function SoonButton({ label, className = "" }: { label: string; className?: string }) {
  return (
    <button type="button" onClick={() => soon(label)} className={className}>
      {label}
    </button>
  );
}
