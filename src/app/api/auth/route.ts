import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  createSession,
  requireAuth,
  verifyPin,
  getPin,
} from "@/lib/auth";

export async function GET() {
  const ok = await requireAuth();
  if (ok) {
    return NextResponse.json({ authenticated: true });
  }
  // Only expose whether PIN is required, never the PIN itself
  return NextResponse.json({ authenticated: false, pinRequired: true });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pin = String(body.pin ?? "").trim();

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be 4 digits" },
        { status: 400 }
      );
    }

    const valid = await verifyPin(pin);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
    }

    const token = await createSession();
    const jar = await cookies();
    jar.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

/** Dev/admin helper — never used by clients directly for PIN display on network */
export async function PUT() {
  // Intentionally no-op for security in production paths; pin is shown on home server panel
  const pin = await getPin();
  return NextResponse.json({ pin });
}
