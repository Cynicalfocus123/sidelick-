import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfileActions from "@/components/ProfileActions";
import { creatorByHandle, creators } from "@/lib/sample-data";

export const metadata: Metadata = { title: "Creator - Side Licks" };

export function generateStaticParams() {
  return creators.map((c) => ({ handle: c.handle }));
}

// Target of "tap the name = creator profile". The real profile page needs its own wireframe first (rule 6).
export default async function CreatorPage({ params }: PageProps<"/c/[handle]">) {
  const { handle } = await params;
  const creator = creatorByHandle.get(handle);
  if (!creator) notFound();
  return (
    <main className="mx-auto grid max-w-xl gap-4 px-4 py-16 text-center">
      <h1 data-testid="profile-name" className="text-3xl font-semibold">{creator.name}</h1>
      <p className="text-muted">@{creator.handle}</p>
      <p className="text-muted">The creator profile page is built in a later step (wireframe first).</p>
      <ProfileActions name={creator.name} />
    </main>
  );
}
