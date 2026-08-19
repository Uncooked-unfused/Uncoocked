import HomepageStatsManager from "@/components/admin/HomepageStatsManager";

export const metadata = {
  title: "Homepage Metrics & Live Counter Control | Super Admin",
  description: "Configure homepage public metrics, tweak counts, and toggle between real-time database data and custom numbers.",
};

export default function AdminHomepageMetricsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-10 w-full space-y-8">
      <HomepageStatsManager />
    </div>
  );
}
