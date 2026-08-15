"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, MapPin, ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";

const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? String(d)
    : dt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

const getTypeStyle = (type) => {
  switch (type?.toLowerCase()) {
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

export default function EventMatrixPreview() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await fetch("/api/events?limit=6", { cache: "no-store" });
        const data = await res.json();
        
        if (isMounted) {
          const rawEvents = data.success && Array.isArray(data.events)
            ? data.events
            : Array.isArray(data)
            ? data
            : [];

          if (rawEvents.length > 0) {
            setEvents(
              rawEvents.map((e) => ({
                ...e,
                type: e.type || e.category || "Event",
                desc: e.description || e.desc || "",
                date: fmtDate(e.date),
              }))
            );
          } else {
            // Fallback dataset for guest preview when API returns empty
            setEvents([
              {
                id: "1",
                title: "HackUncooked 2026: 24Hr Hackathon",
                type: "Hackathon",
                date: "Aug 28, 2026",
                location: "BBD University, Lucknow",
                zone: "Main Auditorium",
                desc: "24-hour non-stop building challenge with prizes worth ₹50,000.",
                bannerUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
              },
              {
                id: "2",
                title: "VibeFest: Annual Cultural Night",
                type: "Fest",
                date: "Sep 05, 2026",
                location: "Amity Campus, Lucknow",
                zone: "Open Amphitheatre",
                desc: "Live music performances, dance face-offs, and street food stalls.",
                bannerUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
              },
              {
                id: "3",
                title: "Inter-College E-Sports Arena",
                type: "Party",
                date: "Sep 12, 2026",
                location: "Integral University, Lucknow",
                zone: "Gaming Lounge",
                desc: "Valorant and BGMI tournaments with live casting and swag.",
                bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch events:", err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="py-12 relative w-full border-t border-white/6 bg-[#0d0e12]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-6">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-400">
              <Sparkles className="w-3.5 h-3.5" />
              Event Core
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
              Explore the Event Matrix
            </h2>
            <p className="text-[13px] text-white/45 max-w-lg leading-relaxed">
              A quick glance at the upcoming hackathons, fests, workshops, and
              community drives happening around campus.
            </p>
          </div>

          <Link
            href="/event"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#A855F7] text-white text-[12px] font-semibold hover:bg-[#C084FC] hover:-translate-y-px transition-all duration-150 whitespace-nowrap self-start md:self-auto"
          >
            View all events <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-16 bg-[#111111] border border-white/6 rounded-xl text-[12px] text-white/40 font-mono animate-pulse">
            Loading events matrix...
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-[#111111] border border-white/6 rounded-xl text-[12px] text-red-400/80">
            Failed to load events. Please refresh to try again.
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-[#111111] border border-white/6 rounded-xl text-[12px] text-white/30">
            No upcoming events right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev) => (
              <Link
                key={ev.id}
                href={`/event?id=${ev.id}`}
                className="group flex flex-col overflow-hidden bg-[#111111] border border-white/8 hover:border-purple-500/40 rounded-xl transition-all duration-200 min-h-[300px] shadow-sm cursor-pointer"
              >
                {/* Banner */}
                <div className="relative h-32 w-full overflow-hidden bg-[#0A0A0A] border-b border-white/6">
                  {ev.bannerUrl ? (
                    <Image
                      src={ev.bannerUrl}
                      alt={ev.title}
                      fill
                      unoptimized
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
                  {/* Type tag */}
                  <div className="absolute top-3 left-3 z-10">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${getTypeStyle(
                        ev.type
                      )}`}
                    >
                      {ev.type}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-mono">
                      <MapPin className="h-3 w-3 shrink-0 text-purple-400" />
                      <span className="truncate max-w-[180px]">
                        {ev.zone ? ev.zone : (ev.location || "").split(",")[0]}
                      </span>
                    </div>

                    <h3 className="text-[15px] font-bold text-white group-hover:text-purple-300 transition-colors duration-150 leading-snug line-clamp-1">
                      {ev.title}
                    </h3>

                    <p className="text-[12px] text-white/45 leading-relaxed line-clamp-2">
                      {ev.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/6 pt-3 mt-auto">
                    <div className="flex items-center gap-1.5 text-white/40 font-mono text-[10px]">
                      <Calendar className="h-3 w-3 shrink-0 text-pink-400" />
                      <span>{ev.date}</span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400 group-hover:text-purple-300 transition-colors">
                      Details <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}