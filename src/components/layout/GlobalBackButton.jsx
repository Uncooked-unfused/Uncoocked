"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useBackNavigation } from "@/context/NavigationHistoryContext";

export default function GlobalBackButton() {
  const pathname = usePathname();
  const { goBack, previousPath, historyStack } = useBackNavigation();
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Keyboard shortcut listener: Alt + ArrowLeft
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing inside an input, textarea, or contentEditable element
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput = activeTag === "input" || activeTag === "textarea" || document.activeElement?.isContentEditable;

      if (!isInput && e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goBack]);

  if (!mounted) return null;

  // If on the root page `/` and there is no previous internal history in this session, keep landing pristine
  const isRootWithoutHistory = pathname === "/" && (!historyStack || historyStack.length <= 1);
  if (isRootWithoutHistory) return null;

  return (
    <div
      className="fixed bottom-5 left-5 z-40 sm:bottom-6 sm:left-6 print:hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={() => goBack()}
        aria-label="Navigate to previous page (Alt + Left Arrow)"
        title={previousPath ? `Back to ${previousPath}` : "Back to previous page (Alt + ←)"}
        className="group relative flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-neutral-950/85 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 text-neutral-300 hover:text-white shadow-2xl backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
      >
        <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition-transform duration-200 shrink-0" />
        
        <span className="text-xs font-black tracking-wide uppercase font-mono">
          Back
        </span>

        {/* Keyboard shortcut hint */}
        <span className="hidden md:inline-block text-[10px] font-mono text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 group-hover:border-neutral-700 group-hover:text-neutral-400 transition-colors">
          Alt+←
        </span>

        {/* Subtle glow indicator */}
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500/80 animate-ping opacity-60 pointer-events-none group-hover:opacity-0 transition-opacity" />
      </button>

      {/* Floating Tooltip with Target Hint */}
      {hovered && previousPath && (
        <div className="absolute bottom-full left-0 mb-2 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300 whitespace-nowrap shadow-xl pointer-events-none transition-opacity">
          Return to <span className="text-amber-400 font-bold truncate max-w-[180px] inline-block align-bottom">{previousPath}</span>
        </div>
      )}
    </div>
  );
}
