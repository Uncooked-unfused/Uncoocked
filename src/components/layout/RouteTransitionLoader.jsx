"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function RouteTransitionLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Trigger smooth progress animation on path / params change
  useEffect(() => {
    setLoading(true);
    setProgress(30);

    const timer1 = setTimeout(() => setProgress(70), 100);
    const timer2 = setTimeout(() => setProgress(100), 250);
    const timer3 = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname, searchParams]);

  // Intercept click on standard navigation links to show instant top bar
  useEffect(() => {
    const handleAnchorClick = (e) => {
      const target = e.currentTarget;
      const href = target.getAttribute("href");
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("#") &&
        target.target !== "_blank"
      ) {
        setLoading(true);
        setProgress(40);
      }
    };

    const links = document.querySelectorAll("a[href^='/']");
    links.forEach((link) => link.addEventListener("click", handleAnchorClick));

    return () => {
      links.forEach((link) =>
        link.removeEventListener("click", handleAnchorClick)
      );
    };
  }, [pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div
        className="h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 shadow-[0_0_12px_rgba(168,85,247,0.8)] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
