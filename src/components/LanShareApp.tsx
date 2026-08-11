"use client";

import { useCallback, useEffect, useState } from "react";
import PinGate from "./PinGate";
import UploadZone from "./UploadZone";
import FileGallery, { type FileItem } from "./FileGallery";
import HostPanel from "./HostPanel";
import { ToastHost, toast } from "./Toast";
import { formatBytes } from "@/lib/format";
import Logo from "./Logo";

type ServerInfo = {
  baseUrl: string;
  lanIp: string;
  uploadDir: string;
  qrDataUrl: string;
  pin: string | null;
  isHost?: boolean;
  authenticated: boolean;
  stats: { totalFiles: number; totalBytes: number };
};

export default function LanShareApp() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  const refreshFiles = useCallback(async () => {
    setFilesLoading(true);
    try {
      const res = await fetch("/api/files");
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } finally {
      setFilesLoading(false);
    }
  }, []);

  const refreshInfo = useCallback(async () => {
    const res = await fetch("/api/server-info");
    if (res.ok) {
      const data = (await res.json()) as ServerInfo;
      setInfo(data);
      setAuthed(data.authenticated);
      return data;
    }
    return null;
  }, []);

  useEffect(() => {
    (async () => {
      const data = await refreshInfo();
      if (data?.authenticated) await refreshFiles();
      setChecking(false);
    })();
  }, [refreshInfo, refreshFiles]);

  async function handleAuthed() {
    setAuthed(true);
    await refreshInfo();
    await refreshFiles();
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
      toast("File deleted", "success");
      void refreshInfo();
    } else {
      toast("Couldn't delete", "error");
    }
  }

  if (checking) {
    return <LoadingScreen />;
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:py-12">
        {info?.isHost && info.pin && (
          <HostPanel
            baseUrl={info.baseUrl}
            lanIp={info.lanIp}
            qrDataUrl={info.qrDataUrl}
            pin={info.pin}
            uploadDir={info.uploadDir}
            totalFiles={info.stats.totalFiles}
            totalBytesLabel={formatBytes(info.stats.totalBytes)}
          />
        )}
        <div className="flex justify-center">
          <PinGate
            onSuccess={handleAuthed}
            hostPin={info?.isHost ? info.pin : null}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div className="space-y-6">
          <header className="flex items-center gap-3">
            <Logo size={44} />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                LAN Share
              </h1>
              <p className="text-xs text-slate-400 sm:text-sm">
                Drop files from any device on the Wi‑Fi
              </p>
            </div>
            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                Online
              </span>
            </div>
          </header>

          <section>
            <SectionTitle icon="📤" label="Upload" />
            <UploadZone
              onUploaded={() => {
                void refreshFiles();
                void refreshInfo();
              }}
            />
          </section>

          <section>
            <FileGallery
              files={files}
              onDelete={handleDelete}
              loading={filesLoading}
            />
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {info && (
            <HostPanel
              baseUrl={info.baseUrl}
              lanIp={info.lanIp}
              qrDataUrl={info.qrDataUrl}
              pin={info.pin}
              uploadDir={info.uploadDir}
              totalFiles={info.stats.totalFiles}
              totalBytesLabel={formatBytes(info.stats.totalBytes)}
            />
          )}
          <TipsCard />
        </aside>
      </div>

      <footer className="mt-12 border-t border-slate-800/60 pt-6 text-center text-[11px] text-slate-600">
        Files stay on this machine · Path traversal blocked · Collisions auto-renamed
      </footer>
    </div>
  );
}

function SectionTitle({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 px-1">
      <span className="text-base">{icon}</span>
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </h2>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 animate-pulse rounded-full bg-cyan-500/20 blur-2xl" />
        <Logo size={56} />
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400" />
        <div
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400"
          style={{ animationDelay: "0.1s" }}
        />
        <div
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400"
          style={{ animationDelay: "0.2s" }}
        />
      </div>
    </div>
  );
}

function TipsCard() {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4 backdrop-blur">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
        How to share
      </p>
      <ol className="space-y-2.5 text-sm text-slate-300">
        <Tip n={1} text="Open the URL on any phone or laptop" />
        <Tip n={2} text="Enter the PIN shown on the host" />
        <Tip n={3} text="Drag files in or tap to browse" />
        <Tip n={4} text="Download shared files below" />
      </ol>
    </div>
  );
}

function Tip({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-[10px] font-black text-white shadow-lg shadow-cyan-500/20">
        {n}
      </span>
      <span className="text-slate-300">{text}</span>
    </li>
  );
}
