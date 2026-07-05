import { NextResponse } from "next/server";
import { clearSessionCookie, endSession, getCurrentSessionId } from "@/lib/session-store";

export async function POST() {
  const sessionId = await getCurrentSessionId();

  if (sessionId) {
    await endSession(sessionId).catch(() => undefined);
  }

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
