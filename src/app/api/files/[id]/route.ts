import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createReadStream, existsSync } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { db } from "@/db";
import { files } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/files";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [row] = await db.select().from(files).where(eq(files.id, id)).limit(1);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Prevent path traversal — only serve basename inside UPLOAD_DIR
  const safeName = path.basename(row.storedName);
  const fullPath = path.join(UPLOAD_DIR, safeName);
  if (!fullPath.startsWith(UPLOAD_DIR) || !existsSync(fullPath)) {
    return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
  }

  const url = new URL(request.url);
  const inline = url.searchParams.get("inline") === "1";

  const info = await stat(fullPath);
  const nodeStream = createReadStream(fullPath);
  const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

  const headers = new Headers();
  headers.set(
    "Content-Type",
    row.mimeType || "application/octet-stream"
  );
  headers.set("Content-Length", String(info.size));
  const disposition = inline ? "inline" : "attachment";
  const encoded = encodeURIComponent(row.originalName);
  headers.set(
    "Content-Disposition",
    `${disposition}; filename="${row.originalName.replace(/"/g, "")}"; filename*=UTF-8''${encoded}`
  );
  headers.set("Cache-Control", "private, max-age=3600");

  return new NextResponse(webStream, { status: 200, headers });
}

export async function DELETE(_request: Request, { params }: Params) {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [row] = await db.select().from(files).where(eq(files.id, id)).limit(1);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const safeName = path.basename(row.storedName);
  const fullPath = path.join(UPLOAD_DIR, safeName);

  try {
    const { unlink } = await import("fs/promises");
    if (existsSync(fullPath) && fullPath.startsWith(UPLOAD_DIR)) {
      await unlink(fullPath);
    }
  } catch {
    // continue even if disk delete fails
  }

  await db.delete(files).where(eq(files.id, id));
  return NextResponse.json({ ok: true });
}
