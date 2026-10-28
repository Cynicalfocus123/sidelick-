"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, type ApiError, type Me } from "@/lib/api";
import { toast } from "@/lib/toast";

// Log in (F11, approved wireframe 2026-10-28). States: form / wrong email or password (red box) /
// email not verified yet (yellow box + "Send it again", no session until verified). Success -> Home (Discover first).
export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [keep, setKeep] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState("");
  const [unverified, setUnverified] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const ready = email.trim() !== "" && password !== "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setWrong("");
    setUnverified(null);
    try {
      await api<Me>("/auth/login", { method: "POST", body: { email, password, keepLoggedIn: keep } });
      router.push("/home");
    } catch (err) {
      const x = err as ApiError;
      if (x.code === "unverified") setUnverified(x.email ?? email.trim().toLowerCase());
      else setWrong(x.message);
      setBusy(false);
    }
  }

  async function resend() {
    try {
      const r = await api<{ sentTo: string }>("/auth/login/resend-verification", { method: "POST", body: { email, password } });
      toast(`Verification email sent to ${r.sentTo}`, "ok");
    } catch (err) {
      toast((err as ApiError).message, "bad");
    }
  }

  const input = "h-11 w-full rounded-lg border bg-surface px-3 outline-none focus:ring-2 focus:ring-accent/30";
  const border = wrong ? "border-bad" : "border-border";

  return (
    <form noValidate onSubmit={submit} data-testid="login-form" className="grid w-full max-w-[440px] content-start self-start gap-4 sm:self-auto desk:max-w-[480px] sm:rounded-2xl sm:border sm:border-border sm:bg-surface sm:p-8 sm:shadow-sm desk:p-10">
      <h1 className="text-2xl font-semibold sm:text-[28px] desk:text-[32px]">Welcome back</h1>

      {wrong ? (
        <div role="alert" data-testid="login-wrong" className="rounded-lg border border-red-300 bg-red-100 px-3 py-2.5 text-sm text-red-800">
          {wrong}
        </div>
      ) : null}
      {unverified ? (
        <div role="alert" data-testid="login-unverified" className="grid gap-1 rounded-lg border border-amber-300 bg-amber-100 px-3 py-2.5 text-sm text-amber-900">
          <b>Please verify your email first.</b>
          <span>
            We sent a link to {unverified}.{" "}
            <button type="button" onClick={resend} className="font-bold underline">
              Send it again
            </button>
          </span>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setNotice("Google log-in comes in a later step")}
        className="flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface font-semibold hover:bg-bg"
      >
        <span aria-hidden="true" className="h-4 w-4 rounded-full border-2 border-muted" />
        Continue with Google
      </button>
      {notice ? <p className="text-center text-sm text-muted">{notice}</p> : null}

      <div className="flex items-center gap-3 text-xs text-muted before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">or</div>

      <div className="grid gap-1.5">
        <label htmlFor="login-email" className="text-sm text-muted">Email</label>
        <input id="login-email" type="email" name="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!wrong} className={`${input} ${border}`} />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="login-password" className="text-sm text-muted">Password</label>
        <span className="relative">
          <input
            id="login-password"
            type={show ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!wrong}
            className={`${input} ${border} pr-16`}
          />
          <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 px-3 text-sm font-semibold text-muted">
            {show ? "Hide" : "Show"}
          </button>
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 text-sm">
        <label className="flex items-center gap-2.5">
          <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} className="h-[18px] w-[18px] accent-accent" />
          <span>Keep me logged in</span>
        </label>
        <button type="button" onClick={() => toast("Password reset comes in a later step", "info")} className="font-semibold underline">
          Forgot password?
        </button>
      </div>

      <button type="submit" disabled={!ready || busy} className="h-11 rounded-full bg-accent font-semibold text-white disabled:cursor-not-allowed disabled:bg-border disabled:text-muted">
        {busy ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
