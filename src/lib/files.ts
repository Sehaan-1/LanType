import { mkdir, access, constants } from "fs/promises";
import path from "path";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import type { ReadableStream as NodeReadableStream } from "stream/web";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

/** Strip path components and dangerous characters from a filename. */
export function safeFilename(name: string): string {
  const base = path.basename(name).replace(/[\x00-\x1f\x7f]/g, "");
  const cleaned = base.replace(/[<>:"|?*\\/]/g, "_").trim();
  if (!cleaned || cleaned === "." || cleaned === ".." || /^\.+$/.test(cleaned)) {
    return `file-${Date.now()}`;
  }
  // Cap length while preserving extension
  if (cleaned.length > 200) {
    const ext = path.extname(cleaned).slice(0, 30);
    const stem = path.basename(cleaned, path.extname(cleaned)).slice(0, 160);
    return `${stem}${ext}`;
  }
  return cleaned;
}

/** Return a unique path in folder, auto-renaming collisions like photo (1).jpg */
export async function uniquePath(
  folder: string,
  name: string
): Promise<{ fullPath: string; storedName: string }> {
  const safe = safeFilename(name);
  let candidate = path.join(folder, safe);
  try {
    await access(candidate, constants.F_OK);
  } catch {
    return { fullPath: candidate, storedName: safe };
  }

  const ext = path.extname(safe);
  const stem = path.basename(safe, ext);

  for (let i = 1; i < 10_000; i++) {
    const storedName = `${stem} (${i})${ext}`;
    candidate = path.join(folder, storedName);
    try {
      await access(candidate, constants.F_OK);
    } catch {
      return { fullPath: candidate, storedName };
    }
  }

  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  const storedName = `${stem}-${stamp}${ext}`;
  return { fullPath: path.join(folder, storedName), storedName };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value < 10 && i > 0 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

export function isImageMime(mime: string | null | undefined): boolean {
  return !!mime && mime.startsWith("image/");
}

export function isVideoMime(mime: string | null | undefined): boolean {
  return !!mime && mime.startsWith("video/");
}

export function fileIcon(mime: string | null | undefined, name: string): string {
  if (isImageMime(mime)) return "🖼️";
  if (isVideoMime(mime)) return "🎬";
  if (mime?.startsWith("audio/")) return "🎵";
  if (mime === "application/pdf") return "📄";
  const ext = path.extname(name).toLowerCase();
  if ([".zip", ".rar", ".7z", ".tar", ".gz"].includes(ext)) return "📦";
  if ([".doc", ".docx", ".txt", ".md", ".rtf"].includes(ext)) return "📝";
  if ([".xls", ".xlsx", ".csv"].includes(ext)) return "📊";
  if ([".ppt", ".pptx"].includes(ext)) return "📑";
  return "📁";
}

/** Stream a web File/Blob to disk in chunks without loading into memory. */
export async function streamToDisk(
  file: File,
  destPath: string
): Promise<number> {
  const webStream = file.stream() as unknown as NodeReadableStream;
  const nodeStream = Readable.fromWeb(webStream);
  const writeStream = createWriteStream(destPath);
  await pipeline(nodeStream, writeStream);
  return file.size;
}
