"use client";

import { useEffect, useState, useCallback } from "react";

export type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

let listeners: Array<(t: Toast) => void> = [];
let nextId = 1;

export function toast(message: string, variant: ToastVariant = "info") {
  const t = { id: nextId++, message, variant };
  listeners.forEach((l) => l(t));
}

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const onToast = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => remove(t.id), 4000);
    };
    listeners.push(onToast);
    return () => {
      listeners = listeners.filter((l) => l !== onToast);
    };
  }, [remove]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-4 sm:top-auto sm:right-4 sm:left-auto sm:items-end">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl animate-[slideIn_0.3s_ease-out] ${
            t.variant === "success"
              ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
              : t.variant === "error"
                ? "border-rose-400/30 bg-rose-500/15 text-rose-200"
                : "border-cyan-400/30 bg-cyan-500/15 text-cyan-200"
          }`}
        >
          <span className="text-lg">
            {t.variant === "success" ? "✓" : t.variant === "error" ? "✕" : "ℹ"}
          </span>
          <p className="flex-1 text-sm font-medium">{t.message}</p>
          <button
            onClick={() => remove(t.id)}
            className="text-white/60 hover:text-white"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
