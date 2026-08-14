"use client";

import { useState, useEffect } from "react";
import { Calendar, Users, Send, CheckCircle, Settings, Terminal } from "lucide-react";

export default function DashboardPreview() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.events) && isMounted) {
          setEvents(data.events.slice(0, 2));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const displayEvents = events;

  return (
    <section className="py-12 relative w-full border-t border-white/6">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
        {/* Title */}
        <div className="text-center space-y-2 max-w-lg mx-auto">
          <span className="section-label">Control Panel</span>
          <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
            Student Console Dashboard
          </h2>
          <p className="text-[13px] text-white/45 max-w-md mx-auto leading-relaxed">
            Organizers and students organize events, manage registrations, check
            guest lists, and broadcast announcements from one clean console.
          </p>
        </div>

        {/* Dashboard Mockup */}
        <div className="bg-[#111111] border border-white/8 rounded-xl max-w-5xl mx-auto shadow-sm overflow-hidden">
          {/* Header bar */}
          <div className="flex flex-wrap justify-between items-center px-4 py-3 border-b border-white/6 gap-3 font-mono text-[10px] text-white/35">
            <div className="flex items-center gap-2 text-white/60 font-semibold">
              <Terminal className="h-3.5 w-3.5 text-white/30" />
              <span>STUDENT_CONSOLE_WORKSPACE // DEMO_PREVIEW</span>
            </div>
            <div className="flex items-center gap-4">
              <span>STATUS: READY</span>
              <span>LIVE_SYNC: OK</span>
              <Settings className="h-3 w-3 text-white/25 cursor-pointer hover:text-white/50 transition-colors duration-150" />
            </div>
          </div>

          {/* Main Content */}
          <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            {/* Left column */}
            <div className="lg:col-span-7 space-y-3 flex flex-col">
              {/* Attending Events */}
              <div className="bg-[#0A0A0A] border border-white/6 rounded-xl p-4 space-y-3 flex-1">
                <h3 className="text-[11px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2 border-b border-white/6 pb-2 font-mono">
                  <Calendar className="h-3 w-3 text-white/30" /> Featured Campus Events
                </h3>
                <div className="space-y-2 font-mono text-[11px]">
                  {displayEvents.length === 0 ? (
                    <div className="p-4 text-center text-white/30 text-[10px]">
                      No active campus events listed currently.
                    </div>
                  ) : (
                    displayEvents.map((ev, idx) => (
                      <div key={ev.id || idx} className="flex items-center justify-between p-3 bg-[#111111] border border-white/6 rounded-lg hover:border-white/12 transition-colors duration-150">
                        <div>
                          <span className="block text-[11px] font-semibold text-white/80">{ev.title}</span>
                          <span className="text-[10px] text-white/30 mt-0.5 block">{ev.location} · {new Date(ev.date).toLocaleDateString()}</span>
                        </div>
                        <span className="text-[10px] border px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{ev.status || "Active"}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Registration Management */}
              <div className="bg-[#0A0A0A] border border-white/6 rounded-xl p-4 space-y-3">
                <h3 className="text-[11px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2 border-b border-white/6 pb-2 font-mono">
                  <Users className="h-3 w-3 text-white/30" /> Management Tools
                </h3>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between p-3 bg-[#111111] border border-white/6 rounded-lg hover:border-white/12 transition-colors duration-150">
                    <div>
                      <span className="block text-[11px] font-semibold text-white/80">Organizer Control & QR Check-ins</span>
                      <span className="text-[10px] text-white/30 mt-0.5 block">Scan badges, issue digital passes, track analytics</span>
                    </div>
                    <span className="text-[10px] bg-[#A855F7]/10 text-[#C084FC] border border-[#A855F7]/20 px-2 py-0.5 rounded-full font-semibold">Console</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-5 space-y-3 flex flex-col">
              {/* Feature Highlights */}
              <div className="bg-[#0A0A0A] border border-white/6 rounded-xl p-4 space-y-3 flex-1">
                <h3 className="text-[11px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2 border-b border-white/6 pb-2 font-mono">
                  <Users className="h-3 w-3 text-white/30" /> Attendee Directory Features
                </h3>
                <div className="space-y-2 font-mono text-[10px] text-white/40">
                  <div className="py-1.5 border-b border-white/5 flex justify-between">
                    <span>Verified Email Verification</span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                  <div className="py-1.5 border-b border-white/5 flex justify-between">
                    <span>Department & Club Match</span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span>Live Anti-Scam Shield</span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                </div>
              </div>

              {/* Broadcast Composer */}
              <div className="bg-[#0A0A0A] border border-white/6 rounded-xl p-4 space-y-3 flex-1">
                <h3 className="text-[11px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2 border-b border-white/6 pb-2 font-mono">
                  <Send className="h-3 w-3 text-white/30" /> Broadcast Composer
                </h3>
                <div className="space-y-2 text-[11px] font-mono">
                  <input
                    disabled
                    suppressHydrationWarning={true}
                    placeholder="Title: e.g. Room allocation update"
                    className="block w-full rounded-lg border border-white/8 bg-[#111111] px-3 py-2 text-[10px] text-white/50 placeholder:text-white/20 focus:outline-none"
                  />
                  <textarea
                    disabled
                    rows={2}
                    placeholder="Enter update logs to broadcast to attendees..."
                    className="block w-full rounded-lg border border-white/8 bg-[#111111] px-3 py-2 text-[10px] text-white/50 placeholder:text-white/20 focus:outline-none resize-none"
                  />
                  <button
                    type="button"
                    disabled
                    className="w-full py-2 bg-[#A855F7]/80 text-white text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1.5 opacity-60 cursor-not-allowed"
                  >
                    <CheckCircle className="h-3 w-3" /> Publish Broadcast Log
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
