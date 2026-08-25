"use client";

import React, { useState, useEffect } from "react";

const GENZ_PHRASES = [
  "Cooking up fresh campus vibes...",
  "Vibe checking the algorithm...",
  "Securing your main character energy...",
  "Dropping the beat...",
  "Uncooking raw experiences...",
  "Warming up the stage...",
  "Connecting to the motherland server...",
  "Baking extra crispy events...",
];

const EMOJI_BURST = ["🔥", "⚡", "🎧", "🚀", "✨", "🍕", "👾", "💯", "🪩"];

/**
 * GenZ-Tailored Interactive Loading Component
 * Features an interactive bouncing avatar, floating particle reactions,
 * pulsing soundwave equalizer, and dynamic GenZ status messages.
 */
export default function GenZLoader({
  fullScreen = true,
  overlay = false,
  size = "md",
  text = null,
  compact = false,
}) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [reactions, setReactions] = useState([]);
  const [hypeScore, setHypeScore] = useState(0);
  const [avatarExpression, setAvatarExpression] = useState("😎");

  // Cycle through GenZ phrases
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % GENZ_PHRASES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  // Handle interactive avatar tap
  const handleAvatarClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.random() * 40 - 20;
    const y = -30 - Math.random() * 20;
    const randomEmoji = EMOJI_BURST[Math.floor(Math.random() * EMOJI_BURST.length)];

    setHypeScore((prev) => prev + 1);
    setAvatarExpression(randomEmoji);

    const newReaction = {
      id: Date.now() + Math.random(),
      emoji: randomEmoji,
      x,
      y,
    };

    setReactions((prev) => [...prev.slice(-10), newReaction]);

    setTimeout(() => {
      setAvatarExpression("😎");
    }, 800);
  };

  // Compact Spinner Version for Inline/Button Loading
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2">
        <div className="relative w-6 h-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#FF2E93]/20 border-t-[#FF2E93] animate-spin" />
          <span className="text-xs animate-bounce">⚡</span>
        </div>
        {text && <span className="text-xs font-semibold text-gray-300">{text}</span>}
      </div>
    );
  }

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0D0E12]/95 backdrop-blur-xl p-4 select-none"
    : overlay
    ? "absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#0D0E12]/80 backdrop-blur-md rounded-2xl p-4 select-none"
    : "flex flex-col items-center justify-center py-12 px-4 w-full select-none";

  return (
    <div className={containerClasses}>
      {/* Background Animated Neon Glow Orbs */}
      <div className="absolute pointer-events-none w-72 h-72 bg-[#FF2E93]/15 rounded-full blur-3xl animate-pulse -z-10" />
      <div className="absolute pointer-events-none w-64 h-64 bg-[#CCFF00]/10 rounded-full blur-3xl animate-pulse delay-700 -z-10" />

      {/* Main Avatar Container */}
      <div className="relative flex flex-col items-center">
        {/* Interactive Floating Reactions */}
        {reactions.map((r) => (
          <span
            key={r.id}
            className="absolute font-bold text-xl pointer-events-none animate-floatUpFade"
            style={{
              transform: `translate(${r.x}px, ${r.y}px)`,
            }}
          >
            {r.emoji}
          </span>
        ))}

        {/* Outer Rotating Cyber Neon Ring */}
        <div className="relative group cursor-pointer" onClick={handleAvatarClick} title="Tap for Vibe Hype!">
          <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-[#FF2E93] via-[#CCFF00] to-[#00F0FF] opacity-75 blur-md group-hover:opacity-100 transition duration-300 animate-spin-slow" />
          
          {/* Avatar Disc */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#161822] border-2 border-[#FF2E93] flex items-center justify-center shadow-[0_0_25px_rgba(255,46,147,0.4)] transition-transform duration-200 group-hover:scale-105 active:scale-95">
            {/* Animated Mascot */}
            <div className="relative flex flex-col items-center justify-center">
              <span className="text-4xl sm:text-5xl animate-bounce transition-transform">
                {avatarExpression}
              </span>
              <span className="absolute -top-2 -right-2 bg-[#CCFF00] text-black text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest shadow-md animate-pulse">
                UNCOOKED
              </span>
            </div>
          </div>

          {/* Interactive Tap Hint */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#FF2E93] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap opacity-90 group-hover:scale-110 transition-transform">
            {hypeScore > 0 ? `🔥 Hype: ${hypeScore}` : "Tap Avatar!"}
          </div>
        </div>

        {/* Audio Equalizer Soundwave Animation */}
        <div className="flex items-center gap-1 mt-6 h-6">
          <div className="w-1.5 bg-[#FF2E93] rounded-full animate-soundwave1" />
          <div className="w-1.5 bg-[#CCFF00] rounded-full animate-soundwave2" />
          <div className="w-1.5 bg-[#00F0FF] rounded-full animate-soundwave3" />
          <div className="w-1.5 bg-[#FF2E93] rounded-full animate-soundwave2" />
          <div className="w-1.5 bg-[#CCFF00] rounded-full animate-soundwave1" />
        </div>

        {/* Dynamic GenZ Status Phrase */}
        <div className="mt-4 text-center max-w-xs">
          <p className="text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF2E93] via-white to-[#CCFF00] animate-fadeIn">
            {text || GENZ_PHRASES[phraseIndex]}
          </p>
          <p className="text-[11px] text-gray-400 mt-1 font-mono tracking-wider uppercase">
            ⚡ Main Character Entrance Loading...
          </p>
        </div>
      </div>
    </div>
  );
}
