"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MapPin, Sparkles, Cpu, Music, Gamepad2, Wrench, Trophy } from "lucide-react";
import CountUp from "@/components/ui/CountUp";

const CATEGORIES = [
  { id: "all", label: "🔥 All Events", icon: Sparkles },
  { id: "hackathons", label: "💻 Hackathons", icon: Cpu },
  { id: "cultural", label: "🎨 Cultural & Fests", icon: Music },
  { id: "sports", label: "⚽ Sports & Gaming", icon: Gamepad2 },
  { id: "workshops", label: "🚀 Workshops", icon: Wrench },
  { id: "competitions", label: "🏆 Competitions", icon: Trophy },
];

export default function Hero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Dynamic homepage metrics state synced from /api/stats
  const [stats, setStats] = useState({
    eventsCount: 8,
    registrationsCount: 2346,
    activeStudents: 6846,
    clubsCount: 0,
  });

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/stats?_t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats && isMounted) {
          setStats({
            eventsCount: Number(data.stats.activeEvents) || 0,
            registrationsCount: Number(data.stats.registrations) || 0,
            activeStudents: Number(data.stats.students) || 0,
            clubsCount: Number(data.stats.clubs) || 0,
          });
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/event?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/event`);
    }
  };

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    if (catId === "all") {
      router.push(`/event`);
    } else {
      router.push(`/event?category=${encodeURIComponent(catId)}`);
    }
  };

  return (
    <section className="relative overflow-hidden w-full py-14 sm:py-20 border-b border-white/10">
      {/* Background grid & subtle purple glow */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl px-6 lg:px-8 relative z-10 text-center">
        {/* Live Location Pill */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/80 mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>⚡ Live Across Lucknow & Campus Networks</span>
        </motion.div>

        {/* High-Impact Gen Z Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.05]"
        >
          Never Miss What&apos;s Happening <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#A855F7] via-[#C084FC] to-amber-300 bg-clip-text text-transparent">
            On Your Campus.
          </span>
        </motion.h1>

        {/* Concise 1-Sentence Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-base sm:text-lg text-white/60 max-w-2xl mx-auto font-normal leading-relaxed"
        >
          Discover hackathons, campus fests, sports tournaments, and tech workshops around you—no account required to explore.
        </motion.p>

        {/* Interactive Search Bar Widget */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          onSubmit={handleSearchSubmit}
          className="mt-8 max-w-2xl mx-auto bg-zinc-900/90 border border-zinc-700/80 rounded-2xl p-2 shadow-2xl flex flex-col sm:flex-row items-center gap-2 backdrop-blur-md"
        >
          <div className="flex items-center gap-2.5 px-3 py-2 w-full text-zinc-400">
            <Search className="w-5 h-5 text-zinc-400 shrink-0" />
            <input
              type="text"
              placeholder="Search hackathons, fests, workshops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-white placeholder-zinc-500 text-sm focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2 border-t sm:border-t-0 sm:border-l border-zinc-800 w-full sm:w-auto text-zinc-400 text-xs shrink-0">
            <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-zinc-300 font-medium whitespace-nowrap">Lucknow</span>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all shadow-lg shrink-0"
          >
            Find Events
          </button>
        </motion.form>

        {/* Category Pill Filters */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 flex items-center justify-center gap-2 flex-wrap max-w-3xl mx-auto"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-105"
                    : "bg-white/5 text-white/60 hover:text-white border border-white/10 hover:border-white/20"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </motion.div>

        {/* Micro Live Stats Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-10 pt-6 border-t border-white/10 flex flex-wrap justify-center gap-8 text-[12px] font-mono text-white/50"
        >
          <div>
            <span className="block text-white font-bold text-lg tracking-tight">
              <CountUp end={stats.registrationsCount} />
            </span>
            Registrations
          </div>
          <div className="w-px bg-white/10 self-stretch hidden sm:block" />
          <div>
            <span className="block text-white font-bold text-lg tracking-tight">
              <CountUp end={stats.activeStudents} />
            </span>
            Students Active
          </div>
          <div className="w-px bg-white/10 self-stretch hidden sm:block" />
          <div>
            <span className="block text-white font-bold text-lg tracking-tight">
              <CountUp end={stats.eventsCount} />
            </span>
            Campus Events
          </div>
        </motion.div>
      </div>
    </section>
  );
}