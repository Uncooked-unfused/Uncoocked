"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Play, Terminal, Zap, Users } from "lucide-react";
import CountUp from "@/components/ui/CountUp";

export default function Hero() {
  const [stats, setStats] = useState({
    eventsCount: 0,
    registrationsCount: 0,
    activeStudents: 0,
    clubsCount: 0,
  });

  useEffect(() => {
    let isMounted = true;
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats && isMounted) {
          setStats({
            eventsCount: data.stats.activeEvents ?? 0,
            registrationsCount: data.stats.registrations ?? 0,
            activeStudents: data.stats.students ?? 0,
            clubsCount: data.stats.clubs ?? 0,
          });
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="relative overflow-hidden w-full py-14 sm:py-20">
      {/* Static subtle grid background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
              className="space-y-5"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold bg-white/5 text-white/60 border border-white/10">
                ⚡ The Event Discovery Platform for Lucknow
              </span>

              <style>{`
                @keyframes gradient-shift {
                  0%, 100% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                }
                .animated-gradient {
                  background-size: 200% auto;
                  animation: gradient-shift 4s ease-in-out infinite;
                }
              `}</style>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.05]">
                Discover{" "}
                <span className="animated-gradient bg-gradient-to-r from-[#A855F7] via-[#C084FC] to-[#A855F7] bg-clip-text text-transparent">
                  Fests
                </span>
                . Attend{" "}
                <span className="animated-gradient bg-gradient-to-r from-[#A855F7] via-[#C084FC] to-[#A855F7] bg-clip-text text-transparent">
                  Parties
                </span>
                . Host{" "}
                <span className="animated-gradient bg-gradient-to-r from-[#A855F7] via-[#C084FC] to-[#A855F7] bg-clip-text text-transparent">
                  Workshops
                </span>
                .
              </h1>

              <p className="text-base sm:text-lg leading-relaxed text-white/55 max-w-2xl mx-auto lg:mx-0">
                Join campus fests, hackathons, startup meetups, and cultural events exclusively in Lucknow. Coordinate in noise-free channels and book tickets instantly.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12, ease: [0, 0, 0.2, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
            >
              <Link
                href="/event"
                className="btn-primary w-full sm:w-auto text-center text-[13px] hover:shadow-[0_0_24px_rgba(168,85,247,0.45)]"
              >
                Explore Events
              </Link>
              <Link
                href="/dashboard"
                className="btn-secondary w-full sm:w-auto text-center text-[13px]"
              >
                Launch Event
              </Link>
            </motion.div>

            {/* Micro Stats Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.24, ease: [0, 0, 0.2, 1] }}
              className="pt-6 border-t border-white/6 flex flex-wrap justify-center lg:justify-start gap-8 text-[12px] font-mono text-white/40"
            >
              <div>
                <span className="block text-white font-bold text-lg tracking-tight">
                  <CountUp end={stats.registrationsCount} />
                </span>
                Registrations
              </div>
              <div className="w-px bg-white/8 self-stretch" />
              <div>
                <span className="block text-white font-bold text-lg tracking-tight">
                  <CountUp end={stats.activeStudents} />
                </span>
                Students Active
              </div>
              <div className="w-px bg-white/8 self-stretch" />
              <div>
                <span className="block text-white font-bold text-lg tracking-tight">
                  <CountUp end={stats.eventsCount} />
                </span>
                Campus Events
              </div>
            </motion.div>
          </div>

          {/* Right Dashboard Card Column */}
          <div className="lg:col-span-5 flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
              className="relative w-full max-w-sm"
            >
              {/* Gentle float */}
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              >
              {/* Subtle background glow — significantly reduced */}
              <div className="absolute inset-0 bg-[#A855F7]/6 rounded-3xl filter blur-2xl -z-10" />

              {/* Main card — solid, no glass */}
              <div className="w-full bg-[#111111] border border-white/8 rounded-2xl p-5 shadow-lg font-mono text-[10px] space-y-4 text-left">
                {/* Header controls bar */}
                <div className="flex justify-between items-center pb-3 border-b border-white/6">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/8" />
                  </div>
                  <span className="text-white/30 font-medium uppercase tracking-widest text-[8px]">
                    CAMPUS_CONSOLE_v1.0
                  </span>
                </div>

                {/* Grid values */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "ACTIVE_STUDENTS", value: stats.activeStudents, suffix: "", badge: "● LIVE", badgeColor: "text-emerald-400", Icon: Users },
                    { label: "UPCOMING_EVENTS", value: stats.eventsCount, suffix: "", badge: "RUNNING", badgeColor: "text-white/40", Icon: Zap },
                    { label: "CLUBS_ACTIVE", value: stats.clubsCount, suffix: "", badge: "ACTIVE", badgeColor: "text-[#C084FC]", Icon: Play },
                    { label: "REGISTRATIONS", value: stats.registrationsCount, suffix: "", badge: "TOTAL", badgeColor: "text-white/40", Icon: Terminal },
                  ].map(({ label, value, suffix, badge, badgeColor, Icon }) => (
                    <div
                      key={label}
                      className="bg-white/4 border border-white/6 rounded-xl p-3.5 space-y-1 hover:border-white/12 transition-colors duration-150"
                    >
                      <div className="flex items-center justify-between text-white/35">
                        <span className="truncate">{label}</span>
                        <Icon className="h-3.5 w-3.5 shrink-0 text-white/25" />
                      </div>
                      <div className="text-base font-bold text-white">
                        <CountUp end={value} />{suffix}{" "}
                        <span className={`text-[8px] font-normal ${badgeColor}`}>
                          {badge}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
