import type { Metadata } from "next";
import HomeView from "@/components/home/HomeView";

export const metadata: Metadata = { title: "Home - Side Licks" };

// Step 1A: home page (approved wireframe layout v3). Sample data until the feed API exists (B110).
export default function HomePage() {
  return <HomeView />;
}
