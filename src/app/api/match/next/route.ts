import { NextResponse } from "next/server";
import { advanceTournament, getCurrentSessionId } from "@/lib/session-store";

export async function POST() {
  const sessionId = await getCurrentSessionId();

  if (!sessionId) {
    return NextResponse.json({ error: "No active session." }, { status: 401 });
  }

  try {
    const summary = await advanceTournament(sessionId);
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not advance the match." },
      { status: 400 },
    );
  }
}
