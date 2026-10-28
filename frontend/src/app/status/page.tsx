import type { Metadata } from "next";
import ApiStatus from "@/components/ApiStatus";
import LogoSlot from "@/components/LogoSlot";

export const metadata: Metadata = { title: "Setup check - Side Licks" };

// Setup check (step 1): API + database status. Moved from "/" to /status when the main page was built (F121).
export default function StatusPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4 sm:h-16 sm:px-6 lg:px-8">
          <LogoSlot />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-4 px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">Side Licks</h1>
        <p className="max-w-prose text-base text-muted sm:text-lg">
          Project setup is running on localhost. Screens come next, after wireframe approval.
        </p>
        <ApiStatus />
      </main>
    </div>
  );
}
