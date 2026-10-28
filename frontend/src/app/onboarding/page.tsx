import type { Metadata } from "next";
import CreatorIntro from "@/components/onboarding/CreatorIntro";

export const metadata: Metadata = { title: "Become a creator - Side Licks" };

// F117: "Become a creator" steps after sign-up (approved wireframe v2 2026-10-28).
export default function OnboardingPage() {
  return <CreatorIntro />;
}
