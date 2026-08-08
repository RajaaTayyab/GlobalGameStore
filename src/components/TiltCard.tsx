"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Max cards of rotation (default 8). */
  intensity?: number;
  /** Hover scale applied alongside the rotation (default 1.02). */
  scale?: number;
  /** Cursor-following sheen overlay (default true). */
  glare?: boolean;
}

/**
 * Mouse-tracking 3D tilt with a soft glare sheen. Transform updates are batched
 * in a single requestAnimationFrame and read/write fresh styles directly on the
 * DOM node (no React re-renders), so it stays smooth even on slower machines.
 *
 * - Disabled automatically on touch devices/coarse pointers and when
 *   `prefers-reduced-motion` is set (falls back to static, still clickable).
 * - `perspective(1000px)` keeps the effect subtle and non-claustrophobic.
 */
export default function TiltCard({
  children,
  className = "",
  intensity = 6,
  scale = 1.02,
  glare = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const enabledRef = useRef(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    enabledRef.current = fine && !reduced;
  }, []);

  const write = useCallback(
    (rx: number, ry: number, mx: number, my: number) => {
      const el = ref.current;
      if (!el) return;
      const settled = rx === 0 && ry === 0;
      el.style.willChange = settled ? "auto" : "transform";
      el.style.transition = settled ? "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)" : "transform 0.06s linear";
      el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)${
        settled ? "" : ` scale(${scale})`
      }`;
      if (glare) {
        const overlay = el.querySelector<HTMLElement>("[data-tilt-glare]");
        if (overlay) {
          overlay.style.opacity = settled ? "0" : "1";
          overlay.style.setProperty("--mx", `${mx}%`);
          overlay.style.setProperty("--my", `${my}%`);
        }
      }
    },
    [glare, scale]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el || !enabledRef.current) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      const rx = -(py - 0.5) * 2 * intensity;
      const ry = (px - 0.5) * 2 * intensity;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        write(rx, ry, px * 100, py * 100);
      });
    },
    [intensity, write]
  );

  const handlePointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el || !enabledRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => write(0, 0, 50, 50));
  }, [write]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative ${className}`}
      style={{ transformStyle: "preserve-3d", transform: "perspective(1000px)" }}
    >
      {children}
      {glare && (
        <div
          data-tilt-glare
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200"
          style={{
            background:
              "radial-gradient(600px circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.07), transparent 40%)",
          }}
        />
      )}
    </div>
  );
}