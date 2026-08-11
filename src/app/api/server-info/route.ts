import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getLanIp, getPublicBaseUrl } from "@/lib/lan";
import { getPin, requireAuth, isLocalHostRequest } from "@/lib/auth";
import { ensureUploadDir, UPLOAD_DIR } from "@/lib/files";
import { db } from "@/db";
import { files } from "@/db/schema";
import { count, sum } from "drizzle-orm";

export async function GET(request: Request) {
  await ensureUploadDir();

  const baseUrl = getPublicBaseUrl(request);
  const lanIp = getLanIp();
  const authed = await requireAuth();
  const isHost = isLocalHostRequest(request);

  const [stats] = await db
    .select({
      totalFiles: count(files.id),
      totalBytes: sum(files.size),
    })
    .from(files);

  const qrDataUrl = await QRCode.toDataURL(baseUrl, {
    margin: 1,
    width: 280,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  // PIN shown to the host machine or any authenticated session
  let pin: string | null = null;
  if (authed || isHost) {
    pin = await getPin();
  }

  return NextResponse.json({
    baseUrl,
    lanIp,
    uploadDir: UPLOAD_DIR,
    qrDataUrl,
    pin,
    isHost,
    authenticated: authed,
    stats: {
      totalFiles: Number(stats?.totalFiles ?? 0),
      totalBytes: Number(stats?.totalBytes ?? 0),
    },
  });
}
