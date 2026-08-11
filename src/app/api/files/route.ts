import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { files } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { formatBytes, fileIcon, isImageMime } from "@/lib/files";

export async function GET() {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(files)
    .orderBy(desc(files.uploadedAt));

  const list = rows.map((f) => ({
    id: f.id,
    originalName: f.originalName,
    storedName: f.storedName,
    mimeType: f.mimeType,
    size: f.size,
    sizeLabel: formatBytes(f.size),
    uploadedAt: f.uploadedAt,
    icon: fileIcon(f.mimeType, f.originalName),
    isImage: isImageMime(f.mimeType),
    downloadUrl: `/api/files/${f.id}`,
    previewUrl: isImageMime(f.mimeType) ? `/api/files/${f.id}?inline=1` : null,
  }));

  return NextResponse.json({ files: list });
}
