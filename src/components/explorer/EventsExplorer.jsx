"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Calendar, MapPin, ArrowRight } from "lucide-react";
import Image from "next/image";
import { LUCKNOW_ZONES } from "@/config/cities";

export default function EventsExplorer({
  events,
  searchQuery,
  onSearchChange,
  onSelectEvent,
  recommendedSection,
}) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeZone, setActiveZone] = useState("All");

  // Extract unique categories/types from events
  const categories = useMemo(() => {
    const set = new Set();
    events.forEach((e) => {
      if (e.type) set.add(e.type);
      if (e.category) set.add(e.category);
    });
    return ["All", ...Array.from(set)];
  }, [events]);

  // Current time captured in state to keep memo pure
  const [now] = useState(() => Date.now());

  const handleHostClick = async () => {
    try {
      const res = await fetch("/api/host/status");
      if (res.status === 401) {
        router.push("/login?callbackUrl=/dashboard/organizer/new");
        return;
      }
      const data = await res.json();
      if (data?.userRole === "SUPER_ADMIN" || data?.userRole === "ORGANIZER" || data?.application?.status === "APPROVED") {
        router.push("/dashboard/organizer/new");
      } else if (data?.application) {
        router.push("/host/status");
      } else {
        router.push("/host/apply");
      }
    } catch {
      router.push("/host/status");
    }
  };

  // Filter and sort events based on search query, category, and zone in real-time
  const filteredEvents = useMemo(() => {
    const list = events.filter((ev) => {
      const matchCategory =
        activeCategory === "All" ||
        ev.type?.toLowerCase() === activeCategory.toLowerCase() ||
        ev.category?.toLowerCase() === activeCategory.toLowerCase();
      const matchZone =
        activeZone === "All" ||
        (ev.zone && ev.zone.toLowerCase() === activeZone.toLowerCase());
      const matchText = searchQuery.toLowerCase().trim();
      const matchSearch =
        !matchText ||
        (ev.title && ev.title.toLowerCase().includes(matchText)) ||
        (ev.type && ev.type.toLowerCase().includes(matchText)) ||
        (ev.category && ev.category.toLowerCase().includes(matchText)) ||
        (ev.description && ev.description.toLowerCase().includes(matchText)) ||
        (ev.location && ev.location.toLowerCase().includes(matchText)) ||
        (ev.zone && ev.zone.toLowerCase().includes(matchText));
      return matchCategory && matchZone && matchSearch;
    });

    // Sort upcoming events first, followed by past events
    return list.sort((a, b) => {
      const timeA = new Date(a.date).getTime() || 0;
      const timeB = new Date(b.date).getTime() || 0;
      const isPastA = timeA < now;
      const isPastB = timeB < now;
      if (isPastA && !isPastB) return 1;
      if (!isPastA && isPastB) return -1;
      return timeA - timeB;
    });
  }, [events, searchQuery, activeCategory, activeZone, now]);

  // Framer Motion staggered transition configurations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 90,
        damping: 15,
      },
    },
  };

  const getTypeStyle = (type) => {
    switch (type.toLowerCase()) {
      case "hackathon":
        return "bg-[#A855F7]/10 text-[#C084FC] border border-[#A855F7]/20";
      case "fest":
        return "bg-pink-500/10 text-pink-400 border border-pink-500/20";
      case "party":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "festive night":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "meetup":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "workshop":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      default:
        return "bg-white/5 text-white/50 border border-white/10";
    }
  };

  return (
    <div className="space-y-6">
      {/* Unified Control Strip */}
      <div className="w-full bg-[#111111] border border-white/8 rounded-xl p-3 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-w-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0 w-full">
          {/* Search Bar */}
          <div className="w-full sm:w-64 md:w-72 relative shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search events, types, keywords..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              suppressHydrationWarning
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg text-[12px] font-medium text-white placeholder-white/30 focus:outline-none focus:border-white/20 pl-8 pr-3 py-1.5 transition-all shadow-inner"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 w-full sm:border-l sm:border-white/6 sm:pl-3 py-0.5">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                suppressHydrationWarning
                className={`flex-shrink-0 px-3 py-1 rounded-full font-semibold text-[12px] transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === category
                    ? "bg-white text-black shadow-sm"
                    : "bg-transparent text-white/50 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 border-t lg:border-t-0 border-white/6 pt-2.5 lg:pt-0">
          {/* Zone Selector */}
          <div className="relative shrink-0">
            <select
              value={activeZone}
              onChange={(e) => setActiveZone(e.target.value)}
              suppressHydrationWarning
              className="appearance-none bg-[#0A0A0A] text-white/60 text-[12px] font-semibold pl-3 pr-8 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-white/20 hover:bg-white/5 transition-all cursor-pointer"
            >
              <option value="All">All Locations</option>
              {LUCKNOW_ZONES.map((zone) => (
                <option key={zone} value={zone} className="bg-[#111111]">
                  {zone}
                </option>
              ))}
            </select>
            {/* Custom Dropdown Arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/30">
              <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
          
          {/* Host Event Button (Secondary) */}
          <button
            onClick={handleHostClick}
            className="btn-secondary whitespace-nowrap text-[12px] shrink-0"
            suppressHydrationWarning={true}
          >
            Host Event
          </button>
        </div>
      </div>

      {/* Recommended Section (Injected dynamically below controls) */}
      {recommendedSection && !searchQuery.trim() && (
        <div className="pt-2 pb-4">
          {recommendedSection}
        </div>
      )}

      {/* Browse Events Section */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white tracking-tight">Browse Events</h2>
          <p className="text-[12px] text-white/50">Explore all upcoming campus events.</p>
        </div>

      {/* Dynamic Grid of Cards */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 text-white/50 bg-[#111111] border border-white/8 rounded-2xl">
          <p className="text-[13px]">No campus events match your query.</p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredEvents.map((ev) => (
            <motion.div
              key={ev.id}
              variants={cardVariants}
              whileHover={{ y: -2 }}
              className="group flex flex-col overflow-hidden bg-[#111111] border border-white/8 hover:border-white/16 rounded-xl transition-all duration-150 min-h-[300px] shadow-sm cursor-pointer"
              onClick={() => onSelectEvent(ev.id)}
            >
              {/* Event Card Banner Preview */}
              <div className="relative h-28 w-full overflow-hidden bg-[#0A0A0A] border-b border-white/6">
                {ev.bannerUrl ? (
                  <Image
                    src={ev.bannerUrl}
                    alt={ev.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center p-4 text-center">
                    <span className="font-bold text-sm text-white/50 leading-snug line-clamp-2">
                      {ev.title}
                    </span>
                  </div>
                )}
                {/* Category Tag overlaid on the banner */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${getTypeStyle(ev.type)}`}
                  >
                    {ev.type}
                  </span>
                  {new Date(ev.date).getTime() < now && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                      Ended
                    </span>
                  )}
                </div>
              </div>

              {/* Card Content Details */}
              <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-mono">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate max-w-[140px]">
                      {ev.zone ? ev.zone : ev.location?.split(",")?.[0] || ev.location || "Campus"}
                    </span>
                  </div>

                  <h3 className="text-[15px] font-bold text-white group-hover:text-white/80 transition-colors duration-150 leading-snug line-clamp-1">
                    {ev.title}
                  </h3>

                  <p className="text-[12px] text-white/45 leading-relaxed line-clamp-2">
                    {ev.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/6 pt-3 mt-auto">
                  <div className="flex items-center gap-1.5 text-white/40 font-mono text-[10px]">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>{ev.date}</span>
                  </div>
                  
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/60 group-hover:text-white transition-colors">
                    Details <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
      </div>
    </div>
  );
}
