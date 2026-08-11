"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "./Toast";

type UploadedInfo = {
  id: number;
  originalName: string;
  storedName: string;
  sizeLabel: string;
  size: number;
  mimeType: string | null;
};

type Props = {
  onUploaded: (files: UploadedInfo[]) => void;
};

type ProgressState = {
  name: string;
  size: number;
  percent: number;
  status: "uploading" | "done" | "error";
  error?: string;
  preview?: string;
};

export default function UploadZone({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<ProgressState[]>([]);
  const dragCounter = useRef(0);

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      const newItems: ProgressState[] = files.map((f) => ({
        name: f.name,
        size: f.size,
        percent: 0,
        status: "uploading" as const,
        preview:
          f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      }));

      setItems((prev) => [...newItems, ...prev]);
      const saved: UploadedInfo[] = [];
      const baseIndex = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const idx = baseIndex + i;
        try {
          const result = await uploadWithProgress(file, (percent) => {
            setItems((prev) =>
              prev.map((p, i2) => (i2 === idx ? { ...p, percent } : p))
            );
          });
          setItems((prev) =>
            prev.map((p, i2) =>
              i2 === idx ? { ...p, percent: 100, status: "done" } : p
            )
          );
          saved.push(...result);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload failed";
          setItems((prev) =>
            prev.map((p, i2) =>
              i2 === idx ? { ...p, status: "error", error: message } : p
            )
          );
          toast(message, "error");
        }
      }

      if (saved.length > 0) {
        const total = saved.reduce((s, f) => s + f.size, 0);
        const totalLabel = formatBytes(total);
        toast(
          saved.length === 1
            ? `Uploaded ${saved[0].originalName} (${saved[0].sizeLabel})`
            : `Uploaded ${saved.length} files (${totalLabel})`,
          "success"
        );
        onUploaded(saved);
      }

      if (inputRef.current) inputRef.current.value = "";
    },
    [onUploaded]
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files?.length) {
      void uploadFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          dragCounter.current++;
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          dragCounter.current--;
          if (dragCounter.current <= 0) {
            dragCounter.current = 0;
            setDragging(false);
          }
        }}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300 sm:p-10 ${
          dragging
            ? "scale-[1.01] border-cyan-400 bg-cyan-500/10 shadow-2xl shadow-cyan-500/20"
            : "border-slate-700/80 bg-slate-900/40 hover:border-cyan-500/50 hover:bg-slate-900/70 hover:shadow-xl hover:shadow-cyan-500/5"
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
            dragging ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(34,211,238,0.18),_transparent_60%)]" />
        </div>

        <div
          className={`relative transition-transform duration-300 ${
            dragging ? "scale-110" : "group-hover:scale-105"
          }`}
        >
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 text-4xl shadow-inner ring-1 ring-white/5">
            {dragging ? "⬇️" : "📤"}
          </div>
          <p className="text-lg font-bold text-white sm:text-xl">
            {dragging ? "Release to upload" : "Drop files here"}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            or{" "}
            <span className="font-semibold text-cyan-300 underline decoration-cyan-500/30 underline-offset-4">
              browse
            </span>{" "}
            · photos, videos, anything
          </p>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            <span className="rounded bg-slate-800/60 px-2 py-1">multi-select</span>
            <span className="rounded bg-slate-800/60 px-2 py-1">any size</span>
            <span className="rounded bg-slate-800/60 px-2 py-1">streamed</span>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          name="files"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void uploadFiles(e.target.files);
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.slice(0, 6).map((item, idx) => (
            <UploadItemRow key={`${item.name}-${idx}`} item={item} />
          ))}
          {items.length > 6 && (
            <p className="px-1 text-center text-xs text-slate-500">
              +{items.length - 6} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function UploadItemRow({ item }: { item: ProgressState }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-3 backdrop-blur">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-800">
        {item.preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.preview}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-2xl">
            {item.status === "done"
              ? "✓"
              : item.status === "error"
                ? "✕"
                : "📄"}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-slate-200">
            {item.name}
          </p>
          <span
            className={`shrink-0 text-xs font-bold ${
              item.status === "done"
                ? "text-emerald-400"
                : item.status === "error"
                  ? "text-rose-400"
                  : "text-cyan-300"
            }`}
          >
            {item.status === "done"
              ? "Done"
              : item.status === "error"
                ? item.error || "Failed"
                : `${item.percent}%`}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              item.status === "error"
                ? "bg-rose-500"
                : item.status === "done"
                  ? "bg-emerald-400"
                  : "bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500"
            }`}
            style={{ width: `${item.percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function uploadWithProgress(
  file: File,
  onProgress: (percent: number) => void
): Promise<UploadedInfo[]> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("files", file);

    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data.files || []);
        } else {
          reject(new Error(data.error || `HTTP ${xhr.status}`));
        }
      } catch {
        reject(new Error("Invalid server response"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(form);
  });
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / Math.pow(1024, i);
  return `${value < 10 && i > 0 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}
