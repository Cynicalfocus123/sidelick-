import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Side Licks - Get closer to the creators you love",
  description: "Follow creators for free, unlock exclusive posts and videos, and chat with them directly. 18+ only.",
};

// Step 1C: main page www.sidelicks.com for signed-out visitors (F121). Signed-in visitors are sent to /home by src/proxy.ts.
export default function MainPage() {
  return <LandingPage />;
}
