import { NextResponse } from "next/server";
import { getCurrentSessionId } from "@/lib/session-store";

export async function POST() {
  const sessionId = await getCurrentSessionId();

  if (!sessionId) {
    return NextResponse.json({ error: "No active session." }, { status: 401 });
  }

  return NextResponse.json(
    { error: "Photo uploads are no longer supported in this simplified version." },
    { status: 410 },
  );
}
