import { NextResponse } from "next/server";
import { createTournament, getCurrentSessionId } from "@/lib/session-store";
import { EditableCompetitor } from "@/lib/types";

const allowedSizes = new Set([2, 4, 8, 16, 32]);

export async function POST(request: Request) {
  const sessionId = await getCurrentSessionId();

  if (!sessionId) {
    return NextResponse.json({ error: "Start a session first." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    size?: number;
    competitors?: EditableCompetitor[];
  };

  if (!payload.size || !allowedSizes.has(payload.size)) {
    return NextResponse.json({ error: "Bracket size must be 2, 4, 8, 16, or 32." }, { status: 400 });
  }

  if (!payload.competitors || payload.competitors.length !== payload.size) {
    return NextResponse.json({ error: "Competitor count must match the bracket size." }, { status: 400 });
  }

  if (payload.competitors.some((competitor) => !competitor.name.trim())) {
    return NextResponse.json({ error: "Every competitor needs a name." }, { status: 400 });
  }

  const summary = await createTournament(
    sessionId,
    payload.size as 2 | 4 | 8 | 16 | 32,
    payload.competitors,
  );

  return NextResponse.json(summary);
}
