"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight, Bookmark, Sparkles } from "lucide-react";
import Image from "next/image";
import { formatDate } from "@/lib/dateUtils";

export default function RecommendedEvents({ userEmail, onSelectEvent }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recommendations?email=${encodeURIComponent(userEmail)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError("Could not load recommendations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchRecommendations();
    }
  }, [userEmail]);

  const handleSaveEvent = async (eventId) => {
    try {
      await fetch('/api/events/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          eventId,
          interactionType: 'SAVE'
        })
      });
      // Optionally show a toast or feedback
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewEvent = async (eventId) => {
    // Record view
    try {
      await fetch('/api/events/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          eventId,
          interactionType: 'VIEW'
        })
      });
    } catch (err) {
      console.error(err);
    }
    // Navigate
    onSelectEvent(eventId);
  };

  if (!userEmail) return null;
  if (loading) {
    return (
      <div className="w-full py-8 space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-zinc-900 rounded-lg"></div>
        <div className="flex gap-4 overflow-hidden">
          {[1,2,3].map(i => <div key={i} className="min-w-[300px] h-48 bg-zinc-900 rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white tracking-tight">Recommended For You</h2>
          <p className="text-[12px] text-white/50">Events selected based on your interests and activity.</p>
        </div>
        <button 
          onClick={fetchRecommendations}
          className="text-[11px] font-medium text-white/40 hover:text-white transition-colors self-start mt-1"
        >
          Refresh
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
        {recommendations.map((ev, idx) => (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="snap-start shrink-0 w-[280px] sm:w-[320px] group flex flex-col overflow-hidden bg-[#111111] border border-white/8 hover:border-white/16 shadow-sm rounded-xl transition-all duration-150 cursor-pointer"
            onClick={() => handleViewEvent(ev.id)}
          >
            {/* Banner */}
            <div className="relative h-24 w-full overflow-hidden bg-[#0A0A0A] border-b border-white/6">
              {ev.bannerUrl ? (
                <Image
                  src={ev.bannerUrl}
                  alt={ev.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="object-cover transition-transform duration-300 opacity-80 group-hover:opacity-100"
                />
              ) : (
                <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center p-3 text-center">
                  <span className="font-semibold text-[11px] text-white/50 leading-snug line-clamp-2">
                    {ev.title}
                  </span>
                </div>
              )}
              {/* Badge removed */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleSaveEvent(ev.id); }}
                className="absolute top-2 right-2 p-1 bg-[#111111]/90 backdrop-blur-md rounded-md border border-white/10 text-white/30 hover:text-white transition-colors"
              >
                <Bookmark className="h-3 w-3" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col flex-1 space-y-2">
              <div className="space-y-1">
                <p className="text-[11px] text-[#A855F7] font-medium leading-tight">
                  {ev.recommendationReason}
                </p>
                <h3 className="text-[14px] font-bold text-white group-hover:text-white/80 transition-colors line-clamp-1">
                  {ev.title}
                </h3>
              </div>

              <div className="flex items-center gap-2.5 text-[10px] text-white/40 font-mono mt-auto pt-2 border-t border-white/6">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(ev.date)}</span>
                </div>
                <div className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{ev.location?.split(',')?.[0] || ev.location || "Campus"}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
