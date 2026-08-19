"use client";

import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";

export default function CountUp({
  end,
  duration = 1500,
  suffix = "",
  prefix = "",
}) {
  const targetEnd = Number(end) || 0;
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    let startTimestamp = null;
    let animationFrameId = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Use easeOutQuart easing function for smoother deceleration
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOut * targetEnd));
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(targetEnd); // Ensure exact final value
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [targetEnd, duration, isInView]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}
