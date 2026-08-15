"use client";

import { useState, useEffect } from "react";
import OpportunitiesBoard from "@/components/explorer/OpportunitiesBoard";

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        setLoading(true);
        const res = await fetch("/api/opportunities", { cache: "no-store" });
        
        // Prevent crashes by checking response status before parsing JSON
        if (!res.ok) {
          throw new Error(`Server returned status: ${res.status}`);
        }

        const data = await res.json();
        if (data.success && Array.isArray(data.opportunities)) {
          setOpportunities(data.opportunities);
        } else if (Array.isArray(data)) {
          setOpportunities(data);
        }
      } catch (err) {
        console.error("Failed to fetch opportunities:", err);
        setOpportunities([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOpportunities();
  }, []);

  return (
    <div className="relative flex-1 bg-black text-white p-4 sm:p-6 flex flex-col min-h-screen overflow-hidden pt-20 pb-24">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0A0A0A] -z-10" />

      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col pt-4 space-y-8">
        {/* Header Section */}
        <div className="space-y-2 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Work Opportunities
          </h1>
          <p className="text-[13px] text-white/45 max-w-xl leading-relaxed">
            Discover internships, freelance gigs, full-time roles, and bounties
            posted directly by our tech partners and campus startups.
          </p>
        </div>

        {/* Board Wrapper */}
        <div className="flex-1">
          <OpportunitiesBoard opportunities={opportunities} loading={loading} />
        </div>
      </div>
    </div>
  );
}