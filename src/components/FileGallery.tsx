"use client";

import { useMemo, useState } from "react";
import { toast } from "./Toast";

type FileItem = {
  id: number;
  originalName: string;
  storedName: string;
  mimeType: string | null;
  size: number;
  sizeLabel: string;
  uploadedAt: string;
  icon: string;
  isImage: boolean;
  downloadUrl: string;
  previewUrl: string | null;
};

type Props = {
  files: FileItem[];
  onDelete: (id: number) => void;
  loading?: boolean;
};

type Filter = "all" | "images" | "videos" | "docs";
type Sort = "newest" | "oldest" | "largest" | "smallest" | "name";

const FILTERS: { id: Filter; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "📁" },
  { id: "images", label: "Images", icon: "🖼️" },
  { id: "videos", label: "Videos", icon: "🎬" },
  { id: "docs", label: "Docs", icon: "📄" },
];

export default function FileGallery({ files, onDelete, loading }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = files;
    if (filter === "images") list = list.filter((f) => f.isImage);
    else if (filter === "videos") list = list.filter((f) => f.mimeType?.startsWith("video/"));
    else if (filter === "docs")
      list = list.filter(
        (f) => !f.isImage && !f.mimeType?.startsWith("video/")
      );

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((f) => f.originalName.toLowerCase().includes(q));
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "newest":
          return (
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
          );
        case "largest":
          return b.size - a.size;
        case "smallest":
          return a.size - b.size;
        case "name":
          return a.originalName.localeCompare(b.originalName);
      }
    });
    return sorted;
  }, [files, filter, sort, query]);

  async function copyLink(item: FileItem) {
    const url = `${window.location.origin}${item.downloadUrl}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Download link copied", "success");
    } catch {
      toast("Couldn't copy link", "error");
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center rounded-3xl border border-slate-700/60 bg-slate-900/40 p-12 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          Loading shared files…
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/40 p-10 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.06),_transparent_50%)]" />
        <div className="relative">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-800/50 text-4xl">
            📂
          </div>
          <p className="text-lg font-bold text-slate-200">No files yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Drop something above — it'll show up here for everyone on the LAN
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-700/60 bg-slate-900/50 p-1 backdrop-blur">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                filter === f.id
                  ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-200 shadow-inner"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="search"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-900/50 px-3 py-2 pl-9 text-sm text-slate-200 placeholder-slate-500 backdrop-blur focus:border-cyan-500/50 focus:outline-none sm:w-48"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" strokeLinecap="round" />
            </svg>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-xl border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 backdrop-blur focus:border-cyan-500/50 focus:outline-none"
            aria-label="Sort"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="largest">Largest</option>
            <option value="smallest">Smallest</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* Count */}
      <div className="px-1 text-xs font-medium text-slate-500">
        Showing {filtered.length} of {files.length} files
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-8 text-center text-sm text-slate-500">
          No files match your filters
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => (
            <FileCard
              key={f.id}
              file={f}
              onCopy={() => copyLink(f)}
              onDelete={() => onDelete(f.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FileCard({
  file,
  onCopy,
  onDelete,
}: {
  file: FileItem;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const date = file.uploadedAt ? new Date(file.uploadedAt) : null;
  const timeAgo = date ? getTimeAgo(date) : "";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/70 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-cyan-500/30 hover:shadow-cyan-500/10">
      {/* Preview area */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
        {file.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.previewUrl}
            alt={file.originalName}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-5xl drop-shadow-lg">{file.icon}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/90 to-transparent" />
        <div className="absolute right-2 top-2 rounded-lg bg-slate-900/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 backdrop-blur">
          {file.sizeLabel}
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <p
          className="truncate text-sm font-semibold text-slate-100"
          title={file.originalName}
        >
          {file.originalName}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
          <span>{timeAgo}</span>
          {file.mimeType && (
            <>
              <span>·</span>
              <span className="truncate">{file.mimeType.split("/")[1] || file.mimeType}</span>
            </>
          )}
        </p>

        {/* Actions */}
        <div className="mt-3 flex gap-1.5">
          <a
            href={file.downloadUrl}
            download={file.originalName}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/40"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 3v14m0 0l-5-5m5 5l5-5M4 21h16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download
          </a>
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 text-slate-400 transition hover:border-cyan-500/30 hover:text-cyan-300"
            title="Copy link"
            aria-label="Copy link"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete "${file.originalName}"?`)) onDelete();
            }}
            className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 text-slate-400 transition hover:border-rose-500/30 hover:text-rose-300"
            title="Delete"
            aria-label="Delete"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M10 11v6M14 11v6M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export type { FileItem };
