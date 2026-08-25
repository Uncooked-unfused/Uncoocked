"use client";

import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

const CLEAN_PHRASES = [
  "Cooking up fresh experiences...",
  "Syncing campus event matrix...",
  "Curating upcoming fests & hackathons...",
  "Fetching raw event details...",
];

/**
 * Modern Sleek GenZ Loading Component
 * Premium dark mode glassmorphism with smooth purple-violet glow accents.
 */
export default function GenZLoader({
  fullScreen = true,
  overlay = false,
  size = "md",
  text = null,
  compact = false,
}) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (text) return;
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % CLEAN_PHRASES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [text]);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2.5 text-xs text-white/70">
        <div className="w-4 h-4 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
        {text && <span className="font-medium">{text}</span>}
      </div>
    );
  }

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0D0E12]/95 backdrop-blur-xl p-6 select-none"
    : overlay
    ? "absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#0D0E12]/85 backdrop-blur-md rounded-2xl p-6 select-none"
    : "flex flex-col items-center justify-center py-12 px-6 w-full select-none";

  return (
    <div className={containerClasses}>
      {/* Background Soft Purple Glow */}
      <div className="absolute pointer-events-none w-64 h-64 bg-purple-600/10 rounded-full blur-3xl animate-pulse -z-10" />

      <div className="flex flex-col items-center max-w-xs text-center space-y-4">
        {/* Sleek Pulsing Icon Badge */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-md animate-ping" />
          <div className="relative w-14 h-14 rounded-2xl bg-[#14151C] border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/10">
            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
          </div>
        </div>

        {/* Dynamic Status Text */}
        <div className="space-y-1.5">
          <p className="text-xs font-mono font-bold tracking-widest text-purple-400/80 uppercase">
            UNCOOKED
          </p>
          <p className="text-sm font-semibold text-white/90 tracking-tight transition-opacity duration-300">
            {text || CLEAN_PHRASES[phraseIndex]}
          </p>
        </div>

        {/* Minimal Progress Line */}
        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-1/2 animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
