"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cpu, Layout, Server, Brain, Palette, Briefcase } from "lucide-react";
import CountUp from "@/components/ui/CountUp";

export default function BuilderNetwork() {
  const [studentCount, setStudentCount] = useState(6846);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/stats?_t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats && isMounted) {
          setStudentCount(Number(data.stats.students) || 0);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const leftNodes = [
    { name: "CS & Tech", icon: Layout, color: "text-blue-400/70", desc: "Software, Web, AI" },
    { name: "Engineering", icon: Server, color: "text-emerald-400/70", desc: "Electronics, Mechanical" },
    { name: "Business", icon: Cpu, color: "text-[#C084FC]/70", desc: "Finance & Startups" },
  ];

  const rightNodes = [
    { name: "Liberal Arts", icon: Brain, color: "text-amber-400/70", desc: "Humanities & Media" },
    { name: "Design & Arts", icon: Palette, color: "text-pink-400/70", desc: "UI/UX, Visual & Audio" },
    { name: "Sciences", icon: Briefcase, color: "text-cyan-400/70", desc: "Applied Physics, Bio" },
  ];

  return (
    <section className="py-12 relative w-full border-t border-white/6 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8 text-center relative">
        {/* Title */}
        <div className="space-y-2 max-w-lg mx-auto">
          <span className="section-label">Campus Ecosystem</span>
          <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
            The Unified Network
          </h2>
          <p className="text-[13px] text-white/45 leading-relaxed">
            We connect student attendees across active majors and branches of
            study to help societies discover talent, organize fests, and balance
            event check-ins.
          </p>
        </div>

        {/* Graphical Ecosystem Map */}
        <div className="relative max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 py-4">
          {/* Animated connector lines (desktop only) */}
          <div className="absolute inset-0 hidden md:block pointer-events-none -z-10">
            <svg className="w-full h-full" viewBox="0 0 800 400" fill="none">
              <path id="l1" d="M 180 80 L 400 200" stroke="rgba(168,85,247,0.12)" strokeWidth="1" strokeDasharray="5 8" />
              <path id="l2" d="M 180 200 L 400 200" stroke="rgba(168,85,247,0.12)" strokeWidth="1" strokeDasharray="5 8" />
              <path id="l3" d="M 180 320 L 400 200" stroke="rgba(168,85,247,0.12)" strokeWidth="1" strokeDasharray="5 8" />
              <path id="l4" d="M 620 80 L 400 200" stroke="rgba(168,85,247,0.10)" strokeWidth="1" strokeDasharray="5 8" />
              <path id="l5" d="M 620 200 L 400 200" stroke="rgba(168,85,247,0.10)" strokeWidth="1" strokeDasharray="5 8" />
              <path id="l6" d="M 620 320 L 400 200" stroke="rgba(168,85,247,0.10)" strokeWidth="1" strokeDasharray="5 8" />
            </svg>
            {/* CSS animated dashes */}
            <style>{`
              #l1,#l2,#l3 { animation: dash-left 20s linear infinite; }
              #l4,#l5,#l6 { animation: dash-right 25s linear infinite; }
              @keyframes dash-left  { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -60; } }
              @keyframes dash-right { from { stroke-dashoffset: 0; } to { stroke-dashoffset:  60; } }
            `}</style>
          </div>

          {/* Left Column */}
          <div className="flex flex-col gap-4 w-full md:w-52 text-left z-10">
            {leftNodes.map((node, i) => {
              const Icon = node.icon;
              return (
                <motion.div
                  key={node.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1, ease: [0, 0, 0.2, 1] }}
                  className="bg-[#111111] border border-white/8 rounded-xl p-4 flex items-center gap-3 hover:border-white/16 transition-colors duration-150"
                >
                  <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 ${node.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-white">{node.name}</span>
                    <span className="text-[10px] text-white/35">{node.desc}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Central Hub — very subtle scale pulse */}
          <div className="relative flex items-center justify-center py-6 z-10">
            <motion.div
              animate={{ scale: [1, 1.025, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-28 h-28 rounded-full bg-[#111111] border border-white/12 flex flex-col items-center justify-center text-center select-none shadow-md"
            >
              <span className="text-xl">⚡</span>
              <span className="text-[10px] font-bold tracking-widest text-white uppercase mt-1 leading-none">Campus</span>
              <span className="text-[10px] font-bold tracking-widest text-white uppercase leading-none">Students</span>
              <span className="text-[10px] font-mono font-bold text-[#C084FC] mt-1">
                <CountUp end={studentCount} /> CORE
              </span>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4 w-full md:w-52 text-left md:text-right z-10">
            {rightNodes.map((node, i) => {
              const Icon = node.icon;
              return (
                <motion.div
                  key={node.name}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1, ease: [0, 0, 0.2, 1] }}
                  className="bg-[#111111] border border-white/8 rounded-xl p-4 flex flex-row md:flex-row-reverse items-center gap-3 hover:border-white/16 transition-colors duration-150"
                >
                  <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 ${node.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-white">{node.name}</span>
                    <span className="text-[10px] text-white/35">{node.desc}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
