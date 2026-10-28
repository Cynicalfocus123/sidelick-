"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, type ApiError, type Me } from "@/lib/api";
import { toast } from "@/lib/toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type Errors = Partial<Record<"email" | "password" | "terms" | "general", string>>;

function FieldError({ id, text }: { id: string; text?: string }) {
  return text ? (
    <span id={id} role="alert" className="text-sm text-bad">
      {text}
    </span>
  ) : null;
}

// Register (F10, approved wireframe). Success -> "Check your email" popup (F8).
export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [isAdult, setIsAdult] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);

  const ready = email.trim() !== "" && password !== "" && isAdult && acceptTerms;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address";
    if (password.length < 8) next.password = "Password is too short (at least 8 characters)";
    if (!isAdult || !acceptTerms) next.terms = "Please tick both boxes to continue";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const me = await api<Me>("/auth/register", { method: "POST", body: { email, password, isAdult, acceptTerms } });
      setSentTo(me.email);
    } catch (err) {
      const e2 = err as ApiError;
      setErrors(e2.fields ? { ...e2.fields } : { general: e2.message });
    } finally {
      setBusy(false);
    }
  }

  const input = (bad?: string) =>
    `h-11 w-full rounded-lg border bg-surface px-3 outline-none focus:ring-2 focus:ring-accent/30 ${bad ? "border-bad" : "border-border"}`;

  return (
    <>
      <form noValidate onSubmit={submit} data-testid="register-form" className="grid w-full max-w-[440px] content-start self-start gap-4 sm:self-auto desk:max-w-[480px] sm:rounded-2xl sm:border sm:border-border sm:bg-surface sm:p-8 sm:shadow-sm desk:p-10">
        <h1 className="text-2xl font-semibold sm:text-[28px] desk:text-[32px]">Create your account</h1>

        <button
          type="button"
          onClick={() => setNotice("Google sign-up comes in a later step")}
          className="flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface font-semibold hover:bg-bg"
        >
          <span aria-hidden="true" className="h-4 w-4 rounded-full border-2 border-muted" />
          Continue with Google
        </button>
        {notice ? <p className="text-center text-sm text-muted">{notice}</p> : null}

        <div className="flex items-center gap-3 text-xs text-muted before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">or</div>

        <div className="grid gap-1.5">
          <label htmlFor="reg-email" className="text-sm text-muted">Email</label>
          <input
            id="reg-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby="email-err"
            className={input(errors.email)}
          />
          <FieldError id="email-err" text={errors.email} />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="reg-password" className="text-sm text-muted">Password</label>
          <span className="relative">
            <input
              id="reg-password"
              type={show ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby="password-err"
              className={`${input(errors.password)} pr-16`}
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 px-3 text-sm font-semibold text-muted">
              {show ? "Hide" : "Show"}
            </button>
          </span>
          <span className="text-sm text-muted">At least 8 characters</span>
          <FieldError id="password-err" text={errors.password} />
        </div>

        <label className="flex items-start gap-2.5 text-sm">
          <input type="checkbox" checked={isAdult} onChange={(e) => setIsAdult(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] accent-accent" />
          <span>I am 18 or older</span>
        </label>
        <label className="flex items-start gap-2.5 text-sm">
          <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] accent-accent" />
          <span>
            I agree to the <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>
          </span>
        </label>
        <FieldError id="terms-err" text={errors.terms} />
        <FieldError id="general-err" text={errors.general} />

        <button
          type="submit"
          disabled={!ready || busy}
          className="h-11 rounded-full bg-accent font-semibold text-white disabled:cursor-not-allowed disabled:bg-border disabled:text-muted"
        >
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>

      {sentTo ? <CheckEmailPopup email={sentTo} onEmailChanged={setSentTo} /> : null}
    </>
  );
}

// "Check your email" popup (F8 + F9): Send again = popup closes + toast "Verification email resent" (too soon = toast
// "Please wait N seconds..." and the popup stays), Change email, X = close for this visit -> Home.
function CheckEmailPopup({ email, onEmailChanged }: { email: string; onEmailChanged: (e: string) => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function resend() {
    setBusy(true);
    try {
      await api("/auth/resend-verification", { method: "POST" });
      toast("Verification email resent", "ok"); // the Toaster lives in the root layout, so it stays on screen across the page change
      router.push("/home");
    } catch (e) {
      toast((e as ApiError).message, "bad");
      setBusy(false);
    }
  }

  async function change(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(newEmail.trim())) return setErr("Enter a valid email address");
    setBusy(true);
    setErr("");
    try {
      const me = await api<Me>("/auth/email", { method: "PATCH", body: { email: newEmail } });
      onEmailChanged(me.email);
      setEditing(false);
      toast(`New link sent to ${me.email}`, "ok");
    } catch (e2) {
      const x = e2 as ApiError;
      setErr(x.fields?.email ?? x.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid items-end bg-black/45 sm:place-items-center">
      <div role="dialog" aria-modal="true" aria-label="Check your email" className="relative grid w-full gap-3 rounded-t-3xl bg-surface p-5 pb-7 sm:max-w-[440px] sm:rounded-3xl sm:p-8">
        <button type="button" aria-label="Close" onClick={() => router.push("/home")} className="absolute right-3.5 top-3.5 grid h-8 w-8 place-items-center rounded-full border border-border hover:bg-bg">
          ✕
        </button>
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p>
          We sent a link to: <b data-testid="sent-to">{email}</b>
        </p>
        <p className="text-muted">Check your email inbox to verify and continue. Didn&apos;t receive the email? Please check your spam folder.</p>
        <p className="font-semibold">Haven&apos;t found it?</p>
        <button type="button" disabled={busy} onClick={resend} className="h-11 rounded-full bg-accent font-semibold text-white disabled:opacity-60">
          Send again
        </button>
        {editing ? (
          <form onSubmit={change} className="grid gap-2">
            <label className="grid gap-1.5">
              <span className="text-sm text-muted">New email</span>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="h-11 rounded-lg border border-border px-3" />
            </label>
            {err ? <span role="alert" className="text-sm text-bad">{err}</span> : null}
            <button type="submit" disabled={busy} className="h-10 rounded-full border border-border font-semibold hover:bg-bg">
              Save new email
            </button>
          </form>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="text-center underline">
            Change email
          </button>
        )}
      </div>
    </div>
  );
}
