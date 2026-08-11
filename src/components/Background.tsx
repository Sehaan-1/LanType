"use client";

import { useEffect, useRef } from "react";

/** Animated gradient mesh + floating orbs background. */
export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      {/* Gradient mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(34,211,238,0.18),transparent),radial-gradient(ellipse_60%_50%_at_80%_50%,rgba(139,92,246,0.18),transparent),radial-gradient(ellipse_60%_50%_at_20%_80%,rgba(236,72,153,0.12),transparent)]" />
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%2260%22_height=%2260%22_viewBox=%220_0_60_60%22%3E%3Cg_fill=%22none%22_stroke=%22%23ffffff%22_stroke-opacity=%220.025%22_stroke-width=%221%22%3E%3Cpath_d=%22M0_0h60v60H0V0z%22/%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
      {/* Floating orbs */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl animate-[float_18s_ease-in-out_infinite]" />
      <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl animate-[float_22s_ease-in-out_infinite_reverse]" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pink-500/15 blur-3xl animate-[float_26s_ease-in-out_infinite]" />
    </div>
  );
}

/** Subtle mouse-follow spotlight. */
export function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!ref.current) return;
      ref.current.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-0 top-0 -z-10 h-96 w-96 rounded-full bg-cyan-400/5 blur-3xl transition-transform duration-700 ease-out"
    />
  );
}
