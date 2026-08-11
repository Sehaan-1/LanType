import { cookies } from "next/headers";
import { eq, gt, and } from "drizzle-orm";
import { db } from "@/db";
import { serverConfig, sessions } from "@/db/schema";
import { randomBytes } from "crypto";

export const SESSION_COOKIE = "lanshare_session";
const SESSION_HOURS = 24;

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function ensurePin(): Promise<string> {
  const existing = await db
    .select()
    .from(serverConfig)
    .where(eq(serverConfig.id, 1))
    .limit(1);

  if (existing[0]) {
    return existing[0].pin;
  }

  const pin = generatePin();
  await db.insert(serverConfig).values({ id: 1, pin });
  console.log(`\n🔐 LAN Share PIN: ${pin}\n`);
  return pin;
}

/** True when the request clearly originates from the host machine. */
export function isLocalHostRequest(request: Request): boolean {
  const host = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  ).toLowerCase();
  const hostname = host.split(":")[0];
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "::1"
  ) {
    return true;
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "";
  return ip === "127.0.0.1" || ip === "::1" || ip === ":ffff:127.0.0.1";
}

export async function getPin(): Promise<string> {
  return ensurePin();
}

export async function verifyPin(pin: string): Promise<boolean> {
  const current = await ensurePin();
  return current === pin.trim();
}

export async function createSession(): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  await db.insert(sessions).values({ token, expiresAt });
  return token;
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const rows = await db
    .select()
    .from(sessions)
    .where(
      and(eq(sessions.token, token), gt(sessions.expiresAt, new Date()))
    )
    .limit(1);
  return rows.length > 0;
}

export async function requireAuth(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return isValidSession(token);
}

export async function rotatePin(): Promise<string> {
  const pin = generatePin();
  const existing = await db
    .select()
    .from(serverConfig)
    .where(eq(serverConfig.id, 1))
    .limit(1);

  if (existing[0]) {
    await db
      .update(serverConfig)
      .set({ pin, updatedAt: new Date() })
      .where(eq(serverConfig.id, 1));
  } else {
    await db.insert(serverConfig).values({ id: 1, pin });
  }
  return pin;
}
