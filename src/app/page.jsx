import Hero from "@/components/home/Hero";
import Metrics from "@/components/home/Metrics";
import EventMatrixPreview from "@/components/home/EventMatrixPreview";
import BulletinFeed from "@/components/home/BulletinFeed";
import OpportunitiesPreview from "@/components/home/OpportunitiesPreview";
import Partners from "@/components/home/Partners";
import CTA from "@/components/home/CTA";
import ReviewSection from "@/components/home/ReviewSection";
import { getHomepageStatsData } from "@/server/controllers/stats/controller";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function Home() {
  const statsData = await getHomepageStatsData();
  const stats = statsData?.stats || {
    students: 6846,
    activeEvents: 8,
    registrations: 2346,
    clubs: 12,
  };

  return (
    <div className="relative isolate overflow-hidden bg-black w-full min-h-screen flex flex-col items-center">
      {/* Visual background grids & lights */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#09090e_1px,transparent_1px),linear-gradient(to_bottom,#09090e_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-70" />
      <div className="absolute inset-0 bg-radial-gradient from-neon-purple/5 via-transparent to-transparent filter blur-3xl opacity-40 -z-10 translate-y-[-10%]" />

      {/* 1. Event Discovery Hero with Live Search */}
      <Hero initialStats={stats} />

      {/* 2. Live Platform Metrics & Traction */}
      <Metrics initialStats={stats} />

      {/* 3. Featured & Trending Events (Immediate Discovery) */}
      <EventMatrixPreview />

      {/* 4. Active Opportunities Board */}
      <OpportunitiesPreview />

      {/* 5. Live Campus Bulletin & Announcements Feed */}
      <BulletinFeed />

      {/* 6. Real Student Reviews & Social Proof */}
      <div className="w-full">
        <ReviewSection />
      </div>

      {/* 7. Organizer & Campus Club Partners */}
      <Partners />

      {/* 8. Conversion CTA Section */}
      <CTA />
    </div>
  );
}