"use client";

import { useState, useEffect } from "react";
import { Bell, Terminal } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";

export default function BulletinFeed() {
  const [bulletins, setBulletins] = useState([]);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.events) && isMounted) {
          const updates = [];
          data.events.forEach((ev) => {
            if (Array.isArray(ev.bulletinUpdates)) {
              ev.bulletinUpdates.forEach((bu) => {
                updates.push({
                  text: `📢 ${ev.title}: ${bu.title} - ${bu.content}`,
                  time: bu.date || bu.postedAt ? formatDate(bu.postedAt || bu.date) : "Recent",
                });
              });
            }
          });
          if (updates.length > 0) {
            setBulletins(updates);
          } else {
            // Generate clean dynamic updates directly from live events
            const derived = data.events.slice(0, 4).map((ev) => ({
              text: `📢 ${ev.title}: Registrations active for campus students`,
              time: ev.date ? formatDate(ev.date) : "Upcoming",
            }));
            setBulletins(derived);
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const itemsToDisplay = bulletins;

  return (
    <section className="py-12 relative w-full border-t border-white/6">
      <div className="mx-auto max-w-4xl px-6 lg:px-8 space-y-6">
        {/* Title */}
        <div className="text-center space-y-2 max-w-lg mx-auto">
          <span className="section-label">Live Feed</span>
          <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
            Campus Broadcast Bulletins
          </h2>
          <p className="text-[13px] text-white/45 max-w-md mx-auto leading-relaxed">
            Real-time feed of official organizer updates, timeline announcements, and event logs.
          </p>
        </div>

        {/* Bulletin Window */}
        <div className="relative bg-[#111111] border border-white/8 rounded-xl max-w-2xl mx-auto overflow-hidden h-64 flex flex-col shadow-sm">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-white/6 bg-[#111111] z-10">
            <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-white/60">
              <Bell className="h-3.5 w-3.5 text-white/30" />
              <span>LIVE_BULLETINS.LOG</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
          </div>

          {/* Scrolling area */}
          <div className="flex-1 relative overflow-y-auto no-scrollbar p-3 space-y-2">
            {itemsToDisplay.length === 0 ? (
              <div className="text-center py-10 text-[11px] text-white/35 font-mono">
                No active announcements or broadcast logs right now.
              </div>
            ) : (
              itemsToDisplay.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white/3 border border-white/6 rounded-lg px-3 py-2.5 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors duration-150 font-mono text-[11px]"
                >
                  <div className="flex items-center gap-2.5">
                    <Terminal className="h-3 w-3 text-white/25 shrink-0" />
                    <span className="text-white/60 leading-relaxed">{item.text}</span>
                  </div>
                  <span className="text-[10px] text-white/30 shrink-0 font-medium">
                    {item.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
