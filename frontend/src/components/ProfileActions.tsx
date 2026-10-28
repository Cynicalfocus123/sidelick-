"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Me } from "@/lib/api";
import { askToSignUp } from "@/lib/signup-popup";
import { toast } from "@/lib/toast";

// Follow / Subscribe / Message on the creator profile stub. Signed out = sign-up popup (F121); signed in = not built yet.
export default function ProfileActions({ name }: { name: string }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    api<Me>("/auth/me").then(
      () => setSignedIn(true),
      () => setSignedIn(false),
    );
  }, []);

  const act = (label: string, action: string) => () => {
    if (signedIn) toast(`${label} comes in a later step`, "info");
    else askToSignUp(action);
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" disabled={signedIn === null} onClick={act("Follow", `follow ${name}`)} className="h-10 rounded-full bg-accent px-5 font-semibold text-white">
          Follow
        </button>
        <button type="button" disabled={signedIn === null} onClick={act("Subscribe", `subscribe to ${name}`)} className="h-10 rounded-full border border-border px-5 font-semibold">
          Subscribe
        </button>
        <button type="button" disabled={signedIn === null} onClick={act("Messages", `message ${name}`)} className="h-10 rounded-full border border-border px-5 font-semibold">
          Message
        </button>
      </div>
      <Link href={signedIn ? "/home" : "/"} className="justify-self-center text-sm text-muted underline">
        {signedIn ? "Back to Home" : "Back to Side Licks"}
      </Link>
    </div>
  );
}
