"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fade-up on scroll. Uses the global `animate-fade-up` keyframe (defined in
 * globals.css, with `prefers-reduced-motion` handled there). Fails safe:
 * if IntersectionObserver is missing or hydration is slow, content still
 * becomes visible within 1.5s rather than staying hidden.
 */
export default function Reveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      setShown(true);
      return;
    }
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          if (delayMs > 0) setTimeout(() => setShown(true), delayMs);
          else setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );
    io.observe(el);
    const t = setTimeout(() => setShown(true), 1500);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, [delayMs]);

  return (
    <div
      ref={ref}
      className={
        shown
          ? `animate-fade-up ${className}`
          : `opacity-0 translate-y-3.5 ${className}`
      }
    >
      {children}
    </div>
  );
}
