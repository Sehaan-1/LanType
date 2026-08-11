"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import Logo from "./Logo";
import { toast } from "./Toast";

type Props = {
  onSuccess: () => void;
  hostPin?: string | null;
};

export default function PinGate({ onSuccess, hostPin }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (pin.length !== 4 || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Incorrect PIN");
        setShake((s) => s + 1);
        setPin("");
        return;
      }
      toast("Unlocked — welcome", "success");
      onSuccess();
    } catch {
      setError("Network error — try again");
      setShake((s) => s + 1);
    } finally {
      setLoading(false);
    }
  }

  function onDigit(d: string) {
    if (pin.length >= 4 || loading) return;
    const next = pin + d;
    setPin(next);
    setError(null);
    if (next.length === 4) {
      // Auto-submit on 4th digit
      setTimeout(() => handleSubmit(), 80);
    }
  }

  function onBackspace() {
    setPin((p) => p.slice(0, -1));
    setError(null);
  }

  // Keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) onDigit(e.key);
      else if (e.key === "Backspace") onBackspace();
      else if (e.key === "Enter") handleSubmit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, loading]);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="w-full max-w-md focus:outline-none"
    >
      <div
        key={shake}
        className={`relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl sm:p-10 ${
          error ? "animate-[shake_0.4s_ease-in-out] border-rose-500/30" : ""
        }`}
      >
        {/* Decorative gradient line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5">
            <Logo size={64} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            LAN Share
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter the 4-digit PIN to access this share
          </p>
          {hostPin && (
            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/70">
                Host PIN
              </p>
              <p className="mt-1 font-mono text-3xl font-black tracking-[0.4em] text-amber-300">
                {hostPin}
              </p>
            </div>
          )}
        </div>

        <div className="mb-6 flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`relative flex h-16 w-14 items-center justify-center overflow-hidden rounded-2xl border-2 text-3xl font-bold transition-all ${
                pin.length === i
                  ? "scale-110 border-cyan-400 bg-slate-800 text-white shadow-lg shadow-cyan-500/40"
                  : pin.length > i
                    ? "border-cyan-500/40 bg-slate-800/60 text-cyan-300"
                    : "border-slate-700/80 bg-slate-900/50 text-slate-700"
              }`}
            >
              {pin[i] && (
                <span className="animate-[pop_0.2s_ease-out]">{pin[i]}</span>
              )}
              {pin.length === i && (
                <span className="absolute inset-y-3 left-1/2 w-0.5 -translate-x-1/2 animate-pulse bg-cyan-400" />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-5 flex items-center justify-center gap-2 text-sm font-medium text-rose-400">
            <span>⚠</span> {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDigit(d)}
              className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/60 py-4 text-xl font-semibold text-white transition hover:border-cyan-500/40 hover:bg-slate-700/80 active:scale-95"
            >
              <span className="relative z-10">{d}</span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-cyan-500/20 to-violet-500/20 transition-transform duration-300 group-hover:translate-x-0" />
            </button>
          ))}
          <button
            type="button"
            onClick={onBackspace}
            className="rounded-2xl border border-slate-700/60 bg-slate-800/30 py-4 text-sm font-medium text-slate-300 transition hover:bg-slate-700/50 active:scale-95"
            aria-label="Backspace"
          >
            ⌫
          </button>
          <button
            type="button"
            onClick={() => onDigit("0")}
            className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/60 py-4 text-xl font-semibold text-white transition hover:border-cyan-500/40 hover:bg-slate-700/80 active:scale-95"
          >
            <span className="relative z-10">0</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-cyan-500/20 to-violet-500/20 transition-transform duration-300 group-hover:translate-x-0" />
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={pin.length !== 4 || loading}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 py-4 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition enabled:hover:shadow-cyan-500/50 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span className="relative z-10 flex items-center justify-center">
              {loading ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                "→"
              )}
            </span>
          </button>
        </div>

        <p className="mt-6 text-center text-[10px] uppercase tracking-widest text-slate-600">
          No accounts · No cloud · Just Wi-Fi
        </p>
      </div>
    </div>
  );
}
