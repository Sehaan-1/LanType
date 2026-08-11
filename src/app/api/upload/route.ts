import { NextResponse } from "next/server";
import { db } from "@/db";
import { files } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import {
  UPLOAD_DIR,
  ensureUploadDir,
  uniquePath,
  streamToDisk,
  formatBytes,
} from "@/lib/files";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureUploadDir();
    const form = await request.formData();
    const incoming = form.getAll("files");
    const fileList = incoming.filter((f): f is File => f instanceof File);

    if (fileList.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const saved: Array<{
      id: number;
      originalName: string;
      storedName: string;
      size: number;
      sizeLabel: string;
      mimeType: string | null;
    }> = [];

    for (const file of fileList) {
      if (!file.name || file.size < 0) continue;

      const { fullPath, storedName } = await uniquePath(UPLOAD_DIR, file.name);
      const size = await streamToDisk(file, fullPath);
      const mimeType = file.type || null;

      const [row] = await db
        .insert(files)
        .values({
          originalName: file.name,
          storedName,
          mimeType,
          size,
          uploaderIp: ip,
        })
        .returning();

      console.log(
        `[upload] ${storedName} (${formatBytes(size)}) from ${ip}`
      );

      saved.push({
        id: row.id,
        originalName: row.originalName,
        storedName: row.storedName,
        size: row.size,
        sizeLabel: formatBytes(row.size),
        mimeType: row.mimeType,
      });
    }

    return NextResponse.json({
      ok: true,
      count: saved.length,
      files: saved,
    }, { status: 201 });
  } catch (err) {
    console.error("[upload] error", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
