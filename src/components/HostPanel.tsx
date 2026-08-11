"use client";

import { useState } from "react";
import { toast } from "./Toast";

type Props = {
  baseUrl: string;
  lanIp: string;
  qrDataUrl: string | null;
  pin: string | null;
  uploadDir: string;
  totalFiles: number;
  totalBytesLabel: string;
};

export default function HostPanel({
  baseUrl,
  lanIp,
  qrDataUrl,
  pin,
  uploadDir,
  totalFiles,
  totalBytesLabel,
}: Props) {
  const [qrExpanded, setQrExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(baseUrl);
      setCopied(true);
      toast("URL copied", "success");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Couldn't copy", "error");
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/90 to-violet-950/30 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl sm:p-6">
      {/* Decorative gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-violet-500" />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {/* QR Code */}
        {qrDataUrl && (
          <button
            type="button"
            onClick={() => setQrExpanded((v) => !v)}
            className={`group relative mx-auto shrink-0 overflow-hidden rounded-2xl bg-white p-3 shadow-xl shadow-cyan-500/20 ring-1 ring-cyan-400/20 transition hover:scale-105 sm:mx-0 ${
              qrExpanded ? "scale-100" : ""
            }`}
            aria-label="Toggle QR size"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="Scan to open LAN Share"
              className={`transition-all ${qrExpanded ? "h-56 w-56" : "h-36 w-36"}`}
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/0 via-transparent to-violet-500/0 opacity-0 transition group-hover:opacity-100" />
          </button>
        )}

        <div className="min-w-0 flex-1 space-y-4">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
              Live · Scan to join
            </span>
          </div>

          {/* URL */}
          <div>
            <button
              onClick={copyUrl}
              className="group block w-full text-left transition"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300/80">
                Open in browser
              </p>
              <p className="mt-1 break-all font-mono text-base font-bold text-white transition group-hover:text-cyan-300 sm:text-lg">
                {baseUrl}
              </p>
            </button>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" strokeLinecap="round" />
              </svg>
              LAN IP: <span className="font-mono text-slate-300">{lanIp}</span>
            </p>
          </div>

          {/* PIN */}
          {pin && (
            <div className="inline-flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/80">
                PIN
              </span>
              <span className="font-mono text-2xl font-black tracking-[0.3em] text-amber-300 sm:text-3xl">
                {pin}
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-3 py-2 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Files
              </p>
              <p className="mt-0.5 text-lg font-black text-white">
                {totalFiles}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-3 py-2 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Used
              </p>
              <p className="mt-0.5 text-lg font-black text-white">
                {totalBytesLabel}
              </p>
            </div>
          </div>

          {/* Path */}
          <p
            className="truncate text-[10px] text-slate-600"
            title={uploadDir}
          >
            Saving to <span className="font-mono text-slate-400">{uploadDir}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
