import type { Metadata } from "next";
import Link from "next/link";
import LogoSlot from "@/components/LogoSlot";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Log in - Side Licks" };

const POINTS = ["Follow creators for free", "Unlock exclusive posts and videos", "Tip and chat with creators directly"];

// Log in (F11) - approved wireframe 2026-10-28: same frame as Register (info panel on laptop + desktop).
export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-3 sm:px-8 sm:py-5">
        <LogoSlot />
        <span className="text-sm text-muted">
          New here?{" "}
          <Link href="/register" className="font-semibold text-text underline">
            Create account
          </Link>
        </span>
      </header>
      <div className="grid flex-1 lg:grid-cols-2 desk:mx-auto desk:w-full desk:max-w-[1600px] desk:grid-cols-[1.1fr_1fr]">
        <aside aria-label="About Side Licks" className="mb-6 ml-6 hidden flex-col justify-center gap-5 rounded-3xl bg-border/40 p-12 lg:flex desk:p-[72px]">
          <h2 className="text-3xl font-semibold desk:text-4xl">Welcome back to Side Licks</h2>
          <p className="text-lg text-muted">Support the creators you love and see what they share.</p>
          <ul className="grid gap-4">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded-full bg-border" />
                {p}
              </li>
            ))}
          </ul>
        </aside>
        <main className="flex justify-center px-4 pb-8 pt-2 sm:items-center sm:px-8 sm:pb-12 sm:pt-6">
          <LoginForm />
        </main>
      </div>
    </div>
  );
}
